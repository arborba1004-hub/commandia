const BACKEND_URL = 'https://comando-backend.onrender.com';

export type OtherPlayerMapItem = {
  id?: string;
  _id?: string;
  name?: string;
  tileX: number;
  tileY: number;
  barracoLevel?: number;
  power?: number;
  factionId?: string | null;
};

export type FetchOtherPlayersMapParams = {
  centerTileX: number;
  centerTileY: number;
  radius?: number;
  limit?: number;
};

function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

export async function fetchOtherPlayersMap(
  params: FetchOtherPlayersMapParams
): Promise<OtherPlayerMapItem[]> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);

  const searchParams = new URLSearchParams({
    centerTileX: String(params.centerTileX),
    centerTileY: String(params.centerTileY),
    radius: String(params.radius ?? 12),
    limit: String(params.limit ?? 18),
  });

  try {
    const response = await fetch(`${BACKEND_URL}/players?${searchParams.toString()}`, {
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