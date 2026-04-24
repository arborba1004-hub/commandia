import { useEffect, useState } from 'react';
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

export default function HomePage() {
  const navigate = useNavigate();

  const player = usePlayerStore((state) => state.player);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const loadPlayer = usePlayerStore((state) => state.loadPlayer);

  const [googleReady, setGoogleReady] = useState(false);

  const {
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
    handleGoogleResponse,
    logout,
  } = useGoogleAuth();

  useEffect(() => {
    if (!isLoaded) {
      void loadPlayer();
    }
  }, [isLoaded, loadPlayer]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.google) {
      setGoogleReady(true);
      return;
    }

    let interval: NodeJS.Timeout | null = null;
    let attempts = 0;
    const maxAttempts = 50;

    interval = setInterval(() => {
      attempts++;
      if (window.google) {
        setGoogleReady(true);
        if (interval) clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        if (interval) clearInterval(interval);
      }
    }, 100);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

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
      client_id:
        '948102948683-u0o9lg73rprka2t0pp0tr4ol96echnf4.apps.googleusercontent.com',
      callback: handleGoogleLogin,
      ux_mode: 'popup',
      auto_select: false,
      cancel_on_tap_outside: false,
    });

    const loginButton = document.getElementById('google-signin-home');
    if (loginButton) {
      loginButton.innerHTML = '';
      window.google.accounts.id.renderButton(loginButton, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: 280,
      });
    }
  }, [googleReady, isAuthenticated, navigate, handleGoogleResponse]);

  const handleEnterGame = () => {
    navigate('/game', { replace: true });
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <video
        src={VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/70" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-black/45 p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          {!isAuthenticated ? (
            <>
              <p className="text-center text-[10px] uppercase tracking-[0.32em] text-zinc-500">
                acesso restrito
              </p>

              <h1 className="mt-3 text-center text-3xl font-black uppercase tracking-[0.12em] text-white">
                Domínio do Comando
              </h1>

              <p className="mt-4 text-center text-sm leading-relaxed text-zinc-300">
                Entre com sua conta para acessar o game.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5">
                <div
                  id="google-signin-home"
                  className="flex min-h-[48px] items-center justify-center"
                />
              </div>

              {authLoading && (
                <p className="mt-4 text-center text-sm text-zinc-300">
                  Conectando...
                </p>
              )}

              {authError && (
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-950/35 px-4 py-3 text-sm text-red-200">
                  {authError}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-center text-[10px] uppercase tracking-[0.32em] text-zinc-500">
                acesso liberado
              </p>

              <h1 className="mt-3 text-center text-2xl font-black uppercase tracking-[0.12em] text-amber-100">
                {player?.name || 'Jogador'}
              </h1>

              <p className="mt-2 text-center text-sm text-zinc-400 break-words">
                {player?.email || ''}
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    LEVEL
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {player?.niveis?.playerLevel || 1}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    POWER
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {player?.power || 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    SUJO
                  </p>
                  <p className="mt-2 text-lg font-bold text-red-300">
                    {(player?.balances?.dirtyMoney || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleEnterGame}
                  disabled={!isLoaded}
                  className="w-full rounded-2xl border border-amber-300/20 bg-gradient-to-r from-red-950 via-red-800 to-red-950 px-6 py-4 text-sm font-bold uppercase tracking-[0.28em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Entrar no Game
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full rounded-2xl border border-red-500/25 bg-red-950/35 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-red-200"
                >
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
