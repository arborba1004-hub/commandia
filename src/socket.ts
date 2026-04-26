/**
 * socket.ts — Gerenciador de Socket.io para comunicação em tempo real
 *
 * Responsabilidades:
 *   - Conecta ao backend com JWT autenticado
 *   - Gerencia listeners de eventos (mapSnapshot, playerMoved, etc.)
 *   - Suporta emit de eventos (move, attack, etc.)
 *   - Reconecta automaticamente com novo token
 *   - Fallback para REST se socket falhar
 */

const BACKEND_URL = 'https://comando-backend.onrender.com';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

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

// ─── Implementação Real ────────────────────────────────────────────────────
class RealSocket implements Socket {
  private ws: WebSocket | null = null;
  private listeners: EventListeners = new Map();
  private token: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private messageQueue: Array<{ event: string; args: any[] }> = [];
  private isReconnecting = false;

  constructor(token: string) {
    this.token = token;
    this.connect();
  }

  private connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const protocol = BACKEND_URL.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = BACKEND_URL.replace(/^https?/, protocol).replace(/\/$/, '');
    const url = `${wsUrl}/socket?token=${encodeURIComponent(this.token || '')}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('🟢 Socket conectado');
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        this.flushMessageQueue();
        this.emit('connect');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { event: eventName, data } = message;

          if (eventName === 'mapSnapshot' || eventName === 'playerMoved' || eventName === 'playerJoined') {
            console.log(`📨 Socket recebeu evento: ${eventName}`, data);
          }

          if (eventName && this.listeners.has(eventName)) {
            const callbacks = this.listeners.get(eventName);
            if (callbacks) {
              callbacks.forEach((callback) => {
                try {
                  callback(data);
                } catch (err) {
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
        this.emit('connect_error', new Error('WebSocket error'));
      };

      this.ws.onclose = () => {
        console.log('🟡 Socket desconectado');
        this.ws = null;
        this.attemptReconnect();
      };
    } catch (err) {
      console.error('Erro ao criar WebSocket:', err);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.isReconnecting || this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ Máximo de tentativas de reconexão atingido');
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = RECONNECT_DELAY_MS * Math.pow(1.5, this.reconnectAttempts - 1);
    console.log(`⏳ Tentando reconectar em ${Math.round(delay)}ms (tentativa ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
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
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
    
    if (event === 'mapSnapshot' || event === 'playerMoved' || event === 'playerJoined' || event === 'connect') {
      console.log(`📌 Listener registrado para evento: ${event}`);
    }
  }

  once(event: string, callback: EventListener): void {
    const wrappedCallback = (...args: any[]) => {
      callback(...args);
      this.off(event, wrappedCallback);
    };
    this.on(event, wrappedCallback);
  }

  off(event: string, callback?: EventListener): void {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    if (event === 'requestMapSnapshot') {
      console.log('🔔 Emitindo requestMapSnapshot');
    }
    this.sendMessage(event, args);
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.listeners.clear();
    this.messageQueue = [];
    this.isReconnecting = false;
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }

  isConnected(): boolean {
    const connected = this.ws?.readyState === WebSocket.OPEN;
    console.log(`🔌 isConnected() chamado: ${connected}`);
    return connected;
  }

  get connected(): boolean {
    return this.isConnected();
  }
}

// ─── Singleton Socket ──────────────────────────────────────────────────────
let _socket: Socket | null = null;

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
}

/** Retorna o socket ativo. Cria um novo se necessário. */
export function getSocket(): Socket {
  const token = getAuthToken();

  if (!token) {
    if (_socket) {
      _socket.disconnect();
      _socket = null;
    }
    throw new Error('No authentication token available');
  }

  if (!_socket) {
    _socket = new RealSocket(token);
  }

  return _socket;
}

/**
 * Força reconexão com o token atual do localStorage.
 * Chame após login Google ou após renovação de token.
 */
export function reconnectSocket(): Socket {
  if (_socket) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
  }

  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  _socket = new RealSocket(token);
  return _socket;
}

/** Desconecta o socket (chamado no logout). */
export function disconnectSocket(): void {
  if (_socket) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
  }
}

export default getSocket;
