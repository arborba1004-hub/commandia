import {
  BattleResolutionInput,
  BattleResolutionResult,
} from '@/types/powerSystem';
import type {
  GangBattleCasualtyResult,
  GangBattleCompositionStats,
} from '@/types/gangWar';
import { resolveGangCasualties } from '@/services/gangWarCalculationService';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundMoney(value: number): number {
  return Math.max(0, Math.floor(value));
}

function buildEmptyGangLosses(): GangBattleCasualtyResult {
  return {
    mortos: {
      capanga: 0,
      frente: 0,
      executor: 0,
      assassino: 0,
      muralha: 0,
      certeiro: 0,
      motorista: 0,
      nitro: 0,
      armeiro: 0,
      informante: 0,
      wifi: 0,
      medico: 0,
      lavador: 0,
      ladrao: 0,
      negociador: 0,
    },
    feridos: {
      capanga: 0,
      frente: 0,
      executor: 0,
      assassino: 0,
      muralha: 0,
      certeiro: 0,
      motorista: 0,
      nitro: 0,
      armeiro: 0,
      informante: 0,
      wifi: 0,
      medico: 0,
      lavador: 0,
      ladrao: 0,
      negociador: 0,
    },
    preservadosPeloMedico: 0,
  };
}

function buildEmptyGangStats(): GangBattleCompositionStats {
  return {
    totalMembers: 0,
    ativos: 0,
    feridos: 0,
    mortos: 0,
    rajada: 0,
    blindagem: 0,
    folego: 0,
    quebra: 0,
    medicalPower: 0,
    economyPower: 0,
    lootPower: 0,
    intelPower: 0,
    mobilityPower: 0,
    weaponPower: 0,
    coordinationPower: 0,
    negotiationPower: 0,
    totalPower: 0,
  };
}

