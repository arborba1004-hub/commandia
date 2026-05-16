/**
 * api/attackApi.ts
 * API unificada de ataque PVP.
 * Substitui: attackApi.ts (novo), attack.ts (antigo)
 *
 * Fluxo do ataque:
 *   1. canAttack()      → verifica escudo/cooldown/facção
 *   2. startBattle()    → backend cria registro, retorna battleId + arriveAtIso
 *   3. (frontend anima deslocamento durante o tempo de viagem)
 *   4. resolveBattle()  → backend calcula resultado, persiste espólios e envia notificação
 *   5. getBattleReport()→ busca relatório de batalha já resolvida
 */

import type { BattleResolution, GangAttackSelection } from '@/types/gang';

// ═════════════════════════════════════════════════════════════════════════════
// CONFIG
// ═════════════════════════════════════════════════════════════════════════════

const BACKEND_URL = 'https://comando-backend.onrender.com';
const TIMEOUT_MS  = 10_000;

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS DE REQUEST / RESPONSE
// ═════════════════════════════════════════════════════════════════════════════

export type StartBattlePayload = {
  targetId: string;
  targetName?: string;
  targetTileX?: number;
  targetTileY?: number;
  originTileX?: number;
  originTileY?: number;
  /** Seleção de tropas por quantidade por tipo (Mafia City style) */
  selection?: Partial<GangAttackSelection>;
};

export type StartBattleResponse = {
  battleId: string;
  success: boolean;
  message?: string;
  /** Tempo estimado de viagem em ms (para sincronizar animação) */
  totalDurationMs: number;
  arriveAtIso: string;
  status: string;
  attackerId: string;
  attackerName: string;
  defenderId: string;
  defenderName: string;
  routeDistanceTiles: number;
  timePerTileMs: number;
  launchedAtIso: string;
  report: unknown | null;
  route?: {
    fromTileX: number;
    fromTileY: number;
    toTileX: number;
    toTileY: number;
  };
};

