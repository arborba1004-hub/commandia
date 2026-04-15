// components/stats/index.ts
import { getBarracoCombatBonuses, COMBAT_MEMBER_TYPES } from './barracoStats';
// Futuros imports:
// import { getLuxoBonuses } from './luxoStats';
// import { getFugaBonuses } from './fugaStats';

/**
 * Bônus acumulados para cada atributo (percentual e valor fixo).
 */
export interface BonusAccumulator {
  rajada: { percent: number; flat: number };
  blindagem: { percent: number; flat: number };
  folego: { percent: number; flat: number };
  quebra: { percent: number; flat: number };
  // Outros atributos podem ser adicionados futuramente
}

/**
 * Cria um acumulador zerado.
 */
export function createEmptyBonuses(): BonusAccumulator {
  return {
    rajada: { percent: 0, flat: 0 },
    blindagem: { percent: 0, flat: 0 },
    folego: { percent: 0, flat: 0 },
    quebra: { percent: 0, flat: 0 },
  };
}

/**
 * Adiciona bônus a um acumulador.
 */
export function addBonus(
  acc: BonusAccumulator,
  stat: keyof BonusAccumulator,
  bonus: { percent?: number; flat?: number }
): void {
  if (bonus.percent) acc[stat].percent += bonus.percent;
  if (bonus.flat) acc[stat].flat += bonus.flat;
}

/**
 * Coleta todos os bônus ativos para um jogador.
 * Atualmente apenas barraco.
 */
export function collectAllBonuses(player: any): BonusAccumulator {
  const bonuses = createEmptyBonuses();

  // Barraco
  const barracoBonuses = getBarracoCombatBonuses(player.niveis?.barracoLevel || 1);
  addBonus(bonuses, 'rajada', { percent: barracoBonuses.rajada });
  addBonus(bonuses, 'blindagem', { percent: barracoBonuses.blindagem });
  addBonus(bonuses, 'folego', { percent: barracoBonuses.folego });
  addBonus(bonuses, 'quebra', { percent: barracoBonuses.quebra });

  // Futuras fontes: luxo, fuga, formação, etc.

  return bonuses;
}

/**
 * Aplica bônus a um valor base.
 */
export function applyBonuses(base: number, entry: { percent: number; flat: number }): number {
  return Math.floor(base * (1 + entry.percent / 100)) + entry.flat;
}

// Re-exporta constantes úteis
export { COMBAT_MEMBER_TYPES };