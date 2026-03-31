import { useState, useEffect } from 'react';
import { usePlayerStore } from '@/store/playerStore';

export interface PlayerData {
  id: string;
  email: string;
  name: string;
  picture?: string;
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

  // 🔥 STORE (CORREÇÃO)
  const loadPlayer = usePlayerStore((state) => state.loadPlayer);
  const setPlayer = usePlayerStore((state) => state.setPlayer);
  const clearPlayer = usePlayerStore((state) => state.clearPlayer);

  // ==========================================
  // LOAD LOCAL SESSION
  // ==========================================
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

        // 🔥 IMPORTANTE: hidrata store
        setPlayer(player);

      } catch (e) {
        console.error('Erro ao carregar player local:', e);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }

    // garante fallback da store
    loadPlayer();
  }, []);

  // ==========================================
  // GOOGLE LOGIN
  // ==========================================
  const handleGoogleResponse = async (response: any) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const credential = response.credential;
      if (!credential) throw new Error('Sem credencial do Google');

      const backendResponse = await fetch(
        'https://comando-backend.onrender.com/auth/google',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: credential }),
        }
      );

      if (!backendResponse.ok) {
        throw new Error(`Erro backend: ${backendResponse.statusText}`);
      }

      const data = await backendResponse.json();

      if (!(data.token && data.player)) {
        throw new Error(data.message || 'Falha na autenticação');
      }

      // salva local
      localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
      localStorage.setItem(STORAGE_KEY_PLAYER, JSON.stringify(data.player));

      // atualiza store global
      setPlayer(data.player);

      setAuthState({
        authToken: data.token,
        playerData: data.player,
        isLoading: false,
        error: null,
      });

    } catch (err) {
      console.error('Erro login Google:', err);

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro no login',
      }));
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================
  const logout = () => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_PLAYER);

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