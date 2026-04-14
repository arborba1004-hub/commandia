import { fetchCurrentPlayer } from './playerApi';
import type {
  AttackOrigin,
  AttackResolution,
  AttackTarget,
  SpoilsResult,
  GangLosses,
  GangStats,
} from '@/store/mapAttackStore';

const BACKEND_URL = 'https://comando-backend.onrender.com';
const REQUEST_TIMEOUT_MS = 60000;

function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.error || `Erro ao acessar ${endpoint}`);
    }

    return data as T;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(`Tempo limite excedido ao acessar ${endpoint}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export type BattleStartPayload = {
  target: AttackTarget;
  origin: AttackOrigin;
};

export type BattleEstimate = {
  estimatedLoot: number;
  estimatedChance: number;
  attackerPower: number;
  defenderPower: number;
  correCost: number;
};

export type BattleStartResponse = {
  battleId: string;
  success: boolean;
  message: string;
  estimatedLoot: number;
  estimatedChance: number;
  attackerPower: number;
  defenderPower: number;
  route?: {
    fromTileX: number;
    fromTileY: number;
    toTileX: number;
    toTileY: number;
  };
};

export type BattleReportResponse = {
  battleId: string;
  resolution: AttackResolution;
  attacker: {
    playerId: string;
    playerName: string;
  };
  defender: {
    playerId: string;
    playerName: string;
  };
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeSpoils(raw?: Partial<SpoilsResult> | null): SpoilsResult {
  return {
    dirtyMoneyLoot: safeNumber(raw?.dirtyMoneyLoot),
    correLoot: safeNumber(raw?.correLoot),
    prestigeLoot: safeNumber(raw?.prestigeLoot),
    brokenLuxuryItemId: raw?.brokenLuxuryItemId ?? null,
    brokenLuxuryItemName: raw?.brokenLuxuryItemName ?? null,
    brokenLuxuryItemValue:
      raw?.brokenLuxuryItemValue == null ? null : safeNumber(raw?.brokenLuxuryItemValue),
    luxuryConvertedDirtyMoney: safeNumber(raw?.luxuryConvertedDirtyMoney),
  };
}

function normalizeGangLosses(raw?: Partial<GangLosses> | null): GangLosses {
  return {
    membersKilled: safeNumber(raw?.membersKilled),
    membersInjured: safeNumber(raw?.membersInjured),
    totalLosses: safeNumber(raw?.totalLosses),
  };
}

function normalizeGangStats(raw?: Partial<GangStats> | null): GangStats {
  return {
    totalMembers: safeNumber(raw?.totalMembers),
    averageLevel: safeNumber(raw?.averageLevel),
    totalPower: safeNumber(raw?.totalPower),
    morale: safeNumber(raw?.morale),
  };
}

function buildEmptyGangLosses(): GangLosses {
  return {
    membersKilled: 0,
    membersInjured: 0,
    totalLosses: 0,
  };
}

function buildEmptyGangStats(): GangStats {
  return {
    totalMembers: 0,
    averageLevel: 0,
    totalPower: 0,
    morale: 0,
  };
}

function normalizeResolution(raw: any): AttackResolution {
  return {
    success: !!raw?.success,
    loot: safeNumber(raw?.loot),
    chance: safeNumber(raw?.chance),
    attackerPower: safeNumber(raw?.attackerPower),
    defenderPower: safeNumber(raw?.defenderPower),
    message: raw?.message || 'Batalha concluída.',
    critical: !!raw?.critical,
    spoils: normalizeSpoils(raw?.spoils),
    attackerGangLosses: normalizeGangLosses(raw?.attackerGangLosses),
    defenderGangLosses: normalizeGangLosses(raw?.defenderGangLosses),
    attackerGangStats: normalizeGangStats(raw?.attackerGangStats),
    defenderGangStats: normalizeGangStats(raw?.defenderGangStats),
  };
}

function buildLocalEstimate(
  attacker: {
    power?: number;
    balances?: { corre?: number };
    skills?: {
      attack?: number;
      defense?: number;
      intelligence?: number;
      agility?: number;
      respect?: number;
      vigor?: number;
    };
    gangPower?: number;
  } | null,
  target: AttackTarget
): BattleEstimate {
  const attack = safeNumber(attacker?.skills?.attack);
  const defense = safeNumber(attacker?.skills?.defense);
  const intelligence = safeNumber(attacker?.skills?.intelligence);
  const agility = safeNumber(attacker?.skills?.agility);
  const respect = safeNumber(attacker?.skills?.respect);
  const vigor = safeNumber(attacker?.skills?.vigor);

  // Usa dados reais do player + poder da gangue
  const attackerBasePower = safeNumber(attacker?.power, 100);
  const gangPower = safeNumber(attacker?.gangPower, 0);
  const attackerComputedPower =
    attackerBasePower +
    gangPower +
    attack * 8 +
    defense * 4 +
    intelligence * 5 +
    agility * 6 +
    respect * 3 +
    vigor * 5;

  const defenderComputedPower =
    safeNumber(target?.power, 100) +
    safeNumber(target?.barracoLevel, 1) * 45;

  const estimatedChance = clamp(
    attackerComputedPower / Math.max(attackerComputedPower + defenderComputedPower, 1),
    0.15,
    0.85
  );

  const targetDirtyMoney = safeNumber(target?.dirtyMoney);
  const lootBonus = attack * 0.003;
  const defenseReduction = defense * 0.001;

  const estimatedLoot = Math.max(
    0,
    Math.floor(targetDirtyMoney * 0.18 * (1 + lootBonus - defenseReduction))
  );

  return {
    estimatedLoot,
    estimatedChance: Number((estimatedChance * 100).toFixed(2)),
    attackerPower: Math.round(attackerComputedPower),
    defenderPower: Math.round(defenderComputedPower),
    correCost: 10,
  };
}

export async function getAttackEstimate(target: AttackTarget): Promise<BattleEstimate> {
  const player = await fetchCurrentPlayer();
  return buildLocalEstimate(player as any, target);
}

export async function startBattle(
  payload: BattleStartPayload,
  gangData?: {
    attackerGangMembers?: number;
    attackerGangStats?: GangStats;
    attackerCTLevel?: number;
  }
): Promise<BattleStartResponse> {
  const body = {
    targetId: payload.target.playerId,
    targetName: payload.target.playerName,
    targetTileX: payload.target.tileX,
    targetTileY: payload.target.tileY,
    originTileX: payload.origin.tileX,
    originTileY: payload.origin.tileY,
    ...(gangData && {
      attackerGangMembers: gangData.attackerGangMembers,
      attackerGangStats: gangData.attackerGangStats,
      attackerCTLevel: gangData.attackerCTLevel,
    }),
  };

  return request<BattleStartResponse>('/battle/start', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function resolveBattleById(
  battleId: string
): Promise<BattleReportResponse> {
  const data = await request<any>(`/battle/resolve/${battleId}`, {
    method: 'POST',
  });

  return {
    battleId: data?.battleId || battleId,
    resolution: normalizeResolution(data?.resolution || data),
    attacker: {
      playerId: data?.attacker?.playerId || '',
      playerName: data?.attacker?.playerName || 'ATACANTE',
    },
    defender: {
      playerId: data?.defender?.playerId || '',
      playerName: data?.defender?.playerName || 'DEFENSOR',
    },
  };
}

export async function getBattleReport(
  battleId: string
): Promise<BattleReportResponse> {
  const data = await request<any>(`/battle/report/${battleId}`, {
    method: 'GET',
  });

  return {
    battleId: data?.battleId || battleId,
    resolution: normalizeResolution(data?.resolution || data),
    attacker: {
      playerId: data?.attacker?.playerId || '',
      playerName: data?.attacker?.playerName || 'ATACANTE',
    },
    defender: {
      playerId: data?.defender?.playerId || '',
      playerName: data?.defender?.playerName || 'DEFENSOR',
    },
  };
}

export async function getBattleHistory(): Promise<BattleReportResponse[]> {
  const data = await request<any[]>('/battle/history', {
    method: 'GET',
  });

  if (!Array.isArray(data)) return [];

  return data.map((item) => ({
    battleId: item?.battleId || '',
    resolution: normalizeResolution(item?.resolution || item),
    attacker: {
      playerId: item?.attacker?.playerId || '',
      playerName: item?.attacker?.playerName || 'ATACANTE',
    },
    defender: {
      playerId: item?.defender?.playerId || '',
      playerName: item?.defender?.playerName || 'DEFENSOR',
    },
  }));
}