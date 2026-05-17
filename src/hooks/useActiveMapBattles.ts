/**
 * hooks/useActiveMapBattles.ts
 *
 * Hook para recuperar batalhas ativas do jogador (reload da página durante
 * ataque em curso). Cobre BOTH os papéis:
 *
 *   - role === 'attacker': anima a marcha de IDA com o tempo restante.
 *     Quando chega, chama resolveBattle() — o backend responde com a
 *     resolução e dispara o broadcast 'attack:squadResolved'. A animação
 *     de retorno é montada via useRemoteSquadAnimations (que escuta o
 *     broadcast — o atacante é incluído porque já não há contexto local
 *     na recuperação).
 *
 *   - role === 'defender': anima a marcha de IDA com o tempo restante,
 *     visualizando o squad inimigo se aproximando. Não chama resolveBattle
 *     (responsabilidade do atacante / autoResolve do backend). A volta é
 *     animada quando o broadcast 'attack:squadResolved' chegar.
 *
 * Persistência: mapAttackStore guarda dados da batalha (battleId, role,
 * arriveAtIso) para que o overlay/HUD reflita o ataque.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getActiveBattles, resolveBattle } from '@/api/attackApi';
import { useMapAttackStore } from '@/store/mapAttackStore';
import { usePlayerStore } from '@/store/playerStore';
import { mountGangSquadAnimation, type MountedSquadAnimation } from '@/3d/gangSquadAnimation';

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


function getFallbackConvoySkinId(player: unknown): string {
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
  // Mantém referência das animações criadas pelo hook para cleanup no unmount.
  const recoveredAnimsRef = useRef<Map<string, MountedSquadAnimation>>(new Map());

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
            memberCount,
            attackerConvoySkinId,
          } = battle;

          // Armazena dados da batalha no store
          useMapAttackStore.setState({
            battleId,
            arriveAtIso,
            launchedAtIso,
            role: role as 'attacker' | 'defender' | null,
            isRecovered: true, // Marca como recuperada do backend
          });

          // ─ Caso 1: tempo já estourou → resolver no backend (apenas se for atacante)
          if (remainingMs <= 0) {
            if (role === 'attacker') {
              try {
                await resolveBattle(battleId);
              } catch (err) {
                console.error(`Erro ao resolver batalha vencida ${battleId}:`, err);
              }
            }
            continue;
          }

          // ─ Caso 2: ainda há tempo → animar marcha de IDA ─────────────────
          const routeTiles = buildRoute(
            Number(route?.fromTileX ?? origin?.tileX ?? 0),
            Number(route?.fromTileY ?? origin?.tileY ?? 0),
            Number(route?.toTileX   ?? target?.tileX ?? 0),
            Number(route?.toTileY   ?? target?.tileY ?? 0),
            gridWidth,
            gridHeight,
          );

          if (routeTiles.length === 0) continue;

          useMapAttackStore.getState().setRoute(routeTiles);
          useMapAttackStore.getState().setPhase('moving');

          const totalSteps = Math.max(1, routeTiles.length - 1);
          const msPerStep  = Math.max(1, remainingMs / totalSteps);

          const convoySkinId =
            (typeof attackerConvoySkinId === 'string' && attackerConvoySkinId.trim())
              ? attackerConvoySkinId.trim()
              : getFallbackConvoySkinId(player);

          const animation = mountGangSquadAnimation({
            scene,
            route: routeTiles,
            gridWidth,
            gridHeight,
            barracoLevel: Number(player?.niveis?.barracoLevel ?? 1),
            memberCount: Number(memberCount ?? 100),
            color: '#ff3b30',
            convoySkinId,
            totalDurationMs: Number(remainingMs),
            timePerTileMs:   Number(msPerStep),
            onStep: (stepIdx) => {
              useMapAttackStore.getState().setCurrentStep(stepIdx);
            },
          });

          recoveredAnimsRef.current.set(battleId, animation);

          void animation.start().then(async () => {
            useMapAttackStore.getState().setPhase('arriving');

            // Atacante: resolve no backend. Defensor: espera o broadcast
            // 'attack:squadResolved' (tratado por useRemoteSquadAnimations).
            if (role === 'attacker') {
              try {
                const report = await resolveBattle(battleId);
                useMapAttackStore.getState().setResolution(report.resolution);
              } catch (err) {
                console.error(`Erro ao resolver batalha recuperada ${battleId}:`, err);
              }
            } else {
              // Defensor — apenas marca a fase. A volta vem por broadcast.
              console.log(`[useActiveMapBattles] Defensor: marcha de ${battle.attackerName} chegou. Aguardando resolução…`);
            }

            // A animação de IDA fica parada no alvo até o broadcast da
            // resolução montar a volta. O cleanup é feito pelo hook de
            // broadcasts quando montar a animação de retorno (ou no unmount).
          }).catch((err) => {
            console.error(`Erro na animação de batalha recuperada ${battleId}:`, err);
          });
        }
      } catch (err) {
        console.error('Erro ao recuperar batalhas ativas:', err);
      }
    })();

    // Cleanup: cancela todas as animações recuperadas no unmount do componente.
    return () => {
      for (const anim of recoveredAnimsRef.current.values()) {
        try { anim.cancel(); } catch { /* noop */ }
      }
      recoveredAnimsRef.current.clear();
    };
  }, [scene, camera, playerId, gridWidth, gridHeight, player]);
}
