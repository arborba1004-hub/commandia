const BACKEND_URL = 'https://comando-backend.onrender.com';

function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

async function factionInviteRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Erro no sistema de convites da facção');
  }

  return data as T;
}

export type PlayerWithoutFaction = {
  id: string;
  name: string;
  avatar: string;
  power: number;
  hierarchyBadge: string;
  barracoLevel: number;
  factionId: string | null;
  mapPosition?: any;
};

export async function fetchPlayersWithoutFaction(): Promise<PlayerWithoutFaction[]> {
  const response = await factionInviteRequest<{ ok: boolean; players: PlayerWithoutFaction[] }>(
    '/faction-invite/players-without-faction',
    { method: 'GET' }
  );

  return Array.isArray(response.players) ? response.players : [];
}

export async function invitePlayerToFaction(targetPlayerId: string): Promise<boolean> {
  await factionInviteRequest(
    '/faction-invite/invite',
    {
      method: 'POST',
      body: JSON.stringify({ targetPlayerId }),
    }
  );

  return true;
}