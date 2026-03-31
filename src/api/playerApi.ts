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

// ==========================================
// LAUNDRY ENDPOINTS (ESPECÍFICOS - FUTUROS)
// ==========================================

/**
 * Inicia uma operação de lavagem de dinheiro
 * Endpoint: POST /laundry/start (futuro)
 * 
 * Atualmente usa o endpoint genérico /player/update
 * Será migrado para endpoint específico quando disponível
 */
export async function laundryStart(payload: {
  businessId: number;
  businessName: string;
  grossAmount: number;
  feePercentage: number;
  feeAmount: number;
  netAmount: number;
  duration: number; // em ms
}): Promise<{ player: PlayerState }> {
  // TODO: Migrar para POST /laundry/start quando disponível
  // return makeRequest<{ player: PlayerState }>('/laundry/start', {
  //   method: 'POST',
  //   body: JSON.stringify(payload),
  // });

  // Por enquanto, usa o endpoint genérico
  const currentPlayer = await fetchCurrentPlayer();
  const startedAt = new Date().toISOString();
  const endsAt = new Date(Date.now() + payload.duration).toISOString();

  return syncPlayerUpdate({
    laundryProgress: {
      ...currentPlayer.laundryProgress,
      activeOperations: [
        ...currentPlayer.laundryProgress.activeOperations,
        {
          businessId: payload.businessId,
          businessName: payload.businessName,
          startedAt,
          endsAt,
          grossAmount: payload.grossAmount,
          feePercentage: payload.feePercentage,
          feeAmount: payload.feeAmount,
          netAmount: payload.netAmount,
          status: 'processing',
        },
      ],
    },
    balances: {
      ...currentPlayer.balances,
      dirtyMoney: currentPlayer.balances.dirtyMoney - payload.grossAmount,
    },
  });
}

/**
 * Completa uma operação de lavagem de dinheiro
 * Endpoint: POST /laundry/complete (futuro)
 * 
 * Atualmente usa o endpoint genérico /player/update
 * Será migrado para endpoint específico quando disponível
 */
export async function laundryComplete(businessId: number): Promise<{ player: PlayerState }> {
  // TODO: Migrar para POST /laundry/complete quando disponível
  // return makeRequest<{ player: PlayerState }>('/laundry/complete', {
  //   method: 'POST',
  //   body: JSON.stringify({ businessId }),
  // });

  // Por enquanto, usa o endpoint genérico
  const currentPlayer = await fetchCurrentPlayer();
  const today = new Date().toISOString().split('T')[0];

  const operationIndex = currentPlayer.laundryProgress.activeOperations.findIndex(
    (op) => op.businessId === businessId && op.status === 'processing'
  );

  if (operationIndex === -1) {
    throw new Error('Operação não encontrada');
  }

  const operation = currentPlayer.laundryProgress.activeOperations[operationIndex];
  const activeOps = currentPlayer.laundryProgress.activeOperations.filter(
    (_, idx) => idx !== operationIndex
  );

  return syncPlayerUpdate({
    laundryProgress: {
      activeOperations: activeOps,
      dailyOperations: [
        ...currentPlayer.laundryProgress.dailyOperations,
        {
          businessId: operation.businessId,
          date: today,
          amount: operation.netAmount,
        },
      ],
    },
    balances: {
      ...currentPlayer.balances,
      cleanMoney: currentPlayer.balances.cleanMoney + operation.netAmount,
    },
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
 * Endpoint: POST /game/action (futuro específico)
 */
export async function gameAction(payload: {
  action: string;
  data?: any;
}): Promise<{ player: PlayerState }> {
  // TODO: Migrar de /game/action genérico para endpoints específicos
  // return makeRequest<{ player: PlayerState }>('/game/action', {
  //   method: 'POST',
  //   body: JSON.stringify(payload),
  // });

  throw new Error('gameAction não implementado ainda');
}
