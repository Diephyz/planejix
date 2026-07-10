import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

export default function GoogleLoginButton() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'COLE_SEU_CLIENT_ID_AQUI') return;

    const init = () => {
      if (!window.google || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            const res = await authAPI.googleLogin(response.credential);
            login(res.data.token, res.data.user);
            navigate('/dashboard');
          } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            toast(msg || 'Erro ao autenticar com Google', 'error');
          }
        },
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: btnRef.current.offsetWidth || 400,
        text: 'continue_with',
        locale: 'pt_BR',
      });
    };

    // Script may already be loaded or still loading
    if (window.google) {
      init();
    } else {
      const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (script) {
        script.addEventListener('load', init);
        return () => script.removeEventListener('load', init);
      }
    }
  }, [login, navigate]);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId || clientId === 'COLE_SEU_CLIENT_ID_AQUI') {
    return (
      <div className="text-xs text-yellow-500 bg-yellow-900/20 border border-yellow-800 rounded-lg px-3 py-2 text-center">
        Configure o Google Client ID no arquivo <code className="font-mono">frontend/.env</code> para ativar o login com Google.
      </div>
    );
  }

  return <div ref={btnRef} className="w-full" />;
}
