/**
 * store/gangStore.ts
 * Store oficial da gangue.
 * Fonte única: Player.gang vindo de /api/gang e /api/training.
 * Não usa /gang-war: GangWar é legado e não deve alimentar modal de ataque,
 * treino, mapa ou Azidéia.
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

type OfficialGang = Gang & {
  formation?: GangFormationType;
  trainingSlots?: TrainingSlot[];
  trainingJobs?: TrainingSlot[];
  trainingConfig?: {
    quantityPerOrder: number;
    durationSeconds: number;
    slots: number;
  };
  troopSummary?: any;
  stats?: any;
  ct?: any;
  maxMembers?: number;
  gangLevel?: number;
  dailyUpkeep?: any;
};

type GangStore = {
  gang: OfficialGang | null;
  player: any;
  trainingSlots: TrainingSlot[];
  statSources: GangStatSource[];
  statSnapshot: GangStatSnapshot | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  loadGang: () => Promise<boolean>;
  loadTrainingState: () => Promise<boolean>;
  loadGangStats: () => Promise<boolean>;

  recruitMember: (type: GangMemberType) => Promise<boolean>;
  queueTraining: (ctKey: string, troopType: GangMemberType, troopLevel: number) => Promise<boolean>;
  completeFinishedTrainings: () => Promise<boolean>;
  collectTraining: (slotId: string) => Promise<boolean>;
  upgradeCT: () => Promise<boolean>;
  payMaintenance: () => Promise<boolean>;
  setFormation: (formation: GangFormationType) => Promise<boolean>;
  upsertStatSource: (source: Partial<GangStatSource> & Pick<GangStatSource, 'source' | 'label' | 'targetScope'>) => Promise<boolean>;
  removeStatSource: (sourceId: string) => Promise<boolean>;

  getBattleStats: () => GangBattleStats;
  getAvailableByType: () => Record<GangMemberType, number>;
  getActiveMemberCount: (type: GangMemberType) => number;
  getTrainingConfig: () => { quantityPerOrder: number; durationSeconds: number; slots: number };
  clearGang: () => void;
};

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

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function isObject(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function calculateTroopSummary(members: GangMember[]) {
  const byType: Record<GangMemberType, number> = { ...EMPTY_BY_TYPE };
  const activeByType: Record<GangMemberType, number> = { ...EMPTY_BY_TYPE };
  let totalMembers = 0;
  let activeMembers = 0;
  let injuredMembers = 0;
  let deadMembers = 0;

  for (const member of members || []) {
    const t = member.type as GangMemberType;
    byType[t] = (byType[t] ?? 0) + 1;
    totalMembers += 1;
    if (member.status === 'ativo') {
      activeMembers += 1;
      activeByType[t] = (activeByType[t] ?? 0) + 1;
    } else if (member.status === 'ferido') {
      injuredMembers += 1;
    } else if (member.status === 'morto') {
      deadMembers += 1;
    }
  }

  return { byType, activeByType, totalMembers, activeMembers, injuredMembers, deadMembers };
}

function mergeMemberStatSnapshots(members: GangMember[] = [], snapshot: GangStatSnapshot | null | undefined): GangMember[] {
  const snapshotById = new Map(
    asArray<any>(snapshot?.members).map((item) => [String(item.id), item])
  );

  return members.map((member) => {
    const stat = snapshotById.get(String(member.id));
    return stat ? { ...member, ...stat } : member;
  });
}

function getIncomingGang(data: any, previousGang?: OfficialGang | null): OfficialGang | null {
  const playerStore = usePlayerStore.getState();
  const player = playerStore.player as any;

  const apiGang = isObject(data?.gang) ? data.gang : null;
  const playerGang = isObject(data?.player?.gang) ? data.player.gang : isObject(player?.gang) ? player.gang : null;
  const source = apiGang || playerGang || previousGang || null;

  const members =
    asArray<GangMember>(apiGang?.members).length ? asArray<GangMember>(apiGang?.members) :
    asArray<GangMember>(playerGang?.members).length ? asArray<GangMember>(playerGang?.members) :
    asArray<GangMember>(player?.gangMembers).length ? asArray<GangMember>(player?.gangMembers) :
    asArray<GangMember>(previousGang?.members);

  const trainingSlots =
    asArray<TrainingSlot>(data?.trainingSlots).length ? asArray<TrainingSlot>(data?.trainingSlots) :
    asArray<TrainingSlot>(apiGang?.trainingSlots).length ? asArray<TrainingSlot>(apiGang?.trainingSlots) :
    asArray<TrainingSlot>(apiGang?.trainingJobs).length ? asArray<TrainingSlot>(apiGang?.trainingJobs) :
    asArray<TrainingSlot>(playerGang?.trainingSlots).length ? asArray<TrainingSlot>(playerGang?.trainingSlots) :
    asArray<TrainingSlot>(previousGang?.trainingSlots);

  if (!source && !members.length && !trainingSlots.length) return previousGang || null;

  const statSources = asArray<GangStatSource>(apiGang?.statSources).length
    ? asArray<GangStatSource>(apiGang?.statSources)
    : asArray<GangStatSource>(playerGang?.statSources).length
      ? asArray<GangStatSource>(playerGang?.statSources)
      : asArray<GangStatSource>(previousGang?.statSources);
  const statSnapshot = (apiGang?.statSnapshot || playerGang?.statSnapshot || previousGang?.statSnapshot || null) as GangStatSnapshot | null;

  return {
    ...(previousGang || {}),
    ...(source || {}),
    members: mergeMemberStatSnapshots(members, statSnapshot),
    trainingSlots,
    trainingJobs: trainingSlots,
    formation: (source?.formation || previousGang?.formation || 'pressao_total') as GangFormationType,
    statSources,
    statSnapshot,
  } as OfficialGang;
}

function syncBalances(playerBalances?: { dirtyMoney?: number; cleanMoney?: number; corre?: number }) {
  if (!playerBalances) return;
  usePlayerStore.getState().applyLocalPlayerUpdate((p) => ({
    ...p,
    balances: {
      ...p.balances,
      dirtyMoney: Number(playerBalances.dirtyMoney ?? p.balances.dirtyMoney ?? 0),
      cleanMoney: Number(playerBalances.cleanMoney ?? p.balances.cleanMoney ?? 0),
      corre: Number(playerBalances.corre ?? p.balances.corre ?? 0),
    },
  }));
}

function syncPlayerStoreFromGangEnvelope(data: any) {
  if (!data) return;
  const playerStore = usePlayerStore.getState();

  if (data.player && typeof data.player === 'object') {
    playerStore.hydratePlayerFromServer(data.player as any);
    return;
  }

  const incomingGang = isObject(data.gang) ? data.gang : null;
  const incomingBalances = data.balances || data.playerBalances || null;
  if (!incomingGang && !incomingBalances) return;

  playerStore.applyLocalPlayerUpdate((current) => {
    const nextGang = incomingGang
      ? {
          ...(current.gang || {}),
          ...incomingGang,
          members: asArray(incomingGang.members).length
            ? incomingGang.members
            : (current.gang?.members || current.gangMembers || []),
          trainingSlots: asArray(data.trainingSlots).length
            ? data.trainingSlots
            : asArray(incomingGang.trainingSlots).length
              ? incomingGang.trainingSlots
              : (current.gang?.trainingSlots || []),
        }
      : {
          ...(current.gang || {}),
          trainingSlots: asArray(data.trainingSlots).length ? data.trainingSlots : current.gang?.trainingSlots || [],
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
      gangMembers: asArray(nextGang.members).length ? nextGang.members : current.gangMembers,
      gangStats: nextGang.stats || current.gangStats,
    };
  });
}

function syncFormacaoToEstatisticas(formation: GangFormationType) {
  useGangEstatisticasStore.getState().applyBonus('formacao', getFormacaoBonusPayload(formation));
}

function applyEnvelopeToStore(set: any, data: any, flags: Record<string, any> = {}) {
  syncBalances(data?.balances || data?.playerBalances);
  syncPlayerStoreFromGangEnvelope(data);

  set((state: GangStore) => {
    const nextGang = getIncomingGang(data, state.gang);
    const statSources = asArray<GangStatSource>(data?.statSources).length
      ? asArray<GangStatSource>(data?.statSources)
      : asArray<GangStatSource>(nextGang?.statSources);
    const statSnapshot = (data?.statSnapshot || nextGang?.statSnapshot || null) as GangStatSnapshot | null;
    const trainingSlots = asArray<TrainingSlot>(data?.trainingSlots).length
      ? asArray<TrainingSlot>(data?.trainingSlots)
      : asArray<TrainingSlot>(nextGang?.trainingSlots);

    return {
      ...flags,
      gang: nextGang,
      trainingSlots,
      statSources,
      statSnapshot,
    };
  });
}

export const useGangStore = create<GangStore>((set, get) => ({
  gang: null,
  player: null,
  trainingSlots: [],
  statSources: [],
  statSnapshot: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadGang: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await fetchMyGang();
      applyEnvelopeToStore(set, data, { isLoading: false });

      const formation = (data as any)?.gang?.formation;
      if (formation) syncFormacaoToEstatisticas(formation);
      return true;
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erro ao carregar gangue' });
      return false;
    }
  },

  loadTrainingState: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await fetchTrainingStatus();
      applyEnvelopeToStore(set, data, { isLoading: false });
      return true;
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erro ao carregar treinamentos' });
      return false;
    }
  },

  loadGangStats: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await fetchGangStats();
      applyEnvelopeToStore(set, data, { isLoading: false });
      return true;
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Erro ao carregar estatísticas da gangue' });
      return false;
    }
  },

  recruitMember: async (type) => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await recruitGangMember(type);
      applyEnvelopeToStore(set, data, { isSubmitting: false });
      return true;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Erro ao recrutar' });
      return false;
    }
  },

  queueTraining: async (ctKey, troopType, troopLevel) => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await startTraining(ctKey, troopType, troopLevel);
      applyEnvelopeToStore(set, data, { isSubmitting: false });
      return true;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Erro ao iniciar treinamento' });
      return false;
    }
  },

  completeFinishedTrainings: async () => {
    try {
      const now = Date.now();
      set((state) => ({
        trainingSlots: state.trainingSlots.map((slot) => (
          slot.status === 'training' && now >= Number(slot.endsAt)
            ? { ...slot, status: 'completed' as const }
            : slot
        )),
      }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Erro ao atualizar treinamentos' });
      return false;
    }
  },

  collectTraining: async (slotId) => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await collectTrainingApi(slotId);
      applyEnvelopeToStore(set, data, { isSubmitting: false });
      return true;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Erro ao coletar treinamento' });
      return false;
    }
  },

  upgradeCT: async () => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await upgradeGangCT();
      applyEnvelopeToStore(set, data, { isSubmitting: false });
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
      applyEnvelopeToStore(set, data, { isSubmitting: false });
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
      applyEnvelopeToStore(set, data, { isSubmitting: false });
      syncFormacaoToEstatisticas(formation);
      return true;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Erro ao trocar formação' });
      return false;
    }
  },

  upsertStatSource: async (source) => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await upsertGangStatSourceApi(source);
      applyEnvelopeToStore(set, data, { isSubmitting: false });
      return true;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Erro ao salvar estatística da gangue' });
      return false;
    }
  },

  removeStatSource: async (sourceId) => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await removeGangStatSourceApi(sourceId);
      applyEnvelopeToStore(set, data, { isSubmitting: false });
      return true;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Erro ao remover estatística da gangue' });
      return false;
    }
  },

  getBattleStats: () => {
    const { gang, statSnapshot } = get();
    if (!gang) return EMPTY_BATTLE_STATS;

    if (statSnapshot?.summary) {
      return { ...EMPTY_BATTLE_STATS, ...statSnapshot.summary };
    }

    const summary = calculateTroopSummary(gang.members || []);
    const totals = (gang.members || [])
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
      totals.rajada * 1.35 + totals.blindagem * 1.10 + totals.folego * 1.05 + totals.quebra * 1.20
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
    return calculateTroopSummary(gang.members || []).activeByType;
  },

  getActiveMemberCount: (type) => {
    const { gang } = get();
    if (!gang) return 0;
    return calculateTroopSummary(gang.members || []).activeByType[type] ?? 0;
  },

  getTrainingConfig: () => {
    return get().gang?.trainingConfig ?? { quantityPerOrder: 10, durationSeconds: 10, slots: 4 };
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
