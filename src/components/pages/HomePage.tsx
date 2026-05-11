import { useEffect, useState, useCallback } from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

const VIDEO_URL =
  'https://video.wixstatic.com/video/50f4bf_536b2010396c43bd9a462af825339fa5/720p/mp4/file.mp4';

function HomePage() {
  const navigate = useNavigate();
  const [googleReady, setGoogleReady] = useState(false);

  const hydratePlayerFromServer = usePlayerStore((state) => state.hydratePlayerFromServer);

  const {
    isAuthenticated,
    isLoading: authLoading,
    loadingMessage,
    error: authError,
    handleGoogleResponse: originalHandleGoogleResponse,
    logout,
  } = useGoogleAuth();

  // Wrapper que popula playerStore após Google auth
  const handleGoogleResponse = useCallback(
    async (response: any) => {
      try {
        const result = await originalHandleGoogleResponse(response);
        if (result?.ok && result?.player) {
          hydratePlayerFromServer(result.player);
          return result;
        }
        return result;
      } catch (error) {
        console.error('Erro ao processar resposta do Google:', error);
        throw error;
      }
    },
    [originalHandleGoogleResponse, hydratePlayerFromServer]
  );

  // Aguarda o script GSI estar disponível
  useEffect(() => {
    if (window.google) {
      setGoogleReady(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.google) {
        setGoogleReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Inicializa e renderiza o botão do Google
  useEffect(() => {
    if (!googleReady || isAuthenticated || !window.google) return;

    const handleGoogleLogin = async (response: any) => {
      const result = await handleGoogleResponse(response);
      if (result?.ok) {
        setTimeout(() => {
          navigate('/game', { replace: true });
        }, 300);
      }
    };

    window.google.accounts.id.initialize({
      client_id: '948102948683-u0o9lg73rprka2t0pp0tr4ol96echnf4.apps.googleusercontent.com',
      callback: handleGoogleLogin,
      ux_mode: 'popup',
      auto_select: false,
      cancel_on_tap_outside: false,
    });

    const btn = document.getElementById('google-signin-btn');
    if (btn) {
      btn.innerHTML = '';
      window.google.accounts.id.renderButton(btn, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: 280,
      });
    }
  }, [googleReady, isAuthenticated, navigate, handleGoogleResponse]);

  // Se já autenticado (token no localStorage), redireciona direto
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/game', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Vídeo fullscreen */}
      <video
        src={VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Overlay escuro sutil */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Conteúdo central — só login ou logout */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full gap-6">
        {isAuthenticated ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-white/70 text-sm uppercase tracking-widest">
              Redirecionando...
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/60 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-red-200 backdrop-blur-md transition hover:bg-red-900/70"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {authLoading ? (
              <p className="text-white/80 text-sm uppercase tracking-widest animate-pulse">
                {loadingMessage ?? 'Conectando...'}
              </p>
            ) : (
              <div
                id="google-signin-btn"
                className="min-h-[48px] flex items-center justify-center"
              />
            )}

            {authError && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/50 px-5 py-3 text-sm text-red-200 backdrop-blur-md max-w-xs text-center">
                {authError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
