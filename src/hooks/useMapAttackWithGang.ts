import { useState, useCallback } from 'react';
import { useGangStore } from '@/store/gangStore';
import { usePlayerStore } from '@/store/playerStore';
import { useMapAttackStore } from '@/store/mapAttackStore';
import { resolveAttackWithGangMembers, estimateAttackOutcome } from '@/services/attackResolverService';
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

  const estimateAttack = useCallback(
    (memberIds: string[]) => {
      if (!selectedTarget || !gang || !player) return null;

      return estimateAttackOutcome({
        attacker: {
          playerId: player._id || '',
          playerName: player.name || 'Você',
          level: player.niveis.playerLevel,
          attack: player.skills.attack,
          agility: player.skills.agility,
          defense: player.skills.defense,
          resistance: player.skills.resistance,
          prestige: player.power,
          dirtyMoney: player.balances.dirtyMoney,
          gang,
          selectedMemberIds: memberIds,
        },
        defender: {
          playerId: selectedTarget.playerId,
          playerName: selectedTarget.playerName,
          level: 1,
          attack: 10,
          agility: 5,
          defense: 15,
          resistance: 8,
          prestige: selectedTarget.power || 0,
          dirtyMoney: selectedTarget.dirtyMoney || 0,
          gang: null,
        },
      });
    },
    [selectedTarget, gang, player]
  );

  const executeAttack = useCallback(
    async (memberIds: string[]) => {
      if (!selectedTarget || !gang || !player) return false;

      setIsResolving(true);

      try {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const result = resolveAttackWithGangMembers({
          attacker: {
            playerId: player._id || '',
            playerName: player.name || 'Você',
            level: player.niveis.playerLevel,
            attack: player.skills.attack,
            agility: player.skills.agility,
            defense: player.skills.defense,
            resistance: player.skills.resistance,
            prestige: player.power,
            dirtyMoney: player.balances.dirtyMoney,
            gang,
            selectedMemberIds: memberIds,
          },
          defender: {
            playerId: selectedTarget.playerId,
            playerName: selectedTarget.playerName,
            level: 1,
            attack: 10,
            agility: 5,
            defense: 15,
            resistance: 8,
            prestige: selectedTarget.power || 0,
            dirtyMoney: selectedTarget.dirtyMoney || 0,
            gang: null,
          },
        });

        setResolution(result);
        setSelectedMemberIds(memberIds);

        // Trigger return journey
        setTimeout(() => {
          startReturn();
        }, 3000);

        // Finish attack
        setTimeout(() => {
          finishAttack();
        }, 6000);

        return true;
      } catch (error) {
        console.error('Erro ao executar ataque:', error);
        return false;
      } finally {
        setIsResolving(false);
      }
    },
    [selectedTarget, gang, player, setResolution, startReturn, finishAttack]
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
