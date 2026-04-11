/**
 * Serviço de Facção
 * Responsável por gerenciar facções como sistema social coletivo
 */

import { Faction, FactionBonus } from '@/types/powerSystem';

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const FACTION_LEVEL_CAP = 50;
const FACTION_EXPERIENCE_PER_LEVEL = 5000;
const FACTION_MEMBER_LIMIT = 50;
const FACTION_INITIAL_TREASURY = 0;

// Bônus por nível de facção
const FACTION_LEVEL_BONUSES: Record<number, FactionBonus> = {
  1: {
    level: 1,
    bonusPercentage: 0.05,
    affectedStats: ['respect'],
    description: 'Facção iniciante',
  },
  5: {
    level: 5,
    bonusPercentage: 0.1,
    affectedStats: ['respect', 'defense'],
    description: 'Facção estabelecida',
  },
  10: {
    level: 10,
    bonusPercentage: 0.15,
    affectedStats: ['respect', 'defense', 'attack'],
    description: 'Facção influente',
  },
  20: {
    level: 20,
    bonusPercentage: 0.25,
    affectedStats: ['respect', 'defense', 'attack', 'intelligence'],
    description: 'Facção poderosa',
  },
  30: {
    level: 30,
    bonusPercentage: 0.35,
    affectedStats: ['respect', 'defense', 'attack', 'intelligence', 'agility'],
    description: 'Facção dominante',
  },
  50: {
    level: 50,
    bonusPercentage: 0.5,
    affectedStats: ['respect', 'defense', 'attack', 'intelligence', 'agility', 'vigor'],
    description: 'Facção suprema',
  },
};

// ============================================================================
// CRIAÇÃO E INICIALIZAÇÃO
// ============================================================================

/**
 * Cria uma nova facção
 */
