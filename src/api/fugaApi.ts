const BACKEND_URL = 'https://comando-backend.onrender.com';
const TIMEOUT_MS = 10_000;

function getToken(): string {
  const token = localStorage.getItem('authToken');
  if (!token?.trim()) throw new Error('Usuário não autenticado');
  return token.trim();
}

function buildUrl(path: string): string {
  const base = BACKEND_URL.replace(/\/+$/, '');
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  return `${base}${endpoint}`;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(endpoint), {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${getToken()}`,
        ...(options.headers ?? {}),
      },
    });

    let data: unknown = null;
    try { data = await response.json(); } catch { data = null; }

    if (!response.ok) {
      const message = (data as any)?.error
        ?? (data as any)?.message
        ?? `Erro ${response.status}: ${response.statusText}`;
      throw Object.assign(new Error(message), { status: response.status, data });
    }

    return data as T;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export type BuyFugaVehiclePayload = {
  vehicleId: string;
  name: string;
  level: number;
  image?: string;
  description?: string;
  abilityBonusType?: string;
};

export type BuyFugaCatalogAccessoryPayload = {
  accessoryId: string;
  itemName: string;
  itemDescription?: string;
  itemPrice: number;
  itemImage?: string;
  skillType?: string;
};

export type BuyFugaVehicleUpgradePayload = {
  vehicleId: string;
  vehicleName?: string;
  vehicleLevel: number;
  upgradeKey: string;
  upgradeName: string;
  targetType: string;
  targetStat: string;
};

export type FugaPurchaseResponse = {
  ok?: boolean;
  player: unknown;
  item?: unknown;
  accessory?: unknown;
  upgrade?: unknown;
  statSource?: unknown;
  message?: string;
};

export async function buyFugaVehicle(payload: BuyFugaVehiclePayload): Promise<FugaPurchaseResponse> {
  return request<FugaPurchaseResponse>('/fuga/buy', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function buyFugaCatalogAccessory(
  payload: BuyFugaCatalogAccessoryPayload,
): Promise<FugaPurchaseResponse> {
  return request<FugaPurchaseResponse>('/fuga/accessory/buy', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function buyFugaVehicleUpgrade(
  payload: BuyFugaVehicleUpgradePayload,
): Promise<FugaPurchaseResponse> {
  return request<FugaPurchaseResponse>('/fuga/vehicle-upgrade/buy', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
