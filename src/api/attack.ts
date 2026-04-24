const BACKEND_URL = 'https://comando-backend.onrender.com';

export type AttackSelection = {
  capanga: number;
  frente: number;
  executor: number;
  assassino: number;
  muralha: number;
  certeiro: number;
  motorista: number;
  nitro: number;
};

export type StartAttackPayload = {
  targetId: string;
  targetName?: string;
  targetTileX: number;
  targetTileY: number;
  originTileX: number;
  originTileY: number;
  selection: AttackSelection;
  selectedMemberIds?: string[];
};

export type StartAttackResponse = {
  success: boolean;
  battleId: string;
  status: 'travelling' | 'resolved' | 'cancelled';
  attackerId: string;
  attackerName: string;
  defenderId: string;
  defenderName: string;
  routeDistanceTiles: number;
  timePerTileMs: number;
  totalDurationMs: number;
  launchedAtIso: string;
  arriveAtIso: string;
  report?: any;
};

export type ResolveAttackResponse = {
  battleId: string;
  status: 'travelling' | 'resolved' | 'cancelled';
  attackerId: string;
  attackerName: string;
  defenderId: string;
  defenderName: string;
  routeDistanceTiles: number;
  timePerTileMs: number;
  totalDurationMs: number;
  launchedAtIso: string;
  arriveAtIso: string;
  report?: any;
};

function getAuthToken() {
  return localStorage.getItem('authToken');
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      typeof data?.error === 'string'
        ? data.error
        : typeof data?.message === 'string'
          ? data.message
          : 'Erro na requisição de ataque';

    const error = new Error(message) as Error & { status?: number; data?: any };
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export async function estimateAttack(payload: StartAttackPayload) {
  return request<any>('/battle/estimate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function startAttack(payload: StartAttackPayload) {
  return request<StartAttackResponse>('/battle/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resolveAttack(battleId: string) {
  return request<ResolveAttackResponse>(`/battle/resolve/${battleId}`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getAttackReport(battleId: string) {
  return request<ResolveAttackResponse>(`/battle/report/${battleId}`, {
    method: 'GET',
  });
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function resolveAttackWhenReady(
  battleId: string,
  options?: {
    maxAttempts?: number;
    intervalMs?: number;
  }
) {
  const maxAttempts = Math.max(1, Number(options?.maxAttempts ?? 8));
  const intervalMs = Math.max(200, Number(options?.intervalMs ?? 900));

  let lastError: unknown = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await resolveAttack(battleId);
    } catch (error: any) {
      lastError = error;

      if (error?.status === 409) {
        await wait(intervalMs);
        continue;
      }

      throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Não foi possível resolver o ataque no tempo esperado');
}
