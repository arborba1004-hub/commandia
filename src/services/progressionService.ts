/**
 * Serviço de Progressão
 * Responsável por gerenciar leveling, experiência e progressão geral do jogador
 */

import { LevelRequirement, ProgressionConfig } from '@/types/powerSystem';

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const PLAYER_LEVEL_CAP = 100;
const BASE_EXPERIENCE_PER_LEVEL = 1000;
const EXPERIENCE_SCALING_FACTOR = 1.15; // Cada nível requer 15% mais XP

const PROGRESSION_CONFIG: ProgressionConfig = {
  skillPointsPerLevel: 5,
  investmentPointsPerLevel: 3,
  experienceMultiplier: 1.0,
  powerScalingFactor: 1.1,
};

// ============================================================================
// CÁLCULOS DE EXPERIÊNCIA
// ============================================================================

/**
 * Calcula a experiência necessária para um nível específico
 */
export function calculateExperienceForLevel(level: number): number {
  if (level <= 1) return 0;

  let totalExperience = 0;

  for (let i = 1; i < level; i++) {
    const levelExperience = Math.floor(
      BASE_EXPERIENCE_PER_LEVEL * Math.pow(EXPERIENCE_SCALING_FACTOR, i - 1)
    );
    totalExperience += levelExperience;
  }

  return totalExperience;
}

/**
 * Calcula a experiência necessária para passar do nível atual para o próximo
 */
export function calculateExperienceToNextLevel(currentLevel: number): number {
  if (currentLevel >= PLAYER_LEVEL_CAP) return 0;

  return Math.floor(
    BASE_EXPERIENCE_PER_LEVEL * Math.pow(EXPERIENCE_SCALING_FACTOR, currentLevel - 1)
  );
}

/**
 * Calcula o nível baseado na experiência total
 */
export function calculateLevelFromExperience(totalExperience: number): number {
  let level = 1;

  while (level < PLAYER_LEVEL_CAP) {
    const nextLevelExperience = calculateExperienceForLevel(level + 1);

    if (totalExperience < nextLevelExperience) {
      break;
    }

    level += 1;
  }

  return level;
}

/**
 * Calcula a experiência restante para o próximo nível
 */
export function calculateExperienceProgress(
  currentLevel: number,
  totalExperience: number
): { current: number; required: number; percentage: number } {
  const currentLevelExperience = calculateExperienceForLevel(currentLevel);
  const nextLevelExperience = calculateExperienceForLevel(currentLevel + 1);

  const current = totalExperience - currentLevelExperience;
  const required = nextLevelExperience - currentLevelExperience;
  const percentage = (current / required) * 100;

  return {
    current: Math.max(0, current),
    required: Math.max(0, required),
    percentage: Math.min(100, Math.max(0, percentage)),
  };
}

// ============================================================================
// LEVELING
// ============================================================================

/**
 * Adiciona experiência e retorna informações de leveling
 */
export function addExperience(
  currentLevel: number,
  currentExperience: number,
  experienceGain: number
): {
  newLevel: number;
  newExperience: number;
  leveledUp: boolean;
  levelsGained: number;
  skillPointsGained: number;
  investmentPointsGained: number;
} {
  let newExperience = currentExperience + experienceGain;
  let newLevel = calculateLevelFromExperience(newExperience);

  const levelsGained = Math.max(0, newLevel - currentLevel);
  const skillPointsGained = levelsGained * PROGRESSION_CONFIG.skillPointsPerLevel;
  const investmentPointsGained = levelsGained * PROGRESSION_CONFIG.investmentPointsPerLevel;

  return {
    newLevel,
    newExperience,
    leveledUp: levelsGained > 0,
    levelsGained,
    skillPointsGained,
    investmentPointsGained,
  };
}

/**
 * Retorna requisitos de leveling para um nível específico
 */
export function getLevelRequirement(level: number): LevelRequirement {
  if (level < 1 || level > PLAYER_LEVEL_CAP) {
    throw new Error(`Nível inválido: ${level}`);
  }

  return {
    level,
    experienceRequired: calculateExperienceForLevel(level),
    skillPointsGained: PROGRESSION_CONFIG.skillPointsPerLevel,
    investmentPointsGained: PROGRESSION_CONFIG.investmentPointsPerLevel,
  };
}

/**
 * Retorna todos os requisitos de leveling até um nível específico
 */
export function getAllLevelRequirements(maxLevel: number = PLAYER_LEVEL_CAP): LevelRequirement[] {
  const requirements: LevelRequirement[] = [];

  for (let level = 1; level <= maxLevel; level++) {
    requirements.push(getLevelRequirement(level));
  }

  return requirements;
}

// ============================================================================
// PONTOS DE SKILL E INVESTIMENTO
// ============================================================================

/**
 * Calcula pontos de skill disponíveis baseado no nível
 */
