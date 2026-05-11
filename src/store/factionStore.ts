import { create } from 'zustand';
import { usePlayerStore } from '@/store/playerStore';
import type {
  Faction,
  FactionInvestmentBranch,
  FactionListItem,
  FactionRole,
  FactionSettings,
  FactionTreasury,
} from '@/types/faction';
import {
  createFaction as createFactionRequest,
  donateToFaction,
  fetchFactionList,
  fetchMyFaction,
  joinFaction as joinFactionRequest,
  kickFactionMember,
  leaveFaction as leaveFactionRequest,
  transferFactionLeadership,
  updateFactionMemberRole,
  updateFactionSettings,
  upgradeFactionInvestment,
  acceptFactionJoinRequest,
  rejectFactionJoinRequest,
} from '@/services/factionService';

type CreateFactionPayload = {
  name: string;
  tag: string;
  description?: string;
  isPrivate?: boolean;
  minimumPower?: number;
  minimumBarracoLevel?: number;
  allowMemberInvites?: boolean;
  allowJoinRequests?: boolean;
  autoAcceptRequests?: boolean;
};

type FactionStore = {
  myFaction: Faction | null;
  factionList: FactionListItem[];

  isLoadingMyFaction: boolean;
  isLoadingFactionList: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastLoadedAt: number | null;

  loadMyFaction: () => Promise<boolean>;
  loadFactionList: () => Promise<boolean>;
  reloadAllFactionData: () => Promise<void>;

  createFaction: (payload: CreateFactionPayload) => Promise<boolean>;
  joinFaction: (factionId: string) => Promise<boolean>;
  leaveFaction: () => Promise<boolean>;

  donate: (currency: keyof FactionTreasury, amount: number) => Promise<boolean>;
  upgradeInvestment: (branch: FactionInvestmentBranch) => Promise<boolean>;

  updateSettings: (payload: Partial<FactionSettings>) => Promise<boolean>;
  updateMemberRole: (targetPlayerId: string, role: FactionRole) => Promise<boolean>;
  kickMember: (targetPlayerId: string) => Promise<boolean>;
  transferLeadership: (targetPlayerId: string) => Promise<boolean>;

  acceptJoinRequest: (targetPlayerId: string) => Promise<boolean>;
  rejectJoinRequest: (targetPlayerId: string) => Promise<boolean>;

  clearFaction: () => void;
  setFaction: (faction: Faction | null) => void;
};

function beginLoadingMyFaction(set: (partial: Partial<FactionStore>) => void) {
  set({ isLoadingMyFaction: true, error: null });
}

function endLoadingMyFaction(set: (partial: Partial<FactionStore>) => void) {
  set({ isLoadingMyFaction: false });
}

function beginLoadingFactionList(set: (partial: Partial<FactionStore>) => void) {
  set({ isLoadingFactionList: true, error: null });
}

function endLoadingFactionList(set: (partial: Partial<FactionStore>) => void) {
  set({ isLoadingFactionList: false });
}

function syncPlayerFactionId(factionId: string | null) {
  try {
    const playerStore = usePlayerStore.getState();
    const currentPlayer = playerStore.player;
    
    // Validate currentPlayer is an object
    if (!currentPlayer || typeof currentPlayer !== 'object') {
      console.warn('Invalid player state when syncing faction ID');
      return;
    }
    
    const currentFactionId = currentPlayer?.factionId ?? null;

    if (currentFactionId === factionId) return;

    // Ensure we're passing a valid object
    const updatedPlayer = {
      ...currentPlayer,
      factionId,
    };
    
    if (typeof updatedPlayer !== 'object' || updatedPlayer === null) {
      console.warn('Failed to create valid player object for faction sync');
      return;
    }

    playerStore.hydratePlayerFromServer(updatedPlayer as any);
  } catch (error) {
    console.warn('Erro ao sincronizar factionId no playerStore:', error);
    // Don't throw - allow the app to continue
  }
}

