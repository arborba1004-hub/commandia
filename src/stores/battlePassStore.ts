import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const INITIAL_MAX_EXPERIENCE = 1000;
const MAX_LEVEL = 100;

interface BattlePassStoreState {
  level: number;
  experience: number;
  maxExperience: number;
  rewards: string[];
  isPremium: boolean;

  addExperience: (amount: number) => void;
  levelUp: () => void;
  setPremium: (premium: boolean) => void;
  unlockReward: (rewardId: string) => void;
  hasReward: (rewardId: string) => boolean;
  reset: () => void;
}

export const useBattlePassStore = create<BattlePassStoreState>()(
  persist(
    (set, get) => ({
      level: 1,
      experience: 0,
      maxExperience: INITIAL_MAX_EXPERIENCE,
      rewards: [],
      isPremium: false,

      addExperience: (amount) =>
        set((state) => {
          if (!Number.isFinite(amount) || amount <= 0) {
            return state;
          }

          let newExp = state.experience + amount;
          let newLevel = state.level;
          let newMaxExp = state.maxExperience;

          while (newExp >= newMaxExp && newLevel < MAX_LEVEL) {
            newExp -= newMaxExp;
            newLevel += 1;
            newMaxExp = Math.floor(newMaxExp * 1.1);
          }

          if (newLevel >= MAX_LEVEL) {
            return {
              level: MAX_LEVEL,
              experience: 0,
              maxExperience: newMaxExp,
            };
          }

          return {
            experience: newExp,
            level: newLevel,
            maxExperience: newMaxExp,
          };
        }),

      levelUp: () =>
        set((state) => {
          if (state.level >= MAX_LEVEL) {
            return state;
          }

          return {
            level: state.level + 1,
            experience: 0,
            maxExperience: Math.floor(state.maxExperience * 1.1),
          };
        }),

      setPremium: (premium) =>
        set({
          isPremium: !!premium,
        }),

      unlockReward: (rewardId) =>
        set((state) => {
          if (!rewardId || state.rewards.includes(rewardId)) {
            return state;
          }

          return {
            rewards: [...state.rewards, rewardId],
          };
        }),

      hasReward: (rewardId) => {
        return get().rewards.includes(rewardId);
      },

      reset: () =>
        set({
          level: 1,
          experience: 0,
          maxExperience: INITIAL_MAX_EXPERIENCE,
          rewards: [],
          isPremium: false,
        }),
    }),
    {
      name: 'battle-pass-store',
    }
  )
);