export function resolveBattle(
  input: BattleResolutionInput & {
    attackerGangMembers?: any[];
    defenderGangMembers?: any[];
    attackerCTLevel?: number;
    defenderCTLevel?: number;
    attackerGangStats?: GangBattleCompositionStats;
    defenderGangStats?: GangBattleCompositionStats;
  }
): BattleResolutionResult & {
  attackerGangLosses: GangBattleCasualtyResult;
  defenderGangLosses: GangBattleCasualtyResult;
  attackerGangStats: GangBattleCompositionStats;
  defenderGangStats: GangBattleCompositionStats;
} {
  const attacker = input.attacker;
  const defender = input.defender;

  const attackerStats = attacker.battleStats;
  const defenderStats = defender.battleStats;

  const attackerGangStats =
    input.attackerGangStats || buildEmptyGangStats();

  const defenderGangStats =
    input.defenderGangStats || buildEmptyGangStats();

  const attackerCoreScore =
    attackerStats.attackScore * 1.2 +
    attackerStats.tacticalScore * 0.8 +
    attackerStats.mobilityScore * 0.7 +
    attackerStats.supportScore * 0.3 +
    attackerStats.totalPower * 0.08;

  const defenderCoreScore =
    defenderStats.defenseScore * 1.2 +
    defenderStats.tacticalScore * 0.7 +
    defenderStats.mobilityScore * 0.4 +
    defenderStats.supportScore * 0.3 +
    defenderStats.totalPower * 0.08;

  const attackerGangScore =
    attackerGangStats.rajada * 1.15 +
    attackerGangStats.blindagem * 1.05 +
    attackerGangStats.folego * 0.95 +
    attackerGangStats.quebra * 1.2 +
    attackerGangStats.intelPower * 0.35 +
    attackerGangStats.mobilityPower * 0.3 +
    attackerGangStats.weaponPower * 0.4 +
    attackerGangStats.coordinationPower * 0.25;

  const defenderGangScore =
    defenderGangStats.rajada * 1.05 +
    defenderGangStats.blindagem * 1.2 +
    defenderGangStats.folego * 1.05 +
    defenderGangStats.quebra * 1.05 +
    defenderGangStats.intelPower * 0.35 +
    defenderGangStats.mobilityPower * 0.2 +
    defenderGangStats.weaponPower * 0.3 +
    defenderGangStats.coordinationPower * 0.25;

  const attackerScore = attackerCoreScore + attackerGangScore;
  const defenderScore = defenderCoreScore + defenderGangScore;

  let winChance = attackerScore / Math.max(1, attackerScore + defenderScore);
  winChance = clamp(winChance, 0.15, 0.85);

  const roll = Math.random();
  const success = roll <= winChance;
  const winner = success ? 'attacker' : 'defender';

  const targetDirtyMoney = Number(defender.context.dirtyMoney || 0);

  const baseLoot = targetDirtyMoney * 0.18;
  const attackLootFactor =
    (Number(attackerStats.lootBonusPercent || 0) +
      Number(attackerGangStats.lootPower || 0) * 0.35) /
    100;

  const defenseReductionFactor =
    (Number(defenderStats.damageReduction || 0) / 100) * 0.35 +
    Number(defenderGangStats.blindagem || 0) * 0.0008;

  const loot = success
    ? roundMoney(baseLoot * Math.max(0.15, 1 + attackLootFactor - defenseReductionFactor))
    : 0;

  const attackerHpDamage = success
    ? Math.round(defenderScore * 0.12)
    : Math.round(defenderScore * 0.2);

  const defenderHpDamage = success
    ? Math.round(attackerScore * 0.2)
    : Math.round(attackerScore * 0.1);

  const attackerCorreLoss = success ? 8 : 14;
  const defenderCorreLoss = success ? 4 : 0;

  const attackerDirtyLoss = success
    ? 0
    : roundMoney(Number(attacker.context.dirtyMoney || 0) * 0.03);

  const defenderDirtyLoss = success ? loot : 0;

  const attackerGangLosses =
    input.attackerGangMembers && input.attackerGangMembers.length > 0
      ? resolveGangCasualties({
          members: input.attackerGangMembers,
          ownStats: attackerGangStats,
          enemyStats: defenderGangStats,
          ctLevel: Number(input.attackerCTLevel || 1),
          side: 'attacker',
        })
      : buildEmptyGangLosses();

  const defenderGangLosses =
    input.defenderGangMembers && input.defenderGangMembers.length > 0
      ? resolveGangCasualties({
          members: input.defenderGangMembers,
          ownStats: defenderGangStats,
          enemyStats: attackerGangStats,
          ctLevel: Number(input.defenderCTLevel || 1),
          side: 'defender',
        })
      : buildEmptyGangLosses();

  return {
    success,
    winner,
    winChance: Number((winChance * 100).toFixed(2)),

    attackerScore: Math.round(attackerScore),
    defenderScore: Math.round(defenderScore),

    loot,

    attackerLosses: {
      hpDamage: attackerHpDamage,
      correLoss: attackerCorreLoss,
      dirtyMoneyLoss: attackerDirtyLoss,
    },

    defenderLosses: {
      hpDamage: defenderHpDamage,
      correLoss: defenderCorreLoss,
      dirtyMoneyLoss: defenderDirtyLoss,
    },

    attackerRemainingDirtyMoney: roundMoney(
      Number(attacker.context.dirtyMoney || 0) - attackerDirtyLoss + loot
    ),

    defenderRemainingDirtyMoney: roundMoney(
      Number(defender.context.dirtyMoney || 0) - defenderDirtyLoss
    ),

    report: {
      attacker: attackerStats,
      defender: defenderStats,
      attackerPower: attacker.powerBreakdown.totalPower,
      defenderPower: defender.powerBreakdown.totalPower,
      attackerGangBonuses: attacker.gangBonuses,
      defenderGangBonuses: defender.gangBonuses,
    },

    attackerGangLosses,
    defenderGangLosses,
    attackerGangStats,
    defenderGangStats,
  };
}