export function calculateSkillPointsForLevel(level: number): number {
  return (level - 1) * PROGRESSION_CONFIG.skillPointsPerLevel;
}

/**
 * Calcula pontos de investimento disponíveis baseado no nível
 */
export function calculateInvestmentPointsForLevel(level: number): number {
  return (level - 1) * PROGRESSION_CONFIG.investmentPointsPerLevel;
}

/**
 * Calcula pontos totais gastos em skills
 */
export function calculateTotalSkillPointsSpent(skills: Record<string, number>): number {
  return Object.values(skills).reduce((sum, value) => sum + value, 0);
}

/**
 * Calcula pontos totais gastos em investimentos
 */
export function calculateTotalInvestmentPointsSpent(
  investments: Record<string, number>
): number {
  return Object.values(investments).reduce((sum, value) => sum + value, 0);
}

/**
 * Calcula pontos de skill disponíveis
 */
export function calculateAvailableSkillPoints(
  level: number,
  skillsSpent: number
): number {
  const totalAvailable = calculateSkillPointsForLevel(level);
  return Math.max(0, totalAvailable - skillsSpent);
}

/**
 * Calcula pontos de investimento disponíveis
 */
export function calculateAvailableInvestmentPoints(
  level: number,
  investmentsSpent: number
): number {
  const totalAvailable = calculateInvestmentPointsForLevel(level);
  return Math.max(0, totalAvailable - investmentsSpent);
}

// ============================================================================
// PROGRESSÃO E MILESTONES
// ============================================================================

/**
 * Retorna milestones de progressão (níveis importantes)
 */
export function getProgressionMilestones(): number[] {
  return [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
}

/**
 * Verifica se um nível é um milestone
 */
export function isMilestone(level: number): boolean {
  return getProgressionMilestones().includes(level);
}

/**
 * Calcula progresso geral do jogador (0-100%)
 */
export function calculateOverallProgress(level: number, experience: number): number {
  if (level >= PLAYER_LEVEL_CAP) return 100;

  const currentLevelExperience = calculateExperienceForLevel(level);
  const nextLevelExperience = calculateExperienceForLevel(level + 1);

  const levelProgress = ((level - 1) / (PLAYER_LEVEL_CAP - 1)) * 100;
  const experienceProgress =
    ((experience - currentLevelExperience) / (nextLevelExperience - currentLevelExperience)) * 5;

  return Math.min(100, levelProgress + experienceProgress);
}

// ============================================================================
// BÔNUS E MULTIPLICADORES
// ============================================================================

/**
 * Calcula multiplicador de experiência baseado em fatores
 */
export function calculateExperienceMultiplier(
  baseMultiplier: number = 1.0,
  bonusMultiplier: number = 1.0,
  eventMultiplier: number = 1.0
): number {
  return baseMultiplier * bonusMultiplier * eventMultiplier;
}

/**
 * Calcula poder esperado para um nível
 */
export function calculateExpectedPowerForLevel(
  baseLevel1Power: number,
  level: number
): number {
  return baseLevel1Power * Math.pow(PROGRESSION_CONFIG.powerScalingFactor, level - 1);
}

/**
 * Retorna configurações de progressão
 */
export function getProgressionConfig(): ProgressionConfig {
  return { ...PROGRESSION_CONFIG };
}

/**
 * Retorna limites de progressão
 */
export function getProgressionLimits() {
  return {
    maxLevel: PLAYER_LEVEL_CAP,
    baseExperiencePerLevel: BASE_EXPERIENCE_PER_LEVEL,
    experienceScalingFactor: EXPERIENCE_SCALING_FACTOR,
    skillPointsPerLevel: PROGRESSION_CONFIG.skillPointsPerLevel,
    investmentPointsPerLevel: PROGRESSION_CONFIG.investmentPointsPerLevel,
  };
}

// ============================================================================
// VALIDAÇÕES
// ============================================================================

/**
 * Valida se um nível é válido
 */
export function isValidLevel(level: number): boolean {
  return level >= 1 && level <= PLAYER_LEVEL_CAP;
}

/**
 * Valida se um jogador pode subir de nível
 */
export function canLevelUp(currentLevel: number): boolean {
  return currentLevel < PLAYER_LEVEL_CAP;
}

/**
 * Retorna informações detalhadas de progressão
 */
export function getProgressionInfo(level: number, experience: number) {
  const experienceToNextLevel = calculateExperienceToNextLevel(level);
  const experienceProgress = calculateExperienceProgress(level, experience);
  const overallProgress = calculateOverallProgress(level, experience);
  const skillPoints = calculateSkillPointsForLevel(level);
  const investmentPoints = calculateInvestmentPointsForLevel(level);

  return {
    level,
    experience,
    experienceToNextLevel,
    experienceProgress,
    overallProgress: Math.round(overallProgress),
    skillPoints,
    investmentPoints,
    canLevelUp: canLevelUp(level),
    isMilestone: isMilestone(level),
  };
}
