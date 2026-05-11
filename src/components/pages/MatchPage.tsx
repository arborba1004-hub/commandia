// components/pages/MatchPage.tsx
// LEGACY/EXPERIMENTAL PAGE - Not in main router
// Página de exemplo para exibir uma partida em tempo real

import { useParams } from 'react-router-dom';
// import { useMatchSync } from '@/hooks/useMatchSync'; // LEGACY: Removed from main flow
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
// ... keep existing code (Header and Footer rendered by Router layout) ...

export default function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  
  // LEGACY: useMatchSync hook removed from main flow
  // const { matchState, isLoading, error, lastUpdate, makeMove, abandonMatch } = useMatchSync(matchId || '');

  if (!matchId) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-lg">ID da partida não fornecido</p>
        </div>
        <Footer />
      </div>
    );
  }

  // LEGACY PAGE: This page is no longer active in the main router
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-lg font-heading mb-4">Página Legada</p>
          <p className="text-secondary">Esta página de matchmaking não está mais ativa.</p>
          <p className="text-secondary text-sm mt-2">O sistema de partidas foi removido do fluxo principal.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
