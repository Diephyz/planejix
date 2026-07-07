const crypto = require('crypto');
const { MercadoPagoConfig, Preference, Payment, PreApproval } = require('mercadopago');
const db = require('../database/db');

// Pix compra 30 dias de acesso + 3 de carência antes do paywall
const PIX_ACCESS_DAYS = 33;

/**
 * Valida o header x-signature do Mercado Pago (HMAC-SHA256).
 * Só é aplicada quando MP_WEBHOOK_SECRET está definido no .env —
 * o secret é obtido no painel MP em Suas integrações → Webhooks.
 * Docs: manifest = "id:{data.id};request-id:{x-request-id};ts:{ts};"
 */
function isValidWebhookSignature(req) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // sem secret configurado, mantém comportamento atual

  const signature = req.headers['x-signature'];
  const requestId = req.headers['x-request-id'];
  const dataId = req.query['data.id'] || req.body?.data?.id;
  if (!signature || !dataId) return false;

  const parts = Object.fromEntries(
    signature.split(',').map((p) => p.trim().split('=').map((s) => s.trim()))
  );
  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
  } catch {
    return false;
  }
}

function getClient() {
  if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error('MP_ACCESS_TOKEN não configurado');
  }
  return new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
}

function getUrls() {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
  return { frontendUrl, backendUrl };
}

function getPrice() {
  return parseFloat(process.env.MP_PRO_PRICE || '4.90');
}

/** Plano efetivo: pro com plan_expires_at no passado conta como expirado. */
function isSubscriptionExpired(user) {
  return user.plan === 'pro' && user.plan_expires_at && new Date(user.plan_expires_at) < new Date();
}

/**
 * Ativa 30 dias de acesso após um pagamento avulso (Pix) aprovado.
 * Assinantes de cartão (mp_preapproval_id) não recebem expiração —
 * a recorrência deles é gerida pelo próprio Mercado Pago.
 */
function activatePixAccess(userId, paymentId) {
  const user = db.prepare('SELECT mp_preapproval_id FROM users WHERE id = ?').get(userId);
  if (!user) return;

  if (user.mp_preapproval_id) {
    // Cobrança recorrente da assinatura de cartão: só garante o estado pro
    db.prepare('UPDATE users SET plan = ?, approved = 1 WHERE id = ?').run('pro', userId);
    console.log(`[Pagamento] Cobrança recorrente confirmada para usuário ${userId} (payment ${paymentId})`);
    return;
  }

  const expires = new Date(Date.now() + PIX_ACCESS_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`
    UPDATE users SET plan = 'pro', approved = 1, mp_payment_id = ?, plan_started_at = ?,
      plan_expires_at = ?, renewal_reminder_sent_at = NULL, expired_notice_sent_at = NULL
    WHERE id = ?
  `).run(String(paymentId), new Date().toISOString(), expires, userId);
  console.log(`[Pagamento] Usuário ${userId} ativado por 30 dias via Pix (payment ${paymentId}, expira ${expires})`);
}

/** Ativa a assinatura recorrente de cartão (preapproval autorizado). */
function activateCardSubscription(userId, preapprovalId) {
  db.prepare(`
    UPDATE users SET plan = 'pro', approved = 1, mp_preapproval_id = ?, plan_started_at = ?,
      plan_expires_at = NULL, renewal_reminder_sent_at = NULL, expired_notice_sent_at = NULL
    WHERE id = ?
  `).run(String(preapprovalId), new Date().toISOString(), userId);
  console.log(`[Pagamento] Usuário ${userId} assinou via cartão (preapproval ${preapprovalId})`);
}

/** Checkout Pix avulso — 30 dias de acesso (cartão de crédito excluído). */
async function createPixCheckout(user) {
  const { frontendUrl, backendUrl } = getUrls();
  const preference = new Preference(getClient());

  const result = await preference.create({
    body: {
      items: [{
        id: 'planejix-pix-30d',
        title: 'Planejix — 30 dias de acesso',
        description: 'Acesso completo ao Planejix por 30 dias (renovável)',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: getPrice(),
      }],
      payer: { name: user.name || user.username, email: user.email || undefined },
      payment_methods: {
        excluded_payment_types: [{ id: 'credit_card' }, { id: 'ticket' }],
        installments: 1,
      },
      back_urls: {
        success: `${frontendUrl}/login?payment=approved`,
        failure: `${frontendUrl}/login?payment=rejected`,
        pending: `${frontendUrl}/login?payment=pending`,
      },
      auto_return: 'approved',
      notification_url: `${backendUrl}/api/payments/webhook`,
      external_reference: String(user.id),
      statement_descriptor: 'PLANEJIX',
    },
  });

  return result.init_point;
}

/** Assinatura recorrente mensal no cartão (Preapproval do MP). */
async function createCardSubscription(user) {
  if (!user.email) throw new Error('E-mail é obrigatório para assinatura no cartão');
  const { frontendUrl, backendUrl } = getUrls();
  const preapproval = new PreApproval(getClient());

  const result = await preapproval.create({
    body: {
      reason: 'Planejix — Assinatura Mensal',
      external_reference: String(user.id),
      payer_email: user.email,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: getPrice(),
        currency_id: 'BRL',
      },
      back_url: `${frontendUrl}/login?payment=approved`,
      notification_url: `${backendUrl}/api/payments/webhook`,
      status: 'pending',
    },
  });

  return result.init_point;
}

exports.createPixCheckout = createPixCheckout;
exports.createCardSubscription = createCardSubscription;
exports.isSubscriptionExpired = isSubscriptionExpired;

