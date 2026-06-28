import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('planejix_lgpd_consent');
    if (!consent) {
      setTimeout(() => setShow(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('planejix_lgpd_consent', Date.now().toString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 lg:bottom-4 lg:left-4 lg:right-auto lg:max-w-md">
      <div className="rounded-2xl p-4 sm:p-5 animate-scale-in bg-white dark:bg-dark-900 border border-gray-200 dark:border-emerald-900/30 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-brand-600/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-emerald-600 dark:text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Utilizamos armazenamento local para manter seu login e preferências.
              Ao continuar, você concorda com nossa{' '}
              <Link to="/privacy" className="text-emerald-600 dark:text-brand-500 underline">Política de Privacidade</Link>
              {' '}e{' '}
              <Link to="/terms" className="text-emerald-600 dark:text-brand-500 underline">Termos de Uso</Link>.
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={handleAccept} className="btn-primary text-sm px-4 py-2">
                Aceitar e continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
