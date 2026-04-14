/**
 * Serviço de Quadrilha (Gang)
 * Responsável por gerenciar membros, leveling e bônus da quadrilha
 */

import {
  GangMembers,
  GangMember,
  GangMemberRole,
  PlayerSkills,
} from '@/types/powerSystem';

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const GANG_MEMBER_LEVEL_CAP = 50;
const GANG_MEMBER_EXPERIENCE_PER_LEVEL = 1000;
const GANG_MEMBER_INITIAL_HEALTH = 100;
const GANG_MEMBER_HEALTH_PER_LEVEL = 20;

// Bônus base por papel
const GANG_MEMBER_ROLE_BONUSES: Record<GangMemberRole, Partial<PlayerSkills>> = {
  frente: { defense: 15, vigor: 10 },
  muralha: { defense: 20, vigor: 15 },
  nitro: { attack: 18, agility: 12 },
  certeiro: { intelligence: 15, attack: 10 },
  wifi: { intelligence: 12, respect: 10 },
};

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

/**
 * Cria uma quadrilha inicial com todos os membros no nível 1
 */
export function initializeGangMembers(): GangMembers {
  return {
    frente: createGangMember('frente', 1),
    muralha: createGangMember('muralha', 1),
    nitro: createGangMember('nitro', 1),
    certeiro: createGangMember('certeiro', 1),
    wifi: createGangMember('wifi', 1),
  };
}

/**
 * Cria um membro individual da quadrilha
 */
function createGangMember(role: GangMemberRole, level: number): GangMember {
  const maxHealth = GANG_MEMBER_INITIAL_HEALTH + (level - 1) * GANG_MEMBER_HEALTH_PER_LEVEL;

  return {
    role,
    level: Math.max(1, Math.min(level, GANG_MEMBER_LEVEL_CAP)),
    experience: 0,
    health: maxHealth,
    maxHealth,
    isAlive: true,
    bonusMultiplier: 1.0 + (level - 1) * 0.05, // Aumenta 5% por nível
  };
}

// ============================================================================
// LEVELING E EXPERIÊNCIA
// ============================================================================

/**
 * Adiciona experiência a um membro da quadrilha
 */
export function addGangMemberExperience(
  member: GangMember,
  experience: number
): { member: GangMember; leveledUp: boolean; newLevels: number } {
  let currentExperience = member.experience + experience;
  let currentLevel = member.level;
  let leveledUp = false;
  let newLevels = 0;

  // Verificar se subiu de nível
  while (
    currentExperience >= GANG_MEMBER_EXPERIENCE_PER_LEVEL &&
    currentLevel < GANG_MEMBER_LEVEL_CAP
  ) {
    currentExperience -= GANG_MEMBER_EXPERIENCE_PER_LEVEL;
    currentLevel += 1;
    leveledUp = true;
    newLevels += 1;
  }

  // Atualizar membro
  const updatedMember: GangMember = {
    ...member,
    level: currentLevel,
    experience: currentExperience,
    maxHealth: GANG_MEMBER_INITIAL_HEALTH + (currentLevel - 1) * GANG_MEMBER_HEALTH_PER_LEVEL,
    bonusMultiplier: 1.0 + (currentLevel - 1) * 0.05,
  };

  // Restaurar saúde ao subir de nível
  if (leveledUp) {
    updatedMember.health = updatedMember.maxHealth;
  }

  return {
    member: updatedMember,
    leveledUp,
    newLevels,
  };
}

/**
 * Adiciona experiência a todos os membros da quadrilha
 */
export function addGangExperience(
  gangMembers: GangMembers,
  experience: number
): { gangMembers: GangMembers; levelUps: Record<GangMemberRole, number> } {
  const levelUps: Record<GangMemberRole, number> = {
    frente: 0,
    muralha: 0,
    nitro: 0,
    certeiro: 0,
    wifi: 0,
  };

  const updatedGang: GangMembers = { ...gangMembers };

  (Object.keys(gangMembers) as GangMemberRole[]).forEach((role) => {
    const result = addGangMemberExperience(gangMembers[role], experience);
    updatedGang[role] = result.member;
    levelUps[role] = result.newLevels;
  });

  return {
    gangMembers: updatedGang,
    levelUps,
  };
}

// ============================================================================
// DANO E SAÚDE
// ============================================================================

/**
 * Aplica dano a um membro da quadrilha
 */
export function damageGangMember(member: GangMember, damage: number): GangMember {
  const newHealth = Math.max(0, member.health - damage);
  const isAlive = newHealth > 0;

  return {
    ...member,
    health: newHealth,
    isAlive,
  };
}

/**
 * Cura um membro da quadrilha
 */
export function healGangMember(member: GangMember, healAmount: number): GangMember {
  const newHealth = Math.min(member.maxHealth, member.health + healAmount);

  return {
    ...member,
    health: newHealth,
    isAlive: newHealth > 0,
  };
}

/**
 * Revive um membro da quadrilha
 */
export function reviveGangMember(member: GangMember, healthPercentage: number = 0.5): GangMember {
  const reviveHealth = member.maxHealth * healthPercentage;

  return {
    ...member,
    health: reviveHealth,
    isAlive: true,
  };
}