/** Checkout Pix (30 dias) para usuário logado — novo pagamento ou renovação. */
exports.createPreference = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = db.prepare('SELECT id, username, email, name, plan, plan_expires_at, mp_preapproval_id FROM users WHERE id = ?').get(userId);

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (user.plan === 'pro' && !isSubscriptionExpired(user)) {
      return res.status(400).json({ error: 'Sua assinatura já está ativa!' });
    }

    const init_point = await createPixCheckout(user);
    res.json({ init_point });
  } catch (err) {
    console.error('[Pagamento] Erro ao criar checkout Pix:', err.message);
    res.status(500).json({ error: 'Erro ao criar pagamento. Tente novamente.' });
  }
};

/** Assinatura recorrente no cartão para usuário logado. */
exports.subscribe = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = db.prepare('SELECT id, username, email, name, plan, plan_expires_at, mp_preapproval_id FROM users WHERE id = ?').get(userId);

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (user.plan === 'pro' && !isSubscriptionExpired(user) && user.mp_preapproval_id) {
      return res.status(400).json({ error: 'Sua assinatura já está ativa!' });
    }
    if (!user.email) return res.status(400).json({ error: 'Cadastre um e-mail no Perfil para assinar no cartão' });

    const init_point = await createCardSubscription(user);
    res.json({ init_point });
  } catch (err) {
    console.error('[Pagamento] Erro ao criar assinatura:', err.message);
    res.status(500).json({ error: 'Erro ao criar assinatura. Tente novamente.' });
  }
};

exports.webhook = async (req, res) => {
  try {
    if (!isValidWebhookSignature(req)) {
      console.warn('[Pagamento] Webhook com assinatura inválida — ignorado');
      return res.sendStatus(401);
    }

    const { type, data } = req.body;

    if (type === 'payment' && data?.id) {
      const payment = new Payment(getClient());
      const paymentData = await payment.get({ id: data.id });

      if (paymentData.status === 'approved') {
        const userId = parseInt(paymentData.external_reference);
        if (userId) activatePixAccess(userId, data.id);
      }
    }

    if ((type === 'subscription_preapproval' || type === 'preapproval') && data?.id) {
      const preapproval = new PreApproval(getClient());
      const sub = await preapproval.get({ id: data.id });
      const userId = parseInt(sub.external_reference);

      if (userId && sub.status === 'authorized') {
        activateCardSubscription(userId, data.id);
      } else if (userId && (sub.status === 'cancelled' || sub.status === 'paused')) {
        const user = db.prepare('SELECT mp_preapproval_id FROM users WHERE id = ?').get(userId);
        if (user && user.mp_preapproval_id === String(data.id)) {
          db.prepare('UPDATE users SET plan = ?, mp_preapproval_id = NULL WHERE id = ?').run('free', userId);
          console.log(`[Pagamento] Assinatura de cartão do usuário ${userId} foi ${sub.status} no MP`);
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('[Pagamento] Erro no webhook:', err.message);
    res.sendStatus(200);
  }
};

/**
 * Endpoint público de polling pós-checkout: informa se a conta já foi
 * liberada. Se ainda não e um payment_id foi informado, consulta o MP
 * diretamente (fallback para webhook atrasado/perdido).
 */
exports.check = async (req, res) => {
  const userId = parseInt(req.query.user_id);
  const paymentId = req.query.payment_id;

  if (!userId) return res.status(400).json({ error: 'user_id é obrigatório' });

  const user = db.prepare('SELECT id, approved, plan, plan_expires_at FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  const active = !!user.approved && user.plan === 'pro' && !isSubscriptionExpired(user);

  if (!active && paymentId && process.env.MP_ACCESS_TOKEN) {
    try {
      const payment = new Payment(getClient());
      const data = await payment.get({ id: paymentId });
      if (data.status === 'approved' && parseInt(data.external_reference) === userId) {
        activatePixAccess(userId, paymentId);
        console.log(`[Pagamento] Usuário ${userId} liberado via polling (payment ${paymentId})`);
        return res.json({ approved: true, plan: 'pro' });
      }
    } catch (err) {
      console.warn('[Pagamento] Falha ao consultar MP no polling:', err.message);
    }
  }

  res.json({ approved: active || !!user.approved, plan: user.plan || 'free' });
};

exports.cancel = async (req, res) => {
  const userId = req.user.userId;

  const user = db.prepare('SELECT plan, is_admin, mp_preapproval_id, plan_expires_at FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (user.is_admin) return res.status(400).json({ error: 'Contas de administrador não possuem assinatura' });
  if (user.plan !== 'pro') return res.status(400).json({ error: 'Você não possui uma assinatura ativa' });

  // Assinatura de cartão: cancela a recorrência no Mercado Pago
  if (user.mp_preapproval_id) {
    try {
      const preapproval = new PreApproval(getClient());
      await preapproval.update({ id: user.mp_preapproval_id, body: { status: 'cancelled' } });
    } catch (err) {
      console.error('[Pagamento] Falha ao cancelar preapproval no MP:', err.message);
    }
  }

  db.prepare('UPDATE users SET plan = ?, mp_preapproval_id = NULL, plan_expires_at = NULL WHERE id = ?').run('free', userId);
  console.log(`[Pagamento] Usuário ${userId} cancelou a assinatura`);

  res.json({ success: true, plan: 'free' });
};

exports.status = (req, res) => {
  const userId = req.user.userId;
  const user = db.prepare('SELECT plan, mp_payment_id, mp_preapproval_id, plan_started_at, plan_expires_at FROM users WHERE id = ?').get(userId);

  const expired = user ? isSubscriptionExpired(user) : false;

  res.json({
    plan: expired ? 'expired' : (user?.plan || 'free'),
    recurring: !!user?.mp_preapproval_id,
    payment_id: user?.mp_payment_id || null,
    started_at: user?.plan_started_at || null,
    expires_at: user?.plan_expires_at || null,
  });
};
