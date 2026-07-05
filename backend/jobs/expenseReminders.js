const cron = require('node-cron');
const db = require('../database/db');
const { getUpcomingReminders } = require('../services/reminderService');
const { sendReminderEmail } = require('../services/emailService');

const FLAG_COLUMN = {
  due_today: 'reminder_due_sent_at',
  due_in_3_days: 'reminder_3d_sent_at',
};

async function checkAndSendReminders() {
  const reminders = getUpcomingReminders({ daysBefore: 3 });

  for (const r of reminders) {
    if (!r.email) continue;
    // Lembretes por e-mail são exclusivos do plano Pro (o sino in-app continua para todos)
    if (r.plan !== 'pro' && !r.is_admin) continue;

    const flagColumn = FLAG_COLUMN[r.reminder_type];
    if (r[flagColumn]) continue; // already sent for this type

    await sendReminderEmail({
      to: r.email,
      name: r.name || r.username,
      description: r.description,
      amount: r.amount,
      date: r.date,
      type: r.reminder_type,
    });

    db.prepare(`UPDATE transactions SET ${flagColumn} = datetime('now') WHERE id = ?`).run(r.id);
  }
}

function startExpenseReminderJob() {
  // Run every day at 8 AM
  cron.schedule('0 8 * * *', () => {
    console.log('[Lembrete] Verificando contas a vencer...');
    checkAndSendReminders();
  });

  // Also run once on server start to catch up if server was down
  checkAndSendReminders();
  console.log('[Lembrete] Job de lembretes de vencimento iniciado.');
}

module.exports = { startExpenseReminderJob, checkAndSendReminders };
