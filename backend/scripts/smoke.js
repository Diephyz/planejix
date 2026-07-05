/**
 * Smoke test da API — valida o fluxo essencial de ponta a ponta:
 * register → login → criar transação → resumo → apagar conta.
 *
 * Uso: node scripts/smoke.js [baseUrl]
 * O servidor precisa estar rodando (default http://localhost:3001).
 * Sai com código 1 em qualquer falha.
 */

const BASE = process.argv[2] || 'http://localhost:3001';
const suffix = Date.now().toString(36);
const user = {
  username: `smoke_${suffix}`,
  password: `Smoke!${suffix}xyz`,
  name: 'Smoke Test',
  email: `smoke_${suffix}@test.local`,
};

let failures = 0;

async function step(label, fn) {
  try {
    await fn();
    console.log(`  ✓ ${label}`);
  } catch (err) {
    failures++;
    console.error(`  ✗ ${label}: ${err.message}`);
  }
}

async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

(async () => {
  console.log(`Smoke test contra ${BASE}\n`);
  let token = null;

  await step('registro cria usuário (201)', async () => {
    const r = await req('POST', '/api/auth/register', { body: user });
    assert(r.status === 201, `esperado 201, veio ${r.status}: ${JSON.stringify(r.data)}`);
  });

  await step('senha fraca é rejeitada (400)', async () => {
    const r = await req('POST', '/api/auth/register', {
      body: { ...user, username: `w_${suffix}`, email: `w_${suffix}@t.local`, password: '12345678' },
    });
    assert(r.status === 400, `esperado 400, veio ${r.status}`);
  });

  // Usuário recém-criado fica pendente de aprovação — aprova direto no banco
  // (em CI o banco é local e descartável)
  await step('aprovação direta no banco (CI)', async () => {
    const db = require('../database/db');
    db.prepare('UPDATE users SET approved = 1 WHERE username = ?').run(user.username);
  });

  await step('login retorna token', async () => {
    const r = await req('POST', '/api/auth/login', { body: { username: user.username, password: user.password } });
    assert(r.status === 200, `esperado 200, veio ${r.status}: ${JSON.stringify(r.data)}`);
    assert(r.data?.token, 'sem token na resposta');
    token = r.data.token;
  });

  await step('rota protegida sem token retorna 401', async () => {
    const r = await req('GET', '/api/transactions');
    assert(r.status === 401, `esperado 401, veio ${r.status}`);
  });

  await step('criar transação (201)', async () => {
    const r = await req('POST', '/api/transactions', {
      token,
      body: { type: 'expense', kind: 'variable', description: 'Smoke test', amount: 42.5, date: '2026-07-01' },
    });
    assert(r.status === 201, `esperado 201, veio ${r.status}: ${JSON.stringify(r.data)}`);
  });

  await step('resumo reflete a transação', async () => {
    const r = await req('GET', '/api/transactions/summary?year=2026&month=7', { token });
    assert(r.status === 200, `esperado 200, veio ${r.status}`);
    assert(r.data?.annual?.totalExpenses === 42.5, `totalExpenses esperado 42.5, veio ${r.data?.annual?.totalExpenses}`);
  });

  await step('apagar mês em massa', async () => {
    const r = await req('DELETE', '/api/transactions/bulk?year=2026&month=7', { token });
    assert(r.status === 200 && r.data?.deleted === 1, `esperado deleted=1, veio ${JSON.stringify(r.data)}`);
  });

  await step('excluir conta (LGPD)', async () => {
    const r = await req('DELETE', '/api/auth/account', { token });
    assert(r.status === 200, `esperado 200, veio ${r.status}`);
  });

  console.log(failures === 0 ? '\nTodos os testes passaram ✓' : `\n${failures} teste(s) falharam ✗`);
  process.exit(failures === 0 ? 0 : 1);
})();
