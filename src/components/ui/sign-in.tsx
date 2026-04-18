import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SignInProps {
  title?: string;
  message?: string;
  className?: string;
  cardClassName?: string;
  googleClientId?: string;
  onSignInSuccess?: () => void;
}

interface PlayerData {
  name?: string;
  email?: string;
  [key: string]: any;
}

export function SignIn({
  title = "Sign In Required",
  message = "Please sign in to access this content.",
  className = "min-h-screen flex items-center justify-center px-4 ",
  cardClassName = "w-fit max-w-xl mx-auto text-foreground",
  googleClientId = "948102948683-u0o9lg73rprka2t0pp0tr4ol96echnf4.apps.googleusercontent.com",
  onSignInSuccess
}: SignInProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  
  useEffect(() => {
    // Check for existing authentication on mount
    checkExistingAuth();
  }, []);

  useEffect(() => {
    // Load Google Sign-In script only if not authenticated
    if (isAuthenticated) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { 
            theme: 'dark',
            size: 'large',
            width: '100%'
          }
        );
      }
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [googleClientId, isAuthenticated]);

  const checkExistingAuth = () => {
    const authToken = localStorage.getItem('authToken');
    const playerDataStr = localStorage.getItem('playerData');

    if (authToken && playerDataStr) {
      try {
        const data = JSON.parse(playerDataStr);
        setPlayerData(data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Error parsing playerData:', err);
        setIsAuthenticated(false);
      }
    }
  };

  const handleContinue = () => {
    if (onSignInSuccess) {
      onSignInSuccess();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('playerData');
    setIsAuthenticated(false);
    setPlayerData(null);
    setError(null);
    setSuccess(false);
  };

  const handleCredentialResponse = async (response: any) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      // Send token to backend
      const backendResponse = await fetch('https://comando-backend.onrender.com/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await backendResponse.json();

      // Check if backend response indicates success
      if (!data.success) {
        throw new Error(data.message || 'Backend authentication failed');
      }

      // Normalize player data to ensure correct _id extraction
      const rawPlayer = data.player ?? {};
      const normalizedPlayer = {
        ...rawPlayer,
        _id: String(rawPlayer._id ?? rawPlayer.id ?? rawPlayer.googleId ?? ''),
      };

      // Save authentication data to localStorage
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      if (normalizedPlayer) {
        localStorage.setItem('playerData', JSON.stringify(normalizedPlayer));
      }

      setSuccess(true);
      
      // Call callback if provided
      if (onSignInSuccess) {
        setTimeout(() => {
          onSignInSuccess();
        }, 1500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign-in';
      setError(errorMessage);
      console.error('Sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <Card className={cardClassName}>
        <CardHeader className="text-center space-y-4 py-10 px-10">
          <CardTitle className="">{title}</CardTitle>
          <CardDescription className="">{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center px-10 pb-10 space-y-4">
          {error && (
            <Alert className="border-destructive bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-600 bg-green-600/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Sign-in successful! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          {isAuthenticated && playerData ? (
            <div className="space-y-6">
              <div className="bg-custom4/30 border border-secondary/20 rounded-lg p-6 space-y-3">
                {playerData.name && (
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Nome do Jogador</p>
                    <p className="font-heading text-xl text-foreground">{playerData.name}</p>
                  </div>
                )}
                {playerData.email && (
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Email</p>
                    <p className="font-paragraph text-base text-foreground/80">{playerData.email}</p>
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
                id="google-signin-button" 
                className={`flex justify-center ${loading || success ? 'opacity-50 pointer-events-none' : ''}`}
              ></div>
              
              {loading && (
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

declare global {
  interface Window {
    google: any;
  }
}
