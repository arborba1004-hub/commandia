import { create } from 'zustand';
import { usePlayerStore } from '@/store/playerStore';

const BACKEND_URL = 'https://comando-backend.onrender.com';

export type FactionTreasury = {
  dirtyMoney: number;
  cleanMoney: number;
  corre: number;
};

export type Faction = {
  id: string;
  name: string;
  tag: string;
  leaderId: string;
  memberIds: string[];
  treasury: FactionTreasury;
  level: number;
  exp: number;
  expToNext: number;
  createdAtIso: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type FactionMember = {
  id: string;
  name: string;
  avatar: string;
  factionId: string | null;
  power: number;
  hierarchyBadge: string;
  barracoLevel: number;
  isLeader: boolean;
};

export type FactionListItem = Faction & {
  memberCount: number;
};

type FactionStore = {
  myFaction: Faction | null;
  myFactionMembers: FactionMember[];
  factionList: FactionListItem[];

  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastLoadedAt: number | null;

  loadMyFaction: () => Promise<boolean>;
  loadFactionList: () => Promise<boolean>;

  createFaction: (name: string, tag: string) => Promise<boolean>;
  joinFaction: (factionId: string) => Promise<boolean>;
  leaveFaction: () => Promise<boolean>;
  kickMember: (memberId: string) => Promise<boolean>;
  transferLeadership: (memberId: string) => Promise<boolean>;

  clearFaction: () => void;
  setFaction: (faction: Faction | null, members?: FactionMember[]) => void;
};

function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

async function factionRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.error || 'Erro ao comunicar com a facção');
    (error as any).status = response.status;
    throw error;
  }

  return data as T;
}

function normalizeFaction(input: any): Faction {
  return {
    id: String(input?.id || ''),
    name: String(input?.name || ''),
    tag: String(input?.tag || ''),
    leaderId: String(input?.leaderId || ''),
    memberIds: Array.isArray(input?.memberIds) ? input.memberIds.map(String) : [],
    treasury: {
      dirtyMoney: Number(input?.treasury?.dirtyMoney || 0),
      cleanMoney: Number(input?.treasury?.cleanMoney || 0),
      corre: Number(input?.treasury?.corre || 0),
    },
    level: Math.max(1, Number(input?.level || 1)),
    exp: Math.max(0, Number(input?.exp || 0)),
    expToNext: Math.max(1, Number(input?.expToNext || 100)),
    createdAtIso: input?.createdAtIso || null,
    createdAt: input?.createdAt || null,
    updatedAt: input?.updatedAt || null,
  };
}

function normalizeFactionMember(input: any): FactionMember {
  return {
    id: String(input?.id || ''),
    name: String(input?.name || 'Jogador'),
    avatar: String(input?.avatar || ''),
    factionId: input?.factionId ? String(input.factionId) : null,
    power: Number(input?.power || 0),
    hierarchyBadge: String(input?.hierarchyBadge || ''),
    barracoLevel: Math.max(1, Number(input?.barracoLevel || 1)),
    isLeader: Boolean(input?.isLeader),
  };
}

function normalizeFactionListItem(input: any): FactionListItem {
  return {
    ...normalizeFaction(input),
    memberCount: Math.max(
      0,
      Number(input?.memberCount ?? (Array.isArray(input?.memberIds) ? input.memberIds.length : 0))
    ),
  };
}

function syncPlayerFactionId(factionId: string | null) {
  const playerStore = usePlayerStore.getState();
  const currentPlayer = playerStore.player;

  playerStore.setPlayer({
    ...currentPlayer,
    factionId,
  } as any);
}

