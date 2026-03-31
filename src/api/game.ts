// src/api/game.ts

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://comando-backend.onrender.com';

interface GameActionPayload {
  action: string;
  payload?: Record<string, any>;
}

interface GameActionResponse {
  success: boolean;
  action: string;
  player: any;
  result: any;
  message: string;
  reels?: number[];
  resultType?: string;
}

async function getAuthToken(): Promise<string> {
  // Get token from localStorage
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('Token de autenticação não encontrado. Por favor, faça login.');
  }
  
  return token;
}

export async function gameRequest(action: string, payload?: Record<string, any>): Promise<GameActionResponse> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${BACKEND_URL}/game/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro na requisição do jogo.');
    }

    return response.json();
  } catch (error) {
    console.error('Game request error:', error);
    throw error;
  }
}

export async function executeSpinSlot(multiplier?: number): Promise<GameActionResponse> {
  return gameRequest('spin_slot', { multiplier });
}

export async function syncPlayerUpdate(player: Record<string, any>): Promise<any> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${BACKEND_URL}/player/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(player),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao sincronizar player.');
    }

    return response.json();
  } catch (error) {
    console.error('Player sync error:', error);
    throw error;
  }
}
