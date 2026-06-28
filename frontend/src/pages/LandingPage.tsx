import { useNavigate } from 'react-router-dom';

const features = [
  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: 'Dashboard inteligente', desc: 'Visualize receitas, despesas e saldo com gráficos interativos e insights automáticos.' },
  { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Saldo acumulativo', desc: 'Saiba exatamente quanto dinheiro você tem. Controle total, como um banco.' },
  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Metas e orçamentos', desc: 'Defina limites por categoria e acompanhe o progresso com barras coloridas.' },
  { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', title: 'Lembretes automáticos', desc: 'Receba alertas de contas vencendo por e-mail e notificações no app.' },
  { icon: 'M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'Importar do Excel', desc: 'Importe suas planilhas e comece a controlar sem redigitar tudo.' },
  { icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', title: 'App instalável', desc: 'Instale na tela inicial do celular. Acesso rápido, como um app nativo.' },
];

function Icon({ d }: { d: string }) {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <img src="/logo.png" alt="Planejix" className="h-12 w-auto" />
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors cursor-pointer">
            Entrar
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium px-4 py-2 rounded-xl text-gray-900 dark:text-white cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            Começar grátis
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-20 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mb-6">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Carteira inteligente para suas finanças
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Controle suas finanças<br />
          <span className="text-emerald-600">de forma simples</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          O Planejix reúne todas as suas receitas, despesas e metas em um dashboard intuitivo. Saiba exatamente para onde vai seu dinheiro.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => navigate('/login')}
            className="text-base font-medium px-8 py-3.5 rounded-xl text-gray-900 dark:text-white cursor-pointer transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
          >
            Começar agora — R$ 4,90/mês
          </button>
          <a href="#features" className="text-base font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1">
            Ver funcionalidades
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-6 mt-12 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(i => (
              <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-1 text-gray-500">5.0</span>
          </div>
          <span className="text-gray-700 dark:text-gray-300">|</span>
          <span>Seguro com criptografia</span>
          <span className="text-gray-700 dark:text-gray-300">|</span>
          <span>Cancele quando quiser</span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tudo que você precisa para organizar suas finanças</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Ferramentas poderosas em uma interface simples e bonita.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 cursor-default">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Icon d={f.icon} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Simples e acessível</h2>
          <p className="text-gray-500 mb-12">Um único plano com acesso completo a todas as funcionalidades.</p>

          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-xl shadow-emerald-500/5 max-w-md mx-auto">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mb-6">
              Acesso completo
            </div>
            <div className="mb-6">
              <span className="text-5xl font-bold text-gray-900">R$ 4,90</span>
              <span className="text-gray-400 ml-1">/mês</span>
            </div>
            <ul className="text-left space-y-3 mb-8">
              {[
                'Transações ilimitadas',
                'Metas de economia ilimitadas',
                'Dashboard com gráficos e insights',
                'Relatório PDF mensal',
                'Lembretes por e-mail',
                'Importar/exportar Excel',
                'Assistente financeiro com IA',
                'App instalável (PWA)',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/login')}
              className="w-full text-base font-medium py-3.5 rounded-xl text-gray-900 dark:text-white cursor-pointer transition-all hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
            >
              Começar agora
            </button>
            <p className="text-xs text-gray-400 mt-3">Cancele a qualquer momento. Sem compromisso.</p>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Pronto para controlar suas finanças?</h2>
          <p className="text-gray-500 mb-8">Junte-se a milhares de pessoas que já organizam seus gastos com o Planejix.</p>
          <button
            onClick={() => navigate('/login')}
            className="text-base font-medium px-8 py-3.5 rounded-xl text-gray-900 dark:text-white cursor-pointer transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
          >
            Criar minha conta
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Planejix" className="h-8 w-auto" />
            <span className="text-sm text-gray-400">Diephyz Corporation ©</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacidade</a>
            <a href="/terms" className="hover:text-gray-600 transition-colors">Termos</a>
            <a href="mailto:jeffbonis@gmail.com" className="hover:text-gray-600 transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
