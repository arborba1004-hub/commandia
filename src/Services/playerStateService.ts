import {
  BattleSnapshot,
  PlayerBattleContext,
  PlayerInvestments,
  PlayerSkills,
  GangMembers,
} from '@/types/powerSystem';
import { createInitialGangMembers } from '@/Services/gangService';
import { createBattleSnapshot, calculateTotalPower, calculateBattleStats } from '@/Services/powerCalculationService';
import { getGangComputedBonuses } from '@/Services/gangService';
import {
  calculateLevelFromExperience,
  getAvailableInvestmentPoints,
  getAvailableSkillPoints,
} from '@/Services/progressionService';

export interface PowerSystemPlayerState {
  playerId: string;
  playerName: string;

  barracoLevel: number;
  arsenalLevel: number;
  hierarchyLevel: number;
  luxuryLevel: number;

  experience: number;
  playerLevel: number;

  dirtyMoney: number;
  cleanMoney: number;
  corre: number;

  skills: PlayerSkills;
  investments: PlayerInvestments;
  gangMembers: GangMembers;

  power: number;
  lastBattleSnapshot: BattleSnapshot | null;
}

export function createPowerSystemPlayerState(
  playerId: string,
  playerName: string
): PowerSystemPlayerState {
  const base: PowerSystemPlayerState = {
    playerId,
    playerName,

    barracoLevel: 1,
    arsenalLevel: 1,
    hierarchyLevel: 1,
    luxuryLevel: 1,

    experience: 0,
    playerLevel: 1,

    dirtyMoney: 0,
    cleanMoney: 0,
    corre: 0,

    skills: {
      attack: 0,
      defense: 0,
      intelligence: 0,
      agility: 0,
      respect: 0,
      vigor: 0,
    },

    investments: {
      war: 0,
      laundering: 0,
      fuga: 0,
      luxury: 0,
      comando: 0,
    },

    gangMembers: createInitialGangMembers(),
    power: 0,
    lastBattleSnapshot: null,
  };

  return recalculatePowerSystemState(base);
}

export function buildBattleContext(
  state: PowerSystemPlayerState
): PlayerBattleContext {
  return {
    playerId: state.playerId,
    playerName: state.playerName,
    barracoLevel: state.barracoLevel,
    arsenalLevel: state.arsenalLevel,
    hierarchyLevel: state.hierarchyLevel,
    luxuryLevel: state.luxuryLevel,
    dirtyMoney: state.dirtyMoney,
    cleanMoney: state.cleanMoney,
    corre: state.corre,
    skills: state.skills,
    investments: state.investments,
    gangMembers: state.gangMembers,
  };
}

export function recalculatePowerSystemState(
  state: PowerSystemPlayerState
): PowerSystemPlayerState {
  const context = buildBattleContext(state);
  const powerBreakdown = calculateTotalPower(context);

  return {
    ...state,
    power: powerBreakdown.totalPower,
    playerLevel: calculateLevelFromExperience(state.experience),
  };
}

export function createPlayerSnapshot(
  state: PowerSystemPlayerState
): BattleSnapshot {
  return createBattleSnapshot(buildBattleContext(state));
}

export function updateAndSnapshot(
  state: PowerSystemPlayerState
): PowerSystemPlayerState {
  const recalculated = recalculatePowerSystemState(state);
  return {
    ...recalculated,
    lastBattleSnapshot: createPlayerSnapshot(recalculated),
  };
}

export function getAvailablePoints(
  state: PowerSystemPlayerState
) {
  return {
    skillPoints: getAvailableSkillPoints(state.playerLevel, state.skills),
    investmentPoints: getAvailableInvestmentPoints(state.playerLevel, state.investments),
  };
}