function syncPlayerBalancesFromFactionDonationBeforeAfter(
  before: Faction | null,
  after: Faction | null
) {
  if (!before || !after) return;

  const playerStore = usePlayerStore.getState();
  const currentPlayer = playerStore.player;

  if (!currentPlayer?.balances) return;

  const dirtyDiff = Math.max(
    0,
    Number(after.treasury.dirtyMoney || 0) - Number(before.treasury.dirtyMoney || 0)
  );
  const cleanDiff = Math.max(
    0,
    Number(after.treasury.cleanMoney || 0) - Number(before.treasury.cleanMoney || 0)
  );
  const correDiff = Math.max(
    0,
    Number(after.treasury.corre || 0) - Number(before.treasury.corre || 0)
  );

  if (dirtyDiff === 0 && cleanDiff === 0 && correDiff === 0) return;

  playerStore.hydratePlayerFromServer({
    ...currentPlayer,
    balances: {
      dirtyMoney: Math.max(
        0,
        Number(currentPlayer.balances.dirtyMoney || 0) - dirtyDiff
      ),
      cleanMoney: Math.max(
        0,
        Number(currentPlayer.balances.cleanMoney || 0) - cleanDiff
      ),
      corre: Math.max(0, Number(currentPlayer.balances.corre || 0) - correDiff),
    },
  } as any);
}
export const useFactionStore = create<FactionStore>((set, get) => ({
  myFaction: null,
  factionList: [],

  isLoadingMyFaction: false,
  isLoadingFactionList: false,
  isSubmitting: false,
  error: null,
  lastLoadedAt: null,

  loadMyFaction: async () => {
    try {
      beginLoadingMyFaction(set);

      const faction = await fetchMyFaction();

      set({
        myFaction: faction,
        error: null,
        lastLoadedAt: Date.now(),
      });

      syncPlayerFactionId(faction?.id || null);
      return Boolean(faction);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar facção',
      });
      return false;
    } finally {
      endLoadingMyFaction(set);
    }
  },

  loadFactionList: async () => {
    try {
      beginLoadingFactionList(set);

      const factions = await fetchFactionList();

      set({
        factionList: factions,
        error: null,
        lastLoadedAt: Date.now(),
      });

      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao listar facções',
      });
      return false;
    } finally {
      endLoadingFactionList(set);
    }
  },

  reloadAllFactionData: async () => {
    await Promise.all([get().loadMyFaction(), get().loadFactionList()]);
  },

  createFaction: async (payload) => {
    try {
      set({ isSubmitting: true, error: null });

      const faction = await createFactionRequest({
        name: String(payload?.name || '').trim(),
        tag: String(payload?.tag || '')
          .trim()
          .toUpperCase(),
        description: String(payload?.description || '').trim(),
        isPrivate: Boolean(payload?.isPrivate),
        minimumPower: Number(payload?.minimumPower || 0),
        minimumBarracoLevel: Math.max(
          1,
          Number(payload?.minimumBarracoLevel || 1)
        ),
        allowMemberInvites: Boolean(payload?.allowMemberInvites),
        allowJoinRequests: Boolean(payload?.allowJoinRequests ?? true),
        autoAcceptRequests: Boolean(payload?.autoAcceptRequests),
      });

      set({
        myFaction: faction,
        isSubmitting: false,
        error: null,
        lastLoadedAt: Date.now(),
      });

      syncPlayerFactionId(faction.id);
      await Promise.all([get().loadMyFaction(), get().loadFactionList()]);
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao criar facção',
      });
      return false;
    }
  },

  joinFaction: async (factionId) => {
    try {
      set({ isSubmitting: true, error: null });

      const faction = await joinFactionRequest(String(factionId || '').trim());

      set({
        myFaction: faction,
        isSubmitting: false,
        error: null,
        lastLoadedAt: Date.now(),
      });

      syncPlayerFactionId(faction.id);
      await Promise.all([get().loadMyFaction(), get().loadFactionList()]);
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao entrar na facção',
      });
      return false;
    }
  },

  leaveFaction: async () => {
    try {
      set({ isSubmitting: true, error: null });

      const response = await leaveFactionRequest();

      set({
        myFaction: response.faction,
        isSubmitting: false,
        error: null,
        lastLoadedAt: Date.now(),
      });

      syncPlayerFactionId(response.faction?.id || null);

      if (!response.faction) {
        syncPlayerFactionId(null);
      }

      await Promise.all([get().loadMyFaction(), get().loadFactionList()]);
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao sair da facção',
      });
      return false;
    }
  },

