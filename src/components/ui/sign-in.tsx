import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface SignInProps {
  title?: string;
  message?: string;
  className?: string;
  cardClassName?: string;
  googleClientId?: string;
  onSignInSuccess?: () => void;
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
  
  useEffect(() => {
    // Load Google Sign-In script
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
  }, [googleClientId]);

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

      // Save authentication data to localStorage
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      if (data.player) {
        localStorage.setItem('playerData', JSON.stringify(data.player));
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

          <div 
            id="google-signin-button" 
            className={`flex justify-center ${loading || success ? 'opacity-50 pointer-events-none' : ''}`}
          ></div>
          
          {loading && (
            <p className="text-sm text-secondary-foreground">
              Authenticating with backend...
            </p>
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
