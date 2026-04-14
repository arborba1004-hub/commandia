import {
  BattleResolutionInput,
  BattleResolutionResult,
} from '@/types/powerSystem';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundMoney(value: number): number {
  return Math.max(0, Math.floor(value));
}

export function resolveBattle(
  input: BattleResolutionInput
): BattleResolutionResult {
  const attacker = input.attacker;
  const defender = input.defender;

  const attackerStats = attacker.battleStats;
  const defenderStats = defender.battleStats;

  const attackerScore =
    attackerStats.attackScore * 1.2 +
    attackerStats.tacticalScore * 0.8 +
    attackerStats.mobilityScore * 0.7 +
    attackerStats.supportScore * 0.3 +
    attackerStats.totalPower * 0.08;

  const defenderScore =
    defenderStats.defenseScore * 1.2 +
    defenderStats.tacticalScore * 0.7 +
    defenderStats.mobilityScore * 0.4 +
    defenderStats.supportScore * 0.3 +
    defenderStats.totalPower * 0.08;

  let winChance = attackerScore / (attackerScore + defenderScore);
  winChance = clamp(winChance, 0.15, 0.85);

  const roll = Math.random();
  const success = roll <= winChance;
  const winner = success ? 'attacker' : 'defender';

  const targetDirtyMoney = defender.context.dirtyMoney;

  const baseLoot = targetDirtyMoney * 0.18;
  const attackLootFactor = attackerStats.lootBonusPercent / 100;
  const defenseReductionFactor = defenderStats.damageReduction / 100 * 0.35;

  const loot = success
    ? roundMoney(baseLoot * (1 + attackLootFactor - defenseReductionFactor))
    : 0;

  const attackerHpDamage = success
    ? Math.round(defenderScore * 0.12)
    : Math.round(defenderScore * 0.2);

  const defenderHpDamage = success
    ? Math.round(attackerScore * 0.2)
    : Math.round(attackerScore * 0.1);

  const attackerCorreLoss = success ? 8 : 14;
  const defenderCorreLoss = success ? 4 : 0;

  const attackerDirtyLoss = success ? 0 : roundMoney(attacker.context.dirtyMoney * 0.03);
  const defenderDirtyLoss = success ? loot : 0;

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
      attacker.context.dirtyMoney - attackerDirtyLoss + loot
    ),
    defenderRemainingDirtyMoney: roundMoney(
      defender.context.dirtyMoney - defenderDirtyLoss
    ),

    report: {
      attacker: attackerStats,
      defender: defenderStats,
      attackerPower: attacker.powerBreakdown.totalPower,
      defenderPower: defender.powerBreakdown.totalPower,
      attackerGangBonuses: attacker.gangBonuses,
      defenderGangBonuses: defender.gangBonuses,
    },
  };
}
