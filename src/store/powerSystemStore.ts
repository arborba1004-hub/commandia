/**
 * Zustand Store - Sistema de Poder
 * Gerencia estado central do jogador: skills, investments, gang, faction, battle stats
 */

import {
  calculateBattleStats,
  calculateTotalPower,
  createBattleSnapshot,
} from '@/Services/powerCalculationService';
import { initializeGangMembers } from '@/services/gangService';
import {
  BattleSnapshot,
  BattleStats,
  GangMembers,
  PlayerInvestments,
  PlayerSkills,
  PowerCalculationBreakdown,
} from '@/types/powerSystem';
import { create } from 'zustand';

// ============================================================================
// TIPOS
// ============================================================================

interface PowerSystemState {
  // Dados do jogador
  playerId: string | null;
  playerName: string;
  playerLevel: number;

  // Skills
  skills: PlayerSkills;
  skillPoints: number;

  // Investments
  investments: PlayerInvestments;
  investmentPoints: number;

  // Gang
  gangMembers: GangMembers;

  // Faction
  factionId: string | null;
  factionLevel: number;

  // Battle Stats
  battleStats: BattleStats | null;
  lastBattleSnapshot: BattleSnapshot | null;

  // Power Breakdown
  powerBreakdown: PowerCalculationBreakdown | null;

  // Ações
  initializePlayer: (
    playerId: string,
    playerName: string,
    playerLevel: number
  ) => void;
  updateSkill: (skill: keyof PlayerSkills, value: number) => void;
  addSkillPoints: (points: number) => void;
  spendSkillPoints: (skill: keyof PlayerSkills, amount: number) => void;
  updateInvestment: (investment: keyof PlayerInvestments, value: number) => void;
  addInvestmentPoints: (points: number) => void;
  spendInvestmentPoints: (investment: keyof PlayerInvestments, amount: number) => void;
  updateGangMembers: (gangMembers: GangMembers) => void;
  setFaction: (factionId: string | null, factionLevel: number) => void;
  updatePlayerLevel: (level: number) => void;
  recalculatePower: () => void;
  createSnapshot: () => BattleSnapshot | null;
  reset: () => void;
}

// ============================================================================
// ESTADO INICIAL
// ============================================================================

const INITIAL_SKILLS: PlayerSkills = {
  attack: 0,
  defense: 0,
  intelligence: 0,
  agility: 0,
  respect: 0,
  vigor: 0,
};

const INITIAL_INVESTMENTS: PlayerInvestments = {
  war: 0,
  laundering: 0,
  fuga: 0,
  faction: 0,
  luxury: 0,
  comando: 0,
};

// ============================================================================
// STORE
// ============================================================================

