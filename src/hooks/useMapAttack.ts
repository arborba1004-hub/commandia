/**
 * hooks/useMapAttack.ts
 * Hook de orquestração do fluxo completo de ataque PVP no mapa.
 * Substitui: useMapAttackWithGang.ts, MapAttackWithGangModal.tsx (lógica)
 *
 * Responsabilidades:
 *   1. Abrir/fechar modal de seleção de tropas (GangAttackModal)
 *   2. Chamar estimateBattle para preview
 *   3. Chamar startBattle + sincronizar animação
 *   4. Chamar resolveBattle e atualizar stores
 *   5. Exibir overlay de resultado + navegar para BattleReportPanel
 */

import { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { useGangStore } from '@/store/gangStore';
import { usePlayerStore } from '@/store/playerStore';
import { useMapAttackStore } from '@/store/mapAttackStore';
import { estimateBattle, startBattle, resolveBattle } from '@/api/attackApi';
import { mountGangSquadAnimation } from '@/3d/gangSquadAnimation';
import { playImpactEffect } from '@/3d/gangAttackEffects';
import type {
  AttackTarget,
  GangAttackSelection,
  BattleResolution,
} from '@/types/gang';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═════════════════════════════════════════════════════════════════════════════

export type UseMapAttackReturn = {
  // Modal de seleção
  isModalOpen:  boolean;
  selectedTarget: AttackTarget | null;

  // Estimativa
  estimation: {
    estimatedChance:    number;
    estimatedLoot:      number;
    estimatedCasualties: number;
  } | null;

  // Estado de envio
  isResolving: boolean;

  // Resultado final
  resolution: BattleResolution | null;

  // Ações
  initiateAttack:  (target: AttackTarget) => void;
  cancelAttack:    () => void;
  confirmAttack:   (selection: GangAttackSelection, scene: THREE.Scene, camera: THREE.Camera, gridWidth: number, gridHeight: number) => Promise<void>;
  dismissResult:   () => void;
};

// ═════════════════════════════════════════════════════════════════════════════
// HELPER: constrói rota de tiles entre dois pontos (Manhattan)
// ═════════════════════════════════════════════════════════════════════════════

function buildRoute(
  fromTileX: number, fromTileY: number,
  toTileX:   number, toTileY:   number,
  gridWidth: number, gridHeight: number,
) {
  let x = Math.max(0, Math.min(gridWidth  - 1, fromTileX));
  let y = Math.max(0, Math.min(gridHeight - 1, fromTileY));
  const tx = Math.max(0, Math.min(gridWidth  - 1, toTileX));
  const ty = Math.max(0, Math.min(gridHeight - 1, toTileY));

  const route: Array<{ tileX: number; tileY: number }> = [{ tileX: x, tileY: y }];

  while (x !== tx || y !== ty) {
    if (x < tx) x++;
    else if (x > tx) x--;
    if (y < ty) y++;
    else if (y > ty) y--;
    route.push({ tileX: x, tileY: y });
  }

  return route;
}

// ═════════════════════════════════════════════════════════════════════════════
// HOOK
// ═════════════════════════════════════════════════════════════════════════════

export function useMapAttack(): UseMapAttackReturn {
  const { gang }   = useGangStore();
  const { player } = usePlayerStore();
  const store      = useMapAttackStore();

  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<AttackTarget | null>(null);
  const [estimation,     setEstimation]     = useState<UseMapAttackReturn['estimation']>(null);
  const [isResolving,    setIsResolving]    = useState(false);
  const [resolution,     setResolution]     = useState<BattleResolution | null>(null);

  const animationRef = useRef<ReturnType<typeof mountGangSquadAnimation> | null>(null);

  // ── 1. Abrir modal de seleção ao clicar no barraco inimigo ───────────────

  const initiateAttack = useCallback((target: AttackTarget) => {
    setSelectedTarget(target);
    setEstimation(null);
    setResolution(null);
    setIsModalOpen(true);
  }, []);

  const cancelAttack = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTarget(null);
    setEstimation(null);
    animationRef.current?.cancel();
    animationRef.current = null;
    store.resetAttack();
  }, [store]);

  const dismissResult = useCallback(() => {
    setResolution(null);
    store.resetAttack();
  }, [store]);

  // ── 2. Confirmar seleção → estimar → iniciar → animar → resolver ─────────

  const confirmAttack = useCallback(async (
    selection:  GangAttackSelection,
    scene:      THREE.Scene,
    camera:     THREE.Camera,
    gridWidth:  number,
    gridHeight: number,
  ) => {
    if (!selectedTarget || !player) return;
    setIsResolving(true);
    setIsModalOpen(false);

    const originTileX = Number(player?.mapPosition?.tileX ?? 0);
    const originTileY = Number(player?.mapPosition?.tileY ?? 0);

    try {
      // ── Estimar (preview rápido antes da animação) ──────────────────────
      const est = await estimateBattle({
        targetId:  selectedTarget.playerId,
        selection,
      }).catch(() => null);

      if (est) {
        const activeTotal = Object.values(selection).reduce((a, b) => a + b, 0);
        setEstimation({
          estimatedChance:     est.estimatedChance / (est.estimatedChance > 1 ? 100 : 1),
          estimatedLoot:       est.estimatedLoot,
          estimatedCasualties: Math.ceil(activeTotal * 0.15),
        });
      }

      // ── Registrar batalha no backend ────────────────────────────────────
      const startResp = await startBattle({
        targetId:    selectedTarget.playerId,
        targetName:  selectedTarget.playerName,
        targetTileX: selectedTarget.tileX,
        targetTileY: selectedTarget.tileY,
        originTileX,
        originTileY,
        selection,
      });

      // Rota de tiles para animação
      const route = buildRoute(
        originTileX, originTileY,
        selectedTarget.tileX, selectedTarget.tileY,
        gridWidth, gridHeight
      );

      store.startAttack({
        origin: {
          playerId:   String(player._id ?? player.id ?? ''),
          playerName: player.name ?? 'Você',
          tileX:      originTileX,
          tileY:      originTileY,
        },
        target:        selectedTarget,
        routeToTarget: route,
      });

      // ── Animar deslocamento do squad ────────────────────────────────────
      const memberCount = Object.values(selection).reduce((a, b) => a + b, 0);
      const animation   = mountGangSquadAnimation({
        scene,
        route,
        gridWidth,
        gridHeight,
        barracoLevel: Number(player?.niveis?.barracoLevel ?? 1),
        memberCount,
        color: '#ef4444',
        onStep: (stepIdx) => {
          store.setCurrentStep(stepIdx);
        },
      });
      animationRef.current = animation;

      // Sincronizar com tempo real de viagem do backend
      const travelMs = startResp.totalDurationMs ?? animation.totalDurationMs;

      // Iniciar animação em paralelo com o timer de viagem
      const animPromise = animation.start();

      // Aguardar o tempo de viagem (o backend usa isso para aceitar o resolve)
      const waitMs = Math.max(0, travelMs - 500);
      await new Promise<void>((res) => setTimeout(res, waitMs));

      store.setPhase('arriving');

      // Garantir que a animação terminou
      await animPromise;

      // ── Efeito de impacto ao chegar ─────────────────────────────────────
      const targetWorldX = (selectedTarget.tileX - gridWidth  / 2) + 0.5;
      const targetWorldZ = (selectedTarget.tileY - gridHeight / 2) + 0.5;

      store.setPhase('resolving');

      // ── Resolver no backend ─────────────────────────────────────────────
      const report = await resolveBattle(startResp.battleId);

      // Dispara efeito visual após ter o resultado
      playImpactEffect({
        position:  new THREE.Vector3(targetWorldX, 1.35, targetWorldZ),
        scene,
        camera,
        outcome:   report.resolution.success ? 'success' : 'fail',
        intensity: report.resolution.critical ? 2 : 1,
      });

      setResolution(report.resolution);
      store.setResolution(report.resolution);

      // ── Sincronizar saldos e gangue ─────────────────────────────────────
      const lootDelta = report.resolution.success ? report.resolution.loot : 0;
      usePlayerStore.getState().applyRemoteAttackResult?.({
        dirtyMoneyDelta:    lootDelta,
        pvpProtectionUntil: null,
      });

      usePlayerStore.getState().removeCorre?.(10);
      await useGangStore.getState().loadGang();

      // ── Animação de retorno ─────────────────────────────────────────────
      setTimeout(() => store.startReturn(),  3000);
      setTimeout(() => {
        store.finishAttack();
        animationRef.current?.cleanup();
        animationRef.current = null;
      }, 6500);

    } catch (err) {
      console.error('[useMapAttack] Erro no fluxo de ataque:', err);
      cancelAttack();
    } finally {
      setIsResolving(false);
    }
  }, [selectedTarget, player, store, cancelAttack]);

  return {
    isModalOpen,
    selectedTarget,
    estimation,
    isResolving,
    resolution,
    initiateAttack,
    cancelAttack,
    confirmAttack,
    dismissResult,
  };
}
