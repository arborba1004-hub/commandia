const BACKEND_URL = 'https://comando-backend.onrender.com';

export type OtherPlayerMapItem = {
  id?: string;
  _id?: string;
  name?: string;
  tileX: number;
  tileY: number;
  worldX?: number;
  worldY?: number;
  barracoLevel?: number;
  power?: number;
  dirtyMoney?: number;
  factionId?: string | null;
};

function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

export async function fetchOtherPlayersMap(): Promise<OtherPlayerMapItem[]> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${BACKEND_URL}/players`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let data: any = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.error || 'Erro ao buscar jogadores do mapa');
    }

    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Timeout ao buscar jogadores do mapa');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}