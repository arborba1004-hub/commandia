// stores/gangBattleStore.ts
import { create } from 'zustand';

export type FormationType = 'offensive' | 'defensive' | 'stealth';

interface GangBattleStore {
  formation: FormationType;
  setFormation: (formation: FormationType) => void;
  // Bônus calculados dinamicamente
  getFormationBonus: (formation: FormationType) => { attackPercent: number; defensePercent: number; lootPercent: number; };
}

export const useGangBattleStore = create<GangBattleStore>((set, get) => ({
  formation: 'offensive',
  setFormation: (formation) => set({ formation }),
  getFormationBonus: (formation) => {
    switch (formation) {
      case 'offensive': return { attackPercent: 20, defensePercent: -10, lootPercent: 0 };
      case 'defensive': return { attackPercent: -10, defensePercent: 25, lootPercent: 0 };
      case 'stealth': return { attackPercent: 0, defensePercent: 0, lootPercent: 30 };
      default: return { attackPercent: 0, defensePercent: 0, lootPercent: 0 };
    }
  },
}));