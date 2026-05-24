const cron = require('node-cron');
const db = require('../database/db');

function generateRecurringTransactions() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const today = now.getDate();

  // Find all recurring transactions
  const recurring = db.prepare(`
    SELECT * FROM transactions
    WHERE recurring = 1 AND recurring_parent_id IS NULL
  `).all();

  for (const t of recurring) {
    const originalDay = parseInt(t.date.split('-')[2], 10);
    // Only generate on the same day of month as the original transaction
    if (today !== originalDay) continue;

    // Check if already generated this month
    const exists = db.prepare(`
      SELECT id FROM transactions
      WHERE recurring_parent_id = ? AND strftime('%Y-%m', date) = ?
    `).get(t.id, `${year}-${month}`);

    if (exists) continue;

    // Create copy for current month, capping day at 28 to avoid invalid dates
    const day = Math.min(originalDay, 28);
    const newDate = `${year}-${month}-${String(day).padStart(2, '0')}`;

    db.prepare(`
      INSERT INTO transactions (user_id, category_id, type, kind, description, amount, date, notes, recurring, recurring_parent_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(t.user_id, t.category_id, t.type, t.kind, t.description, t.amount, newDate, t.notes, t.id);

    console.log(`[Recorrente] Gerado: "${t.description}" para ${newDate} (user ${t.user_id})`);
  }
}

function startRecurringJob() {
  // Run at midnight every day
  cron.schedule('0 0 * * *', () => {
    console.log('[Recorrente] Verificando transações recorrentes...');
    generateRecurringTransactions();
  });

  // Also run once on server start to catch up if server was down
  generateRecurringTransactions();
  console.log('[Recorrente] Job de transações recorrentes iniciado.');
}

module.exports = { startRecurringJob };
