const cron = require('node-cron');
const db = require('../database/db');
const { generateMonthlyPdfBuffer } = require('../services/pdfService');
const { sendReportEmail } = require('../services/emailService');

async function sendMonthlyReports() {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed = previous month
  if (month === 0) { month = 12; year--; }

  const users = db.prepare(
    "SELECT id, email, name, username FROM users WHERE email IS NOT NULL AND (plan = 'pro' OR is_admin = 1)"
  ).all();

  console.log(`[Relatório] Gerando relatórios de ${month}/${year} para ${users.length} usuário(s)...`);

  for (const user of users) {
    try {
      const pdfBuffer = await generateMonthlyPdfBuffer(user.id, year, month);
      await sendReportEmail({
        to: user.email,
        name: user.name || user.username,
        year,
        month,
        pdfBuffer,
      });
    } catch (err) {
      console.error(`[Relatório] Erro ao gerar/enviar para ${user.email}:`, err.message);
    }
  }
}

function startMonthlyReportJob() {
  // Run at 9 AM on the 1st of each month
  cron.schedule('0 9 1 * *', () => {
    sendMonthlyReports();
  });
  console.log('[Relatório] Job de relatório mensal iniciado.');
}

module.exports = { startMonthlyReportJob, sendMonthlyReports };
