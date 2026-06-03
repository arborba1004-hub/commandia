/**
 * socket.ts — Gerenciador de WebSocket para comunicação em tempo real
 *
 * PATCH aplicado:
 *   [1] JWT movido de query string para protocolo WS (subprotocol) —
 *       token não aparece mais em logs de rede, proxies nem URLs.
 *   [2] Reconexão sem limite permanente: após MAX_RECONNECT_ATTEMPTS
 *       entra em modo "slow retry" (tenta a cada 60s indefinidamente)
 *       em vez de parar para sempre. O jogador não fica sem tempo real.
 *   [3] Keep-alive preservado integralmente (14 min para Render free tier)
 */

const BACKEND_URL = 'https://comando-backend.onrender.com';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;        // após isso, entra em slow-retry
const SLOW_RETRY_DELAY_MS = 60_000;      // [PATCH 2] tenta a cada 60s
const KEEP_ALIVE_INTERVAL_MS = 14 * 60 * 1000;

// ─── Event Listeners ──────────────────────────────────────────────────────
type EventListener = (...args: any[]) => void;
type EventListeners = Map<string, Set<EventListener>>;

// ─── Socket Interface ─────────────────────────────────────────────────────
export interface Socket {
  on: (event: string, callback: EventListener) => void;
  once: (event: string, callback: EventListener) => void;
  off: (event: string, callback?: EventListener) => void;
  emit: (event: string, ...args: any[]) => void;
  disconnect: () => void;
  removeAllListeners: () => void;
  isConnected: () => boolean;
  connected?: boolean;
}

// ─── Keep-Alive para Render Free Tier ─────────────────────────────────────
let _keepAliveInterval: ReturnType<typeof setInterval> | null = null;

function startKeepAlive(): void {
  stopKeepAlive();
  if (typeof window === 'undefined') return;

  _keepAliveInterval = setInterval(async () => {
    try {
      await fetch(`${BACKEND_URL}/health`, { method: 'GET' });
    } catch {
      // Silencioso — o servidor pode estar voltando do sleep
    }
  }, KEEP_ALIVE_INTERVAL_MS);
}

function stopKeepAlive(): void {
  if (_keepAliveInterval) {
    clearInterval(_keepAliveInterval);
    _keepAliveInterval = null;
  }
}

// ─── Implementação Real ────────────────────────────────────────────────────
class RealSocket implements Socket {
  private ws: WebSocket | null = null;
  private listeners: EventListeners = new Map();
  private token: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private messageQueue: Array<{ event: string; args: any[] }> = []
  private isReconnecting = false;
  private slowRetryTimeout: ReturnType<typeof setTimeout> | null = null; // [PATCH 2]
  private manualDisconnect = false;

  constructor(token: string) {
    this.token = token;
    this.connect();
  }

