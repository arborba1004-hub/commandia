import { create } from 'zustand';
import { ACHIEVEMENTS, type AchievementId } from '@/types/achievements';

interface AchievementState {
  unlockedAchievements: AchievementId[];
  newlyUnlocked: AchievementId | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  checkAndUnlockAchievements: (playerData: any) => void;
  unlockAchievement: (id: AchievementId) => void;
  clearNewlyUnlocked: () => void;
  loadAchievements: (achievements: AchievementId[]) => void;
  getUnlockedCount: () => number;
  isAchievementUnlocked: (id: AchievementId) => boolean;
  setError: (error: string | null) => void;
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  unlockedAchievements: [],
  newlyUnlocked: null,
  isLoading: false,
  error: null,

  checkAndUnlockAchievements: (playerData: any) => {
    if (!playerData || typeof playerData !== 'object') {
      return;
    }

    const { unlockedAchievements, unlockAchievement } = get();
    
    try {
      Object.entries(ACHIEVEMENTS).forEach(([id, achievement]) => {
        const achievementId = id as AchievementId;
        
        if (!unlockedAchievements.includes(achievementId)) {
          try {
            if (achievement.condition(playerData)) {
              unlockAchievement(achievementId);
            }
          } catch (error) {
            console.warn(`Erro ao verificar achievement ${achievementId}:`, error);
          }
        }
      });
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
      set({ error: 'Erro ao verificar conquistas' });
    }
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
          error: null,
        };
      }
      return state;
    });
  },

  clearNewlyUnlocked: () => {
    set({ newlyUnlocked: null });
  },

  loadAchievements: (achievements: AchievementId[]) => {
    if (!Array.isArray(achievements)) {
      set({ unlockedAchievements: [], error: 'Formato inválido de conquistas' });
      return;
    }
    set({ unlockedAchievements: achievements, isLoading: false, error: null });
  },

  getUnlockedCount: () => {
    return get().unlockedAchievements.length;
  },

  isAchievementUnlocked: (id: AchievementId) => {
    return get().unlockedAchievements.includes(id);
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
