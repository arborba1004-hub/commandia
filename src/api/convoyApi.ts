import type { ConvoyApiEnvelope, ConvoySkinId, PlayerConvoyInventory } from '@/types/convoy';
import { DEFAULT_CONVOY_SKIN_ID, ensureDefaultOwned, normalizeConvoySkinId } from '@/data/convoyCatalog';

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
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

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
    clearTimeout(timeoutId);
  }
}

function normalizeInventory(raw: any): PlayerConvoyInventory {
  const ownedSkinIds = ensureDefaultOwned(raw?.ownedSkinIds ?? raw?.convoys?.ownedSkinIds ?? []);
  const equipped = normalizeConvoySkinId(raw?.equippedSkinId ?? raw?.convoys?.equippedSkinId ?? DEFAULT_CONVOY_SKIN_ID);

  return {
    ownedSkinIds,
    equippedSkinId: ownedSkinIds.includes(equipped) ? equipped : DEFAULT_CONVOY_SKIN_ID,
    player: raw?.player,
  };
}

export async function getMyConvoys(): Promise<PlayerConvoyInventory> {
  const raw = await request<ConvoyApiEnvelope>('/convoys/me', { method: 'GET' });
  return normalizeInventory(raw);
}

export async function purchaseConvoy(skinId: ConvoySkinId): Promise<PlayerConvoyInventory> {
  const raw = await request<ConvoyApiEnvelope>('/convoys/purchase', {
    method: 'POST',
    body: JSON.stringify({ skinId }),
  });
  return normalizeInventory(raw);
}

export async function equipConvoy(skinId: ConvoySkinId): Promise<PlayerConvoyInventory> {
  const raw = await request<ConvoyApiEnvelope>('/convoys/equip', {
    method: 'POST',
    body: JSON.stringify({ skinId }),
  });
  return normalizeInventory(raw);
}


export type MercadoPagoConvoyCheckout = {
  purchaseId?: string;
  preferenceId?: string;
  checkoutUrl?: string;
  initPoint?: string;
  sandboxInitPoint?: string;
  alreadyOwned?: boolean;
  owned?: boolean;
  player?: unknown;
};

export async function createRealMoneyConvoyCheckout(skinId: ConvoySkinId): Promise<MercadoPagoConvoyCheckout> {
  return request<MercadoPagoConvoyCheckout>('/payments/checkout/convoy', {
    method: 'POST',
    body: JSON.stringify({ skinId }),
  });
}

export async function getRealMoneyPurchaseStatus(purchaseId: string): Promise<{ status: string; convoySkinId: string; grantedAt?: string | null }> {
  return request<{ status: string; convoySkinId: string; grantedAt?: string | null }>(`/payments/purchases/${encodeURIComponent(purchaseId)}`, { method: 'GET' });
}

export type MercadoPagoBrickConfig = {
  publicKey: string;
  env: 'sandbox' | 'production' | string;
};

export type MercadoPagoBrickPaymentResult = {
  purchaseId: string;
  paymentId?: string | number;
  status: string;
  statusDetail?: string;
  paymentTypeId?: string;
  paymentMethodId?: string;
  convoySkinId: ConvoySkinId;
  amount: number;
  currency: string;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  player?: unknown;
  message?: string;
};

export async function getMercadoPagoBrickConfig(): Promise<MercadoPagoBrickConfig> {
  return request<MercadoPagoBrickConfig>('/payments/brick/config', { method: 'GET' });
}

export async function createMercadoPagoBrickConvoyPayment(
  skinId: ConvoySkinId,
  paymentData: unknown,
): Promise<MercadoPagoBrickPaymentResult> {
  return request<MercadoPagoBrickPaymentResult>('/payments/brick/convoy', {
    method: 'POST',
    body: JSON.stringify({ skinId, paymentData }),
  });
}

export type ConvoyAcceleratorInventory = {
  accelerators: {
    twoX: number;
  };
  priceDirtyMoney: number;
  player?: unknown;
};

export type UseConvoyAcceleratorResult = ConvoyAcceleratorInventory & {
  battleId: string;
  arriveAtIso: string;
  launchedAtIso: string;
  totalDurationMs: number;
  timePerTileMs?: number;
  routeTiles?: Array<{ tileX: number; tileY: number }>;
  remainingBeforeMs?: number;
  remainingAfterMs?: number;
  acceleratorUses?: number;
};

function normalizeAccelerators(raw: any): ConvoyAcceleratorInventory {
  return {
    accelerators: {
      twoX: Math.max(0, Math.floor(Number(raw?.accelerators?.twoX ?? raw?.twoX ?? 0))),
    },
    priceDirtyMoney: Math.max(0, Math.floor(Number(raw?.priceDirtyMoney ?? 1000))),
    player: raw?.player,
  };
}

export async function getConvoyAccelerators(): Promise<ConvoyAcceleratorInventory> {
  const raw = await request<any>('/convoys/accelerators', { method: 'GET' });
  return normalizeAccelerators(raw);
}

export async function purchaseConvoyAccelerator(quantity = 1): Promise<ConvoyAcceleratorInventory> {
  const raw = await request<any>('/convoys/accelerators/purchase', {
    method: 'POST',
    body: JSON.stringify({ quantity }),
  });
  return normalizeAccelerators(raw);
}

export async function useConvoyAcceleratorOnBattle(battleId: string): Promise<UseConvoyAcceleratorResult> {
  const raw = await request<any>('/convoys/accelerators/use', {
    method: 'POST',
    body: JSON.stringify({ battleId }),
  });
  const base = normalizeAccelerators(raw);
  return {
    ...base,
    battleId: String(raw?.battleId ?? battleId),
    arriveAtIso: String(raw?.arriveAtIso ?? ''),
    launchedAtIso: String(raw?.launchedAtIso ?? ''),
    totalDurationMs: Math.max(0, Number(raw?.totalDurationMs ?? 0)),
    timePerTileMs: Number(raw?.timePerTileMs ?? 0),
    routeTiles: Array.isArray(raw?.routeTiles) ? raw.routeTiles : [],
    remainingBeforeMs: Number(raw?.remainingBeforeMs ?? 0),
    remainingAfterMs: Number(raw?.remainingAfterMs ?? 0),
    acceleratorUses: Number(raw?.acceleratorUses ?? 0),
  };
}