  private connect(): void {
    if (typeof window === 'undefined') return;
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.manualDisconnect = false;

    const protocol = BACKEND_URL.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = BACKEND_URL.replace(/^https?/, protocol).replace(/\/$/, '');

    // [PATCH 1] Token enviado como subprotocolo WS em vez de query param.
    // Backend lê via req.headers['sec-websocket-protocol'].
    // Formato: "commandia-auth, <token>" — o prefixo "commandia-auth" é
    // necessário pois browsers exigem ao menos um protocolo nomeado.
    const url = `${wsUrl}/socket`;

    try {
      this.ws = new WebSocket(url, ['commandia-auth', this.token || '']);

      this.ws.onopen = () => {
        console.log('🟢 Socket conectado');
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        this.clearSlowRetry(); // [PATCH 2]
        this.flushMessageQueue();
        this.dispatchLocal('connect');
        startKeepAlive();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { event: eventName, data } = message;

          if (eventName && this.listeners.has(eventName)) {
            const callbacks = this.listeners.get(eventName);
            if (callbacks) {
              callbacks.forEach((callback) => {
                try { callback(data); } catch (err) {
                  console.error(`Erro ao executar listener para ${eventName}:`, err);
                }
              });
            }
          }
        } catch (err) {
          console.error('Erro ao processar mensagem do socket:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.error('🔴 Erro no socket:', error);
        this.dispatchLocal('connect_error', new Error('WebSocket error'));
      };

      this.ws.onclose = () => {
        console.log('🟡 Socket desconectado');
        this.ws = null;
        if (!this.manualDisconnect) this.attemptReconnect();
      };
    } catch (err) {
      console.error('Erro ao criar WebSocket:', err);
      this.attemptReconnect();
    }
  }

  // [PATCH 2] após MAX_RECONNECT_ATTEMPTS, entra em slow-retry infinito
  private attemptReconnect(): void {
    if (this.isReconnecting) return;

    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      // Não para — agenda slow retry
      this.scheduleSlowRetry();
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    const delay = RECONNECT_DELAY_MS * Math.pow(1.5, this.reconnectAttempts - 1);
    console.log(`⏳ Reconectando em ${Math.round(delay)}ms (tentativa ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.isReconnecting = false;
      this.connect();
    }, delay);
  }

  private scheduleSlowRetry(): void {
    if (this.slowRetryTimeout) return; // já agendado
    console.log(`🔄 Modo slow-retry: tentando reconectar a cada ${SLOW_RETRY_DELAY_MS / 1000}s`);
    this.slowRetryTimeout = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.clearSlowRetry();
        return;
      }
      this.isReconnecting = false;
      this.reconnectAttempts = 0; // reset counter para tentar sequência normal de novo
      this.connect();
    }, SLOW_RETRY_DELAY_MS);
  }

  private clearSlowRetry(): void {
    if (this.slowRetryTimeout) {
      clearInterval(this.slowRetryTimeout);
      this.slowRetryTimeout = null;
    }
  }

  private dispatchLocal(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    callbacks.forEach((callback) => {
      try { callback(...args); } catch (err) {
        console.error(`Erro ao executar listener local para ${event}:`, err);
      }
    });
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const { event, args } = this.messageQueue.shift()!;
      this.sendMessage(event, args);
    }
  }

  private sendMessage(event: string, args: any[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.messageQueue.push({ event, args });
      return;
    }
    try {
      const message = JSON.stringify({ event, data: args.length === 1 ? args[0] : args });
      this.ws.send(message);
    } catch (err) {
      console.error(`Erro ao enviar evento ${event}:`, err);
    }
  }

  on(event: string, callback: EventListener): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)?.add(callback);
  }

  once(event: string, callback: EventListener): void {
    const wrappedCallback = (...args: any[]) => {
      callback(...args);
      this.off(event, wrappedCallback);
    };
    this.on(event, wrappedCallback);
  }

  off(event: string, callback?: EventListener): void {
    if (!callback) { this.listeners.delete(event); return; }
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) this.listeners.delete(event);
    }
  }

  emit(event: string, ...args: any[]): void {
    this.sendMessage(event, args);
  }

  disconnect(): void {
    this.manualDisconnect = true;
    if (this.reconnectTimeout) { clearTimeout(this.reconnectTimeout); this.reconnectTimeout = null; }
    this.clearSlowRetry(); // [PATCH 2]
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.listeners.clear();
    this.messageQueue = [];
    this.isReconnecting = false;
  }

  removeAllListeners(): void { this.listeners.clear(); }

  isConnected(): boolean { return this.ws?.readyState === WebSocket.OPEN; }
  get connected(): boolean { return this.isConnected(); }
}

// ─── Singleton Socket ──────────────────────────────────────────────────────
let _socket: Socket | null = null;
let _socketToken: string | null = null;

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem('authToken'); } catch { return null; }
}

export function getSocket(): Socket {
  const token = getAuthToken();
  if (!token) {
    if (_socket) { _socket.disconnect(); _socket = null; }
    _socketToken = null;
    throw new Error('No authentication token available');
  }
  if (_socket && _socketToken !== token) {
    _socket.disconnect();
    _socket = null;
    _socketToken = null;
  }

  if (!_socket) {
    _socket = new RealSocket(token);
    _socketToken = token;
  }
  return _socket;
}

export function reconnectSocket(): Socket {
  if (typeof window === 'undefined') {
    return { on: () => {}, once: () => {}, off: () => {}, emit: () => {},
      disconnect: () => {}, removeAllListeners: () => {}, isConnected: () => false, connected: false };
  }

  const token = getAuthToken();
  if (!token) throw new Error('No authentication token available');

  // Se o token é o mesmo, reaproveita o socket singleton. Isso evita o ciclo:
  // restoreSession → authTokenChanged → disconnect → reconnect → playerInit/mapSnapshot duplicados.
  if (_socket && _socketToken === token) return _socket;

  if (_socket) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
  }

  _socket = new RealSocket(token);
  _socketToken = token;
  return _socket;
}

export function disconnectSocket(): void {
  stopKeepAlive();
  if (_socket) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
  }
  _socketToken = null;
}

export default getSocket;
