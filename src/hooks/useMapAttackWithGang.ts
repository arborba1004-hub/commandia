import { useState, useCallback } from 'react';
import { useGangStore } from '@/store/gangStore';
import { usePlayerStore } from '@/store/playerStore';
import { useMapAttackStore } from '@/store/mapAttackStore';
import { estimateBattle, startBattle, resolveBattleById } from '@/api/attackApi';
import { getActiveMembers } from '@/utils/gangHelpers';
import type { AttackTarget } from '@/store/mapAttackStore';

export function useMapAttackWithGang() {
  const { gang } = useGangStore();
  const { player } = usePlayerStore();
  const { setResolution, startReturn, finishAttack } = useMapAttackStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<AttackTarget | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const openAttackModal = useCallback((target: AttackTarget) => {
    setSelectedTarget(target);
    setIsModalOpen(true);
  }, []);

  const closeAttackModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTarget(null);
    setSelectedMemberIds([]);
  }, []);

  // Estimativa real vinda do backend
  const estimateAttack = useCallback(
    async (_memberIds: string[]) => {
      if (!selectedTarget) return null;
      try {
        const data = await estimateBattle({ targetId: selectedTarget.playerId });
        return {
          estimatedChance: data.estimatedChance / 100,
          estimatedLoot: data.estimatedLoot,
          estimatedCasualties: Math.ceil(
            (gang?.members ? getActiveMembers(gang.members).length : 0) * 0.15
          ),
        };
      } catch {
        return null;
      }
    },
    [selectedTarget, gang]
  );

  const executeAttack = useCallback(
    async (memberIds: string[]) => {
      if (!selectedTarget || !player) return false;

      setIsResolving(true);

      try {
        // 1. Registra a batalha no backend
        const startResponse = await startBattle({
          targetId: selectedTarget.playerId,
          targetName: selectedTarget.playerName,
          targetTileX: selectedTarget.tileX,
          targetTileY: selectedTarget.tileY,
        });

        // 2. Delay para UX
        await new Promise((resolve) => setTimeout(resolve, 1200));

        // 3. Resolve no backend
        const report = await resolveBattleById(startResponse.battleId);

        setResolution(report.resolution);
        setSelectedMemberIds(memberIds);

        // 4. Sincroniza saldo local
        usePlayerStore.getState().applyRemoteAttackResult({
          dirtyMoneyDelta: report.resolution.success
            ? report.resolution.loot
            : -Math.floor(
                (usePlayerStore.getState().player?.balances?.dirtyMoney || 0) * 0.05
              ),
          pvpProtectionUntil: null,
        });

        // 5. Debita corre localmente
        usePlayerStore.getState().removeCorre(10);

        // 6. Recarrega gangue para refletir baixas do backend
        await useGangStore.getState().loadGang();

        // 7. Animação de retorno
        setTimeout(() => { startReturn(); }, 3000);
        setTimeout(() => { finishAttack(); }, 6000);

        return true;
      } catch (error) {
        console.error('Erro ao executar ataque:', error);
        return false;
      } finally {
        setIsResolving(false);
      }
    },
    [selectedTarget, player, setResolution, startReturn, finishAttack]
  );

  return {
    isModalOpen,
    selectedTarget,
    isResolving,
    selectedMemberIds,
    openAttackModal,
    closeAttackModal,
    estimateAttack,
    executeAttack,
  };
}
