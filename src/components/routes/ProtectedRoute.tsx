import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';

export default function ProtectedRoute({ children }: ReactNode extends infer T ? { children: T } : never) {
  const isLoaded = usePlayerStore((s) => s.isLoaded);
  const player   = usePlayerStore((s) => s.player);

  const playerId =
    (player as any)?._id || (player as any)?.id || player?.googleId || '';

  if (!isLoaded) return <div className="min-h-screen bg-black" />;
  if (!playerId)  return <Navigate to="/" replace />;
  return <>{children}</>;
}
