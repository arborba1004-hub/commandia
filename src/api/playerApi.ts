import type { PlayerState } from '@/store/playerStore';

const BACKEND_URL = 'https://comando-backend.onrender.com';
const REQUEST_TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// ==========================================
// TIPOS AUXILIARES
// ==========================================
type ApiEnvelope<T> =
  | T
  | {
      success?: boolean;
      message?: string;
      error?: string;
      data?: T;
      player?: T extends PlayerState ? PlayerState : never;
      faction?: FactionApiPayload | null;
    };

type ApiError = Error & {
  status?: number;
  data?: unknown;
  endpoint?: string;
};

export type FactionApiPayload = {
  id: string;
  name: string;
  tag: string;
  level?: number;
  exp?: number;
  expToNext?: number;
  totalInvestmentLevel?: number;
  investmentTierName?: string;
  treasury?: {
    dirtyMoney: number;
    cleanMoney: number;
    corre: number;
  };
  investmentBuffs?: {
    attackPercent: number;
    defensePercent: number;
    hpPercent: number;
    dirtyMoneyGainPercent: number;
    cleanMoneyGainPercent: number;
    agilityPercent: number;
    intelligencePercent: number;
    respectPercent: number;
    baseDefensePercent: number;
    donationEfficiencyPercent: number;
    buffDurationPercent: number;
  };
  activeBuffs?: Array<Record<string, any>>;
} | null;

export type PlayerApiEnvelope = {
  player: PlayerState;
  faction: FactionApiPayload;
};

export type BarracoUpgradeOperationPayload = {
  active?: boolean;
  status?: 'idle' | 'building' | 'ready' | 'completed' | string;
  fromLevel?: number;
  toLevel?: number;
  cost?: number;
  durationMs?: number;
  startedAt?: string | null;
  endsAt?: string | null;
  completedAt?: string | null;
  acceleratedMs?: number;
  remainingMs?: number;
};

export type BarracoUpgradeApiResponse = PlayerApiEnvelope & {
  barraco?: {
    action?: 'status' | 'started' | 'claimed' | 'accelerated' | string;
    previousLevel?: number;
    currentLevel?: number;
    targetLevel?: number;
    nextLevel?: number;
    maxLevel?: number;
    cost?: number;
    name?: string;
    durationMs?: number;
    durationText?: string;
    remainingMs?: number;
    remainingText?: string;
    hasActiveUpgrade?: boolean;
    isReady?: boolean;
    acceleratorSeconds?: number;
    appliedSeconds?: number;
    appliedMs?: number;
    upgrade?: BarracoUpgradeOperationPayload;
    requirements?: Record<string, any>;
  };
  message?: string;
};

