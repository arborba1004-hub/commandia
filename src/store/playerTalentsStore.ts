import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UnlockedTalent {
  talentId: string;
  skillName: string;
  currentLevel: number;
  unlockedAt: Date;
  lastUsedAbility?: Date; // For cooldown tracking
}

export interface PlayerTalentsState {
  unlockedTalents: Record<string, UnlockedTalent>;
  totalTalentsUnlocked: number;
  setUnlockedTalents: (talents: Record<string, UnlockedTalent>) => void;
  addUnlockedTalent: (talent: UnlockedTalent) => void;
  upgradeTalent: (talentId: string) => void;
  getTalentLevel: (talentId: string) => number;
  isTalentUnlocked: (talentId: string) => boolean;
  updateAbilityUsage: (talentId: string) => void;
  canUseAbility: (talentId: string, cooldownHours: number) => boolean;
  clearAllTalents: () => void;
}

export const usePlayerTalentsStore = create<PlayerTalentsState>()(
  persist(
    (set, get) => ({
      unlockedTalents: {},
      totalTalentsUnlocked: 0,

      setUnlockedTalents: (talents) =>
        set({
          unlockedTalents: talents,
          totalTalentsUnlocked: Object.keys(talents).length,
        }),

      addUnlockedTalent: (talent) =>
        set((state) => {
          const newTalents = {
            ...state.unlockedTalents,
            [talent.talentId]: talent,
          };
          return {
            unlockedTalents: newTalents,
            totalTalentsUnlocked: Object.keys(newTalents).length,
          };
        }),

      upgradeTalent: (talentId) =>
        set((state) => {
          const talent = state.unlockedTalents[talentId];
          if (!talent) return state;

          return {
            unlockedTalents: {
              ...state.unlockedTalents,
              [talentId]: {
                ...talent,
                currentLevel: Math.min(talent.currentLevel + 1, 5),
              },
            },
          };
        }),

      getTalentLevel: (talentId) => {
        const state = get();
        return state.unlockedTalents[talentId]?.currentLevel ?? 0;
      },

      isTalentUnlocked: (talentId) => {
        const state = get();
        return !!state.unlockedTalents[talentId];
      },

      updateAbilityUsage: (talentId) =>
        set((state) => {
          const talent = state.unlockedTalents[talentId];
          if (!talent) return state;

          return {
            unlockedTalents: {
              ...state.unlockedTalents,
              [talentId]: {
                ...talent,
                lastUsedAbility: new Date(),
              },
            },
          };
        }),

      canUseAbility: (talentId, cooldownHours) => {
        const state = get();
        const talent = state.unlockedTalents[talentId];
        if (!talent || !talent.lastUsedAbility) return true;

        const lastUsed = new Date(talent.lastUsedAbility);
        const now = new Date();
        const hoursPassed = (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60);

        return hoursPassed >= cooldownHours;
      },

      clearAllTalents: () =>
        set({
          unlockedTalents: {},
          totalTalentsUnlocked: 0,
        }),
    }),
    {
      name: 'player-talents-storage',
      version: 1,
    }
  )
);
