const BACKEND_URL = 'https://comando-backend.onrender.com';

export type SlotSymbol = 'money' | 'diamond' | 'gun' | 'police';

export type GiroCardDrop = {
  cardId: string;
  setId: string;
  setName?: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isGolden?: boolean;
};

export type GiroEconomyConfig = {
  corre?: {
    regenPerHour: number;
    regenSoftCap: number;
    dailyRewards: Array<{ day: number; corre: number; dirtyMoney?: number; cleanMoney?: number; chest?: string | null }>;
    factionRequestAmount?: number;
    factionDonationPerMember?: number;
  };
  giro?: {
    multipliers: number[];
    multiplierRisk: Record<number, { riskPercent: number; label: string }>;
    baseRewards?: Record<string, number>;
  };
};

export type SpinSlotResponse = {
  result: {
    reels: SlotSymbol[];
    outcome?: 'jackpot' | 'big' | 'medium' | 'small' | 'common' | 'prison';
    dirtyGain: number;
    baseDirtyGain?: number;
    prison: boolean;
    doublePolice: boolean;
    label: string;
    factionDirtyBonusPercent?: number;
    correCost?: number;
    multiplier?: number;
    riskPercent?: number;
    riskLabel?: string;
    prisonPenalty?: {
      loss: number;
      lossPct: number;
      cooldownMs: number;
      cooldownUntil: number;
      prisonCountInWindow: number;
    } | null;
    cooldownUntil?: number;
    cardDrop?: GiroCardDrop | null;
  };
  player: any;
  economy?: GiroEconomyConfig;
  factionBuffs?: any;
};

export type DailyCorreResponse = {
  ok: boolean;
  reward: { day: number; corre: number; dirtyMoney?: number; cleanMoney?: number; chest?: string | null };
  streak: number;
  cardDrop?: GiroCardDrop | null;
  economy?: GiroEconomyConfig;
  player: any;
};

function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

async function gameAction<T>(action: string, data: Record<string, unknown> = {}): Promise<T> {
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
    body: JSON.stringify({ action, data }),
  });

  let payload: any = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error || 'Erro ao executar ação do jogo';
    const err = Object.assign(new Error(message), {
      status: response.status,
      data: payload,
      retryAfter: payload?.retryAfter,
      cooldownUntil: payload?.cooldownUntil,
    });
    throw err;
  }

  return payload as T;
}

export async function spinSlot(multiplier: number): Promise<SpinSlotResponse> {
  return gameAction<SpinSlotResponse>('spin_slot', { multiplier });
}

export async function claimDailyCorre(): Promise<DailyCorreResponse> {
  return gameAction<DailyCorreResponse>('claim_daily_corre');
}

export async function getGiroState(): Promise<{ ok: boolean; economy?: GiroEconomyConfig; player: any }> {
  return gameAction<{ ok: boolean; economy?: GiroEconomyConfig; player: any }>('get_giro_state');
}
