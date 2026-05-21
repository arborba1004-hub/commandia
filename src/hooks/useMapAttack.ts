/**
 * hooks/useMapAttack.ts
 * Hook de orquestração do fluxo completo de ataque PVP no mapa.
 * Substitui: useMapAttackWithGang.ts, MapAttackWithGangModal.tsx (lógica)
 *
 * Responsabilidades:
 *   1. previewTarget(target) — chama canAttack + estimateBattle pra mostrar preview
 *   2. cancelAttack() — fecha preview
 *   3. confirmAttack(selection, scene, ...) — chama startBattle, aguarda chegada,
 *      chama resolveBattle, finaliza.
 *   4. dismissResult() — fecha tela de resultado
 *   5. Estados expostos: isPreviewing, previewData, estimation, canAttackInfo,
 *      isResolving, resolution, blockedPreviewMessage
 */

import { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { useGangStore } from '@/store/gangStore';
import { usePlayerStore } from '@/store/playerStore';
import { useMapAttackStore } from '@/store/mapAttackStore';
import { usePlayerConvoyStore } from '@/store/playerConvoyStore';
import { useConvoyAcceleratorStore } from '@/store/convoyAcceleratorStore';
import { canAttack, startBattle, resolveBattle } from '@/api/attackApi';
import { getPlayerCentralTileFromOrigin } from '@/components/game/playerMapSpace';
import { getConvoySkin } from '@/data/convoyCatalog';
import { mountAttackConvoy3D, type MountedAttackConvoy3D } from '@/components/game/convoy/convoy3DAnimator';
import { buildShortestTileRoute, getElapsedProgress, normalizeRouteTiles } from '@/utils/attackTravel';
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

type ActiveBattleMeta = {
  battleId: string;
  launchedAtIso: string;
  arriveAtIso: string;
  totalDurationMs: number;
  convoySkinId: string;
  memberCount: number;
  label: string;
} | null;

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

  activeBattleId: string | null;
  activeAttackPhase: string;
  isAccelerating: boolean;
  canAccelerate: boolean;
  accelerateActiveAttack: (scene: THREE.Scene, camera: THREE.Camera, gridWidth: number, gridHeight: number) => Promise<void>;
};

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

  const [activeBattle, setActiveBattle] = useState<ActiveBattleMeta>(null);
  const [isAccelerating, setIsAccelerating] = useState(false);

  const activeBattleRef = useRef<ActiveBattleMeta>(null);
  const arriveAtMsRef = useRef(0);
  const currentForwardAnimationRef = useRef<MountedAttackConvoy3D | null>(null);
  const forwardAnimationParamsRef = useRef<{
    scene: THREE.Scene;
    route: Array<{ tileX: number; tileY: number }>;
    gridWidth: number;
    gridHeight: number;
    skinId: string;
    memberCount: number;
    label: string;
  } | null>(null);

  const setActiveBattleMeta = useCallback((meta: ActiveBattleMeta) => {
    activeBattleRef.current = meta;
    setActiveBattle(meta);
    if (meta) {
      arriveAtMsRef.current = new Date(meta.arriveAtIso).getTime();
      useMapAttackStore.getState().setBattleMeta({
        battleId: meta.battleId,
        launchedAtIso: meta.launchedAtIso,
        arriveAtIso: meta.arriveAtIso,
        role: 'attacker',
      });
    } else {
      arriveAtMsRef.current = 0;
      useMapAttackStore.getState().setBattleMeta({
        battleId: undefined,
        launchedAtIso: undefined,
        arriveAtIso: undefined,
        role: null,
      });
    }
  }, []);

  const waitUntilCurrentArrival = useCallback(async () => {
    while (true) {
      const remaining = arriveAtMsRef.current - Date.now();
      if (!Number.isFinite(remaining) || remaining <= 0) return;
      await new Promise<void>((resolve) => setTimeout(resolve, Math.min(1000, Math.max(100, remaining))));
    }
  }, []);

  // ── 1. previewTarget: chama canAttack + abre o modal de seleção ──────────────

  const previewTarget = useCallback(async (target: AttackTarget) => {
    if (!player) return;

    setIsPreviewing(true);
    setBlockedPreviewMessage(null);

    // Normalizar o alvo para o centro
    const targetCenter = getPlayerCentralTileFromOrigin(target.tileX, target.tileY);
    const centeredTarget = {
      ...target,
      tileX: targetCenter.tileX,
      tileY: targetCenter.tileY,
    };

    // Abre o MapTargetActionModal imediatamente (mostra spinner enquanto valida)
    store.openPreview(centeredTarget, {
      playerId:   String((player as any)?._id ?? (player as any)?.id ?? ''),
      playerName: player.name ?? 'Você',
      tileX:      Number(player.mapPosition?.tileX ?? 0),
      tileY:      Number(player.mapPosition?.tileY ?? 0),
    });

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
          target: centeredTarget,
          canAttackInfo: attackCheck,
        });
        return;
      }

      setPreviewData({
        target: centeredTarget,
        canAttackInfo: attackCheck,
      });
    } catch (err) {
      console.error('[useMapAttack] Erro ao fazer preview:', err);
      setBlockedPreviewMessage('Erro ao carregar preview do ataque');
    } finally {
      setIsPreviewing(false);
    }
  }, [player, store]);

  // ── 2. initiateAttack: chama previewTarget ──────────────────────────────────

  const initiateAttack = useCallback((target: AttackTarget) => {
    void previewTarget(target);
  }, [previewTarget]);

  // ── 3. cancelAttack: fecha preview e limpa qualquer animação em curso ──────

  const cancelAttack = useCallback(() => {
    setPreviewData(null);
    setEstimation(null);
    setBlockedPreviewMessage(null);
    setCanAttackInfo(null);
    currentForwardAnimationRef.current?.cancel();
    currentForwardAnimationRef.current = null;
    forwardAnimationParamsRef.current = null;
    setActiveBattleMeta(null);
    store.resetAttack();
  }, [store, setActiveBattleMeta]);

  // ── 4. dismissResult: fecha tela de resultado ───────────────────────────────

  const dismissResult = useCallback(() => {
    setResolution(null);
    currentForwardAnimationRef.current?.cancel();
    currentForwardAnimationRef.current = null;
    forwardAnimationParamsRef.current = null;
    setActiveBattleMeta(null);
    store.resetAttack();
  }, [store, setActiveBattleMeta]);

  // ── 5. confirmAttack ────────────────────────────────────────────────────────
  // Orquestra: startBattle → aguarda chegada → resolveBattle → finaliza

  const confirmAttack = useCallback(async (
    selection:  GangAttackSelection,
    scene:      THREE.Scene,
    camera:     THREE.Camera,
    gridWidth:  number,
    gridHeight: number,
  ) => {
    const selectedTarget = previewData?.target ?? useMapAttackStore.getState().target;

    if (!selectedTarget || !player) {
      console.error('[useMapAttack] confirmAttack abortado: sem target ou sem player', {
        hasPreviewData: Boolean(previewData),
        storeTarget: useMapAttackStore.getState().target,
        hasPlayer: Boolean(player),
      });
      return;
    }

    setIsResolving(true);
    setPreviewData(null);

    const originCenter = getPlayerCentralTileFromOrigin(
      Number(player?.mapPosition?.tileX ?? 0),
      Number(player?.mapPosition?.tileY ?? 0)
    );

    const originTileX = originCenter.tileX;
    const originTileY = originCenter.tileY;
    const selectedConvoySkinId = usePlayerConvoyStore.getState().selectedSkinId;
    const selectedConvoySkin = getConvoySkin(selectedConvoySkinId);
    const memberCount = Object.values(selection || {}).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);

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
        convoySkinId: selectedConvoySkin.id,
      });

      // Rota de tiles para a animação de ida (já com tiles centralizados)
      const fwdFromX = Number(startResp.route?.fromTileX ?? originTileX);
      const fwdFromY = Number(startResp.route?.fromTileY ?? originTileY);
      const fwdToX   = Number(startResp.route?.toTileX   ?? selectedTarget.tileX);
      const fwdToY   = Number(startResp.route?.toTileY   ?? selectedTarget.tileY);

      const backendForwardRoute = normalizeRouteTiles((startResp as any).routeTiles, gridWidth, gridHeight);
      const forwardRoute = backendForwardRoute.length >= 2
        ? backendForwardRoute
        : buildShortestTileRoute(fwdFromX, fwdFromY, fwdToX, fwdToY, gridWidth, gridHeight);
      const reverseStub  = [...forwardRoute].reverse();

      store.setRoute(forwardRoute, reverseStub);
      store.setPhase('moving');
      store.closePreview();   // fecha o MapTargetActionModal (mantém o ataque em curso)

      // Calcular tempo de viagem baseado no backend. A animação 3D usa o comboio escolhido no modal.
      const arriveAtMs = new Date(startResp.arriveAtIso).getTime();
      arriveAtMsRef.current = arriveAtMs;
      const waitMs     = Math.max(0, arriveAtMs - Date.now());
      const totalForwardDurationMs = Math.max(waitMs, Number(startResp.totalDurationMs ?? waitMs) || waitMs);
      const forwardInitialProgress = getElapsedProgress(startResp.launchedAtIso, totalForwardDurationMs);
      const skinForForward = getConvoySkin(startResp.attackerConvoySkinId ?? selectedConvoySkin.id);
      const forwardLabel = `${skinForForward.name} • ida`;

      setActiveBattleMeta({
        battleId: startResp.battleId,
        launchedAtIso: startResp.launchedAtIso,
        arriveAtIso: startResp.arriveAtIso,
        totalDurationMs: totalForwardDurationMs,
        convoySkinId: skinForForward.id,
        memberCount,
        label: forwardLabel,
      });

      forwardAnimationParamsRef.current = {
        scene,
        route: forwardRoute,
        gridWidth,
        gridHeight,
        skinId: skinForForward.id,
        memberCount,
        label: forwardLabel,
      };

      const forwardAnimation = mountAttackConvoy3D({
        scene,
        route: forwardRoute,
        gridWidth,
        gridHeight,
        skin: skinForForward,
        durationMs: totalForwardDurationMs,
        initialProgress: forwardInitialProgress,
        memberCount,
        label: forwardLabel,
      });

      currentForwardAnimationRef.current = forwardAnimation;
      void forwardAnimation.start().catch((err) => {
        console.warn('[useMapAttack] Falha na animação 3D de ida:', err);
      });

      await waitUntilCurrentArrival();
      currentForwardAnimationRef.current?.cleanup();
      currentForwardAnimationRef.current = null;
      forwardAnimationParamsRef.current = null;
      setActiveBattleMeta(null);
      store.setPhase('arriving');

      // ── Resolver no backend ─────────────────────────────────────────────
      store.setPhase('resolving');
      const report = await resolveBattle(startResp.battleId);

      setResolution(report.resolution);
      store.setResolution(report.resolution);

      // Recarregar gang e aguardar playerUpdate do socket para refletir
      // posição/saldos atualizados do atacante.
      try {
        await useGangStore.getState().loadGang();
      } catch (err) {
        console.warn('[useMapAttack] Erro ao recarregar gang:', err);
      }

      // Espera curta para o socket playerUpdate chegar antes de
      // calcular a posição de retorno.
      await new Promise<void>((res) => setTimeout(res, 1800));

      // ── Animação de RETORNO ────────────────────────────────────────────
      // Lê a posição ATUAL do atacante (pode ter mudado durante o ataque).
      const currentPlayer = usePlayerStore.getState().player;
      const updatedOrigin = getPlayerCentralTileFromOrigin(
        Number(currentPlayer?.mapPosition?.tileX ?? player?.mapPosition?.tileX ?? 0),
        Number(currentPlayer?.mapPosition?.tileY ?? player?.mapPosition?.tileY ?? 0),
      );

      const returnRoute = buildShortestTileRoute(
        fwdToX, fwdToY,
        updatedOrigin.tileX, updatedOrigin.tileY,
        gridWidth, gridHeight,
      );

      store.setRoute(forwardRoute, returnRoute);
      store.setPhase('returning');

      // Animação 3D de retorno com o mesmo comboio comprado/selecionado.
      const returnDurationMs = Math.max(0, Math.max(0, returnRoute.length - 1) * Number(startResp.timePerTileMs ?? 0));
      const returnAnimation = mountAttackConvoy3D({
        scene,
        route: returnRoute,
        gridWidth,
        gridHeight,
        skin: getConvoySkin(startResp.attackerConvoySkinId ?? selectedConvoySkin.id),
        durationMs: returnDurationMs,
        initialProgress: 0,
        memberCount,
        label: `${selectedConvoySkin.name} • retorno`,
      });

      void returnAnimation.start().catch((err) => {
        console.warn('[useMapAttack] Falha na animação 3D de retorno:', err);
      });

      await new Promise<void>((res) => setTimeout(res, returnDurationMs));
      returnAnimation.cleanup();

      // ── Finalização ────────────────────────────────────────────────────
      store.setPhase('finished');
      setActiveBattleMeta(null);

    } catch (err) {
      console.error('[useMapAttack] Erro no fluxo de ataque:', err);
      cancelAttack();
    } finally {
      setIsResolving(false);
    }
  }, [previewData, player, store, cancelAttack, waitUntilCurrentArrival, setActiveBattleMeta]);


  const accelerateActiveAttack = useCallback(async (
    scene: THREE.Scene,
    _camera: THREE.Camera,
    gridWidth: number,
    gridHeight: number,
  ) => {
    const meta = activeBattleRef.current;
    const battleId = meta?.battleId || useMapAttackStore.getState().battleId;
    if (!battleId) return;
    if (useMapAttackStore.getState().phase !== 'moving') return;

    setIsAccelerating(true);
    try {
      const result = await useConvoyAcceleratorStore.getState().useOnBattle(battleId);

      const newTotalDurationMs = Math.max(1, Number(result.totalDurationMs || meta?.totalDurationMs || 1));
      const launchedAtIso = result.launchedAtIso || meta?.launchedAtIso || new Date().toISOString();
      const arriveAtIso = result.arriveAtIso || meta?.arriveAtIso || new Date().toISOString();
      arriveAtMsRef.current = new Date(arriveAtIso).getTime();

      const params = forwardAnimationParamsRef.current;
      if (params) {
        currentForwardAnimationRef.current?.cancel();
        const skin = getConvoySkin(params.skinId);
        const progress = getElapsedProgress(launchedAtIso, newTotalDurationMs);
        const nextAnimation = mountAttackConvoy3D({
          scene: params.scene || scene,
          route: params.route,
          gridWidth: params.gridWidth || gridWidth,
          gridHeight: params.gridHeight || gridHeight,
          skin,
          durationMs: newTotalDurationMs,
          initialProgress: progress,
          memberCount: params.memberCount,
          label: `${skin.name} • acelerado`,
        });
        currentForwardAnimationRef.current = nextAnimation;
        void nextAnimation.start().catch((err) => {
          console.warn('[useMapAttack] Falha na animação acelerada:', err);
        });
      }

      setActiveBattleMeta({
        battleId: String(result.battleId || battleId),
        launchedAtIso,
        arriveAtIso,
        totalDurationMs: newTotalDurationMs,
        convoySkinId: meta?.convoySkinId || 'comboio_padrao',
        memberCount: meta?.memberCount || 0,
        label: meta?.label || 'Comboio acelerado',
      });
    } finally {
      setIsAccelerating(false);
    }
  }, [setActiveBattleMeta]);

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

    activeBattleId: activeBattle?.battleId ?? null,
    activeAttackPhase: store.phase,
    isAccelerating,
    canAccelerate: Boolean(activeBattle?.battleId && store.phase === 'moving'),
    accelerateActiveAttack,
  };
}
