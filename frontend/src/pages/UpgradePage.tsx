import { useAuth } from '../context/AuthContext';

const features = [
  { name: 'Dashboard e gráficos', free: true, pro: true },
  { name: 'Transações por mês', free: '50', pro: 'Ilimitado' },
  { name: 'Metas de economia', free: '3', pro: 'Ilimitado' },
  { name: 'Relatório PDF', free: false, pro: true },
  { name: 'Lembretes por e-mail', free: false, pro: true },
  { name: 'Categorias e orçamento', free: true, pro: true },
  { name: 'Importar/exportar Excel', free: true, pro: true },
];

function Check() {
  return (
    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function Cross() {
  return (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function renderCell(value: boolean | string) {
  if (value === true) return <Check />;
  if (value === false) return <Cross />;
  return <span className="text-sm font-medium text-white">{value}</span>;
}

export default function UpgradePage() {
  const { plan } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Planos Planejix</h2>
        <p className="text-sm text-gray-400 mt-1">
          Você está no plano <span className={`font-bold ${plan === 'pro' ? 'text-brand-400' : 'text-gray-300'}`}>{plan === 'pro' ? 'Pro' : 'Free'}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free */}
        <div className={`rounded-2xl p-6 border ${plan === 'free' ? 'border-brand-500/50 bg-brand-500/5' : 'border-dark-600 bg-dark-800'}`}>
          <h3 className="text-lg font-bold text-white">Free</h3>
          <p className="text-3xl font-bold text-white mt-2">R$ 0<span className="text-sm font-normal text-gray-500">/mês</span></p>
          <p className="text-sm text-gray-400 mt-1">Para começar a organizar suas finanças</p>
          <ul className="mt-6 space-y-3">
            {features.map((f) => (
              <li key={f.name} className="flex items-center gap-3">
                {renderCell(f.free)}
                <span className="text-sm text-gray-300">{f.name}</span>
              </li>
            ))}
          </ul>
          {plan === 'free' && (
            <div className="mt-6 text-center text-xs text-brand-400 font-semibold bg-brand-500/10 rounded-lg py-2">Plano atual</div>
          )}
        </div>

        {/* Pro */}
        <div className={`rounded-2xl p-6 border ${plan === 'pro' ? 'border-brand-500/50 bg-brand-500/5' : 'border-dark-600 bg-dark-800'} relative overflow-hidden`}>
          <div className="absolute top-3 right-3 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">POPULAR</div>
          <h3 className="text-lg font-bold text-white">Pro</h3>
          <p className="text-3xl font-bold text-white mt-2">Pro<span className="text-sm font-normal text-gray-500">/mês</span></p>
          <p className="text-sm text-gray-400 mt-1">Controle total das suas finanças</p>
          <ul className="mt-6 space-y-3">
            {features.map((f) => (
              <li key={f.name} className="flex items-center gap-3">
                {renderCell(f.pro)}
                <span className="text-sm text-gray-300">{f.name}</span>
              </li>
            ))}
          </ul>
          {plan === 'pro' ? (
            <div className="mt-6 text-center text-xs text-brand-400 font-semibold bg-brand-500/10 rounded-lg py-2">Plano atual</div>
          ) : (
            <div className="mt-6 text-center text-xs text-gray-400 bg-dark-700 rounded-lg py-2">
              Entre em contato com o administrador para fazer upgrade
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
