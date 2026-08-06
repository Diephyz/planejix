import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: 'Dashboard inteligente', desc: 'Gráficos interativos, KPIs com sparklines e insights automáticos sobre seus gastos.' },
  { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Saldo acumulativo', desc: 'Saiba exatamente quanto tem, como um banco. Com olhinho para esconder o valor.' },
  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Metas e orçamentos', desc: 'Defina limites por categoria e veja barras de progresso em tempo real.' },
  { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', title: 'Assistente financeiro IA', desc: 'Pergunte "quanto gastei?" e receba respostas instantâneas baseadas nos seus dados.' },
  { icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-5A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', title: 'Lembretes automáticos', desc: 'Notificações de contas vencendo. Nunca mais pague multa por esquecimento.' },
  { icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', title: 'App no celular', desc: 'Instale na tela inicial. Funciona offline, como um app nativo.' },
];

const testimonials = [
  {
    name: 'Mariana S.',
    role: 'Empreendedora',
    text: 'Eu vivia perdida com minhas contas. O Planejix me mostrou que eu gastava 40% do meu salário com coisas desnecessárias. Em 2 meses economizei R$ 1.200.',
    rating: 5,
    avatar: 'M',
    color: '#ec4899',
  },
  {
    name: 'Carlos R.',
    role: 'Desenvolvedor',
    text: 'Já testei vários apps de finanças. O Planejix é o único que não complica. Abro, registro, vejo o gráfico. O assistente IA é genial — pergunto e ele responde na hora.',
    rating: 5,
    avatar: 'C',
    color: '#6366f1',
  },
  {
    name: 'Ana Paula F.',
    role: 'Professora',
    text: 'O saldo acumulativo mudou minha vida. Antes eu achava que estava bem, mas na verdade estava no vermelho há 3 meses sem perceber. Agora tenho controle total.',
    rating: 5,
    avatar: 'A',
    color: '#10B981',
  },
  {
    name: 'Lucas M.',
    role: 'Freelancer',
    text: 'Como freelancer minha renda varia muito. O Planejix me ajuda a planejar os meses fracos. A projeção de cashflow é perfeita pra isso.',
    rating: 5,
    avatar: 'L',
    color: '#F59E0B',
  },
];

const problems = [
  { before: 'Não sei pra onde vai meu dinheiro', after: 'Dashboard mostra cada centavo por categoria' },
  { before: 'Planilha é complicada demais', after: 'Interface intuitiva, zero planilha' },
  { before: 'Esqueço de pagar contas', after: 'Lembretes automáticos por e-mail e no app' },
  { before: 'Não consigo economizar', after: 'Metas visuais com progresso em tempo real' },
];

const faqs = [
  { q: 'Preciso colocar dados do meu banco?', a: 'Não. O Planejix não se conecta ao seu banco. Você registra manualmente ou importa do Excel. Seus dados bancários nunca são solicitados.' },
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Sem contrato, sem multa. Cancele quando quiser e seu acesso continua até o fim do período pago.' },
  { q: 'Meus dados estão seguros?', a: 'Sim. Senhas criptografadas com bcrypt, comunicação via HTTPS, headers de segurança, e seus dados nunca são compartilhados com terceiros.' },
  { q: 'Funciona no celular?', a: 'Sim. O Planejix é um app instalável (PWA). Funciona no iPhone e Android direto do navegador, com acesso offline.' },
  { q: 'Tem versão gratuita?', a: 'O acesso completo custa apenas R$ 4,90/mês — ou R$ 44,90/ano, que sai por R$ 3,74/mês (24% de economia). Sem limitações, sem anúncios, todas as funcionalidades inclusas.' },
];

function Icon({ d }: { d: string }) {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  );
}

function StarRating() {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function CtaButton({ text, navigate: nav }: { text: string; navigate: (path: string) => void }) {
  return (
    <button
      onClick={() => nav('/login')}
      className="text-base font-medium px-8 py-3.5 rounded-xl text-white cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
      style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
    >
      {text}
    </button>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  // Lightbox: print clicado abre ampliado para análise
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoom(null); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [zoom]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-6xl mx-auto">
        <img src="/logo.png" alt="Planejix" className="h-10 sm:h-12 w-auto" />
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors cursor-pointer hidden sm:block">
            Entrar
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium px-4 py-2 rounded-xl text-white cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            Começar agora
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 max-w-6xl mx-auto text-center">
        <img src="/logo-landing.png" alt="Planejix" className="h-48 sm:h-64 w-auto mx-auto mb-8" />
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mb-6 border border-emerald-100">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Mais de 500 pessoas já organizam suas finanças
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Pare de perder dinheiro.<br />
          <span className="text-emerald-600">Comece a controlar.</span>
        </h1>
        <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          O Planejix mostra exatamente para onde vai cada centavo do seu dinheiro, te avisa antes das contas vencerem e te ajuda a economizar de verdade.
        </p>
        <div className="flex flex-col items-center gap-2 mb-6">
          <CtaButton text="Começar por R$ 4,90/mês" navigate={navigate} />
          <span className="text-xs text-emerald-700 font-medium">ou R$ 44,90/ano — economize 24%</span>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400 flex-wrap">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Sem contrato
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Cancele quando quiser
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Dados criptografados
          </span>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="bg-white border-y border-gray-100 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-8 sm:gap-12 flex-wrap px-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">500+</p>
            <p className="text-xs text-gray-500">Usuários ativos</p>
          </div>
          <div className="w-px h-8 bg-gray-200 hidden sm:block" />
          <div>
            <p className="text-2xl font-bold text-gray-900">R$ 2M+</p>
            <p className="text-xs text-gray-500">Controlados no app</p>
          </div>
          <div className="w-px h-8 bg-gray-200 hidden sm:block" />
          <div>
            <p className="text-2xl font-bold text-gray-900">4.9</p>
            <div className="text-xs text-gray-500 flex items-center gap-1"><StarRating /></div>
          </div>
          <div className="w-px h-8 bg-gray-200 hidden sm:block" />
          <div>
            <p className="text-2xl font-bold text-gray-900">99.9%</p>
            <p className="text-xs text-gray-500">Uptime</p>
          </div>
        </div>
      </section>

      {/* Product screenshots — prova visual com dados demo */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4 border border-emerald-100 bg-emerald-50 text-emerald-700">
              Feito para o seu dinheiro render
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Veja o Planejix por dentro</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Interface real do app — saldo acumulativo, gráficos, metas e lembretes em um visual que dá gosto de abrir todo dia.</p>
          </div>

          {/* Print principal: dashboard em moldura de navegador */}
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-gray-900/15 ring-1 ring-gray-900/5 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a24]">
              <span className="w-3 h-3 rounded-full bg-red-400/80" />
              <span className="w-3 h-3 rounded-full bg-amber-400/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
              <span className="ml-3 text-[11px] text-gray-400 bg-white/5 rounded-md px-3 py-1 hidden sm:block">planejix.com.br</span>
            </div>
            <img
              src="/screenshots/dashboard-desktop.jpeg"
              alt="Dashboard do Planejix com saldo total, insights automáticos e gráfico de evolução anual"
              width={1440} height={900}
              loading="lazy"
              className="w-full h-auto block cursor-zoom-in"
              title="Clique para ampliar"
              onClick={() => setZoom({ src: '/screenshots/dashboard-desktop.jpeg', alt: 'Dashboard do Planejix com saldo total, insights automáticos e gráfico de evolução anual' })}
            />
          </div>

          {/* Prints secundários + mobile: janelas de app de cada lado, celular ao centro — cena de uso real */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 mt-12 max-w-5xl mx-auto md:items-center">
            <figure className="md:translate-x-5 md:z-0">
              <div className="rounded-xl overflow-hidden shadow-xl shadow-gray-900/20 ring-1 ring-gray-900/5 md:rotate-[-4deg]">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a24]">
                  <span className="w-2 h-2 rounded-full bg-red-400/80" />
                  <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
                </div>
                <img
                  src="/screenshots/transacoes-desktop.jpeg"
                  alt="Lista de transações do Planejix com filtros e exportação para Excel"
                  width={1440} height={900}
                  loading="lazy"
                  className="w-full h-auto block cursor-zoom-in"
                  title="Clique para ampliar"
                  onClick={() => setZoom({ src: '/screenshots/transacoes-desktop.jpeg', alt: 'Lista de transações do Planejix com filtros e exportação para Excel' })}
                />
              </div>
              <figcaption className="text-xs text-gray-500 mt-4 text-center">Transações com filtros e exportação para Excel</figcaption>
            </figure>
            <div className="flex flex-col items-center md:z-10">
              <div className="rounded-[2rem] overflow-hidden border-[6px] border-[#1a1a24] shadow-2xl shadow-gray-900/25 max-w-[280px] sm:max-w-[300px] bg-[#1a1a24]">
                <img
                  src="/screenshots/dashboard-mobile.jpeg"
                  alt="Planejix no celular: dashboard responsivo instalável como aplicativo"
                  width={390} height={844}
                  loading="lazy"
                  className="w-full h-auto block rounded-[1.6rem] cursor-zoom-in"
                  title="Clique para ampliar"
                  onClick={() => setZoom({ src: '/screenshots/dashboard-mobile.jpeg', alt: 'Planejix no celular: dashboard responsivo instalável como aplicativo' })}
                />
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">No celular é app de verdade: instale na tela inicial, use até offline</p>
            </div>
            <figure className="md:-translate-x-5 md:z-0">
              <div className="rounded-xl overflow-hidden shadow-xl shadow-gray-900/20 ring-1 ring-gray-900/5 md:rotate-[4deg]">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a24]">
                  <span className="w-2 h-2 rounded-full bg-red-400/80" />
                  <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
                </div>
                <img
                  src="/screenshots/economia-desktop.jpeg"
                  alt="Metas de economia do Planejix com progresso circular"
                  width={1440} height={900}
                  loading="lazy"
                  className="w-full h-auto block cursor-zoom-in"
                  title="Clique para ampliar"
                  onClick={() => setZoom({ src: '/screenshots/economia-desktop.jpeg', alt: 'Metas de economia do Planejix com progresso circular' })}
                />
              </div>
              <figcaption className="text-xs text-gray-500 mt-4 text-center">Metas de economia com progresso visual</figcaption>
            </figure>
          </div>

          <p className="text-[11px] text-gray-400 mt-8 text-center">Capturas de tela reais do produto, com dados de demonstração.</p>
        </div>
      </section>

      {/* Before/After — Pain points */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Chega de não saber para onde vai o seu dinheiro</h2>
          <p className="text-gray-500">Veja como o Planejix resolve os problemas mais comuns</p>
        </div>
        <div className="space-y-3">
          {problems.map((p, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-4">
              <div className="flex-1 p-4 rounded-xl bg-red-50 border border-red-100">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-xs font-medium text-red-600 uppercase">Antes</span>
                </div>
                <p className="text-sm text-red-800">{p.before}</p>
              </div>
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-300 rotate-90 sm:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="flex-1 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-medium text-emerald-700 uppercase">Com Planejix</span>
                </div>
                <p className="text-sm text-emerald-800">{p.after}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Tudo que você precisa em um só lugar</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Ferramentas poderosas em uma interface que qualquer pessoa consegue usar.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((f) => (
              <div key={f.title} className="p-5 sm:p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Icon d={f.icon} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Quem usa, recomenda</h2>
            <p className="text-gray-500">Veja o que nossos usuários dizem sobre o Planejix</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <StarRating />
                <p className="text-sm text-gray-600 leading-relaxed mt-3 mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: t.color }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Comece em 3 minutos</h2>
            <p className="text-gray-500">Sem complicação, sem burocracia</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: '1', title: 'Crie sua conta', desc: 'Cadastro rápido com e-mail ou Google. Leva menos de 1 minuto.', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
              { step: '2', title: 'Registre seus gastos', desc: 'Adicione transações manualmente ou importe do Excel. Simples assim.', icon: 'M12 4v16m8-8H4' },
              { step: '3', title: 'Veja os resultados', desc: 'Dashboard com gráficos, insights e o assistente IA te mostra onde economizar.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <Icon d={s.icon} />
                </div>
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white text-sm font-bold mb-3">{s.step}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <CtaButton text="Criar minha conta agora" navigate={navigate} />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-gray-50">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Menos que um café por mês</h2>
          <p className="text-gray-500 mb-10">Acesso completo a todas as funcionalidades por um preço justo.</p>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl shadow-emerald-500/5 text-left">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mb-4">
                Acesso completo — sem limitações
              </div>
              <div>
                <span className="text-5xl font-bold text-gray-900">R$ 4,90</span>
                <span className="text-gray-400 ml-1">/mês</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Menos que um café no Starbucks</p>
              <p className="text-sm text-emerald-700 font-medium mt-2 inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                ou R$ 44,90/ano — economize 24%
              </p>
            </div>

            <ul className="space-y-2.5 mb-6">
              {[
                'Transações ilimitadas',
                'Saldo acumulativo estilo banco',
                'Dashboard com gráficos e donut chart',
                'Assistente financeiro com IA',
                'Metas de economia ilimitadas',
                'Relatório PDF mensal',
                'Lembretes por e-mail',
                'Importar/exportar Excel',
                'App instalável (PWA)',
                'Conquistas e insights automáticos',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate('/login')}
              className="w-full text-base font-medium py-3.5 rounded-xl text-white cursor-pointer transition-all hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
            >
              Começar agora
            </button>
            <p className="text-xs text-gray-400 mt-3 text-center">Pagamento seguro via Mercado Pago. Cancele quando quiser.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Perguntas frequentes</h2>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900 pr-4">{faq.q}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-emerald-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Pronto para tomar controle do seu dinheiro?</h2>
          <p className="text-emerald-100 mb-8 max-w-lg mx-auto">Junte-se a centenas de pessoas que já pararam de perder dinheiro e começaram a construir patrimônio com o Planejix.</p>
          <button
            onClick={() => navigate('/login')}
            className="text-base font-medium px-8 py-3.5 rounded-xl bg-white text-emerald-700 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            Criar minha conta — R$ 4,90/mês
          </button>
          <p className="text-sm text-white font-medium mt-3">ou R$ 44,90/ano (economize 24%)</p>
          <p className="text-xs text-emerald-200 mt-2">Sem contrato. Cancele a qualquer momento. Garantia de 7 dias.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-8 bg-gray-900">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Planejix" className="h-8 w-auto brightness-200" />
            <span className="text-sm text-gray-500">Diephyz Corporation ©</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <a href="/privacy" className="hover:text-gray-300 transition-colors">Privacidade</a>
            <a href="/terms" className="hover:text-gray-300 transition-colors">Termos</a>
            <a href="mailto:jeffbonis@gmail.com" className="hover:text-gray-300 transition-colors">Contato</a>
          </div>
        </div>
      </footer>

      {/* Lightbox: print ampliado para análise — fecha com clique, X ou Esc */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-10 cursor-zoom-out animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={zoom.alt}
          onClick={() => setZoom(null)}
        >
          <button
            onClick={() => setZoom(null)}
            aria-label="Fechar imagem ampliada"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <figure className="max-w-6xl w-full max-h-full flex flex-col items-center gap-3">
            <img
              src={zoom.src}
              alt={zoom.alt}
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-xl shadow-2xl"
            />
            <figcaption className="text-sm text-gray-300 text-center">{zoom.alt}</figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
