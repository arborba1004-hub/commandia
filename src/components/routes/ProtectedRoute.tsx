import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Redireciona para "/" se o jogador não estiver autenticado.
 * Aguarda o carregamento inicial antes de decidir.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const player   = usePlayerStore((state) => state.player);

  // Ainda carregando — não redireciona ainda
  if (!isLoaded) return null;

  // Não autenticado → volta para home/login
  if (!player?._id) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
