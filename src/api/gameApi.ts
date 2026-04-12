const BACKEND_URL = 'https://comando-backend.onrender.com';

export type SlotSymbol = 'money' | 'diamond' | 'gun' | 'police';

export type SpinSlotResponse = {
  result: {
    reels: SlotSymbol[];
    dirtyGain: number;
    baseDirtyGain?: number;
    prison: boolean;
    doublePolice: boolean;
    label: string;
    factionDirtyBonusPercent?: number;
  };
  player: any;
  factionBuffs?: any;
};

function getAuthToken(): string | null {
  return (
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt') ||
    localStorage.getItem('wix_auth_token')
  );
}

export async function spinSlot(multiplier: number): Promise<SpinSlotResponse> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  const response = await fetch(`${BACKEND_URL}/game/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: 'spin_slot',
      data: { multiplier },
    }),
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Erro ao girar a máquina');
  }

  return data as SpinSlotResponse;
}