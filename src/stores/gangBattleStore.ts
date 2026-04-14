import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GangBattleCompositionStats } from '@/types/gangWar';

export type FormationType =
  | 'pressao_total'
  | 'linha_fechada'
  | 'bote_certo'
  | 'cerco'
  | 'saque_rapido';

export interface FormationBonus {
  rajadaPercent: number;
  blindagemPercent: number;
  folegoPercent: number;
  quebraPercent: number;
  lootPercent: number;
  casualtyReductionPercent: number;
  medicalEfficiencyPercent: number;
  mobilityPercent: number;
}

const FORMATION_BONUSES: Record<FormationType, FormationBonus> = {
  pressao_total: {
    rajadaPercent: 18,
    blindagemPercent: -8,
    folegoPercent: -4,
    quebraPercent: 14,
    lootPercent: 0,
    casualtyReductionPercent: -6,
    medicalEfficiencyPercent: 0,
    mobilityPercent: 6,
  },
  linha_fechada: {
    rajadaPercent: -6,
    blindagemPercent: 20,
    folegoPercent: 10,
    quebraPercent: -4,
    lootPercent: 0,
    casualtyReductionPercent: 12,
    medicalEfficiencyPercent: 10,
    mobilityPercent: -4,
  },
  bote_certo: {
    rajadaPercent: 10,
    blindagemPercent: 0,
    folegoPercent: 0,
    quebraPercent: 10,
    lootPercent: 8,
    casualtyReductionPercent: 0,
    medicalEfficiencyPercent: 0,
    mobilityPercent: 8,
  },
  cerco: {
    rajadaPercent: 6,
    blindagemPercent: 8,
    folegoPercent: 6,
    quebraPercent: 6,
    lootPercent: 0,
    casualtyReductionPercent: 6,
    medicalEfficiencyPercent: 6,
    mobilityPercent: 0,
  },
  saque_rapido: {
    rajadaPercent: 0,
    blindagemPercent: -6,
    folegoPercent: -2,
    quebraPercent: 4,
    lootPercent: 22,
    casualtyReductionPercent: -4,
    medicalEfficiencyPercent: 0,
    mobilityPercent: 10,
  },
};

function applyPercent(value: number, percent: number) {
  return Number((value * (1 + percent / 100)).toFixed(2));
}

export function applyFormationToGangStats(
  stats: GangBattleCompositionStats,
  bonus: FormationBonus
): GangBattleCompositionStats {
  const next: GangBattleCompositionStats = {
    ...stats,
    rajada: applyPercent(stats.rajada, bonus.rajadaPercent),
    blindagem: applyPercent(stats.blindagem, bonus.blindagemPercent),
    folego: applyPercent(stats.folego, bonus.folegoPercent),
    quebra: applyPercent(stats.quebra, bonus.quebraPercent),
    lootPower: applyPercent(stats.lootPower, bonus.lootPercent),
    mobilityPower: applyPercent(stats.mobilityPower, bonus.mobilityPercent),
    medicalPower: applyPercent(stats.medicalPower, bonus.medicalEfficiencyPercent),
    totalPower: stats.totalPower,
  };

  next.totalPower = Number(
    (
      next.rajada * 1.15 +
      next.blindagem * 1.05 +
      next.folego * 0.95 +
      next.quebra * 1.2 +
      next.intelPower * 0.35 +
      next.mobilityPower * 0.3 +
      next.weaponPower * 0.4 +
      next.coordinationPower * 0.25
    ).toFixed(2)
  );

  return next;
}

interface GangBattleStore {
  formation: FormationType;
  casualtyReductionPercent: number;

  setFormation: (formation: FormationType) => void;
  getFormationBonus: (formation?: FormationType) => FormationBonus;
  applyFormationStats: (stats: GangBattleCompositionStats) => GangBattleCompositionStats;
  resetFormation: () => void;
}

export const useGangBattleStore = create<GangBattleStore>()(
  persist(
    (set, get) => ({
      formation: 'pressao_total',
      casualtyReductionPercent: FORMATION_BONUSES.pressao_total.casualtyReductionPercent,

      setFormation: (formation) => {
        set({
          formation,
          casualtyReductionPercent:
            FORMATION_BONUSES[formation].casualtyReductionPercent,
        });
      },

      getFormationBonus: (formation) => {
        const currentFormation = formation || get().formation;
        return FORMATION_BONUSES[currentFormation] || FORMATION_BONUSES.pressao_total;
      },

      applyFormationStats: (stats) => {
        const bonus = get().getFormationBonus();
        return applyFormationToGangStats(stats, bonus);
      },

      resetFormation: () => {
        set({
          formation: 'pressao_total',
          casualtyReductionPercent:
            FORMATION_BONUSES.pressao_total.casualtyReductionPercent,
        });
      },
    }),
    {
      name: 'gang-battle-store',
    }
  )
);