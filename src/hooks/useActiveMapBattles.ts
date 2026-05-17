/**
 * hooks/useActiveMapBattles.ts
 *
 * Hook para gerenciar batalhas ativas do jogador.
 *
 * Responsabilidade:
 *   - Chamar getActiveBattles quando GamePage montar e a cena 3D estiver pronta
 *   - Para atacantes (role === 'attacker'):
 *     - Se remainingMs > 0: recriar rota visual e animar com duração restante
 *     - Se remainingMs <= 0: chamar resolveBattle(battleId)
 *   - Para defensores (role === 'defender'):
 *     - Mostrar aviso de ataque chegando
 *     - Não resolver visualmente, apenas permitir backend resolver quando chegar
 *   - Persistir batalhas no mapAttackStore para que não desapareçam ao recarregar
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getActiveBattles, resolveBattle } from '@/api/attackApi';
import { useMapAttackStore } from '@/store/mapAttackStore';
import { usePlayerStore } from '@/store/playerStore';
import { mountGangSquadAnimation } from '@/3d/gangSquadAnimation';

/**
 * Constrói uma rota entre dois pontos no grid usando movimento ortogonal.
 * Primeiro move horizontalmente, depois verticalmente.
 */
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

export type UseActiveMapBattlesOptions = {
  scene?: THREE.Scene | null;
  camera?: THREE.Camera | null;
  gridWidth?: number;
  gridHeight?: number;
};

/**
 * Hook para recuperar e gerenciar batalhas ativas ao montar GamePage.
 * Deve ser chamado após scene, camera, gridWidth e gridHeight estarem disponíveis.
 */
export function useActiveMapBattles(options: UseActiveMapBattlesOptions) {
  const { scene, camera, gridWidth = 120, gridHeight = 120 } = options;

  const player = usePlayerStore((s) => s.player);
  const playerId = (player as any)?._id;

  const hasInitialized = useRef(false);

  useEffect(() => {
    // Só executa uma vez, quando scene e camera estão prontos
    if (!scene || !camera || !playerId || hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    (async () => {
      try {
        const battles = await getActiveBattles();

        if (!Array.isArray(battles) || battles.length === 0) {
          return;
        }

        // Processa cada batalha ativa
        for (const battle of battles) {
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

          // Armazena dados da batalha no store
          useMapAttackStore.setState({
            battleId,
            arriveAtIso,
            launchedAtIso,
            role: role as 'attacker' | 'defender' | null,
            isRecovered: true, // Marca como recuperada do backend
          });

          if (role === 'attacker') {
            // ─ ATACANTE ─────────────────────────────────────────────────────
            // Se ainda há tempo, recriar rota e animar
            if (remainingMs > 0) {
              // Constrói rota usando buildRoute
              const routeTiles = buildRoute(
                Number(route?.fromTileX ?? origin?.tileX ?? 0),
                Number(route?.fromTileY ?? origin?.tileY ?? 0),
                Number(route?.toTileX ?? target?.tileX ?? 0),
                Number(route?.toTileY ?? target?.tileY ?? 0),
                gridWidth,
                gridHeight
              );

              if (routeTiles.length > 0) {
                // Define rota e inicia animação
                useMapAttackStore.getState().setRoute(routeTiles);
                useMapAttackStore.getState().setPhase('moving');

                // Calcula duração restante em ms
                const durationMs = remainingMs;
                const totalSteps = routeTiles.length;
                const msPerStep = totalSteps > 0 ? durationMs / totalSteps : 0;

                // Anima o squad marchando com mountGangSquadAnimation
                const animation = mountGangSquadAnimation({
                  scene,
                  route: routeTiles,
                  gridWidth,
                  gridHeight,
                  barracoLevel: Number(player?.niveis?.barracoLevel ?? 1),
                  memberCount: Number((battle as any).memberCount ?? 100),
                  color: '#ff3b30',
                  convoySkinId: getSelectedConvoySkinId(player),
                  totalDurationMs: Number(durationMs),
                  timePerTileMs: Number(msPerStep),
                  onStep: (stepIdx) => {
                    useMapAttackStore.getState().setCurrentStep(stepIdx);
                  },
                });

                void animation.start().then(async () => {
                  useMapAttackStore.getState().setPhase('arriving');

                  try {
                    const report = await resolveBattle(battleId);
                    useMapAttackStore.getState().setResolution(report.resolution);
                    useMapAttackStore.getState().setPhase('finished');
                  } catch (err) {
                    console.error(`Erro ao resolver batalha recuperada ${battleId}:`, err);
                  } finally {
                    animation.cleanup();
                  }
                });
              }
            } else {
              // Tempo esgorou, resolver batalha
              try {
                await resolveBattle(battleId);
              } catch (err) {
                console.error(`Erro ao resolver batalha ${battleId}:`, err);
              }
            }
          } else if (role === 'defender') {
            // ─ DEFENSOR ─────────────────────────────────────────────────────
            // Apenas armazena dados e mostra aviso
            // Não resolve visualmente, apenas permite que backend resolva quando chegar
            console.log(`[Defensor] Ataque chegando em ${arriveAtIso}`, {
              attackerId: battle.attackerId,
              attackerName: battle.attackerName,
              remainingMs,
            });

            // Poderia disparar notificação aqui se necessário
            // showAttackIncomingNotification(battle);
          }
        }
      } catch (err) {
        console.error('Erro ao recuperar batalhas ativas:', err);
      }
    })();
  }, [scene, camera, playerId]);
}
