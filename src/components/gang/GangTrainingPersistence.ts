import type { GangMemberType } from '@/components/gang/GangMembros';
import type {
  GangTrainingOperation,
  GangTrainingPlayerLike,
  GangTrainingState,
  QGSlotKey,
} from '@/components/gang/TreinamentoGang';
import {
  QG_SLOT_KEYS,
  collectGangTraining,
  createEmptyGangTrainingState,
  hydrateGangTrainingState,
  startGangTraining,
} from '@/components/gang/TreinamentoGang';

export type PersistedGangMember = {
  id: string;
  type: GangMemberType;
  level: number;
  status: 'ativo' | 'ferido' | 'morto' | 'treinando';
  recruitedAt: string;
  trainingEndsAt?: string | null;
  injuryEndsAt?: string | null;
};

export type PersistedGangStats = {
  totalMembers: number;
  activeMembers: number;
  injuredMembers: number;
  deadMembers: number;
  trainingMembers: number;
  totalPower: number;
  averageLevel: number;
};

export type GangTrainingPersistenceEnvelope = {
  trainingState: GangTrainingState;
  gangMembers: PersistedGangMember[];
  gangStats: PersistedGangStats;
};

const STORAGE_PREFIX = 'gangTrainingPersistence';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function readStorage(key: string) {
  if (!canUseStorage()) return null;

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  if (!canUseStorage()) return;

  try {
    localStorage.setItem(key, value);
  } catch {
    // noop
  }
}

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toPositiveInt(value: unknown, fallback = 1) {
  const numeric = Math.floor(toNumber(value, fallback));
  return numeric > 0 ? numeric : fallback;
}

function getPlayerPersistenceId(player: Partial<GangTrainingPlayerLike> & Record<string, any>) {
  return (
    String(
      player?._id ||
        player?.googleId ||
        player?.email ||
        player?.id ||
        'anon'
    ) || 'anon'
  );
}

function getStorageKey(player: Partial<GangTrainingPlayerLike> & Record<string, any>) {
  return `${STORAGE_PREFIX}:${getPlayerPersistenceId(player)}`;
}

export function createEmptyGangStats(): PersistedGangStats {
  return {
    totalMembers: 0,
    activeMembers: 0,
    injuredMembers: 0,
    deadMembers: 0,
    trainingMembers: 0,
    totalPower: 0,
    averageLevel: 0,
  };
}

export function recalculateGangStats(
  gangMembers: PersistedGangMember[]
): PersistedGangStats {
  const totalMembers = gangMembers.length;
  const activeMembers = gangMembers.filter((item) => item.status === 'ativo').length;
  const injuredMembers = gangMembers.filter((item) => item.status === 'ferido').length;
  const deadMembers = gangMembers.filter((item) => item.status === 'morto').length;
  const trainingMembers = gangMembers.filter((item) => item.status === 'treinando').length;

  const totalLevels = gangMembers.reduce(
    (sum, item) => sum + toPositiveInt(item.level, 1),
    0
  );

  const totalPower = gangMembers.reduce((sum, item) => {
    return sum + toPositiveInt(item.level, 1) * 10;
  }, 0);

  return {
    totalMembers,
    activeMembers,
    injuredMembers,
    deadMembers,
    trainingMembers,
    totalPower,
    averageLevel: totalMembers > 0 ? Number((totalLevels / totalMembers).toFixed(2)) : 0,
  };
}

export function createEmptyGangTrainingEnvelope(): GangTrainingPersistenceEnvelope {
  return {
    trainingState: createEmptyGangTrainingState(),
    gangMembers: [],
    gangStats: createEmptyGangStats(),
  };
}

export function hydrateGangTrainingEnvelope(
  input?: Partial<GangTrainingPersistenceEnvelope> | null
): GangTrainingPersistenceEnvelope {
  const gangMembers = Array.isArray(input?.gangMembers) ? input!.gangMembers : [];
  const trainingState = hydrateGangTrainingState(input?.trainingState);

  return {
    trainingState,
    gangMembers,
    gangStats: recalculateGangStats(gangMembers),
  };
}

export function readGangTrainingEnvelopeForPlayer(
  player: Partial<GangTrainingPlayerLike> & Record<string, any>
): GangTrainingPersistenceEnvelope {
  const raw = readStorage(getStorageKey(player));

  if (!raw) {
    return createEmptyGangTrainingEnvelope();
  }

  try {
    const parsed = JSON.parse(raw);
    return hydrateGangTrainingEnvelope(parsed);
  } catch {
    return createEmptyGangTrainingEnvelope();
  }
}

export function saveGangTrainingEnvelopeForPlayer(
  player: Partial<GangTrainingPlayerLike> & Record<string, any>,
  envelope: GangTrainingPersistenceEnvelope
) {
  const hydrated = hydrateGangTrainingEnvelope(envelope);
  writeStorage(getStorageKey(player), JSON.stringify(hydrated));
  return hydrated;
}

export function createGangMemberInstance(
  memberType: GangMemberType,
  now = Date.now()
): PersistedGangMember {
  return {
    id: `${memberType}_${now}_${Math.random().toString(36).slice(2, 10)}`,
    type: memberType,
    level: 1,
    status: 'ativo',
    recruitedAt: new Date(now).toISOString(),
    trainingEndsAt: null,
    injuryEndsAt: null,
  };
}

