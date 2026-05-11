/**
 * useGameSocket.ts — Hook que escuta eventos do socket e hidrata o playerStore
 *
 * Responsabilidades:
 *   - Escuta 'playerInit' → hydratePlayerFromServer (primeira vez)
 *   - Escuta 'playerUpdate' → hydratePlayerFromServer (atualizações)
 *   - Escuta 'gangUpdate' → atualiza gang no store
 *   - Cleanup: remove listeners ao desmontar
 */

import { useEffect } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { getSocket } from '@/socket';

export function useGameSocket() {
  const hydratePlayerFromServer = usePlayerStore((state) => state.hydratePlayerFromServer);

  useEffect(() => {
    // Só roda no cliente
    if (typeof window === 'undefined') return;

    let socket: any = null;

    try {
      socket = getSocket();
    } catch (err) {
      // Sem token = usuário não autenticado, é normal
      console.log('🔵 useGameSocket: Sem token, usuário não autenticado');
      return;
    }

    if (!socket) return;

    // ── Listener para playerInit (primeira hidratação) ──
    const handlePlayerInit = (player: any) => {
      console.log('🟢 useGameSocket: playerInit recebido', { id: player?._id, name: player?.name });
      hydratePlayerFromServer(player);
    };

    // ── Listener para playerUpdate (atualizações contínuas) ──
    const handlePlayerUpdate = (player: any) => {
      console.log('🟢 useGameSocket: playerUpdate recebido', { id: player?._id });
      hydratePlayerFromServer(player);
    };

    // ── Listener para gangUpdate ──
    const handleGangUpdate = (gangData: any) => {
      console.log('🟢 useGameSocket: gangUpdate recebido', { gangId: gangData?.gangId });
      // Atualiza gang no playerStore
      usePlayerStore.setState((state) => ({
        ...state,
        gangMembers: gangData?.members || [],
        gangStats: gangData?.stats || {},
      }));
    };

    // Registra listeners
    socket.on('playerInit', handlePlayerInit);
    socket.on('playerUpdate', handlePlayerUpdate);
    socket.on('gangUpdate', handleGangUpdate);

    console.log('🔵 useGameSocket: Listeners registrados');

    // ── Cleanup: remove listeners ao desmontar ──
    return () => {
      console.log('🔵 useGameSocket: Removendo listeners');
      socket.off('playerInit', handlePlayerInit);
      socket.off('playerUpdate', handlePlayerUpdate);
      socket.off('gangUpdate', handleGangUpdate);
    };
  }, [hydratePlayerFromServer]);
}
