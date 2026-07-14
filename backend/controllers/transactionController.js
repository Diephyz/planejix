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
  if (req.query.status && req.query.status !== 'all') {
    const today = todayLocal();
    if (req.query.status === 'paid') query += ` AND t.type = 'expense' AND t.paid_at IS NOT NULL`;
    if (req.query.status === 'pending') { query += ` AND t.type = 'expense' AND t.paid_at IS NULL AND t.date >= ?`; params.push(today); }
    if (req.query.status === 'overdue') { query += ` AND t.type = 'expense' AND t.paid_at IS NULL AND t.date < ?`; params.push(today); }
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

  // Contas pendentes do mês (a pagar + vencidas)
  const today = todayLocal();
  const pendingRow = db.prepare(`
    SELECT
      COALESCE(SUM(amount), 0) AS toPay,
      COALESCE(SUM(CASE WHEN date < ? THEN 1 ELSE 0 END), 0) AS overdueCount,
      COALESCE(SUM(CASE WHEN date < ? THEN amount ELSE 0 END), 0) AS overdueTotal
    FROM transactions
    WHERE user_id = ? AND type = 'expense' AND paid_at IS NULL
      AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
  `).get(today, today, userId, String(year), monthPad);

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
    pending: {
      toPay: pendingRow?.toPay ?? 0,
      overdueCount: pendingRow?.overdueCount ?? 0,
      overdueTotal: pendingRow?.overdueTotal ?? 0,
    },
    previousMonth: {
      totalIncome: prevRow?.totalIncome ?? 0,
      totalExpenses: prevRow?.totalExpenses ?? 0,
      balance: (prevRow?.totalIncome ?? 0) - (prevRow?.totalExpenses ?? 0),
      largestExpense: prevLargest?.value ?? 0,
    },
  });
};

