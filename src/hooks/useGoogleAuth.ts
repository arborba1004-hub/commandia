import { useState, useEffect } from 'react';
import { usePlayerStore } from '@/store/playerStore';

export interface PlayerData {
  id?: string;
  _id?: string;
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

export function useGoogleAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    authToken: null,
    playerData: null,
    isLoading: true,
    error: null,
  });

  const setPlayer = usePlayerStore((state) => state.setPlayer);
  const clearPlayer = usePlayerStore((state) => state.clearPlayer);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const playerJson = localStorage.getItem(STORAGE_KEY_PLAYER);

    if (token && playerJson) {
      try {
        const player = JSON.parse(playerJson);

        setAuthState({
          authToken: token,
          playerData: player,
          isLoading: false,
          error: null,
        });

        // abastece a playerStore com o mesmo player salvo no login
        setPlayer(player);
      } catch (e) {
        console.error('Error parsing stored player data:', e);

        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Erro ao carregar sessão local',
        }));
      }
    } else {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [setPlayer]);

  const handleGoogleResponse = async (response: any) => {
    try {
      setAuthState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const credential = response?.credential;

      if (!credential) {
        throw new Error('No credential received from Google');
      }

      const backendResponse = await fetch('https://comando-backend.onrender.com/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credential }),
      });

      if (!backendResponse.ok) {
        throw new Error(`Backend error: ${backendResponse.statusText}`);
      }

      const data = await backendResponse.json();

      if (!(data.token && data.player)) {
        throw new Error(data.message || 'Authentication failed');
      }

      localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
      localStorage.setItem(STORAGE_KEY_PLAYER, JSON.stringify(data.player));

      // abastece a playerStore imediatamente
      setPlayer(data.player);

      setAuthState({
        authToken: data.token,
        playerData: data.player,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Authentication failed';

      console.error('Google auth error:', err);

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_PLAYER);

    // limpa a playerStore junto
    clearPlayer();

    setAuthState({
      authToken: null,
      playerData: null,
      isLoading: false,
      error: null,
    });
  };

  const isAuthenticated = !!authState.authToken && !!authState.playerData;

  return {
    ...authState,
    isAuthenticated,
    handleGoogleResponse,
    logout,
  };
}