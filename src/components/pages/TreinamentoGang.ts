import type { GangMemberType } from '@/components/gang/GangMembros';

export const QG_SLOT_KEYS = ['qg1', 'qg2', 'qg3', 'qg4'] as const;
export type QGSlotKey = (typeof QG_SLOT_KEYS)[number];

export const GANG_TRAINING_BASE_COST_DIRTY = 1000;
export const GANG_TRAINING_BASE_DURATION_MINUTES = 2;
export const GANG_TRAINING_BASE_QUANTITY_MULTIPLIER = 10;
export const GANG_TRAINING_COST_MULTIPLIER = 1.1;

export type GangTrainingPlayerLike = {
  niveis?: {
    barracoLevel?: number;
  };
  balances?: {
    dirtyMoney?: number;
  };
};

export type GangTrainingOperationStatus = 'training' | 'ready';

export type GangTrainingOperation = {
  slotKey: QGSlotKey;
  memberType: GangMemberType;
  quantity: number;
  dirtyCost: number;
  barracoLevelAtStart: number;
  startedAt: number;
  endsAt: number;
};

export type GangTrainingState = {
  slots: Record<QGSlotKey, GangTrainingOperation | null>;
};

export type StartGangTrainingParams = {
  player: GangTrainingPlayerLike;
  state: GangTrainingState;
  slotKey: QGSlotKey;
  memberType: GangMemberType;
  now?: number;
};

export type StartGangTrainingResult =
  | {
      ok: false;
      reason: string;
    }
  | {
      ok: true;
      nextState: GangTrainingState;
      operation: GangTrainingOperation;
      dirtyCost: number;
      nextDirtyMoney: number;
    };

export type CollectGangTrainingParams = {
  state: GangTrainingState;
  slotKey: QGSlotKey;
  now?: number;
};

export type CollectGangTrainingResult =
  | {
      ok: false;
      reason: string;
    }
  | {
      ok: true;
      nextState: GangTrainingState;
      collected: {
        slotKey: QGSlotKey;
        memberType: GangMemberType;
        quantity: number;
      };
    };

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toPositiveInt(value: unknown, fallback = 1) {
  const numeric = Math.floor(toNumber(value, fallback));
  return numeric > 0 ? numeric : fallback;
}

export function createEmptyGangTrainingState(): GangTrainingState {
  return {
    slots: {
      qg1: null,
      qg2: null,
      qg3: null,
      qg4: null,
    },
  };
}

export function hydrateGangTrainingState(
  input?: Partial<GangTrainingState> | null
): GangTrainingState {
  const empty = createEmptyGangTrainingState();

  return {
    slots: {
      qg1: input?.slots?.qg1 ?? empty.slots.qg1,
      qg2: input?.slots?.qg2 ?? empty.slots.qg2,
      qg3: input?.slots?.qg3 ?? empty.slots.qg3,
      qg4: input?.slots?.qg4 ?? empty.slots.qg4,
    },
  };
}

export function getBarracoLevelForGangTraining(player: GangTrainingPlayerLike) {
  return toPositiveInt(player?.niveis?.barracoLevel, 1);
}

export function getDirtyMoneyForGangTraining(player: GangTrainingPlayerLike) {
  return Math.max(0, toNumber(player?.balances?.dirtyMoney, 0));
}

export function getGangTrainingQuantityPerOperation(
  player: GangTrainingPlayerLike
) {
  const barracoLevel = getBarracoLevelForGangTraining(player);
  return barracoLevel * GANG_TRAINING_BASE_QUANTITY_MULTIPLIER;
}

export function getGangTrainingDurationMinutes(
  player: GangTrainingPlayerLike
) {
  const barracoLevel = getBarracoLevelForGangTraining(player);
  return barracoLevel * GANG_TRAINING_BASE_DURATION_MINUTES;
}

export function getGangTrainingDurationMs(player: GangTrainingPlayerLike) {
  return getGangTrainingDurationMinutes(player) * 60 * 1000;
}

export function getGangTrainingCostDirty(player: GangTrainingPlayerLike) {
  const barracoLevel = getBarracoLevelForGangTraining(player);
  return Math.round(
    (GANG_TRAINING_BASE_COST_DIRTY * barracoLevel) *
      GANG_TRAINING_COST_MULTIPLIER
  );
}