// ==========================================
// HELPERS DE AUTH
// ==========================================
function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// ==========================================
// HELPERS DE URL / TIMEOUT / JSON
// ==========================================
function buildUrl(endpoint: string): string {
  const normalizedBase = BACKEND_URL.replace(/\/+$/, '');
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${normalizedBase}${normalizedEndpoint}`;
}

function createTimeoutSignal(timeoutMs: number): AbortController {
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

function isJsonResponse(contentType: string | null): boolean {
  return !!contentType && contentType.toLowerCase().includes('application/json');
}

async function safeReadResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');

  try {
    if (isJsonResponse(contentType)) {
      return await response.json();
    }

    const text = await response.text();

    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  } catch {
    return null;
  }
}

function buildApiError(
  message: string,
  status?: number,
  data?: unknown,
  endpoint?: string
): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.data = data;
  error.endpoint = endpoint;
  return error;
}

// ==========================================
// HELPERS DE NORMALIZAÇÃO
// ==========================================
function ensureObject(value: unknown): Record<string, any> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, any>;
}

function extractPlayerPayload(payload: unknown): PlayerState {
  const obj = ensureObject(payload);

  if (!obj) {
    throw buildApiError('Resposta inválida do backend: player ausente ou malformado');
  }

  if (obj.player && typeof obj.player === 'object') {
    return obj.player as PlayerState;
  }

  if (obj.data && typeof obj.data === 'object') {
    const dataObj = obj.data as Record<string, any>;

    if (dataObj.player && typeof dataObj.player === 'object') {
      return dataObj.player as PlayerState;
    }

    return dataObj as PlayerState;
  }

  return obj as PlayerState;
}

function extractFactionPayload(payload: unknown): FactionApiPayload {
  const obj = ensureObject(payload);

  if (!obj) return null;

  if (obj.faction && typeof obj.faction === 'object') {
    return obj.faction as FactionApiPayload;
  }

  if (obj.data && typeof obj.data === 'object') {
    const dataObj = obj.data as Record<string, any>;
    if (dataObj.faction && typeof dataObj.faction === 'object') {
      return dataObj.faction as FactionApiPayload;
    }
  }

  return null;
}

function extractEnvelope(payload: unknown): PlayerApiEnvelope {
  return {
    player: extractPlayerPayload(payload),
    faction: extractFactionPayload(payload),
  };
}

const PLAYER_UPDATE_ALLOWED_FIELDS = new Set(['headerCustomization']);

function stripUnsafePlayerUpdatePayload<T extends Record<string, any>>(payload: T): Partial<T> {
  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload || {})) {
    if (PLAYER_UPDATE_ALLOWED_FIELDS.has(key)) {
      clean[key] = value;
    }
  }

  return clean as Partial<T>;
}

function extractArrayPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload;

  const obj = ensureObject(payload);

  if (!obj) {
    throw buildApiError('Resposta inválida do backend: array esperado');
  }

  if (Array.isArray(obj.data)) return obj.data as T[];
  if (Array.isArray(obj.players)) return obj.players as T[];

  throw buildApiError('Resposta inválida do backend: lista não encontrada');
}

// Remove campos undefined para evitar PATCH sujo
function deepStripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => deepStripUndefined(item)) as T;
  }

  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val !== undefined) {
        result[key] = deepStripUndefined(val);
      }
    }

    return result as T;
  }

  return value;
}

// ==========================================
// CORE REQUEST WITH RETRY LOGIC
// ==========================================
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const token = getAuthToken();
  const controller = createTimeoutSignal(REQUEST_TIMEOUT_MS);

  const headers = new Headers(options.headers || {});
  const hasBody = options.body !== undefined && options.body !== null;

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('Accept', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(endpoint), {
      ...options,
      headers,
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (error: any) {
    // Retry on network errors or timeouts
    if (retryCount < MAX_RETRIES && (error?.name === 'AbortError' || !response)) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)));
      return makeRequest<T>(endpoint, options, retryCount + 1);
    }

    if (error?.name === 'AbortError') {
      throw buildApiError(
        `Tempo limite excedido ao acessar ${endpoint}`,
        408,
        null,
        endpoint
      );
    }

    throw buildApiError(
      `Falha de conexão ao acessar ${endpoint}`,
      0,
      error,
      endpoint
    );
  }

  const data = await safeReadResponseBody(response);

  if (!response.ok) {
    // Retry on 5xx errors (server errors)
    if (retryCount < MAX_RETRIES && response.status >= 500) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)));
      return makeRequest<T>(endpoint, options, retryCount + 1);
    }

    const message =
      (ensureObject(data)?.error as string) ||
      (ensureObject(data)?.message as string) ||
      `Erro na requisição: ${endpoint}`;

    throw buildApiError(message, response.status, data, endpoint);
  }

  return data as T;
}

// ==========================================
// PLAYER ENDPOINTS
// ==========================================

/**
 * Busca os dados atuais do player do backend
 * Endpoint: GET /player/me
 */
export async function fetchCurrentPlayer(): Promise<PlayerState> {
  const data = await makeRequest<ApiEnvelope<PlayerState>>('/player/me', {
    method: 'GET',
  });

  return extractPlayerPayload(data);
}

/**
 * Busca player + faction do backend
 * Endpoint: GET /player/me
 */
export async function fetchCurrentPlayerWithFaction(): Promise<PlayerApiEnvelope> {
  const data = await makeRequest<ApiEnvelope<PlayerState>>('/player/me', {
    method: 'GET',
  });

  return extractEnvelope(data);
}

/**
 * Evolui o barraco pelo backend autoritativo.
 * Endpoint: POST /barraco/upgrade
 */
function extractBarracoEnvelope(data: unknown): BarracoUpgradeApiResponse {
  const envelope = extractEnvelope(data);
  const obj = ensureObject(data);
  const barraco = ensureObject(obj?.barraco) || ensureObject(obj?.data?.barraco) || undefined;

  return {
    ...envelope,
    barraco: barraco as BarracoUpgradeApiResponse['barraco'],
    message: typeof obj?.message === 'string' ? obj.message : undefined,
  };
}

export async function upgradeBarracoWithFaction(): Promise<BarracoUpgradeApiResponse> {
  const data = await makeRequest<any>('/barraco/upgrade', {
    method: 'POST',
  });

  return extractBarracoEnvelope(data);
}

export async function claimBarracoUpgradeWithFaction(): Promise<BarracoUpgradeApiResponse> {
  const data = await makeRequest<any>('/barraco/upgrade/claim', {
    method: 'POST',
  });

  return extractBarracoEnvelope(data);
}

export async function fetchBarracoUpgradeStatusWithFaction(): Promise<BarracoUpgradeApiResponse> {
  const data = await makeRequest<any>('/barraco/upgrade/status', {
    method: 'GET',
  });

  return extractBarracoEnvelope(data);
}

export async function accelerateBarracoUpgradeWithFaction(seconds: number): Promise<BarracoUpgradeApiResponse> {
  const data = await makeRequest<any>('/barraco/upgrade/accelerate', {
    method: 'POST',
    body: JSON.stringify({ seconds }),
  });

  return extractBarracoEnvelope(data);
}

/**
 * Sincroniza os dados do player com o backend
 * Endpoint: PATCH /player/update
 *
 * Regra:
 * - envia apenas payload limpo
 * - aceita backend retornando { player }, { data }, ou o player cru
 */
export async function syncPlayerUpdate(
  player: Partial<PlayerState>
): Promise<{ player: PlayerState }> {
  const cleanPayload = deepStripUndefined(stripUnsafePlayerUpdatePayload(player as Record<string, any>));

  const data = await makeRequest<ApiEnvelope<PlayerState>>('/player/update', {
    method: 'PATCH',
    body: JSON.stringify(cleanPayload),
  });

  return {
    player: extractPlayerPayload(data),
  };
}

/**
 * Sincroniza player + faction quando o backend devolver ambos
 * Endpoint: PATCH /player/update
 */
export async function syncPlayerUpdateWithFaction(
  player: Partial<PlayerState>
): Promise<PlayerApiEnvelope> {
  const cleanPayload = deepStripUndefined(stripUnsafePlayerUpdatePayload(player as Record<string, any>));

  const data = await makeRequest<ApiEnvelope<PlayerState>>('/player/update', {
    method: 'PATCH',
    body: JSON.stringify(cleanPayload),
  });

  return extractEnvelope(data);
}

/**
 * Hidrata os dados do player do backend (compatibilidade)
 */
export async function hydratePlayerFromBackend(): Promise<PlayerState> {
  return fetchCurrentPlayer();
}

/**
 * Hidrata player + faction do backend
 */
export async function hydratePlayerFromBackendWithFaction(): Promise<PlayerApiEnvelope> {
  return fetchCurrentPlayerWithFaction();
}

/**
 * Busca todos os jogadores do servidor
 * Endpoint: GET /players
 */
export async function fetchAllPlayers(): Promise<
  Array<{
    id: string;
    tileX: number;
    tileY: number;
    worldX: number;
    worldY: number;
  }>
> {
  const data = await makeRequest<
    | Array<{
        id: string;
        tileX: number;
        tileY: number;
        worldX: number;
        worldY: number;
      }>
    | {
        data?: Array<{
          id: string;
          tileX: number;
          tileY: number;
          worldX: number;
          worldY: number;
        }>;
        players?: Array<{
          id: string;
          tileX: number;
          tileY: number;
          worldX: number;
          worldY: number;
        }>;
      }
  >('/players', {
    method: 'GET',
  });

  return extractArrayPayload<{
    id: string;
    tileX: number;
    tileY: number;
    worldX: number;
    worldY: number;
  }>(data);
}

// ==========================================
// LAUNDRY ENDPOINTS
// ==========================================

export async function laundryStart(payload: {
  businessId: number;
  businessName?: string;
}): Promise<{ operationId: string; endsAt: string; player: PlayerState }> {
  const data = await makeRequest<any>('/laundry/start', {
    method: 'POST',
    body: JSON.stringify(deepStripUndefined(payload)),
  });

  const obj = ensureObject(data);

  if (!obj) {
    throw buildApiError('Resposta inválida ao iniciar lavagem');
  }

  return {
    operationId: String(obj.operationId || obj.data?.operationId || ''),
    endsAt: String(obj.endsAt || obj.data?.endsAt || ''),
    player: extractPlayerPayload(data),
  };
}

export async function laundryStartWithFaction(payload: {
  businessId: number;
  businessName?: string;
}): Promise<{
  operationId: string;
  endsAt: string;
  durationSeconds?: number;
  laundrySummary?: Record<string, any>;
  player: PlayerState;
  faction: FactionApiPayload;
}> {
  const data = await makeRequest<any>('/laundry/start', {
    method: 'POST',
    body: JSON.stringify(deepStripUndefined(payload)),
  });

  const obj = ensureObject(data);

  if (!obj) {
    throw buildApiError('Resposta inválida ao iniciar lavagem');
  }

  const envelope = extractEnvelope(data);

  return {
    operationId: String(obj.operationId || obj.data?.operationId || ''),
    endsAt: String(obj.endsAt || obj.data?.endsAt || ''),
    durationSeconds:
      typeof obj.durationSeconds === 'number'
        ? obj.durationSeconds
        : typeof obj.data?.durationSeconds === 'number'
          ? obj.data.durationSeconds
          : undefined,
    laundrySummary:
      ensureObject(obj.laundrySummary) ||
      ensureObject(obj.data?.laundrySummary) ||
      undefined,
    player: envelope.player,
    faction: envelope.faction,
  };
}

export async function laundryComplete(
  operationId: string
): Promise<{ player: PlayerState }> {
  const data = await makeRequest<any>('/laundry/complete', {
    method: 'POST',
    body: JSON.stringify({ operationId }),
  });

  return {
    player: extractPlayerPayload(data),
  };
}

export async function laundryCompleteWithFaction(
  operationId: string
): Promise<{
  completedOperation?: Record<string, any>;
  player: PlayerState;
  faction: FactionApiPayload;
}> {
  const data = await makeRequest<any>('/laundry/complete', {
    method: 'POST',
    body: JSON.stringify({ operationId }),
  });

  const obj = ensureObject(data);
  const envelope = extractEnvelope(data);

  return {
    completedOperation:
      ensureObject(obj?.completedOperation) ||
      ensureObject(obj?.data?.completedOperation) ||
      undefined,
    player: envelope.player,
    faction: envelope.faction,
  };
}

export async function canOperateLaundry(
  businessId: number
): Promise<{ allowed: boolean }> {
  const data = await makeRequest<any>(`/laundry/can-operate/${businessId}`, {
    method: 'GET',
  });

  const obj = ensureObject(data);

  return {
    allowed: Boolean(obj?.allowed ?? obj?.data?.allowed),
  };
}

// ==========================================
// ARSENAL ENDPOINTS
// ==========================================

export async function arsenalUpgrade(payload: {
  itemId: string;
  level: number;
}): Promise<{ player: PlayerState }> {
  const data = await makeRequest<any>('/arsenal/upgrade', {
    method: 'POST',
    body: JSON.stringify(deepStripUndefined(payload)),
  });

  return {
    player: extractPlayerPayload(data),
  };
}

// ==========================================
// GIRO ENDPOINTS
// ==========================================

export async function giroStart(payload: {
  amount: number;
  duration: number;
}): Promise<{ player: PlayerState }> {
  const data = await makeRequest<any>('/giro/start', {
    method: 'POST',
    body: JSON.stringify(deepStripUndefined(payload)),
  });

  return {
    player: extractPlayerPayload(data),
  };
}

// ==========================================
// GAME ENDPOINTS
// ==========================================

export async function gameAction(payload: {
  action: string;
  data?: any;
}): Promise<{ player: PlayerState; result?: Record<string, any> }> {
  const data = await makeRequest<any>('/game/action', {
    method: 'POST',
    body: JSON.stringify(deepStripUndefined(payload)),
  });

  const obj = ensureObject(data);

  return {
    player: extractPlayerPayload(data),
    result:
      ensureObject(obj?.result) ||
      ensureObject(obj?.data?.result) ||
      undefined,
  };
}

export async function gameActionWithFaction(payload: {
  action: string;
  data?: any;
}): Promise<{
  player: PlayerState;
  faction: FactionApiPayload;
  result?: Record<string, any>;
  factionBuffs?: Record<string, any> | null;
}> {
  const data = await makeRequest<any>('/game/action', {
    method: 'POST',
    body: JSON.stringify(deepStripUndefined(payload)),
  });

  const obj = ensureObject(data);
  const envelope = extractEnvelope(data);

  return {
    player: envelope.player,
    faction: envelope.faction,
    result:
      ensureObject(obj?.result) ||
      ensureObject(obj?.data?.result) ||
      undefined,
    factionBuffs:
      ensureObject(obj?.factionBuffs) ||
      ensureObject(obj?.data?.factionBuffs) ||
      null,
  };
}