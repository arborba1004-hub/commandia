/**
 * api/gangApi.ts
 * API unificada da gangue.
 * Substitui: gangWarApi.ts, training.ts
 *
 * Todos os endpoints do backend /gang-war/* estão aqui.
 * Um único request() com timeout, token e tratamento de erro.
 */

import type {
  GangApiEnvelope,
  GangFormationType,
  GangMemberType,
  GangTroopSelection,
  GangStatSnapshot,
  GangStatSource,
} from '@/types/gang';

// ═════════════════════════════════════════════════════════════════════════════
// CONFIG
// ═════════════════════════════════════════════════════════════════════════════

const BACKEND_URL = 'https://comando-backend.onrender.com';
const TIMEOUT_MS  = 10_000;

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS INTERNOS
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
      const msg = (data as any)?.error ?? `Erro ${response.status}: ${response.statusText}`;
      const err = Object.assign(new Error(msg), { status: response.status, data });
      throw err;
    }

    return data as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ENDPOINTS
// ═════════════════════════════════════════════════════════════════════════════

/** Carrega o estado completo da gangue do jogador autenticado. */
export async function fetchMyGang(): Promise<GangApiEnvelope> {
  return request('/gang-war/me', { method: 'GET' });
}

/**
 * Recruta um novo membro do tipo especificado.
 * Custo em dinheiro sujo debitado pelo backend.
 */
export async function recruitGangMember(type: GangMemberType): Promise<GangApiEnvelope> {
  return request('/gang-war/recruit', {
    method: 'POST',
    body: JSON.stringify({ type }),
  });
}

/**
 * Enfileira um lote de treinamento num slot de CT.
 * O backend determina quantidade × tempo com base no nível do barraco.
 */
export async function queueGangTraining(
  type: GangMemberType,
  quantity: number
): Promise<GangApiEnvelope> {
  return request('/gang-war/train/queue', {
    method: 'POST',
    body: JSON.stringify({ type, quantity }),
  });
}

/**
 * Coleta os membros de treinamentos concluídos.
 * Backend verifica endsAt e move membros de 'treinando' → 'ativo'.
 */
export async function completeGangTrainings(): Promise<GangApiEnvelope> {
  return request('/gang-war/train/complete', { method: 'POST' });
}

/** Eleva o nível do CT do jogador (custo escalonado). */
export async function upgradeGangCT(): Promise<GangApiEnvelope> {
  return request('/gang-war/ct/upgrade', { method: 'POST' });
}

/** Paga a manutenção diária da gangue. */
export async function payGangMaintenance(): Promise<GangApiEnvelope> {
  return request('/gang-war/maintenance/pay', { method: 'POST' });
}

/**
 * Define a formação ativa da gangue.
 * Dispara os bônus de estatísticas correspondentes (ver gangEstatisticasStore).
 */
export async function setGangFormation(
  formation: GangFormationType
): Promise<GangApiEnvelope> {
  return request('/gang-war/formation/set', {
    method: 'POST',
    body: JSON.stringify({ formation }),
  });
}

/**
 * Aplica baixas de batalha à gangue do jogador.
 * Normalmente chamado APÓS o backend resolver o ataque —
 * mas mantido para sincronização manual quando necessário.
 */
export async function applyGangBattleLosses(payload: {
  losses: {
    mortos: Record<string, number>;
    feridos: Record<string, number>;
  };
}): Promise<GangApiEnvelope> {
  return request('/gang-war/apply-battle-losses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// ESTATÍSTICAS ALIMENTADAS DA GANGUE
// ═════════════════════════════════════════════════════════════════════════════

export type GangStatsEnvelope = {
  statSources: GangStatSource[];
  statSnapshot: GangStatSnapshot;
  gang?: {
    members?: unknown[];
    statSources?: GangStatSource[];
    statSnapshot?: GangStatSnapshot;
  };
};

/** Carrega as fontes salvas e o snapshot efetivo das estatísticas da gangue. */
export async function fetchGangStats(): Promise<GangStatsEnvelope> {
  return request('/gang-war/stats', { method: 'GET' });
}

/** Cria ou atualiza uma fonte de estatística da gangue. */
export async function upsertGangStatSource(
  source: Partial<GangStatSource> & Pick<GangStatSource, 'source' | 'label' | 'targetScope'>
): Promise<GangStatsEnvelope & { source: GangStatSource }> {
  return request('/gang-war/stats/source', {
    method: 'POST',
    body: JSON.stringify(source),
  });
}

/** Remove uma fonte de estatística da gangue pelo id. */
export async function removeGangStatSource(
  sourceId: string
): Promise<GangStatsEnvelope & { removed: boolean }> {
  return request(`/gang-war/stats/source/${encodeURIComponent(sourceId)}`, {
    method: 'DELETE',
  });
}
