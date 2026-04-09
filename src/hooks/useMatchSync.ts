/**
 * LEGACY/EXPERIMENTAL: Match Synchronization Hook
 * 
 * ⚠️ DEPRECATED - This hook is no longer used in the main application flow.
 * It was designed for real-time match synchronization but is not currently active.
 * 
 * Kept for reference and potential future matchmaking implementation.
 * No new matchmaking features should use this hook.
 */

import { useState, useEffect, useCallback } from 'react';
import { subscribe } from 'wix-realtime';

interface MatchState {
  _id: string;
  matchId: string;
  players: string[];
  status: 'waiting' | 'inProgress' | 'finished';
  currentTurnPlayerId: string | null;
  gameData: any;
  createdAt: Date;
  updatedAt: Date;
  winnerId: string | null;
}

interface MatchUpdate {
  event: string;
  match?: MatchState;
  playerId?: string;
  move?: any;
  nextTurn?: string;
  winner?: string | null;
  gameState?: any;
  timestamp?: string;
}

/**
 * LEGACY: Hook for real-time match synchronization
 * 
 * @deprecated Not currently used in the main application flow
 */
export function useMatchSync(matchId: string) {
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<MatchUpdate | null>(null);

  // Carregar estado inicial da partida
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setIsLoading(true);
        // Chamar função backend para obter estado
        const response = await fetch('/api/match/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId })
        });
        
        if (!response.ok) throw new Error('Falha ao carregar estado da partida');
        
        const data = await response.json();
        setMatchState(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialState();
  }, [matchId]);

  // Subscrever a atualizações em tempo real
  useEffect(() => {
    const channelName = `partida_${matchId}`;
    let unsubscribe: (() => void) | null = null;

    const setupSubscription = async () => {
      try {
        unsubscribe = await subscribe(channelName, (message: MatchUpdate) => {
          setLastUpdate(message);

          // Atualizar estado baseado no tipo de evento
          switch (message.event) {
            case 'matchCreated':
            case 'stateUpdated':
              if (message.match) {
                setMatchState(message.match);
              }
              break;

            case 'moveMade':
              if (message.gameState) {
                setMatchState(prev => prev ? {
                  ...prev,
                  gameData: message.gameState,
                  currentTurnPlayerId: message.nextTurn || null,
                  status: message.winner ? 'finished' : 'inProgress',
                  winnerId: message.winner || null,
                  updatedAt: new Date(message.timestamp || Date.now())
                } : null);
              }
              break;

            default:
              console.log('Evento desconhecido:', message.event);
          }
        });
      } catch (err) {
        console.error('Erro ao subscrever ao canal:', err);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [matchId]);

  // Fazer uma jogada
  const makeMove = useCallback(async (playerId: string, moveData: any) => {
    try {
      const response = await fetch('/api/match/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, playerId, moveData })
      });

      if (!response.ok) throw new Error('Falha ao processar jogada');

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao fazer jogada';
      setError(errorMsg);
      throw err;
    }
  }, [matchId]);

  // Abandonar partida
  const abandonMatch = useCallback(async (playerId: string) => {
    try {
      const response = await fetch('/api/match/abandon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, playerId })
      });

      if (!response.ok) throw new Error('Falha ao abandonar partida');

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao abandonar partida';
      setError(errorMsg);
      throw err;
    }
  }, [matchId]);

  // Finalizar partida
  const finishMatch = useCallback(async (winnerId?: string) => {
    try {
      const response = await fetch('/api/match/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, winnerId })
      });

      if (!response.ok) throw new Error('Falha ao finalizar partida');

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao finalizar partida';
      setError(errorMsg);
      throw err;
    }
  }, [matchId]);

  return {
    matchState,
    isLoading,
    error,
    lastUpdate,
    makeMove,
    abandonMatch,
    finishMatch
  };
}
