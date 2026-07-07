const cron = require('node-cron');
const db = require('../database/db');
const { sendEmail } = require('../services/emailService');

const RENEW_URL = (process.env.FRONTEND_URL || 'https://planejix.com.br') + '/upgrade';

function renewalHtml(name, message) {
  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 520px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 28px 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">Planejix</h1>
      </div>
      <div style="background: #f9fafb; padding: 28px 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
        <p style="font-size: 15px; margin: 0 0 12px;">Olá${name ? `, ${name}` : ''}!</p>
        <p style="color: #4b5563; margin: 0 0 20px;">${message}</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${RENEW_URL}" style="background: linear-gradient(135deg, #10B981, #059669); color: #fff; text-decoration: none; padding: 13px 30px; border-radius: 10px; font-weight: 600; font-size: 14px;">
            Renovar por R$ ${(parseFloat(process.env.MP_PRO_PRICE || '4.90')).toFixed(2).replace('.', ',')}/mês →
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0; text-align: center;">Seus dados ficam preservados. — Planejix</p>
      </div>
    </div>
  `;
}

async function checkSubscriptions() {
  const now = new Date();
  const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Lembrete: acesso Pix vence em até 3 dias
  const expiring = db.prepare(`
    SELECT id, name, username, email, plan_expires_at FROM users
    WHERE plan = 'pro' AND plan_expires_at IS NOT NULL
      AND plan_expires_at > ? AND plan_expires_at <= ?
      AND renewal_reminder_sent_at IS NULL
      AND email IS NOT NULL AND is_admin = 0
  `).all(now.toISOString(), in3days.toISOString());

  for (const u of expiring) {
    const dias = Math.max(1, Math.ceil((new Date(u.plan_expires_at) - now) / 86400000));
    await sendEmail({
      to: u.email,
      subject: `Seu acesso ao Planejix vence em ${dias} dia${dias > 1 ? 's' : ''}`,
      html: renewalHtml(u.name || u.username, `Seu acesso ao Planejix vence em <strong>${dias} dia${dias > 1 ? 's' : ''}</strong>. Renove agora para não perder o controle das suas finanças — leva menos de um minuto.`),
      text: `Seu acesso ao Planejix vence em ${dias} dia(s). Renove em ${RENEW_URL}`,
    });
    db.prepare("UPDATE users SET renewal_reminder_sent_at = datetime('now') WHERE id = ?").run(u.id);
    console.log(`[Assinatura] Lembrete de renovação enviado para ${u.email} (vence em ${dias}d)`);
  }

  // Aviso: acesso venceu
  const expired = db.prepare(`
    SELECT id, name, username, email FROM users
    WHERE plan = 'pro' AND plan_expires_at IS NOT NULL
      AND plan_expires_at <= ?
      AND expired_notice_sent_at IS NULL
      AND email IS NOT NULL AND is_admin = 0
  `).all(now.toISOString());

  for (const u of expired) {
    await sendEmail({
      to: u.email,
      subject: 'Seu acesso ao Planejix expirou — renove quando quiser',
      html: renewalHtml(u.name || u.username, 'Seu acesso ao Planejix <strong>expirou</strong>, mas seus dados estão guardados em segurança. Renove quando quiser e continue exatamente de onde parou.'),
      text: `Seu acesso ao Planejix expirou. Renove em ${RENEW_URL} — seus dados estão preservados.`,
    });
    db.prepare("UPDATE users SET expired_notice_sent_at = datetime('now') WHERE id = ?").run(u.id);
    console.log(`[Assinatura] Aviso de expiração enviado para ${u.email}`);
  }
}

function startSubscriptionExpiryJob() {
  // Diariamente às 9h
  cron.schedule('0 9 * * *', () => {
    console.log('[Assinatura] Verificando renovações e expirações...');
    checkSubscriptions().catch((err) => console.error('[Assinatura] Erro no job:', err.message));
  });

  // Também roda no boot para recuperar atrasos
  checkSubscriptions().catch((err) => console.error('[Assinatura] Erro no job:', err.message));
  console.log('[Assinatura] Job de renovação de assinaturas iniciado.');
}

module.exports = { startSubscriptionExpiryJob, checkSubscriptions };
