import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Shield, Flame, Play, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePlayerStore } from '@/store/playerStore';
import { useAchievementStore } from '@/store/achievementStore';
import { Image } from '@/components/ui/image';
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

const LOGO_URL =
  'https://static.wixstatic.com/media/50f4bf_7140cdf76a2742628049849ce89b7560~mv2.png';

const VIDEO_URL =
  'https://video.wixstatic.com/video/50f4bf_536b2010396c43bd9a462af825339fa5/720p/mp4/file.mp4';

const cards = [
  {
    title: 'PODER',
    description: 'Cada decisão muda o equilíbrio da cidade.',
    icon: Crown,
  },
  {
    title: 'LEALDADE',
    description: 'Quem entra no comando escolhe um lado.',
    icon: Shield,
  },
  {
    title: 'DOMÍNIO',
    description: 'Só permanece quem impõe respeito.',
    icon: Flame,
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const manifestoRef = useRef<HTMLElement | null>(null);

  const player = usePlayerStore((state) => state.player);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const loadPlayer = usePlayerStore((state) => state.loadPlayer);
  const clearPlayer = usePlayerStore((state) => state.clearPlayer);
  const hydratePlayerFromServer = usePlayerStore(
    (state) => state.hydratePlayerFromServer
  );
  const { checkAndUnlockAchievements, loadAchievements } = useAchievementStore();

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

  // Load achievements from localStorage and check for new unlocks
  useEffect(() => {
    const stored = localStorage.getItem('unlockedAchievements');
    if (stored) {
      loadAchievements(JSON.parse(stored));
    }
  }, [loadAchievements]);

  // Check for achievement unlocks when player data changes
  useEffect(() => {
    if (player?._id) {
      checkAndUnlockAchievements(player);
    }
  }, [player, checkAndUnlockAchievements]);

  useEffect(() => {
    // GSI já está no <head> da página Astro — apenas aguarda estar disponível
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

    const desktopBtn = document.getElementById('google-signin-desktop');
    if (desktopBtn) {
      desktopBtn.innerHTML = '';
      window.google.accounts.id.renderButton(desktopBtn, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: 300,
      });
    }

    const mobileBtn = document.getElementById('google-signin-mobile');
    if (mobileBtn) {
      mobileBtn.innerHTML = '';
      window.google.accounts.id.renderButton(mobileBtn, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: 280,
      });
    }
  }, [
    googleReady,
    isAuthenticated,
    navigate,
    handleGoogleResponse,
  ]);

  const scrollToManifesto = () => {
    manifestoRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEnterComplexo = () => {
    // Ensure player data is loaded before navigating
    if (isLoaded && isAuthenticated) {
      navigate('/game', { replace: true });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />

      <section className="relative min-h-screen overflow-hidden">
        <video
          src={VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-black/65 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75 pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at center, rgba(0,0,0,0.02) 25%, rgba(0,0,0,0.58) 100%)',
          }}
        />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_30%,rgba(120,0,0,0.18),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(255,180,80,0.10),transparent_28%)]" />

        <div className="relative z-20 flex min-h-screen items-center px-6 pt-28 pb-16 md:px-12 lg:px-20">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: -18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9 }}
                className="mb-5 flex justify-center lg:justify-start"
              >
                <Image
                  src={LOGO_URL}
                  alt="Domínio do Comando"
                  className="w-[220px] sm:w-[260px] md:w-[320px] lg:w-[360px] object-contain drop-shadow-[0_0_16px_rgba(255,210,120,0.12)]"
                />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.85 }}
                className="max-w-4xl text-4xl font-black uppercase tracking-[0.12em] text-white sm:text-5xl md:text-6xl lg:text-7xl"
              >
                A cidade não respeita fracos.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.8 }}
                className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-200 sm:text-lg lg:mx-0"
              >
                O poder não se herda. Se toma.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.8 }}
                className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start"
              >
                <button
                  onClick={() => (isAuthenticated && isLoaded ? handleEnterComplexo() : scrollToManifesto())}
                  disabled={isAuthenticated && !isLoaded}
                  className="group relative w-full max-w-[320px] overflow-hidden rounded-2xl border border-amber-300/25 bg-gradient-to-r from-red-950 via-red-800 to-red-950 px-8 py-4 text-sm font-bold uppercase tracking-[0.28em] text-white shadow-[0_12px_40px_rgba(110,0,0,0.35)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_16px_55px_rgba(150,0,0,0.45)] sm:w-auto z-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.15),transparent)] translate-x-[-120%] transition-transform duration-700 group-hover:translate-x-[120%]" />
                  <span className="relative z-10">ENTRAR NO COMANDO</span>
                </button>

                <button
                  onClick={scrollToManifesto}
                  className="flex w-full max-w-[320px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/30 px-8 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-100 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-black/45 sm:w-auto"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Assistir Introdução
                </button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.95 }}
              className="hidden lg:block"
            >
              {isAuthenticated ? (
                <div className="relative">
                  <div className="absolute inset-0 rounded-[30px] bg-red-900/15 blur-2xl" />
                  <div className="relative rounded-[30px] border border-white/10 bg-black/35 p-6 backdrop-blur-xl shadow-[0_25px_90px_rgba(0,0,0,0.45)]">
                    <div className="mb-5 border-b border-white/10 pb-5">
                      <p className="text-[10px] uppercase tracking-[0.32em] text-zinc-500">
                        acesso liberado
                      </p>
                      <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.12em] text-amber-100">
                        {player.name}
                      </h2>
                      <p className="mt-2 text-sm text-zinc-400 break-all">{player.email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">LEVEL</p>
                        <p className="mt-2 text-2xl font-bold text-white">
                          {player.niveis?.playerLevel || 1}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">POWER</p>
                        <p className="mt-2 text-2xl font-bold text-white">
                          {player.power || 0}
                        </p>
                      </div>
                      <div className="col-span-2 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">COMMANDS SUJO</p>
                        <p className="mt-2 text-3xl font-bold text-red-300">
                          {(player.balances?.dirtyMoney || 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <button
                        onClick={handleEnterComplexo}
                        className="w-full rounded-2xl border border-amber-300/20 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 px-6 py-4 text-sm font-bold uppercase tracking-[0.28em] text-amber-100 transition hover:scale-[1.01] hover:border-amber-300/35 hover:text-white"
                      >
                        CONTINUAR
                      </button>

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-950/35 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-red-200 transition hover:bg-red-900/35"
                      >
                        <LogOut className="h-4 w-4" />
                        SAIR
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 rounded-[30px] bg-red-900/15 blur-2xl" />
                  <div className="relative rounded-[30px] border border-white/10 bg-black/35 p-6 backdrop-blur-xl shadow-[0_25px_90px_rgba(0,0,0,0.45)]">
                    <p className="text-[10px] uppercase tracking-[0.32em] text-zinc-500">
                      acesso restrito
                    </p>
                    <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-white">
                      Identificação necessária
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                      Entre com sua conta oficial para salvar progresso, acessar o sistema e iniciar sua ascensão.
                    </p>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5">
                      <div
                        id="google-signin-desktop"
                        className="flex min-h-[48px] items-center justify-center"
                      />
                    </div>

                    {authLoading && (
                      <p className="mt-4 text-sm text-zinc-300">
                        Conectando ao servidor...
                      </p>
                    )}

                    {authError && (
                      <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-950/35 px-4 py-3 text-sm text-red-200">
                        {authError}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="relative z-20 px-6 pb-12 lg:hidden">
            <div className="mx-auto max-w-md rounded-[28px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <p className="text-center text-[10px] uppercase tracking-[0.32em] text-zinc-500">
                acesso restrito
              </p>
              <h2 className="mt-2 text-center text-xl font-black uppercase tracking-[0.12em] text-white">
                Identificação necessária
              </h2>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <div
                  id="google-signin-mobile"
                  className="flex min-h-[48px] items-center justify-center"
                />
              </div>

              {authLoading && (
                <p className="mt-4 text-center text-sm text-zinc-300">
                  Conectando ao servidor...
                </p>
              )}

              {authError && (
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-950/35 px-4 py-3 text-sm text-red-200">
                  {authError}
                </div>
              )}
            </div>
          </div>
        )}

        {isAuthenticated && (
          <div className="relative z-20 px-6 pb-12 lg:hidden">
            <div className="mx-auto max-w-md rounded-[28px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <p className="text-center text-[10px] uppercase tracking-[0.32em] text-zinc-500">
                acesso liberado
              </p>
              <h2 className="mt-2 text-center text-2xl font-black uppercase tracking-[0.12em] text-amber-100">
                {player.name}
              </h2>
              <p className="mt-2 text-center text-sm text-zinc-400 break-all">{player.email}</p>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">LEVEL</p>
                  <p className="mt-2 text-lg font-bold text-white">{player.niveis?.playerLevel || 1}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">POWER</p>
                  <p className="mt-2 text-lg font-bold text-white">{player.power || 0}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">SUJO</p>
                  <p className="mt-2 text-lg font-bold text-red-300">
                    {(player.balances?.dirtyMoney || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <button
                  onClick={handleEnterComplexo}
                  className="w-full rounded-2xl border border-amber-300/20 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 px-6 py-4 text-sm font-bold uppercase tracking-[0.28em] text-amber-100"
                >
                  CONTINUAR
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-2xl border border-red-500/25 bg-red-950/35 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-red-200"
                >
                  SAIR
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section
        ref={manifestoRef}
        className="relative bg-[linear-gradient(to_bottom,#050505,#090909,#0d0d0d)] px-6 py-24"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.8 }}
            className="mb-14 text-center"
          >
            <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">
              Manifesto
            </p>
            <h2 className="mt-4 text-4xl font-black uppercase tracking-[0.14em] text-white md:text-6xl">
              O código do comando
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10%' }}
                  transition={{ duration: 0.7, delay: index * 0.12 }}
                  className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.28)] transition duration-300 hover:border-red-500/25 hover:bg-[linear-gradient(180deg,rgba(80,0,0,0.15),rgba(255,255,255,0.01))]"
                >
                  <div className="mb-6 inline-flex rounded-2xl border border-amber-400/15 bg-amber-300/5 p-4 text-amber-200">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-[0.18em] text-white">
                    {card.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-zinc-300">
                    {card.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-black px-6 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,0,0,0.18),transparent_45%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-xs uppercase tracking-[0.34em] text-zinc-500"
          >
            Ascensão
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="mt-4 text-4xl font-black uppercase tracking-[0.16em] text-white md:text-6xl"
          >
            A cidade não espera.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300"
          >
            Toda entrada tem um preço. Toda escolha tem um peso. Toda coroa exige sangue frio.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.85 }}
            className="mt-10"
          >
            <button
              onClick={() => (isAuthenticated && isLoaded ? handleEnterComplexo() : scrollToManifesto())}
              disabled={isAuthenticated && !isLoaded}
              className="rounded-2xl border border-amber-300/20 bg-gradient-to-r from-red-950 via-red-800 to-red-950 px-10 py-5 text-sm font-bold uppercase tracking-[0.28em] text-white shadow-[0_15px_50px_rgba(120,0,0,0.35)] transition-all hover:scale-[1.02] hover:shadow-[0_18px_60px_rgba(160,0,0,0.45)] z-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              INICIAR ASCENSÃO
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
