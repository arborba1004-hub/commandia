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
};

function getAuthToken(): string | null {
  return (
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt') ||
    localStorage.getItem('wix_auth_token')
  );
}

export async function fetchOtherPlayersMap(): Promise<OtherPlayerMapItem[]> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  const response = await fetch(`${BACKEND_URL}/players`, {
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
}