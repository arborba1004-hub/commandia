import { create } from 'zustand';
import { usePlayerStore } from '@/store/playerStore';
import type {
  GangBattleCasualtyResult,
  GangBattleCompositionStats,
  GangMemberType,
  GangStateSnapshot,
} from '@/types/gangWar';
import {
  applyGangBattleLosses,
  completeGangTrainings,
  fetchMyGang,
  payGangMaintenance,
  recruitGangMember,
  startGangTraining,
  upgradeGangCT,
} from '@/api/gangWarApi';
import {
  buildGangBattleCompositionStats,
  resolveGangCasualties,
} from '@/services/gangWarCalculationService';

type GangStore = {
  gang: GangStateSnapshot | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  loadGang: () => Promise<boolean>;
  recruitMember: (type: GangMemberType) => Promise<boolean>;
  startTrainingMember: (memberId: string) => Promise<boolean>;
  completeFinishedTrainings: () => Promise<boolean>;
  upgradeCT: () => Promise<boolean>;
  payMaintenance: () => Promise<boolean>;

  getBattleStats: () => GangBattleCompositionStats;
  resolveBattleLossesLocally: (params: {
    enemyStats: GangBattleCompositionStats;
    side: 'attacker' | 'defender';
  }) => GangBattleCasualtyResult;

  applyBattleLossesToBackend: (losses: GangBattleCasualtyResult) => Promise<boolean>;
  clearGang: () => void;
};

function emptyBattleStats(): GangBattleCompositionStats {
  return {
    totalMembers: 0,
    ativos: 0,
    feridos: 0,
    mortos: 0,
    rajada: 0,
    blindagem: 0,
    folego: 0,
    quebra: 0,
    medicalPower: 0,
    economyPower: 0,
    lootPower: 0,
    intelPower: 0,
    mobilityPower: 0,
    weaponPower: 0,
    coordinationPower: 0,
    negotiationPower: 0,
    totalPower: 0,
  };
}

function emptyLosses(): GangBattleCasualtyResult {
  return {
    mortos: {
      capanga: 0,
      frente: 0,
      executor: 0,
      assassino: 0,
      muralha: 0,
      certeiro: 0,
      motorista: 0,
      nitro: 0,
      armeiro: 0,
      informante: 0,
      wifi: 0,
      medico: 0,
      lavador: 0,
      ladrao: 0,
      negociador: 0,
    },
    feridos: {
      capanga: 0,
      frente: 0,
      executor: 0,
      assassino: 0,
      muralha: 0,
      certeiro: 0,
      motorista: 0,
      nitro: 0,
      armeiro: 0,
      informante: 0,
      wifi: 0,
      medico: 0,
      lavador: 0,
      ladrao: 0,
      negociador: 0,
    },
    preservadosPeloMedico: 0,
  };
}

function syncBalancesToPlayerStore(playerBalances?: {
  dirtyMoney: number;
  cleanMoney: number;
  corre: number;
}) {
  if (!playerBalances) return;

  usePlayerStore.getState().applyPlayerUpdate((player) => ({
    ...player,
    balances: {
      ...player.balances,
      dirtyMoney: Number(playerBalances.dirtyMoney || 0),
      cleanMoney: Number(playerBalances.cleanMoney || 0),
      corre: Number(playerBalances.corre || 0),
    },
  }));
}

export const useGangStore = create<GangStore>((set, get) => ({
  gang: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadGang: async () => {
    try {
      set({ isLoading: true, error: null });

      const data = await fetchMyGang();

      syncBalancesToPlayerStore(data.playerBalances);

      set({
        gang: data.gang,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar gangue',
      });
      return false;
    }
  },

  recruitMember: async (type) => {
    try {
      set({ isSubmitting: true, error: null });

      const data = await recruitGangMember(type);

      syncBalancesToPlayerStore(data.playerBalances);

      set({
        gang: data.gang,
        isSubmitting: false,
        error: null,
      });

      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao recrutar membro',
      });
      return false;
    }
  },

  startTrainingMember: async (memberId) => {
    try {
      set({ isSubmitting: true, error: null });

      const data = await startGangTraining(memberId);

      syncBalancesToPlayerStore(data.playerBalances);

      set({
        gang: data.gang,
        isSubmitting: false,
        error: null,
      });

      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao iniciar treino',
      });
      return false;
    }
  },

  completeFinishedTrainings: async () => {
    try {
      set({ isSubmitting: true, error: null });

      const data = await completeGangTrainings();

      syncBalancesToPlayerStore(data.playerBalances);

      set({
        gang: data.gang,
        isSubmitting: false,
        error: null,
      });

      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao concluir treinos',
      });
      return false;
    }
  },

  upgradeCT: async () => {
    try {
      set({ isSubmitting: true, error: null });

      const data = await upgradeGangCT();

      syncBalancesToPlayerStore(data.playerBalances);

      set({
        gang: data.gang,
        isSubmitting: false,
        error: null,
      });

      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao evoluir CT',
      });
      return false;
    }
  },

  payMaintenance: async () => {
    try {
      set({ isSubmitting: true, error: null });

      const data = await payGangMaintenance();

      syncBalancesToPlayerStore(data.playerBalances);

      set({
        gang: data.gang,
        isSubmitting: false,
        error: null,
      });

      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao pagar manutenção',
      });
      return false;
    }
  },

  getBattleStats: () => {
    const gang = get().gang;
    if (!gang) return emptyBattleStats();
    return buildGangBattleCompositionStats(gang.members);
  },

  resolveBattleLossesLocally: ({ enemyStats, side }) => {
    const gang = get().gang;
    if (!gang) return emptyLosses();

    return resolveGangCasualties({
      members: gang.members,
      ownStats: buildGangBattleCompositionStats(gang.members),
      enemyStats,
      ctLevel: gang.ct.level,
      side,
    });
  },

  applyBattleLossesToBackend: async (losses) => {
    try {
      set({ isSubmitting: true, error: null });

      const data = await applyGangBattleLosses({ losses });

      syncBalancesToPlayerStore(data.playerBalances);

      set({
        gang: data.gang,
        isSubmitting: false,
        error: null,
      });

      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao aplicar perdas da batalha',
      });
      return false;
    }
  },

  clearGang: () => {
    set({
      gang: null,
      isLoading: false,
      isSubmitting: false,
      error: null,
    });
  },
}));