export function getGangTrainingOperationStatus(
  operation: GangTrainingOperation,
  now = Date.now()
): GangTrainingOperationStatus {
  return now >= operation.endsAt ? 'ready' : 'training';
}

export function isGangTrainingSlotBusy(
  state: GangTrainingState,
  slotKey: QGSlotKey
) {
  const hydrated = hydrateGangTrainingState(state);
  return hydrated.slots[slotKey] !== null;
}

export function getGangTrainingAvailableSlots(state: GangTrainingState) {
  const hydrated = hydrateGangTrainingState(state);

  return QG_SLOT_KEYS.filter((slotKey) => hydrated.slots[slotKey] === null);
}

export function getGangTrainingActiveOperations(state: GangTrainingState) {
  const hydrated = hydrateGangTrainingState(state);

  return QG_SLOT_KEYS.map((slotKey) => hydrated.slots[slotKey]).filter(
    (operation): operation is GangTrainingOperation => operation !== null
  );
}

export function getGangTrainingRemainingMs(
  operation: GangTrainingOperation,
  now = Date.now()
) {
  return Math.max(0, operation.endsAt - now);
}

export function startGangTraining({
  player,
  state,
  slotKey,
  memberType,
  now = Date.now(),
}: StartGangTrainingParams): StartGangTrainingResult {
  const hydrated = hydrateGangTrainingState(state);

  if (hydrated.slots[slotKey]) {
    return {
      ok: false,
      reason: 'Esse QG já está ocupado.',
    };
  }

  const dirtyMoney = getDirtyMoneyForGangTraining(player);
  const dirtyCost = getGangTrainingCostDirty(player);

  if (dirtyMoney < dirtyCost) {
    return {
      ok: false,
      reason: 'Dinheiro sujo insuficiente.',
    };
  }

  const barracoLevel = getBarracoLevelForGangTraining(player);
  const quantity = getGangTrainingQuantityPerOperation(player);
  const durationMs = getGangTrainingDurationMs(player);

  const operation: GangTrainingOperation = {
    slotKey,
    memberType,
    quantity,
    dirtyCost,
    barracoLevelAtStart: barracoLevel,
    startedAt: now,
    endsAt: now + durationMs,
  };

  const nextState: GangTrainingState = {
    slots: {
      ...hydrated.slots,
      [slotKey]: operation,
    },
  };

  return {
    ok: true,
    nextState,
    operation,
    dirtyCost,
    nextDirtyMoney: dirtyMoney - dirtyCost,
  };
}

export function collectGangTraining({
  state,
  slotKey,
  now = Date.now(),
}: CollectGangTrainingParams): CollectGangTrainingResult {
  const hydrated = hydrateGangTrainingState(state);
  const operation = hydrated.slots[slotKey];

  if (!operation) {
    return {
      ok: false,
      reason: 'Não existe treinamento nesse QG.',
    };
  }

  if (getGangTrainingOperationStatus(operation, now) !== 'ready') {
    return {
      ok: false,
      reason: 'O treinamento ainda não terminou.',
    };
  }

  const nextState: GangTrainingState = {
    slots: {
      ...hydrated.slots,
      [slotKey]: null,
    },
  };

  return {
    ok: true,
    nextState,
    collected: {
      slotKey,
      memberType: operation.memberType,
      quantity: operation.quantity,
    },
  };
}

export function canStartGangTraining(
  player: GangTrainingPlayerLike,
  state: GangTrainingState,
  slotKey: QGSlotKey
) {
  const hydrated = hydrateGangTrainingState(state);

  if (hydrated.slots[slotKey]) {
    return false;
  }

  return (
    getDirtyMoneyForGangTraining(player) >= getGangTrainingCostDirty(player)
  );
}

export default {
  QG_SLOT_KEYS,
  createEmptyGangTrainingState,
  hydrateGangTrainingState,
  getBarracoLevelForGangTraining,
  getDirtyMoneyForGangTraining,
  getGangTrainingQuantityPerOperation,
  getGangTrainingDurationMinutes,
  getGangTrainingDurationMs,
  getGangTrainingCostDirty,
  getGangTrainingOperationStatus,
  isGangTrainingSlotBusy,
  getGangTrainingAvailableSlots,
  getGangTrainingActiveOperations,
  getGangTrainingRemainingMs,
  startGangTraining,
  collectGangTraining,
  canStartGangTraining,
};