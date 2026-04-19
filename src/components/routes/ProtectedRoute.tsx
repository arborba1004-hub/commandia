import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isLoaded   = usePlayerStore((s) => s.isLoaded);
  const player     = usePlayerStore((s) => s.player);
  const loadPlayer = usePlayerStore((s) => s.loadPlayer);

  useEffect(() => {
    if (!isLoaded) void loadPlayer();
  }, [isLoaded, loadPlayer]);

  const playerId =
    (player as any)?._id || (player as any)?.id || player?.googleId || '';

  if (!isLoaded) return <div className="min-h-screen bg-black" />;
  if (!playerId)  return <Navigate to="/" replace />;
  return <>{children}</>;
}