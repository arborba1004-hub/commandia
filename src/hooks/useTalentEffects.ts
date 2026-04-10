import { useCallback } from 'react';
import { usePlayerTalentsStore } from '@/store/playerTalentsStore';
import * as TalentEffects from '@/utils/talentEffects';

/**
 * Custom hook to apply talent effects to game mechanics
 * Use this hook in components that need to apply talent bonuses
 */
export function useTalentEffects() {
  const store = usePlayerTalentsStore();

  // Slot Machine Effects
  const applySlotBonusMultiplier = useCallback(() => {
    return TalentEffects.getSlotBonusMultiplier();
  }, []);

  const applySlotGainsMultiplier = useCallback(() => {
    return TalentEffects.getSlotGainsMultiplier();
  }, []);

  // Prison Effects
  const applyPrisonTimeReduction = useCallback((basePrisonTime: number) => {
    const reduction = TalentEffects.getPrisonTimeReduction();
    return basePrisonTime * (1 - reduction);
  }, []);

  const applyPrisonMoneyLossReduction = useCallback((baseLoss: number) => {
    const reduction = TalentEffects.getPrisonMoneyLossReduction();
    return baseLoss * (1 - reduction);
  }, []);

  const applyArrestChanceReduction = useCallback((baseChance: number) => {
    const reduction = TalentEffects.getArrestChanceReduction();
    return baseChance * (1 - reduction);
  }, []);

  const checkIgnoreFirstPrison = useCallback(() => {
    return TalentEffects.shouldIgnoreFirstPrison();
  }, []);

  // Money Laundering Effects
  const applyLaundryTimeReduction = useCallback((baseLaundryTime: number) => {
    const reduction = TalentEffects.getLaundryTimeReduction();
    return baseLaundryTime * (1 - reduction);
  }, []);

  const applyLaundryCleanMoneyBonus = useCallback((baseCleanMoney: number) => {
    const bonus = TalentEffects.getLaundryCleanMoneyBonus();
    return baseCleanMoney * (1 + bonus);
  }, []);

  // Bribe Effects
  const applyBribeCostReduction = useCallback((baseBribeCost: number) => {
    const reduction = TalentEffects.getBribeCostReduction();
    return baseBribeCost * (1 - reduction);
  }, []);

  // Escape Effects
  const applyEscapeSpeedBonus = useCallback((baseSpeed: number) => {
    const bonus = TalentEffects.getEscapeSpeedBonus();
    return baseSpeed * (1 + bonus);
  }, []);

  // Transport Mission Effects
  const applyTransportMoneyBonus = useCallback((baseReward: number) => {
    const bonus = TalentEffects.getTransportMoneyBonus();
    return baseReward * (1 + bonus);
  }, []);

  // Faction Effects
  const getAdditionalParallelSlots = useCallback(() => {
    return TalentEffects.getExtraParallelSlots();
  }, []);

  const applyWeaponVehicleCostReduction = useCallback((baseCost: number) => {
    const reduction = TalentEffects.getWeaponVehicleCostReduction();
    return baseCost * (1 - reduction);
  }, []);

  const applyFactionMemberXPBonus = useCallback((baseXP: number) => {
    const bonus = TalentEffects.getFactionMemberXPBonus();
    return baseXP * (1 + bonus);
  }, []);

  const applyMemberRescueTimeReduction = useCallback((baseRescueTime: number) => {
    const reduction = TalentEffects.getMemberRescueTimeReduction();
    return baseRescueTime * (1 - reduction);
  }, []);

  // Special Abilities
  const canUseEyeAbility = useCallback(() => {
    return TalentEffects.canUseEyeAbility();
  }, []);

  const canUseWarStrategy = useCallback(() => {
    return TalentEffects.canUseWarStrategy();
  }, []);

  const canUseShadowAbility = useCallback(() => {
    return TalentEffects.canUseShadowAbility();
  }, []);

  // Cosmetic Effects
  const hasGoldenName = useCallback(() => {
    return TalentEffects.hasGoldenName();
  }, []);

  return {
    // Slot Machine
    applySlotBonusMultiplier,
    applySlotGainsMultiplier,

    // Prison
    applyPrisonTimeReduction,
    applyPrisonMoneyLossReduction,
    applyArrestChanceReduction,
    checkIgnoreFirstPrison,

    // Money Laundering
    applyLaundryTimeReduction,
    applyLaundryCleanMoneyBonus,

    // Bribe
    applyBribeCostReduction,

    // Escape
    applyEscapeSpeedBonus,

    // Transport
    applyTransportMoneyBonus,

    // Faction
    getAdditionalParallelSlots,
    applyWeaponVehicleCostReduction,
    applyFactionMemberXPBonus,
    applyMemberRescueTimeReduction,

    // Special Abilities
    canUseEyeAbility,
    canUseWarStrategy,
    canUseShadowAbility,

    // Cosmetic
    hasGoldenName,
  };
}
