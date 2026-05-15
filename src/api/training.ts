import type { GangMemberType } from '@/components/gang/GangMembros';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  'https://comando-backend.onrender.com';

function getAuthToken() {
  return localStorage.getItem('authToken');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      `Erro HTTP ${res.status}`
    );
  }

  return data as T;
}

export type TrainingSlot = {
  id: string;
  ctKey: string;
  troopType: GangMemberType;
  quantity: number;
  startedAt: number;
  endsAt: number;
  status: 'training' | 'completed';
  cost: number;
};

export type TrainingApiResponse = {
  ok: boolean;
  gang: any;
  trainingSlots: TrainingSlot[];
  balances: {
    dirtyMoney: number;
    cleanMoney: number;
    corre: number;
  };
};

export async function fetchTrainingStatus() {
  return request<TrainingApiResponse>('/api/training/status', {
    method: 'GET',
  });
}

export async function startTraining(
  ctKey: string,
  troopType: GangMemberType
) {
  return request<TrainingApiResponse>('/api/training/start', {
    method: 'POST',
    body: JSON.stringify({
      ctKey,
      troopType,
    }),
  });
}

export async function collectTraining(slotId: string) {
  return request<TrainingApiResponse>('/api/training/collect', {
    method: 'POST',
    body: JSON.stringify({
      slotId,
    }),
  });
}
