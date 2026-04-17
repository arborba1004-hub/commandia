/**
 * COMMANDIA — useBattleCalculator.ts
 * Hook para calcular chance de vitória e estimar dano
 */

import { useMemo } from 'react';

interface BattleStats {
  power: number;
  rajada: number;
  blindagem: number;
  folego: number;
  membersActive: number;
}

interface BattleResult {
  winChance: number;
  estim atedAttackerLosses: number;
  estimatedDefenderLosses: number;
  estimatedGangLossPercent: number;
  recommendation: string;
}

export const useBattleCalculator = (
  attackerStats: BattleStats,
  defenderStats: BattleStats,
  formationBonus: number = 0
): BattleResult => {
  return useMemo(() => {
    // Calculate win chance
    const totalPower = attackerStats.power + defenderStats.power;
    let winChance = totalPower > 0 ? attackerStats.power / totalPower : 0.5;

    // Apply formation bonus
    winChance *= 1 + formationBonus / 100;

    // Clamp between 30% and 90%
    winChance = Math.max(0.3, Math.min(0.9, winChance));

    // Estimate losses
    const powerRatio = attackerStats.power / Math.max(1, defenderStats.power);

    // Attacker loss rate: higher defender power = more losses for attacker
    let attackerLossRate = Math.max(0.04, Math.min(0.65, defenderStats.power / Math.max(1, attackerStats.power) * 0.2));
    const estimatedAttackerLosses = Math.round(attackerStats.membersActive * attackerLossRate);

    // Defender loss rate: higher attacker power = more losses for defender
    let defenderLossRate = Math.max(0.04, Math.min(0.65, attackerStats.power / Math.max(1, defenderStats.power) * 0.2));
    const estimatedDefenderLosses = Math.round(defenderStats.membersActive * defenderLossRate);

    // Calculate loss percentage
    const estimatedGangLossPercent = Math.round((estimatedAttackerLosses / attackerStats.membersActive) * 100);

    // Generate recommendation
    let recommendation = '';
    if (winChance >= 0.7) {
      recommendation = 'Ataque! Você tem grande vantagem.';
    } else if (winChance >= 0.5) {
      recommendation = 'Considere atacar. Risco moderado.';
    } else if (winChance >= 0.3) {
      recommendation = 'Ataque somente se quiser arriscar.';
    } else {
      recommendation = 'Não recomendado. Procure adversário mais fraco.';
    }

    return {
      winChance,
      estimatedAttackerLosses,
      estimatedDefenderLosses,
      estimatedGangLossPercent,
      recommendation,
    };
  }, [attackerStats, defenderStats, formationBonus]);
};

export default useBattleCalculator;
