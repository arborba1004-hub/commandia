const BACKEND_URL = 'https://comando-backend.onrender.com';

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

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error || 'Erro na requisição';
    throw new Error(message);
  }

  return data as T;
}

// ===== PERSISTIR TREINAMENTO =====
export async function persistTrainingState(payload: {
  trainingState: any;
  gangMembers: any[];
}) {
  return request('/api/training/persist', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ===== COLETAR MEMBROS TREINADOS =====
export async function collectTrainingMembers(payload: {
  slotKey: string;
  trainingState: any;
  memberType: string;
  quantity: number;
}) {
  return request('/api/training/collect', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ===== OBTER STATUS DO GANG =====
export async function getGangStatus() {
  return request('/api/training/status', {
    method: 'GET',
  });
}

// ===== CARREGAR ESTADO DE TREINAMENTO PERSISTIDO =====
export async function loadTrainingState() {
  return request<{
    trainingState: any[];
    gangMembers: any[];
  }>('/api/training/load', {
    method: 'GET',
  });
}