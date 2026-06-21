const nodemailer = require('nodemailer');

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

let transporter = null;
let smtpConfigured = false;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  smtpConfigured = true;
  return transporter;
}

/**
 * Sends a due-date reminder e-mail.
 * @param {Object} opts
 * @param {string} opts.to - recipient e-mail
 * @param {string} [opts.name] - recipient display name
 * @param {string} opts.description - transaction description
 * @param {number} opts.amount - transaction amount
 * @param {string} opts.date - transaction date (YYYY-MM-DD)
 * @param {'due_today'|'due_in_3_days'} opts.type - reminder type
 */
async function sendReminderEmail({ to, name, description, amount, date, type }) {
  const t = getTransporter();
  if (!t) {
    console.warn('[Lembrete] SMTP não configurado — pulando envio de e-mail (configure SMTP_HOST/SMTP_USER/SMTP_PASSWORD no .env).');
    return;
  }

  const greeting = name ? `Olá, ${name}!` : 'Olá!';
  const when = type === 'due_today' ? 'vence hoje' : `vence em breve (${fmtDate(date)})`;
  const subject = type === 'due_today'
    ? `Vence hoje: ${description} — ${fmt(amount)}`
    : `Lembrete: ${description} vence em 3 dias`;

  const text = `${greeting}\n\nSua conta "${description}" no valor de ${fmt(amount)} ${when}.\n\nAcesse o Planejix para mais detalhes.\n\n— Planejix`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <p>${greeting}</p>
      <p>Sua conta <strong>"${description}"</strong> no valor de <strong>${fmt(amount)}</strong> ${when}.</p>
      <p style="color:#6b7280; font-size: 13px;">Data de vencimento: ${fmtDate(date)}</p>
      <p>Acesse o <strong>Planejix</strong> para ver mais detalhes e organizar suas finanças.</p>
      <p style="margin-top: 24px; color:#9ca3af; font-size: 12px;">— Planejix</p>
    </div>
  `;

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM_EMAIL || 'Planejix <no-reply@planejix.app>',
      to,
      subject,
      text,
      html,
    });
    console.log(`[Lembrete] E-mail enviado para ${to} ("${description}", ${type})`);
  } catch (err) {
    console.error(`[Lembrete] Falha ao enviar e-mail para ${to}:`, err.message);
  }
}

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

async function sendReportEmail({ to, name, year, month, pdfBuffer }) {
  const t = getTransporter();
  if (!t) {
    console.warn('[Relatório] SMTP não configurado — pulando envio de relatório.');
    return;
  }

  const monthName = MONTH_NAMES[month - 1];
  const greeting = name ? `Olá, ${name}!` : 'Olá!';

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM_EMAIL || 'Planejix <no-reply@planejix.app>',
      to,
      subject: `Relatório Financeiro — ${monthName} ${year}`,
      html: `<p>${greeting}</p><p>Segue em anexo seu relatório financeiro de <strong>${monthName}/${year}</strong>.</p><p>— Planejix</p>`,
      attachments: [{
        filename: `Planejix_Relatorio_${year}_${String(month).padStart(2, '0')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    });
    console.log(`[Relatório] E-mail com PDF enviado para ${to} (${monthName}/${year})`);
  } catch (err) {
    console.error(`[Relatório] Falha ao enviar relatório para ${to}:`, err.message);
  }
}

module.exports = { sendReminderEmail, sendReportEmail, isConfigured: () => smtpConfigured || !!getTransporter() };