/**
 * Aplica dano a toda a quadrilha
 */
export function damageGang(gangMembers: GangMembers, damage: number): GangMembers {
  const updatedGang: GangMembers = { ...gangMembers };

  (Object.keys(gangMembers) as GangMemberRole[]).forEach((role) => {
    updatedGang[role] = damageGangMember(gangMembers[role], damage);
  });

  return updatedGang;
}

/**
 * Cura toda a quadrilha
 */
export function healGang(gangMembers: GangMembers, healAmount: number): GangMembers {
  const updatedGang: GangMembers = { ...gangMembers };

  (Object.keys(gangMembers) as GangMemberRole[]).forEach((role) => {
    updatedGang[role] = healGangMember(gangMembers[role], healAmount);
  });

  return updatedGang;
}

/**
 * Revive toda a quadrilha
 */
export function reviveGang(
  gangMembers: GangMembers,
  healthPercentage: number = 0.5
): GangMembers {
  const updatedGang: GangMembers = { ...gangMembers };

  (Object.keys(gangMembers) as GangMemberRole[]).forEach((role) => {
    updatedGang[role] = reviveGangMember(gangMembers[role], healthPercentage);
  });

  return updatedGang;
}

// ============================================================================
// BÔNUS E CÁLCULOS
// ============================================================================

/**
 * Calcula o bônus total de um membro específico
 */
export function calculateGangMemberBonus(member: GangMember): Partial<PlayerSkills> {
  if (!member.isAlive) {
    return {};
  }

  const roleBonus = GANG_MEMBER_ROLE_BONUSES[member.role];
  const bonus: Partial<PlayerSkills> = {};

  (Object.keys(roleBonus) as Array<keyof PlayerSkills>).forEach((skill) => {
    const baseBonus = roleBonus[skill] || 0;
    bonus[skill] = baseBonus * member.bonusMultiplier;
  });

  return bonus;
}

/**
 * Calcula o bônus total de toda a quadrilha
 */
export function calculateGangBonus(gangMembers: GangMembers): Partial<PlayerSkills> {
  const totalBonus: Partial<PlayerSkills> = {
    attack: 0,
    defense: 0,
    intelligence: 0,
    agility: 0,
    respect: 0,
    vigor: 0,
  };

  (Object.keys(gangMembers) as GangMemberRole[]).forEach((role) => {
    const memberBonus = calculateGangMemberBonus(gangMembers[role]);

    (Object.keys(memberBonus) as Array<keyof PlayerSkills>).forEach((skill) => {
      totalBonus[skill] = (totalBonus[skill] || 0) + (memberBonus[skill] || 0);
    });
  });

  return totalBonus;
}

/**
 * Retorna estatísticas gerais da quadrilha
 */
export function getGangStats(gangMembers: GangMembers) {
  const stats = {
    totalMembers: 5,
    aliveMembers: 0,
    deadMembers: 0,
    averageLevel: 0,
    totalHealth: 0,
    maxTotalHealth: 0,
    totalExperience: 0,
  };

  let totalLevel = 0;

  (Object.keys(gangMembers) as GangMemberRole[]).forEach((role) => {
    const member = gangMembers[role];

    if (member.isAlive) {
      stats.aliveMembers += 1;
    } else {
      stats.deadMembers += 1;
    }

    totalLevel += member.level;
    stats.totalHealth += member.health;
    stats.maxTotalHealth += member.maxHealth;
    stats.totalExperience += member.experience;
  });

  stats.averageLevel = Math.round(totalLevel / stats.totalMembers);

  return stats;
}

/**
 * Retorna informações detalhadas de um membro
 */
export function getGangMemberInfo(member: GangMember) {
  const bonus = calculateGangMemberBonus(member);
  const healthPercentage = (member.health / member.maxHealth) * 100;

  return {
    role: member.role,
    level: member.level,
    experience: member.experience,
    experienceToNextLevel: GANG_MEMBER_EXPERIENCE_PER_LEVEL - member.experience,
    health: member.health,
    maxHealth: member.maxHealth,
    healthPercentage: Math.round(healthPercentage),
    isAlive: member.isAlive,
    bonusMultiplier: Math.round(member.bonusMultiplier * 100) / 100,
    bonus,
  };
}

// ============================================================================
// VALIDAÇÕES
// ============================================================================

/**
 * Valida se a quadrilha está em condições de batalha
 */
export function isGangBattleReady(gangMembers: GangMembers): boolean {
  return Object.values(gangMembers).some((member) => member.isAlive);
}

/**
 * Conta quantos membros estão vivos
 */
export function countAliveMembers(gangMembers: GangMembers): number {
  return Object.values(gangMembers).filter((member) => member.isAlive).length;
}

/**
 * Retorna lista de membros vivos
 */
export function getAliveMembers(gangMembers: GangMembers): GangMember[] {
  return Object.values(gangMembers).filter((member) => member.isAlive);
}

/**
 * Retorna lista de membros mortos
 */
export function getDeadMembers(gangMembers: GangMembers): GangMember[] {
  return Object.values(gangMembers).filter((member) => !member.isAlive);
}
