import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

function isMobile() {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone);
}

function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const promptHandler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
    };
    window.addEventListener('beforeinstallprompt', promptHandler);

    if (!isMobile() || isStandalone()) {
      return () => window.removeEventListener('beforeinstallprompt', promptHandler);
    }

    const dismissed = localStorage.getItem('planejix_install_dismissed');
    if (dismissed) {
      const dismissedAt = Number(dismissed);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
        return () => window.removeEventListener('beforeinstallprompt', promptHandler);
      }
    }

    const timer = setTimeout(() => setShow(true), 3000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', promptHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS()) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setShow(false);
      }
      deferredPrompt = null;
    } catch {
      // prompt failed
    }
    setInstalling(false);
  };

  const handleDismiss = () => {
    setShow(false);
    setShowIOSGuide(false);
    localStorage.setItem('planejix_install_dismissed', Date.now().toString());
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={handleDismiss} />
      <div
        className="relative w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 animate-scale-in"
        style={{
          background: '#0E0E18',
          border: '1px solid rgba(16,185,129,0.15)',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.5)',
        }}
      >
        <div className="w-10 h-1 rounded-full bg-gray-600 mx-auto mb-4 sm:hidden" />

        {showIOSGuide ? (
          <div className="text-center">
            <h3 className="text-base font-bold text-white mb-3">Como instalar no iPhone</h3>
            <div className="space-y-3 text-left">
              {[
                { step: '1', text: 'Toque no botão de compartilhar', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
                { step: '2', text: 'Role e toque em "Adicionar à Tela de Início"', icon: 'M12 4v16m8-8H4' },
                { step: '3', text: 'Toque em "Adicionar" para confirmar', icon: 'M5 13l4 4L19 7' },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="w-8 h-8 rounded-lg bg-brand-600/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[11px] text-brand-500 font-bold">Passo {s.step}</span>
                    <p className="text-sm text-gray-300">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleDismiss} className="w-full mt-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
              Entendi
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(16,185,129,0.1)' }}
            >
              <svg className="w-7 h-7 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>

            <h3 className="text-base font-bold text-white mb-1">Baixe o app Planejix!</h3>
            <p className="text-[13px] text-gray-400 leading-relaxed mb-4">
              Instale na sua tela inicial para acesso rápido, notificações e uso offline.
            </p>

            <div className="flex items-center justify-center gap-5 mb-4">
              {[
                { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Rápido' },
                { icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', label: 'Tela inicial' },
                { icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-5A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Notificações' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  </div>
                  <span className="text-[10px] text-gray-500">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={handleInstall}
                disabled={installing}
                className="w-full py-3 rounded-xl text-white font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                }}
              >
                {installing ? 'Instalando...' : isIOS() ? 'Como instalar' : 'Instalar aplicativo'}
              </button>
              <button
                onClick={handleDismiss}
                className="w-full py-2 text-[13px] text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
              >
                Agora não
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
