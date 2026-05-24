const db = require('../database/db');

exports.getAll = (req, res) => {
  const { userId } = req.user;
  const rows = db.prepare(`
    SELECT b.*, c.name AS category_name, c.color AS category_color
    FROM budgets b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.user_id = ?
    ORDER BY c.name
  `).all(userId);
  res.json(rows);
};

exports.create = (req, res) => {
  const { userId } = req.user;
  const { category_id, amount, period } = req.body;
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Valor inválido' });

  const existing = db.prepare(
    'SELECT id FROM budgets WHERE user_id = ? AND category_id IS ?'
  ).get(userId, category_id || null);
  if (existing) return res.status(409).json({ error: 'Meta já existe para esta categoria' });

  const result = db.prepare(
    'INSERT INTO budgets (user_id, category_id, amount, period) VALUES (?, ?, ?, ?)'
  ).run(userId, category_id || null, Number(amount), period || 'monthly');

  const created = db.prepare(`
    SELECT b.*, c.name AS category_name, c.color AS category_color
    FROM budgets b LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(created);
};

exports.update = (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { amount, period } = req.body;
  const budget = db.prepare('SELECT id FROM budgets WHERE id = ? AND user_id = ?').get(id, userId);
  if (!budget) return res.status(404).json({ error: 'Meta não encontrada' });

  db.prepare('UPDATE budgets SET amount = ?, period = ? WHERE id = ?')
    .run(Number(amount), period || 'monthly', id);

  const updated = db.prepare(`
    SELECT b.*, c.name AS category_name, c.color AS category_color
    FROM budgets b LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.id = ?
  `).get(id);
  res.json(updated);
};

exports.remove = (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const budget = db.prepare('SELECT id FROM budgets WHERE id = ? AND user_id = ?').get(id, userId);
  if (!budget) return res.status(404).json({ error: 'Meta não encontrada' });
  db.prepare('DELETE FROM budgets WHERE id = ?').run(id);
  res.json({ success: true });
};

exports.getProgress = (req, res) => {
  const { userId } = req.user;
  const year = req.query.year || new Date().getFullYear();
  const month = req.query.month || new Date().getMonth() + 1;

  const budgets = db.prepare(`
    SELECT b.*, c.name AS category_name, c.color AS category_color
    FROM budgets b LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.user_id = ?
  `).all(userId);

  const result = budgets.map((b) => {
    let spent = 0;
    if (b.period === 'monthly') {
      const row = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
        WHERE user_id = ? AND type = 'expense'
          AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
          AND (category_id IS ? OR (? IS NULL AND category_id IS NULL))
      `).get(userId, String(year), String(month).padStart(2, '0'), b.category_id, b.category_id);
      spent = row.total;
    } else {
      const row = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
        WHERE user_id = ? AND type = 'expense' AND strftime('%Y', date) = ?
          AND (category_id IS ? OR (? IS NULL AND category_id IS NULL))
      `).get(userId, String(year), b.category_id, b.category_id);
      spent = row.total;
    }
    return { ...b, spent, percent: b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0 };
  });

  res.json(result);
};
