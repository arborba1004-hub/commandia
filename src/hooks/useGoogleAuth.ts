import { useEffect, useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';

export interface PlayerData {
  _id?: string;
  id?: string;
  googleId?: string;
  email?: string;
  name?: string;
  picture?: string;
  avatar?: string;
  [key: string]: any;
}

export interface AuthState {
  authToken: string | null;
  playerData: PlayerData | null;
  isLoading: boolean;
  error: string | null;
}

const STORAGE_KEY_TOKEN = 'authToken';
const STORAGE_KEY_PLAYER = 'playerData';
const BACKEND_URL = 'https://comando-backend.onrender.com';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function readStorage(key: string): string | null {
  if (!canUseStorage()) return null;

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  if (!canUseStorage()) return;

  try {
    localStorage.setItem(key, value);
  } catch {
    // noop
  }
}

function removeStorage(key: string) {
  if (!canUseStorage()) return;

  try {
    localStorage.removeItem(key);
  } catch {
    // noop
  }
}

function normalizePlayer(rawPlayer: any): PlayerData {
  return {
    ...(rawPlayer || {}),
    _id: String(
      rawPlayer?._id ?? rawPlayer?.id ?? rawPlayer?.googleId ?? ''
    ),
  };
}

export function useGoogleAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    authToken: null,
    playerData: null,
    isLoading: true,
    error: null,
  });

  const hydratePlayerFromServer = usePlayerStore(
    (state) => state.hydratePlayerFromServer
  );
  const clearPlayer = usePlayerStore((state) => state.clearPlayer);
  const startPolling = usePlayerStore((state) => state.startPolling);
  const stopPolling = usePlayerStore((state) => state.stopPolling);

  useEffect(() => {
    const token = readStorage(STORAGE_KEY_TOKEN);
    const playerJson = readStorage(STORAGE_KEY_PLAYER);

    if (!token || !playerJson) {
      setAuthState({
        authToken: null,
        playerData: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    try {
      const parsedPlayer = JSON.parse(playerJson);
      const normalizedPlayer = normalizePlayer(parsedPlayer);

      hydratePlayerFromServer(normalizedPlayer);
      startPolling();

      setAuthState({
        authToken: token,
        playerData: normalizedPlayer,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Erro ao restaurar sessão local:', error);

      removeStorage(STORAGE_KEY_TOKEN);
      removeStorage(STORAGE_KEY_PLAYER);

      setAuthState({
        authToken: null,
        playerData: null,
        isLoading: false,
        error: null,
      });
    }
  }, [hydratePlayerFromServer, startPolling]);

  const handleGoogleResponse = async (response: any) => {
    try {
      setAuthState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const credential = response?.credential;

      if (!credential || typeof credential !== 'string') {
        throw new Error('Sem credencial do Google');
      }

      const backendResponse = await fetch(`${BACKEND_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ token: credential }),
      });

      const data = await backendResponse.json().catch(() => null);

      if (!backendResponse.ok) {
        throw new Error(
          data?.error || data?.message || 'Falha na autenticação'
        );
      }

      if (!data?.token || !data?.player) {
        throw new Error('Resposta inválida do backend');
      }

      const normalizedPlayer = normalizePlayer(data.player);

      writeStorage(STORAGE_KEY_TOKEN, data.token);
      writeStorage(STORAGE_KEY_PLAYER, JSON.stringify(normalizedPlayer));

      hydratePlayerFromServer(normalizedPlayer);
      startPolling();

      setAuthState({
        authToken: data.token,
        playerData: normalizedPlayer,
        isLoading: false,
        error: null,
      });

      return {
        ok: true,
        token: data.token,
        player: normalizedPlayer,
      };
    } catch (error) {
      console.error('Erro login Google:', error);

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro no login',
      }));

      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Erro no login',
      };
    }
  };

  const logout = () => {
    removeStorage(STORAGE_KEY_TOKEN);
    removeStorage(STORAGE_KEY_PLAYER);

    stopPolling();
    clearPlayer();

    setAuthState({
      authToken: null,
      playerData: null,
      isLoading: false,
      error: null,
    });
  };

  const isAuthenticated = Boolean(authState.authToken && authState.playerData);

  return {
    ...authState,
    isAuthenticated,
    handleGoogleResponse,
    logout,
  };
}