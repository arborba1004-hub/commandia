import { create } from 'zustand';
import { usePlayerStore } from '@/store/playerStore';
import type {
  GangBattleCasualtyResult,
  GangBattleCompositionStats,
  GangFormationType,
  GangMemberType,
  GangStateSnapshot,
} from '@/types/gangWar';
import {
  applyGangBattleLosses,
  completeGangTrainings,
  fetchMyGang,
  payGangMaintenance,
  queueGangTraining,
  recruitGangMember,
  setGangFormation,
  startGangTraining,
  upgradeGangCT,
} from '@/api/gangWarApi';

type GangStore = {
  gang: GangStateSnapshot | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  loadGang: () => Promise<boolean>;
  recruitMember: (type: GangMemberType) => Promise<boolean>;
  queueTraining: (type: GangMemberType, quantity?: number) => Promise<boolean>;
  startTrainingMember: (memberId: string) => Promise<boolean>;
  completeFinishedTrainings: () => Promise<boolean>;
  upgradeCT: () => Promise<boolean>;
  payMaintenance: () => Promise<boolean>;
  setFormation: (formation: GangFormationType) => Promise<boolean>;

  getBattleStats: () => GangBattleCompositionStats;
  getAvailableByType: () => Record<GangMemberType, number>;
  getTrainingConfig: () => { quantityPerOrder: number; durationSeconds: number; slots: number };
  getActiveMembersByType: (type: GangMemberType) => number;

  applyBattleLossesToBackend: (losses: GangBattleCasualtyResult) => Promise<boolean>;
  clearGang: () => void;
};

const EMPTY_STATS: GangBattleCompositionStats = {
  totalMembers: 0,
  ativos: 0,
  feridos: 0,
  mortos: 0,
  bondeAtivos: 0,
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
      set({ gang: data.gang, isLoading: false, error: null });
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
      set({ gang: data.gang, isSubmitting: false, error: null });
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao recrutar',
      });
      return false;
    }
  },

  queueTraining: async (type, quantity) => {
    try {
      set({ isSubmitting: true, error: null });
      const fallbackQty = get().gang?.trainingConfig.quantityPerOrder || 10;
      const data = await queueGangTraining(type, quantity || fallbackQty);
      syncBalancesToPlayerStore(data.playerBalances);
      set({ gang: data.gang, isSubmitting: false, error: null });
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao treinar tropa',
      });
      return false;
    }
  },

  startTrainingMember: async (memberId) => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await startGangTraining(memberId);
      syncBalancesToPlayerStore(data.playerBalances);
      set({ gang: data.gang, isSubmitting: false, error: null });
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao treinar membro',
      });
      return false;
    }
  },

  completeFinishedTrainings: async () => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await completeGangTrainings();
      syncBalancesToPlayerStore(data.playerBalances);
      set({ gang: data.gang, isSubmitting: false, error: null });
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
      set({ gang: data.gang, isSubmitting: false, error: null });
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
      set({ gang: data.gang, isSubmitting: false, error: null });
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao pagar manutenção',
      });
      return false;
    }
  },

  setFormation: async (formation) => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await setGangFormation(formation);
      syncBalancesToPlayerStore(data.playerBalances);
      set({ gang: data.gang, isSubmitting: false, error: null });
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao trocar formação',
      });
      return false;
    }
  },

  getBattleStats: () => {
    const gang = get().gang;
    if (!gang) return EMPTY_STATS;

    const activeByType = gang.troopSummary.activeByType;
    const totalPower =
      activeByType.capanga * 14 +
      activeByType.frente * 18 +
      activeByType.executor * 22 +
      activeByType.muralha * 16 +
      activeByType.certeiro * 18 +
      activeByType.motorista * 12 +
      activeByType.nitro * 16 +
      activeByType.armeiro * 11 +
      activeByType.informante * 10 +
      activeByType.wifi * 10 +
      activeByType.medico * 9 +
      activeByType.lavador * 9 +
      activeByType.negociador * 8;

    return {
      ...EMPTY_STATS,
      totalMembers: gang.troopSummary.totalMembers,
      ativos: gang.troopSummary.activeMembers,
      feridos: gang.troopSummary.injuredMembers,
      mortos: gang.troopSummary.deadMembers,
      bondeAtivos: activeByType.nitro + activeByType.capanga,
      totalPower,
    };
  },

  getAvailableByType: () => {
    return (
      get().gang?.troopSummary.activeByType || {
        capanga: 0,
        frente: 0,
        executor: 0,
        muralha: 0,
        certeiro: 0,
        motorista: 0,
        nitro: 0,
        armeiro: 0,
        informante: 0,
        wifi: 0,
        medico: 0,
        lavador: 0,
        negociador: 0,
      }
    );
  },

  getTrainingConfig: () => {
    return (
      get().gang?.trainingConfig || {
        quantityPerOrder: 10,
        durationSeconds: 10,
        slots: 7,
      }
    );
  },

  getActiveMembersByType: (type) => {
    return get().gang?.troopSummary.activeByType?.[type] || 0;
  },

  applyBattleLossesToBackend: async (losses) => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await applyGangBattleLosses({ losses });
      syncBalancesToPlayerStore(data.playerBalances);
      set({ gang: data.gang, isSubmitting: false, error: null });
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao aplicar perdas',
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
