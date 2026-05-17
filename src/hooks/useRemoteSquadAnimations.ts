/**
 * hooks/useRemoteSquadAnimations.ts
 *
 * Escuta os broadcasts do backend e renderiza a animação do squad no mapa
 * local para defensores e observadores. Permite que TODOS os jogadores
 * vejam o squad inimigo em tempo real durante o ataque.
 *
 * Eventos socket consumidos:
 *
 *   'attack:squadStarted'   → emitido no startBattle. Payload contém origem,
 *                             alvo, tempo total, skin do comboio. O hook
 *                             monta a animação de IDA usando o tempo restante
 *                             calculado a partir de launchedAtIso.
 *
 *   'attack:squadResolved'  → emitido no resolveAttackDocument. Payload contém
 *                             a posição ATUAL do atacante e o tempo de viagem
 *                             da volta. O hook limpa a animação de IDA e monta
 *                             a animação de RETORNO até o centro do barraco do
 *                             atacante.
 *
 * O atacante NÃO recebe esses broadcasts (o backend o exclui via
 * broadcastToAll(..., attackerId)) — ele anima localmente via useMapAttack.
 *
 * Cleanup: cada animação é registrada em um Map keyed por battleId. Quando o
 * componente desmonta, todas as animações pendentes são canceladas.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getSocket } from '@/socket';
import { mountGangSquadAnimation, type MountedSquadAnimation } from '@/3d/gangSquadAnimation';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═════════════════════════════════════════════════════════════════════════════

type SquadStartedPayload = {
  battleId: string;
  attackerId: string;
  attackerName?: string;
  defenderId?: string;
  defenderName?: string;
  attackerConvoySkinId?: string;
  memberCount?: number;
  origin: { tileX: number; tileY: number };
  target: { tileX: number; tileY: number };
  route?: {
    fromTileX: number;
    fromTileY: number;
    toTileX: number;
    toTileY: number;
  };
  routeDistanceTiles?: number;
  timePerTileMs?: number;
  totalDurationMs?: number;
  launchedAtIso?: string;
  arriveAtIso?: string;
  barracoLevel?: number;
};

type SquadResolvedPayload = {
  battleId: string;
  attackerId: string;
  attackerName?: string;
  attackerConvoySkinId?: string;
  memberCount?: number;
  returnOrigin: { tileX: number; tileY: number };
  returnTarget: { tileX: number; tileY: number };
  returnRouteDistanceTiles?: number;
  returnTimePerTileMs?: number;
  returnTotalDurationMs?: number;
  returnLaunchedAtIso?: string;
  returnArriveAtIso?: string;
  resolution?: { success: boolean; critical: boolean };
};

export type UseRemoteSquadAnimationsOptions = {
  scene?: THREE.Scene | null;
  camera?: THREE.Camera | null;
  gridWidth?: number;
  gridHeight?: number;
};

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function buildRoute(
  fromTileX: number,
  fromTileY: number,
  toTileX: number,
  toTileY: number,
  gridWidth: number,
  gridHeight: number,
) {
  let x = Math.max(0, Math.min(gridWidth - 1, Math.floor(Number(fromTileX) || 0)));
  let y = Math.max(0, Math.min(gridHeight - 1, Math.floor(Number(fromTileY) || 0)));
  const tx = Math.max(0, Math.min(gridWidth - 1, Math.floor(Number(toTileX) || 0)));
  const ty = Math.max(0, Math.min(gridHeight - 1, Math.floor(Number(toTileY) || 0)));

  const route: Array<{ tileX: number; tileY: number }> = [{ tileX: x, tileY: y }];

  while (x !== tx) {
    x += x < tx ? 1 : -1;
    route.push({ tileX: x, tileY: y });
  }
  while (y !== ty) {
    y += y < ty ? 1 : -1;
    route.push({ tileX: x, tileY: y });
  }
  return route;
}

function computeRemainingMs(launchedAtIso?: string, totalDurationMs?: number): number {
  if (!launchedAtIso || !Number.isFinite(Number(totalDurationMs))) {
    return Number(totalDurationMs) || 0;
  }
  const launchedAtMs = new Date(launchedAtIso).getTime();
  if (!Number.isFinite(launchedAtMs)) return Number(totalDurationMs) || 0;
  const elapsed = Date.now() - launchedAtMs;
  return Math.max(0, Number(totalDurationMs) - elapsed);
}

// ═════════════════════════════════════════════════════════════════════════════
// HOOK
// ═════════════════════════════════════════════════════════════════════════════

export function useRemoteSquadAnimations(options: UseRemoteSquadAnimationsOptions) {
  const { scene, camera, gridWidth = 120, gridHeight = 120 } = options;

  // Map<battleId, animation> — separamos animações de ida e volta por sufixo.
  // forwardKey = battleId, returnKey = battleId + ':return'
  const animationsRef = useRef<Map<string, MountedSquadAnimation>>(new Map());

  useEffect(() => {
    if (!scene || !camera) return;

    let socket: ReturnType<typeof getSocket> | null = null;
    try {
      socket = getSocket();
    } catch {
      return;
    }
    if (!socket) return;

    const animations = animationsRef.current;

    function disposeAnimation(key: string) {
      const anim = animations.get(key);
      if (anim) {
        try { anim.cancel(); } catch { /* noop */ }
        animations.delete(key);
      }
    }

    // ── attack:squadStarted ────────────────────────────────────────────────
    function handleSquadStarted(payload: SquadStartedPayload) {
      try {
        if (!payload?.battleId) return;
        if (!scene) return;

        // Se já temos animação para esse battleId (raro), substitui.
        disposeAnimation(payload.battleId);

        const fromX = Number(payload.route?.fromTileX ?? payload.origin?.tileX ?? 0);
        const fromY = Number(payload.route?.fromTileY ?? payload.origin?.tileY ?? 0);
        const toX   = Number(payload.route?.toTileX   ?? payload.target?.tileX ?? 0);
        const toY   = Number(payload.route?.toTileY   ?? payload.target?.tileY ?? 0);

        const routeTiles = buildRoute(fromX, fromY, toX, toY, gridWidth, gridHeight);
        if (routeTiles.length === 0) return;

        const remainingMs = computeRemainingMs(payload.launchedAtIso, payload.totalDurationMs);
        const totalSteps  = Math.max(1, routeTiles.length - 1);
        const msPerTile   = remainingMs > 0
          ? Math.max(1, remainingMs / totalSteps)
          : Number(payload.timePerTileMs ?? 1000);

        const animation = mountGangSquadAnimation({
          scene,
          route: routeTiles,
          gridWidth,
          gridHeight,
          barracoLevel: Number(payload.barracoLevel ?? 1),
          memberCount:  Number(payload.memberCount  ?? 100),
          color: '#ff3b30',
          convoySkinId: typeof payload.attackerConvoySkinId === 'string' && payload.attackerConvoySkinId.trim()
            ? payload.attackerConvoySkinId
            : 'comboio_padrao',
          totalDurationMs: remainingMs > 0 ? remainingMs : undefined,
          timePerTileMs:   msPerTile,
        });

        animations.set(payload.battleId, animation);

        // Inicia a animação. Quando chega ao alvo, a animação fica "parada"
        // no destino até o broadcast 'attack:squadResolved' montar a volta
        // (que dispara disposeAnimation para essa key e cria a animação de
        // retorno em `${battleId}:return`).
        void animation.start().catch((err) => {
          console.error(`[useRemoteSquadAnimations] erro na IDA ${payload.battleId}:`, err);
        });
      } catch (err) {
        console.error('[useRemoteSquadAnimations] handleSquadStarted falhou:', err);
      }
    }

    // ── attack:squadResolved ───────────────────────────────────────────────
    function handleSquadResolved(payload: SquadResolvedPayload) {
      try {
        if (!payload?.battleId) return;
        if (!scene) return;

        // Limpa a animação de ida (squad parado no alvo).
        disposeAnimation(payload.battleId);

        const fromX = Number(payload.returnOrigin?.tileX ?? 0);
        const fromY = Number(payload.returnOrigin?.tileY ?? 0);
        const toX   = Number(payload.returnTarget?.tileX ?? 0);
        const toY   = Number(payload.returnTarget?.tileY ?? 0);

        const routeTiles = buildRoute(fromX, fromY, toX, toY, gridWidth, gridHeight);
        if (routeTiles.length === 0) return;

        const remainingMs = computeRemainingMs(
          payload.returnLaunchedAtIso,
          payload.returnTotalDurationMs,
        );
        const totalSteps  = Math.max(1, routeTiles.length - 1);
        const msPerTile   = remainingMs > 0
          ? Math.max(1, remainingMs / totalSteps)
          : Number(payload.returnTimePerTileMs ?? 1000);

        const returnKey  = `${payload.battleId}:return`;
        disposeAnimation(returnKey);

        const animation = mountGangSquadAnimation({
          scene,
          route: routeTiles,
          gridWidth,
          gridHeight,
          barracoLevel: 1, // velocidade já vem embutida no returnTotalDurationMs
          memberCount:   Number(payload.memberCount ?? 100),
          color: '#ff3b30',
          convoySkinId: typeof payload.attackerConvoySkinId === 'string' && payload.attackerConvoySkinId.trim()
            ? payload.attackerConvoySkinId
            : 'comboio_padrao',
          totalDurationMs: remainingMs > 0 ? remainingMs : undefined,
          timePerTileMs:   msPerTile,
        });

        animations.set(returnKey, animation);

        void animation.start().then(() => {
          // Squad chegou de volta → limpa.
          disposeAnimation(returnKey);
        }).catch((err) => {
          console.error(`[useRemoteSquadAnimations] erro no RETORNO ${payload.battleId}:`, err);
          disposeAnimation(returnKey);
        });
      } catch (err) {
        console.error('[useRemoteSquadAnimations] handleSquadResolved falhou:', err);
      }
    }

    socket.on('attack:squadStarted',  handleSquadStarted);
    socket.on('attack:squadResolved', handleSquadResolved);

    return () => {
      try {
        socket?.off('attack:squadStarted',  handleSquadStarted);
        socket?.off('attack:squadResolved', handleSquadResolved);
      } catch { /* noop */ }

      for (const anim of animations.values()) {
        try { anim.cancel(); } catch { /* noop */ }
      }
      animations.clear();
    };
  }, [scene, camera, gridWidth, gridHeight]);
}
