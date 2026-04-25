/**
 * socket.ts — Singleton do Socket.io autenticado
 *
 * REGRA: use sempre getSocket(), nunca importe o default diretamente.
 * O token pode não estar disponível no momento do import de módulo.
 *
 * Após login Google:
 *   import { reconnectSocket } from '@/socket';
 *   reconnectSocket(); // reconecta com o novo token
 */

import { io, type Socket } from 'socket.io-client';

const BACKEND_URL = 'https://comando-backend.onrender.com';

let _socket: Socket | null = null;

function buildSocket(): Socket {
  const token = localStorage.getItem('authToken') ?? '';

  return io(BACKEND_URL, {
    auth:                 { token },        // JWT vai para socket.handshake.auth.token
    transports:           ['websocket', 'polling'],
    autoConnect:          true,
    reconnection:         true,
    reconnectionDelay:    2000,
    reconnectionAttempts: 10,
    timeout:              10000,
  });
}

/** Retorna o socket ativo. Cria um novo se necessário. */
export function getSocket(): Socket {
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
