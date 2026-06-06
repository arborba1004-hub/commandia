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
 *   - Ouve 'authTokenChanged' → reconecta socket e registra listeners novamente
 *   - Expõe o socket para uso em outros componentes via getSocket()
 */

import { useEffect, useRef } from 'react';
import { usePlayerStore }    from '@/store/playerStore';
import { useFactionStore }   from '@/store/factionStore';
import { useGangStore }      from '@/store/gangStore';
import { reconnectSocket, disconnectSocket } from '@/socket';

export function useGameSocket(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const hydratePlayerFromServer = usePlayerStore((s) => s.hydratePlayerFromServer);
  const loadPlayer              = usePlayerStore((s) => s.loadPlayer);
  const setFaction              = useFactionStore((s) => s.setFaction);
  const socketInitializedRef    = useRef(false);
  const mountedRef              = useRef(true);
  const handlersRef             = useRef<{
    playerInit?: any;
    playerUpdate?: any;
    gangUpdate?: any;
    connect?: any;
    connectError?: any;
    attackIncoming?: any;
    attackReceived?: any;
  }>({});

  // ── Função para registrar todos os listeners globais ──────────────────────────
  const registerGlobalListeners = (socket: any) => {
    // Remove listeners antigos se existirem
    if (handlersRef.current.playerInit) {
      socket.off('playerInit', handlersRef.current.playerInit);
    }
    if (handlersRef.current.playerUpdate) {
      socket.off('playerUpdate', handlersRef.current.playerUpdate);
    }
    if (handlersRef.current.gangUpdate) {
      socket.off('gangUpdate', handlersRef.current.gangUpdate);
    }
    if (handlersRef.current.connect) {
      socket.off('connect', handlersRef.current.connect);
    }
    if (handlersRef.current.connectError) {
      socket.off('connect_error', handlersRef.current.connectError);
    }
    if (handlersRef.current.attackIncoming) {
      socket.off('attackIncoming', handlersRef.current.attackIncoming);
    }
    if (handlersRef.current.attackReceived) {
      socket.off('attackReceived', handlersRef.current.attackReceived);
    }

    // ── playerInit: estado completo do jogador ao conectar ────────────────────
    // Substitui completamente o loadPlayer() + polling do playerStore
    const handlePlayerInit = (data: { player: any; faction?: any }) => {
      if (!mountedRef.current) return;
      hydratePlayerFromServer(data.player);
      if (data.faction !== undefined) {
        setFaction(data.faction);
      }
      if (data.player?.gang) {
        useGangStore.setState((state) => ({
          gang: {
            ...(state.gang ?? {}),
            ...data.player.gang,
            members: data.player.gang.members ?? state.gang?.members ?? [],
            stats: data.player.gang.stats ?? state.gang?.stats,
          }
        }))
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
      if (data.player?.gang) {
        useGangStore.setState((state) => ({
          gang: {
            ...(state.gang ?? {}),
            ...data.player.gang,
            members: data.player.gang.members ?? state.gang?.members ?? [],
            stats: data.player.gang.stats ?? state.gang?.stats,
          }
        }))
      }
    };

    // ── gangUpdate: quando gang muda (treinamento, recrutamento) ─────────────
    const handleGangUpdate = (data: { gang: any }) => {
      if (!mountedRef.current || !data?.gang) return;

      // Atualiza playerStore diretamente sem scheduleSync
      const currentPlayer = usePlayerStore.getState().player;

      usePlayerStore.setState({
        player: {
          ...currentPlayer,
          gang: data.gang,
          gangMembers: data.gang?.members ?? currentPlayer.gangMembers,
          gangStats: data.gang?.stats ?? currentPlayer.gangStats,
        },
        isLoaded: true,
        lastSyncAt: Date.now(),
        lastServerHydrationAt: Date.now(),
        pendingLocalChanges: false,
      });

      // Propaga members/stats para gangStore para que GangPage,
      // MapAttackWithGangModal, AttackMemberSelector, usePowerSync etc.
      // reflitam o estado em tempo real após training:updated.
      const currentGang = useGangStore.getState().gang;
      if (currentGang) {
        useGangStore.setState({
          gang: {
            ...currentGang,
            members: data.gang?.members ?? currentGang.members,
          },
        });
      }
    };

    const handleConnect = () => {
      console.log('🟢 Socket conectado');
    };

    const handleConnectError = (err: Error) => {
      console.error('🔴 Socket connection error:', err.message);
    };

    // ── attackIncoming: defensor recebe aviso de marcha (antes da resolução) ──
    // Emitido pelo backend em startBattle. Frontend mostra toast com tempo de chegada.
    const handleAttackIncoming = (data: {
      attackerName: string;
      attackerFaction?: string | null;
      memberCount: number;
      arriveAtIso: string;
      totalDurationMs: number;
      message: string;
    }) => {
      if (!mountedRef.current) return;
      // Disponibiliza pro AttackIncomingToast consumir via event listener.
      try {
        (window as any).__lastAttackIncoming = { ...data, receivedAt: Date.now() };
        window.dispatchEvent(new CustomEvent('attack:incoming', { detail: data }));
      } catch { /* noop */ }
    };

    // ── attackReceived: quando o jogador recebe um ataque ──────────────────────
    const handleAttackReceived = (data: {
      attackerName: string;
      loot: number | null;
      critical: boolean;
      message: string;
    }) => {
      if (!mountedRef.current) return;
      usePlayerStore.getState().addNotification({
        id: `attack_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: 'attack_received',
        attackerName: data.attackerName,
        success: Boolean(data.loot && data.loot > 0),
        loot: Number(data.loot || 0),
        createdAt: new Date().toISOString(),
        read: false,
      });
      try {
        (window as any).__lastAttackReceived = { ...data, receivedAt: Date.now() };
        window.dispatchEvent(new CustomEvent('attack:received', { detail: data }));
      } catch { /* noop */ }
    };

    // Registra todos os listeners
    socket.on('playerInit', handlePlayerInit);
    socket.on('playerUpdate', handlePlayerUpdate);
    socket.on('gangUpdate', handleGangUpdate);
    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('attackIncoming', handleAttackIncoming);
    socket.on('attackReceived', handleAttackReceived);

    // Armazena referências para limpeza posterior
    handlersRef.current = {
      playerInit: handlePlayerInit,
      playerUpdate: handlePlayerUpdate,
      gangUpdate: handleGangUpdate,
      connect: handleConnect,
      connectError: handleConnectError,
      attackIncoming: handleAttackIncoming,
      attackReceived: handleAttackReceived,
    };
  };

  const removeRegisteredListeners = (socket: any) => {
    if (!socket) return;
    if (handlersRef.current.playerInit) socket.off('playerInit', handlersRef.current.playerInit);
    if (handlersRef.current.playerUpdate) socket.off('playerUpdate', handlersRef.current.playerUpdate);
    if (handlersRef.current.gangUpdate) socket.off('gangUpdate', handlersRef.current.gangUpdate);
    if (handlersRef.current.connect) socket.off('connect', handlersRef.current.connect);
    if (handlersRef.current.connectError) socket.off('connect_error', handlersRef.current.connectError);
    if (handlersRef.current.attackIncoming) socket.off('attackIncoming', handlersRef.current.attackIncoming);
    if (handlersRef.current.attackReceived) socket.off('attackReceived', handlersRef.current.attackReceived);
  };

  const connectAndRegister = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      socketInitializedRef.current = false;
      disconnectSocket();
      return null;
    }

    const socket = reconnectSocket();
    registerGlobalListeners(socket);
    socketInitializedRef.current = true;
    return socket;
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      console.log('⚠️ useGameSocket skipped during SSR/build');
      return;
    }

    mountedRef.current = true;
    let socket: any = null;
    let playerInitFallbackTimeoutId: ReturnType<typeof window.setTimeout> | null = null;

    const clearPlayerInitFallback = () => {
      if (playerInitFallbackTimeoutId !== null) {
        window.clearTimeout(playerInitFallbackTimeoutId);
        playerInitFallbackTimeoutId = null;
      }
    };

    const schedulePlayerInitFallback = () => {
      clearPlayerInitFallback();
      if (!enabled) return;

      playerInitFallbackTimeoutId = window.setTimeout(() => {
        if (!mountedRef.current) return;
        if (usePlayerStore.getState().isLoaded) return;

        // Render free tier pode demorar a acordar e o playerInit via WS pode atrasar.
        // /player/me desbloqueia a UI; o socket continua ativo para realtime.
        void loadPlayer();
      }, 5000);
    };

    const handleAuthTokenChanged = () => {
      if (!enabled) return;
      try {
        socket = connectAndRegister();
        schedulePlayerInitFallback();
      } catch (error) {
        console.error('🔴 useGameSocket: Erro ao conectar socket:', error);
        socketInitializedRef.current = false;
      }
    };

    window.addEventListener('authTokenChanged', handleAuthTokenChanged);

    if (!enabled) {
      socketInitializedRef.current = false;
      disconnectSocket();
    } else {
      try {
        socket = connectAndRegister();
        schedulePlayerInitFallback();
      } catch (error) {
        console.error('Erro ao conectar socket:', error);
        socketInitializedRef.current = false;
      }
    }

    return () => {
      mountedRef.current = false;
      window.removeEventListener('authTokenChanged', handleAuthTokenChanged);
      clearPlayerInitFallback();
      removeRegisteredListeners(socket);
      socketInitializedRef.current = false;
    };
  }, [enabled, loadPlayer]);
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
