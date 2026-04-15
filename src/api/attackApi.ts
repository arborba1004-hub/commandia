import type {
  GangBattleCasualtyResult,
  GangBattleCompositionStats,
} from '@/types/gangWar';
import type { AttackResolution } from '@/store/mapAttackStore';

const BACKEND_URL = 'https://comando-backend.onrender.com';

function getAuthToken(): string | null {
  const token = localStorage.getItem('authToken');
  return token && token.trim() ? token.trim() : null;
}

function buildUrl(endpoint: string): string {
  const normalizedBase = BACKEND_URL.replace(/\/+$/, '');
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${normalizedBase}${normalizedEndpoint}`;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(buildUrl(endpoint), {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    let data: any = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const error = new Error(
        data?.error || `Erro ${response.status}: ${response.statusText}`
      ) as Error & {
        status?: number;
        data?: unknown;
      };
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data as T;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Tempo limite excedido ao conectar com o servidor de batalha.');
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Não foi possível conectar ao servidor de batalha. Verifique sua conexão.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

type StartBattlePayload = {
  targetId: string;
  targetName?: string;
  targetTileX?: number;
  targetTileY?: number;
  originTileX?: number;
  originTileY?: number;
};

type StartBattleResponse = {
  battleId: string;
  success: boolean;
  message: string;
  estimatedLoot: number;
  estimatedChance: number;
  attackerPower: number;
  defenderPower: number;
  attackerFaction?: {
    factionId: string;
    factionName: string;
    factionTag: string;
    investmentBuffs?: Record<string, number>;
  } | null;
  defenderFaction?: {
    factionId: string;
    factionName: string;
    factionTag: string;
    investmentBuffs?: Record<string, number>;
  } | null;
  route?: {
    fromTileX: number;
    fromTileY: number;
    toTileX: number;
    toTileY: number;
  };
};

type BattleReportResponse = {
  battleId: string;
  resolution: AttackResolution;
  attacker: {
    playerId: string;
    playerName: string;
    factionId?: string | null;
    factionName?: string;
    factionTag?: string;
  };
  defender: {
    playerId: string;
    playerName: string;
    factionId?: string | null;
    factionName?: string;
    factionTag?: string;
  };
};

type EstimateBattleResponse = {
  estimatedLoot: number;
  estimatedChance: number;
  attackerPower: number;
  defenderPower: number;
  correCost: number;
  attackerFactionBonuses?: Record<string, number> | null;
  defenderFactionBonuses?: Record<string, number> | null;
  attackerGangPower?: number;
  defenderGangPower?: number;
};

function normalizeGangLosses(
  losses: any
): GangBattleCasualtyResult | undefined {
  if (!losses || typeof losses !== 'object') return undefined;

  return {
    mortos: {
      capanga: Number(losses?.mortos?.capanga || 0),
      frente: Number(losses?.mortos?.frente || 0),
      executor: Number(losses?.mortos?.executor || 0),
      assassino: Number(losses?.mortos?.assassino || 0),
      muralha: Number(losses?.mortos?.muralha || 0),
      certeiro: Number(losses?.mortos?.certeiro || 0),
      motorista: Number(losses?.mortos?.motorista || 0),
      nitro: Number(losses?.mortos?.nitro || 0),
      armeiro: Number(losses?.mortos?.armeiro || 0),
      informante: Number(losses?.mortos?.informante || 0),
      wifi: Number(losses?.mortos?.wifi || 0),
      medico: Number(losses?.mortos?.medico || 0),
      lavador: Number(losses?.mortos?.lavador || 0),
      ladrao: Number(losses?.mortos?.ladrao || 0),
      negociador: Number(losses?.mortos?.negociador || 0),
    },
    feridos: {
      capanga: Number(losses?.feridos?.capanga || 0),
      frente: Number(losses?.feridos?.frente || 0),
      executor: Number(losses?.feridos?.executor || 0),
      assassino: Number(losses?.feridos?.assassino || 0),
      muralha: Number(losses?.feridos?.muralha || 0),
      certeiro: Number(losses?.feridos?.certeiro || 0),
      motorista: Number(losses?.feridos?.motorista || 0),
      nitro: Number(losses?.feridos?.nitro || 0),
      armeiro: Number(losses?.feridos?.armeiro || 0),
      informante: Number(losses?.feridos?.informante || 0),
      wifi: Number(losses?.feridos?.wifi || 0),
      medico: Number(losses?.feridos?.medico || 0),
      lavador: Number(losses?.feridos?.lavador || 0),
      ladrao: Number(losses?.feridos?.ladrao || 0),
      negociador: Number(losses?.feridos?.negociador || 0),
    },
    preservadosPeloMedico: Number(losses?.preservadosPeloMedico || 0),
  };
}

function normalizeGangStats(
  stats: any
): GangBattleCompositionStats | undefined {
  if (!stats || typeof stats !== 'object') return undefined;

  return {
    totalMembers: Number(stats.totalMembers || 0),
    ativos: Number(stats.ativos || 0),
    feridos: Number(stats.feridos || 0),
    mortos: Number(stats.mortos || 0),
    rajada: Number(stats.rajada || 0),
    blindagem: Number(stats.blindagem || 0),
    folego: Number(stats.folego || 0),
    quebra: Number(stats.quebra || 0),
    medicalPower: Number(stats.medicalPower || 0),
    economyPower: Number(stats.economyPower || 0),
    lootPower: Number(stats.lootPower || 0),
    intelPower: Number(stats.intelPower || 0),
    mobilityPower: Number(stats.mobilityPower || 0),
    weaponPower: Number(stats.weaponPower || 0),
    coordinationPower: Number(stats.coordinationPower || 0),
    negotiationPower: Number(stats.negotiationPower || 0),
    totalPower: Number(stats.totalPower || 0),
  };
}

function normalizeResolution(input: any): AttackResolution {
  return {
    success: Boolean(input?.success),
    loot: Number(input?.loot || 0),
    chance: Number(input?.chance || 0),
    attackerPower: Number(input?.attackerPower || 0),
    defenderPower: Number(input?.defenderPower || 0),
    message: String(input?.message || ''),
    critical: Boolean(input?.critical),
    spoils: {
      dirtyMoneyLoot: Number(input?.spoils?.dirtyMoneyLoot || input?.loot || 0),
      correLoot: Number(input?.spoils?.correLoot || 0),
      prestigeLoot: Number(input?.spoils?.prestigeLoot || 0),
      brokenLuxuryItemId: input?.spoils?.brokenLuxuryItemId || null,
      brokenLuxuryItemName: input?.spoils?.brokenLuxuryItemName || null,
      brokenLuxuryItemValue: input?.spoils?.brokenLuxuryItemValue || null,
      luxuryConvertedDirtyMoney: Number(input?.spoils?.luxuryConvertedDirtyMoney || 0),
    },
    attackerGangLosses: normalizeGangLosses(input?.attackerGangLosses),
    defenderGangLosses: normalizeGangLosses(input?.defenderGangLosses),
    attackerGangStats: normalizeGangStats(input?.attackerGangStats),
    defenderGangStats: normalizeGangStats(input?.defenderGangStats),
  };
}

export async function estimateBattle(
  payload: Pick<StartBattlePayload, 'targetId'>
): Promise<EstimateBattleResponse> {
  return request<EstimateBattleResponse>('/battle/estimate', {
    method: 'POST',
    body: JSON.stringify({
      targetId: payload.targetId,
    }),
  });
}

export async function startBattle(
  payload: StartBattlePayload
): Promise<StartBattleResponse> {
  return request<StartBattleResponse>('/battle/start', {
    method: 'POST',
    body: JSON.stringify({
      targetId: payload.targetId,
      targetName: payload.targetName,
      targetTileX: payload.targetTileX,
      targetTileY: payload.targetTileY,
      originTileX: payload.originTileX,
      originTileY: payload.originTileY,
    }),
  });
}

export async function resolveBattleById(
  battleId: string
): Promise<BattleReportResponse> {
  const data = await request<any>(`/battle/resolve/${battleId}`, {
    method: 'POST',
  });

  return {
    battleId: String(data?.battleId || battleId),
    resolution: normalizeResolution(data?.resolution),
    attacker: {
      playerId: String(data?.attacker?.playerId || ''),
      playerName: String(data?.attacker?.playerName || ''),
      factionId: data?.attacker?.factionId || null,
      factionName: String(data?.attacker?.factionName || ''),
      factionTag: String(data?.attacker?.factionTag || ''),
    },
    defender: {
      playerId: String(data?.defender?.playerId || ''),
      playerName: String(data?.defender?.playerName || ''),
      factionId: data?.defender?.factionId || null,
      factionName: String(data?.defender?.factionName || ''),
      factionTag: String(data?.defender?.factionTag || ''),
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
    battleId: String(data?.battleId || battleId),
    resolution: normalizeResolution(data?.resolution),
    attacker: {
      playerId: String(data?.attacker?.playerId || ''),
      playerName: String(data?.attacker?.playerName || ''),
      factionId: data?.attacker?.factionId || null,
      factionName: String(data?.attacker?.factionName || ''),
      factionTag: String(data?.attacker?.factionTag || ''),
    },
    defender: {
      playerId: String(data?.defender?.playerId || ''),
      playerName: String(data?.defender?.playerName || ''),
      factionId: data?.defender?.factionId || null,
      factionName: String(data?.defender?.factionName || ''),
      factionTag: String(data?.defender?.factionTag || ''),
    },
  };
}

export async function getBattleHistory(): Promise<BattleReportResponse[]> {
  const data = await request<any[]>('/battle/history', {
    method: 'GET',
  });

  return (Array.isArray(data) ? data : []).map((item) => ({
    battleId: String(item?.battleId || ''),
    resolution: normalizeResolution(item?.resolution),
    attacker: {
      playerId: String(item?.attacker?.playerId || ''),
      playerName: String(item?.attacker?.playerName || ''),
      factionId: item?.attacker?.factionId || null,
      factionName: String(item?.attacker?.factionName || ''),
      factionTag: String(item?.attacker?.factionTag || ''),
    },
    defender: {
      playerId: String(item?.defender?.playerId || ''),
      playerName: String(item?.defender?.playerName || ''),
      factionId: item?.defender?.factionId || null,
      factionName: String(item?.defender?.factionName || ''),
      factionTag: String(item?.defender?.factionTag || ''),
    },
  }));
}

// Alias for backward compatibility
export const getAttackEstimate = estimateBattle;