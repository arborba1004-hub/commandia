/**
 * store/gangStore.ts
 * Store Zustand unificado da gangue.
 * Refatorado para usar os tipos canônicos de @/types/gang.
 * Integrado com gangEstatisticasStore para atualizar estatísticas ao mudar formação.
 */

import { create } from 'zustand';
import { usePlayerStore } from '@/store/playerStore';
import { useGangEstatisticasStore, getFormacaoBonusPayload } from '@/store/gangEstatisticasStore';
import type {
  GangStateSnapshot,
  GangFormationType,
  GangMemberType,
  GangBattleStats,
} from '@/types/gang';
import {
  fetchMyGang,
  recruitGangMember,
  queueGangTraining,
  completeGangTrainings,
  upgradeGangCT,
  payGangMaintenance,
  setGangFormation,
  applyGangBattleLosses,
} from '@/api/gangApi';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS DO STORE
// ═════════════════════════════════════════════════════════════════════════════

type GangStore = {
  gang: GangStateSnapshot | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // ── Carregamento ──────────────────────────────────────────────────────────
  loadGang: () => Promise<boolean>;

  // ── Mutações ──────────────────────────────────────────────────────────────
  recruitMember: (type: GangMemberType) => Promise<boolean>;
  queueTraining: (type: GangMemberType, quantity?: number) => Promise<boolean>;
  completeFinishedTrainings: () => Promise<boolean>;
  upgradeCT: () => Promise<boolean>;
  payMaintenance: () => Promise<boolean>;
  setFormation: (formation: GangFormationType) => Promise<boolean>;

  // ── Consultas derivadas ───────────────────────────────────────────────────
  getBattleStats: () => GangBattleStats;
  getAvailableByType: () => Record<GangMemberType, number>;
  getActiveMemberCount: (type: GangMemberType) => number;
  getTrainingConfig: () => { quantityPerOrder: number; durationSeconds: number; slots: number };

  // ── Utilitários ───────────────────────────────────────────────────────────
  clearGang: () => void;
};

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

const EMPTY_BATTLE_STATS: GangBattleStats = {
  totalMembers: 0, ativos: 0, feridos: 0, mortos: 0,
  rajada: 0, blindagem: 0, folego: 0, quebra: 0,
  medicalPower: 0, lootPower: 0, mobilityPower: 0,
  totalPower: 0,
};

const EMPTY_BY_TYPE: Record<GangMemberType, number> = {
  capanga: 0, frente: 0, executor: 0, assassino: 0,
  muralha: 0, certeiro: 0, motorista: 0, nitro: 0,
};

/** Sincroniza os saldos do player retornados pela API da gangue. */
function syncBalances(playerBalances?: {
  dirtyMoney: number;
  cleanMoney: number;
  corre: number;
}) {
  if (!playerBalances) return;
  usePlayerStore.getState().applyPlayerUpdate((p) => ({
    ...p,
    balances: {
      ...p.balances,
      dirtyMoney: Number(playerBalances.dirtyMoney ?? 0),
      cleanMoney: Number(playerBalances.cleanMoney ?? 0),
      corre:      Number(playerBalances.corre      ?? 0),
    },
  }));
}

/**
 * Após mudar a formação, atualiza as estatísticas de combate no gangEstatisticasStore.
 * Este é o ponto de integração entre gangStore ↔ gangEstatisticasStore.
 */
function syncFormacaoToEstatisticas(formation: GangFormationType) {
  useGangEstatisticasStore
    .getState()
    .applyBonus('formacao', getFormacaoBonusPayload(formation));
}

// ═════════════════════════════════════════════════════════════════════════════
// STORE
// ═════════════════════════════════════════════════════════════════════════════

