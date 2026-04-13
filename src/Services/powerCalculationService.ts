/**
 * Serviço de Cálculo de Poder
 * Responsável por calcular poder total, bônus e estatísticas de batalha
 */

import {
  PlayerSkills,
  PlayerInvestments,
  GangMembers,
  BattleStats,
  BattleSnapshot,
  PowerCalculationBreakdown,
  SkillBonus,
  InvestmentBonus,
  GangMemberBonus,
  FactionBonus,
} from '@/types/powerSystem';

// ============================================================================
// CONFIGURAÇÕES BASE
// ============================================================================

const SKILL_POWER_MULTIPLIER = 5.0; // Cada ponto de skill = 5.0 de poder (aumentado para funcionalidade)
const INVESTMENT_POWER_MULTIPLIER = 3.0; // Cada ponto de investimento = 3.0 de poder
const GANG_MEMBER_POWER_MULTIPLIER = 1.0; // Multiplicador por membro
const FACTION_BONUS_BASE = 0.03; // 3% por nível de facção
const BASE_POWER_BONUS = 50; // Bônus base inicial para garantir jogabilidade

// Bônus base por tipo de habilidade
const SKILL_BONUSES: Record<keyof PlayerSkills, SkillBonus> = {
  attack: {
    skillName: 'attack',
    baseBonus: 15,
    percentBonus: 0.25,
    description: 'Aumenta dano base',
  },
  defense: {
    skillName: 'defense',
    baseBonus: 15,
    percentBonus: 0.25,
    description: 'Aumenta redução de dano',
  },
  intelligence: {
    skillName: 'intelligence',
    baseBonus: 12,
    percentBonus: 0.20,
    description: 'Aumenta efetividade de operações',
  },
  agility: {
    skillName: 'agility',
    baseBonus: 12,
    percentBonus: 0.20,
    description: 'Aumenta velocidade e esquiva',
  },
  respect: {
    skillName: 'respect',
    baseBonus: 10,
    percentBonus: 0.18,
    description: 'Aumenta influência social',
  },
  vigor: {
    skillName: 'vigor',
    baseBonus: 15,
    percentBonus: 0.25,
    description: 'Aumenta saúde e resistência',
  },
};

// Bônus por tipo de investimento
const INVESTMENT_BONUSES: Record<string, InvestmentBonus> = {
  war: {
    investmentType: 'war',
    baseBonus: 25,
    percentBonus: 0.30,
    affectedStats: ['attack', 'defense'],
    description: 'Bônus de guerra',
  },
  laundering: {
    investmentType: 'laundering',
    baseBonus: 20,
    percentBonus: 0.25,
    affectedStats: ['intelligence'],
    description: 'Bônus de lavagem',
  },
  fuga: {
    investmentType: 'fuga',
    baseBonus: 22,
    percentBonus: 0.28,
    affectedStats: ['agility'],
    description: 'Bônus de fuga',
  },
  faction: {
    investmentType: 'faction',
    baseBonus: 18,
    percentBonus: 0.22,
    affectedStats: ['respect'],
    description: 'Bônus de facção',
  },
  luxury: {
    investmentType: 'luxury',
    baseBonus: 16,
    percentBonus: 0.20,
    affectedStats: ['respect', 'agility'],
    description: 'Bônus de luxo',
  },
  comando: {
    investmentType: 'comando',
    baseBonus: 28,
    percentBonus: 0.32,
    affectedStats: ['attack', 'defense', 'respect'],
    description: 'Bônus de comando',
  },
};

// Bônus por membro da quadrilha
const GANG_MEMBER_BONUSES: Record<string, GangMemberBonus> = {
  frente: {
    role: 'frente',
    affectedStats: ['defense', 'vigor'],
    bonusPerLevel: 2.0,
    description: 'Frente de batalha - Defesa',
  },
  muralha: {
    role: 'muralha',
    affectedStats: ['defense', 'vigor'],
    bonusPerLevel: 2.5,
    description: 'Muralha - Proteção máxima',
  },
  nitro: {
    role: 'nitro',
    affectedStats: ['attack', 'agility'],
    bonusPerLevel: 2.8,
    description: 'Nitro - Velocidade e ataque',
  },
  certeiro: {
    role: 'certeiro',
    affectedStats: ['intelligence', 'attack'],
    bonusPerLevel: 2.0,
    description: 'Certeiro - Precisão',
  },
  wifi: {
    role: 'wifi',
    affectedStats: ['intelligence', 'respect'],
    bonusPerLevel: 1.5,
    description: 'WiFi - Informações',
  },
};

