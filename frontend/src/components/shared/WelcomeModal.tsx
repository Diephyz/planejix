import { useNavigate } from 'react-router-dom';
import Modal from './Modal';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
    title: 'Registre suas transações',
    description: 'Cadastre entradas e saídas para acompanhar suas finanças',
    color: '#6366f1',
    link: '/transactions',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Defina metas de orçamento',
    description: 'Crie limites por categoria e monitore seus gastos',
    color: '#22c55e',
    link: '/budgets',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Crie metas de economia',
    description: 'Poupe para objetivos como viagens, reservas e sonhos',
    color: '#10b981',
    link: '/savings',
  },
];

export default function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const navigate = useNavigate();

  const handleClick = (link: string) => {
    onClose();
    navigate(link);
  };

  return (
    <Modal open={open} onClose={onClose} title="" maxWidth="max-w-lg">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Bem-vindo ao Planejix!</h2>
        <p className="text-sm text-gray-400 mt-1">Comece a organizar suas finanças em 3 passos simples</p>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <button
            key={i}
            onClick={() => handleClick(step.link)}
            className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] text-left"
            style={{
              background: `${step.color}08`,
              border: `1px solid ${step.color}20`,
            }}
          >
            <div
              className="p-2.5 rounded-xl flex-shrink-0"
              style={{ backgroundColor: `${step.color}15`, color: step.color }}
            >
              {step.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{step.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
            </div>
            <svg className="w-5 h-5 text-gray-500 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      <button
        onClick={onClose}
        className="w-full mt-5 text-sm text-gray-500 hover:text-gray-300 transition-colors py-2"
      >
        Pular por enquanto
      </button>
    </Modal>
  );
}
