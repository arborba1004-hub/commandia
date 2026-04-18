import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const player = usePlayerStore((state) => state.player);

  const playerId =
    (player as any)?._id ||
    (player as any)?.id ||
    player?.googleId ||
    '';

  if (!isLoaded) {
    return <div className="min-h-screen bg-black" />;
  }

  if (!playerId) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
