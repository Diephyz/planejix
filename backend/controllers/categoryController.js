const db = require('../database/db');

exports.getAll = (req, res) => {
  const { userId } = req.user;
  const categories = db.prepare(
    'SELECT * FROM categories WHERE user_id = ? ORDER BY name ASC'
  ).all(userId);
  res.json(categories);
};

exports.create = (req, res) => {
  const { userId } = req.user;
  const { name, color } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
  }

  const result = db.prepare(
    'INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)'
  ).run(userId, name, color || '#6366f1');

  const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
};

exports.update = (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { name, color } = req.body;

  const category = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').get(id, userId);
  if (!category) {
    return res.status(404).json({ error: 'Categoria não encontrada' });
  }

  db.prepare('UPDATE categories SET name = ?, color = ? WHERE id = ?').run(
    name || category.name,
    color || category.color,
    id
  );

  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.json(updated);
};

exports.remove = (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const category = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?').get(id, userId);
  if (!category) {
    return res.status(404).json({ error: 'Categoria não encontrada' });
  }

  const count = db.prepare('SELECT COUNT(*) AS total FROM transactions WHERE category_id = ? AND user_id = ?').get(id, userId);
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ success: true, affectedTransactions: count.total });
};