export type BattleReportResponse = {
  battleId: string;
  resolution: BattleResolution;
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

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function getToken(): string {
  const token = localStorage.getItem('authToken');
  if (!token?.trim()) throw new Error('Usuário não autenticado');
  return token.trim();
}

function buildUrl(path: string): string {
  const base = BACKEND_URL.replace(/\/+$/, '');
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  return `${base}${endpoint}`;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(endpoint), {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    });

    let data: unknown = null;
    try { data = await response.json(); } catch { data = null; }

    if (!response.ok) {
      const msg = (data as any)?.error
        ?? (data as any)?.message
        ?? `Erro ${response.status}: ${response.statusText}`;
      const err = Object.assign(new Error(msg), { status: response.status, data });
      throw err;
    }

    return data as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Espera ms antes de continuar (para polling com backoff). */
function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ═════════════════════════════════════════════════════════════════════════════
// NORMALIZAÇÃO
// ═════════════════════════════════════════════════════════════════════════════

function normalizeSpoils(spoils: any) {
  return {
    dirtyMoneyLoot:          Number(spoils?.dirtyMoneyLoot ?? spoils?.loot ?? 0),
    correLoot:               Number(spoils?.correLoot ?? 0),
    prestigeLoot:            Number(spoils?.prestigeLoot ?? 0),
    brokenLuxuryItemId:      spoils?.brokenLuxuryItemId ?? null,
    brokenLuxuryItemName:    spoils?.brokenLuxuryItemName ?? null,
    brokenLuxuryItemValue:   spoils?.brokenLuxuryItemValue ?? null,
    luxuryConvertedDirtyMoney: Number(spoils?.luxuryConvertedDirtyMoney ?? 0),
  };
}

function normalizeResolution(raw: any): BattleResolution {
  return {
    success:       Boolean(raw?.success),
    loot:          Number(raw?.loot ?? 0),
    chance:        Number(raw?.chance ?? 0) / (Number(raw?.chance ?? 0) > 1 ? 100 : 1),
    attackerPower: Number(raw?.attackerPower ?? 0),
    defenderPower: Number(raw?.defenderPower ?? 0),
    message:       String(raw?.message ?? ''),
    critical:      Boolean(raw?.critical),
    spoils:        normalizeSpoils(raw?.spoils),
    attackerGangLosses: raw?.attackerGangLosses,
    defenderGangLosses: raw?.defenderGangLosses,
    attackerGangStats:  raw?.attackerGangStats,
    defenderGangStats:  raw?.defenderGangStats,
  };
}

function normalizeReportResponse(raw: any, battleId: string): BattleReportResponse {
  return {
    battleId: String(raw?.battleId ?? battleId),
    resolution: normalizeResolution(raw?.resolution),
    attacker: {
      playerId:    String(raw?.attacker?.playerId ?? ''),
      playerName:  String(raw?.attacker?.playerName ?? ''),
      factionId:   raw?.attacker?.factionId ?? null,
      factionName: String(raw?.attacker?.factionName ?? ''),
      factionTag:  String(raw?.attacker?.factionTag ?? ''),
    },
    defender: {
      playerId:    String(raw?.defender?.playerId ?? ''),
      playerName:  String(raw?.defender?.playerName ?? ''),
      factionId:   raw?.defender?.factionId ?? null,
      factionName: String(raw?.defender?.factionName ?? ''),
      factionTag:  String(raw?.defender?.factionTag ?? ''),
    },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ENDPOINTS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Inicia o ataque — backend cria registro e retorna tempo de viagem.
 * O frontend usa totalDurationMs para sincronizar a animação.
 */
export async function startBattle(
  payload: StartBattlePayload
): Promise<StartBattleResponse> {
  return request('/battle/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Resolve o resultado da batalha no backend.
 * Deve ser chamado após a animação chegar ao destino (arriveAtIso).
 * Backend retorna 409 se ainda não chegou → função retenta automaticamente.
 */
export async function resolveBattle(
  battleId: string,
  options?: { maxAttempts?: number; intervalMs?: number }
): Promise<BattleReportResponse> {
  const maxAttempts = Math.max(1, options?.maxAttempts ?? 8);
  const intervalMs  = Math.max(200, options?.intervalMs ?? 900);
  let lastError: unknown = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const raw = await request<any>(`/battle/resolve/${battleId}`, { method: 'POST' });
      return normalizeReportResponse(raw, battleId);
    } catch (err: any) {
      lastError = err;
      if (err?.status === 409) {
        await wait(intervalMs);
        continue;
      }
      throw err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Não foi possível resolver o ataque no tempo esperado');
}

/**
 * Busca relatório de batalha já resolvida por ID.
 * Usado para exibir o BattleReportPanel sem depender do fluxo de ataque ativo.
 */
export async function getBattleReport(battleId: string): Promise<BattleReportResponse> {
  const raw = await request<any>(`/battle/report/${battleId}`, { method: 'GET' });
  return normalizeReportResponse(raw, battleId);
}

/**
 * Histórico de batalhas do jogador autenticado.
 */
export async function getBattleHistory(): Promise<BattleReportResponse[]> {
  const data = await request<any[]>('/battle/history', { method: 'GET' });
  return (Array.isArray(data) ? data : []).map((item) =>
    normalizeReportResponse(item, item?.battleId ?? '')
  );
}

export type CanAttackResponse = {
  canAttack: boolean;
  reason: 'self_attack' | 'same_faction' | 'shield_active' | 'cooldown' | 'target_not_found' | 'no_target' | 'server_error' | null;
  message: string | null;
  shieldExpiresAt: number | null;
  shieldSource: 'novato' | 'derrota' | 'pacote' | 'unknown' | null;
  cooldownExpiresAt: number | null;
};

export async function canAttack(targetId: string): Promise<CanAttackResponse> {
  return request(`/battle/can-attack/${encodeURIComponent(targetId)}`, { method: 'GET' });
}
