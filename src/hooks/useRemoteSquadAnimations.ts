import { useEffect } from 'react';
import * as THREE from 'three';
import { getSocket } from '@/socket';
import { getConvoySkin } from '@/data/convoyCatalog';
import { mountAttackConvoy3D, type MountedAttackConvoy3D } from '@/components/game/convoy/convoy3DAnimator';
import {
  buildShortestTileRoute,
  getElapsedProgress,
  normalizeRouteTiles,
  type AttackRouteTile,
} from '@/utils/attackTravel';

export type UseRemoteSquadAnimationsOptions = {
  scene?: THREE.Scene | null;
  camera?: THREE.Camera | null;
  gridWidth?: number;
  gridHeight?: number;
};

type RemoteAttackPayload = {
  battleId?: string;
  attackerId?: string;
  attackerName?: string;
  defenderId?: string;
  defenderName?: string;
  attackerConvoySkinId?: string;
  memberCount?: number;
  origin?: { tileX?: number; tileY?: number };
  target?: { tileX?: number; tileY?: number };
  route?: { fromTileX?: number; fromTileY?: number; toTileX?: number; toTileY?: number };
  routeTiles?: AttackRouteTile[];
  totalDurationMs?: number;
  launchedAtIso?: string;
};

type RemoteResolvedPayload = RemoteAttackPayload & {
  returnOrigin?: { tileX?: number; tileY?: number };
  returnTarget?: { tileX?: number; tileY?: number };
  returnRouteTiles?: AttackRouteTile[];
  returnTotalDurationMs?: number;
  returnLaunchedAtIso?: string;
};

function toFiniteNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildRouteFromPayload(payload: RemoteAttackPayload, gridWidth: number, gridHeight: number): AttackRouteTile[] {
  const backendRoute = normalizeRouteTiles(payload.routeTiles, gridWidth, gridHeight);
  if (backendRoute.length >= 2) return backendRoute;

  const fromX = toFiniteNumber(payload.route?.fromTileX ?? payload.origin?.tileX, 0);
  const fromY = toFiniteNumber(payload.route?.fromTileY ?? payload.origin?.tileY, 0);
  const toX = toFiniteNumber(payload.route?.toTileX ?? payload.target?.tileX, fromX);
  const toY = toFiniteNumber(payload.route?.toTileY ?? payload.target?.tileY, fromY);

  return buildShortestTileRoute(fromX, fromY, toX, toY, gridWidth, gridHeight);
}

function buildReturnRouteFromPayload(payload: RemoteResolvedPayload, gridWidth: number, gridHeight: number): AttackRouteTile[] {
  const backendRoute = normalizeRouteTiles(payload.returnRouteTiles, gridWidth, gridHeight);
  if (backendRoute.length >= 2) return backendRoute;

  const fromX = toFiniteNumber(payload.returnOrigin?.tileX ?? payload.target?.tileX, 0);
  const fromY = toFiniteNumber(payload.returnOrigin?.tileY ?? payload.target?.tileY, 0);
  const toX = toFiniteNumber(payload.returnTarget?.tileX ?? payload.origin?.tileX, fromX);
  const toY = toFiniteNumber(payload.returnTarget?.tileY ?? payload.origin?.tileY, fromY);

  return buildShortestTileRoute(fromX, fromY, toX, toY, gridWidth, gridHeight);
}

export function useRemoteSquadAnimations(options: UseRemoteSquadAnimationsOptions) {
  const { scene, gridWidth = 120, gridHeight = 120 } = options;

  useEffect(() => {
    if (!scene) return;

    let socket;
    try {
      socket = getSocket();
    } catch {
      return;
    }

    const mounted = new Map<string, MountedAttackConvoy3D>();

    const cleanupBattle = (battleId: string) => {
      const current = mounted.get(battleId);
      if (!current) return;
      current.cancel();
      mounted.delete(battleId);
    };

    const startMounted = (battleId: string, animation: MountedAttackConvoy3D) => {
      cleanupBattle(battleId);
      mounted.set(battleId, animation);
      void animation.start()
        .catch((err) => console.warn('[useRemoteSquadAnimations] Falha na animação remota:', err))
        .finally(() => {
          animation.cleanup();
          if (mounted.get(battleId) === animation) mounted.delete(battleId);
        });
    };

    const handleStarted = (payload: RemoteAttackPayload) => {
      const battleId = String(payload?.battleId || '');
      if (!battleId) return;

      const route = buildRouteFromPayload(payload, gridWidth, gridHeight);
      if (route.length < 2) return;

      const totalDurationMs = Math.max(0, toFiniteNumber(payload.totalDurationMs, 0));
      const initialProgress = getElapsedProgress(payload.launchedAtIso, totalDurationMs);
      if (initialProgress >= 1) return;

      const skin = getConvoySkin(payload.attackerConvoySkinId || 'comboio_padrao');
      const animation = mountAttackConvoy3D({
        scene,
        route,
        gridWidth,
        gridHeight,
        skin,
        durationMs: totalDurationMs,
        initialProgress,
        memberCount: toFiniteNumber(payload.memberCount, 0),
        label: `${skin.name} • ${String(payload.attackerName || 'Ataque')}`,
      });

      startMounted(battleId, animation);
    };

    const handleResolved = (payload: RemoteResolvedPayload) => {
      const battleId = String(payload?.battleId || '');
      if (!battleId) return;

      cleanupBattle(battleId);

      const route = buildReturnRouteFromPayload(payload, gridWidth, gridHeight);
      if (route.length < 2) return;

      const totalDurationMs = Math.max(0, toFiniteNumber(payload.returnTotalDurationMs, 0));
      const initialProgress = getElapsedProgress(payload.returnLaunchedAtIso, totalDurationMs);
      if (initialProgress >= 1) return;

      const skin = getConvoySkin(payload.attackerConvoySkinId || 'comboio_padrao');
      const animation = mountAttackConvoy3D({
        scene,
        route,
        gridWidth,
        gridHeight,
        skin,
        durationMs: totalDurationMs,
        initialProgress,
        memberCount: toFiniteNumber(payload.memberCount, 0),
        label: `${skin.name} • retorno`,
      });

      startMounted(battleId, animation);
    };


    const handleAccelerated = (payload: RemoteAttackPayload) => {
      const battleId = String(payload?.battleId || '');
      if (!battleId) return;

      const route = buildRouteFromPayload(payload, gridWidth, gridHeight);
      if (route.length < 2) return;

      const totalDurationMs = Math.max(0, toFiniteNumber(payload.totalDurationMs, 0));
      const initialProgress = getElapsedProgress(payload.launchedAtIso, totalDurationMs);
      if (initialProgress >= 1) {
        cleanupBattle(battleId);
        return;
      }

      const skin = getConvoySkin(payload.attackerConvoySkinId || 'comboio_padrao');
      const animation = mountAttackConvoy3D({
        scene,
        route,
        gridWidth,
        gridHeight,
        skin,
        durationMs: totalDurationMs,
        initialProgress,
        memberCount: toFiniteNumber(payload.memberCount, 0),
        label: `${skin.name} • acelerado`,
      });

      startMounted(battleId, animation);
    };

    socket.on('attack:squadStarted', handleStarted);
    socket.on('attack:squadResolved', handleResolved);
    socket.on('attack:squadAccelerated', handleAccelerated);

    return () => {
      socket.off('attack:squadStarted', handleStarted);
      socket.off('attack:squadResolved', handleResolved);
      socket.off('attack:squadAccelerated', handleAccelerated);
      mounted.forEach((animation) => animation.cancel());
      mounted.clear();
    };
  }, [scene, gridWidth, gridHeight]);
}
