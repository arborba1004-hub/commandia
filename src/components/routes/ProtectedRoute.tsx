import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const player = usePlayerStore((state) => state.player);
  const loadPlayer = usePlayerStore((state) => state.loadPlayer);

  // Quem chama loadPlayer quando o app abre direto numa rota protegida (refresh)
  useEffect(() => {
    if (!isLoaded) {
      void loadPlayer();
    }
  }, [isLoaded, loadPlayer]);

  const playerId =
    (player as any)?._id ||
    (player as any)?.id ||
    player?.googleId ||
    '';

  // Ainda carregando — mostra tela preta (sem piscar, sem redirecionar)
  if (!isLoaded) {
    return <div className="min-h-screen bg-black" />;
  }

  // Carregado mas sem player → homepage
  if (!playerId) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
