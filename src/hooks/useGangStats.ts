/**
 * COMMANDIA — useGangStats.ts
 * Hook para calcular e agregar stats da gangue
 */

import { useMemo } from 'react';

interface Member {
  id: string;
  type: string;
  level: number;
  status: 'ativo' | 'ferido' | 'morto' | 'treinando';
  rajada: number;
  blindagem: number;
  folego: number;
  quebra: number;
}

interface GangStats {
  totalMembers: number;
  activeMembersCount: number;
  woundedCount: number;
  deadCount: number;
  trainingCount: number;
  totalRajada: number;
  totalBlindagem: number;
  totalFolego: number;
  totalQuebra: number;
  averageLevel: number;
  gangPower: number;
  byType: Record<string, { count: number; active: number; power: number }>;
}

const GANG_POWER_MULTIPLIERS = {
  rajada: 1.15,
  blindagem: 1.05,
  folego: 0.95,
  quebra: 1.2,
};

export const useGangStats = (members: Member[]): GangStats => {
  return useMemo(() => {
    const stats: GangStats = {
      totalMembers: members.length,
      activeMembersCount: 0,
      woundedCount: 0,
      deadCount: 0,
      trainingCount: 0,
      totalRajada: 0,
      totalBlindagem: 0,
      totalFolego: 0,
      totalQuebra: 0,
      averageLevel: 0,
      gangPower: 0,
      byType: {},
    };

    let totalLevel = 0;

    members.forEach(member => {
      // Count by status
      if (member.status === 'ativo') {
        stats.activeMembersCount++;
      } else if (member.status === 'ferido') {
        stats.woundedCount++;
      } else if (member.status === 'morto') {
        stats.deadCount++;
      } else if (member.status === 'treinando') {
        stats.trainingCount++;
      }

      // Aggregate stats only for active members
      if (member.status === 'ativo') {
        stats.totalRajada += member.rajada;
        stats.totalBlindagem += member.blindagem;
        stats.totalFolego += member.folego;
        stats.totalQuebra += member.quebra;
      }

      // Track by type
      if (!stats.byType[member.type]) {
        stats.byType[member.type] = { count: 0, active: 0, power: 0 };
      }
      stats.byType[member.type].count++;
      if (member.status === 'ativo') {
        stats.byType[member.type].active++;
      }

      // Calculate level average
      totalLevel += member.level;
    });

    // Average level
    stats.averageLevel = members.length > 0 ? Math.round(totalLevel / members.length) : 0;

    // Calculate gang power
    stats.gangPower = Math.floor(
      stats.totalRajada * GANG_POWER_MULTIPLIERS.rajada +
      stats.totalBlindagem * GANG_POWER_MULTIPLIERS.blindagem +
      stats.totalFolego * GANG_POWER_MULTIPLIERS.folego +
      stats.totalQuebra * GANG_POWER_MULTIPLIERS.quebra
    );

    // Calculate power by type
    Object.entries(stats.byType).forEach(([type, data]) => {
      const typeMembers = members.filter(m => m.type === type && m.status === 'ativo');
      if (typeMembers.length > 0) {
        const typeRajada = typeMembers.reduce((sum, m) => sum + m.rajada, 0);
        const typeBlindagem = typeMembers.reduce((sum, m) => sum + m.blindagem, 0);
        const typeFolego = typeMembers.reduce((sum, m) => sum + m.folego, 0);
        const typeQuebra = typeMembers.reduce((sum, m) => sum + m.quebra, 0);

        data.power = Math.floor(
          typeRajada * GANG_POWER_MULTIPLIERS.rajada +
          typeBlindagem * GANG_POWER_MULTIPLIERS.blindagem +
          typeFolego * GANG_POWER_MULTIPLIERS.folego +
          typeQuebra * GANG_POWER_MULTIPLIERS.quebra
        );
      }
    });

    return stats;
  }, [members]);
};

export default useGangStats;
