/**
 * ProtectedRoute.tsx
 *
 * MUDANÇAS:
 *   - Remove chamada a loadPlayer() (hidratação agora vem do socket via useGameSocket)
 *   - isLoaded torna-se true quando socket envia 'playerInit'
 *   - Monta useGameSocket aqui para garantir que está ativo em todas as rotas protegidas
 */

import { type ReactNode }   from 'react';
import { Navigate }         from 'react-router-dom';
import { usePlayerStore }   from '@/store/playerStore';
import { useGameSocket }    from '@/hooks/useGameSocket';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Monta o socket UMA VEZ para toda a sessão autenticada
  useGameSocket();

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
