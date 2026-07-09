/**
 * Verificador de uptime do Planejix — roda a cada 30 min via Agendador do
 * Windows ("Planejix Uptime Check") no PC do Jeferson.
 *
 * Checa site (Vercel), API via proxy e API direta (Oracle). Manda e-mail
 * (SMTP do backend/.env) apenas quando o estado muda (caiu/voltou), para
 * não lotar a caixa de entrada. Estado e log ficam em PlanejixBackups.
 *
 * Uso: node scripts/uptime-check.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

const OPS_DIR = 'C:\\Users\\jeffb\\OneDrive\\Documents\\Projects Claude\\PlanejixBackups';
const STATE_FILE = path.join(OPS_DIR, 'uptime-state.json');
const LOG_FILE = path.join(OPS_DIR, 'uptime.log');
const ALERT_TO = 'jeffbonis@gmail.com';

const CHECKS = [
  { name: 'Site (Vercel)', url: 'https://planejix.com.br/', expect: (res, body) => res.status === 200 && body.includes('Planejix') },
  { name: 'API via proxy', url: 'https://planejix.com.br/api/health', expect: (res, body) => res.status === 200 && body.includes('"ok":true') },
  { name: 'API direta (Oracle)', url: 'https://api-planejix.duckdns.org/api/health', expect: (res, body) => res.status === 200 && body.includes('"ok":true') },
];

function log(msg) {
  fs.mkdirSync(OPS_DIR, { recursive: true });
  fs.appendFileSync(LOG_FILE, `${new Date().toISOString().replace('T', ' ').slice(0, 19)} ${msg}\n`);
}

async function runCheck(check) {
  // 2 tentativas com 10s de intervalo para não alarmar por soluço de rede
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(check.url, { signal: ctrl.signal });
      clearTimeout(t);
      const body = await res.text();
      if (check.expect(res, body)) return { ok: true };
      if (attempt === 2) return { ok: false, detail: `HTTP ${res.status}` };
    } catch (err) {
      if (attempt === 2) return { ok: false, detail: err.cause?.code || err.name };
    }
    await new Promise((r) => setTimeout(r, 10000));
  }
}

async function sendAlert(subject, text) {
  if (!process.env.SMTP_HOST) { log('AVISO: SMTP não configurado, alerta não enviado'); return; }
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
    to: ALERT_TO,
    subject,
    text,
  });
}

(async () => {
  const results = [];
  for (const check of CHECKS) {
    const r = await runCheck(check);
    results.push({ name: check.name, ...r });
  }

  const failed = results.filter((r) => !r.ok);
  const status = failed.length === 0 ? 'UP' : 'DOWN';
  const summary = results.map((r) => `${r.ok ? '✓' : '✗'} ${r.name}${r.detail ? ` (${r.detail})` : ''}`).join(' | ');

  let prev = 'UP';
  try { prev = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')).status; } catch {}

  log(`${status}: ${summary}`);

  if (status !== prev) {
    const when = new Date().toLocaleString('pt-BR');
    if (status === 'DOWN') {
      await sendAlert(
        `🔴 Planejix FORA DO AR — ${failed.map((f) => f.name).join(', ')}`,
        `Detectado em ${when}:\n\n${results.map((r) => `${r.ok ? 'OK ' : 'FALHOU'} ${r.name} ${r.detail || ''}`).join('\n')}\n\nPróxima checagem em 30 minutos.`
      ).catch((e) => log(`ERRO ao enviar alerta: ${e.message}`));
    } else {
      await sendAlert('🟢 Planejix voltou ao ar', `Todos os serviços responderam normalmente em ${when}.`)
        .catch((e) => log(`ERRO ao enviar alerta: ${e.message}`));
    }
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify({ status, at: new Date().toISOString(), summary }));
  process.exit(failed.length === 0 ? 0 : 1);
})();
