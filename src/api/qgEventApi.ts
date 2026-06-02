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
      throw Object.assign(new Error(message), { status: response.status, data });
    }

    return data as T;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export type QgEventStatus = 'scheduled' | 'active' | 'appointment' | 'mandate' | 'closed' | 'cancelled' | string;
export type QgLocationKey = 'qg' | 'ct_nw' | 'ct_ne' | 'ct_sw' | 'ct_se';
export type QgMemberType = 'capanga' | 'frente' | 'executor' | 'assassino' | 'muralha' | 'certeiro' | 'motorista' | 'nitro';
export type QgSelection = Partial<Record<QgMemberType, number>>;

export type QgLocationConfig = {
  key: QgLocationKey;
  kind: 'qg' | 'ct';
  name: string;
  shortName: string;
  description: string;
  position: { x: number; z: number };
  accent: string;
};

export type QgMandateRoleConfig = {
  id: string;
  title: string;
  description: string;
  percent: Record<string, number>;
};

export type QgLocationState = {
  key: QgLocationKey;
  kind: 'qg' | 'ct';
  name: string;
  shortName: string;
  description: string;
  accent: string;
  occupantFactionId: string | null;
  occupantFactionName: string;
  occupantFactionTag: string;
  occupiedSince: string | null;
  currentHoldMs: number;
  capacity: number;
  garrisonCount: number;
  garrisonPower: number;
  firstOccupantPlayerId?: string;
  firstOccupantPlayerName?: string;
  totalDamageDealt: number;
  hostileToQG: boolean;
};

export type QgFactionScore = {
  rank: number;
  factionId: string;
  factionName: string;
  factionTag: string;
  contribution: number;
  qgHoldMs: number;
  qgMaxContinuousHoldMs: number;
  qgCaptures: number;
  ctCaptures: number;
  ctDamageDealt: number;
  participants: number;
  lastActionAt?: string | null;
};

export type QgParticipant = {
  playerId: string;
  playerName: string;
  avatar?: string;
  factionId: string;
  factionName: string;
  factionTag: string;
  contribution: number;
  qgCaptures: number;
  ctCaptures: number;
  defensesWon: number;
  troopsSent: number;
  troopsLost: number;
  lastActionAt?: string | null;
  reward?: any;
  rewardGrantedAt?: string | null;
  rank?: number;
};

export type QgEventState = {
  ok: boolean;
  config: {
    slug: string;
    title: string;
    subtitle: string;
    timezone: string;
    intervalMs: number;
    startHourLocal: number;
    startMinuteLocal: number;
    warningMs: number;
    requiredHoldMs: number;
    maxBattleMs: number;
    appointmentMs: number;
    mandateMs: number;
    minBarracoLevel: number;
    tickMs: number;
    locations: QgLocationConfig[];
    mandateRoles: QgMandateRoleConfig[];
    factionBuff: Record<string, number>;
  };
  eligibility: {
    hasFaction: boolean;
    factionId: string | null;
    factionName: string | null;
    factionTag: string | null;
    role: string | null;
    canMarch: boolean;
    canAppoint: boolean;
    barracoLevel: number;
    minBarracoLevel: number;
    marchCapacity: number;
    reason?: string | null;
  };
  event: {
    id: string;
    slug: string;
    status: QgEventStatus;
    title: string;
    startsAt: string;
    endsAt: string;
    appointmentEndsAt?: string | null;
    mandateEndsAt?: string | null;
    settledAt?: string | null;
    winnerFactionId?: string | null;
    winnerFactionName?: string;
    winnerFactionTag?: string;
    winnerReason?: string;
    locations: QgLocationState[];
    qg: QgLocationState;
    leaderboard: QgFactionScore[];
    topParticipants: QgParticipant[];
    myParticipant?: QgParticipant | null;
    mandate?: any;
    rewardSummary?: any;
    activityLog?: any[];
  } | null;
  serverTime: string;
  marchResult?: {
    locationKey: QgLocationKey;
    outcome: string;
    membersSent: number;
    power: number;
    attackerLost: number;
    defenderLost: number;
  };
};

export const QG_MEMBER_TYPES: QgMemberType[] = ['capanga', 'frente', 'executor', 'assassino', 'muralha', 'certeiro', 'motorista', 'nitro'];

export const QG_MEMBER_LABELS: Record<QgMemberType, string> = {
  capanga: 'Capanga',
  frente: 'Frente',
  executor: 'Executor',
  assassino: 'Assassino',
  muralha: 'Muralha',
  certeiro: 'Certeiro',
  motorista: 'Motorista',
  nitro: 'Nitro',
};

export function formatQGNumber(value: number): string {
  const safe = Number(value || 0);
  if (safe >= 1_000_000) return `${(safe / 1_000_000).toFixed(1)}M`;
  if (safe >= 1_000) return `${(safe / 1_000).toFixed(1)}K`;
  return safe.toLocaleString('pt-BR');
}

export function formatQGDuration(ms?: number | null): string {
  const safe = Math.max(0, Math.floor(Number(ms || 0)));
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatQGTimeLeft(targetIso?: string | null): string {
  if (!targetIso) return '--:--';
  return formatQGDuration(Math.max(0, new Date(targetIso).getTime() - Date.now()));
}

export function formatQGClock(value?: string | null): string {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export async function getQgEventState(): Promise<QgEventState> {
  return request<QgEventState>('/qg-event/state', { method: 'GET' });
}

export async function sendQgMarch(locationKey: QgLocationKey, selection: QgSelection): Promise<QgEventState> {
  return request<QgEventState>('/qg-event/march', {
    method: 'POST',
    body: JSON.stringify({ locationKey, selection }),
  });
}

export async function appointQgRole(roleId: string, playerId: string): Promise<QgEventState> {
  return request<QgEventState>('/qg-event/appoint-role', {
    method: 'POST',
    body: JSON.stringify({ roleId, playerId }),
  });
}

export async function reconcileQgEvent(): Promise<QgEventState> {
  return request<QgEventState>('/qg-event/reconcile', { method: 'POST', body: JSON.stringify({}) });
}
