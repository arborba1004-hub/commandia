/**
 * Sistema de Poder - Tipos e Interfaces
 * Define estruturas para Skills, Investments, Gang Members, Battle Stats e Faction
 */

// ============================================================================
// SKILLS - Habilidades do Jogador
// ============================================================================

export interface PlayerSkills {
  attack: number;        // Ataque - Dano base
  defense: number;       // Defesa - Redução de dano
  intelligence: number;  // Inteligência - Bônus em operações
  agility: number;       // Agilidade - Velocidade e esquiva
  respect: number;       // Respeito - Influência social
  vigor: number;         // Vigor - Resistência e saúde
}

export interface SkillBonus {
  skillName: keyof PlayerSkills;
  baseBonus: number;
  percentBonus: number;
  description: string;
}

// ============================================================================
// INVESTMENTS - Investimentos do Jogador
// ============================================================================

export interface PlayerInvestments {
  war: number;           // Investimento em Guerra - Bônus de ataque
  laundering: number;    // Lavagem de Dinheiro - Geração de renda
  fuga: number;          // Fuga - Velocidade de escape
  faction: number;       // Facção - Bônus coletivo
  luxury: number;        // Luxo - Respeito e status
  comando: number;       // Comando - Liderança da quadrilha
}

export interface InvestmentBonus {
  investmentType: keyof PlayerInvestments;
  baseBonus: number;
  percentBonus: number;
  affectedStats: (keyof PlayerSkills)[];
  description: string;
}

// ============================================================================
// GANG MEMBERS - Membros da Quadrilha
// ============================================================================

export type GangMemberRole = 'frente' | 'muralha' | 'nitro' | 'certeiro' | 'wifi';

export interface GangMember {
  role: GangMemberRole;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  bonusMultiplier: number; // Multiplicador de bônus baseado no nível
}

export interface GangMembers {
  frente: GangMember;      // Frente de batalha - Defesa
  muralha: GangMember;     // Muralha - Proteção
  nitro: GangMember;       // Nitro - Velocidade/Ataque
  certeiro: GangMember;    // Certeiro - Precisão/Inteligência
  wifi: GangMember;        // WiFi - Informações/Suporte
}

export interface GangMemberBonus {
  role: GangMemberRole;
  affectedStats: (keyof PlayerSkills)[];
  bonusPerLevel: number;
  description: string;
}

// ============================================================================
// BATTLE STATS - Estatísticas de Batalha
// ============================================================================

export interface BattleStats {
  totalPower: number;
  attackPower: number;
  defensePower: number;
  intelligencePower: number;
  agilityPower: number;
  respectPower: number;
  vigorPower: number;
  healthPoints: number;
  maxHealthPoints: number;
  criticalChance: number;
  dodgeChance: number;
  damageReduction: number;
  timestamp: number; // Quando o snapshot foi criado
}

export interface BattleSnapshot {
  playerId: string;
  playerLevel: number;
  playerName: string;
  skills: PlayerSkills;
  investments: PlayerInvestments;
  gangMembers: GangMembers;
  battleStats: BattleStats;
  factionId: string | null;
  factionBonus: number;
  timestamp: number;
}

// ============================================================================
// FACTION - Facção (Sistema Social Coletivo)
// ============================================================================

export interface Faction {
  _id: string;
  name: string;
  description: string;
  leader: string; // Player ID do líder
  members: string[]; // Array de Player IDs
  level: number;
  experience: number;
  treasury: number; // Tesouro coletivo
  bonusMultiplier: number; // Bônus coletivo
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface FactionBonus {
  level: number;
  bonusPercentage: number;
  affectedStats: (keyof PlayerSkills)[];
  description: string;
}

// ============================================================================
// POWER CALCULATION - Cálculo de Poder
// ============================================================================

export interface PowerCalculationBreakdown {
  baseSkillsPower: number;
  skillBonuses: number;
  investmentBonuses: number;
  gangMemberBonuses: number;
  factionBonus: number;
  totalPower: number;
  details: {
    skillsBreakdown: Record<keyof PlayerSkills, number>;
    investmentsBreakdown: Record<keyof PlayerInvestments, number>;
    gangMembersBreakdown: Record<GangMemberRole, number>;
  };
}

// ============================================================================
// PROGRESSION - Progressão e Leveling
// ============================================================================

export interface ProgressionConfig {
  skillPointsPerLevel: number;
  investmentPointsPerLevel: number;
  experienceMultiplier: number;
  powerScalingFactor: number;
}

export interface LevelRequirement {
  level: number;
  experienceRequired: number;
  skillPointsGained: number;
  investmentPointsGained: number;
}
