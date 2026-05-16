/**
 * hooks/useMapAttack.ts
 * Hook de orquestração do fluxo completo de ataque PVP no mapa.
 * Substitui: useMapAttackWithGang.ts, MapAttackWithGangModal.tsx (lógica)
 *
 * Responsabilidades:
 *   1. previewTarget(target) — chama canAttack + estimateBattle pra mostrar preview
 *   2. cancelAttack() — fecha preview
 *   3. confirmAttack(selection, scene, ...) — chama startBattle, dispara animação 3D, aguarda chegada, chama resolveBattle
 *   4. dismissResult() — fecha tela de resultado
 *   5. Estados expostos: isPreviewing, previewData, estimation, canAttackInfo, isResolving, resolution, blockedPreviewMessage
 */

import { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { useGangStore } from '@/store/gangStore';
import { usePlayerStore } from '@/store/playerStore';
import { useMapAttackStore } from '@/store/mapAttackStore';
import { useGangEstatisticasStore } from '@/store/gangEstatisticasStore';
import { canAttack, startBattle, resolveBattle } from '@/api/attackApi';
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

export type CanAttackInfo = {
  canAttack: boolean;
  reason?: string;
};

export type PreviewData = {
  target: AttackTarget;
  canAttackInfo: CanAttackInfo;
};

export type UseMapAttackReturn = {
  // Estados de preview
  isPreviewing: boolean;
  previewData: PreviewData | null;
  blockedPreviewMessage: string | null;

  // Estimativa
  estimation: {
    estimatedChance:    number;
    estimatedLoot:      number;
    estimatedCasualties: number;
  } | null;

  // Informações de ataque
  canAttackInfo: CanAttackInfo | null;

  // Estado de envio
  isResolving: boolean;

  // Resultado final
  resolution: BattleResolution | null;

  // Ações
  initiateAttack:  (target: AttackTarget) => void;
  previewTarget:   (target: AttackTarget) => Promise<void>;
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

  // Manhattan real: primeiro move no eixo X até chegar em tx
  while (x !== tx) {
    x += x < tx ? 1 : -1;
    route.push({ tileX: x, tileY: y });
  }

  // Depois move no eixo Y até chegar em ty
  while (y !== ty) {
    y += y < ty ? 1 : -1;
    route.push({ tileX: x, tileY: y });
  }

  return route;
}

// ═════════════════════════════════════════════════════════════════════════════
// HELPER: formata mensagem de bloqueio de ataque
// ═════════════════════════════════════════════════════════════════════════════

function formatBlockedMessage(reason?: string): string {
  if (!reason) return 'Não é possível atacar este alvo no momento.';
  return reason;
}

// ═════════════════════════════════════════════════════════════════════════════
// HOOK
// ═════════════════════════════════════════════════════════════════════════════

export function useMapAttack(): UseMapAttackReturn {
  const { gang }   = useGangStore();
  const { player } = usePlayerStore();
  const store      = useMapAttackStore();

  // Estados de preview
  const [isPreviewing,         setIsPreviewing]         = useState(false);
  const [previewData,          setPreviewData]          = useState<PreviewData | null>(null);
  const [blockedPreviewMessage, setBlockedPreviewMessage] = useState<string | null>(null);

  // Estimativa
  const [estimation,     setEstimation]     = useState<UseMapAttackReturn['estimation']>(null);

  // Informações de ataque
  const [canAttackInfo,  setCanAttackInfo]  = useState<CanAttackInfo | null>(null);

  // Estado de envio
  const [isResolving,    setIsResolving]    = useState(false);

  // Resultado final
  const [resolution,     setResolution]     = useState<BattleResolution | null>(null);

  const animationRef = useRef<ReturnType<typeof mountGangSquadAnimation> | null>(null);

  // ── 1. previewTarget: chama canAttack + estimateBattle pra mostrar preview ──

  const previewTarget = useCallback(async (target: AttackTarget) => {
    if (!player) return;

    setIsPreviewing(true);
    setBlockedPreviewMessage(null);

    try {
      // Verificar se pode atacar
      const attackCheck = await canAttack(target.playerId)
        .catch(() => ({
          canAttack: false,
          reason: 'server_error',
          message: 'Erro ao verificar ataque',
          shieldExpiresAt: null,
          shieldSource: null,
          cooldownExpiresAt: null,
        }));

      setCanAttackInfo(attackCheck);

      if (!attackCheck.canAttack) {
        setBlockedPreviewMessage(formatBlockedMessage(attackCheck.reason));
        setPreviewData({
          target,
          canAttackInfo: attackCheck,
        });
        return;
      }

      setPreviewData({
        target,
        canAttackInfo: attackCheck,
      });
    } catch (err) {
      console.error('[useMapAttack] Erro ao fazer preview:', err);
      setBlockedPreviewMessage('Erro ao carregar preview do ataque');
    } finally {
      setIsPreviewing(false);
    }
  }, [player]);

  // ── 2. initiateAttack: chama previewTarget ──────────────────────────────────

  const initiateAttack = useCallback((target: AttackTarget) => {
    void previewTarget(target);
  }, [previewTarget]);

  // ── 3. cancelAttack: fecha preview ──────────────────────────────────────────

  const cancelAttack = useCallback(() => {
    setPreviewData(null);
    setEstimation(null);
    setBlockedPreviewMessage(null);
    setCanAttackInfo(null);
    animationRef.current?.cancel();
    animationRef.current = null;
    store.resetAttack();
  }, [store]);

  // ── 4. dismissResult: fecha tela de resultado ───────────────────────────────

  const dismissResult = useCallback(() => {
    setResolution(null);
    store.resetAttack();
  }, [store]);

  // ── 5. confirmAttack: chama startBattle, dispara animação 3D, aguarda chegada, chama resolveBattle ──

  const confirmAttack = useCallback(async (
    selection:  GangAttackSelection,
    scene:      THREE.Scene,
    camera:     THREE.Camera,
    gridWidth:  number,
    gridHeight: number,
  ) => {
    if (!previewData || !player) return;

    const selectedTarget = previewData.target;
    setIsResolving(true);
    setPreviewData(null);

    const originTileX = Number(player?.mapPosition?.tileX ?? 0);
    const originTileY = Number(player?.mapPosition?.tileY ?? 0);

    try {
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

      // Configurar rota de ida e volta
      store.setRoute(route, [...route].reverse());
      store.setPhase('moving');

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

      // Calcular tempo de espera baseado em arriveAtIso
      const arriveAtMs = new Date(startResp.arriveAtIso).getTime();
      const waitMs = Math.max(0, arriveAtMs - Date.now());

      // Iniciar animação em paralelo com o timer de viagem
      const animPromise = animation.start();

      // Aguardar até o tempo de chegada calculado
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

      await useGangStore.getState().loadGang();

      // ── Animação de retorno ─────────────────────────────────────────────
      setTimeout(() => store.setPhase('returning'),  3000);
      setTimeout(() => {
        store.setPhase('finished');
        animationRef.current?.cleanup();
        animationRef.current = null;
      }, 6500);

    } catch (err) {
      console.error('[useMapAttack] Erro no fluxo de ataque:', err);
      cancelAttack();
    } finally {
      setIsResolving(false);
    }
  }, [previewData, player, store, cancelAttack]);

  return {
    // Estados de preview
    isPreviewing,
    previewData,
    blockedPreviewMessage,

    // Estimativa
    estimation,

    // Informações de ataque
    canAttackInfo,

    // Estado de envio
    isResolving,

    // Resultado final
    resolution,

    // Ações
    initiateAttack,
    previewTarget,
    cancelAttack,
    confirmAttack,
    dismissResult,
  };
}