export function createFaction(
  name: string,
  description: string,
  leaderId: string
): Faction {
  return {
    _id: generateFactionId(),
    name,
    description,
    leader: leaderId,
    members: [leaderId],
    level: 1,
    experience: 0,
    treasury: FACTION_INITIAL_TREASURY,
    bonusMultiplier: 1.0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Gera um ID único para a facção
 */
function generateFactionId(): string {
  return `faction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// GERENCIAMENTO DE MEMBROS
// ============================================================================

/**
 * Adiciona um membro à facção
 */
export function addMemberToFaction(faction: Faction, memberId: string): Faction {
  if (faction.members.includes(memberId)) {
    return faction; // Já é membro
  }

  if (faction.members.length >= FACTION_MEMBER_LIMIT) {
    throw new Error(`Facção atingiu o limite de ${FACTION_MEMBER_LIMIT} membros`);
  }

  return {
    ...faction,
    members: [...faction.members, memberId],
    updatedAt: new Date(),
  };
}

/**
 * Remove um membro da facção
 */
export function removeMemberFromFaction(faction: Faction, memberId: string): Faction {
  if (faction.leader === memberId) {
    throw new Error('Não é possível remover o líder da facção');
  }

  return {
    ...faction,
    members: faction.members.filter((id) => id !== memberId),
    updatedAt: new Date(),
  };
}

/**
 * Transfere liderança para outro membro
 */
export function transferLeadership(faction: Faction, newLeaderId: string): Faction {
  if (!faction.members.includes(newLeaderId)) {
    throw new Error('Novo líder deve ser membro da facção');
  }

  return {
    ...faction,
    leader: newLeaderId,
    updatedAt: new Date(),
  };
}

/**
 * Retorna lista de membros
 */
export function getFactionMembers(faction: Faction): string[] {
  return [...faction.members];
}

/**
 * Verifica se um jogador é membro da facção
 */
export function isMemberOfFaction(faction: Faction, memberId: string): boolean {
  return faction.members.includes(memberId);
}

/**
 * Verifica se um jogador é líder da facção
 */
export function isLeaderOfFaction(faction: Faction, memberId: string): boolean {
  return faction.leader === memberId;
}

// ============================================================================
// LEVELING E EXPERIÊNCIA
// ============================================================================

/**
 * Adiciona experiência à facção
 */
export function addFactionExperience(
  faction: Faction,
  experience: number
): { faction: Faction; leveledUp: boolean; newLevels: number } {
  let currentExperience = faction.experience + experience;
  let currentLevel = faction.level;
  let leveledUp = false;
  let newLevels = 0;

  // Verificar se subiu de nível
  while (
    currentExperience >= FACTION_EXPERIENCE_PER_LEVEL &&
    currentLevel < FACTION_LEVEL_CAP
  ) {
    currentExperience -= FACTION_EXPERIENCE_PER_LEVEL;
    currentLevel += 1;
    leveledUp = true;
    newLevels += 1;
  }

  const updatedFaction: Faction = {
    ...faction,
    level: currentLevel,
    experience: currentExperience,
    bonusMultiplier: calculateFactionBonusMultiplier(currentLevel),
    updatedAt: new Date(),
  };

  return {
    faction: updatedFaction,
    leveledUp,
    newLevels,
  };
}

/**
 * Calcula o multiplicador de bônus baseado no nível
 */
function calculateFactionBonusMultiplier(level: number): number {
  // Começa em 1.0 e aumenta 0.05 por nível
  return 1.0 + (level - 1) * 0.05;
}

// ============================================================================
// TESOURO
// ============================================================================

/**
 * Adiciona dinheiro ao tesouro da facção
 */
export function addToFactionTreasury(faction: Faction, amount: number): Faction {
  if (amount < 0) {
    throw new Error('Não é possível adicionar quantidade negativa');
  }

  return {
    ...faction,
    treasury: faction.treasury + amount,
    updatedAt: new Date(),
  };
}

/**
 * Remove dinheiro do tesouro da facção
 */
export function removeFromFactionTreasury(faction: Faction, amount: number): Faction {
  if (amount < 0) {
    throw new Error('Não é possível remover quantidade negativa');
  }

  if (faction.treasury < amount) {
    throw new Error('Tesouro insuficiente');
  }

  return {
    ...faction,
    treasury: faction.treasury - amount,
    updatedAt: new Date(),
  };
}

/**
 * Distribui dinheiro do tesouro entre membros
 */
export function distributeTreasuryToMembers(
  faction: Faction,
  totalAmount: number
): { faction: Faction; amountPerMember: number } {
  const updatedFaction = removeFromFactionTreasury(faction, totalAmount);
  const amountPerMember = Math.floor(totalAmount / faction.members.length);

  return {
    faction: updatedFaction,
    amountPerMember,
  };
}

// ============================================================================
// BÔNUS
// ============================================================================

/**
 * Retorna o bônus de facção para um nível específico
 */
export function getFactionBonus(level: number): FactionBonus {
  // Encontrar o bônus mais próximo
  const levels = Object.keys(FACTION_LEVEL_BONUSES)
    .map(Number)
    .sort((a, b) => b - a);

  for (const factionLevel of levels) {
    if (level >= factionLevel) {
      return FACTION_LEVEL_BONUSES[factionLevel];
    }
  }

  return FACTION_LEVEL_BONUSES[1];
}

/**
 * Calcula o bônus percentual total da facção
 */
export function calculateFactionBonusPercentage(faction: Faction): number {
  const bonus = getFactionBonus(faction.level);
  return bonus.bonusPercentage * faction.bonusMultiplier;
}

/**
 * Retorna estatísticas da facção
 */
export function getFactionStats(faction: Faction) {
  const bonus = getFactionBonus(faction.level);
  const bonusPercentage = calculateFactionBonusPercentage(faction);

  return {
    name: faction.name,
    leader: faction.leader,
    memberCount: faction.members.length,
    memberLimit: FACTION_MEMBER_LIMIT,
    level: faction.level,
    experience: faction.experience,
    experienceToNextLevel: FACTION_EXPERIENCE_PER_LEVEL - faction.experience,
    treasury: faction.treasury,
    bonusMultiplier: Math.round(faction.bonusMultiplier * 100) / 100,
    bonusPercentage: Math.round(bonusPercentage * 100) / 100,
    affectedStats: bonus.affectedStats,
    description: bonus.description,
    createdAt: faction.createdAt,
    updatedAt: faction.updatedAt,
  };
}

// ============================================================================
// VALIDAÇÕES
// ============================================================================

/**
 * Valida se a facção pode aceitar novos membros
 */
export function canAddMembers(faction: Faction): boolean {
  return faction.members.length < FACTION_MEMBER_LIMIT;
}

/**
 * Valida se a facção tem tesouro suficiente
 */
export function hasSufficientTreasury(faction: Faction, amount: number): boolean {
  return faction.treasury >= amount;
}

/**
 * Retorna informações sobre limites da facção
 */
export function getFactionLimits() {
  return {
    maxLevel: FACTION_LEVEL_CAP,
    maxMembers: FACTION_MEMBER_LIMIT,
    experiencePerLevel: FACTION_EXPERIENCE_PER_LEVEL,
    initialTreasury: FACTION_INITIAL_TREASURY,
  };
}
