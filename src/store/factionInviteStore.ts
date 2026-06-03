import { create } from 'zustand';
import {
  fetchPlayersWithoutFaction,
  invitePlayerToFaction,
  type PlayerWithoutFaction,
} from '@/services/factionInviteService';

let playersWithoutFactionPromise: Promise<boolean> | null = null;
const PLAYERS_WITHOUT_FACTION_CACHE_MS = 60_000;

type FactionInviteStore = {
  playersWithoutFaction: PlayerWithoutFaction[];
  isLoadingPlayersWithoutFaction: boolean;
  isSubmittingInvite: boolean;
  error: string | null;
  lastLoadedAt: number | null;

  loadPlayersWithoutFaction: () => Promise<boolean>;
  sendFactionInvite: (targetPlayerId: string) => Promise<boolean>;
  clearFactionInviteError: () => void;
};

export const useFactionInviteStore = create<FactionInviteStore>((set) => ({
  playersWithoutFaction: [],
  isLoadingPlayersWithoutFaction: false,
  isSubmittingInvite: false,
  error: null,
  lastLoadedAt: null,

  loadPlayersWithoutFaction: async () => {
    const currentState = useFactionInviteStore.getState();
    const cacheAge = currentState.lastLoadedAt ? Date.now() - currentState.lastLoadedAt : Infinity;
    if (currentState.playersWithoutFaction.length > 0 && cacheAge < PLAYERS_WITHOUT_FACTION_CACHE_MS) {
      return true;
    }
    if (playersWithoutFactionPromise) return playersWithoutFactionPromise;

    playersWithoutFactionPromise = (async () => {
      try {
        set({
          isLoadingPlayersWithoutFaction: true,
          error: null,
        });

        const players = await fetchPlayersWithoutFaction();

        set({
          playersWithoutFaction: players,
          isLoadingPlayersWithoutFaction: false,
          error: null,
          lastLoadedAt: Date.now(),
        });

        return true;
      } catch (error) {
        set({
          isLoadingPlayersWithoutFaction: false,
          error:
            error instanceof Error
              ? error.message
              : 'Erro ao carregar jogadores sem facção',
        });
        return false;
      } finally {
        playersWithoutFactionPromise = null;
      }
    })();

    return playersWithoutFactionPromise;
  },

  sendFactionInvite: async (targetPlayerId) => {
    try {
      set({
        isSubmittingInvite: true,
        error: null,
      });

      await invitePlayerToFaction(String(targetPlayerId || '').trim());

      set({
        isSubmittingInvite: false,
        error: null,
      });

      return true;
    } catch (error) {
      set({
        isSubmittingInvite: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao enviar convite',
      });
      return false;
    }
  },

  clearFactionInviteError: () => {
    set({ error: null });
  },
}));