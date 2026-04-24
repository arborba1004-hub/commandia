/**
 * COMMANDIA — useInvestments.ts
 * Hook para gerenciar investimentos e calcular buffs
 */

import { useMemo } from 'react';

interface Investment {
  key: string;
  name: string;
  level: number;
  maxLevel: number;
  category: string;
}

interface InvestmentBuffs {
  rajadaBonus: number;
  blindagemBonus: number;
  folegoBonus: number;
  hospitalCapacity: number;
  recoverySpeed: number;
  trainingSpeed: number;
  maxMembers: number;
  bondeBonus: number;
  defenseBonus: number;
  lootBonus: number;
}

export const useInvestments = (investments: Investment[]): InvestmentBuffs => {
  return useMemo(() => {
    const buffs: InvestmentBuffs = {
      rajadaBonus: 1,
      blindagemBonus: 1,
      folegoBonus: 1,
      hospitalCapacity: 0,
      recoverySpeed: 1,
      trainingSpeed: 1,
      maxMembers: 0,
      bondeBonus: 1,
      defenseBonus: 1,
      lootBonus: 1,
    };

    investments.forEach(inv => {
      const level = inv.level;
      if (level === 0) return;

      switch (inv.key) {
        case 'arsenal_coletivo':
          buffs.rajadaBonus *= 1 + level * 0.01;
          break;

        case 'guerra_total':
          buffs.rajadaBonus *= 1 + level * 0.02;
          break;

        case 'doutrina_criminal':
          buffs.rajadaBonus *= 1 + level * 0.04;
          buffs.blindagemBonus *= 1 + level * 0.04;
          buffs.folegoBonus *= 1 + level * 0.04;
          break;

        case 'tatica_bonde':
          buffs.bondeBonus *= 1 + level * 0.08;
          break;

        case 'expansao_hospital':
          buffs.hospitalCapacity += level * 500;
          break;

        case 'recuperacao_rapida':
          buffs.recoverySpeed *= 1 + level * 0.08;
          break;

        case 'recrutamento_massa':
          buffs.trainingSpeed *= 1 + level * 0.06;
          break;

        case 'recrutamento_ampliado':
          buffs.maxMembers += level * 2;
          break;

        case 'barricada_reforcada':
          buffs.defenseBonus *= 1 + level * 0.06;
          break;

        case 'logistica_criminal':
          buffs.lootBonus *= 1 + level * 0.10;
          break;

        default:
          break;
      }
    });

    return buffs;
  }, [investments]);
};

export const calculateInvestmentLevel = (
  baseValue: number,
  investmentLevel: number,
  multiplier: number = 0.1
): number => {
  return baseValue * (1 + investmentLevel * multiplier);
};

export const calculateInvestmentCost = (level: number, baseCost: number): number => {
  return baseCost * level;
};

export default useInvestments;
