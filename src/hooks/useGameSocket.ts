/**
 * useGameSocket.ts
 *
 * Hook que gerencia o ciclo de vida completo do socket de jogo.
 * Deve ser montado UMA VEZ no topo da árvore (ex: em Layout).
 *
 * Responsabilidades:
 *   - Conecta/desconecta o socket conforme o token
 *   - Ouve 'playerInit'   → hydrata o playerStore (substitui loadPlayer + polling)
 *   - Ouve 'playerUpdate' → hydrata o playerStore após qualquer mutação
 *   - Ouve 'gangUpdate'   → atualiza o gangStore
 *   - Expõe o socket para uso em outros componentes via getSocket()
 */

import { useEffect, useRef } from 'react';
import { usePlayerStore }    from '@/store/playerStore';
import { useFactionStore }   from '@/store/factionStore';
import { reconnectSocket, disconnectSocket } from '@/socket';

export function useGameSocket() {
  const hydratePlayerFromServer = usePlayerStore((s) => s.hydratePlayerFromServer);
  const setFaction              = useFactionStore((s) => s.setFaction);
  const socketInitializedRef    = useRef(false);

  useEffect(() => {
    // Prevent socket initialization during SSR/build
    if (typeof window === 'undefined') {
      console.log('⚠️ useGameSocket skipped during SSR/build');
      return;
    }

    // Evita múltiplas inicializações do socket
    if (socketInitializedRef.current) return;
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('⚠️ No auth token available - socket initialization skipped');
      return;
    }

    try {
      socketInitializedRef.current = true;

      // Garante socket autenticado com token atual
      const socket = reconnectSocket();

      // ── playerInit: estado completo do jogador ao conectar ────────────────────
      // Substitui completamente o loadPlayer() + polling do playerStore
      const handlePlayerInit = (data: { player: any; faction?: any }) => {
        if (!mountedRef.current) return;
        hydratePlayerFromServer(data.player);
        if (data.faction !== undefined) {
          setFaction(data.faction);
        }
      };

      // ── playerUpdate: estado atualizado após qualquer mutação backend ─────────
      // Emitido por todos os controllers após player.save()
      const handlePlayerUpdate = (data: { player: any; faction?: any }) => {
        if (!mountedRef.current) return;
        hydratePlayerFromServer(data.player);
        if (data.faction !== undefined) {
          setFaction(data.faction);
        }
      };

      // ── gangUpdate: quando gang muda (treinamento, recrutamento) ─────────────
      const handleGangUpdate = (data: { gang: any }) => {
        if (!mountedRef.current || !data?.gang) return;
        // Atualiza gang dentro do playerStore
        usePlayerStore.getState().applyPlayerUpdate((p) => (
          {
            ...p,
            gang: data.gang,
            gangMembers: data.gang?.members ?? p.gangMembers,
            gangStats:   data.gang?.stats   ?? p.gangStats,
          }
        ));
      };

      const handleConnect = () => {
        console.log('🟢 Socket conectado');
      };

      const handleConnectError = (err: Error) => {
        console.error('🔴 Socket connection error:', err.message);
      };

      socket.on('playerInit', handlePlayerInit);
      socket.on('playerUpdate', handlePlayerUpdate);
      socket.on('gangUpdate', handleGangUpdate);
      socket.on('connect', handleConnect);
      socket.on('connect_error', handleConnectError);

      return () => {
        mountedRef.current = false;
        socket.off('playerInit', handlePlayerInit);
        socket.off('playerUpdate', handlePlayerUpdate);
        socket.off('gangUpdate', handleGangUpdate);
        socket.off('connect', handleConnect);
        socket.off('connect_error', handleConnectError);
        // Não desconecta o socket aqui — ele é singleton e pode ser usado por outros componentes
      };
    } catch (error) {
      console.error('Erro ao conectar socket:', error);
      socketInitializedRef.current = false;
      return;
    }
  }, []); // Apenas na montagem — o socket é singleton
}

/**
 * Hook de logout: desconecta socket e limpa estado.
 * Chame no handler de logout.
 */
export function useSocketLogout() {
  const clearPlayer = usePlayerStore((s) => s.clearPlayer);
  const setFaction  = useFactionStore((s) => s.setFaction);

  return () => {
    localStorage.removeItem('authToken');
    disconnectSocket();
    clearPlayer();
    setFaction(null);
  };
}
