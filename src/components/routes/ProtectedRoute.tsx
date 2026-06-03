/**
 * ProtectedRoute.tsx
 *
 * MUDANÇAS:
 *   - Remove chamada a loadPlayer() (hidratação agora vem do socket via useGameSocket)
 *   - isLoaded torna-se true quando socket envia 'playerInit'
 *   - useGameSocket agora é chamado em Layout (global para toda a app)
 */

import { useEffect, type ReactNode }   from 'react';
import { Navigate }         from 'react-router-dom';
import { usePlayerStore }   from '@/store/playerStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isLoaded = usePlayerStore((s) => s.isLoaded);
  const player   = usePlayerStore((s) => s.player);
  const loadPlayer = usePlayerStore((s) => s.loadPlayer);

  const hasToken =
    typeof window !== 'undefined' &&
    Boolean(localStorage.getItem('authToken'));

  useEffect(() => {
    if (!hasToken || isLoaded) return;

    // Dá uma pequena janela para o socket enviar playerInit primeiro.
    // Se ele atrasar/falhar, /player/me entra como fallback sem duplicar carga no Mongo.
    const timeoutId = window.setTimeout(() => {
      if (!usePlayerStore.getState().isLoaded) void loadPlayer();
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [hasToken, isLoaded, loadPlayer]);

  // Sem token → redireciona imediatamente
  if (!hasToken) {
    return <Navigate to="/" replace />;
  }

  // Aguarda /player/me ou playerInit do socket sem deixar a tela “sumida”.
  if (!isLoaded) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-black px-6 pt-24 text-center text-sm font-bold uppercase tracking-[0.18em] text-[#f6d27b]">
        Carregando jogador...
      </div>
    );
  }

  // Player carregado mas sem _id → estado corrompido → volta para home
  const playerId = String((player as any)?._id || (player as any)?.id || player?.googleId || '');
  if (!playerId) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