donate: async (currency, amount) => {
    try {
      const currentFaction = get().myFaction;

      set({ isSubmitting: true, error: null });

      const faction = await donateToFaction({
        currency,
        amount: Number(amount || 0),
      });

      syncPlayerBalancesFromFactionDonationBeforeAfter(currentFaction, faction);

      set({
        myFaction: faction,
        isSubmitting: false,
        error: null,
        lastLoadedAt: Date.now(),
      });

      await Promise.all([get().loadMyFaction(), get().loadFactionList()]);
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao doar para a facção',
      });
      return false;
    }
  },

  upgradeInvestment: async (branch) => {
    try {
      set({ isSubmitting: true, error: null });

      const faction = await upgradeFactionInvestment({ branch });

      set({
        myFaction: faction,
        isSubmitting: false,
        error: null,
        lastLoadedAt: Date.now(),
      });

      await Promise.all([get().loadMyFaction(), get().loadFactionList()]);
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error:
          error instanceof Error ? error.message : 'Erro ao investir na facção',
      });
      return false;
    }
  },

  updateSettings: async (payload) => {
    try {
      set({ isSubmitting: true, error: null });

      const faction = await updateFactionSettings(payload);

      set({
        myFaction: faction,
        isSubmitting: false,
        error: null,
        lastLoadedAt: Date.now(),
      });

      await Promise.all([get().loadMyFaction(), get().loadFactionList()]);
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao atualizar configurações da facção',
      });
      return false;
    }
  },

  updateMemberRole: async (targetPlayerId, role) => {
    try {
      set({ isSubmitting: true, error: null });

      const faction = await updateFactionMemberRole({ targetPlayerId, role });

      set({
        myFaction: faction,
        isSubmitting: false,
        error: null,
        lastLoadedAt: Date.now(),
      });

      await Promise.all([get().loadMyFaction(), get().loadFactionList()]);
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error:
          error instanceof Error ? error.message : 'Erro ao alterar cargo do membro',
      });
      return false;
    }
  },

  kickMember: async (targetPlayerId) => {
    try {
      set({ isSubmitting: true, error: null });

      const faction = await kickFactionMember(targetPlayerId);

      set({
        myFaction: faction,
        isSubmitting: false,
        error: null,
        lastLoadedAt: Date.now(),
      });

      await Promise.all([get().loadMyFaction(), get().loadFactionList()]);
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao expulsar membro',
      });
      return false;
    }
  },

  transferLeadership: async (targetPlayerId) => {
    try {
      set({ isSubmitting: true, error: null });

      const faction = await transferFactionLeadership(targetPlayerId);

      set({
        myFaction: faction,
        isSubmitting: false,
        error: null,
        lastLoadedAt: Date.now(),
      });

      await Promise.all([get().loadMyFaction(), get().loadFactionList()]);
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error:
          error instanceof Error ? error.message : 'Erro ao transferir liderança',
      });
      return false;
    }
  },

  acceptJoinRequest: async (targetPlayerId) => {
    try {
      set({ isSubmitting: true, error: null });

      const faction = await acceptFactionJoinRequest(targetPlayerId);

      set({
        myFaction: faction,
        isSubmitting: false,
        error: null,
        lastLoadedAt: Date.now(),
      });

      await Promise.all([get().loadMyFaction(), get().loadFactionList()]);
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error:
          error instanceof Error ? error.message : 'Erro ao aceitar solicitação',
      });
      return false;
    }
  },

  rejectJoinRequest: async (targetPlayerId) => {
    try {
      set({ isSubmitting: true, error: null });

      const faction = await rejectFactionJoinRequest(targetPlayerId);

      set({
        myFaction: faction,
        isSubmitting: false,
        error: null,
        lastLoadedAt: Date.now(),
      });

      await Promise.all([get().loadMyFaction(), get().loadFactionList()]);
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error:
          error instanceof Error ? error.message : 'Erro ao recusar solicitação',
      });
      return false;
    }
  },

clearFaction: () => {
    set({
      myFaction: null,
      error: null,
      isLoadingMyFaction: false,
      isLoadingFactionList: false,
      isSubmitting: false,
      lastLoadedAt: null,
    });

    syncPlayerFactionId(null);
  },

  setFaction: (faction) => {
    set({
      myFaction: faction,
      error: null,
      isLoadingMyFaction: false,
      isLoadingFactionList: false,
      isSubmitting: false,
      lastLoadedAt: Date.now(),
    });

    syncPlayerFactionId(faction?.id || null);
  },
}));