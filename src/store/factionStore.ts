import { create } from 'zustand';

interface Faction {
  id: string;
  name: string;
  tag: string;
  leaderId: string;
  memberIds: string[];
  level: number;
  exp: number;
  expToNext: number;
  treasury: {
    dirtyMoney: number;
    cleanMoney: number;
    corre: number;
  };
}

interface FactionState {
  myFaction: Faction | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  loadMyFaction: () => Promise<void>;
  createFaction: (name: string, tag: string) => Promise<boolean>;
  joinFaction: (factionId: string) => Promise<boolean>;
}

export const useFactionStore = create<FactionState>((set) => ({
  myFaction: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadMyFaction: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implement API call to load faction
      set({ isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load faction' 
      });
    }
  },

  createFaction: async (name: string, tag: string) => {
    set({ isSubmitting: true, error: null });
    try {
      // TODO: Implement API call to create faction
      set({ isSubmitting: false });
      return true;
    } catch (error) {
      set({ 
        isSubmitting: false, 
        error: error instanceof Error ? error.message : 'Failed to create faction' 
      });
      return false;
    }
  },

  joinFaction: async (factionId: string) => {
    set({ isSubmitting: true, error: null });
    try {
      // TODO: Implement API call to join faction
      set({ isSubmitting: false });
      return true;
    } catch (error) {
      set({ 
        isSubmitting: false, 
        error: error instanceof Error ? error.message : 'Failed to join faction' 
      });
      return false;
    }
  },
}));
