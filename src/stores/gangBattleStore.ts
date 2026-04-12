import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FormationType = 'offensive' | 'defensive' | 'stealth';

export interface FormationBonus {
  attackPercent: number;
  defensePercent: number;
  lootPercent: number;
}

const FORMATION_BONUSES: Record<FormationType, FormationBonus> = {
  offensive: {
    attackPercent: 20,
    defensePercent: -10,
    lootPercent: 0,
  },
  defensive: {
    attackPercent: -10,
    defensePercent: 25,
    lootPercent: 0,
  },
  stealth: {
    attackPercent: 0,
    defensePercent: 0,
    lootPercent: 30,
  },
};

interface GangBattleStore {
  formation: FormationType;
  setFormation: (formation: FormationType) => void;
  getFormationBonus: (formation?: FormationType) => FormationBonus;
  resetFormation: () => void;
}

export const useGangBattleStore = create<GangBattleStore>()(
  persist(
    (set, get) => ({
      formation: 'offensive',

      setFormation: (formation) => {
        set({ formation });
      },

      getFormationBonus: (formation) => {
        const currentFormation = formation || get().formation;
        return FORMATION_BONUSES[currentFormation] || FORMATION_BONUSES.offensive;
      },

      resetFormation: () => {
        set({ formation: 'offensive' });
      },
    }),
    {
      name: 'gang-battle-store',
    }
  )
);
