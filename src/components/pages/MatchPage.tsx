// components/pages/MatchPage.tsx
// Página de exemplo para exibir uma partida em tempo real

import { useParams } from 'react-router-dom';
import { useMatchSync } from '@/hooks/useMatchSync';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { matchState, isLoading, error, lastUpdate, makeMove, abandonMatch } = useMatchSync(matchId || '');

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-lg text-destructive">Erro: {error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!matchState) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-lg">Partida não encontrada</p>
        </div>
        <Footer />
      </div>
    );
  }

  const handleMakeMove = async () => {
    try {
      // Exemplo de jogada - customize conforme necessário
      const moveData = {
        action: 'play_card',
        cardId: 'card_123'
      };
      
      await makeMove('player_1', moveData);
    } catch (err) {
      console.error('Erro ao fazer jogada:', err);
    }
  };

  const handleAbandon = async () => {
    try {
      await abandonMatch('player_1');
    } catch (err) {
      console.error('Erro ao abandonar:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-[100rem] mx-auto w-full px-4 py-8">
        <div className="space-y-6">
          {/* Informações da Partida */}
          <Card className="p-6 bg-custom4 border-primary">
            <h1 className="font-heading text-3xl mb-4">Partida {matchState.matchId}</h1>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="font-paragraph text-sm text-secondary">Status</p>
                <p className="font-heading text-lg capitalize">{matchState.status}</p>
              </div>
              
              <div>
                <p className="font-paragraph text-sm text-secondary">Jogadores</p>
                <p className="font-heading text-lg">{matchState.players.length}</p>
              </div>

              <div>
                <p className="font-paragraph text-sm text-secondary">Turno Atual</p>
                <p className="font-heading text-lg">{matchState.currentTurnPlayerId || 'N/A'}</p>
              </div>

              {matchState.winnerId && (
                <div>
                  <p className="font-paragraph text-sm text-secondary">Vencedor</p>
                  <p className="font-heading text-lg text-primary">{matchState.winnerId}</p>
                </div>
              )}
            </div>

            {/* Lista de Jogadores */}
            <div className="mb-6">
              <h2 className="font-heading text-xl mb-3">Jogadores</h2>
              <div className="space-y-2">
                {matchState.players.map((playerId) => (
                  <div
                    key={playerId}
                    className={`p-3 rounded border ${
                      playerId === matchState.currentTurnPlayerId
                        ? 'border-primary bg-primary/10'
                        : 'border-secondary/30'
                    }`}
                  >
                    <p className="font-paragraph">{playerId}</p>
                    {playerId === matchState.currentTurnPlayerId && (
                      <p className="text-sm text-primary">Sua vez</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Estado do Jogo */}
            <div className="mb-6">
              <h2 className="font-heading text-xl mb-3">Estado do Jogo</h2>
              <div className="bg-background p-4 rounded border border-secondary/30 max-h-64 overflow-auto">
                <pre className="font-mono text-sm text-secondary">
                  {JSON.stringify(matchState.gameData, null, 2)}
                </pre>
              </div>
            </div>

            {/* Última Atualização */}
            {lastUpdate && (
              <div className="mb-6 p-4 bg-background rounded border border-secondary/30">
                <h3 className="font-heading text-lg mb-2">Última Atualização</h3>
                <p className="font-paragraph text-sm text-secondary mb-2">
                  Evento: <span className="text-primary">{lastUpdate.event}</span>
                </p>
                {lastUpdate.playerId && (
                  <p className="font-paragraph text-sm text-secondary">
                    Jogador: {lastUpdate.playerId}
                  </p>
                )}
                {lastUpdate.timestamp && (
                  <p className="font-paragraph text-sm text-secondary">
                    {new Date(lastUpdate.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-4">
              {matchState.status === 'inProgress' && (
                <Button
                  onClick={handleMakeMove}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Fazer Jogada
                </Button>
              )}
              
              {matchState.status !== 'finished' && (
                <Button
                  onClick={handleAbandon}
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  Abandonar Partida
                </Button>
              )}
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
