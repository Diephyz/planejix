import { useState, useEffect } from 'react';
import { localToday } from '../../lib/expenseStatus';

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

// Frequência: no máximo 2 exibições por dia (1 por carregamento de página).
// Instalou (ou tocou em instalar) → nunca mais aparece.
const FREQ_KEY = 'planejix_install_prompts';
const DONE_KEY = 'planejix_install_done';

function canShowToday(): boolean {
  try {
    if (localStorage.getItem(DONE_KEY)) return false;
    const raw = localStorage.getItem(FREQ_KEY);
    if (!raw) return true;
    const data = JSON.parse(raw) as { date: string; count: number };
    return data.date !== localToday() || data.count < 2;
  } catch {
    return true;
  }
}

function registerShow() {
  try {
    const today = localToday();
    const raw = localStorage.getItem(FREQ_KEY);
    const data = raw ? (JSON.parse(raw) as { date: string; count: number }) : null;
    const count = data && data.date === today ? data.count + 1 : 1;
    localStorage.setItem(FREQ_KEY, JSON.stringify({ date: today, count }));
  } catch { /* segue sem contar */ }
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
    const installedHandler = () => {
      try { localStorage.setItem(DONE_KEY, Date.now().toString()); } catch { /* ok */ }
      setShow(false);
    };
    window.addEventListener('beforeinstallprompt', promptHandler);
    window.addEventListener('appinstalled', installedHandler);

    const cleanup = () => {
      window.removeEventListener('beforeinstallprompt', promptHandler);
      window.removeEventListener('appinstalled', installedHandler);
    };

    if (!isMobile() || isStandalone() || !canShowToday()) return cleanup;

    const timer = setTimeout(() => {
      setShow(true);
      registerShow();
    }, 3000);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS()) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      // Chrome ainda não ofereceu o prompt nativo: mostra o caminho manual
      setShowIOSGuide(true);
      return;
    }
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        try { localStorage.setItem(DONE_KEY, Date.now().toString()); } catch { /* ok */ }
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
  };

  if (!show) return null;

  const ios = isIOS();

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleDismiss} />
      <div className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden animate-scale-in bg-white dark:bg-dark-900 shadow-2xl">

        {showIOSGuide ? (
          <div className="p-5 text-center">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">
              {ios ? 'Como instalar no iPhone' : 'Como instalar'}
            </h3>
            <div className="space-y-3 text-left">
              {(ios
                ? [
                    { step: '1', text: 'Toque no botão de compartilhar (quadrado com seta)', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
                    { step: '2', text: 'Role e toque em "Adicionar à Tela de Início"', icon: 'M12 4v16m8-8H4' },
                    { step: '3', text: 'Toque em "Adicionar" para confirmar', icon: 'M5 13l4 4L19 7' },
                  ]
                : [
                    { step: '1', text: 'Toque no menu ⋮ do navegador (canto superior)', icon: 'M12 5v.01M12 12v.01M12 19v.01' },
                    { step: '2', text: 'Toque em "Adicionar à tela inicial" ou "Instalar app"', icon: 'M12 4v16m8-8H4' },
                    { step: '3', text: 'Confirme — o Planejix vira um app no seu celular', icon: 'M5 13l4 4L19 7' },
                  ]
              ).map((s) => (
                <div key={s.step} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03]">
                  <div className="w-8 h-8 rounded-lg bg-brand-600/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[11px] text-brand-500 font-bold">Passo {s.step}</span>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleDismiss} className="w-full mt-4 py-2.5 text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
              Entendi
            </button>
          </div>
        ) : (
          <>
            {/* Banner gradiente com celular ilustrado */}
            <div
              className="relative px-6 pt-7 pb-16 text-center overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 55%, #34d399 100%)' }}
            >
              {/* círculos decorativos */}
              <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute top-10 -right-10 w-40 h-40 rounded-full bg-white/[0.07]" />
              <div className="absolute bottom-2 left-8 w-6 h-6 rounded-full bg-white/15" />

              <span className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold tracking-wide uppercase mb-4 backdrop-blur-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Grátis · leva 10 segundos
              </span>
              <h3 className="relative text-xl font-extrabold text-white leading-snug" style={{ textWrap: 'balance' } as never}>
                Leve o Planejix<br />no seu bolso
              </h3>
            </div>

            {/* celular "saindo" do banner */}
            <div className="relative -mt-12 mx-auto w-20 h-20 rounded-[1.4rem] bg-white dark:bg-dark-800 shadow-xl border border-gray-100 dark:border-white/10 flex items-center justify-center">
              <img src="/logo.png" alt="" className="h-12 w-auto" />
            </div>

            <div className="px-6 pt-4 pb-6 text-center">
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                Instale na tela inicial e abra como um app de verdade:
                rápido, com lembretes e funcionando até offline.
              </p>

              <div className="flex items-center justify-center gap-2 mb-5">
                {[
                  { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Abre na hora' },
                  { icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-5A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Lembretes' },
                  { icon: 'M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656m-6.364 9.192a9 9 0 010-12.728m3.536 3.536a4 4 0 010 5.656', label: 'Offline' },
                ].map((item) => (
                  <span key={item.label} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.label}
                  </span>
                ))}
              </div>

              <button
                onClick={handleInstall}
                disabled={installing}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-[15px] transition-all duration-200 cursor-pointer disabled:opacity-50 active:scale-[0.98] animate-pulse-slow"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: '0 6px 20px rgba(16,185,129,0.45)',
                }}
              >
                {installing ? 'Instalando...' : ios ? 'Ver como instalar' : 'Instalar aplicativo'}
              </button>
              <button
                onClick={handleDismiss}
                className="w-full py-2.5 mt-1 text-[13px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
              >
                Agora não
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