// ============================================================================
// CÁLCULOS PRINCIPAIS
// ============================================================================

/**
 * Calcula o poder total de um jogador
 */
export function calculateTotalPower(
  skills: PlayerSkills,
  investments: PlayerInvestments,
  gangMembers: GangMembers,
  factionBonus: number = 0,
  playerLevel: number = 1
): PowerCalculationBreakdown {
  // 1. Poder base das skills
  const baseSkillsPower = calculateBaseSkillsPower(skills);

  // 2. Bônus das skills
  const skillBonuses = calculateSkillBonuses(skills);

  // 3. Bônus dos investimentos
  const investmentBonuses = calculateInvestmentBonuses(investments, skills);

  // 4. Bônus dos membros da quadrilha
  const gangMemberBonuses = calculateGangMemberBonuses(gangMembers, skills);

  // 5. Bônus da facção
  const factionBonusValue = calculateFactionBonus(factionBonus, baseSkillsPower);

  // 6. Aplicar multiplicador de nível (mais agressivo)
  const levelMultiplier = 1 + (playerLevel - 1) * 0.15;

  // Total com bônus base garantido
  const totalPower =
    (BASE_POWER_BONUS +
      baseSkillsPower +
      skillBonuses +
      investmentBonuses +
      gangMemberBonuses +
      factionBonusValue) *
    levelMultiplier;

  return {
    baseSkillsPower,
    skillBonuses,
    investmentBonuses,
    gangMemberBonuses,
    factionBonus: factionBonusValue,
    totalPower: Math.round(totalPower),
    details: {
      skillsBreakdown: calculateSkillsBreakdown(skills),
      investmentsBreakdown: calculateInvestmentsBreakdown(investments),
      gangMembersBreakdown: calculateGangMembersBreakdown(gangMembers),
    },
  };
}

/**
 * Calcula o poder base das skills
 */
function calculateBaseSkillsPower(skills: PlayerSkills): number {
  const skillValues = Object.values(skills);
  return skillValues.reduce((sum, value) => sum + value * SKILL_POWER_MULTIPLIER, 0);
}

/**
 * Calcula bônus adicionais das skills
 */
function calculateSkillBonuses(skills: PlayerSkills): number {
  let totalBonus = 0;

  (Object.keys(skills) as Array<keyof PlayerSkills>).forEach((skillKey) => {
    const skillValue = skills[skillKey];
    const bonus = SKILL_BONUSES[skillKey];

    if (bonus) {
      const skillBonus = bonus.baseBonus + skillValue * bonus.percentBonus;
      totalBonus += skillBonus;
    }
  });

  return totalBonus;
}

/**
 * Calcula bônus dos investimentos
 */
function calculateInvestmentBonuses(
  investments: PlayerInvestments,
  skills: PlayerSkills
): number {
  let totalBonus = 0;

  (Object.keys(investments) as Array<keyof PlayerInvestments>).forEach((investKey) => {
    const investValue = investments[investKey];
    const bonus = INVESTMENT_BONUSES[investKey];

    if (bonus) {
      const investBonus = bonus.baseBonus + investValue * bonus.percentBonus;
      totalBonus += investBonus;
    }
  });

  return totalBonus;
}

/**
 * Calcula bônus dos membros da quadrilha
 */
function calculateGangMemberBonuses(gangMembers: GangMembers, skills: PlayerSkills): number {
  let totalBonus = 0;

  (Object.keys(gangMembers) as Array<keyof GangMembers>).forEach((memberKey) => {
    const member = gangMembers[memberKey];
    const bonus = GANG_MEMBER_BONUSES[memberKey];

    if (bonus && member.isAlive) {
      const memberBonus = member.level * bonus.bonusPerLevel * member.bonusMultiplier;
      totalBonus += memberBonus;
    }
  });

  return totalBonus;
}

