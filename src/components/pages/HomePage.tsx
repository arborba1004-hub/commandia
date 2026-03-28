import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { GameMechanics } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { Zap, Target, Trophy, LogOut, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useDebugLog } from '@/hooks/useDebugLog';
import GoogleAuthDebugPanel from '@/components/GoogleAuthDebugPanel';
import { useBackendHealthCheck } from '@/hooks/useBackendHealthCheck';
import BackendHealthCheckModal from '@/components/BackendHealthCheckModal';

export default function HomePage() {
  const navigate = useNavigate();
  const [mechanics, setMechanics] = useState<GameMechanics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    isAuthenticated,
    isLoading: authLoading,
    playerData,
    error: authError,
    logout,
  } = useGoogleAuth();

  const { logs, addLog } = useDebugLog();
  const { isChecking, status, checkBackendHealth, reset } = useBackendHealthCheck();

  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [buttonRendered, setButtonRendered] = useState(false);
  const [credentialReceived, setCredentialReceived] = useState(false);
  const [backendRequestStarted, setBackendRequestStarted] = useState(false);
  const [backendResponseReceived, setBackendResponseReceived] = useState(false);
  const [backendStatus, setBackendStatus] = useState<number | undefined>();
  const [backendResponse, setBackendResponse] = useState<any>(null);
  const [finalError, setFinalError] = useState<string | null>(null);
  const [isLoginComplete, setIsLoginComplete] = useState(false);
  const [showHealthCheckModal, setShowHealthCheckModal] = useState(false);
  const [pendingGoogleResponse, setPendingGoogleResponse] = useState<any>(null);

  useEffect(() => {
    loadMechanics();
  }, []);

  useEffect(() => {
    if (authError) {
      setFinalError(authError);
      addLog('Auth Error', 'error', authError);
    }
  }, [authError, addLog]);

  useEffect(() => {
    if (isAuthenticated && playerData) {
      setIsLoginComplete(true);
      setFinalError(null);
      addLog('Login Complete', 'success', `Welcome ${playerData.name}`);
    }
  }, [isAuthenticated, playerData, addLog]);

  useEffect(() => {
    addLog('Init', 'pending', 'iniciando login');

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setGoogleScriptLoaded(true);
      addLog('Script', 'success', 'script carregado');

      if (window.google) {
        setGoogleAvailable(true);
        addLog('Google', 'success', 'google disponível');
      }
    };

    script.onerror = () => {
      addLog('Script', 'error', 'falha ao carregar script');
      setFinalError('Falha ao carregar Google Sign-In');
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [addLog]);

  const handleGoogleResponseWithDebug = async (response: any) => {
    try {
      setFinalError(null);
      setCredentialReceived(true);
      addLog('Credential', 'success', 'credential recebida');

      const credential = response?.credential;
      if (!credential) {
        throw new Error('No credential received from Google');
      }

      // Store the response for later use after health check
      setPendingGoogleResponse(response);

      // Show health check modal and start checking backend
      setShowHealthCheckModal(true);
      reset();
      addLog('HealthCheck', 'pending', 'iniciando verificação do servidor');

      const healthCheckResult = await checkBackendHealth();

      if (!healthCheckResult.isHealthy) {
        addLog('HealthCheck', 'error', healthCheckResult.message);
        // Modal will show error, user can retry
        return;
      }

      // Backend is healthy, proceed with login
      addLog('HealthCheck', 'success', 'servidor está pronto');
      setShowHealthCheckModal(false);

      // Now proceed with the actual authentication
      setBackendRequestStarted(true);
      addLog('Backend', 'pending', 'enviando para backend');

      const responseFromBackend = await fetch('https://comando-backend.onrender.com/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credential }),
      });

      setBackendStatus(responseFromBackend.status);
      setBackendResponseReceived(true);
      addLog('Backend', 'success', `resposta recebida - status ${responseFromBackend.status}`);

      const data = await responseFromBackend.json();
      setBackendResponse(data);
      addLog('Backend', 'success', 'JSON parseado', data);

      if (!responseFromBackend.ok) {
        throw new Error(`Backend error: ${responseFromBackend.statusText}`);
      }

      if (data.token && data.player) {
        addLog('Auth', 'success', 'token e player recebidos');

        localStorage.setItem('authToken', data.token);
        localStorage.setItem('playerData', JSON.stringify(data.player));

        setIsLoginComplete(true);
        setFinalError(null);

        addLog('Login Complete', 'success', `Welcome ${data.player.name}`);

        window.location.reload();
      } else {
        throw new Error(data.message || 'Backend did not return token and player');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setFinalError(errorMessage);
      addLog('Error', 'error', errorMessage);
      console.error('Google auth error:', err);
      setShowHealthCheckModal(false);
    }
  };

  const handleHealthCheckRetry = async () => {
    reset();
    const healthCheckResult = await checkBackendHealth();

    if (healthCheckResult.isHealthy) {
      addLog('HealthCheck', 'success', 'servidor está pronto');
      setShowHealthCheckModal(false);

      // Proceed with login using the pending response
      if (pendingGoogleResponse) {
        const credential = pendingGoogleResponse.credential;

        setBackendRequestStarted(true);
        addLog('Backend', 'pending', 'enviando para backend');

        try {
          const responseFromBackend = await fetch('https://comando-backend.onrender.com/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: credential }),
          });

          setBackendStatus(responseFromBackend.status);
          setBackendResponseReceived(true);
          addLog('Backend', 'success', `resposta recebida - status ${responseFromBackend.status}`);

          const data = await responseFromBackend.json();
          setBackendResponse(data);
          addLog('Backend', 'success', 'JSON parseado', data);

          if (!responseFromBackend.ok) {
            throw new Error(`Backend error: ${responseFromBackend.statusText}`);
          }

          if (data.token && data.player) {
            addLog('Auth', 'success', 'token e player recebidos');

            localStorage.setItem('authToken', data.token);
            localStorage.setItem('playerData', JSON.stringify(data.player));

            setIsLoginComplete(true);
            setFinalError(null);

            addLog('Login Complete', 'success', `Welcome ${data.player.name}`);

            window.location.reload();
          } else {
            throw new Error(data.message || 'Backend did not return token and player');
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
          setFinalError(errorMessage);
          addLog('Error', 'error', errorMessage);
          console.error('Google auth error:', err);
        }
      }
    }
  };

  useEffect(() => {
    if (window.google && !authLoading && googleScriptLoaded && !isAuthenticated) {
      window.google.accounts.id.initialize({
        client_id: '948102948683-u0o9lg73rprka2t0pp0tr4ol96echnf4.apps.googleusercontent.com',
        callback: handleGoogleResponseWithDebug,
      });

      const heroButton = document.getElementById('google-signin-button');
      if (heroButton) {
        heroButton.innerHTML = '';
        window.google.accounts.id.renderButton(heroButton, {
          theme: 'dark',
          size: 'large',
          text: 'signin_with',
        });
        setButtonRendered(true);
        addLog('Button', 'success', 'botão renderizado (hero)');
      }

      const ctaButton = document.getElementById('google-signin-button-cta');
      if (ctaButton) {
        ctaButton.innerHTML = '';
        window.google.accounts.id.renderButton(ctaButton, {
          theme: 'dark',
          size: 'large',
          text: 'signin_with',
        });
        addLog('Button', 'success', 'botão renderizado (cta)');
      }
    }
  }, [authLoading, googleScriptLoaded, isAuthenticated, addLog]);

  const loadMechanics = async () => {
    try {
      setError(null);
      const result = await BaseCrudService.getAll<GameMechanics>('gamemechanics');
      setMechanics(result.items || []);
    } catch (err) {
      console.error('Error loading mechanics:', err);
      setError('Erro ao carregar mecânicas do jogo');
      setMechanics([]);
    } finally {
      setIsLoading(false);
    }
  };

  const [showIntroModal, setShowIntroModal] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* HERO SECTION - CINEMATOGRAPHIC OPENING */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="https://video.wixstatic.com/video/50f4bf_536b2010396c43bd9a462af825339fa1/720p/mp4/file.mp4" type="video/mp4" />
        </video>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/70" />

        {/* Vignette Effect */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40" />

        {/* Vertical Dark Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        {/* Atmospheric Blur Overlay */}
        <div className="absolute inset-0 backdrop-blur-[1px]" />

        {/* Content Container */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
          {isAuthenticated && playerData ? (
            // AUTHENTICATED STATE - HUD PANEL
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full max-w-2xl space-y-8"
            >
              {/* Welcome Title */}
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="font-heading text-4xl lg:text-6xl uppercase tracking-[0.15em] text-center text-foreground"
              >
                Bem-vindo, <span className="text-primary">{playerData.name}</span>
              </motion.h1>

              {/* HUD Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-custom4/40 border-2 border-primary/30 rounded-lg p-8 backdrop-blur-sm space-y-6"
              >
                <div className="grid grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className="space-y-2 border-l-2 border-primary/50 pl-4"
                  >
                    <p className="font-paragraph text-xs uppercase tracking-wider text-foreground/60">Email</p>
                    <p className="font-heading text-sm lg:text-base text-foreground">{playerData.email}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="space-y-2 border-l-2 border-primary/50 pl-4"
                  >
                    <p className="font-paragraph text-xs uppercase tracking-wider text-foreground/60">Level</p>
                    <p className="font-heading text-sm lg:text-base text-primary">{playerData.level || 1}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                    className="space-y-2 border-l-2 border-secondary/50 pl-4"
                  >
                    <p className="font-paragraph text-xs uppercase tracking-wider text-foreground/60">HP</p>
                    <p className="font-heading text-sm lg:text-base text-secondary">{playerData.hp || 100}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                    className="space-y-2 border-l-2 border-primary/50 pl-4"
                  >
                    <p className="font-paragraph text-xs uppercase tracking-wider text-foreground/60">Moedas</p>
                    <p className="font-heading text-sm lg:text-base text-primary">{playerData.money || 0}</p>
                  </motion.div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              >
                <button
                  onClick={() => navigate('/game')}
                  className="px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-heading uppercase tracking-[0.1em] rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105"
                >
                  Continuar Jogo
                </button>

                <button
                  onClick={logout}
                  className="px-8 py-4 border-2 border-destructive text-destructive font-heading uppercase tracking-[0.1em] rounded-lg hover:bg-destructive/10 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </motion.div>
            </motion.div>
          ) : (
            // UNAUTHENTICATED STATE - CINEMATIC OPENING
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="w-full max-w-4xl space-y-12 text-center"
            >
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                className="flex justify-center"
              >
                <div className="relative">
                  <Image
                    src="https://static.wixstatic.com/media/50f4bf_7140cdf76a2742628049849ce89b7560~mv2.png"
                    alt="Dominio do Comando Logo"
                    width={300}
                    className="w-48 lg:w-80 h-auto drop-shadow-2xl"
                  />
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-primary/20 blur-3xl -z-10 rounded-full" />
                </div>
              </motion.div>

              {/* Tagline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="space-y-4"
              >
                <h1 className="font-heading text-4xl lg:text-6xl uppercase tracking-[0.15em] text-foreground leading-tight">
                  O poder não se herda.
                </h1>
                <h2 className="font-heading text-3xl lg:text-5xl uppercase tracking-[0.15em] text-primary leading-tight">
                  Se toma.
                </h2>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
              >
                {/* Primary CTA */}
                <button
                  onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground font-heading uppercase tracking-[0.12em] rounded-lg hover:shadow-2xl hover:shadow-primary/60 transition-all duration-300 transform hover:scale-105 text-sm lg:text-base"
                >
                  Entrar no Comando
                </button>

                {/* Secondary CTA */}
                <button
                  onClick={() => setShowIntroModal(true)}
                  className="px-8 py-4 border-2 border-secondary text-secondary font-heading uppercase tracking-[0.12em] rounded-lg hover:bg-secondary/10 transition-all flex items-center justify-center gap-2 text-sm lg:text-base"
                >
                  <Play className="w-4 h-4" />
                  Assistir Introdução
                </button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </section>

      {/* MANIFESTO SECTION - 3 PILLARS */}
      <section className="py-24 bg-gradient-to-b from-background via-custom4/20 to-background">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="font-heading text-5xl lg:text-6xl uppercase tracking-[0.15em] text-foreground mb-4">
              Manifesto do <span className="text-primary">Jogo</span>
            </h2>
            <p className="font-paragraph text-lg text-foreground/70 max-w-2xl mx-auto">
              Os três pilares que definem o Domínio do Comando
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1: PODER */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0 }}
              className="group"
            >
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 rounded-lg p-8 h-full flex flex-col items-center text-center space-y-6 hover:border-primary/60 transition-all duration-300">
                <div className="w-16 h-16 bg-primary/30 rounded-lg flex items-center justify-center group-hover:bg-primary/50 transition-all">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading text-2xl uppercase tracking-[0.12em] text-foreground">
                  Poder
                </h3>
                <p className="font-paragraph text-base text-foreground/80 leading-relaxed">
                  Acumule força, domine estratégias e conquiste o topo da hierarquia.
                </p>
              </div>
            </motion.div>

            {/* Pillar 2: LEALDADE */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group"
            >
              <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 border-2 border-secondary/30 rounded-lg p-8 h-full flex flex-col items-center text-center space-y-6 hover:border-secondary/60 transition-all duration-300">
                <div className="w-16 h-16 bg-secondary/30 rounded-lg flex items-center justify-center group-hover:bg-secondary/50 transition-all">
                  <Trophy className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="font-heading text-2xl uppercase tracking-[0.12em] text-foreground">
                  Lealdade
                </h3>
                <p className="font-paragraph text-base text-foreground/80 leading-relaxed">
                  Construa alianças inabaláveis e proteja seu reino com honra.
                </p>
              </div>
            </motion.div>

            {/* Pillar 3: DOMÍNIO */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group"
            >
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 rounded-lg p-8 h-full flex flex-col items-center text-center space-y-6 hover:border-primary/60 transition-all duration-300">
                <div className="w-16 h-16 bg-primary/30 rounded-lg flex items-center justify-center group-hover:bg-primary/50 transition-all">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading text-2xl uppercase tracking-[0.12em] text-foreground">
                  Domínio
                </h3>
                <p className="font-paragraph text-base text-foreground/80 leading-relaxed">
                  Expanda seu império e deixe sua marca na história do jogo.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* GAME MECHANICS SECTION */}
      <section className="py-24 bg-background">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-5xl lg:text-6xl uppercase tracking-[0.15em] text-foreground mb-4">
              Mecânicas do <span className="text-primary">Jogo</span>
            </h2>
            <p className="font-paragraph text-lg text-foreground/70 max-w-2xl mx-auto">
              Descubra os sistemas que definem sua jornada no Domínio do Comando
            </p>
          </motion.div>

          <div className="min-h-[600px]">
            {isLoading ? null : error ? (
              <div className="text-center py-24">
                <p className="font-paragraph text-xl text-destructive mb-4">{error}</p>
                <button
                  onClick={loadMechanics}
                  className="px-6 py-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-all"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : mechanics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {mechanics.map((mechanic, index) => (
                  <motion.div
                    key={mechanic._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="group"
                  >
                    <div className="bg-custom4/30 border border-secondary/20 rounded-lg overflow-hidden hover:border-primary/50 transition-all h-full flex flex-col">
                      {mechanic.mechanicImage && (
                        <div className="relative h-64 overflow-hidden">
                          <Image
                            src={mechanic.mechanicImage}
                            alt={mechanic.title || 'Game mechanic'}
                            width={500}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
                          />
                        </div>
                      )}

                      <div className="p-6 space-y-4 flex-1 flex flex-col">
                        {mechanic.title && (
                          <h3 className="font-heading text-2xl uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
                            {mechanic.title}
                          </h3>
                        )}

                        {mechanic.description && (
                          <p className="font-paragraph text-base text-foreground/80 leading-relaxed flex-1">
                            {mechanic.description}
                          </p>
                        )}

                        <div className="pt-4 border-t border-secondary/20 space-y-2">
                          {mechanic.mechanicType && (
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-primary" />
                              <p className="font-paragraph text-sm text-foreground/70">
                                Tipo: {mechanic.mechanicType}
                              </p>
                            </div>
                          )}

                          {mechanic.levelRequirement && (
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-secondary" />
                              <p className="font-paragraph text-sm text-foreground/70">
                                Nível: {mechanic.levelRequirement}
                              </p>
                            </div>
                          )}

                          {mechanic.reward && (
                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-primary" />
                              <p className="font-paragraph text-sm text-foreground/70">
                                Recompensa: {mechanic.reward}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <p className="font-paragraph text-xl text-foreground/60">
                  Mecânicas do jogo em breve
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* LOGIN SECTION - TRANSITION TO GAME */}
      {!isAuthenticated && (
        <section id="login-section" className="py-24 bg-gradient-to-b from-background via-custom4/30 to-background">
          <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-8"
            >
              <h2 className="font-heading text-5xl lg:text-6xl uppercase tracking-[0.15em] text-foreground">
                Pronto para <span className="text-primary">Dominar</span>?
              </h2>

              <p className="font-paragraph text-lg text-foreground/70 max-w-2xl mx-auto">
                Junte-se a milhares de jogadores que já conquistaram seu lugar no Domínio do Comando
              </p>

              <div id="google-signin-button-cta" className="flex justify-center" />
            </motion.div>
          </div>
        </section>
      )}

      {/* FINAL CTA SECTION - ASCENSION */}
      {isAuthenticated && playerData && (
        <section className="py-24 bg-gradient-to-b from-background to-custom4/40">
          <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-8"
            >
              <h2 className="font-heading text-5xl lg:text-6xl uppercase tracking-[0.15em] text-foreground">
                Transição para o <span className="text-primary">Jogo</span>
              </h2>

              <p className="font-paragraph text-lg text-foreground/70 max-w-2xl mx-auto">
                Sua jornada pelo Domínio do Comando começa agora. Prepare-se para a ascensão.
              </p>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                onClick={() => navigate('/game')}
                className="px-12 py-5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-heading uppercase tracking-[0.12em] rounded-lg hover:shadow-2xl hover:shadow-primary/60 transition-all duration-300 transform hover:scale-105 text-base lg:text-lg"
              >
                Iniciar Ascensão
              </motion.button>
            </motion.div>
          </div>
        </section>
      )}

      <Footer />

      {/* Intro Video Modal */}
      {showIntroModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowIntroModal(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl"
          >
            <video
              autoPlay
              controls
              className="w-full h-auto rounded-lg"
            >
              <source src="https://video.wixstatic.com/video/50f4bf_536b2010396c43bd9a462af825339fa1/720p/mp4/file.mp4" type="video/mp4" />
            </video>
          </motion.div>
        </motion.div>
      )}

      {!isAuthenticated && (
        <GoogleAuthDebugPanel
          logs={logs}
          googleScriptLoaded={googleScriptLoaded}
          googleAvailable={googleAvailable}
          buttonRendered={buttonRendered}
          credentialReceived={credentialReceived}
          backendRequestStarted={backendRequestStarted}
          backendResponseReceived={backendResponseReceived}
          backendStatus={backendStatus}
          backendResponse={backendResponse}
          finalError={finalError}
          playerName={playerData?.name}
          isLoginComplete={isLoginComplete}
        />
      )}

      <BackendHealthCheckModal
        isOpen={showHealthCheckModal}
        isChecking={isChecking}
        message={status?.message || 'Aguardando backend iniciar...'}
        isHealthy={status?.isHealthy}
        timedOut={status?.timedOut}
        onRetry={handleHealthCheckRetry}
        onClose={() => setShowHealthCheckModal(false)}
      />
    </div>
  );
}