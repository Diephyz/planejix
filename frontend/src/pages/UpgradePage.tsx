import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { paymentsAPI } from '../api/api';
import { useToast } from '../context/ToastContext';
import { trackPixel, trackPurchaseOnce } from '../lib/metaPixel';

const FEATURES = [
  { name: 'Dashboard completo com gráficos e insights', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { name: 'Transações ilimitadas', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { name: 'Metas de economia ilimitadas', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  { name: 'Relatório PDF mensal', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { name: 'Lembretes de vencimento por e-mail', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { name: 'Categorias e orçamentos personalizados', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { name: 'Importação e exportação Excel', icon: 'M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { name: 'Assistente financeiro inteligente', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { name: 'Suporte prioritário via WhatsApp', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
];

export default function UpgradePage() {
  const { plan, isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isPro = plan === 'pro' || isAdmin;
  const isExpired = plan === 'expired' && !isAdmin;
  const [loading, setLoading] = useState<'pix' | 'card' | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  // Anual em destaque por padrão (R$ 44,90 = R$ 3,74/mês, 24% off)
  const [period, setPeriod] = useState<'monthly' | 'annual'>('annual');
  const annual = period === 'annual';
  const priceLabel = annual ? 'R$ 44,90' : 'R$ 4,90';
  const priceSuffix = annual ? '/ano' : '/mês';

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'approved') {
      toast('Pagamento aprovado! Sua assinatura está ativa.');
      const pid = searchParams.get('payment_id') || searchParams.get('collection_id') || searchParams.get('preapproval_id');
      const value = searchParams.get('period') === 'annual' ? 44.9 : 4.9;
      trackPurchaseOnce(pid || `upgrade-${new Date().toISOString().slice(0, 10)}`, value);
    } else if (status === 'rejected') {
      toast('Pagamento não aprovado. Tente novamente.', 'error');
    } else if (status === 'pending') {
      toast('Pagamento pendente. Será ativado automaticamente ao confirmar.');
    }
  }, [searchParams, toast]);

  const handlePix = async () => {
    setLoading('pix');
    trackPixel('InitiateCheckout');
    try {
      const res = await paymentsAPI.createPreference(period);
      window.location.href = res.data.init_point;
    } catch {
      toast('Erro ao iniciar pagamento. Tente novamente.', 'error');
      setLoading(null);
    }
  };

  const handleCard = async () => {
    setLoading('card');
    trackPixel('InitiateCheckout');
    try {
      const res = await paymentsAPI.subscribe(period);
      window.location.href = res.data.init_point;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast(msg || 'Erro ao iniciar assinatura. Tente novamente.', 'error');
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await paymentsAPI.cancel();
      toast('Assinatura cancelada. Seus dados estão preservados.');
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      toast('Erro ao cancelar assinatura. Tente novamente.', 'error');
      setCanceling(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-20 lg:pb-0">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-600/10 text-brand-500 text-xs font-semibold mb-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {isPro ? 'Assinatura ativa' : 'Planejix Pro'}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Um plano. Tudo incluso.</h2>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Controle financeiro completo por menos que um cafezinho por mês
        </p>
      </div>

      {isExpired && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm bg-amber-50 dark:bg-yellow-900/30 border border-amber-300 dark:border-yellow-700 text-amber-700 dark:text-yellow-400">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span><strong>Seu acesso expirou.</strong> Renove abaixo para continuar — seus dados estão todos preservados.</span>
        </div>
      )}

      {/* Toggle Mensal / Anual */}
      {!isPro && (
        <div className="flex items-center justify-center">
          <div className="inline-flex rounded-xl p-1 bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/10">
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                !annual ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setPeriod('annual')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                annual ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Anual
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">-24%</span>
            </button>
          </div>
        </div>
      )}

      {/* Card Pro único */}
      <div
        className="rounded-2xl p-6 sm:p-8 relative overflow-hidden ring-2 ring-brand-600/40"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(5,150,105,0.06) 100%)',
          border: '1px solid rgba(16,185,129,0.2)',
        }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-600/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-accent-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-600/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Planejix Pro</h3>
                <p className="text-xs text-gray-400">Acesso completo, sem limitações</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">{priceLabel}</span>
              <span className="text-sm text-gray-400 ml-1">{priceSuffix}</span>
              {annual && !isPro && (
                <p className="text-[11px] text-emerald-500 font-medium mt-0.5">equivale a R$ 3,74/mês · 2 meses e meio grátis</p>
              )}
            </div>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-8">
            {FEATURES.map((f) => (
              <li key={f.name} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-200">{f.name}</span>
              </li>
            ))}
          </ul>

          {isPro ? (
            <div className="space-y-2">
              <div className="text-center text-sm text-brand-500 font-semibold bg-brand-600/10 rounded-xl py-3">
                ✓ Sua assinatura está ativa
              </div>
              {plan === 'pro' && !isAdmin && (
                <button
                  onClick={() => setCancelOpen(true)}
                  className="w-full text-center text-[11px] text-gray-500 hover:text-red-500 transition-colors cursor-pointer py-1"
                >
                  Cancelar assinatura
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleCard}
                disabled={loading !== null}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 hover:opacity-95"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                }}
              >
                {loading === 'card' ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Preparando assinatura...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Assinar no cartão — {priceLabel}{priceSuffix}
                  </span>
                )}
              </button>
              <p className="text-center text-[11px] text-gray-500 -mt-1">Renovação automática · cancele quando quiser</p>

              <button
                onClick={handlePix}
                disabled={loading !== null}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 border-2 border-brand-500/40 text-brand-600 dark:text-brand-400 hover:bg-brand-600/10"
              >
                {loading === 'pix' ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-brand-400/40 border-t-brand-500 rounded-full animate-spin" />
                    Preparando Pix...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Pagar com Pix — {priceLabel} por {annual ? '1 ano' : '30 dias'}
                  </span>
                )}
              </button>
              <p className="text-center text-[11px] text-gray-500 -mt-1">Sem renovação automática · avisamos por e-mail quando estiver perto de vencer</p>
            </div>
          )}

          {!isPro && (
            <div className="flex items-center justify-center gap-3 text-xs text-gray-500 mt-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Pagamento seguro via Mercado Pago · Cancele quando quiser
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Dados seguros', desc: 'Seus dados ficam protegidos e criptografados' },
          { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', title: 'Sem contrato', desc: 'Cancele a qualquer momento sem multa' },
          { icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', title: 'Suporte', desc: 'Atendimento prioritário via WhatsApp' },
        ].map((item) => (
          <div key={item.title} className="rounded-xl p-4 text-center bg-gray-50 dark:bg-dark-800/30 border border-gray-100 dark:border-white/5">
            <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-brand-600/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Modal: Cancelar assinatura */}
      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !canceling && setCancelOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6 animate-scale-in bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Cancelar assinatura</h3>
                <p className="text-xs text-gray-500 mt-0.5">Sem multa ou taxas</p>
              </div>
            </div>
            <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-3">
              Ao cancelar, sua assinatura é encerrada imediatamente e você perde o acesso aos recursos do Planejix Pro.
            </p>
            <p className="text-[12px] text-gray-500 mb-5">Seus dados e transações ficam preservados caso decida voltar.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelOpen(false)}
                disabled={canceling}
                className="btn-secondary flex-1 text-sm"
              >
                Manter assinatura
              </button>
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="flex-1 text-sm py-2.5 rounded-xl font-medium text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              >
                {canceling ? 'Cancelando...' : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
