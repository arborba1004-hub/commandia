import { create } from 'zustand';

export interface PlayerTalent {
  talentId: string;
  skillName: string;
  currentLevel: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

export interface TalentStoreState {
  playerTalents: Record<string, PlayerTalent>;
  setPlayerTalents: (talents: Record<string, PlayerTalent>) => void;
  unlockTalent: (talentId: string, skillName: string) => void;
  upgradeTalent: (talentId: string) => void;
  getTalentLevel: (talentId: string) => number;
  isTalentUnlocked: (talentId: string) => boolean;
}

export const useTalentStore = create<TalentStoreState>((set, get) => ({
  playerTalents: {},

  setPlayerTalents: (talents) => set({ playerTalents: talents }),

  unlockTalent: (talentId, skillName) =>
    set((state) => ({
      playerTalents: {
        ...state.playerTalents,
        [talentId]: {
          talentId,
          skillName,
          currentLevel: 1,
          isUnlocked: true,
          unlockedAt: new Date(),
        },
      },
    })),

  upgradeTalent: (talentId) =>
    set((state) => {
      const talent = state.playerTalents[talentId];
      if (!talent) return state;

      return {
        playerTalents: {
          ...state.playerTalents,
          [talentId]: {
            ...talent,
            currentLevel: Math.min(talent.currentLevel + 1, 5),
          },
        },
      };
    }),

  getTalentLevel: (talentId) => {
    const state = get();
    return state.playerTalents[talentId]?.currentLevel ?? 0;
  },

  isTalentUnlocked: (talentId) => {
    const state = get();
    return state.playerTalents[talentId]?.isUnlocked ?? false;
  },
}));
