// Meta Pixel (Facebook/Instagram Ads).
// Só ativa quando VITE_META_PIXEL_ID estiver definido E o visitante tiver
// aceitado o aviso LGPD (planejix_lgpd_consent) — sem ID ou sem consentimento,
// todas as funções são no-op.
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

const SUBSCRIPTION_PRICE = 4.9;

function hasConsent(): boolean {
  try {
    return !!localStorage.getItem('planejix_lgpd_consent');
  } catch {
    return false;
  }
}

let initialized = false;

/** Carrega o fbevents.js e inicializa o pixel. Seguro chamar múltiplas vezes. */
export function initMetaPixel(): void {
  if (!PIXEL_ID || initialized || !hasConsent()) return;
  initialized = true;

  const w = window as unknown as Record<string, any>;
  if (!w.fbq) {
    const n: any = (w.fbq = function (...args: unknown[]) {
      if (n.callMethod) n.callMethod.apply(n, args);
      else n.queue.push(args);
    });
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
  }
  w.fbq('init', PIXEL_ID);
}

export function trackPixel(event: string, params?: Record<string, unknown>): void {
  if (!PIXEL_ID) return;
  initMetaPixel();
  const w = window as unknown as Record<string, any>;
  if (typeof w.fbq === 'function') w.fbq('track', event, params);
}

/**
 * Dispara Purchase uma única vez por pagamento (dedup via localStorage) —
 * o retorno do checkout pode ser recarregado/revisitado sem inflar conversões.
 * `value` permite reportar o ticket real (mensal 4,90 / anual 44,90).
 */
export function trackPurchaseOnce(dedupKey: string, value: number = SUBSCRIPTION_PRICE): void {
  if (!PIXEL_ID) return;
  const key = `planejix_px_purchase_${dedupKey}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
  } catch {
    // sem localStorage, segue sem dedup
  }
  trackPixel('Purchase', { value, currency: 'BRL' });
}
