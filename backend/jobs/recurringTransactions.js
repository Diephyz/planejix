const cron = require('node-cron');
const db = require('../database/db');

/** 'YYYY-MM' do mês `delta` meses antes/depois de (y, m). */
function ymShift(y, m, delta) {
  const dt = new Date(y, m - 1 + delta, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

function generateRecurringTransactions() {
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  const today = now.getDate();

  const recurring = db.prepare(`
    SELECT * FROM transactions
    WHERE recurring = 1 AND recurring_parent_id IS NULL
  `).all();

  for (const t of recurring) {
    const [oy, om, od] = t.date.split('-').map(Number);
    const originalYm = `${oy}-${String(om).padStart(2, '0')}`;

    // Ponto de partida: último mês já gerado (coluna; se vazia, deduz da cópia
    // mais recente; sem cópias, o mês da transação original).
    let startYm = t.recurring_last_generated;
    if (!startYm) {
      const lastCopy = db.prepare(`
        SELECT MAX(strftime('%Y-%m', date)) AS ym
        FROM transactions WHERE recurring_parent_id = ?
      `).get(t.id);
      startYm = (lastCopy && lastCopy.ym) || originalYm;
    }

    // Catch-up limitado a 2 meses pra trás — recupera downtime sem despejar
    // um histórico gigante de uma vez em dados antigos.
    const cap = ymShift(curY, curM, -2);
    if (startYm < cap && originalYm < cap) startYm = cap;

    let [y, m] = startYm.split('-').map(Number);
    let lastGenerated = null;

    // Gera cada mês pendente, do seguinte ao ponto de partida até o mês atual.
    for (;;) {
      m++;
      if (m > 12) { m = 1; y++; }
      if (y > curY || (y === curY && m > curM)) break;

      const daysInMonth = new Date(y, m, 0).getDate();
      const day = Math.min(od, daysInMonth); // dia 31 vira 28/29/30 em meses curtos

      // No mês corrente espera chegar o dia; meses passados geram direto.
      if (y === curY && m === curM && today < day) break;

      const ym = `${y}-${String(m).padStart(2, '0')}`;
      const exists = db.prepare(`
        SELECT id FROM transactions
        WHERE recurring_parent_id = ? AND strftime('%Y-%m', date) = ?
      `).get(t.id, ym);

      if (!exists) {
        const newDate = `${ym}-${String(day).padStart(2, '0')}`;
        // Cópia de despesa nasce "a pagar" (paid_at NULL); só nasce paga em
        // catch-up de mês já encerrado, pra não despejar "vencidas" falsas no
        // histórico. Receita recorrente não tem status.
        const firstOfCurrentMonth = `${curY}-${String(curM).padStart(2, '0')}-01`;
        const paidAt = t.type === 'expense' && newDate < firstOfCurrentMonth ? newDate : null;
        db.prepare(`
          INSERT INTO transactions (user_id, category_id, type, kind, description, amount, date, notes, recurring, recurring_parent_id, paid_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `).run(t.user_id, t.category_id, t.type, t.kind, t.description, t.amount, newDate, t.notes, t.id, paidAt);

        console.log(`[Recorrente] Gerado: "${t.description}" para ${newDate} (user ${t.user_id})`);
      }
      lastGenerated = ym;
    }

    if (lastGenerated && lastGenerated !== t.recurring_last_generated) {
      db.prepare('UPDATE transactions SET recurring_last_generated = ? WHERE id = ?').run(lastGenerated, t.id);
    }
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

module.exports = { startRecurringJob, generateRecurringTransactions };
