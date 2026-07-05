const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const db = require('../database/db');
const { sendWelcomeEmail } = require('../services/emailService');

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

function signToken(userId, username, tokenVersion = 0) {
  return jwt.sign({ userId, username, tv: tokenVersion }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

const WEAK_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'senha1234',
  'qwertyui', 'qwerty123', '11111111', '00000000', 'abcd1234', 'a1b2c3d4',
  '87654321', 'iloveyou', 'planejix', 'brasil123', 'mudar123', 'admin123',
]);

/** Retorna mensagem de erro se a senha for fraca, ou null se OK. */
function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return 'Senha deve ter pelo menos 8 caracteres';
  }
  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    return 'Essa senha é muito comum. Escolha uma senha mais segura';
  }
  if (/^(.)\1+$/.test(password)) {
    return 'Senha não pode ser um caractere repetido';
  }
  return null;
}

exports.register = async (req, res) => {
  const { username, password, name, email } = req.body;
  if (!username || !password || !name || !email) {
    return res.status(400).json({ error: 'Nome, username, e-mail e senha são obrigatórios' });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: 'Username deve ter pelo menos 3 caracteres' });
  }
  const pwError = validatePasswordStrength(password);
  if (pwError) {
    return res.status(400).json({ error: pwError });
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
  const result = db.prepare('INSERT INTO users (username, password, name, email, approved) VALUES (?, ?, ?, ?, 0)')
    .run(username, hash, name || null, email || null);

  const userId = Number(result.lastInsertRowid);

  // Envia e-mail de boas-vindas (não bloqueia o registro se falhar)
  if (email) {
    sendWelcomeEmail({ to: email, name: name || username }).catch(() => {});
  }

  try {
    const { MercadoPagoConfig, Preference } = require('mercadopago');
    if (process.env.MP_ACCESS_TOKEN) {
      const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
      const preference = new Preference(client);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;

      const prefResult = await preference.create({
        body: {
          items: [{
            id: 'planejix-acesso',
            title: 'Planejix — Acesso ao App',
            description: 'Acesso completo ao Planejix com todas as funcionalidades',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: parseFloat(process.env.MP_PRO_PRICE || '19.90'),
          }],
          payer: { name: name || username, email: email || undefined },
          back_urls: {
            success: `${frontendUrl}/login?payment=approved`,
            failure: `${frontendUrl}/login?payment=rejected`,
            pending: `${frontendUrl}/login?payment=pending`,
          },
          auto_return: 'approved',
          notification_url: `${backendUrl}/api/payments/webhook`,
          external_reference: String(userId),
          statement_descriptor: 'PLANEJIX',
        },
      });

      return res.status(201).json({
        message: 'Cadastro realizado! Redirecionando para pagamento...',
        payment_url: prefResult.init_point,
        user_id: userId,
      });
    }
  } catch (err) {
    console.error('[Register] Erro ao criar preferência MP:', err.message);
  }

  res.status(201).json({ message: 'Cadastro realizado! Aguarde a aprovação do administrador.' });
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

    const token = signToken(user.id, user.username, user.token_version || 0);
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

  const token = signToken(user.id, user.username, user.token_version || 0);
  res.json({ token, user: { id: user.id, username: user.username, name: user.name || null, is_admin: !!user.is_admin, plan: user.plan || 'free' } });
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' });

  const user = db.prepare('SELECT id, username, email FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  if (!user) {
    return res.json({ message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.' });
  }

  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  try { db.exec('ALTER TABLE users ADD COLUMN reset_token TEXT'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN reset_token_expires TEXT'); } catch {}

  db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
    .run(resetToken, expires, user.id);

  const { sendEmail } = require('../services/emailService');
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  sendEmail({
    to: user.email,
    subject: 'Planejix — Redefinir senha',
    html: `
      <div style="font-family: 'IBM Plex Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #10B981;">Redefinir sua senha</h2>
        <p>Olá ${user.username},</p>
        <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo (válido por 1 hora):</p>
        <a href="${resetLink}" style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">Redefinir senha</a>
        <p style="color: #888; font-size: 13px;">Se você não solicitou, ignore este e-mail.</p>
      </div>
    `,
  });

  res.json({ message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.' });
};

exports.resetPassword = (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
  const pwError = validatePasswordStrength(password);
  if (pwError) return res.status(400).json({ error: pwError });

  const user = db.prepare('SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > ?')
    .get(token, new Date().toISOString());

  if (!user) return res.status(400).json({ error: 'Link expirado ou inválido. Solicite novamente.' });

  const hash = bcrypt.hashSync(password, 12);
  db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL, token_version = COALESCE(token_version, 0) + 1 WHERE id = ?')
    .run(hash, user.id);

  res.json({ message: 'Senha redefinida com sucesso!' });
};

exports.deleteAccount = (req, res) => {
  const userId = req.user.userId;

  db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM categories WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM budgets WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM savings_goals WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);

  res.json({ message: 'Conta excluída com sucesso' });
};

exports.exportData = (req, res) => {
  const userId = req.user.userId;

  const user = db.prepare('SELECT username, name, email, created_at FROM users WHERE id = ?').get(userId);
  const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ?').all(userId);
  const categories = db.prepare('SELECT * FROM categories WHERE user_id = ?').all(userId);
  const budgets = db.prepare('SELECT * FROM budgets WHERE user_id = ?').all(userId);
  const savings = db.prepare('SELECT * FROM savings_goals WHERE user_id = ?').all(userId);

  res.json({
    user,
    transactions,
    categories,
    budgets,
    savings,
    exported_at: new Date().toISOString(),
  });
};
