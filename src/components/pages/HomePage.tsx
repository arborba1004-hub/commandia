import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { GameMechanics } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { Zap, Target, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useDebugLog } from '@/hooks/useDebugLog';
import GoogleAuthDebugPanel from '@/components/GoogleAuthDebugPanel';

export default function HomePage() {
  const [mechanics, setMechanics] = useState<GameMechanics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, handleGoogleResponse, isLoading: authLoading, playerData, error: authError } = useGoogleAuth();
  const { logs, addLog, clearLogs } = useDebugLog();

  // Debug state
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

  useEffect(() => {
    loadMechanics();
  }, []);

  // Monitor auth errors
  useEffect(() => {
    if (authError) {
      setFinalError(authError);
      addLog('Auth Error', 'error', authError);
    }
  }, [authError, addLog]);

  // Monitor login completion
  useEffect(() => {
    if (isAuthenticated && playerData) {
      setIsLoginComplete(true);
      addLog('Login Complete', 'success', `Welcome ${playerData.name}`);
    }
  }, [isAuthenticated, playerData, addLog]);

  // Load Google script
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

  // Wrap handleGoogleResponse to add debug logging
  const handleGoogleResponseWithDebug = async (response: any) => {
    try {
      setCredentialReceived(true);
      addLog('Credential', 'success', 'credential recebida');
      
      const credential = response.credential;
      if (!credential) {
        throw new Error('No credential received from Google');
      }

      setBackendRequestStarted(true);
      addLog('Backend', 'pending', 'enviando para backend');

      // Send token to backend
      const backendResponse = await fetch('https://comando-backend.onrender.com/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credential }),
      });

      setBackendStatus(backendResponse.status);
      setBackendResponseReceived(true);
      addLog('Backend', 'success', `resposta recebida - status ${backendResponse.status}`);

      const data = await backendResponse.json();
      setBackendResponse(data);
      addLog('Backend', 'success', 'JSON parseado', data);

      if (!backendResponse.ok) {
        throw new Error(`Backend error: ${backendResponse.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Call original handler
      await handleGoogleResponse(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setFinalError(errorMessage);
      addLog('Error', 'error', errorMessage);
      console.error('Google auth error:', err);
    }
  };

  useEffect(() => {
    // Initialize Google Sign-In
    if (window.google && !authLoading && googleScriptLoaded) {
      window.google.accounts.id.initialize({
        client_id: '948102948683-u0o9lg73rprka2t0pp0tr4ol96echnf4.apps.googleusercontent.com',
        callback: handleGoogleResponseWithDebug,
      });

      // Render button in hero section
      const heroButton = document.getElementById('google-signin-button');
      if (heroButton && !heroButton.hasChildNodes()) {
        window.google.accounts.id.renderButton(heroButton, {
          theme: 'dark',
          size: 'large',
          text: 'signin_with',
        });
        setButtonRendered(true);
        addLog('Button', 'success', 'botão renderizado (hero)');
      }

      // Render button in CTA section
      const ctaButton = document.getElementById('google-signin-button-cta');
      if (ctaButton && !ctaButton.hasChildNodes()) {
        window.google.accounts.id.renderButton(ctaButton, {
          theme: 'dark',
          size: 'large',
          text: 'signin_with',
        });
        addLog('Button', 'success', 'botão renderizado (cta)');
      }
    }
  }, [authLoading, handleGoogleResponseWithDebug, googleScriptLoaded, addLog]);

  const loadMechanics = async () => {
    try {
      setError(null);
      const result = await BaseCrudService.getAll<GameMechanics>('gamemechanics');
      setMechanics(result.items || []);
    } catch (error) {
      console.error('Error loading mechanics:', error);
      setError('Erro ao carregar mecânicas do jogo');
      setMechanics([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-[40vh]">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-24 bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <h1 className="font-heading text-7xl lg:text-9xl uppercase tracking-wider text-foreground">
              Domínio do <span className="text-primary">Comando</span>
            </h1>
            <p className="font-paragraph text-xl lg:text-2xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
              Mergulhe em um universo de estratégia, poder e domínio absoluto. Domine o jogo, controle o destino.
            </p>
            <div className="flex gap-4 justify-center pt-8">
              <Link
                to="/galeria"
                className="px-8 py-4 bg-primary text-primary-foreground font-heading uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-all"
              >
                Explorar Galeria
              </Link>
              {!isAuthenticated ? (
                <div
                  id="google-signin-button"
                  className="flex items-center"
                />
              ) : (
                <Link
                  to="/profile"
                  className="px-8 py-4 border-2 border-primary text-primary font-heading uppercase tracking-wider rounded-lg hover:bg-primary/10 transition-all"
                >
                  Meu Perfil
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Game Mechanics Section */}
      <section className="py-24">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-5xl lg:text-6xl uppercase tracking-wider text-foreground mb-4">
              Mecânicas do <span className="text-primary">Jogo</span>
            </h2>
            <p className="font-paragraph text-lg text-foreground/70 max-w-2xl mx-auto">
              Descubra os sistemas que definem sua jornada no Domínio do Comando
            </p>
          </motion.div>

          <div className="min-h-[600px]">
            {isLoading ? null : error ? (
              <div className="text-center py-24">
                <p className="font-paragraph text-xl text-destructive mb-4">
                  {error}
                </p>
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

      {/* CTA Section */}
      <section className="py-24 bg-custom4/20">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            <h2 className="font-heading text-5xl lg:text-6xl uppercase tracking-wider text-foreground">
              Pronto para <span className="text-primary">Dominar</span>?
            </h2>
            <p className="font-paragraph text-lg text-foreground/70 max-w-2xl mx-auto">
              Junte-se a milhares de jogadores que já conquistaram seu lugar no Domínio do Comando
            </p>
            {!isAuthenticated ? (
              <div id="google-signin-button-cta" className="flex justify-center" />
            ) : (
              <Link
                to="/profile"
                className="inline-block px-10 py-4 bg-primary text-primary-foreground font-heading uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-all text-lg"
              >
                Começar Agora
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Debug Panel */}
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
    </div>
  );
}