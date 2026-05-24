const bcrypt = require('bcrypt');
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

exports.listUsers = (req, res) => {
  const users = db
    .prepare('SELECT id, username, name, email, is_admin, expires_at, created_at, approved FROM users ORDER BY created_at DESC')
    .all();
  res.json(users);
};

exports.createUser = (req, res) => {
  const { username, password, name, expires_in_days } = req.body;

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

  let expires_at = null;
  if (expires_in_days && Number(expires_in_days) > 0) {
    const d = new Date();
    d.setDate(d.getDate() + Number(expires_in_days));
    expires_at = d.toISOString().slice(0, 19).replace('T', ' ');
  }

  const hash = bcrypt.hashSync(password, 12);
  const result = db
    .prepare('INSERT INTO users (username, password, name, expires_at, approved) VALUES (?, ?, ?, ?, 1)')
    .run(username, hash, name || null, expires_at);
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

  const user = db
    .prepare('SELECT id, username, name, email, is_admin, expires_at, created_at, approved FROM users WHERE id = ?')
    .get(userId);
  res.status(201).json(user);
};

exports.approveUser = (req, res) => {
  const { id } = req.params;

  const user = db.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  if (user.is_admin) {
    return res.status(400).json({ error: 'Não é possível alterar o administrador' });
  }

  db.prepare('UPDATE users SET approved = 1 WHERE id = ?').run(id);

  // Create default categories if the user has none yet
  const { count } = db.prepare('SELECT COUNT(*) as count FROM categories WHERE user_id = ?').get(id);
  if (!count) {
    const insertCategory = db.prepare('INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)');
    db.exec('BEGIN');
    try {
      for (const cat of DEFAULT_CATEGORIES) {
        insertCategory.run(id, cat.name, cat.color);
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  const updated = db
    .prepare('SELECT id, username, name, email, is_admin, expires_at, created_at, approved FROM users WHERE id = ?')
    .get(id);
  res.json(updated);
};

exports.updateExpiry = (req, res) => {
  const { id } = req.params;
  const { expires_in_days } = req.body;

  const user = db.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  if (user.is_admin) {
    return res.status(400).json({ error: 'Não é possível alterar a validade do administrador' });
  }

  let expires_at = null;
  if (expires_in_days && Number(expires_in_days) > 0) {
    const d = new Date();
    d.setDate(d.getDate() + Number(expires_in_days));
    expires_at = d.toISOString().slice(0, 19).replace('T', ' ');
  }

  db.prepare('UPDATE users SET expires_at = ? WHERE id = ?').run(expires_at, id);

  const updated = db
    .prepare('SELECT id, username, name, email, is_admin, expires_at, created_at FROM users WHERE id = ?')
    .get(id);
  res.json(updated);
};

exports.deleteUser = (req, res) => {
  const { id } = req.params;

  const user = db.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  if (user.is_admin) {
    return res.status(400).json({ error: 'Não é possível excluir o administrador' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true });
};
