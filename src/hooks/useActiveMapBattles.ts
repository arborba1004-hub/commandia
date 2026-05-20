import { useEffect } from 'react';
import * as THREE from 'three';
import { getActiveBattles } from '@/api/attackApi';
import { getConvoySkin } from '@/data/convoyCatalog';
import { mountAttackConvoy3D, type MountedAttackConvoy3D } from '@/components/game/convoy/convoy3DAnimator';
import {
  buildShortestTileRoute,
  getElapsedProgress,
  normalizeRouteTiles,
  type AttackRouteTile,
} from '@/utils/attackTravel';

export type UseActiveMapBattlesOptions = {
  scene?: THREE.Scene | null;
  camera?: THREE.Camera | null;
  gridWidth?: number;
  gridHeight?: number;
};

type ActiveBattleLike = {
  battleId?: string;
  role?: 'attacker' | 'defender';
  attackerName?: string;
  defenderName?: string;
  route?: { fromTileX?: number; fromTileY?: number; toTileX?: number; toTileY?: number };
  routeTiles?: AttackRouteTile[];
  origin?: { tileX?: number; tileY?: number };
  target?: { tileX?: number; tileY?: number };
  attackerConvoySkinId?: string;
  memberCount?: number;
  launchedAtIso?: string;
  totalDurationMs?: number;
  remainingMs?: number;
};

function toFiniteNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildRouteFromBattle(battle: ActiveBattleLike, gridWidth: number, gridHeight: number): AttackRouteTile[] {
  const backendRoute = normalizeRouteTiles(battle.routeTiles, gridWidth, gridHeight);
  if (backendRoute.length >= 2) return backendRoute;

  const fromX = toFiniteNumber(battle.route?.fromTileX ?? battle.origin?.tileX, 0);
  const fromY = toFiniteNumber(battle.route?.fromTileY ?? battle.origin?.tileY, 0);
  const toX = toFiniteNumber(battle.route?.toTileX ?? battle.target?.tileX, fromX);
  const toY = toFiniteNumber(battle.route?.toTileY ?? battle.target?.tileY, fromY);

  return buildShortestTileRoute(fromX, fromY, toX, toY, gridWidth, gridHeight);
}

/**
 * Recupera ataques travelling ao montar/recarregar a GamePage e monta a animação
 * no progresso correto da rota. O backend continua sendo a fonte da verdade.
 */
export function useActiveMapBattles(options: UseActiveMapBattlesOptions) {
  const { scene, gridWidth = 120, gridHeight = 120 } = options;

  useEffect(() => {
    if (!scene) return;

    let disposed = false;
    const mounted = new Map<string, MountedAttackConvoy3D>();

    function mountActiveBattle(battle: ActiveBattleLike) {
      const battleId = String(battle?.battleId || '');
      if (!battleId || mounted.has(battleId)) return;

      const route = buildRouteFromBattle(battle, gridWidth, gridHeight);
      if (route.length < 2) return;

      const totalDurationMs = Math.max(0, toFiniteNumber(battle.totalDurationMs, 0));
      const remainingMs = Math.max(0, toFiniteNumber(battle.remainingMs, totalDurationMs));
      if (remainingMs <= 0) return;

      const initialProgress = getElapsedProgress(battle.launchedAtIso, totalDurationMs);
      if (initialProgress >= 1) return;

      const skin = getConvoySkin(battle.attackerConvoySkinId || 'comboio_padrao');
      const animation = mountAttackConvoy3D({
        scene,
        route,
        gridWidth,
        gridHeight,
        skin,
        durationMs: totalDurationMs,
        initialProgress,
        memberCount: toFiniteNumber(battle.memberCount, 0),
        label: `${skin.name} • ${battle.role === 'attacker' ? 'seu ataque' : String(battle.attackerName || 'ataque')}`,
      });

      mounted.set(battleId, animation);
      void animation.start()
        .catch((err) => console.warn('[useActiveMapBattles] Falha na animação ativa:', err))
        .finally(() => {
          animation.cleanup();
          if (mounted.get(battleId) === animation) mounted.delete(battleId);
        });
    }

    void getActiveBattles()
      .then((battles) => {
        if (disposed) return;
        for (const battle of battles) mountActiveBattle(battle);
      })
      .catch((err) => console.warn('[useActiveMapBattles] Falha ao buscar ataques ativos:', err));

    return () => {
      disposed = true;
      mounted.forEach((animation) => animation.cancel());
      mounted.clear();
    };
  }, [scene, gridWidth, gridHeight]);
}
