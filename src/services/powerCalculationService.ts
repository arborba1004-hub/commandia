/**
 * Power Calculation Service
 * Handles all power-related calculations for players and gangs
 */

export interface PowerStats {
  baseAttack: number;
  baseDefense: number;
  level: number;
  experience: number;
}

export interface PowerBonus {
  attackBonus: number;
  defenseBonus: number;
  healthBonus: number;
}

export const powerCalculationService = {
  /**
   * Calculate player power based on stats
   */
  calculatePlayerPower(stats: PowerStats): number {
    const levelMultiplier = 1 + (stats.level - 1) * 0.1;
    const experienceBonus = Math.floor(stats.experience / 100);
    
    return Math.floor((stats.baseAttack + stats.baseDefense) * levelMultiplier + experienceBonus);
  },

  /**
   * Calculate attack power
   */
  calculateAttackPower(baseAttack: number, level: number, bonuses: PowerBonus = { attackBonus: 0, defenseBonus: 0, healthBonus: 0 }): number {
    const levelMultiplier = 1 + (level - 1) * 0.15;
    return Math.floor((baseAttack * levelMultiplier) + bonuses.attackBonus);
  },

  /**
   * Calculate defense power
   */
  calculateDefensePower(baseDefense: number, level: number, bonuses: PowerBonus = { attackBonus: 0, defenseBonus: 0, healthBonus: 0 }): number {
    const levelMultiplier = 1 + (level - 1) * 0.12;
    return Math.floor((baseDefense * levelMultiplier) + bonuses.defenseBonus);
  },

  /**
   * Calculate health points
   */
  calculateHealthPoints(baseHealth: number, level: number, bonuses: PowerBonus = { attackBonus: 0, defenseBonus: 0, healthBonus: 0 }): number {
    const levelMultiplier = 1 + (level - 1) * 0.2;
    return Math.floor((baseHealth * levelMultiplier) + bonuses.healthBonus);
  },

  /**
   * Calculate damage dealt in combat
   */
  calculateDamage(attackerPower: number, defenderPower: number, criticalChance: number = 0.1): number {
    const baseDamage = Math.max(1, attackerPower - Math.floor(defenderPower * 0.3));
    const isCritical = Math.random() < criticalChance;
    
    return isCritical ? Math.floor(baseDamage * 1.5) : baseDamage;
  },

  /**
   * Calculate experience gained from battle
   */
  calculateExperienceGain(victoryMultiplier: number = 1, enemyLevel: number = 1): number {
    const baseExperience = 100;
    const levelBonus = Math.max(0, enemyLevel - 1) * 10;
    
    return Math.floor((baseExperience + levelBonus) * victoryMultiplier);
  },

  /**
   * Calculate level up requirement
   */
  calculateLevelUpRequirement(currentLevel: number): number {
    return Math.floor(100 * Math.pow(1.1, currentLevel - 1));
  },

  /**
   * Apply power bonuses
   */
  applyBonuses(basePower: number, bonuses: PowerBonus): number {
    return basePower + bonuses.attackBonus + bonuses.defenseBonus + bonuses.healthBonus;
  },

  /**
   * Calculate total power with all modifiers
   */
  calculateTotalPower(stats: PowerStats, bonuses: PowerBonus = { attackBonus: 0, defenseBonus: 0, healthBonus: 0 }): number {
    const basePower = this.calculatePlayerPower(stats);
    return this.applyBonuses(basePower, bonuses);
  },
};

export default powerCalculationService;
