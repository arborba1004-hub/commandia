import { resolveMapAttack } from '@/components/game/mapAttackResolver';
import { buildGangBattleCompositionStats } from '@/services/gangWarCalculationService';
import type { AttackResolution } from '@/store/mapAttackStore';
import type { GangStateSnapshot } from '@/types/gangWar';

export interface PlayerAttackData {
  playerId: string;
  playerName: string;
  level: number;
  attack: number;
  agility: number;
  defense: number;
  resistance: number;
  prestige: number;
  dirtyMoney: number;
  gang?: GangStateSnapshot | null;
  selectedMemberIds?: string[];
}

export interface AttackResolverInput {
  attacker: PlayerAttackData;
  defender: PlayerAttackData;
}

export function resolveAttackWithGangMembers(input: AttackResolverInput): AttackResolution {
  const { attacker, defender } = input;

  // Filter selected members for attacker
  const attackerMembers = attacker.gang?.members.filter((m) => {
    if (!attacker.selectedMemberIds || attacker.selectedMemberIds.length === 0) {
      return m.status === 'ativo';
    }
    return attacker.selectedMemberIds.includes(m.id) && m.status === 'ativo';
  }) || [];

  // All active members for defender
  const defenderMembers = defender.gang?.members.filter((m) => m.status === 'ativo') || [];

  // Build gang stats
  const attackerGangStats = buildGangBattleCompositionStats(attackerMembers);
  const defenderGangStats = buildGangBattleCompositionStats(defenderMembers);

  // Resolve attack using existing resolver
  const result = resolveMapAttack({
    attacker: {
      attack: attacker.attack,
      agility: attacker.agility,
      level: attacker.level,
      prestige: attacker.prestige,
      gangMembers: attackerMembers,
      gangStats: attackerGangStats,
      ctLevel: attacker.gang?.ct.level || 1,
    },
    defender: {
      defense: defender.defense,
      resistance: defender.resistance,
      level: defender.level,
      prestige: defender.prestige,
      gangMembers: defenderMembers,
      gangStats: defenderGangStats,
      ctLevel: defender.gang?.ct.level || 1,
    },
    targetDirtyMoney: defender.dirtyMoney,
  });

  return result;
}

export function calculateAttackChance(
  attackerPower: number,
  defenderPower: number
): number {
  const rawChance = attackerPower / Math.max(1, attackerPower + defenderPower);
  return Math.max(0.3, Math.min(0.9, rawChance));
}

export function estimateAttackOutcome(input: AttackResolverInput): {
  estimatedChance: number;
  estimatedLoot: number;
  estimatedCasualties: number;
} {
  const { attacker, defender } = input;

  // Filter selected members
  const attackerMembers = attacker.gang?.members.filter((m) => {
    if (!attacker.selectedMemberIds || attacker.selectedMemberIds.length === 0) {
      return m.status === 'ativo';
    }
    return attacker.selectedMemberIds.includes(m.id) && m.status === 'ativo';
  }) || [];

  const defenderMembers = defender.gang?.members.filter((m) => m.status === 'ativo') || [];

  const attackerGangStats = buildGangBattleCompositionStats(attackerMembers);
  const defenderGangStats = buildGangBattleCompositionStats(defenderMembers);

  // Calculate power
  const attackerPersonalPower =
    attacker.attack +
    attacker.agility * 0.5 +
    (attacker.prestige || 0) * 0.1;

  const defenderPersonalPower =
    defender.defense +
    defender.resistance * 0.7 +
    (defender.prestige || 0) * 0.08;

  const attackerGangPower =
    attackerGangStats.rajada * 1.15 +
    attackerGangStats.quebra * 1.2 +
    attackerGangStats.weaponPower * 0.4 +
    attackerGangStats.intelPower * 0.25 +
    attackerGangStats.mobilityPower * 0.2 +
    attackerGangStats.coordinationPower * 0.18;

  const defenderGangPower =
    defenderGangStats.blindagem * 1.2 +
    defenderGangStats.folego * 1.05 +
    defenderGangStats.intelPower * 0.22 +
    defenderGangStats.coordinationPower * 0.18 +
    defenderGangStats.medicalPower * 0.12;

  const attackPower = attackerPersonalPower + attackerGangPower;
  const defensePower = defenderPersonalPower + defenderGangPower;

  const chance = calculateAttackChance(attackPower, defensePower);

  // Estimate loot
  const exposedDirty = defender.dirtyMoney * 0.4;
  const lootPercent = chance > 0.7 ? 0.22 : 0.12;
  const estimatedLoot = Math.floor(exposedDirty * lootPercent);

  // Estimate casualties (rough estimate)
  const estimatedCasualties = Math.ceil(attackerMembers.length * 0.15);

  return {
    estimatedChance: chance,
    estimatedLoot,
    estimatedCasualties,
  };
}