export const useFactionStore = create<FactionStore>((set, get) => ({
  myFaction: null,
  myFactionMembers: [],
  factionList: [],

  isLoading: false,
  isSubmitting: false,
  error: null,
  lastLoadedAt: null,

  loadMyFaction: async () => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      const response = await factionRequest<{ faction: any; members?: any[] }>('/faction/my', {
        method: 'GET',
      });

      const faction = normalizeFaction(response.faction);
      const members = Array.isArray(response.members)
        ? response.members.map(normalizeFactionMember)
        : [];

      set({
        myFaction: faction,
        myFactionMembers: members,
        isLoading: false,
        error: null,
        lastLoadedAt: Date.now(),
      });

      syncPlayerFactionId(faction.id);
      return true;
    } catch (error: any) {
      const status = error?.status;

      if (status === 404) {
        set({
          myFaction: null,
          myFactionMembers: [],
          isLoading: false,
          error: null,
          lastLoadedAt: Date.now(),
        });

        syncPlayerFactionId(null);
        return false;
      }

      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar facção',
      });

      return false;
    }
  },

  loadFactionList: async () => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      const response = await factionRequest<{ factions: any[] }>('/faction/list', {
        method: 'GET',
      });

      set({
        factionList: Array.isArray(response.factions)
          ? response.factions.map(normalizeFactionListItem)
          : [],
        isLoading: false,
        error: null,
        lastLoadedAt: Date.now(),
      });

      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao listar facções',
      });
      return false;
    }
  },

  createFaction: async (name: string, tag: string) => {
    const safeName = String(name || '').trim();
    const safeTag = String(tag || '').trim().toUpperCase();

    if (!safeName || !safeTag) {
      set({ error: 'Nome e tag são obrigatórios' });
      return false;
    }

    try {
      set({
        isSubmitting: true,
        error: null,
      });

      const response = await factionRequest<{ faction: any }>('/faction/create', {
        method: 'POST',
        body: JSON.stringify({
          name: safeName,
          tag: safeTag,
        }),
      });

      const faction = normalizeFaction(response.faction);

      set({
        myFaction: faction,
        myFactionMembers: [],
        isSubmitting: false,
        error: null,
        lastLoadedAt: Date.now(),
      });

      syncPlayerFactionId(faction.id);
      await get().loadMyFaction();
      await get().loadFactionList();
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao criar facção',
      });
      return false;
    }
  },

  joinFaction: async (factionId: string) => {
    const safeFactionId = String(factionId || '').trim();

    if (!safeFactionId) {
      set({ error: 'factionId é obrigatório' });
      return false;
    }

    try {
      set({
        isSubmitting: true,
        error: null,
      });

      const response = await factionRequest<{ faction: any }>('/faction/join', {
        method: 'POST',
        body: JSON.stringify({
          factionId: safeFactionId,
        }),
      });

      const faction = normalizeFaction(response.faction);

      set({
        myFaction: faction,
        isSubmitting: false,
        error: null,
        lastLoadedAt: Date.now(),
      });

      syncPlayerFactionId(faction.id);
      await get().loadMyFaction();
      await get().loadFactionList();
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
      set({
        isSubmitting: true,
        error: null,
      });

      await factionRequest<{ success: boolean; factionDeleted?: boolean; faction?: any }>(
        '/faction/leave',
        {
          method: 'POST',
        }
      );

      set({
        myFaction: null,
        myFactionMembers: [],
        isSubmitting: false,
        error: null,
        lastLoadedAt: Date.now(),
      });

      syncPlayerFactionId(null);
      await get().loadFactionList();
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao sair da facção',
      });
      return false;
    }
  },

  kickMember: async (memberId: string) => {
    const safeMemberId = String(memberId || '').trim();

    if (!safeMemberId) {
      set({ error: 'memberId é obrigatório' });
      return false;
    }

    try {
      set({
        isSubmitting: true,
        error: null,
      });

      const response = await factionRequest<{ success: boolean; faction: any }>('/faction/kick', {
        method: 'POST',
        body: JSON.stringify({
          memberId: safeMemberId,
        }),
      });

      const faction = normalizeFaction(response.faction);

      set((state) => ({
        myFaction: faction,
        myFactionMembers: state.myFactionMembers.filter((member) => member.id !== safeMemberId),
        isSubmitting: false,
        error: null,
        lastLoadedAt: Date.now(),
      }));

      await get().loadMyFaction();
      await get().loadFactionList();
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao expulsar membro',
      });
      return false;
    }
  },

  transferLeadership: async (memberId: string) => {
    const safeMemberId = String(memberId || '').trim();

    if (!safeMemberId) {
      set({ error: 'memberId é obrigatório' });
      return false;
    }

    try {
      set({
        isSubmitting: true,
        error: null,
      });

      const response = await factionRequest<{ success: boolean; faction: any }>(
        '/faction/transfer-leadership',
        {
          method: 'POST',
          body: JSON.stringify({
            memberId: safeMemberId,
          }),
        }
      );

      const faction = normalizeFaction(response.faction);

      set((state) => ({
        myFaction: faction,
        myFactionMembers: state.myFactionMembers.map((member) => ({
          ...member,
          isLeader: member.id === safeMemberId,
        })),
        isSubmitting: false,
        error: null,
        lastLoadedAt: Date.now(),
      }));

      await get().loadMyFaction();
      await get().loadFactionList();
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao transferir liderança',
      });
      return false;
    }
  },

  clearFaction: () => {
    set({
      myFaction: null,
      myFactionMembers: [],
      factionList: [],
      error: null,
      isLoading: false,
      isSubmitting: false,
    });

    syncPlayerFactionId(null);
  },

  setFaction: (faction, members = []) => {
    set({
      myFaction: faction,
      myFactionMembers: members,
      error: null,
      lastLoadedAt: Date.now(),
    });

    syncPlayerFactionId(faction?.id || null);
  },
}));