import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    title: 'Crie suas categorias',
    description: 'Organize seus gastos em categorias como Alimentação, Transporte, Lazer e mais. Cada uma com sua cor.',
    color: '#6366f1',
    link: '/categories',
    cta: 'Criar categorias',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
    title: 'Registre suas transações',
    description: 'Adicione suas entradas e saídas. Pode ser manual ou importando uma planilha Excel.',
    color: '#10B981',
    link: '/transactions',
    cta: 'Adicionar transação',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Defina metas de orçamento',
    description: 'Crie limites de gastos por categoria e acompanhe seu progresso com gráficos em tempo real.',
    color: '#F59E0B',
    link: '/budgets',
    cta: 'Criar metas',
  },
];

export default function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleAction = () => {
    onClose();
    navigate(step.link);
  };

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="" maxWidth="max-w-md">
      <div className="text-center">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === currentStep ? 24 : 8,
                background: i === currentStep ? step.color : 'rgba(255,255,255,0.1)',
              }}
            />
          ))}
        </div>

        {/* Step icon */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-300"
          style={{ background: `${step.color}15`, color: step.color }}
        >
          {step.icon}
        </div>

        {/* Step number */}
        <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: step.color }}>
          Passo {currentStep + 1} de {steps.length}
        </p>

        {/* Title & description */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-xs mx-auto">{step.description}</p>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleAction}
            className="w-full py-3 rounded-xl text-white font-medium text-sm transition-all duration-200 cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)`,
              boxShadow: `0 4px 14px ${step.color}30`,
            }}
          >
            {step.cta}
          </button>
          <button
            onClick={handleNext}
            className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            {isLast ? 'Começar sozinho' : 'Próximo passo'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
