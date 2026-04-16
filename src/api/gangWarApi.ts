import type {
  GangBattleCasualtyResult,
  GangMemberType,
  GangWarApiEnvelope,
} from '@/types/gangWar';

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

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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

      clearTimeout(timeoutId);

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const error = new Error(data?.error || `Erro ${response.status}: ${response.statusText}`) as Error & {
          status?: number;
          data?: unknown;
        };
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Tempo limite excedido ao conectar com o servidor da gangue.');
      }
      throw error;
    }
  } catch (error: any) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Não foi possível conectar ao servidor da gangue. Verifique sua conexão.');
    }
    throw error;
  }
}

export async function fetchMyGang(): Promise<GangWarApiEnvelope> {
  return request<GangWarApiEnvelope>('/gang-war/me', {
    method: 'GET',
  });
}

export async function recruitGangMember(type: GangMemberType): Promise<GangWarApiEnvelope> {
  return request<GangWarApiEnvelope>('/gang-war/recruit', {
    method: 'POST',
    body: JSON.stringify({ type }),
  });
}

export async function startGangTraining(memberId: string): Promise<GangWarApiEnvelope> {
  return request<GangWarApiEnvelope>('/gang-war/train/start', {
    method: 'POST',
    body: JSON.stringify({ characterId: memberId }),
  });
}

export async function completeGangTrainings(): Promise<GangWarApiEnvelope> {
  return request<GangWarApiEnvelope>('/gang-war/train/complete', {
    method: 'POST',
  });
}

export async function upgradeGangCT(): Promise<GangWarApiEnvelope> {
  return request<GangWarApiEnvelope>('/gang-war/ct/upgrade', {
    method: 'POST',
  });
}

export async function payGangMaintenance(): Promise<GangWarApiEnvelope> {
  return request<GangWarApiEnvelope>('/gang-war/maintenance/pay', {
    method: 'POST',
  });
}

export async function applyGangBattleLosses(payload: {
  losses: GangBattleCasualtyResult;
}): Promise<GangWarApiEnvelope> {
  return request<GangWarApiEnvelope>('/gang-war/apply-battle-losses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function setGangFormation(
  formation: 'pressao_total' | 'linha_fechada' | 'bote_certo' | 'cerco' | 'saque_rapido'
): Promise<GangWarApiEnvelope> {
  return request<GangWarApiEnvelope>('/gang-war/formation/set', {
    method: 'POST',
    body: JSON.stringify({ formation }),
  });
}