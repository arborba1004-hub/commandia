/**
 * hooks/useActiveMapBattles.ts
 *
 * Recupera batalhas ativas quando a GamePage monta com a cena 3D pronta.
 * Não calcula batalha. Só refaz a animação visual de marchas pendentes e chama resolveBattle
 * quando o backend informar que a marcha já chegou.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getActiveBattles, resolveBattle } from '@/api/attackApi';
import { useMapAttackStore } from '@/store/mapAttackStore';
import { usePlayerStore } from '@/store/playerStore';
import { mountGangSquadAnimation } from '@/3d/gangSquadAnimation';

function buildRoute(
  fromTileX: number,
  fromTileY: number,
  toTileX: number,
  toTileY: number,
  gridWidth: number,
  gridHeight: number
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

function getSelectedConvoySkinId(player: unknown): string {
  const p = player as any;
  return (
    p?.convoySkins?.selected ??
    p?.cosmetics?.convoySkins?.selected ??
    'comboio_padrao'
  );
}

function getRemainingRoute<T>(routeTiles: T[], totalDurationMs: number, remainingMs: number): T[] {
  if (!Array.isArray(routeTiles) || routeTiles.length <= 1) return routeTiles;

  const total = Number(totalDurationMs);
  const remaining = Number(remainingMs);

  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(remaining)) {
    return routeTiles;
  }

  const elapsed = Math.max(0, total - Math.max(0, remaining));
  const progress = Math.max(0, Math.min(1, elapsed / total));
  const startIndex = Math.max(0, Math.min(routeTiles.length - 2, Math.floor((routeTiles.length - 1) * progress)));

  return routeTiles.slice(startIndex);
}

export type UseActiveMapBattlesOptions = {
  scene?: THREE.Scene | null;
  camera?: THREE.Camera | null;
  gridWidth?: number;
  gridHeight?: number;
};

export function useActiveMapBattles(options: UseActiveMapBattlesOptions) {
  const { scene, camera, gridWidth = 120, gridHeight = 120 } = options;

  const player = usePlayerStore((s) => s.player);
  const playerId = (player as any)?._id;

  const initializedKeyRef = useRef<string | null>(null);
  const activeAnimationsRef = useRef<Array<ReturnType<typeof mountGangSquadAnimation>>>([]);

  useEffect(() => {
    if (!scene || !camera || !playerId) return;

    const initKey = `${String(playerId)}:${scene.uuid}`;
    if (initializedKeyRef.current === initKey) return;
    initializedKeyRef.current = initKey;

    let cancelled = false;

    (async () => {
      try {
        const battles = await getActiveBattles();
        if (cancelled || !Array.isArray(battles) || battles.length === 0) return;

        for (const battle of battles) {
          if (cancelled) return;

          const {
            battleId,
            role,
            launchedAtIso,
            arriveAtIso,
            remainingMs,
            route,
            origin,
            target,
          } = battle;

          useMapAttackStore.setState({
            battleId,
            arriveAtIso,
            launchedAtIso,
            role: role as 'attacker' | 'defender' | null,
            isRecovered: true,
          });

          if (role === 'attacker') {
            const remaining = Number(remainingMs ?? 0);

            if (remaining > 0) {
              const fullRoute = buildRoute(
                Number(route?.fromTileX ?? origin?.tileX ?? 0),
                Number(route?.fromTileY ?? origin?.tileY ?? 0),
                Number(route?.toTileX ?? target?.tileX ?? 0),
                Number(route?.toTileY ?? target?.tileY ?? 0),
                gridWidth,
                gridHeight
              );

              const routeTiles = getRemainingRoute(
                fullRoute,
                Number((battle as any).totalDurationMs ?? 0),
                remaining
              );

              if (routeTiles.length > 0) {
                useMapAttackStore.getState().setRoute(routeTiles);
                useMapAttackStore.getState().setPhase('moving');

                const routeDistanceTiles = Math.max(1, routeTiles.length - 1);
                const msPerTile = remaining / routeDistanceTiles;

                const animation = mountGangSquadAnimation({
                  scene,
                  route: routeTiles,
                  gridWidth,
                  gridHeight,
                  barracoLevel: Number(player?.niveis?.barracoLevel ?? 1),
                  memberCount: Number((battle as any).memberCount ?? 100),
                  color: '#ff3b30',
                  convoySkinId: getSelectedConvoySkinId(player),
                  totalDurationMs: remaining,
                  timePerTileMs: Number.isFinite(msPerTile) ? msPerTile : Number(battle.timePerTileMs ?? 0),
                  onStep: (stepIdx) => {
                    useMapAttackStore.getState().setCurrentStep(stepIdx);
                  },
                });

                activeAnimationsRef.current.push(animation);

                void animation.start().then(async () => {
                  if (cancelled) {
                    animation.cleanup();
                    activeAnimationsRef.current = activeAnimationsRef.current.filter((item) => item !== animation);
                    return;
                  }

                  useMapAttackStore.getState().setPhase('arriving');

                  try {
                    const report = await resolveBattle(battleId);
                    useMapAttackStore.getState().setResolution(report.resolution);
                    useMapAttackStore.getState().setPhase('finished');
                  } catch (err) {
                    console.error(`Erro ao resolver batalha recuperada ${battleId}:`, err);
                  } finally {
                    animation.cleanup();
                    activeAnimationsRef.current = activeAnimationsRef.current.filter((item) => item !== animation);
                  }
                });
              }
            } else {
              try {
                await resolveBattle(battleId);
              } catch (err) {
                console.error(`Erro ao resolver batalha ${battleId}:`, err);
              }
            }
          } else if (role === 'defender') {
            console.log(`[Defensor] Ataque chegando em ${arriveAtIso}`, {
              attackerId: battle.attackerId,
              attackerName: battle.attackerName,
              remainingMs,
            });
          }
        }
      } catch (err) {
        console.error('Erro ao recuperar batalhas ativas:', err);
      }
    })();

    return () => {
      cancelled = true;
      activeAnimationsRef.current.forEach((animation) => animation.cancel());
      activeAnimationsRef.current = [];
    };
  }, [scene, camera, playerId, gridWidth, gridHeight, player]);
}