export const useGangStore = create<GangStore>((set, get) => ({
  gang: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  // ── Carregamento ──────────────────────────────────────────────────────────

  loadGang: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await fetchMyGang();
      syncBalances(data.playerBalances);
      set({ gang: data.gang, isLoading: false });
      // Sincroniza formação atual com o sistema de estatísticas
      if (data.gang?.formation) {
        syncFormacaoToEstatisticas(data.gang.formation);
      }
      return true;
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro ao carregar gangue',
      });
      return false;
    }
  },

  // ── Mutações ──────────────────────────────────────────────────────────────

  recruitMember: async (type) => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await recruitGangMember(type);
      syncBalances(data.playerBalances);
      set({ gang: data.gang, isSubmitting: false });
      return true;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Erro ao recrutar' });
      return false;
    }
  },

  queueTraining: async (type, quantity) => {
    try {
      set({ isSubmitting: true, error: null });
      const qty = quantity ?? get().gang?.trainingConfig.quantityPerOrder ?? 10;
      const data = await queueGangTraining(type, qty);
      syncBalances(data.playerBalances);
      set({ gang: data.gang, isSubmitting: false });
      return true;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Erro ao treinar' });
      return false;
    }
  },

  completeFinishedTrainings: async () => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await completeGangTrainings();
      syncBalances(data.playerBalances);
      set({ gang: data.gang, isSubmitting: false });
      return true;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Erro ao coletar treinos' });
      return false;
    }
  },

  upgradeCT: async () => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await upgradeGangCT();
      syncBalances(data.playerBalances);
      set({ gang: data.gang, isSubmitting: false });
      return true;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Erro ao evoluir CT' });
      return false;
    }
  },

  payMaintenance: async () => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await payGangMaintenance();
      syncBalances(data.playerBalances);
      set({ gang: data.gang, isSubmitting: false });
      return true;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Erro ao pagar manutenção' });
      return false;
    }
  },

  setFormation: async (formation) => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await setGangFormation(formation);
      syncBalances(data.playerBalances);
      set({ gang: data.gang, isSubmitting: false });
      // ← Ponto de integração: atualiza estatísticas de combate
      syncFormacaoToEstatisticas(formation);
      return true;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Erro ao trocar formação' });
      return false;
    }
  },

  // ── Consultas derivadas ───────────────────────────────────────────────────

  getBattleStats: () => {
    const { gang } = get();
    if (!gang) return EMPTY_BATTLE_STATS;

    const active = gang.troopSummary.activeByType;

    // Pesos de poder por tipo (igual ao backend gangWarService.js)
    const totalPower =
      active.capanga   * 14 +
      active.frente    * 18 +
      active.executor  * 22 +
      active.assassino * 20 +
      active.muralha   * 16 +
      active.certeiro  * 18 +
      active.motorista * 12 +
      active.nitro     * 16;

    return {
      totalMembers: gang.troopSummary.totalMembers,
      ativos:       gang.troopSummary.activeMembers,
      feridos:      gang.troopSummary.injuredMembers,
      mortos:       gang.troopSummary.deadMembers,
      // Os valores abaixo são somados dos atributos dos membros ativos.
      // Para atributos detalhados por tipo+nível use gangAtributos.ts + gangEstatisticasStore.
      rajada:    active.capanga * 9  + active.frente  * 12 + active.executor  * 11 + active.assassino * 12,
      blindagem: active.muralha * 15 + active.motorista * 14 + active.nitro   * 13 + active.certeiro * 10,
      folego:    active.muralha * 16 + active.nitro    * 15 + active.motorista * 14 + active.capanga * 12,
      quebra:    active.frente  * 12 + active.executor * 12 + active.assassino * 13 + active.certeiro * 8,
      medicalPower: 0,
      lootPower:    0,
      mobilityPower: active.motorista * 8 + active.nitro * 6,
      totalPower,
    };
  },

  getAvailableByType: () => {
    return get().gang?.troopSummary.activeByType ?? { ...EMPTY_BY_TYPE };
  },

  getActiveMemberCount: (type) => {
    return get().gang?.troopSummary.activeByType?.[type] ?? 0;
  },

  getTrainingConfig: () => {
    return get().gang?.trainingConfig ?? {
      quantityPerOrder: 10,
      durationSeconds:  10,
      slots:            7,
    };
  },

  clearGang: () => {
    set({ gang: null, isLoading: false, isSubmitting: false, error: null });
    useGangEstatisticasStore.getState().resetAll();
  },
}));
