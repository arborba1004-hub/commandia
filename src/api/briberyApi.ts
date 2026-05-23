import type { PlayerState } from '@/store/playerStore';
import type { GangMemberType, GangStatSnapshot, GangStatSource } from '@/types/gang';

const BACKEND_URL = 'https://comando-backend.onrender.com';
const TIMEOUT_MS = 10_000;

export type PaySubornoResponse = {
  player: PlayerState;
  suborno: {
    previousLevel: number;
    briberyLevel: number;
    barracoLevel: number;
    cost: number;
    targetType: GangMemberType;
    stat: 'blindagem';
    bonusPercent: number;
    nextCost: number | null;
    statSources?: GangStatSource[];
    statSnapshot?: GangStatSnapshot;
  };
};

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
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(endpoint), {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${getToken()}`,
        ...(options.headers ?? {}),
      },
    });

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message =
        data && typeof data === 'object' && 'error' in data
          ? String((data as { error?: unknown }).error || 'Erro no suborno')
          : `Erro ${response.status}: ${response.statusText}`;
      throw new Error(message);
    }

    return data as T;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function paySuborno(): Promise<PaySubornoResponse> {
  return request<PaySubornoResponse>('/bribe', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