exports.getAccumulatedBalance = (req, res) => {
  const { userId } = req.user;

  const totalRow = db.prepare(`
    SELECT
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS totalIncome,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS totalExpenses
    FROM transactions WHERE user_id = ?
  `).get(userId);

  const totalBalance = (totalRow?.totalIncome ?? 0) - (totalRow?.totalExpenses ?? 0);

  const monthlyRows = db.prepare(`
    SELECT
      strftime('%Y', date) AS year,
      CAST(strftime('%m', date) AS INTEGER) AS month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
    FROM transactions
    WHERE user_id = ?
    GROUP BY year, month
    ORDER BY year, month
  `).all(userId);

  let accumulated = 0;
  const history = monthlyRows.map(r => {
    const balance = r.income - r.expenses;
    accumulated += balance;
    return {
      year: Number(r.year),
      month: r.month,
      income: r.income,
      expenses: r.expenses,
      balance,
      accumulated,
    };
  });

  res.json({
    totalIncome: totalRow?.totalIncome ?? 0,
    totalExpenses: totalRow?.totalExpenses ?? 0,
    totalBalance,
    history,
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

// Data de hoje em horário local (toISOString é UTC e vira o dia às 21h no Brasil)
function todayLocal() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

// Resolve paid_at de uma despesa: override explícito do toggle > regra automática
// pela data (passada/hoje = paga, futura = a pagar). Receita nunca tem status.
function resolvePaidAt(type, date, paid) {
  if (type !== 'expense') return null;
  const shouldBePaid = paid !== undefined ? !!paid : date <= todayLocal();
  return shouldBePaid ? new Date().toISOString() : null;
}

function addMonths(dateStr, months) {
  const [y, m, d] = dateStr.split('-').map(Number);
  // Ancora no dia 1 e trava o dia no fim do mês de destino — sem isso,
  // 31/01 + 1 mês vira 03/03 (pula fevereiro inteiro)
  const target = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const day = Math.min(d, lastDay);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

exports.create = (req, res) => {
  const { userId } = req.user;
  const { type, kind, description, amount, date, category_id, notes, installment_total, recurring, paid } = req.body;

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
         installment_total, installment_current, installment_group_id, paid_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let firstId;
    for (let i = 1; i <= total; i++) {
      const parcAmt = i === total ? lastAmount : baseAmount;
      const parcDate = addMonths(date, i - 1);
      // Parcela 1 respeita o toggle do formulário; as demais decidem pela própria data
      const parcPaidAt = i === 1 ? resolvePaidAt(type, parcDate, paid) : resolvePaidAt(type, parcDate, undefined);
      const r = stmt.run(
        userId, category_id || null, type, kind || 'variable',
        description, parcAmt, parcDate, notes || null,
        total, i, groupId, parcPaidAt
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
    INSERT INTO transactions (user_id, category_id, type, kind, description, amount, date, notes, recurring, paid_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId, category_id || null, type, kind || 'variable',
    description, Number(amount), date, notes || null, recurring ? 1 : 0,
    resolvePaidAt(type, date, paid)
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
  const { type, kind, description, amount, date, category_id, notes, recurring, paid } = req.body;

  if (!type || !['income', 'expense'].includes(type)) return res.status(400).json({ error: 'Tipo inválido' });
  if (kind && !['fixed', 'variable', 'custom'].includes(kind)) return res.status(400).json({ error: 'Subtipo inválido' });
  if (!description || !amount || !date) return res.status(400).json({ error: 'Descrição, valor e data são obrigatórios' });
  if (Number(amount) <= 0) return res.status(400).json({ error: 'Valor deve ser maior que zero' });

  const transaction = db.prepare('SELECT id, recurring, recurring_parent_id, paid_at FROM transactions WHERE id = ? AND user_id = ?').get(id, userId);
  if (!transaction) return res.status(404).json({ error: 'Transação não encontrada' });

  // Sem `paid` no body o status atual é preservado; se já estava paga, mantém o
  // timestamp original. Transação que virou receita perde o status.
  let paidAt = null;
  if (type === 'expense') {
    const wantsPaid = paid !== undefined ? !!paid : transaction.paid_at !== null;
    paidAt = wantsPaid ? (transaction.paid_at || new Date().toISOString()) : null;
  }

  db.prepare(`
    UPDATE transactions SET
      type = ?, kind = ?, description = ?, amount = ?, date = ?,
      category_id = ?, notes = ?, recurring = ?, paid_at = ?
    WHERE id = ? AND user_id = ?
  `).run(type, kind || 'variable', description, Number(amount), date,
    category_id || null, notes || null, recurring ? 1 : 0, paidAt, id, userId);

  // Recorrência LIGADA agora numa transação-mãe: ancora o ponto de partida no
  // mês anterior — o job passa a gerar deste mês em diante, sem backfill de
  // meses em que a recorrência esteve desligada.
  if (recurring && !transaction.recurring && !transaction.recurring_parent_id) {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevYm = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    const originalYm = String(date).slice(0, 7);
    const anchor = originalYm > prevYm ? originalYm : prevYm;
    db.prepare('UPDATE transactions SET recurring_last_generated = ? WHERE id = ?').run(anchor, id);
  }

  const updated = db.prepare(`
    SELECT t.*, c.name AS category_name, c.color AS category_color
    FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `).get(id);
  res.json(updated);
};

// Toggle leve de status (badge da tabela e ✓ do dashboard) — o PUT exigiria o
// payload completo da transação só para alternar pago/a pagar
exports.togglePaid = (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { paid } = req.body;

  if (typeof paid !== 'boolean') return res.status(400).json({ error: 'Campo paid deve ser booleano' });

  const t = db.prepare('SELECT id, type FROM transactions WHERE id = ? AND user_id = ?').get(id, userId);
  if (!t) return res.status(404).json({ error: 'Transação não encontrada' });
  if (t.type !== 'expense') return res.status(400).json({ error: 'Apenas despesas têm status de pagamento' });

  db.prepare('UPDATE transactions SET paid_at = ? WHERE id = ?').run(paid ? new Date().toISOString() : null, id);

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

  // Cópias ficam órfãs quando a mãe morre (FK ON DELETE SET NULL) — sem isso,
  // cada cópia com recurring=1 viraria uma nova "mãe" e multiplicaria lançamentos
  db.prepare('UPDATE transactions SET recurring = 0 WHERE recurring_parent_id = ? AND user_id = ?').run(id, userId);

  db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  res.json({ success: true });
};

exports.removeBulk = (req, res) => {
  const { userId } = req.user;
  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({ error: 'Ano e mês são obrigatórios' });
  }

  // Neutraliza cópias cujas mães serão apagadas neste lote (mesmo motivo do remove)
  db.prepare(`
    UPDATE transactions SET recurring = 0
    WHERE user_id = ? AND recurring_parent_id IN (
      SELECT id FROM transactions
      WHERE user_id = ? AND recurring = 1 AND recurring_parent_id IS NULL
        AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
    )
  `).run(userId, userId, String(year), String(month).padStart(2, '0'));

  const result = db.prepare(`
    DELETE FROM transactions
    WHERE user_id = ?
      AND strftime('%Y', date) = ?
      AND strftime('%m', date) = ?
  `).run(userId, String(year), String(month).padStart(2, '0'));

  res.json({ success: true, deleted: result.changes });
};
