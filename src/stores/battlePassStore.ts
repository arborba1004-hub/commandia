import { create } from 'zustand';

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
  reset: () => void;
}

export const useBattlePassStore = create<BattlePassStoreState>((set) => ({
  level: 1,
  experience: 0,
  maxExperience: 1000,
  rewards: [],
  isPremium: false,
  addExperience: (amount) =>
    set((state) => {
      let newExp = state.experience + amount;
      let newLevel = state.level;
      let newMaxExp = state.maxExperience;

      while (newExp >= newMaxExp) {
        newExp -= newMaxExp;
        newLevel += 1;
        newMaxExp = Math.floor(newMaxExp * 1.1);
      }

      return {
        experience: newExp,
        level: newLevel,
        maxExperience: newMaxExp,
      };
    }),
  levelUp: () =>
    set((state) => ({
      level: state.level + 1,
      experience: 0,
      maxExperience: Math.floor(state.maxExperience * 1.1),
    })),
  setPremium: (premium) =>
    set({
      isPremium: premium,
    }),
  unlockReward: (rewardId) =>
    set((state) => ({
      rewards: [...state.rewards, rewardId],
    })),
  reset: () =>
    set({
      level: 1,
      experience: 0,
      maxExperience: 1000,
      rewards: [],
      isPremium: false,
    }),
}));
