const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const db = require('../database/db');

const DEFAULT_CATEGORIES = [
  { name: 'Alimentação', color: '#f97316' },
  { name: 'Cuidados Pessoais', color: '#ec4899' },
  { name: 'Educação', color: '#06b6d4' },
  { name: 'Lazer', color: '#ec4899' },
  { name: 'Moradia', color: '#8b5cf6' },
  { name: 'Outros', color: '#6b7280' },
  { name: 'Salário', color: '#22c55e' },
  { name: 'Saúde', color: '#ef4444' },
  { name: 'Transporte', color: '#3b82f6' },
];

function signToken(userId, username) {
  return jwt.sign({ userId, username }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

exports.register = (req, res) => {
  const { username, password, name, email } = req.body;
  if (!username || !password || !name || !email) {
    return res.status(400).json({ error: 'Nome, username, e-mail e senha são obrigatórios' });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: 'Username deve ter pelo menos 3 caracteres' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
  }

  const existingUsername = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(username);
  if (existingUsername) {
    return res.status(409).json({ error: 'Este usuário já está em uso' });
  }

  const existingEmail = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  if (existingEmail) {
    return res.status(409).json({ error: 'Este e-mail já está cadastrado' });
  }

  const hash = bcrypt.hashSync(password, 12);
  db.prepare('INSERT INTO users (username, password, name, email, approved) VALUES (?, ?, ?, ?, 0)')
    .run(username, hash, name || null, email || null);

  res.status(201).json({ message: 'Cadastro realizado! Aguarde a aprovação do administrador para acessar o sistema.' });
};

exports.googleAuth = async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Token do Google não fornecido' });
  }

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find by google_id first, then by email
    let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);

    if (!user && email) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (user) {
        db.prepare('UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?').run(googleId, picture || null, user.id);
      }
    }

    if (!user) {
      return res.status(403).json({ error: 'Conta não encontrada. Entre em contato com o administrador.' });
    }

    // Save email and avatar on every login
    db.prepare('UPDATE users SET email = COALESCE(email, ?), avatar_url = ? WHERE id = ?')
      .run(email || null, picture || null, user.id);

    // Promote to admin if this is the known admin email
    const adminEmail = process.env.ADMIN_EMAIL || 'jeffbonis@gmail.com';
    if (email === adminEmail && !user.is_admin) {
      db.prepare('UPDATE users SET is_admin = 1, expires_at = NULL, approved = 1 WHERE id = ?').run(user.id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    }

    if (!user.is_admin && !user.approved) {
      return res.status(403).json({ error: 'Acesso pendente. Aguarde a aprovação do administrador.' });
    }

    if (!user.is_admin && user.expires_at && new Date(user.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Conta expirada. Entre em contato com o administrador.' });
    }

    const token = signToken(user.id, user.username);
    res.json({ token, user: { id: user.id, username: user.username, name: user.name || null, avatar_url: user.avatar_url || picture || null, is_admin: !!user.is_admin, plan: user.plan || 'free' } });
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(401).json({ error: 'Falha ao autenticar com Google' });
  }
};

exports.me = (req, res) => {
  const user = db.prepare('SELECT id, username, name, email, is_admin, avatar_url, plan FROM users WHERE id = ?').get(req.user.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json({ id: user.id, username: user.username, name: user.name || null, email: user.email || null, is_admin: !!user.is_admin, avatar_url: user.avatar_url || null, plan: user.plan || 'free' });
};

exports.updateProfile = (req, res) => {
  const { userId } = req.user;
  const { name, email } = req.body;

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  if (email) {
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?').get(email, userId);
    if (existing) return res.status(409).json({ error: 'Este e-mail já está em uso por outro usuário' });
  }

  db.prepare('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?').run(name || null, email || null, userId);

  const updated = db.prepare('SELECT id, username, name, email, is_admin, avatar_url, plan FROM users WHERE id = ?').get(userId);
  res.json({ id: updated.id, username: updated.username, name: updated.name, email: updated.email, is_admin: !!updated.is_admin, avatar_url: updated.avatar_url, plan: updated.plan || 'free' });
};

exports.login = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário/e-mail e senha são obrigatórios' });
  }

  const user = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR email = ?').get(username, username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Usuário/e-mail ou senha incorretos' });
  }

  if (!user.is_admin && !user.approved) {
    return res.status(403).json({ error: 'Acesso pendente. Aguarde a aprovação do administrador.' });
  }

  if (!user.is_admin && user.expires_at && new Date(user.expires_at) < new Date()) {
    return res.status(401).json({ error: 'Conta expirada. Entre em contato com o administrador.' });
  }

  const token = signToken(user.id, user.username);
  res.json({ token, user: { id: user.id, username: user.username, name: user.name || null, is_admin: !!user.is_admin, plan: user.plan || 'free' } });
};
