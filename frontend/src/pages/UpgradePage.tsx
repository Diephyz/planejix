import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { paymentsAPI } from '../api/api';
import { useToast } from '../context/ToastContext';

const features = [
  { name: 'Dashboard e gráficos', free: true, pro: true, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { name: 'Transações por mês', free: '50', pro: 'Ilimitado', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { name: 'Metas de economia', free: '3', pro: 'Ilimitado', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  { name: 'Relatório PDF', free: false, pro: true, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { name: 'Lembretes por e-mail', free: false, pro: true, icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { name: 'Categorias e orçamento', free: true, pro: true, icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { name: 'Importar/exportar Excel', free: true, pro: true, icon: 'M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

function FeatureIcon({ path }: { path: string }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  );
}

function Check() {
  return (
    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
      <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

function Cross() {
  return (
    <div className="w-5 h-5 rounded-full bg-gray-500/10 flex items-center justify-center flex-shrink-0">
      <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
}

function renderCell(value: boolean | string) {
  if (value === true) return <Check />;
  if (value === false) return <Cross />;
  return <span className="text-xs font-bold text-brand-500 bg-brand-600/15 px-2 py-0.5 rounded-full">{value}</span>;
}

export default function UpgradePage() {
  const { plan, isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isPro = plan === 'pro' || isAdmin;
  const [loading, setLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await paymentsAPI.cancel();
      toast('Assinatura cancelada. Você voltou para o plano Free.');
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      toast('Erro ao cancelar assinatura. Tente novamente.', 'error');
      setCanceling(false);
    }
  };

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'approved') {
      toast('Pagamento aprovado! Seu plano Pro está ativo.');
    } else if (status === 'rejected') {
      toast('Pagamento não aprovado. Tente novamente.', 'error');
    } else if (status === 'pending') {
      toast('Pagamento pendente. Será ativado automaticamente ao confirmar.');
    }
  }, [searchParams, toast]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await paymentsAPI.createPreference();
      window.location.href = res.data.init_point;
    } catch {
      toast('Erro ao iniciar pagamento. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-20 lg:pb-0">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-600/10 text-brand-500 text-xs font-semibold mb-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {isPro ? 'Plano Pro ativo' : 'Compare os planos'}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Planos Planejix</h2>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Escolha o plano ideal para suas necessidades financeiras
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free */}
        <div
          className={`rounded-2xl p-6 transition-all duration-300 bg-white dark:bg-dark-800/50 border border-gray-100 dark:border-white/5 ${!isPro ? 'ring-2 ring-brand-600/50' : ''}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Free</h3>
              <p className="text-xs text-gray-500">Para quem está começando</p>
            </div>
          </div>

          <div className="mb-6">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">R$ 0</span>
            <span className="text-sm text-gray-500 ml-1">/mês</span>
          </div>

          <ul className="space-y-3 mb-6">
            {features.map((f) => (
              <li key={f.name} className="flex items-center gap-3">
                {renderCell(f.free)}
                <FeatureIcon path={f.icon} />
                <span className="text-sm text-gray-600 dark:text-gray-300 flex-1">{f.name}</span>
              </li>
            ))}
          </ul>

          {!isPro && (
            <div className="text-center text-xs text-brand-500 font-semibold bg-brand-600/10 rounded-xl py-2.5">
              Plano atual
            </div>
          )}
        </div>

        {/* Pro */}
        <div
          className={`rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${isPro ? 'ring-2 ring-brand-600/50' : ''}`}
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(5,150,105,0.06) 100%)',
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <div className="absolute -top-1 -right-1">
              <span className="text-gray-900 dark:text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-brand-600/25" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                POPULAR
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pro</h3>
                <p className="text-xs text-gray-400">Controle total</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">R$ 4,90</span>
              <span className="text-sm text-gray-400 ml-1">/mês</span>
            </div>

            <ul className="space-y-3 mb-6">
              {features.map((f) => (
                <li key={f.name} className="flex items-center gap-3">
                  {renderCell(f.pro)}
                  <FeatureIcon path={f.icon} />
                  <span className="text-sm text-gray-200 flex-1">{f.name}</span>
                </li>
              ))}
            </ul>

            {isPro ? (
              <div className="space-y-2">
                <div className="text-center text-xs text-brand-500 font-semibold bg-brand-600/10 rounded-xl py-2.5">
                  Plano atual
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
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-3 rounded-xl text-gray-900 dark:text-white font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Preparando pagamento...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Assinar Pro — R$ 4,90/mês
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment info */}
      {!isPro && (
        <div className="rounded-xl p-4 text-center bg-gray-50 dark:bg-dark-800/30 border border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Pagamento seguro via Mercado Pago · Cancele quando quiser
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Dados seguros', desc: 'Seus dados ficam protegidos e criptografados' },
          { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', title: 'Sem contrato', desc: 'Cancele a qualquer momento sem multa' },
          { icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', title: 'Suporte', desc: 'Atendimento prioritário para plano Pro' },
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
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Cancelar assinatura Pro</h3>
                <p className="text-xs text-gray-500 mt-0.5">Sem multa ou taxas</p>
              </div>
            </div>
            <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-3">
              Ao cancelar, você volta imediatamente para o plano <strong>Free</strong> e perde acesso a:
            </p>
            <ul className="text-[12px] text-gray-500 dark:text-gray-400 space-y-1 mb-5 pl-1">
              <li>· Transações ilimitadas (limite volta a 50/mês)</li>
              <li>· Metas ilimitadas (limite volta a 3)</li>
              <li>· Relatório PDF e lembretes por e-mail</li>
            </ul>
            <p className="text-[12px] text-gray-500 mb-5">Seus dados e transações são preservados.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelOpen(false)}
                disabled={canceling}
                className="btn-secondary flex-1 text-sm"
              >
                Manter Pro
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
