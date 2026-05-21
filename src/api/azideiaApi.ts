import type {
  AzideiaAttackResult,
  AzideiaClaimResult,
  AzideiaRewardStatus,
  AzideiaTargetsResponse,
} from '@/types/azideia';

const BACKEND_URL = 'https://comando-backend.onrender.com';
const TIMEOUT_MS = 10_000;

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
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

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
    try { data = await response.json(); } catch { data = null; }

    if (!response.ok) {
      const message = (data as any)?.error
        ?? (data as any)?.message
        ?? `Erro ${response.status}: ${response.statusText}`;
      throw Object.assign(new Error(message), { status: response.status, data });
    }

    return data as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getAzideiaX9Targets(): Promise<AzideiaTargetsResponse> {
  return request<AzideiaTargetsResponse>('/azideia/x9/targets', { method: 'GET' });
}

export async function attackAzideiaX9(targetId: string): Promise<AzideiaAttackResult> {
  return request<AzideiaAttackResult>(`/azideia/x9/${encodeURIComponent(targetId)}/attack`, {
    method: 'POST',
  });
}

export async function getAzideiaRewardStatus(): Promise<AzideiaRewardStatus> {
  return request<AzideiaRewardStatus>('/azideia/rewards/me', { method: 'GET' });
}

export async function claimAzideiaRewards(): Promise<AzideiaClaimResult> {
  return request<AzideiaClaimResult>('/azideia/rewards/claim', { method: 'POST' });
}
