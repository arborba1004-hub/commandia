/**
 * Central Player API Layer (BLINDADO)
 *
 * Objetivos desta versão:
 * - Tornar as requisições resilientes
 * - Padronizar leitura de resposta do backend
 * - Preservar status HTTP nos erros
 * - Evitar quebra quando backend retorna HTML, vazio ou shape inesperado
 * - Garantir autenticação consistente
 * - Manter compatibilidade com o playerStore atual
 */

import type { PlayerState } from '@/store/playerStore';

const BACKEND_URL = 'https://comando-backend.onrender.com';
const REQUEST_TIMEOUT_MS = 30000;

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
    };

type ApiError = Error & {
  status?: number;
  data?: unknown;
  endpoint?: string;
};

// ==========================================
// HELPERS DE AUTH
// ==========================================
function getAuthToken(): string | null {
  const candidates = [
    localStorage.getItem('authToken'),
    localStorage.getItem('token'),
    localStorage.getItem('jwt'),
    localStorage.getItem('wix_auth_token'),
  ];

  for (const token of candidates) {
    if (token && token.trim()) {
      return token.trim();
    }
  }

  return null;
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
// CORE REQUEST
// ==========================================
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
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
  const cleanPayload = deepStripUndefined(player);

  const data = await makeRequest<ApiEnvelope<PlayerState>>('/player/update', {
    method: 'PATCH',
    body: JSON.stringify(cleanPayload),
  });

  return {
    player: extractPlayerPayload(data),
  };
}

/**
 * Hidrata os dados do player do backend (compatibilidade)
 */
export async function hydratePlayerFromBackend(): Promise<PlayerState> {
  return fetchCurrentPlayer();
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
  const data = await makeRequest<any>('/players', {
    method: 'GET',
  });

  const players = extractArrayPayload<any>(data);

  return players.map((player) => ({
    id: String(player.id ?? player._id ?? ''),
    tileX: Number(player.tileX ?? player.mapPosition?.tileX ?? 20),
    tileY: Number(player.tileY ?? player.mapPosition?.tileY ?? 10),
    worldX: Number(player.worldX ?? player.mapPosition?.worldX ?? 0),
    worldY: Number(player.worldY ?? player.mapPosition?.worldY ?? 0),
  }));
}

// ==========================================
// LAUNDRY ENDPOINTS
// ==========================================

export async function laundryStart(payload: {
  businessId: number;
  businessName: string;
  grossAmount: number;
  feePercentage: number;
  feeAmount: number;
  netAmount: number;
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
}): Promise<{ player: PlayerState }> {
  const data = await makeRequest<any>('/game/action', {
    method: 'POST',
    body: JSON.stringify(deepStripUndefined(payload)),
  });

  return {
    player: extractPlayerPayload(data),
  };
}