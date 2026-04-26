import { io, Socket as IOSocket } from 'socket.io-client';

const BACKEND_URL = 'https://comando-backend.onrender.com';

let _socket: IOSocket | null = null;

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
}

export function getSocket(): IOSocket {
  const token = getAuthToken();

  if (!token) {
    if (_socket) {
      _socket.disconnect();
      _socket = null;
    }
    throw new Error('No authentication token available');
  }

  if (!_socket) {
    _socket = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    _socket.on('connect', () => {
      console.log('🟢 Socket.io conectado:', _socket?.id);
    });

    _socket.on('connect_error', (err) => {
      console.error('🔴 Erro de conexão:', err.message);
    });

    _socket.on('disconnect', (reason) => {
      console.log('🟡 Socket desconectado:', reason);
    });
  }

  return _socket;
}

export function reconnectSocket(): IOSocket {
  if (_socket) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
  }

  const token = getAuthToken();
  if (!token) throw new Error('No authentication token available');

  _socket = io(BACKEND_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
  });

  return _socket;
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
  }
}

export default getSocket;