/**
 * Calcula bônus da facção
 */
function calculateFactionBonus(factionLevel: number, baseSkillsPower: number): number {
  return baseSkillsPower * (factionLevel * FACTION_BONUS_BASE);
}

/**
 * Breakdown detalhado de poder por skill
 */
function calculateSkillsBreakdown(skills: PlayerSkills): Record<keyof PlayerSkills, number> {
  const breakdown: Record<keyof PlayerSkills, number> = {
    attack: 0,
    defense: 0,
    intelligence: 0,
    agility: 0,
    respect: 0,
    vigor: 0,
  };

  (Object.keys(skills) as Array<keyof PlayerSkills>).forEach((skillKey) => {
    const skillValue = skills[skillKey];
    const bonus = SKILL_BONUSES[skillKey];
    breakdown[skillKey] = skillValue * SKILL_POWER_MULTIPLIER + bonus.baseBonus;
  });

  return breakdown;
}

/**
 * Breakdown detalhado de poder por investimento
 */
function calculateInvestmentsBreakdown(
  investments: PlayerInvestments
): Record<keyof PlayerInvestments, number> {
  const breakdown: Record<keyof PlayerInvestments, number> = {
    war: 0,
    laundering: 0,
    fuga: 0,
    faction: 0,
    luxury: 0,
    comando: 0,
  };

  (Object.keys(investments) as Array<keyof PlayerInvestments>).forEach((investKey) => {
    const investValue = investments[investKey];
    const bonus = INVESTMENT_BONUSES[investKey];
    breakdown[investKey] = investValue * INVESTMENT_POWER_MULTIPLIER + bonus.baseBonus;
  });

  return breakdown;
}

/**
 * Breakdown detalhado de poder por membro da quadrilha
 */
function calculateGangMembersBreakdown(gangMembers: GangMembers): Record<string, number> {
  const breakdown: Record<string, number> = {
    frente: 0,
    muralha: 0,
    nitro: 0,
    certeiro: 0,
    wifi: 0,
  };

  (Object.keys(gangMembers) as Array<keyof GangMembers>).forEach((memberKey) => {
    const member = gangMembers[memberKey];
    const bonus = GANG_MEMBER_BONUSES[memberKey];

    if (member.isAlive) {
      breakdown[memberKey] = member.level * bonus.bonusPerLevel * member.bonusMultiplier;
    }
  });

  return breakdown;
}

// ============================================================================
// BATTLE STATS
// ============================================================================

/**
 * Calcula estatísticas de batalha baseadas no poder
 */
export function calculateBattleStats(
  skills: PlayerSkills,
  powerBreakdown: PowerCalculationBreakdown,
  playerLevel: number
): BattleStats {
  const totalPower = powerBreakdown.totalPower;

  // Cálculos de estatísticas específicas
  const attackPower = powerBreakdown.details.skillsBreakdown.attack * 1.2;
  const defensePower = powerBreakdown.details.skillsBreakdown.defense * 1.1;
  const intelligencePower = powerBreakdown.details.skillsBreakdown.intelligence * 1.0;
  const agilityPower = powerBreakdown.details.skillsBreakdown.agility * 0.9;
  const respectPower = powerBreakdown.details.skillsBreakdown.respect * 0.8;
  const vigorPower = powerBreakdown.details.skillsBreakdown.vigor * 1.3;

  // Saúde baseada em vigor
  const maxHealthPoints = 100 + skills.vigor * 5 + playerLevel * 10;
  const healthPoints = maxHealthPoints;

  // Chances baseadas em skills
  const criticalChance = Math.min(skills.attack * 0.5, 50); // Máximo 50%
  const dodgeChance = Math.min(skills.agility * 0.4, 40); // Máximo 40%
  const damageReduction = Math.min(skills.defense * 0.3, 60); // Máximo 60%

  return {
    totalPower,
    attackPower: Math.round(attackPower),
    defensePower: Math.round(defensePower),
    intelligencePower: Math.round(intelligencePower),
    agilityPower: Math.round(agilityPower),
    respectPower: Math.round(respectPower),
    vigorPower: Math.round(vigorPower),
    healthPoints: Math.round(healthPoints),
    maxHealthPoints: Math.round(maxHealthPoints),
    criticalChance: Math.round(criticalChance * 100) / 100,
    dodgeChance: Math.round(dodgeChance * 100) / 100,
    damageReduction: Math.round(damageReduction * 100) / 100,
    timestamp: Date.now(),
  };
}

