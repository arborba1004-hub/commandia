/**
 * Central Player API Layer
 * 
 * Centraliza todas as requisições relacionadas ao player.
 * Prepara a estrutura para migração de endpoints genéricos para específicos.
 * 
 * Endpoints atuais (genéricos):
 * - GET /player/me → fetchCurrentPlayer()
 * - PATCH /player/update → syncPlayerUpdate()
 * 
 * Endpoints futuros (específicos):
 * - POST /laundry/start → laundryStart()
 * - POST /laundry/complete → laundryComplete()
 * - POST /arsenal/upgrade → arsenalUpgrade()
 * - etc...
 */

import type { PlayerState } from '@/store/playerStore';

const BACKEND_URL = 'https://comando-backend.onrender.com';

// ==========================================
// HELPER: Get Auth Token
// ==========================================
function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// ==========================================
// HELPER: Make Authenticated Request
// ==========================================
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || `Erro na requisição: ${endpoint}`);
  }

  return data;
}

// ==========================================
// PLAYER ENDPOINTS (GENÉRICOS - ATUAIS)
// ==========================================

/**
 * Busca os dados atuais do player do backend
 * Endpoint: GET /player/me
 */
export async function fetchCurrentPlayer(): Promise<PlayerState> {
  const data = await makeRequest<{ player: PlayerState }>('/player/me', {
    method: 'GET',
  });

  return data.player;
}

/**
 * Sincroniza os dados do player com o backend
 * Endpoint: PATCH /player/update
 */
export async function syncPlayerUpdate(player: Partial<PlayerState>): Promise<{ player: PlayerState }> {
  return makeRequest<{ player: PlayerState }>('/player/update', {
    method: 'PATCH',
    body: JSON.stringify(player),
  });
}

/**
 * Hidrata os dados do player do backend (usado para polling)
 * Alias para fetchCurrentPlayer() para compatibilidade com código existente
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
  return makeRequest<
    Array<{
      id: string;
      tileX: number;
      tileY: number;
      worldX: number;
      worldY: number;
    }>
  >('/players', {
    method: 'GET',
  });
}

// ==========================================
// LAUNDRY ENDPOINTS (ESPECÍFICOS - FUTUROS)
// ==========================================

/**
 * Inicia uma operação de lavagem de dinheiro
 * Endpoint: POST /laundry/start
 * 
 * Backend valida saldo, calcula tempo baseado em configuração do servidor,
 * retorna operationId e endsAt. Frontend apenas exibe contagem regressiva.
 */
export async function laundryStart(payload: {
  businessId: number;
  businessName: string;
  grossAmount: number;
  feePercentage: number;
  feeAmount: number;
  netAmount: number;
}): Promise<{ operationId: string; endsAt: string; player: PlayerState }> {
  return makeRequest<{ operationId: string; endsAt: string; player: PlayerState }>('/laundry/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Completa uma operação de lavagem de dinheiro
 * Endpoint: POST /laundry/complete/{operationId}
 * 
 * Backend verifica se o tempo já passou e credita o dinheiro limpo.
 * Frontend chama este endpoint quando o timer chega a 0.
 */
export async function laundryComplete(operationId: string): Promise<{ player: PlayerState }> {
  return makeRequest<{ player: PlayerState }>('/laundry/complete', {
    method: 'POST',
    body: JSON.stringify({ operationId }),
  });
}

/**
 * Verifica se o jogador pode realizar uma operação de lavagem hoje
 * Endpoint: GET /laundry/can-operate/{businessId}
 * 
 * Backend consulta lastOperationDate e número de operações por dia (UTC).
 * Retorna se o jogador pode operar neste negócio hoje.
 */
export async function canOperateLaundry(businessId: number): Promise<{ allowed: boolean }> {
  return makeRequest<{ allowed: boolean }>(`/laundry/can-operate/${businessId}`, {
    method: 'GET',
  });
}

// ==========================================
// ARSENAL ENDPOINTS (ESPECÍFICOS - FUTUROS)
// ==========================================

/**
 * Faz upgrade de um item do arsenal
 * Endpoint: POST /arsenal/upgrade (futuro)
 */
export async function arsenalUpgrade(payload: {
  itemId: string;
  level: number;
}): Promise<{ player: PlayerState }> {
  // TODO: Implementar quando endpoint estiver disponível
  // return makeRequest<{ player: PlayerState }>('/arsenal/upgrade', {
  //   method: 'POST',
  //   body: JSON.stringify(payload),
  // });

  throw new Error('arsenalUpgrade não implementado ainda');
}

// ==========================================
// GIRO ENDPOINTS (ESPECÍFICOS - FUTUROS)
// ==========================================

/**
 * Inicia uma operação de giro
 * Endpoint: POST /giro/start (futuro)
 */
export async function giroStart(payload: {
  amount: number;
  duration: number;
}): Promise<{ player: PlayerState }> {
  // TODO: Implementar quando endpoint estiver disponível
  // return makeRequest<{ player: PlayerState }>('/giro/start', {
  //   method: 'POST',
  //   body: JSON.stringify(payload),
  // });

  throw new Error('giroStart não implementado ainda');
}

// ==========================================
// GAME ENDPOINTS (ESPECÍFICOS - FUTUROS)
// ==========================================

/**
 * Executa uma ação no jogo
 * Endpoint: POST /game/action
 * 
 * Consolidado em playerApi.ts como cliente único do jogador
 */
export async function gameAction(payload: {
  action: string;
  data?: any;
}): Promise<{ player: PlayerState }> {
  return makeRequest<{ player: PlayerState }>('/game/action', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
