/**
 * useGameSocket.ts
 *
 * Hook que gerencia o ciclo de vida completo do socket de jogo.
 * Deve ser montado UMA VEZ no topo da árvore (ex: em ProtectedRoute ou Layout).
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
import { getSocket, reconnectSocket, disconnectSocket } from '@/socket';

export function useGameSocket() {
  const hydratePlayerFromServer = usePlayerStore((s) => s.hydratePlayerFromServer);
  const setFaction              = useFactionStore((s) => s.setFaction);
  const mountedRef              = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    // Garante socket autenticado com token atual
    const socket = reconnectSocket();
    mountedRef.current = true;

    // ── playerInit: estado completo do jogador ao conectar ────────────────────
    // Substitui completamente o loadPlayer() + polling do playerStore
    socket.on('playerInit', (data: { player: any; faction?: any }) => {
      if (!mountedRef.current) return;
      hydratePlayerFromServer(data.player);
      if (data.faction !== undefined) {
        setFaction(data.faction);
      }
    });

    // ── playerUpdate: estado atualizado após qualquer mutação backend ─────────
    // Emitido por todos os controllers após player.save()
    socket.on('playerUpdate', (data: { player: any; faction?: any }) => {
      if (!mountedRef.current) return;
      hydratePlayerFromServer(data.player);
      if (data.faction !== undefined) {
        setFaction(data.faction);
      }
    });

    // ── gangUpdate: quando gang muda (treinamento, recrutamento) ─────────────
    socket.on('gangUpdate', (data: { gang: any }) => {
      if (!mountedRef.current || !data?.gang) return;
      // Atualiza gang dentro do playerStore
      usePlayerStore.getState().applyPlayerUpdate((p) => ({
        ...p,
        gang: data.gang,
        gangMembers: data.gang?.members ?? p.gangMembers,
        gangStats:   data.gang?.stats   ?? p.gangStats,
      }));
    });

    socket.on('connect', () => {
      console.log('🟢 Socket conectado');
    });

    socket.on('connect_error', (err: Error) => {
      console.error('🔴 Socket connection error:', err.message);
    });

    return () => {
      mountedRef.current = false;
      socket.off('playerInit');
      socket.off('playerUpdate');
      socket.off('gangUpdate');
      socket.off('connect');
      socket.off('connect_error');
      // Não desconecta o socket aqui — ele é singleton e pode ser usado por outros componentes
    };
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
