/**
 * store/gangStore.ts
 * Store Zustand unificado da gangue.
 * Refatorado para usar os tipos canônicos de @/types/gang.
 * Integrado com gangEstatisticasStore para atualizar estatísticas ao mudar formação.
 *
 * REFACTORING ETAPA 4: O store mantém APENAS gang.members[]
 * Sem troopSummary, sem contadores separados.
 */

import { create } from 'zustand';
import { usePlayerStore } from '@/store/playerStore';
import {
  useGangEstatisticasStore,
  getFormacaoBonusPayload,
} from '@/store/gangEstatisticasStore';
import type {
  Gang,
  GangFormationType,
  GangMemberType,
  GangBattleStats,
  GangMember,
} from '@/types/gang';
import {
  fetchMyGang,
  recruitGangMember,
  upgradeGangCT,
  payGangMaintenance,
  setGangFormation,
} from '@/api/gangApi';
import {
  fetchTrainingStatus,
  startTraining,
  collectTraining as collectTrainingApi,
  type TrainingSlot,
} from '@/api/training';
import { countMembersByType } from '@/utils/gangHelpers';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS DO STORE
// ═════════════════════════════════════════════════════════════════════════════

type GangStore = {
  gang: Gang | null;
  player: any;
  trainingSlots: TrainingSlot[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // ── Carregamento ──────────────────────────────────────────────────────────
  loadGang: () => Promise<boolean>;
  loadTrainingState: () => Promise<boolean>;

  // ── Mutações ──────────────────────────────────────────────────────────────
  recruitMember: (type: GangMemberType) => Promise<boolean>;
  queueTraining: (ctKey: string, troopType: GangMemberType) => Promise<boolean>;
  completeFinishedTrainings: () => Promise<boolean>;
  collectTraining: (slotId: string) => Promise<boolean>;
  upgradeCT: () => Promise<boolean>;
  payMaintenance: () => Promise<boolean>;
  setFormation: (formation: GangFormationType) => Promise<boolean>;

  // ── Consultas derivadas ───────────────────────────────────────────────────
  getBattleStats: () => GangBattleStats;
  getAvailableByType: () => Record<GangMemberType, number>;
  getActiveMemberCount: (type: GangMemberType) => number;
  getTrainingConfig: () => {
    quantityPerOrder: number;
    durationSeconds: number;
    slots: number;
  };

  // ── Utilitários ───────────────────────────────────────────────────────────
  clearGang: () => void;
};

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

const EMPTY_BATTLE_STATS: GangBattleStats = {
  totalMembers: 0,
  ativos: 0,
  feridos: 0,
  mortos: 0,
  rajada: 0,
  blindagem: 0,
  folego: 0,
  quebra: 0,
  medicalPower: 0,
  lootPower: 0,
  mobilityPower: 0,
  totalPower: 0,
};

const EMPTY_BY_TYPE: Record<GangMemberType, number> = {
  capanga: 0,
  frente: 0,
  executor: 0,
  assassino: 0,
  muralha: 0,
  certeiro: 0,
  motorista: 0,
  nitro: 0,
};

/**
 * Calcula contadores de membros por tipo e status a partir do array members.
 * Retorna { byType, activeByType, totalMembers, activeMembers, injuredMembers, deadMembers }
 */
function calculateTroopSummary(members: GangMember[]) {
  const byType: Record<GangMemberType, number> = { ...EMPTY_BY_TYPE };
  const activeByType: Record<GangMemberType, number> = { ...EMPTY_BY_TYPE };
  let totalMembers = 0;
  let activeMembers = 0;
  let injuredMembers = 0;
  let deadMembers = 0;

  for (const member of members) {
    byType[member.type] = (byType[member.type] ?? 0) + 1;
    totalMembers++;

    if (member.status === 'ativo') {
      activeByType[member.type] = (activeByType[member.type] ?? 0) + 1;
      activeMembers++;
    } else if (member.status === 'ferido') {
      injuredMembers++;
    } else if (member.status === 'morto') {
      deadMembers++;
    }
  }

  return {
    byType,
    activeByType,
    totalMembers,
    activeMembers,
    injuredMembers,
    deadMembers,
  };
}

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
      corre: Number(playerBalances.corre ?? 0),
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
  player: null,
  trainingSlots: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  // ── Carregamento ──────────────────────────────────────────────────────────

  loadGang: async () => {
    try {
      set({ isLoading: true, error: null });

      const data = await fetchMyGang();

      syncBalances(data.playerBalances);

      const apiGang = data.gang ?? null;

      set({
        gang: apiGang,
        isLoading: false,
      });

      if (apiGang?.formation) {
        syncFormacaoToEstatisticas(apiGang.formation);
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

  loadTrainingState: async () => {
    try {
      set({ isLoading: true, error: null });

      const data = await fetchTrainingStatus();

      syncBalances(data.balances);

      set({
        trainingSlots: data.trainingSlots,
        isLoading: false,
      });

      return true;
    } catch (err) {
      set({
        isLoading: false,
        error:
          err instanceof Error
            ? err.message
            : 'Erro ao carregar treinamentos',
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

      set({
        gang: data.gang,
        isSubmitting: false,
      });

      return true;
    } catch (err) {
      set({
        isSubmitting: false,
        error: err instanceof Error ? err.message : 'Erro ao recrutar',
      });

      return false;
    }
  },

  queueTraining: async (ctKey, troopType) => {
    try {
      set({ isSubmitting: true, error: null });

      const data = await startTraining(ctKey, troopType);

      syncBalances(data.balances);

      set({
        trainingSlots: data.trainingSlots,
        isSubmitting: false,
      });

      return true;
    } catch (err) {
      set({
        isSubmitting: false,
        error:
          err instanceof Error
            ? err.message
            : 'Erro ao iniciar treinamento',
      });

      return false;
    }
  },

  completeFinishedTrainings: async () => {
    try {
      const state = get();

      const now = Date.now();

      const updatedSlots = state.trainingSlots.map((slot) => {
        if (slot.status === 'training' && now >= slot.endsAt) {
          return {
            ...slot,
            status: 'completed' as const,
          };
        }

        return slot;
      });

      set({
        trainingSlots: updatedSlots,
      });

      return true;
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? err.message
            : 'Erro ao atualizar treinamentos',
      });

      return false;
    }
  },

  collectTraining: async (slotId) => {
    try {
      set({ isSubmitting: true, error: null });

      const data = await collectTrainingApi(slotId);

      syncBalances(data.balances);

      set({
        trainingSlots: data.trainingSlots,
        isSubmitting: false,
      });

      return true;
    } catch (err) {
      set({
        isSubmitting: false,
        error:
          err instanceof Error
            ? err.message
            : 'Erro ao coletar treinamento',
      });

      return false;
    }
  },

  upgradeCT: async () => {
    try {
      set({ isSubmitting: true, error: null });

      const data = await upgradeGangCT();

      syncBalances(data.playerBalances);

      set({
        gang: data.gang,
        isSubmitting: false,
      });

      return true;
    } catch (err) {
      set({
        isSubmitting: false,
        error: err instanceof Error ? err.message : 'Erro ao evoluir CT',
      });

      return false;
    }
  },

  payMaintenance: async () => {
    try {
      set({ isSubmitting: true, error: null });

      const data = await payGangMaintenance();

      syncBalances(data.playerBalances);

      set({
        gang: data.gang,
        isSubmitting: false,
      });

      return true;
    } catch (err) {
      set({
        isSubmitting: false,
        error: err instanceof Error ? err.message : 'Erro ao pagar manutenção',
      });

      return false;
    }
  },

  setFormation: async (formation) => {
    try {
      set({ isSubmitting: true, error: null });

      const data = await setGangFormation(formation);

      syncBalances(data.playerBalances);

      set({
        gang: data.gang,
        isSubmitting: false,
      });

      // ← Ponto de integração: atualiza estatísticas de combate
      syncFormacaoToEstatisticas(formation);

      return true;
    } catch (err) {
      set({
        isSubmitting: false,
        error: err instanceof Error ? err.message : 'Erro ao trocar formação',
      });

      return false;
    }
  },

  // ── Consultas derivadas ───────────────────────────────────────────────────

  getBattleStats: () => {
    const { gang } = get();
    if (!gang) return EMPTY_BATTLE_STATS;

    const summary = calculateTroopSummary(gang.members);

    const capangaCount = countMembersByType(gang.members, 'capanga');
    const frenteCount = countMembersByType(gang.members, 'frente');
    const executorCount = countMembersByType(gang.members, 'executor');
    const assassinoCount = countMembersByType(gang.members, 'assassino');
    const muralhaCount = countMembersByType(gang.members, 'muralha');
    const certeiroCount = countMembersByType(gang.members, 'certeiro');
    const motoristaCount = countMembersByType(gang.members, 'motorista');
    const nitroCount = countMembersByType(gang.members, 'nitro');

    const totalPower =
      capangaCount * 14 +
      frenteCount * 18 +
      executorCount * 22 +
      assassinoCount * 20 +
      muralhaCount * 16 +
      certeiroCount * 18 +
      motoristaCount * 12 +
      nitroCount * 16;

    return {
      totalMembers: summary.totalMembers,
      ativos: summary.activeMembers,
      feridos: summary.injuredMembers,
      mortos: summary.deadMembers,

      // Os valores abaixo são somados dos atributos dos membros ativos.
      // Para atributos detalhados por tipo+nível use gangAtributos.ts + gangEstatisticasStore.
      rajada:
        capangaCount * 9 +
        frenteCount * 12 +
        executorCount * 11 +
        assassinoCount * 12,
      blindagem:
        muralhaCount * 15 +
        motoristaCount * 14 +
        nitroCount * 13 +
        certeiroCount * 10,
      folego:
        muralhaCount * 16 +
        nitroCount * 15 +
        motoristaCount * 14 +
        capangaCount * 12,
      quebra:
        frenteCount * 12 +
        executorCount * 12 +
        assassinoCount * 13 +
        certeiroCount * 8,
      medicalPower: 0,
      lootPower: 0,
      mobilityPower: motoristaCount * 8 + nitroCount * 6,
      totalPower,
    };
  },

  getAvailableByType: () => {
    const { gang } = get();

    if (!gang) return { ...EMPTY_BY_TYPE };

    const summary = calculateTroopSummary(gang.members);

    return summary.activeByType;
  },

  getActiveMemberCount: (type) => {
    const { gang } = get();

    if (!gang) return 0;

    const summary = calculateTroopSummary(gang.members);

    return summary.activeByType[type] ?? 0;
  },

  getTrainingConfig: () => {
    return (
      get().gang?.trainingConfig ?? {
        quantityPerOrder: 10,
        durationSeconds: 10,
        slots: 7,
      }
    );
  },

  clearGang: () => {
    set({
      gang: null,
      trainingSlots: [],
      isLoading: false,
      isSubmitting: false,
      error: null,
    });

    useGangEstatisticasStore.getState().resetAll();
  },
}));
