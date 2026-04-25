/**
 * socket.ts — Stub para Socket.io (não disponível no ambiente)
 *
 * Socket.io-client não está instalado. Este arquivo fornece stubs
 * para evitar erros de import. A comunicação em tempo real não está disponível.
 */

export interface Socket {
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
  disconnect: () => void;
  removeAllListeners: () => void;
}

const BACKEND_URL = 'https://comando-backend.onrender.com';

let _socket: Socket | null = null;

function buildSocket(): Socket {
  // Retorna um socket stub que não faz nada
  return {
    on: () => {},
    off: () => {},
    emit: () => {},
    disconnect: () => {},
    removeAllListeners: () => {},
  };
}

/** Retorna o socket ativo. Cria um novo se necessário. */
export function getSocket(): Socket {
  const token = localStorage.getItem('authToken');
  
  // Não criar socket sem token
  if (!token) {
    if (_socket) {
      _socket.disconnect();
      _socket = null;
    }
    throw new Error('No authentication token available');
  }
  
  if (!_socket) {
    _socket = buildSocket();
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
  _socket = buildSocket();
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
