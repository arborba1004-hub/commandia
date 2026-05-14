/**
 * COMMANDIA — useGangStats.ts
 * Hook para calcular e agregar stats da gangue
 * Refatorado para usar derivações dos helpers
 */

import { useMemo } from 'react';
import {
  calculateGangPower,
  countMembersByType,
  countTotalMembers,
  getActiveMembers,
} from '@/utils/gangHelpers';
import { GangMember, GangMemberType } from '@/types/gang';

interface GangStats {
  totalMembers: number;
  capanga: number;
  frente: number;
  executor: number;
  assassino: number;
  muralha: number;
  certeiro: number;
  motorista: number;
  nitro: number;
  totalPower: number;
}

const TROOP_TYPES: GangMemberType[] = [
  'capanga',
  'frente',
  'executor',
  'assassino',
  'muralha',
  'certeiro',
  'motorista',
  'nitro',
];

export const useGangStats = (members: GangMember[]): GangStats => {
  return useMemo(() => {
    const stats: GangStats = {
      totalMembers: countTotalMembers(members),
      capanga: countMembersByType(members, 'capanga'),
      frente: countMembersByType(members, 'frente'),
      executor: countMembersByType(members, 'executor'),
      assassino: countMembersByType(members, 'assassino'),
      muralha: countMembersByType(members, 'muralha'),
      certeiro: countMembersByType(members, 'certeiro'),
      motorista: countMembersByType(members, 'motorista'),
      nitro: countMembersByType(members, 'nitro'),
      totalPower: calculateGangPower(members),
    };

    return stats;
  }, [members]);
};

export default useGangStats;
