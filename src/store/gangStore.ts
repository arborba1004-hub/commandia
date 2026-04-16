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
  setGangFormation,
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

  // Ações de Estado e API
  loadGang: () => Promise<boolean>;
  recruitMember: (type: GangMemberType) => Promise<boolean>;
  startTrainingMember: (memberId: string) => Promise<boolean>;
  completeFinishedTrainings: () => Promise<boolean>;
  upgradeCT: () => Promise<boolean>;
  payMaintenance: () => Promise<boolean>;
  updateFormation: (formation: any) => Promise<boolean>;

  // Lógica de Batalha (Frontend)
  getBattleStats: () => GangBattleCompositionStats;
  resolveBattleLossesLocally: (params: {
    enemyStats: GangBattleCompositionStats;
    side: 'attacker' | 'defender';
  }) => GangBattleCasualtyResult;

  // Sincronização
  applyBattleLossesToBackend: (losses: GangBattleCasualtyResult) => Promise<boolean>;
  clearGang: () => void;
};

// Helpers para estados vazios
function emptyBattleStats(): GangBattleCompositionStats {
  return {
    totalMembers: 0, ativos: 0, feridos: 0, mortos: 0,
    rajada: 0, blindagem: 0, folego: 0, quebra: 0,
    medicalPower: 0, economyPower: 0, lootPower: 0, intelPower: 0,
    mobilityPower: 0, weaponPower: 0, coordinationPower: 0, negotiationPower: 0,
    totalPower: 0,
  };
}

function emptyLosses(): GangBattleCasualtyResult {
  return {
    mortos: {} as any,
    feridos: {} as any,
    preservadosPeloMedico: 0,
  };
}

// Sincroniza o dinheiro e corre no topo da tela após cada ação
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
      const gangData = data?.gang || data;

      if (!gangData) throw new Error('Resposta inválida do servidor');

      syncBalancesToPlayerStore(data?.playerBalances);

      set({ gang: gangData, isLoading: false, error: null });
      return true;
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Erro ao carregar gangue' });
      return false;
    }
  },

  recruitMember: async (type) => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await recruitGangMember(type);
      
      syncBalancesToPlayerStore(data.playerBalances);
      set({ gang: data.gang, isSubmitting: false });
      return true;
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message });
      return false;
    }
  },

  startTrainingMember: async (memberId) => {
    try {
      set({ isSubmitting: true, error: null });
      // Aqui a API já deve estar usando 'memberId' no corpo da requisição
      const data = await startGangTraining(memberId);
      
      syncBalancesToPlayerStore(data.playerBalances);
      set({ gang: data.gang, isSubmitting: false });
      return true;
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message });
      return false;
    }
  },

  completeFinishedTrainings: async () => {
    try {
      set({ isSubmitting: true });
      const data = await completeGangTrainings();
      set({ gang: data.gang, isSubmitting: false });
      return true;
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message });
      return false;
    }
  },

  updateFormation: async (formation) => {
    try {
      set({ isSubmitting: true });
      const data = await setGangFormation(formation);
      set({ gang: data.gang, isSubmitting: false });
      return true;
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message });
      return false;
    }
  },

  upgradeCT: async () => {
    try {
      set({ isSubmitting: true });
      const data = await upgradeGangCT();
      syncBalancesToPlayerStore(data.playerBalances);
      set({ gang: data.gang, isSubmitting: false });
      return true;
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message });
      return false;
    }
  },

  payMaintenance: async () => {
    try {
      set({ isSubmitting: true });
      const data = await payGangMaintenance();
      syncBalancesToPlayerStore(data.playerBalances);
      set({ gang: data.gang, isSubmitting: false });
      return true;
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message });
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
    if (!gang || !gang.members) return emptyLosses();

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
      set({ isSubmitting: true });
      const data = await applyGangBattleLosses({ losses });
      syncBalancesToPlayerStore(data.playerBalances);
      set({ gang: data.gang, isSubmitting: false });
      return true;
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message });
      return false;
    }
  },

  clearGang: () => set({ gang: null, error: null }),
}));
