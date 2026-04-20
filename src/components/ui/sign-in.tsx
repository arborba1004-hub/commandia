import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

interface SignInProps {
  title?: string;
  message?: string;
  className?: string;
  cardClassName?: string;
  googleClientId?: string;
  onSignInSuccess?: () => void;
}

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

export function SignIn({
  title = 'Sign In Required',
  message = 'Please sign in to access this content.',
  className = 'min-h-screen flex items-center justify-center px-4',
  cardClassName = 'w-fit max-w-xl mx-auto text-foreground',
  googleClientId = '948102948683-u0o9lg73rprka2t0pp0tr4ol96echnf4.apps.googleusercontent.com',
  onSignInSuccess,
}: SignInProps) {
  const {
    isAuthenticated,
    isLoading,
    error,
    playerData,
    handleGoogleResponse,
    logout,
  } = useGoogleAuth();

  const [success, setSuccess] = useState(false);
  const buttonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isAuthenticated) return;

    let cancelled = false;
    let injectedScript: HTMLScriptElement | null = null;

    const renderGoogleButton = () => {
      if (cancelled || !window.google || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: any) => {
          const result = await handleGoogleResponse(response);

          if (result?.ok) {
            setSuccess(true);

            if (onSignInSuccess) {
              onSignInSuccess();
            }
          }
        },
      });

      buttonRef.current.innerHTML = '';

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'dark',
        size: 'large',
      });
    };

    if (window.google) {
      renderGoogleButton();
    } else {
      injectedScript = document.createElement('script');
      injectedScript.src = 'https://accounts.google.com/gsi/client';
      injectedScript.async = true;
      injectedScript.defer = true;
      injectedScript.onload = renderGoogleButton;
      document.head.appendChild(injectedScript);
    }

    return () => {
      cancelled = true;

      if (injectedScript && document.head.contains(injectedScript)) {
        document.head.removeChild(injectedScript);
      }
    };
  }, [googleClientId, handleGoogleResponse, isAuthenticated, onSignInSuccess]);

  const handleLogout = () => {
    logout();
    setSuccess(false);
  };

  const handleContinue = () => {
    if (onSignInSuccess) {
      onSignInSuccess();
    }
  };

  return (
    <div className={className}>
      <Card className={cardClassName}>
        <CardHeader className="text-center space-y-4 py-10 px-10">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>

        <CardContent className="text-center px-10 pb-10 space-y-4">
          {error && (
            <Alert className="border-destructive bg-destructive/10">
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-600 bg-green-600/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Sign-in successful!
              </AlertDescription>
            </Alert>
          )}

          {isAuthenticated && playerData ? (
            <div className="space-y-6">
              <div className="bg-custom4/30 border border-secondary/20 rounded-lg p-6 space-y-3">
                {playerData.name && (
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Nome do Jogador</p>
                    <p className="font-heading text-xl text-foreground">
                      {playerData.name}
                    </p>
                  </div>
                )}

                {playerData.email && (
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Email</p>
                    <p className="font-paragraph text-base text-foreground/80">
                      {playerData.email}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleContinue}
                  className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider hover:bg-primary/90"
                >
                  Continuar
                </Button>

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full border-secondary/40 text-foreground hover:bg-secondary/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div
                ref={buttonRef}
                className={`flex justify-center ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
              />

              {isLoading && (
                <p className="text-sm text-secondary-foreground">
                  Authenticating with backend...
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}