import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Flame, Shield, Play, LogOut, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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

const manifestoCards = [
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
  const [googleReady, setGoogleReady] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [wakingServer, setWakingServer] = useState(false);

  const {
    isAuthenticated,
    playerData,
    logout,
    isLoading: authLoading,
  } = useGoogleAuth();

  useEffect(() => {
    const scriptId = 'google-gsi-script';

    if (document.getElementById(scriptId)) {
      if (window.google) setGoogleReady(true);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google) {
        setGoogleReady(true);
      }
    };

    script.onerror = () => {
      setLoginError('Falha ao carregar o login Google.');
    };

    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!googleReady || isAuthenticated || authLoading || !window.google) return;

    const handleGoogleResponse = async (response: any) => {
      try {
        setLoginError(null);
        setWakingServer(true);

        try {
          await fetch('https://comando-backend.onrender.com', {
            method: 'GET',
          });
        } catch {
          // segue mesmo se a checagem falhar
        }

        const credential = response?.credential;
        if (!credential) {
          throw new Error('Não foi possível obter a credencial do Google.');
        }

        const backendResponse = await fetch(
          'https://comando-backend.onrender.com/auth/google',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: credential }),
          }
        );

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
          throw new Error(data?.error || 'Falha na autenticação.');
        }

        if (!(data.token && data.player)) {
          throw new Error('Resposta inválida do servidor.');
        }

        localStorage.setItem('authToken', data.token);
        localStorage.setItem('playerData', JSON.stringify(data.player));

        window.location.reload();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Erro ao conectar com o servidor. Tente novamente.';
        setLoginError(message);
      } finally {
        setWakingServer(false);
      }
    };

    window.google.accounts.id.initialize({
      client_id:
        '948102948683-u0o9lg73rprka2t0pp0tr4ol96echnf4.apps.googleusercontent.com',
      callback: handleGoogleResponse,
      ux_mode: 'popup',
      auto_select: false,
      cancel_on_tap_outside: false,
    });

    const heroButton = document.getElementById('google-signin-cinematic');
    if (heroButton) {
      heroButton.innerHTML = '';
      window.google.accounts.id.renderButton(heroButton, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: 320,
      });
    }
  }, [googleReady, isAuthenticated, authLoading]);

  const scrollToManifesto = () => {
    manifestoRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />

      <section className="relative min-h-screen overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/35 to-black/90" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.55) 100%)',
          }}
        />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(120,0,0,0.10),transparent_55%)]" />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ opacity: [0.18, 0.3, 0.18], scale: [1, 1.04, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-20 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-red-900/10 blur-3xl"
          />
          <motion.div
            animate={{ opacity: [0.08, 0.18, 0.08], x: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-10 right-0 h-[280px] w-[280px] rounded-full bg-amber-500/10 blur-3xl"
          />
        </div>

        <div className="relative z-20 flex min-h-screen items-center justify-center px-6 pt-28 pb-16">
          <div className="w-full max-w-6xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-[700px]"
            >
              <motion.img
                src={LOGO_URL}
                alt="Domínio do Comando"
                className="mx-auto w-full max-w-[620px] object-contain drop-shadow-[0_0_24px_rgba(255,210,120,0.15)]"
                animate={{
                  scale: [1, 1.012, 1],
                  filter: [
                    'drop-shadow(0 0 14px rgba(255,210,120,0.12))',
                    'drop-shadow(0 0 24px rgba(255,210,120,0.18))',
                    'drop-shadow(0 0 14px rgba(255,210,120,0.12))',
                  ],
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.8 }}
              className="mx-auto mt-6 max-w-3xl text-center text-lg font-medium tracking-[0.28em] text-zinc-200 uppercase md:text-xl"
            >
              O poder não se herda. Se toma.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.85 }}
              className="mx-auto mt-10 flex max-w-2xl flex-col items-center justify-center gap-4 md:flex-row"
            >
              {isAuthenticated && playerData ? (
                <>
                  <button
                    onClick={() => navigate('/game')}
                    className="group relative w-full overflow-hidden rounded-2xl border border-amber-300/25 bg-gradient-to-r from-red-900 via-red-700 to-red-900 px-8 py-4 text-sm font-bold uppercase tracking-[0.28em] text-white shadow-[0_10px_40px_rgba(120,0,0,0.35)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_14px_50px_rgba(160,0,0,0.45)] md:w-auto"
                  >
                    <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.18),transparent)] translate-x-[-120%] transition-transform duration-700 group-hover:translate-x-[120%]" />
                    <span className="relative z-10">ENTRAR NO COMANDO</span>
                  </button>

                  <button
                    onClick={scrollToManifesto}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/30 px-8 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-zinc-200 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-black/45 md:w-auto"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Assistir Introdução
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={scrollToManifesto}
                    className="group relative w-full overflow-hidden rounded-2xl border border-amber-300/25 bg-gradient-to-r from-red-900 via-red-700 to-red-900 px-8 py-4 text-sm font-bold uppercase tracking-[0.28em] text-white shadow-[0_10px_40px_rgba(120,0,0,0.35)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_14px_50px_rgba(160,0,0,0.45)] md:w-auto"
                  >
                    <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.18),transparent)] translate-x-[-120%] transition-transform duration-700 group-hover:translate-x-[120%]" />
                    <span className="relative z-10">ENTRAR NO COMANDO</span>
                  </button>

                  <button
                    onClick={scrollToManifesto}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/30 px-8 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-zinc-200 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-black/45 md:w-auto"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Assistir Introdução
                  </button>
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 34 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.85 }}
              className="mx-auto mt-8 max-w-2xl"
            >
              {isAuthenticated && playerData ? (
                <div className="rounded-[28px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="text-left">
                      <p className="text-xs uppercase tracking-[0.26em] text-zinc-400">
                        Jogador autenticado
                      </p>
                      <h3 className="mt-1 text-2xl font-bold uppercase tracking-[0.12em] text-amber-200">
                        {playerData.name}
                      </h3>
                    </div>
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-200 transition hover:bg-red-900/40"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-left md:grid-cols-4">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                        Email
                      </p>
                      <p className="mt-2 text-sm text-zinc-100 break-all">
                        {playerData.email}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                        Level
                      </p>
                      <p className="mt-2 text-2xl font-bold text-amber-200">
                        {playerData.level || 1}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                        HP
                      </p>
                      <p className="mt-2 text-2xl font-bold text-zinc-100">
                        {playerData.hp || 100}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                        Money
                      </p>
                      <p className="mt-2 text-2xl font-bold text-red-300">
                        {playerData.money || 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => navigate('/game')}
                      className="w-full rounded-2xl border border-amber-300/20 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 px-6 py-4 text-sm font-bold uppercase tracking-[0.28em] text-amber-100 transition hover:scale-[1.01] hover:border-amber-300/35 hover:text-white"
                    >
                      CONTINUAR
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-[28px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
                  <p className="mb-4 text-xs uppercase tracking-[0.28em] text-zinc-400">
                    Acesso oficial ao submundo
                  </p>

                  <div className="flex justify-center">
                    <div
                      id="google-signin-cinematic"
                      className="relative z-50 flex min-h-[48px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                    />
                  </div>

                  {wakingServer && (
                    <p className="mt-4 text-sm text-zinc-300">
                      Conectando ao servidor...
                    </p>
                  )}

                  {loginError && (
                    <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                      {loginError}
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="mt-10 flex justify-center"
            >
              <button
                onClick={scrollToManifesto}
                className="group flex flex-col items-center text-zinc-400 transition hover:text-white"
              >
                <span className="text-[10px] uppercase tracking-[0.32em]">
                  Descer
                </span>
                <ChevronDown className="mt-2 h-5 w-5 animate-bounce" />
              </button>
            </motion.div>
          </div>
        </div>
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
            <h2 className="mt-4 text-4xl font-bold uppercase tracking-[0.14em] text-white md:text-6xl">
              O código do comando
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {manifestoCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10%' }}
                  transition={{ duration: 0.7, delay: index * 0.12 }}
                  className="group rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.28)] transition duration-300 hover:border-red-500/25 hover:bg-[linear-gradient(180deg,rgba(80,0,0,0.15),rgba(255,255,255,0.01))]"
                >
                  <div className="mb-6 inline-flex rounded-2xl border border-amber-400/15 bg-amber-300/5 p-4 text-amber-200">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold uppercase tracking-[0.18em] text-white">
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
            className="mt-4 text-4xl font-bold uppercase tracking-[0.16em] text-white md:text-6xl"
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
              onClick={() => (isAuthenticated ? navigate('/game') : scrollToManifesto())}
              className="rounded-2xl border border-amber-300/20 bg-gradient-to-r from-red-900 via-red-700 to-red-900 px-10 py-5 text-sm font-bold uppercase tracking-[0.28em] text-white shadow-[0_15px_50px_rgba(120,0,0,0.35)] transition-all hover:scale-[1.02] hover:shadow-[0_18px_60px_rgba(160,0,0,0.45)]"
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