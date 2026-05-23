const db = require('../database/db');

exports.getAll = (req, res) => {
  const { userId } = req.user;
  const { month, year, type, category_id } = req.query;

  let query = `
    SELECT t.*, c.name AS category_name, c.color AS category_color
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
  `;
  const params = [userId];

  if (year) {
    query += ` AND strftime('%Y', t.date) = ?`;
    params.push(String(year));
  }
  if (month) {
    query += ` AND strftime('%m', t.date) = ?`;
    params.push(String(month).padStart(2, '0'));
  }
  if (type && type !== 'all') {
    query += ` AND t.type = ?`;
    params.push(type);
  }
  if (category_id) {
    query += ` AND t.category_id = ?`;
    params.push(category_id);
  }

  query += ` ORDER BY t.date DESC, t.created_at DESC`;

  const transactions = db.prepare(query).all(...params);
  res.json(transactions);
};

exports.getSummary = (req, res) => {
  const { userId } = req.user;
  const year = req.query.year || new Date().getFullYear();

  const monthlyRows = db.prepare(`
    SELECT
      CAST(strftime('%m', date) AS INTEGER) AS month,
      SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
    FROM transactions
    WHERE user_id = ? AND strftime('%Y', date) = ?
    GROUP BY month
    ORDER BY month
  `).all(userId, String(year));

  const monthly = Array.from({ length: 12 }, (_, i) => {
    const found = monthlyRows.find(r => r.month === i + 1);
    const income = found?.income ?? 0;
    const expenses = found?.expenses ?? 0;
    return { month: i + 1, income, expenses, balance: income - expenses };
  });

  const annualRow = db.prepare(`
    SELECT
      SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS totalIncome,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS totalExpenses
    FROM transactions
    WHERE user_id = ? AND strftime('%Y', date) = ?
  `).get(userId, String(year));

  const totalIncome = annualRow?.totalIncome ?? 0;
  const totalExpenses = annualRow?.totalExpenses ?? 0;

  const kindRow = db.prepare(`
    SELECT
      SUM(CASE WHEN kind = 'fixed'    THEN amount ELSE 0 END) AS fixed,
      SUM(CASE WHEN kind = 'variable' THEN amount ELSE 0 END) AS variable,
      SUM(CASE WHEN kind = 'custom'   THEN amount ELSE 0 END) AS custom
    FROM transactions
    WHERE user_id = ? AND type = 'expense' AND strftime('%Y', date) = ?
  `).get(userId, String(year));

  const largestExpense = db.prepare(`
    SELECT MAX(amount) AS value FROM transactions
    WHERE user_id = ? AND type = 'expense' AND strftime('%Y', date) = ?
  `).get(userId, String(year));

  res.json({
    monthly,
    annual: {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
    },
    byKind: {
      fixed: kindRow?.fixed ?? 0,
      variable: kindRow?.variable ?? 0,
      custom: kindRow?.custom ?? 0,
    },
    largestExpense: largestExpense?.value ?? 0,
  });
};

exports.create = (req, res) => {
  const { userId } = req.user;
  const { type, kind, description, amount, date, category_id, notes } = req.body;

  if (!type || !description || !amount || !date) {
    return res.status(400).json({ error: 'Tipo, descrição, valor e data são obrigatórios' });
  }
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Tipo deve ser income ou expense' });
  }
  if (kind && !['fixed', 'variable', 'custom'].includes(kind)) {
    return res.status(400).json({ error: 'Subtipo inválido' });
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valor deve ser maior que zero' });
  }

  const result = db.prepare(`
    INSERT INTO transactions (user_id, category_id, type, kind, description, amount, date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    category_id || null,
    type,
    kind || 'variable',
    description,
    Number(amount),
    date,
    notes || null
  );

  const created = db.prepare(`
    SELECT t.*, c.name AS category_name, c.color AS category_color
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(created);
};

exports.remove = (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const transaction = db.prepare('SELECT id FROM transactions WHERE id = ? AND user_id = ?').get(id, userId);
  if (!transaction) {
    return res.status(404).json({ error: 'Transação não encontrada' });
  }

  db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  res.json({ success: true });
};
