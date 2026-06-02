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

    let data: any = null;
    try { data = await response.json(); } catch { data = null; }

    if (!response.ok) {
      const message = data?.error ?? data?.message ?? `Erro ${response.status}: ${response.statusText}`;
      throw Object.assign(new Error(message), {
        status: response.status,
        data,
        retryAfter: data?.retryAfter,
        cooldownUntil: data?.cooldownUntil,
      });
    }

    return data as T;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export type QgEventPhase = 'preparation' | 'war' | 'final' | 'finished' | string;

export type QgEventAction = {
  id: string;
  label: string;
  description: string;
  points: number;
  heat: number;
  cooldownMs: number;
  finalOnly?: boolean;
  icon?: string;
};

export type QgEventFactionScore = {
  rank: number;
  factionId: string;
  factionName: string;
  factionTag: string;
  score: number;
  heat: number;
  participants: number;
  lastActionAt?: string | null;
};

export type QgEventParticipant = {
  playerId: string;
  playerName: string;
  avatar?: string;
  factionId: string;
  factionName: string;
  factionTag: string;
  score: number;
  heat: number;
  actions?: Record<string, number>;
  cooldowns?: Record<string, string>;
  joinedAt?: string | null;
  lastActionAt?: string | null;
  rewardClaimedAt?: string | null;
  reward?: any;
  rank?: number;
};

export type QgEventState = {
  ok: boolean;
  config: {
    title: string;
    subtitle: string;
    durationMs: number;
    preparationMs: number;
    finalRushMs: number;
    minBarracoLevel: number;
    maxActiveParticipantsPerFaction: number;
    winnerBuffDurationMs: number;
    actions: QgEventAction[];
    officeTitles: Array<{ id: string; title: string; description: string }>;
    winnerBuff: Record<string, number>;
  };
  eligibility: {
    hasFaction: boolean;
    factionId: string | null;
    factionName: string | null;
    factionTag: string | null;
    role: string | null;
    canStart: boolean;
    canJoin: boolean;
    barracoLevel: number;
    minBarracoLevel: number;
    reason?: string | null;
  };
  event: {
    id: string;
    slug: string;
    status: string;
    phase: QgEventPhase;
    title: string;
    startsAt: string;
    endsAt: string;
    settledAt?: string | null;
    winnerFactionId?: string | null;
    winnerFactionName?: string;
    winnerFactionTag?: string;
    leaderboard: QgEventFactionScore[];
    topParticipants: QgEventParticipant[];
    myParticipant?: QgEventParticipant | null;
    activityLog?: any[];
    rewardSummary?: any;
  } | null;
  phase?: QgEventPhase | null;
  actionResult?: {
    actionId: string;
    points: number;
    heat: number;
    cooldownUntil?: string;
  };
};

export function formatQGNumber(value: number): string {
  const safe = Number(value || 0);
  if (safe >= 1_000_000) return `${(safe / 1_000_000).toFixed(1)}M`;
  if (safe >= 1_000) return `${(safe / 1_000).toFixed(1)}K`;
  return safe.toLocaleString('pt-BR');
}

export function formatQGTimeLeft(targetIso?: string | null): string {
  if (!targetIso) return '--:--';
  const diff = Math.max(0, new Date(targetIso).getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export async function getQgEventState(): Promise<QgEventState> {
  return request<QgEventState>('/qg-event/state', { method: 'GET' });
}

export async function startQgEvent(): Promise<QgEventState> {
  return request<QgEventState>('/qg-event/start', { method: 'POST', body: JSON.stringify({}) });
}

export async function joinQgEvent(): Promise<QgEventState> {
  return request<QgEventState>('/qg-event/join', { method: 'POST', body: JSON.stringify({}) });
}

export async function submitQgEventAction(actionId: string): Promise<QgEventState> {
  return request<QgEventState>('/qg-event/action', {
    method: 'POST',
    body: JSON.stringify({ actionId }),
  });
}

export async function settleQgEvent(force = false): Promise<QgEventState> {
  return request<QgEventState>('/qg-event/settle', {
    method: 'POST',
    body: JSON.stringify({ force }),
  });
}
