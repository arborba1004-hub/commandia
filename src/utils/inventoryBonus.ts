import { getInventoryBonusReductionPercent } from '@/services/punishmentService';

/**
 * Calculates the final inventory bonus value after applying punishment reduction
 * 
 * @param baseValue - The base bonus value before reduction
 * @param player - The player object containing punishment data
 * @returns The reduced bonus value (0-100% reduction applied)
 * 
 * @example
 * const finalBonus = getReducedInventoryBonus(5, player);
 * // If reduction is 100%, returns 0
 * // If reduction is 50%, returns 2.5
 * // If reduction is 0%, returns 5
 */
export function getReducedInventoryBonus(baseValue: number, player: any): number {
  const reduction = getInventoryBonusReductionPercent(player);
  return baseValue * (1 - reduction / 100);
}
