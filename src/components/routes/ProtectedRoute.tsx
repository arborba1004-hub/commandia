/**
 * ProtectedRoute.tsx
 *
 * MUDANÇAS:
 *   - Remove chamada a loadPlayer() (hidratação agora vem do socket via useGameSocket)
 *   - isLoaded torna-se true quando socket envia 'playerInit'
 *   - useGameSocket agora é chamado em Layout (global para toda a app)
 */

import { type ReactNode }   from 'react';
import { Navigate }         from 'react-router-dom';
import { usePlayerStore }   from '@/store/playerStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isLoaded = usePlayerStore((s) => s.isLoaded);
  const player   = usePlayerStore((s) => s.player);

  const hasToken =
    typeof window !== 'undefined' &&
    Boolean(localStorage.getItem('authToken'));

  // Sem token → redireciona imediatamente
  if (!hasToken) {
    return <Navigate to="/" replace />;
  }

  // Aguarda playerInit do socket
  if (!isLoaded) {
    return <div className="min-h-screen bg-black" />;
  }

  // Player carregado mas sem _id → estado corrompido → volta para home
  const playerId = String((player as any)?._id || (player as any)?.id || player?.googleId || '');
  if (!playerId) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
