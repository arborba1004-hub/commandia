import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SignInProps {
  title?: string;
  message?: string;
  className?: string;
  cardClassName?: string;
  googleClientId?: string;
}

export function SignIn({
  title = "Sign In Required",
  message = "Please sign in to access this content.",
  className = "min-h-screen flex items-center justify-center px-4 ",
  cardClassName = "w-fit max-w-xl mx-auto text-foreground",
  googleClientId = "948102948683-u0o9lg73rprka2t0pp0tr4ol96echnf4.apps.googleusercontent.com"
}: SignInProps) {
  
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

  const handleCredentialResponse = (response: any) => {
    console.log('Google Sign-In successful!', response);
    // Handle the JWT token from Google
    if (response.credential) {
      // You can send this token to your backend for verification
      localStorage.setItem('googleToken', response.credential);
    }
  };

  return (
    <div className={className}>
      <Card className={cardClassName}>
        <CardHeader className="text-center space-y-4 py-10 px-10">
          <CardTitle className="">{title}</CardTitle>
          <CardDescription className="">{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center px-10 pb-10">
          <div id="google-signin-button" className="flex justify-center"></div>
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
