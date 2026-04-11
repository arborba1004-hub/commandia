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
  createdAtIso: string;
  createdAt?: string;
  updatedAt?: string;
};

type FactionStore = {
  myFaction: Faction | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastLoadedAt: number | null;

  loadMyFaction: () => Promise<boolean>;
  createFaction: (name: string, tag: string) => Promise<boolean>;
  joinFaction: (factionId: string) => Promise<boolean>;

  clearFaction: () => void;
  setFaction: (faction: Faction | null) => void;
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
    createdAtIso: String(input?.createdAtIso || ''),
    createdAt: input?.createdAt,
    updatedAt: input?.updatedAt,
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

export const useFactionStore = create<FactionStore>((set) => ({
  myFaction: null,
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

      const response = await factionRequest<{ faction: any }>('/faction/my', {
        method: 'GET',
      });

      const faction = normalizeFaction(response.faction);

      set({
        myFaction: faction,
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

  createFaction: async (name: string, tag: string) => {
    const safeName = String(name || '').trim();
    const safeTag = String(tag || '').trim().toUpperCase();

    if (!safeName || !safeTag) {
      set({
        error: 'Nome e tag são obrigatórios',
      });
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
        isSubmitting: false,
        error: null,
        lastLoadedAt: Date.now(),
      });

      syncPlayerFactionId(faction.id);
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
      set({
        error: 'factionId é obrigatório',
      });
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
      return true;
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Erro ao entrar na facção',
      });
      return false;
    }
  },

  clearFaction: () => {
    set({
      myFaction: null,
      error: null,
      isLoading: false,
      isSubmitting: false,
    });

    syncPlayerFactionId(null);
  },

  setFaction: (faction) => {
    set({
      myFaction: faction,
      error: null,
      lastLoadedAt: Date.now(),
    });

    syncPlayerFactionId(faction?.id || null);
  },
}));