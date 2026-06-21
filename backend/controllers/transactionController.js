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
  if (req.query.date_from) {
    query += ` AND t.date >= ?`;
    params.push(req.query.date_from);
  }
  if (req.query.date_to) {
    query += ` AND t.date <= ?`;
    params.push(req.query.date_to);
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
  const month = req.query.month || new Date().getMonth() + 1;

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

  const monthPad = String(month).padStart(2, '0');

  const annualRow = db.prepare(`
    SELECT
      SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS totalIncome,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS totalExpenses
    FROM transactions
    WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
  `).get(userId, String(year), monthPad);

  const totalIncome = annualRow?.totalIncome ?? 0;
  const totalExpenses = annualRow?.totalExpenses ?? 0;

  const kindRow = db.prepare(`
    SELECT
      SUM(CASE WHEN kind = 'fixed'    THEN amount ELSE 0 END) AS fixed,
      SUM(CASE WHEN kind = 'variable' THEN amount ELSE 0 END) AS variable,
      SUM(CASE WHEN kind = 'custom'   THEN amount ELSE 0 END) AS custom
    FROM transactions
    WHERE user_id = ? AND type = 'expense' AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
  `).get(userId, String(year), monthPad);

  const largestExpense = db.prepare(`
    SELECT MAX(amount) AS value FROM transactions
    WHERE user_id = ? AND type = 'expense' AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
  `).get(userId, String(year), monthPad);

  const byCategoryYear = db.prepare(`
    SELECT
      COALESCE(c.name, 'Sem categoria') AS name,
      COALESCE(c.color, '#6b7280') AS color,
      SUM(t.amount) AS value
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND t.type = 'expense' AND strftime('%Y', t.date) = ?
    GROUP BY t.category_id
    ORDER BY value DESC
  `).all(userId, String(year));

  const byCategoryMonth = db.prepare(`
    SELECT
      COALESCE(c.name, 'Sem categoria') AS name,
      COALESCE(c.color, '#6b7280') AS color,
      SUM(t.amount) AS value
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND t.type = 'expense'
      AND strftime('%Y', t.date) = ?
      AND strftime('%m', t.date) = ?
    GROUP BY t.category_id
    ORDER BY value DESC
  `).all(userId, String(year), String(month).padStart(2, '0'));

  // Previous month comparison
  let prevYear = Number(year);
  let prevMonth = Number(month) - 1;
  if (prevMonth === 0) { prevMonth = 12; prevYear--; }
  const prevPad = String(prevMonth).padStart(2, '0');

  const prevRow = db.prepare(`
    SELECT
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS totalIncome,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS totalExpenses
    FROM transactions
    WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
  `).get(userId, String(prevYear), prevPad);

  const prevLargest = db.prepare(`
    SELECT MAX(amount) AS value FROM transactions
    WHERE user_id = ? AND type = 'expense' AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
  `).get(userId, String(prevYear), prevPad);

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
    byCategoryYear,
    byCategoryMonth,
    largestExpense: largestExpense?.value ?? 0,
    previousMonth: {
      totalIncome: prevRow?.totalIncome ?? 0,
      totalExpenses: prevRow?.totalExpenses ?? 0,
      balance: (prevRow?.totalIncome ?? 0) - (prevRow?.totalExpenses ?? 0),
      largestExpense: prevLargest?.value ?? 0,
    },
  });
};

exports.getByCategory = (req, res) => {
  const { userId } = req.user;
  const { year, month } = req.query;

  let where = `t.user_id = ? AND t.type = 'expense'`;
  const params = [userId];

  if (year) {
    where += ` AND strftime('%Y', t.date) = ?`;
    params.push(String(year));
  }
  if (month) {
    where += ` AND strftime('%m', t.date) = ?`;
    params.push(String(month).padStart(2, '0'));
  }

  const rows = db.prepare(`
    SELECT
      COALESCE(c.name, 'Sem categoria') AS name,
      COALESCE(c.color, '#6b7280') AS color,
      SUM(t.amount) AS value
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE ${where}
    GROUP BY t.category_id
    ORDER BY value DESC
  `).all(...params);

  res.json(rows);
};

function addMonths(dateStr, months) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1 + months, d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

exports.create = (req, res) => {
  const { userId, plan, isAdmin } = req.user;
  const { type, kind, description, amount, date, category_id, notes, installment_total } = req.body;

  if (plan === 'free' && !isAdmin) {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE user_id = ? AND strftime('%Y-%m', date) = ?").get(userId, ym);
    if (count.c >= 50) {
      return res.status(403).json({ error: 'Limite de 50 transações/mês do plano gratuito atingido', requiredPlan: 'pro' });
    }
  }

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

  const total = Number(installment_total);

  // ── Parcelado ────────────────────────────────────────────────────────────
  if (total >= 2) {
    const groupId = Date.now();
    const totalAmount = Number(amount);
    const baseAmount = Math.floor((totalAmount / total) * 100) / 100;
    const lastAmount = Math.round((totalAmount - baseAmount * (total - 1)) * 100) / 100;

    const stmt = db.prepare(`
      INSERT INTO transactions
        (user_id, category_id, type, kind, description, amount, date, notes,
         installment_total, installment_current, installment_group_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let firstId;
    for (let i = 1; i <= total; i++) {
      const parcAmt = i === total ? lastAmount : baseAmount;
      const parcDate = addMonths(date, i - 1);
      const r = stmt.run(
        userId, category_id || null, type, kind || 'variable',
        description, parcAmt, parcDate, notes || null,
        total, i, groupId
      );
      if (i === 1) firstId = r.lastInsertRowid;
    }

    const created = db.prepare(`
      SELECT t.*, c.name AS category_name, c.color AS category_color
      FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(firstId);
    return res.status(201).json(created);
  }

  // ── Normal ───────────────────────────────────────────────────────────────
  const result = db.prepare(`
    INSERT INTO transactions (user_id, category_id, type, kind, description, amount, date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId, category_id || null, type, kind || 'variable',
    description, Number(amount), date, notes || null
  );

  const created = db.prepare(`
    SELECT t.*, c.name AS category_name, c.color AS category_color
    FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(created);
};

exports.update = (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { type, kind, description, amount, date, category_id, notes, recurring } = req.body;

  if (!type || !['income', 'expense'].includes(type)) return res.status(400).json({ error: 'Tipo inválido' });
  if (kind && !['fixed', 'variable', 'custom'].includes(kind)) return res.status(400).json({ error: 'Subtipo inválido' });
  if (!description || !amount || !date) return res.status(400).json({ error: 'Descrição, valor e data são obrigatórios' });
  if (Number(amount) <= 0) return res.status(400).json({ error: 'Valor deve ser maior que zero' });

  const transaction = db.prepare('SELECT id FROM transactions WHERE id = ? AND user_id = ?').get(id, userId);
  if (!transaction) return res.status(404).json({ error: 'Transação não encontrada' });

  db.prepare(`
    UPDATE transactions SET
      type = ?, kind = ?, description = ?, amount = ?, date = ?,
      category_id = ?, notes = ?, recurring = ?
    WHERE id = ? AND user_id = ?
  `).run(type, kind || 'variable', description, Number(amount), date,
    category_id || null, notes || null, recurring ? 1 : 0, id, userId);

  const updated = db.prepare(`
    SELECT t.*, c.name AS category_name, c.color AS category_color
    FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `).get(id);
  res.json(updated);
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
