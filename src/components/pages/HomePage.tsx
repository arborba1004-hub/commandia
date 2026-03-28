import { useEffect, useRef, useState } from 'react';

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

export default function HomePage() {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  useEffect(() => {
    // Carregar script do Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: '948102948683-u0o9lg73rprka2t0pp0tr4ol96echnf4.apps.googleusercontent.com',
          callback: handleGoogleLogin,
        });

        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'dark',
            size: 'large',
            text: 'signin_with',
          });
        }
      }
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleGoogleLogin = async (response: any) => {
    setStatus({ type: 'loading', message: 'Autenticando...' });

    try {
      const credential = response.credential;

      const backendResponse = await fetch('https://comando-server.onrender.com/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credential }),
      });

      const data = await backendResponse.json();

      if (data.success) {
        // Salvar token JWT
        localStorage.setItem('authToken', data.token);

        // Salvar dados do jogador
        localStorage.setItem('playerData', JSON.stringify(data.player));

        console.log('Login bem-sucedido:', data);

        setStatus({
          type: 'success',
          message: `Bem-vindo, ${data.player.name}!`,
        });

        // Preparado para navegação futura para /game
        // window.location.href = '/game';
      } else {
        setStatus({
          type: 'error',
          message: data.message || 'Erro ao autenticar. Tente novamente.',
        });
        console.error('Erro de autenticação:', data);
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Erro ao conectar com o servidor. Tente novamente.',
      });
      console.error('Erro:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Título */}
        <h1 className="font-heading text-7xl font-bold text-primary mb-4">
          Comando
        </h1>

        {/* Subtítulo */}
        <p className="font-paragraph text-lg text-secondary mb-12">
          Domine o jogo multiplayer
        </p>

        {/* Botão Google */}
        <div
          ref={googleButtonRef}
          className="flex justify-center mb-8"
        />

        {/* Status/Erro */}
        {status.message && (
          <div
            className={`mt-6 p-4 rounded text-sm font-paragraph ${
              status.type === 'success'
                ? 'bg-green-900 text-green-100'
                : status.type === 'error'
                  ? 'bg-destructive text-white'
                  : 'bg-gray-800 text-gray-100'
            }`}
          >
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}