export const usePowerSystemStore = create<PowerSystemState>((set, get) => ({
  // Estado inicial
  playerId: null,
  playerName: '',
  playerLevel: 1,
  skills: INITIAL_SKILLS,
  skillPoints: 0,
  investments: INITIAL_INVESTMENTS,
  investmentPoints: 0,
  gangMembers: initializeGangMembers(),
  factionId: null,
  factionLevel: 0,
  battleStats: null,
  lastBattleSnapshot: null,
  powerBreakdown: null,

  // ========================================================================
  // INICIALIZAÇÃO
  // ========================================================================

  initializePlayer: (playerId: string, playerName: string, playerLevel: number) => {
    set({
      playerId,
      playerName,
      playerLevel,
      skills: INITIAL_SKILLS,
      investments: INITIAL_INVESTMENTS,
      gangMembers: initializeGangMembers(),
      skillPoints: playerLevel * 5, // Pontos iniciais baseado no nível
      investmentPoints: playerLevel * 3,
    });

    // Recalcular poder após inicialização
    get().recalculatePower();
  },

  // ========================================================================
  // SKILLS
  // ========================================================================

  updateSkill: (skill: keyof PlayerSkills, value: number) => {
    set((state) => ({
      skills: {
        ...state.skills,
        [skill]: Math.max(0, value),
      },
    }));

    get().recalculatePower();
  },

  addSkillPoints: (points: number) => {
    set((state) => ({
      skillPoints: state.skillPoints + points,
    }));
  },

  spendSkillPoints: (skill: keyof PlayerSkills, amount: number) => {
    const state = get();

    if (state.skillPoints < amount) {
      console.warn('Pontos de skill insuficientes');
      return;
    }

    set({
      skillPoints: state.skillPoints - amount,
      skills: {
        ...state.skills,
        [skill]: state.skills[skill] + amount,
      },
    });

    get().recalculatePower();
  },

  // ========================================================================
  // INVESTMENTS
  // ========================================================================

  updateInvestment: (investment: keyof PlayerInvestments, value: number) => {
    set((state) => ({
      investments: {
        ...state.investments,
        [investment]: Math.max(0, value),
      },
    }));

    get().recalculatePower();
  },

  addInvestmentPoints: (points: number) => {
    set((state) => ({
      investmentPoints: state.investmentPoints + points,
    }));
  },

  spendInvestmentPoints: (investment: keyof PlayerInvestments, amount: number) => {
    const state = get();

    if (state.investmentPoints < amount) {
      console.warn('Pontos de investimento insuficientes');
      return;
    }

    set({
      investmentPoints: state.investmentPoints - amount,
      investments: {
        ...state.investments,
        [investment]: state.investments[investment] + amount,
      },
    });

    get().recalculatePower();
  },

  // ========================================================================
  // GANG
  // ========================================================================

  updateGangMembers: (gangMembers: GangMembers) => {
    set({ gangMembers });
    get().recalculatePower();
  },

  // ========================================================================
  // FACTION
  // ========================================================================

  setFaction: (factionId: string | null, factionLevel: number) => {
    set({
      factionId,
      factionLevel,
    });

    get().recalculatePower();
  },

  // ========================================================================
  // LEVELING
  // ========================================================================

  updatePlayerLevel: (level: number) => {
    set({
      playerLevel: Math.max(1, level),
    });

    get().recalculatePower();
  },

  // ========================================================================
  // CÁLCULOS
  // ========================================================================

  recalculatePower: () => {
    const state = get();

    // Calcular poder total
    const powerBreakdown = calculateTotalPower(
      state.skills,
      state.investments,
      state.gangMembers,
      state.factionLevel,
      state.playerLevel
    );

    // Calcular battle stats
    const battleStats = calculateBattleStats(state.skills, powerBreakdown, state.playerLevel);

    set({
      powerBreakdown,
      battleStats,
    });
  },

  createSnapshot: () => {
    const state = get();

    if (!state.playerId) {
      console.warn('Player ID não definido');
      return null;
    }

    const snapshot = createBattleSnapshot(
      state.playerId,
      state.playerName,
      state.playerLevel,
      state.skills,
      state.investments,
      state.gangMembers,
      state.factionId,
      state.factionLevel
    );

    set({ lastBattleSnapshot: snapshot });

    return snapshot;
  },

  // ========================================================================
  // RESET
  // ========================================================================

  reset: () => {
    set({
      playerId: null,
      playerName: '',
      playerLevel: 1,
      skills: INITIAL_SKILLS,
      investments: INITIAL_INVESTMENTS,
      gangMembers: initializeGangMembers(),
      skillPoints: 0,
      investmentPoints: 0,
      factionId: null,
      factionLevel: 0,
      battleStats: null,
      lastBattleSnapshot: null,
      powerBreakdown: null,
    });
  },
}));

// ============================================================================
// SELETORES ÚTEIS
// ============================================================================

/**
 * Seletor para obter poder total
 */
export const selectTotalPower = (state: PowerSystemState) =>
  state.powerBreakdown?.totalPower ?? 0;

/**
 * Seletor para obter saúde atual
 */
export const selectCurrentHealth = (state: PowerSystemState) =>
  state.battleStats?.healthPoints ?? 0;

/**
 * Seletor para obter saúde máxima
 */
export const selectMaxHealth = (state: PowerSystemState) =>
  state.battleStats?.maxHealthPoints ?? 0;

/**
 * Seletor para obter informações de skills
 */
export const selectSkillsInfo = (state: PowerSystemState) => ({
  skills: state.skills,
  points: state.skillPoints,
});

/**
 * Seletor para obter informações de investimentos
 */
export const selectInvestmentsInfo = (state: PowerSystemState) => ({
  investments: state.investments,
  points: state.investmentPoints,
});

/**
 * Seletor para obter informações de gang
 */
export const selectGangInfo = (state: PowerSystemState) => ({
  members: state.gangMembers,
});

/**
 * Seletor para obter informações de facção
 */
export const selectFactionInfo = (state: PowerSystemState) => ({
  factionId: state.factionId,
  factionLevel: state.factionLevel,
});

/**
 * Seletor para obter battle stats
 */
export const selectBattleStats = (state: PowerSystemState) => state.battleStats;

/**
 * Seletor para obter power breakdown
 */
export const selectPowerBreakdown = (state: PowerSystemState) => state.powerBreakdown;
