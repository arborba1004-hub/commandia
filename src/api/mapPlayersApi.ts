export type MapPlayerSnapshot = {
  id: string;
  name?: string;
  tileX: number;
  tileY: number;
  barracoLevel?: number;
  power?: number;
  factionId?: string | null;
};

const BACKEND_URL = 'https://comando-backend.onrender.com';
const REQUEST_TIMEOUT_MS = 15000;

function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

export async function fetchMapPlayersSnapshot(
  limit = 1000
): Promise<MapPlayerSnapshot[]> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${BACKEND_URL}/players/snapshot?limit=${encodeURIComponent(limit)}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
        cache: 'no-store',
      }
    );

    let data: unknown = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message =
        typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        typeof (data as any).error === 'string'
          ? (data as any).error
          : 'Erro ao buscar snapshot do mapa';

      throw new Error(message);
    }

    return Array.isArray(data) ? (data as MapPlayerSnapshot[]) : [];
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Timeout ao buscar snapshot do mapa');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}