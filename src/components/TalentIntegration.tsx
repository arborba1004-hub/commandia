/**
 * Talent Integration Module
 * This module integrates talent effects into existing game mechanics
 */

import {
  getSlotBonusMultiplier,
  getSlotGainsMultiplier,
  getPrisonTimeReduction,
  getPrisonMoneyLossReduction,
  getArrestChanceReduction,
  shouldIgnoreFirstPrison,
  getMoneyLossConversionToClean,
  getHerederoRevivePercentage,
  getLaundryTimeReduction,
  getLaundryCleanMoneyBonus,
  getBribeCostReduction,
  getEscapeSpeedBonus,
  getTransportMoneyBonus,
  getExtraParallelSlots,
  getWeaponVehicleCostReduction,
  getFactionMemberXPBonus,
  getMemberRescueTimeReduction,
  canUseEyeAbility,
  canUseWarStrategy,
  canUseShadowAbility,
  getWarStrategyStealPercentage,
  getShadowLaundryLockDuration,
  hasGoldenName,
  areAllTalentsActive,
} from '@/utils/talentEffects';

/**
 * SLOT MACHINE INTEGRATION
 * Apply talent bonuses to slot machine mechanics
 */
export function applySlotTalentBonuses(baseWinAmount: number): number {
  let finalAmount = baseWinAmount;

  // Cria Esperto: Chance de bônus duplo
  const bonusMultiplier = getSlotBonusMultiplier();
  if (Math.random() < bonusMultiplier * 0.01) {
    finalAmount *= 2;
  }

  // Coroa Suprema: Dobra ganhos
  if (areAllTalentsActive()) {
    finalAmount *= getSlotGainsMultiplier();
  }

  return finalAmount;
}

/**
 * PRISON INTEGRATION
 * Apply talent bonuses to prison mechanics
 */
export function calculatePrisonTime(basePrisonTime: number): number {
  const reduction = getPrisonTimeReduction();
  return basePrisonTime * (1 - reduction);
}

export function calculatePrisonMoneyLoss(baseLoss: number): number {
  const lossReduction = getPrisonMoneyLossReduction();
  let finalLoss = baseLoss * (1 - lossReduction);

  // Contabilidade Criativa: Convert loss to clean money
  const conversionRate = getMoneyLossConversionToClean();
  if (conversionRate > 0) {
    const convertedAmount = baseLoss * conversionRate;
    finalLoss -= convertedAmount; // Reduce loss by converted amount
    // Add to clean money (handled by caller)
    return finalLoss;
  }

  return finalLoss;
}

export function getConvertedCleanMoney(baseLoss: number): number {
  const conversionRate = getMoneyLossConversionToClean();
  return baseLoss * conversionRate;
}

export function calculateArrestChance(baseChance: number): number {
  const reduction = getArrestChanceReduction();
  return baseChance * (1 - reduction);
}

export function shouldIgnorePrison(): boolean {
  return shouldIgnoreFirstPrison();
}

export function calculateReviveAmount(baseDirtyMoney: number): number {
  const revivePercentage = getHerederoRevivePercentage();
  return baseDirtyMoney * revivePercentage;
}

/**
 * MONEY LAUNDERING INTEGRATION
 * Apply talent bonuses to money laundering mechanics
 */
export function calculateLaundryTime(baseLaundryTime: number): number {
  const reduction = getLaundryTimeReduction();
  return baseLaundryTime * (1 - reduction);
}

export function calculateLaundryCleanMoneyBonus(baseCleanMoney: number): number {
  const bonus = getLaundryCleanMoneyBonus();
  return baseCleanMoney * (1 + bonus);
}

/**
 * BRIBE INTEGRATION
 * Apply talent bonuses to bribe mechanics
 */
export function calculateBribeCost(baseBribeCost: number): number {
  const reduction = getBribeCostReduction();
  return baseBribeCost * (1 - reduction);
}

/**
 * ESCAPE INTEGRATION
 * Apply talent bonuses to escape mechanics
 */
export function calculateEscapeSpeed(baseSpeed: number): number {
  const speedBonus = getEscapeSpeedBonus();
  return baseSpeed * (1 + speedBonus);
}

/**
 * TRANSPORT MISSION INTEGRATION
 * Apply talent bonuses to transport missions
 */
export function calculateTransportMoney(baseReward: number): number {
  const bonus = getTransportMoneyBonus();
  return baseReward * (1 + bonus);
}

/**
 * FACTION INTEGRATION
 * Apply talent bonuses to faction mechanics
 */
export function getAdditionalParallelSlots(): number {
  return getExtraParallelSlots();
}

export function calculateWeaponVehicleCost(baseCost: number): number {
  const reduction = getWeaponVehicleCostReduction();
  return baseCost * (1 - reduction);
}

export function calculateFactionMemberXPBonus(baseXP: number): number {
  const bonus = getFactionMemberXPBonus();
  return baseXP * (1 + bonus);
}

export function calculateMemberRescueTime(baseRescueTime: number): number {
  const reduction = getMemberRescueTimeReduction();
  return baseRescueTime * (1 - reduction);
}

/**
 * SPECIAL ABILITIES
 * Check if special abilities are available
 */
export function canUseEyeAbilityToday(): boolean {
  return canUseEyeAbility();
}

export function canUseWarStrategyThisWeek(): boolean {
  return canUseWarStrategy();
}

export function canUseShadowAbilityThisWeek(): boolean {
  return canUseShadowAbility();
}

export function getWarStrategyStealAmount(targetDirtyMoney: number): number {
  const stealPercentage = getWarStrategyStealPercentage();
  return targetDirtyMoney * stealPercentage;
}

export function getShadowAbilityLockDuration(): { min: number; max: number } {
  return getShadowLaundryLockDuration();
}

/**
 * COSMETIC EFFECTS
 * Apply cosmetic talent effects
 */
export function shouldHaveGoldenName(): boolean {
  return hasGoldenName();
}

/**
 * UTILITY FUNCTION
 * Check if all talents are active (Coroa Suprema)
 */
export function areAllTalentsActiveCheck(): boolean {
  return areAllTalentsActive();
}
