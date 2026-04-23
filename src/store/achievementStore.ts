import { create } from 'zustand';
import { ACHIEVEMENTS, type AchievementId } from '@/types/achievements';

interface AchievementState {
  unlockedAchievements: AchievementId[];
  newlyUnlocked: AchievementId | null;
  
  // Actions
  checkAndUnlockAchievements: (playerData: any) => void;
  unlockAchievement: (id: AchievementId) => void;
  clearNewlyUnlocked: () => void;
  loadAchievements: (achievements: AchievementId[]) => void;
  getUnlockedCount: () => number;
  isAchievementUnlocked: (id: AchievementId) => boolean;
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  unlockedAchievements: [],
  newlyUnlocked: null,

  checkAndUnlockAchievements: (playerData: any) => {
    const { unlockedAchievements, unlockAchievement } = get();
    
    Object.entries(ACHIEVEMENTS).forEach(([id, achievement]) => {
      const achievementId = id as AchievementId;
      
      if (!unlockedAchievements.includes(achievementId)) {
        if (achievement.condition(playerData)) {
          unlockAchievement(achievementId);
        }
      }
    });
  },

  unlockAchievement: (id: AchievementId) => {
    set((state) => {
      if (!state.unlockedAchievements.includes(id)) {
        const updated = [...state.unlockedAchievements, id];
        try {
          if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            localStorage.setItem('unlockedAchievements', JSON.stringify(updated));
          }
        } catch (error) {
          console.warn('Erro ao salvar achievements no localStorage:', error);
        }
        return {
          unlockedAchievements: updated,
          newlyUnlocked: id,
        };
      }
      return state;
    });
  },

  clearNewlyUnlocked: () => {
    set({ newlyUnlocked: null });
  },

  loadAchievements: (achievements: AchievementId[]) => {
    set({ unlockedAchievements: achievements });
  },

  getUnlockedCount: () => {
    return get().unlockedAchievements.length;
  },

  isAchievementUnlocked: (id: AchievementId) => {
    return get().unlockedAchievements.includes(id);
  },
}));
