/**
 * Notification API Layer
 * 
 * Responsável por buscar notificações de ataque do backend externo
 * Usa polling para manter as notificações sincronizadas
 */

import type { AttackNotification } from '@/store/playerStore';

const BACKEND_URL = 'https://comando-backend.onrender.com';
const REQUEST_TIMEOUT_MS = 10000;

function getAuthToken(): string | null {
  const candidates = [
    localStorage.getItem('authToken'),
    localStorage.getItem('token'),
    localStorage.getItem('jwt'),
    localStorage.getItem('wix_auth_token'),
  ];

  for (const token of candidates) {
    if (token && token.trim()) {
      return token.trim();
    }
  }

  return null;
}

function buildUrl(endpoint: string): string {
  const normalizedBase = BACKEND_URL.replace(/\/$/, '');
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${normalizedBase}${normalizedEndpoint}`;
}

function createTimeoutSignal(timeoutMs: number): AbortController {
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

async function safeReadResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');

  try {
    if (contentType && contentType.toLowerCase().includes('application/json')) {
      return await response.json();
    }

    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  } catch {
    return null;
  }
}

/**
 * Busca notificações de ataque do backend
 * Endpoint: GET /notifications/attacks
 */
export async function fetchAttackNotifications(): Promise<AttackNotification[]> {
  const token = getAuthToken();
  const controller = createTimeoutSignal(REQUEST_TIMEOUT_MS);

  const headers = new Headers();
  headers.set('Accept', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(buildUrl('/notifications/attacks'), {
      method: 'GET',
      headers,
      signal: controller.signal,
      cache: 'no-store',
    });

    const data = await safeReadResponseBody(response);

    if (!response.ok) {
      console.warn('Erro ao buscar notificações:', response.status);
      return [];
    }

    // Normaliza a resposta
    if (Array.isArray(data)) {
      return data as AttackNotification[];
    }

    if (data && typeof data === 'object') {
      const obj = data as Record<string, any>;
      if (Array.isArray(obj.notifications)) {
        return obj.notifications as AttackNotification[];
      }
      if (Array.isArray(obj.data)) {
        return obj.data as AttackNotification[];
      }
    }

    return [];
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.warn('Timeout ao buscar notificações');
    } else {
      console.warn('Erro ao buscar notificações:', error);
    }
    return [];
  }
}

/**
 * Marca uma notificação como lida
 * Endpoint: PATCH /notifications/:id/read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const token = getAuthToken();
  const controller = createTimeoutSignal(REQUEST_TIMEOUT_MS);

  const headers = new Headers();
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(buildUrl(`/notifications/${notificationId}/read`), {
      method: 'PATCH',
      headers,
      signal: controller.signal,
      cache: 'no-store',
    });

    return response.ok;
  } catch (error: any) {
    console.warn('Erro ao marcar notificação como lida:', error);
    return false;
  }
}
