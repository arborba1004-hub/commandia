import { create } from 'zustand';

const STORAGE_KEY = 'playerData';

export type PlayerBalances = {
  dirtyMoney: number;
  cleanMoney: number;
  corre: number;
};

export type PlayerInventory = {
  items: any[];
  gifts: any[];
  rewards: any[];
};

export type PlayerProgression = {
  playerLevel: number;
  power: number;
  hierarchyBadge: string;
  pageLevels: {
    barraco: number;
    giro: number;
    lavagem: number;
    luxury: number;
    arsenal: number;
    bribery: number;
    [key: string]: number;
  };
};

export type PlayerSkills = {
  attack: number;
  defense: number;
  intelligence: number;
  agility: number;
  respect: number;
  vigor: number;
  [key: string]: number;
};

export type Player = {
  _id?: string;
  googleId?: string;
  email: string;
  name: string;
  avatar?: string;

  balances: PlayerBalances;
  inventory: PlayerInventory;
  progression: PlayerProgression;
  skills: PlayerSkills;
};

type PlayerStore = {
  player: Player | null;
  isLoaded: boolean;
  isSyncing: boolean;
  syncError: string | null;

  loadPlayerFromStorage: () => void;
  setPlayer: (player: Player) => void;
  clearPlayer: () => void;

  setBalances: (balances: Partial<PlayerBalances>) => void;
  setInventory: (inventory: Partial<PlayerInventory>) => void;
  setProgression: (progression: Partial<PlayerProgression>) => void;
  setPageLevel: (pageKey: string, level: number) => void;
  setSkills: (skills: Partial<PlayerSkills>) => void;

  syncPlayerToBackend: () => Promise<void>;
  refreshPlayerFromBackend: () => Promise<void>;
};

const initialPlayer: Player = {
  email: '',
  name: '',
  avatar: '',

  balances: {
    dirtyMoney: 1000,
    cleanMoney: 0,
    corre: 1000,
  },

  inventory: {
    items: [],
    gifts: [],
    rewards: [],
  },

  progression: {
    playerLevel: 1,
    power: 0,
    hierarchyBadge: 'Antena',
    pageLevels: {
      barraco: 1,
      giro: 1,
      lavagem: 1,
      luxury: 1,
      arsenal: 1,
      bribery: 1,
    },
  },

  skills: {
    attack: 0,
    defense: 0,
    intelligence: 0,
    agility: 0,
    respect: 0,
    vigor: 0,
  },
};

function mergePlayerData(incoming: Partial<Player>): Player {
  return {
    ...initialPlayer,
    ...incoming,
    balances: {
      ...initialPlayer.balances,
      ...(incoming.balances || {}),
    },
    inventory: {
      ...initialPlayer.inventory,
      ...(incoming.inventory || {}),
    },
    progression: {
      ...initialPlayer.progression,
      ...(incoming.progression || {}),
      pageLevels: {
        ...initialPlayer.progression.pageLevels,
        ...(incoming.progression?.pageLevels || {}),
      },
    },
    skills: {
      ...initialPlayer.skills,
      ...(incoming.skills || {}),
    },
  };
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  player: null,
  isLoaded: false,
  isSyncing: false,
  syncError: null,

  loadPlayerFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        set({
          player: null,
          isLoaded: true,
          syncError: null,
        });
        return;
      }

      const parsed = JSON.parse(stored);
      const merged = mergePlayerData(parsed);

      set({
        player: merged,
        isLoaded: true,
        syncError: null,
      });
    } catch (error) {
      console.error('Erro ao carregar playerData:', error);
      set({
        player: null,
        isLoaded: true,
        syncError: 'Erro ao carregar player local',
      });
    }
  },

  setPlayer: (player) => {
    const merged = mergePlayerData(player);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

    set({
      player: merged,
      syncError: null,
    });
  },

  clearPlayer: () => {
    localStorage.removeItem(STORAGE_KEY);

    set({
      player: null,
      isLoaded: true,
      isSyncing: false,
      syncError: null,
    });
  },

  setBalances: (balances) => {
    const current = get().player;
    if (!current) return;

    const updated: Player = {
      ...current,
      balances: {
        ...current.balances,
        ...balances,
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ player: updated });
  },

  setInventory: (inventory) => {
    const current = get().player;
    if (!current) return;

    const updated: Player = {
      ...current,
      inventory: {
        ...current.inventory,
        ...inventory,
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ player: updated });
  },

  setProgression: (progression) => {
    const current = get().player;
    if (!current) return;

    const updated: Player = {
      ...current,
      progression: {
        ...current.progression,
        ...progression,
        pageLevels: {
          ...current.progression.pageLevels,
          ...(progression.pageLevels || {}),
        },
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ player: updated });
  },

  setPageLevel: (pageKey, level) => {
    const current = get().player;
    if (!current) return;

    const updated: Player = {
      ...current,
      progression: {
        ...current.progression,
        pageLevels: {
          ...current.progression.pageLevels,
          [pageKey]: level,
        },
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ player: updated });
  },

  setSkills: (skills) => {
    const current = get().player;
    if (!current) return;

    const updated: Player = {
      ...current,
      skills: {
        ...current.skills,
        ...skills,
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ player: updated });
  },

  syncPlayerToBackend: async () => {
    const current = get().player;
    const token = localStorage.getItem('authToken');

    if (!current || !token) return;

    try {
      set({
        isSyncing: true,
        syncError: null,
      });

      const response = await fetch('https://comando-backend.onrender.com/player/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(current),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao sincronizar player');
      }

      const merged = mergePlayerData(data.player);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

      set({
        player: merged,
        isSyncing: false,
        syncError: null,
      });
    } catch (error) {
      console.error('Erro sync player:', error);
      set({
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Erro ao sincronizar',
      });
    }
  },

  refreshPlayerFromBackend: async () => {
    const token = localStorage.getItem('authToken');
    const current = get().player;

    if (!token || !current?._id) return;

    try {
      set({
        isSyncing: true,
        syncError: null,
      });

      const response = await fetch('https://comando-backend.onrender.com/player/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(current),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao atualizar player');
      }

      const merged = mergePlayerData(data.player);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

      set({
        player: merged,
        isSyncing: false,
        syncError: null,
      });
    } catch (error) {
      console.error('Erro refresh player:', error);
      set({
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Erro ao atualizar player',
      });
    }
  },
}));