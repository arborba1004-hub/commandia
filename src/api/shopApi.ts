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

export type CorreCheckoutResponse = {
  purchaseId: string;
  preferenceId?: string;
  checkoutUrl: string;
  initPoint?: string;
  sandboxInitPoint?: string;
  productType: 'correPackage';
  productId: string;
  correAmount: number;
  amount: number;
  currency: string;
};

export type RealMoneyPurchaseStatus = {
  purchaseId: string;
  status: string;
  productType?: 'convoy' | 'correPackage' | string;
  productId?: string;
  convoySkinId?: string;
  correAmount?: number;
  amount?: number;
  currency?: string;
  grantedAt?: string | null;
  player?: unknown;
};

export async function createCorrePackageCheckout(packageId = 'corre_10_brl_099'): Promise<CorreCheckoutResponse> {
  return request<CorreCheckoutResponse>('/payments/checkout/corre', {
    method: 'POST',
    body: JSON.stringify({ packageId }),
  });
}

export async function getRealMoneyPurchaseStatus(purchaseId: string): Promise<RealMoneyPurchaseStatus> {
  return request<RealMoneyPurchaseStatus>(`/payments/purchases/${encodeURIComponent(purchaseId)}`, { method: 'GET' });
}
