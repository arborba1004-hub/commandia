import { create } from 'zustand';
import { syncGoogleAuth, logoutAndClearSession } from '@/services/playerStateService';
import { usePlayerStore } from '@/store/playerStore';

type AuthState = {
  authToken: string | null;
  playerData: any | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  initializeAuth: () => Promise<void>;
  loginWithGoogle: (googleToken: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
};

let pollingStarted = false;

function startGlobalPollingSafely() {
  if (pollingStarted) return;
  pollingStarted = true;
  usePlayerStore.getState().startPolling();
}

function stopGlobalPollingSafely() {
  pollingStarted = false;
  usePlayerStore.getState().stopPolling();
}

export const useAuthStore = create<AuthState>((set) => ({
  authToken: null,
  playerData: null,
  isLoading: true,
  error: null,
  isAuthenticated: false,

  initializeAuth: async () => {
    try {
      const token = localStorage.getItem('authToken');
      const rawPlayer = localStorage.getItem('playerData');

      if (!token || !rawPlayer) {
        set({
          authToken: null,
          playerData: null,
          isLoading: false,
          error: null,
          isAuthenticated: false,
        });
        return;
      }

      let parsedPlayer: any = null;

      try {
        parsedPlayer = JSON.parse(rawPlayer);
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('playerData');

        set({
          authToken: null,
          playerData: null,
          isLoading: false,
          error: 'Sessão local inválida',
          isAuthenticated: false,
        });
        return;
      }

      set({
        authToken: token,
        playerData: parsedPlayer,
        isLoading: false,
        error: null,
        isAuthenticated: true,
      });

      usePlayerStore.getState().hydratePlayerFromServer(parsedPlayer);
      startGlobalPollingSafely();
    } catch (error: any) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('playerData');

      set({
        authToken: null,
        playerData: null,
        isLoading: false,
        error: error?.message || 'Erro ao inicializar autenticação',
        isAuthenticated: false,
      });
    }
  },

  loginWithGoogle: async (googleToken: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await syncGoogleAuth(googleToken);

      const token = result?.token ?? null;
      const player = result?.player ?? null;

      if (!token || !player) {
        throw new Error('Resposta inválida do login');
      }

      localStorage.setItem('authToken', token);
      localStorage.setItem('playerData', JSON.stringify(player));

      set({
        authToken: token,
        playerData: player,
        isLoading: false,
        error: null,
        isAuthenticated: true,
      });

      usePlayerStore.getState().hydratePlayerFromServer(player);
      startGlobalPollingSafely();
    } catch (error: any) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('playerData');

      set({
        authToken: null,
        playerData: null,
        isLoading: false,
        error: error?.message || 'Falha no login com Google',
        isAuthenticated: false,
      });

      throw error;
    }
  },

  logout: () => {
    stopGlobalPollingSafely();
    logoutAndClearSession();

    set({
      authToken: null,
      playerData: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
    });
  },

  clearError: () => set({ error: null }),
}));