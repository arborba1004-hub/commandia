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

import { useState, useCallback } from 'react';
import * as THREE from 'three';
import { useGangStore } from '@/store/gangStore';
import { usePlayerStore } from '@/store/playerStore';
import { useMapAttackStore } from '@/store/mapAttackStore';
import { useGangEstatisticasStore } from '@/store/gangEstatisticasStore';
import { usePlayerConvoyStore } from '@/store/playerConvoyStore';
import { canAttack, startBattle, resolveBattle } from '@/api/attackApi';
import { getPlayerCentralTileFromOrigin } from '@/components/game/playerMapSpace';
import { getConvoySkin } from '@/data/convoyCatalog';
import { mountAttackConvoy3D } from '@/components/game/convoy/convoy3DAnimator';
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
    store.resetAttack();
  }, [store]);

  // ── 4. dismissResult: fecha tela de resultado ───────────────────────────────

  const dismissResult = useCallback(() => {
    setResolution(null);
    store.resetAttack();
  }, [store]);

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

      const forwardRoute = buildRoute(fwdFromX, fwdFromY, fwdToX, fwdToY, gridWidth, gridHeight);
      const reverseStub  = [...forwardRoute].reverse();

      store.setRoute(forwardRoute, reverseStub);
      store.setPhase('moving');
      store.closePreview();   // fecha o MapTargetActionModal (mantém o ataque em curso)

      // Calcular tempo de viagem baseado no backend. A animação 3D usa o comboio escolhido no modal.
      const arriveAtMs = new Date(startResp.arriveAtIso).getTime();
      const waitMs     = Math.max(0, arriveAtMs - Date.now());

      const forwardAnimation = mountAttackConvoy3D({
        scene,
        route: forwardRoute,
        gridWidth,
        gridHeight,
        skin: getConvoySkin(startResp.attackerConvoySkinId ?? selectedConvoySkin.id),
        durationMs: waitMs,
        memberCount,
        label: `${selectedConvoySkin.name} • ida`,
      });

      void forwardAnimation.start().catch((err) => {
        console.warn('[useMapAttack] Falha na animação 3D de ida:', err);
      });

      await new Promise<void>((res) => setTimeout(res, waitMs));
      forwardAnimation.cleanup();
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

      const returnRoute = buildRoute(
        fwdToX, fwdToY,
        updatedOrigin.tileX, updatedOrigin.tileY,
        gridWidth, gridHeight,
      );

      store.setRoute(forwardRoute, returnRoute);
      store.setPhase('returning');

      // Animação 3D de retorno com o mesmo comboio comprado/selecionado.
      const returnDurationMs = Math.max(0, returnRoute.length * Number(startResp.timePerTileMs ?? 0));
      const returnAnimation = mountAttackConvoy3D({
        scene,
        route: returnRoute,
        gridWidth,
        gridHeight,
        skin: getConvoySkin(startResp.attackerConvoySkinId ?? selectedConvoySkin.id),
        durationMs: returnDurationMs,
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
