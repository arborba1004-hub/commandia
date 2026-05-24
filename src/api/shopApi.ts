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

export type MercadoPagoBrickConfig = {
  publicKey: string;
  env: 'sandbox' | 'production' | string;
};

export type CorrePackage = {
  id: string;
  name: string;
  description: string;
  correAmount: number;
  price: number;
  currency: 'BRL' | string;
  badge?: string;
};

export type CorrePackageBrickPaymentResult = {
  purchaseId: string;
  paymentId?: string | number;
  status: string;
  statusDetail?: string;
  paymentTypeId?: string;
  paymentMethodId?: string;
  packageId: string;
  correAmount: number;
  amount: number;
  currency: string;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  player?: unknown;
  message?: string;
};

export const CORRE_STARTER_PACKAGE: CorrePackage = {
  id: 'corre_10_099',
  name: 'Pacote Relâmpago de Corres',
  description: '10 Corres para rodar no Giro no Asfalto sem gastar Commands.',
  correAmount: 10,
  price: 0.99,
  currency: 'BRL',
  badge: 'OFERTA DE ENTRADA',
};

export function formatBRL(value: number): string {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export async function getMercadoPagoBrickConfig(): Promise<MercadoPagoBrickConfig> {
  return request<MercadoPagoBrickConfig>('/payments/brick/config', { method: 'GET' });
}

export async function createMercadoPagoBrickCorrePackagePayment(
  packageId: string,
  paymentData: unknown,
): Promise<CorrePackageBrickPaymentResult> {
  return request<CorrePackageBrickPaymentResult>('/payments/brick/corre-package', {
    method: 'POST',
    body: JSON.stringify({ packageId, paymentData }),
  });
}
