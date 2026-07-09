/**
 * Smoke test SEGURO para produção — só verificações que não criam nem
 * alteram dados (diferente do smoke.js, que é para CI/banco local).
 *
 * Uso: node scripts/smoke-prod.js [baseUrl]   (default https://planejix.com.br)
 * Sai com código 1 em qualquer falha.
 */

const BASE = process.argv[2] || 'https://planejix.com.br';
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

async function req(method, path, body) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: ctrl.signal,
  });
  clearTimeout(t);
  let data = null;
  const text = await res.text();
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data, text };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

(async () => {
  console.log(`Smoke de produção contra ${BASE}\n`);

  await step('site responde com a landing (200)', async () => {
    const r = await req('GET', '/');
    assert(r.status === 200 && r.text.includes('Planejix'), `status ${r.status}`);
  });

  await step('health check ok (servidor + banco)', async () => {
    const r = await req('GET', '/api/health');
    assert(r.status === 200 && r.data?.ok === true, `status ${r.status}: ${r.text.slice(0, 100)}`);
  });

  await step('API direta na Oracle ok', async () => {
    const r = await (async () => {
      const res = await fetch('https://api-planejix.duckdns.org/api/health');
      return { status: res.status, data: await res.json() };
    })();
    assert(r.status === 200 && r.data?.ok === true, `status ${r.status}`);
  });

  await step('login com credencial inválida retorna 401', async () => {
    const r = await req('POST', '/api/auth/login', { username: 'smoke_naoexiste', password: 'senhaerrada123' });
    assert(r.status === 401, `esperado 401, veio ${r.status}`);
  });

  await step('rota protegida sem token retorna 401', async () => {
    const r = await req('GET', '/api/transactions');
    assert(r.status === 401, `esperado 401, veio ${r.status}`);
  });

  await step('registro rejeita senha fraca (400, não cria nada)', async () => {
    const r = await req('POST', '/api/auth/register', {
      username: 'smoke_probe', password: '12345678', name: 'Probe', email: 'probe@test.local',
    });
    assert(r.status === 400, `esperado 400, veio ${r.status}`);
  });

  await step('sitemap.xml acessível', async () => {
    const r = await req('GET', '/sitemap.xml');
    assert(r.status === 200 && r.text.includes('<urlset'), `status ${r.status}`);
  });

  await step('robots.txt acessível', async () => {
    const r = await req('GET', '/robots.txt');
    assert(r.status === 200, `status ${r.status}`);
  });

  console.log(failures === 0 ? '\nTodos os testes passaram ✓' : `\n${failures} teste(s) falharam ✗`);
  process.exit(failures === 0 ? 0 : 1);
})();
