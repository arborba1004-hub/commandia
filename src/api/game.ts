const BACKEND_URL = 'https://comando-backend.onrender.com';

// ==========================================
// GAME ACTION (FUTURO MULTIPLAYER)
// ==========================================
export async function gameRequest(action: string, payload: any) {
  const token = localStorage.getItem('authToken');

  const response = await fetch(`${BACKEND_URL}/game/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      action,
      payload,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || 'Erro no gameRequest');
  }

  return data;
}

// ==========================================
// PLAYER SYNC (CRÍTICO)
// ==========================================
export async function syncPlayerUpdate(player: any) {
  const token = localStorage.getItem('authToken');

  if (!token) return;

  const response = await fetch(`${BACKEND_URL}/player/update`, {
    method: 'PATCH', // 🔥 CORREÇÃO
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(player),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || 'Erro ao sincronizar player');
  }

  return data;
}