/**
 * Serviço de Estado do Jogador
 * Responsável por gerenciar e sincronizar o estado completo do jogador
 * Integra: Skills, Investments, Gang, Faction, Battle Stats e Progressão
 */

import {
  PlayerSkills,
  PlayerInvestments,
  GangMembers,
  BattleSnapshot,
  PowerCalculationBreakdown,
  BattleStats,
} from '@/types/powerSystem';
import {
  calculateTotalPower,
  calculateBattleStats,
  createBattleSnapshot,
} from '@/Services/powerCalculationService';
import { initializeGangMembers } from '@/Services/gangService';
import { addExperience } from '@/Services/progressionService';

// ============================================================================
// TIPOS
// ============================================================================

export interface PlayerState {
  // Identificação
  playerId: string;
  playerName: string;

  // Progressão
  level: number;
  experience: number;
  skillPoints: number;
  investmentPoints: number;

  // Atributos
  skills: PlayerSkills;
  investments: PlayerInvestments;

  // Quadrilha
  gangMembers: GangMembers;

  // Facção
  factionId: string | null;
  factionLevel: number;

  // Estatísticas
  battleStats: BattleStats | null;
  powerBreakdown: PowerCalculationBreakdown | null;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// CRIAÇÃO E INICIALIZAÇÃO
// ============================================================================

/**
 * Cria um novo estado de jogador
 */
export function createPlayerState(
  playerId: string,
  playerName: string,
  startingLevel: number = 1
): PlayerState {
  const initialSkills: PlayerSkills = {
    attack: 0,
    defense: 0,
    intelligence: 0,
    agility: 0,
    respect: 0,
    vigor: 0,
  };

  const initialInvestments: PlayerInvestments = {
    war: 0,
    laundering: 0,
    fuga: 0,
    faction: 0,
    luxury: 0,
    comando: 0,
  };

  const gangMembers = initializeGangMembers();

  // Calcular poder inicial
  const powerBreakdown = calculateTotalPower(
    initialSkills,
    initialInvestments,
    gangMembers,
    0,
    startingLevel
  );

  const battleStats = calculateBattleStats(initialSkills, powerBreakdown, startingLevel);

  const now = Date.now();

  return {
    playerId,
    playerName,
    level: startingLevel,
    experience: 0,
    skillPoints: startingLevel * 5,
    investmentPoints: startingLevel * 3,
    skills: initialSkills,
    investments: initialInvestments,
    gangMembers,
    factionId: null,
    factionLevel: 0,
    battleStats,
    powerBreakdown,
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================================
// ATUALIZAÇÃO DE ESTADO
// ============================================================================

/**
 * Atualiza um skill e recalcula poder
 */
export function updatePlayerSkill(
  playerState: PlayerState,
  skill: keyof PlayerSkills,
  value: number
): PlayerState {
  const updatedSkills = {
    ...playerState.skills,
    [skill]: Math.max(0, value),
  };

  return recalculatePlayerState(playerState, updatedSkills, playerState.investments);
}

/**
 * Atualiza um investimento e recalcula poder
 */
export function updatePlayerInvestment(
  playerState: PlayerState,
  investment: keyof PlayerInvestments,
  value: number
): PlayerState {
  const updatedInvestments = {
    ...playerState.investments,
    [investment]: Math.max(0, value),
  };

  return recalculatePlayerState(playerState, playerState.skills, updatedInvestments);
}

/**
 * Atualiza múltiplos skills
 */
export function updatePlayerSkills(
  playerState: PlayerState,
  skillUpdates: Partial<PlayerSkills>
): PlayerState {
  const updatedSkills = {
    ...playerState.skills,
    ...skillUpdates,
  };

  return recalculatePlayerState(playerState, updatedSkills, playerState.investments);
}

/**
 * Atualiza múltiplos investimentos
 */
export function updatePlayerInvestments(
  playerState: PlayerState,
  investmentUpdates: Partial<PlayerInvestments>
): PlayerState {
  const updatedInvestments = {
    ...playerState.investments,
    ...investmentUpdates,
  };

  return recalculatePlayerState(playerState, playerState.skills, updatedInvestments);
}

/**
 * Atualiza membros da quadrilha
 */
export function updatePlayerGangMembers(
  playerState: PlayerState,
  gangMembers: GangMembers
): PlayerState {
  const updated = {
    ...playerState,
    gangMembers,
  };

  return recalculatePlayerState(updated, updated.skills, updated.investments);
}

/**
 * Atualiza facção do jogador
 */
export function updatePlayerFaction(
  playerState: PlayerState,
  factionId: string | null,
  factionLevel: number = 0
): PlayerState {
  const updated = {
    ...playerState,
    factionId,
    factionLevel,
  };

  return recalculatePlayerState(updated, updated.skills, updated.investments);
}

/**
 * Adiciona experiência ao jogador
 */
export function addPlayerExperience(
  playerState: PlayerState,
  experienceGain: number
): {
  playerState: PlayerState;
  leveledUp: boolean;
  levelsGained: number;
  skillPointsGained: number;
  investmentPointsGained: number;
} {
  const result = addExperience(playerState.level, playerState.experience, experienceGain);

  const updated: PlayerState = {
    ...playerState,
    level: result.newLevel,
    experience: result.newExperience,
    skillPoints: playerState.skillPoints + result.skillPointsGained,
    investmentPoints: playerState.investmentPoints + result.investmentPointsGained,
    updatedAt: Date.now(),
  };

  // Recalcular poder com novo nível
  const recalculated = recalculatePlayerState(updated, updated.skills, updated.investments);

  return {
    playerState: recalculated,
    leveledUp: result.leveledUp,
    levelsGained: result.levelsGained,
    skillPointsGained: result.skillPointsGained,
    investmentPointsGained: result.investmentPointsGained,
  };
}

/**
 * Gasta pontos de skill
 */
export function spendSkillPoints(
  playerState: PlayerState,
  skill: keyof PlayerSkills,
  amount: number
): PlayerState | null {
  if (playerState.skillPoints < amount) {
    console.warn('Pontos de skill insuficientes');
    return null;
  }

  const updatedSkills = {
    ...playerState.skills,
    [skill]: playerState.skills[skill] + amount,
  };

  const updated: PlayerState = {
    ...playerState,
    skillPoints: playerState.skillPoints - amount,
    skills: updatedSkills,
    updatedAt: Date.now(),
  };

  return recalculatePlayerState(updated, updated.skills, updated.investments);
}

/**
 * Gasta pontos de investimento
 */
export function spendInvestmentPoints(
  playerState: PlayerState,
  investment: keyof PlayerInvestments,
  amount: number
): PlayerState | null {
  if (playerState.investmentPoints < amount) {
    console.warn('Pontos de investimento insuficientes');
    return null;
  }

  const updatedInvestments = {
    ...playerState.investments,
    [investment]: playerState.investments[investment] + amount,
  };

  const updated: PlayerState = {
    ...playerState,
    investmentPoints: playerState.investmentPoints - amount,
    investments: updatedInvestments,
    updatedAt: Date.now(),
  };

  return recalculatePlayerState(updated, updated.skills, updated.investments);
}

// ============================================================================
// RECÁLCULOS
// ============================================================================

/**
 * Recalcula poder e battle stats do jogador
 */
function recalculatePlayerState(
  playerState: PlayerState,
  skills: PlayerSkills,
  investments: PlayerInvestments
): PlayerState {
  const powerBreakdown = calculateTotalPower(
    skills,
    investments,
    playerState.gangMembers,
    playerState.factionLevel,
    playerState.level
  );

  const battleStats = calculateBattleStats(skills, powerBreakdown, playerState.level);

  return {
    ...playerState,
    skills,
    investments,
    powerBreakdown,
    battleStats,
    updatedAt: Date.now(),
  };
}

// ============================================================================
// SNAPSHOTS
// ============================================================================

/**
 * Cria um snapshot de batalha do jogador
 */
export function createPlayerBattleSnapshot(playerState: PlayerState): BattleSnapshot {
  return createBattleSnapshot(
    playerState.playerId,
    playerState.playerName,
    playerState.level,
    playerState.skills,
    playerState.investments,
    playerState.gangMembers,
    playerState.factionId,
    playerState.factionLevel
  );
}

// ============================================================================
// INFORMAÇÕES E ESTATÍSTICAS
// ============================================================================

/**
 * Retorna informações resumidas do jogador
 */
export function getPlayerSummary(playerState: PlayerState) {
  return {
    playerId: playerState.playerId,
    playerName: playerState.playerName,
    level: playerState.level,
    experience: playerState.experience,
    totalPower: playerState.powerBreakdown?.totalPower ?? 0,
    health: playerState.battleStats?.healthPoints ?? 0,
    maxHealth: playerState.battleStats?.maxHealthPoints ?? 0,
    skillPoints: playerState.skillPoints,
    investmentPoints: playerState.investmentPoints,
    factionId: playerState.factionId,
    createdAt: playerState.createdAt,
    updatedAt: playerState.updatedAt,
  };
}

/**
 * Retorna informações detalhadas do jogador
 */
export function getPlayerDetails(playerState: PlayerState) {
  return {
    summary: getPlayerSummary(playerState),
    skills: playerState.skills,
    investments: playerState.investments,
    gangMembers: playerState.gangMembers,
    battleStats: playerState.battleStats,
    powerBreakdown: playerState.powerBreakdown,
    factionLevel: playerState.factionLevel,
  };
}

/**
 * Retorna comparação de poder
 */
export function comparePower(playerState1: PlayerState, playerState2: PlayerState) {
  const power1 = playerState1.powerBreakdown?.totalPower ?? 0;
  const power2 = playerState2.powerBreakdown?.totalPower ?? 0;
  const difference = power1 - power2;
  const percentage = power2 > 0 ? (difference / power2) * 100 : 0;

  return {
    player1Power: power1,
    player2Power: power2,
    difference,
    percentage: Math.round(percentage * 100) / 100,
    player1Stronger: power1 > power2,
  };
}

// ============================================================================
// VALIDAÇÕES
// ============================================================================

/**
 * Valida integridade do estado do jogador
 */
export function validatePlayerState(playerState: PlayerState): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!playerState.playerId) {
    errors.push('Player ID não definido');
  }

  if (playerState.level < 1) {
    errors.push('Nível inválido');
  }

  if (playerState.experience < 0) {
    errors.push('Experiência negativa');
  }

  if (playerState.skillPoints < 0) {
    errors.push('Pontos de skill negativos');
  }

  if (playerState.investmentPoints < 0) {
    errors.push('Pontos de investimento negativos');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// RESET E LIMPEZA
// ============================================================================

/**
 * Reseta o estado do jogador para valores iniciais
 */
export function resetPlayerState(playerState: PlayerState): PlayerState {
  return createPlayerState(playerState.playerId, playerState.playerName, 1);
}

/**
 * Reseta apenas skills e investimentos
 */
export function resetPlayerAttributes(playerState: PlayerState): PlayerState {
  const initialSkills: PlayerSkills = {
    attack: 0,
    defense: 0,
    intelligence: 0,
    agility: 0,
    respect: 0,
    vigor: 0,
  };

  const initialInvestments: PlayerInvestments = {
    war: 0,
    laundering: 0,
    fuga: 0,
    faction: 0,
    luxury: 0,
    comando: 0,
  };

  return recalculatePlayerState(playerState, initialSkills, initialInvestments);
}