export function startGangTrainingWithPersistence(params: {
  player: Partial<GangTrainingPlayerLike> & Record<string, any>;
  slotKey: QGSlotKey;
  memberType: GangMemberType;
  now?: number;
}) {
  const envelope = readGangTrainingEnvelopeForPlayer(params.player);

  const result = startGangTraining({
    player: params.player,
    state: envelope.trainingState,
    slotKey: params.slotKey,
    memberType: params.memberType,
    now: params.now,
  });

  if (!result.ok) {
    return result;
  }

  const nextEnvelope = hydrateGangTrainingEnvelope({
    ...envelope,
    trainingState: result.nextState,
  });

  saveGangTrainingEnvelopeForPlayer(params.player, nextEnvelope);

  return {
    ok: true as const,
    envelope: nextEnvelope,
    operation: result.operation,
    dirtyCost: result.dirtyCost,
    nextDirtyMoney: result.nextDirtyMoney,
  };
}

export function collectGangTrainingWithPersistence(params: {
  player: Partial<GangTrainingPlayerLike> & Record<string, any>;
  slotKey: QGSlotKey;
  now?: number;
}) {
  const envelope = readGangTrainingEnvelopeForPlayer(params.player);

  const result = collectGangTraining({
    state: envelope.trainingState,
    slotKey: params.slotKey,
    now: params.now,
  });

  if (!result.ok) {
    return result;
  }

  const createdMembers: PersistedGangMember[] = [];

  for (let index = 0; index < result.collected.quantity; index += 1) {
    createdMembers.push(
      createGangMemberInstance(result.collected.memberType, (params.now ?? Date.now()) + index)
    );
  }

  const nextEnvelope = hydrateGangTrainingEnvelope({
    trainingState: result.nextState,
    gangMembers: [...envelope.gangMembers, ...createdMembers],
  });

  saveGangTrainingEnvelopeForPlayer(params.player, nextEnvelope);

  return {
    ok: true as const,
    envelope: nextEnvelope,
    createdMembers,
    collected: result.collected,
  };
}

export function completeAllReadyGangTrainingsWithPersistence(params: {
  player: Partial<GangTrainingPlayerLike> & Record<string, any>;
  now?: number;
}) {
  let envelope = readGangTrainingEnvelopeForPlayer(params.player);
  const createdMembers: PersistedGangMember[] = [];
  const now = params.now ?? Date.now();

  for (const slotKey of QG_SLOT_KEYS) {
    const slot = envelope.trainingState.slots[slotKey];
    if (!slot) continue;

    const collected = collectGangTraining({
      state: envelope.trainingState,
      slotKey,
      now,
    });

    if (!collected.ok) continue;

    const newMembers: PersistedGangMember[] = [];

    for (let index = 0; index < collected.collected.quantity; index += 1) {
      newMembers.push(
        createGangMemberInstance(
          collected.collected.memberType,
          now + createdMembers.length + index
        )
      );
    }

    createdMembers.push(...newMembers);

    envelope = hydrateGangTrainingEnvelope({
      trainingState: collected.nextState,
      gangMembers: [...envelope.gangMembers, ...newMembers],
    });
  }

  saveGangTrainingEnvelopeForPlayer(params.player, envelope);

  return {
    envelope,
    createdMembers,
  };
}

export function syncGangTrainingEnvelopeToPlayerStore(params: {
  player: Partial<GangTrainingPlayerLike> & Record<string, any>;
  setGangMembers: (members: PersistedGangMember[]) => void;
  setGangStats: (stats: PersistedGangStats) => void;
}) {
  const envelope = readGangTrainingEnvelopeForPlayer(params.player);
  params.setGangMembers(envelope.gangMembers);
  params.setGangStats(envelope.gangStats);
  return envelope;
}

export function replaceGangMembersWithPersistence(params: {
  player: Partial<GangTrainingPlayerLike> & Record<string, any>;
  gangMembers: PersistedGangMember[];
}) {
  const envelope = readGangTrainingEnvelopeForPlayer(params.player);

  const nextEnvelope = hydrateGangTrainingEnvelope({
    ...envelope,
    gangMembers: params.gangMembers,
  });

  saveGangTrainingEnvelopeForPlayer(params.player, nextEnvelope);
  return nextEnvelope;
}

export function replaceGangTrainingStateWithPersistence(params: {
  player: Partial<GangTrainingPlayerLike> & Record<string, any>;
  trainingState: GangTrainingState;
}) {
  const envelope = readGangTrainingEnvelopeForPlayer(params.player);

  const nextEnvelope = hydrateGangTrainingEnvelope({
    ...envelope,
    trainingState: params.trainingState,
  });

  saveGangTrainingEnvelopeForPlayer(params.player, nextEnvelope);
  return nextEnvelope;
}

export function getGangTrainingOperationForSlot(
  player: Partial<GangTrainingPlayerLike> & Record<string, any>,
  slotKey: QGSlotKey
): GangTrainingOperation | null {
  const envelope = readGangTrainingEnvelopeForPlayer(player);
  return envelope.trainingState.slots[slotKey] ?? null;
}

export default {
  createEmptyGangTrainingEnvelope,
  hydrateGangTrainingEnvelope,
  readGangTrainingEnvelopeForPlayer,
  saveGangTrainingEnvelopeForPlayer,
  recalculateGangStats,
  startGangTrainingWithPersistence,
  collectGangTrainingWithPersistence,
  completeAllReadyGangTrainingsWithPersistence,
  syncGangTrainingEnvelopeToPlayerStore,
  replaceGangMembersWithPersistence,
  replaceGangTrainingStateWithPersistence,
  getGangTrainingOperationForSlot,
};