/**
 * Cria um snapshot completo de batalha
 */
export function createBattleSnapshot(
  playerId: string,
  playerName: string,
  playerLevel: number,
  skills: PlayerSkills,
  investments: PlayerInvestments,
  gangMembers: GangMembers,
  factionId: string | null,
  factionLevel: number = 0
): BattleSnapshot {
  const powerBreakdown = calculateTotalPower(
    skills,
    investments,
    gangMembers,
    factionLevel,
    playerLevel
  );

  const battleStats = calculateBattleStats(skills, powerBreakdown, playerLevel);

  return {
    playerId,
    playerName,
    playerLevel,
    skills,
    investments,
    gangMembers,
    battleStats,
    factionId,
    factionBonus: factionLevel * FACTION_BONUS_BASE,
    timestamp: Date.now(),
  };
}

// ============================================================================
// APLICAÇÃO DE BÔNUS
// ============================================================================

/**
 * Aplica bônus de skill a um valor base
 */
export function applySkillBonus(
  baseValue: number,
  skillLevel: number,
  skillType: keyof PlayerSkills
): number {
  const bonus = SKILL_BONUSES[skillType];
  const bonusValue = bonus.baseBonus + skillLevel * bonus.percentBonus;
  return baseValue + bonusValue;
}

/**
 * Aplica bônus de investimento a um valor base
 */
export function applyInvestmentBonus(
  baseValue: number,
  investmentLevel: number,
  investmentType: keyof PlayerInvestments
): number {
  const bonus = INVESTMENT_BONUSES[investmentType];
  const bonusValue = bonus.baseBonus + investmentLevel * bonus.percentBonus;
  return baseValue + bonusValue;
}

/**
 * Aplica bônus de membro da quadrilha a um valor base
 */
export function applyGangMemberBonus(
  baseValue: number,
  memberLevel: number,
  memberRole: string,
  isAlive: boolean
): number {
  if (!isAlive) return baseValue;

  const bonus = GANG_MEMBER_BONUSES[memberRole];
  const bonusValue = memberLevel * bonus.bonusPerLevel;
  return baseValue + bonusValue;
}

/**
 * Aplica bônus de facção a um valor base
 */
export function applyFactionBonus(baseValue: number, factionLevel: number): number {
  const bonusPercentage = factionLevel * FACTION_BONUS_BASE;
  return baseValue * (1 + bonusPercentage);
}

// ============================================================================
// VALIDAÇÕES E UTILITÁRIOS
// ============================================================================

/**
 * Valida se as skills estão dentro dos limites
 */
export function validateSkills(skills: PlayerSkills, maxLevel: number = 100): boolean {
  return Object.values(skills).every((value) => value >= 0 && value <= maxLevel);
}

/**
 * Valida se os investimentos estão dentro dos limites
 */
export function validateInvestments(
  investments: PlayerInvestments,
  maxLevel: number = 100
): boolean {
  return Object.values(investments).every((value) => value >= 0 && value <= maxLevel);
}

/**
 * Retorna configurações de bônus para referência
 */
export function getBonusConfigurations() {
  return {
    skillBonuses: SKILL_BONUSES,
    investmentBonuses: INVESTMENT_BONUSES,
    gangMemberBonuses: GANG_MEMBER_BONUSES,
    multipliers: {
      skillPower: SKILL_POWER_MULTIPLIER,
      investmentPower: INVESTMENT_POWER_MULTIPLIER,
      gangMemberPower: GANG_MEMBER_POWER_MULTIPLIER,
      factionBonusBase: FACTION_BONUS_BASE,
    },
  };
}
