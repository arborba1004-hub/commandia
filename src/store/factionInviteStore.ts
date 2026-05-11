import { create } from 'zustand';
import {
  fetchPlayersWithoutFaction,
  invitePlayerToFaction,
  type PlayerWithoutFaction,
} from '@/services/factionInviteService';

type FactionInviteStore = {
  playersWithoutFaction: PlayerWithoutFaction[];
  isLoadingPlayersWithoutFaction: boolean;
  isSubmittingInvite: boolean;
  error: string | null;

  loadPlayersWithoutFaction: () => Promise<boolean>;
  sendFactionInvite: (targetPlayerId: string) => Promise<boolean>;
  clearFactionInviteError: () => void;
};

export const useFactionInviteStore = create<FactionInviteStore>((set) => ({
  playersWithoutFaction: [],
  isLoadingPlayersWithoutFaction: false,
  isSubmittingInvite: false,
  error: null,

  loadPlayersWithoutFaction: async () => {
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
    }
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