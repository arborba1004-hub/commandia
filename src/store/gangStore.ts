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
import { countMembersByType } from '@/utils/gangHelpers';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS DO STORE
// ═════════════════════════════════════════════════════════════════════════════

type TrainingSlot = {
  id: string;
  ctKey: GangMemberType;
  troopType: GangMemberType;
  quantity: number;
  startedAt: number;
  endsAt: number;
  status: 'training' | 'completed';
  cost: number;
};

type PersistedTrainingState = {
  trainingSlots: TrainingSlot[];
  gangMembers: GangMember[];
};

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

const TRAINING_STORAGE_KEY = 'gang_training_state';

function loadPersistedTrainingState(): PersistedTrainingState {
  try {
    const raw = localStorage.getItem(TRAINING_STORAGE_KEY);

    if (!raw) {
      return {
        trainingSlots: [],
        gangMembers: [],
      };
    }

    const parsed = JSON.parse(raw);

    return {
      trainingSlots: Array.isArray(parsed?.trainingSlots)
        ? parsed.trainingSlots
        : [],
      gangMembers: Array.isArray(parsed?.gangMembers)
        ? parsed.gangMembers
        : [],
    };
  } catch {
    return {
      trainingSlots: [],
      gangMembers: [],
    };
  }
}

/**
 * Persiste o estado de treinamento localmente.
 */
async function persistTrainingState(data: {
  trainingState: TrainingSlot[];
  gangMembers: GangMember[];
}) {
  try {
    const payload: PersistedTrainingState = {
      trainingSlots: data.trainingState,
      gangMembers: data.gangMembers,
    };

    localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Evita quebrar o jogo se o localStorage falhar.
  }
}

function mergeGangMembers(
  apiMembers: GangMember[],
  persistedMembers: GangMember[]
): GangMember[] {
  const map = new Map<string, GangMember>();

  for (const member of apiMembers) {
    if (member?.id) {
      map.set(member.id, member);
    }
  }

  for (const member of persistedMembers) {
    if (member?.id && !map.has(member.id)) {
      map.set(member.id, member);
    }
  }

  return Array.from(map.values());
}

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
      const persisted = loadPersistedTrainingState();

      syncBalances(data.playerBalances);

      const apiGang = data.gang ?? null;
      const apiMembers = apiGang?.members ?? [];
      const persistedMembers = persisted.gangMembers ?? [];
      const mergedMembers = mergeGangMembers(apiMembers, persistedMembers);

      const mergedGang: Gang | null = apiGang
        ? {
            ...apiGang,
            members: mergedMembers,
          }
        : ({
            members: mergedMembers,
          } as Gang);

      set({
        gang: mergedGang,
        trainingSlots: persisted.trainingSlots,
        isLoading: false,
      });

      if (mergedGang?.formation) {
        syncFormacaoToEstatisticas(mergedGang.formation);
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
      const persisted = loadPersistedTrainingState();

      const currentGang = get().gang;

      if (currentGang) {
        const mergedMembers = mergeGangMembers(
          currentGang.members ?? [],
          persisted.gangMembers ?? []
        );

        set({
          trainingSlots: persisted.trainingSlots,
          gang: {
            ...currentGang,
            members: mergedMembers,
          },
        });
      } else {
        set({
          trainingSlots: persisted.trainingSlots,
        });
      }

      return true;
    } catch (err) {
      set({
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

      const state = get();

      const activeSlots = state.trainingSlots.filter(
        (slot) => slot.status === 'training'
      );

      if (activeSlots.length >= 4) {
        set({
          isSubmitting: false,
          error: 'Todos os CTs já estão treinando.',
        });

        return false;
      }

      const ctAlreadyTraining = state.trainingSlots.some(
        (slot) =>
          slot.ctKey === ctKey &&
          slot.status === 'training'
      );

      if (ctAlreadyTraining) {
        set({
          isSubmitting: false,
          error: 'Este CT já está treinando uma tropa.',
        });

        return false;
      }

      const barracoLevel = state.gang?.barracoLevel ?? 1;

      const quantity = barracoLevel * 10;
      const durationMs = barracoLevel * 2 * 60 * 1000;
      const cost = Math.floor(1000 * barracoLevel * 1.1);

      const dirtyMoney =
        usePlayerStore.getState().player?.balances?.dirtyMoney ?? 0;

      if (dirtyMoney < cost) {
        set({
          isSubmitting: false,
          error: 'Dinheiro sujo insuficiente para iniciar o treinamento.',
        });

        return false;
      }

      const now = Date.now();

      const slot: TrainingSlot = {
        id: crypto.randomUUID(),
        ctKey,
        troopType,
        quantity,
        startedAt: now,
        endsAt: now + durationMs,
        status: 'training',
        cost,
      };

      const updatedSlots = [...state.trainingSlots, slot];

      usePlayerStore.getState().applyPlayerUpdate((player) => ({
        ...player,
        balances: {
          ...player.balances,
          dirtyMoney: Math.max(
            0,
            (player.balances?.dirtyMoney ?? 0) - cost
          ),
        },
      }));

      set({
        trainingSlots: updatedSlots,
        isSubmitting: false,
      });

      await persistTrainingState({
        trainingState: updatedSlots,
        gangMembers: state.gang?.members ?? [],
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
      const now = Date.now();
      const state = get();

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

      await persistTrainingState({
        trainingState: updatedSlots,
        gangMembers: state.gang?.members ?? [],
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

      const state = get();

      const slot = state.trainingSlots.find((s) => s.id === slotId);

      if (!slot) {
        set({
          isSubmitting: false,
          error: 'Treino não encontrado.',
        });

        return false;
      }

      if (slot.status !== 'completed' && Date.now() < slot.endsAt) {
        set({
          isSubmitting: false,
          error: 'Treino ainda não terminou.',
        });

        return false;
      }

      const now = Date.now();

      const newMembers: GangMember[] = Array.from(
        { length: slot.quantity },
        (_, index) => ({
          id: `${slot.troopType}-${now}-${index}`,
          type: slot.troopType,
          level: 1,
          status: 'ativo',
          recruitedAt: now,
        })
      );

      const updatedGang: Gang = {
        ...((state.gang ?? { members: [] }) as Gang),
        members: [...(state.gang?.members ?? []), ...newMembers],
      };

      const updatedSlots = state.trainingSlots.filter((s) => s.id !== slotId);

      set({
        gang: updatedGang,
        trainingSlots: updatedSlots,
        isSubmitting: false,
      });

      await persistTrainingState({
        trainingState: updatedSlots,
        gangMembers: updatedGang.members,
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
    localStorage.removeItem(TRAINING_STORAGE_KEY);

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
