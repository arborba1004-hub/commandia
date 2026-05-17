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

  // Store de ataque
  const setBattleData = useMapAttackStore((s) => ({
    setBattleId: (id: string) => useMapAttackStore.setState({ battleId: id }),
    setArriveAtIso: (iso: string) => useMapAttackStore.setState({ arriveAtIso: iso }),
    setLaunchedAtIso: (iso: string) => useMapAttackStore.setState({ launchedAtIso: iso }),
    setRole: (role: 'attacker' | 'defender' | null) => useMapAttackStore.setState({ role }),
    setIsRecovered: (recovered: boolean) => useMapAttackStore.setState({ isRecovered: recovered }),
    setRoute: useMapAttackStore.getState().setRoute,
    setPhase: useMapAttackStore.getState().setPhase,
    setResolution: useMapAttackStore.getState().setResolution,
  }));

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
              // Converte rota do backend em RouteTile[]
              const routeTiles = Array.isArray(route)
                ? route.map((tile: any) => ({
                    tileX: Number(tile.tileX ?? tile.x ?? 0),
                    tileY: Number(tile.tileY ?? tile.y ?? 0),
                  }))
                : [];

              if (routeTiles.length > 0) {
                // Define rota e inicia animação
                useMapAttackStore.getState().setRoute(routeTiles);
                useMapAttackStore.getState().setPhase('moving');

                // Calcula duração restante em ms
                const durationMs = remainingMs;
                const totalSteps = routeTiles.length;
                const msPerStep = totalSteps > 0 ? durationMs / totalSteps : 0;

                // Anima o squad marchando
                animateSquadMovement(routeTiles, msPerStep);
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

/**
 * Anima o squad marchando pela rota.
 * Chamado quando uma batalha ativa é recuperada e ainda tem tempo restante.
 */
function animateSquadMovement(
  routeTiles: Array<{ tileX: number; tileY: number }>,
  msPerStep: number
) {
  if (routeTiles.length === 0 || msPerStep <= 0) {
    return;
  }

  let currentStep = 0;
  const startTime = Date.now();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const nextStep = Math.floor(elapsed / msPerStep);

    if (nextStep >= routeTiles.length) {
      // Chegou ao destino
      useMapAttackStore.getState().setPhase('arriving');
      return;
    }

    if (nextStep !== currentStep) {
      currentStep = nextStep;
      useMapAttackStore.getState().setCurrentStep(currentStep);
    }

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}
