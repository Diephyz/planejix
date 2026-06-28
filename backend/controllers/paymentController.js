const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const db = require('../database/db');

function getClient() {
  if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error('MP_ACCESS_TOKEN não configurado');
  }
  return new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
}

exports.createPreference = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = db.prepare('SELECT id, username, email, name, plan FROM users WHERE id = ?').get(userId);

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (user.plan === 'pro') return res.status(400).json({ error: 'Você já é Pro!' });

    const client = getClient();
    const preference = new Preference(client);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;

    const result = await preference.create({
      body: {
        items: [
          {
            id: 'planejix-pro',
            title: 'Planejix Pro — Plano Mensal',
            description: 'Transações ilimitadas, metas ilimitadas, relatório PDF, lembretes por e-mail',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: parseFloat(process.env.MP_PRO_PRICE || '19.90'),
          },
        ],
        payer: {
          name: user.name || user.username,
          email: user.email || undefined,
        },
        back_urls: {
          success: `${frontendUrl}/upgrade?status=approved`,
          failure: `${frontendUrl}/upgrade?status=rejected`,
          pending: `${frontendUrl}/upgrade?status=pending`,
        },
        auto_return: 'approved',
        notification_url: `${backendUrl}/api/payments/webhook`,
        external_reference: String(userId),
        statement_descriptor: 'PLANEJIX PRO',
      },
    });

    res.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (err) {
    console.error('[Pagamento] Erro ao criar preferência:', err.message);
    res.status(500).json({ error: 'Erro ao criar pagamento. Tente novamente.' });
  }
};

exports.webhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      const client = getClient();
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: data.id });

      if (paymentData.status === 'approved') {
        const userId = parseInt(paymentData.external_reference);
        if (userId) {
          db.prepare('UPDATE users SET plan = ?, approved = 1 WHERE id = ?').run('pro', userId);

          try { db.exec('ALTER TABLE users ADD COLUMN mp_payment_id TEXT'); } catch {}
          try { db.exec('ALTER TABLE users ADD COLUMN plan_started_at TEXT'); } catch {}

          db.prepare('UPDATE users SET mp_payment_id = ?, plan_started_at = ? WHERE id = ?')
            .run(String(data.id), new Date().toISOString(), userId);

          console.log(`[Pagamento] Usuário ${userId} atualizado para Pro (payment ${data.id})`);
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('[Pagamento] Erro no webhook:', err.message);
    res.sendStatus(200);
  }
};

exports.status = (req, res) => {
  const userId = req.user.userId;

  try { db.exec('ALTER TABLE users ADD COLUMN mp_payment_id TEXT'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN plan_started_at TEXT'); } catch {}

  const user = db.prepare('SELECT plan, mp_payment_id, plan_started_at FROM users WHERE id = ?').get(userId);

  res.json({
    plan: user?.plan || 'free',
    payment_id: user?.mp_payment_id || null,
    started_at: user?.plan_started_at || null,
  });
};
