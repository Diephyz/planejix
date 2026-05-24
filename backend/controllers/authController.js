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
  const { username, password, name } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username e senha são obrigatórios' });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: 'Username deve ter pelo menos 3 caracteres' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Username já está em uso' });
  }

  const hash = bcrypt.hashSync(password, 12);
  const result = db.prepare('INSERT INTO users (username, password, name) VALUES (?, ?, ?)').run(username, hash, name || null);
  const userId = result.lastInsertRowid;

  const insertCategory = db.prepare('INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)');
  db.exec('BEGIN');
  try {
    for (const cat of DEFAULT_CATEGORIES) {
      insertCategory.run(userId, cat.name, cat.color);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const token = signToken(userId, username);
  res.status(201).json({ token, user: { id: userId, username, name: name || null } });
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
    const { sub: googleId, email, name } = payload;

    // Find by google_id first, then by email
    let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);

    if (!user && email) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (user) {
        db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(googleId, user.id);
      }
    }

    if (!user) {
      // Create new user from Google account
      const baseUsername = (name || email.split('@')[0]).replace(/\s+/g, '').toLowerCase();
      const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(baseUsername);
      const username = existing
        ? baseUsername + '_' + crypto.randomBytes(2).toString('hex')
        : baseUsername;

      const fakePassword = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 4);
      const result = db
        .prepare('INSERT INTO users (username, password, google_id, email) VALUES (?, ?, ?, ?)')
        .run(username, fakePassword, googleId, email);
      const userId = result.lastInsertRowid;

      const insertCategory = db.prepare('INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)');
      db.exec('BEGIN');
      try {
        for (const cat of DEFAULT_CATEGORIES) {
          insertCategory.run(userId, cat.name, cat.color);
        }
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    }

    const token = signToken(user.id, user.username);
    res.json({ token, user: { id: user.id, username: user.username, name: user.name || null } });
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(401).json({ error: 'Falha ao autenticar com Google' });
  }
};

exports.login = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username e senha são obrigatórios' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Username ou senha incorretos' });
  }

  const token = signToken(user.id, user.username);
  res.json({ token, user: { id: user.id, username: user.username, name: user.name || null } });
};
