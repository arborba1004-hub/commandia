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
  GangStatSnapshot,
  GangStatSource,
} from '@/types/gang';
import {
  fetchMyGang,
  recruitGangMember,
  upgradeGangCT,
  payGangMaintenance,
  setGangFormation,
  fetchGangStats,
  upsertGangStatSource as upsertGangStatSourceApi,
  removeGangStatSource as removeGangStatSourceApi,
} from '@/api/gangApi';
import { getAtributos } from '@/data/gangAtributos';
import {
  fetchTrainingStatus,
  startTraining,
  collectTraining as collectTrainingApi,
  type TrainingSlot,
} from '@/api/training';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS DO STORE
// ═════════════════════════════════════════════════════════════════════════════

type GangStore = {
  gang: Gang | null;
  player: any;
  trainingSlots: TrainingSlot[];
  statSources: GangStatSource[];
  statSnapshot: GangStatSnapshot | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // ── Carregamento ──────────────────────────────────────────────────────────
  loadGang: () => Promise<boolean>;
  loadTrainingState: () => Promise<boolean>;
  loadGangStats: () => Promise<boolean>;


  // ── Mutações ──────────────────────────────────────────────────────────────
  recruitMember: (type: GangMemberType) => Promise<boolean>;
  queueTraining: (
    ctKey: string,
    troopType: GangMemberType,
    troopLevel: number
  ) => Promise<boolean>;
  completeFinishedTrainings: () => Promise<boolean>;
  collectTraining: (slotId: string) => Promise<boolean>;
  upgradeCT: () => Promise<boolean>;
  payMaintenance: () => Promise<boolean>;
  setFormation: (formation: GangFormationType) => Promise<boolean>;
  upsertStatSource: (source: Partial<GangStatSource> & Pick<GangStatSource, 'source' | 'label' | 'targetScope'>) => Promise<boolean>;
  removeStatSource: (sourceId: string) => Promise<boolean>;


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


function mergeMemberStatSnapshots(
  members: GangMember[],
  statSnapshot?: GangStatSnapshot | null
): GangMember[] {
  if (!statSnapshot?.members?.length) return members;
  const byId = new Map(statSnapshot.members.map((item) => [String(item.id), item]));

  return members.map((member) => {
    const snapshot = byId.get(String(member.id));
    return snapshot ? { ...member, ...snapshot } : member;
  });
}

/** Sincroniza os saldos do player retornados pela API da gangue. */
function syncBalances(playerBalances?: {
  dirtyMoney: number;
  cleanMoney: number;
  corre: number;
}) {
  if (!playerBalances) return;

  usePlayerStore.getState().applyLocalPlayerUpdate((p) => ({
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
 * Sincroniza o playerStore depois de ações da gangue/treino.
 * Azidéia, ataque e mapa leem Player.gang pelo playerStore em vários pontos;
 * se o treino atualiza só o gangStore, o frontend fica com membros antigos e
 * pode mostrar/comportar como se não houvesse membro ativo.
 */
function syncPlayerStoreFromGangEnvelope(data: any) {
  if (!data) return;
  const playerStore = usePlayerStore.getState();

  if (data.player && typeof data.player === 'object') {
    playerStore.hydratePlayerFromServer(data.player as any);
    return;
  }

  const incomingGang = data.gang && typeof data.gang === 'object' ? data.gang : null;
  const incomingBalances = data.balances || data.playerBalances || null;

  if (!incomingGang && !incomingBalances) return;

  playerStore.applyLocalPlayerUpdate((current) => {
    const nextGang = incomingGang
      ? {
          ...(current.gang || {}),
          ...incomingGang,
          members: Array.isArray(incomingGang.members)
            ? incomingGang.members
            : (current.gang?.members || current.gangMembers || []),
          trainingSlots: Array.isArray(incomingGang.trainingSlots)
            ? incomingGang.trainingSlots
            : (Array.isArray(data.trainingSlots) ? data.trainingSlots : current.gang?.trainingSlots || []),
        }
      : {
          ...(current.gang || {}),
          trainingSlots: Array.isArray(data.trainingSlots) ? data.trainingSlots : current.gang?.trainingSlots || [],
        };

    return {
      ...current,
      balances: incomingBalances
        ? {
            ...current.balances,
            dirtyMoney: Number(incomingBalances.dirtyMoney ?? current.balances.dirtyMoney ?? 0),
            cleanMoney: Number(incomingBalances.cleanMoney ?? current.balances.cleanMoney ?? 0),
            corre: Number(incomingBalances.corre ?? current.balances.corre ?? 0),
          }
        : current.balances,
      gang: nextGang,
      gangMembers: Array.isArray(nextGang.members) ? nextGang.members : current.gangMembers,
      gangStats: nextGang.stats || current.gangStats,
    };
  });
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
  statSources: [],
  statSnapshot: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  // ── Carregamento ──────────────────────────────────────────────────────────

  loadGang: async () => {
    try {
      set({ isLoading: true, error: null });

      const data = await fetchMyGang();
      syncBalances(data.playerBalances);
      syncPlayerStoreFromGangEnvelope(data);

      const apiGang = data.gang ?? null;

      // Source of truth para `members` é Player.gang.members (Sistema A).
      // GangWar.members é legado e fica desatualizado em relação aos
      // treinamentos feitos pelos CTs do mapa.
      const playerStore = usePlayerStore.getState();
      const playerGangMembers =
        (playerStore.player as any)?.gang?.members ??
        playerStore.player?.gangMembers ??
        [];

      const statSnapshot = apiGang?.statSnapshot ?? null;
      const statSources = apiGang?.statSources ?? [];
      const baseMembers = playerGangMembers.length ? playerGangMembers : (apiGang?.members ?? []);
      const unifiedGang = apiGang
        ? {
            ...apiGang,
            members: mergeMemberStatSnapshots(baseMembers, statSnapshot),
            statSources,
            statSnapshot,
          }
        : null;

      set({
        gang: unifiedGang,
        statSources,
        statSnapshot,
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
      syncPlayerStoreFromGangEnvelope(data);

      set((state) => ({
        trainingSlots: data.trainingSlots,
        gang:
          state.gang && (data as any).gang?.members
            ? { ...state.gang, members: (data as any).gang.members }
            : state.gang,
        isLoading: false,
      }));

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



  loadGangStats: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await fetchGangStats();

      set((state) => ({
        statSources: data.statSources ?? [],
        statSnapshot: data.statSnapshot ?? null,
        gang: state.gang
          ? {
              ...state.gang,
              statSources: data.statSources ?? [],
              statSnapshot: data.statSnapshot ?? null,
              members: mergeMemberStatSnapshots(state.gang.members, data.statSnapshot),
            }
          : state.gang,
        isLoading: false,
      }));

      return true;
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro ao carregar estatísticas da gangue',
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
      syncPlayerStoreFromGangEnvelope(data);

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

  queueTraining: async (ctKey, troopType, troopLevel) => {
    try {
      set({ isSubmitting: true, error: null });

      const data = await startTraining(ctKey, troopType, troopLevel);
      syncBalances(data.balances);
      syncPlayerStoreFromGangEnvelope(data);

      set((state) => ({
        trainingSlots: data.trainingSlots,
        gang:
          state.gang && (data as any).gang?.members
            ? { ...state.gang, members: (data as any).gang.members }
            : state.gang,
        isSubmitting: false,
      }));

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
      syncPlayerStoreFromGangEnvelope(data);

      set((state) => ({
        trainingSlots: data.trainingSlots,
        gang:
          state.gang && (data as any).gang?.members
            ? { ...state.gang, members: (data as any).gang.members }
            : state.gang,
        isSubmitting: false,
      }));

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
      syncPlayerStoreFromGangEnvelope(data);

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
      syncPlayerStoreFromGangEnvelope(data);

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
      syncPlayerStoreFromGangEnvelope(data);

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



  upsertStatSource: async (source) => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await upsertGangStatSourceApi(source);

      set((state) => ({
        statSources: data.statSources ?? [],
        statSnapshot: data.statSnapshot ?? null,
        gang: state.gang
          ? {
              ...state.gang,
              statSources: data.statSources ?? [],
              statSnapshot: data.statSnapshot ?? null,
              members: mergeMemberStatSnapshots(state.gang.members, data.statSnapshot),
            }
          : state.gang,
        isSubmitting: false,
      }));

      return true;
    } catch (err) {
      set({
        isSubmitting: false,
        error: err instanceof Error ? err.message : 'Erro ao salvar estatística da gangue',
      });
      return false;
    }
  },

  removeStatSource: async (sourceId) => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await removeGangStatSourceApi(sourceId);

      set((state) => ({
        statSources: data.statSources ?? [],
        statSnapshot: data.statSnapshot ?? null,
        gang: state.gang
          ? {
              ...state.gang,
              statSources: data.statSources ?? [],
              statSnapshot: data.statSnapshot ?? null,
              members: mergeMemberStatSnapshots(state.gang.members, data.statSnapshot),
            }
          : state.gang,
        isSubmitting: false,
      }));

      return true;
    } catch (err) {
      set({
        isSubmitting: false,
        error: err instanceof Error ? err.message : 'Erro ao remover estatística da gangue',
      });
      return false;
    }
  },

  // ── Consultas derivadas ───────────────────────────────────────────────────

  getBattleStats: () => {
    const { gang, statSnapshot } = get();
    if (!gang) return EMPTY_BATTLE_STATS;

    if (statSnapshot?.summary) {
      return {
        ...EMPTY_BATTLE_STATS,
        ...statSnapshot.summary,
      };
    }

    const summary = calculateTroopSummary(gang.members);
    const totals = gang.members
      .filter((member) => member.status === 'ativo')
      .reduce(
        (acc, member) => {
          const stats = member.effectiveStats ?? getAtributos(member.type, member.level);
          acc.rajada += Number(stats.rajada || 0);
          acc.blindagem += Number(stats.blindagem || 0);
          acc.folego += Number(stats.folego || 0);
          acc.quebra += Number(stats.quebra || 0);
          if (member.type === 'motorista' || member.type === 'nitro') {
            acc.mobilityPower += Math.round(Number(stats.folego || 0) * 0.25);
          }
          return acc;
        },
        { ...EMPTY_BATTLE_STATS }
      );

    const totalPower = Math.round(
      totals.rajada * 1.35 +
      totals.blindagem * 1.10 +
      totals.folego * 1.05 +
      totals.quebra * 1.20
    );

    return {
      totalMembers: summary.totalMembers,
      ativos: summary.activeMembers,
      feridos: summary.injuredMembers,
      mortos: summary.deadMembers,
      rajada: Math.round(totals.rajada),
      blindagem: Math.round(totals.blindagem),
      folego: Math.round(totals.folego),
      quebra: Math.round(totals.quebra),
      medicalPower: 0,
      lootPower: 0,
      mobilityPower: totals.mobilityPower,
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
      statSources: [],
      statSnapshot: null,
      isLoading: false,
      isSubmitting: false,
      error: null,
    });

    useGangEstatisticasStore.getState().resetAll();
  },
}));
