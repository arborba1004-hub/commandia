/**
 * Sistema de Requisitos de Nível do Jogador
 * Define os níveis mínimos necessários para acessar cada funcionalidade
 */

export const LEVEL_REQUIREMENTS = {
  // Suborno (Bribery)
  suborno: {
    unlock: 1,
    maxLevel: 100,
    description: 'Suborno de Autoridades',
  },

  // Fuga (Escape Vehicles)
  fuga: {
    unlock: 5,
    maxLevel: 100,
    description: 'Veículos de Fuga',
  },

  // Arsenal (Weapons)
  arsenal: {
    unlock: 10,
    maxLevel: 100,
    description: 'Arsenal de Armas',
  },

  // Loja de Luxo (Luxury Shop)
  luxo: {
    unlock: 15,
    maxLevel: 100,
    description: 'Loja de Itens de Luxo',
  },

  // Gang
  gang: {
    unlock: 20,
    maxLevel: 100,
    description: 'Sistema de Gang',
  },

  // Lavagem de Dinheiro (Money Laundering)
  lavagem: {
    unlock: 25,
    maxLevel: 100,
    description: 'Lavagem de Dinheiro',
  },

  // Talentos (Talents)
  talentos: {
    unlock: 1,
    maxLevel: 100,
    description: 'Talentos do Crime',
  },

  // Giro (Spin/Wheel)
  giro: {
    unlock: 1,
    maxLevel: 100,
    description: 'Giro da Sorte',
  },
};

/**
 * Verifica se o jogador pode acessar uma funcionalidade
 */
export function canAccessFeature(playerLevel: number, featureKey: keyof typeof LEVEL_REQUIREMENTS): boolean {
  const requirement = LEVEL_REQUIREMENTS[featureKey];
  return playerLevel >= requirement.unlock;
}

/**
 * Retorna o nível mínimo necessário para acessar uma funcionalidade
 */
export function getFeatureLevelRequirement(featureKey: keyof typeof LEVEL_REQUIREMENTS): number {
  return LEVEL_REQUIREMENTS[featureKey].unlock;
}

/**
 * Retorna a descrição de uma funcionalidade
 */
export function getFeatureDescription(featureKey: keyof typeof LEVEL_REQUIREMENTS): string {
  return LEVEL_REQUIREMENTS[featureKey].description;
}

/**
 * Retorna o nível máximo para uma funcionalidade
 */
export function getFeatureMaxLevel(featureKey: keyof typeof LEVEL_REQUIREMENTS): number {
  return LEVEL_REQUIREMENTS[featureKey].maxLevel;
}

/**
 * Calcula o progresso até desbloquear uma funcionalidade
 */
export function getFeatureUnlockProgress(
  playerLevel: number,
  featureKey: keyof typeof LEVEL_REQUIREMENTS
): { isUnlocked: boolean; currentLevel: number; requiredLevel: number; progress: number } {
  const requirement = LEVEL_REQUIREMENTS[featureKey];
  const isUnlocked = playerLevel >= requirement.unlock;
  const progress = isUnlocked ? 100 : (playerLevel / requirement.unlock) * 100;

  return {
    isUnlocked,
    currentLevel: playerLevel,
    requiredLevel: requirement.unlock,
    progress: Math.min(progress, 100),
  };
}

/**
 * Retorna uma mensagem de bloqueio para uma funcionalidade
 */
export function getFeatureBlockMessage(
  playerLevel: number,
  featureKey: keyof typeof LEVEL_REQUIREMENTS
): string | null {
  const requirement = LEVEL_REQUIREMENTS[featureKey];
  if (playerLevel < requirement.unlock) {
    return `Desbloqueado no nível ${requirement.unlock}. Você está no nível ${playerLevel}.`;
  }
  return null;
}
