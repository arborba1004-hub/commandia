import { create } from 'zustand';
import { syncPlayerUpdate } from '@/api/game';

const STORAGE_KEY = 'playerData';

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

type Balances = {
  dirtyMoney: number;
  cleanMoney: number;
  corre: number;
};

type Inventory = {
  items: any[];
  gifts: any[];
  rewards: any[];
};

type PageLevels = {
  barraco: number;
  giro: number;
  lavagem: number;
  luxury: number;
  arsenal: number;
  bribery: number;
  hierarchy: number;
  home: number;
  game: number;
  [key: string]: number;
};

type Skills = {
  attack: number;
  defense: number;
  intelligence: number;
  agility: number;
  respect: number;
  vigor: number;
  [key: string]: number;
};

type Niveis = {
  playerLevel: number;
  barracoLevel: number;
  hierarchyLevel: number;
  arsenalLevel: number;
  giroLevel: number;
  lavagemLevel: number;
  luxuryLevel: number;
  briberyLevel: number;
};

type BarracoPosition = {
  x: number;
  y: number;
  z: number;
};

type ActiveOperation = {
  businessId: number;
  businessName: string;
  startedAt: string;
  endsAt: string;
  grossAmount: number;
  feePercentage: number;
  feeAmount: number;
  netAmount: number;
  status: 'processing' | 'completed';
};

type DailyOperation = {
  businessId: number;
  date: string;
  amount: number;
};

type LaundryProgress = {
  activeOperations: ActiveOperation[];
  dailyOperations: DailyOperation[];
};

export type PlayerState = {
  _id?: string;
  googleId?: string;
  email?: string;
  name?: string;
  avatar?: string;

  niveis: Niveis;

  balances: Balances;

  inventory: Inventory;

  pageLevels: PageLevels;

  skills: Skills;

  power: number;
  hierarchyBadge: string;

  barracoPosition: BarracoPosition;

  laundryProgress: LaundryProgress;
};

type PlayerStore = {
  player: PlayerState;
  isLoaded: boolean;
  isSyncing: boolean;
  syncError: string | null;

  loadPlayer: () => void;
  setPlayer: (incoming: Partial<PlayerState>) => void;
  hydratePlayerFromServer: (playerData: Partial<PlayerState>) => void;
  clearPlayer: () => void;

  saveLocal: () => void;
  scheduleSync: () => void;
  syncPlayerToBackend: () => Promise<void>;

  // BALANCES
  addDirtyMoney: (amount: number) => void;
  removeDirtyMoney: (amount: number) => void;
  removeDirtyMoneyPercent: (percent: number) => void;

  addCleanMoney: (amount: number) => void;
  removeCleanMoney: (amount: number) => void;

  addCorre: (amount: number) => void;
  removeCorre: (amount: number) => void;

  // INVENTORY
  addInventoryItem: (item: any) => void;
  removeInventoryItem: (itemId: string) => void;
  addGift: (gift: any) => void;
  addReward: (reward: any) => void;

  // NIVEIS
  setNiveis: (incoming: Partial<Niveis>) => void;

  // PAGE LEVELS
  setPageLevel: (page: string, level: number) => void;

  // SKILLS
  setSkills: (incoming: Partial<Skills>) => void;
  addSkill: (skill: keyof Skills, value: number) => void;
  addSkillPercent: (skill: keyof Skills, percent: number) => void;

  // POWER / BADGE / GRID
  setPower: (value: number) => void;
  setHierarchyBadge: (badge: string) => void;
  setBarracoPosition: (position: Partial<BarracoPosition>) => void;

  // LAVAGEM DE DINHEIRO
  startLaundryOperation: (operation: Omit<ActiveOperation, 'status'>) => boolean;
  completeLaundryOperation: (businessId: number) => boolean;
  hydrateLaundryProgress: () => void;
  clearFinishedLaundryOperations: () => void;
  canOperateLaundryToday: (businessId: number, maxPerDay: number) => boolean;
};

const initialPlayer: PlayerState = {
  _id: '',
  googleId: '',
  email: '',
  name: '',
  avatar: '',

  niveis: {
    playerLevel: 1,
    barracoLevel: 1,
    hierarchyLevel: 1,
    arsenalLevel: 1,
    giroLevel: 1,
    lavagemLevel: 1,
    luxuryLevel: 1,
    briberyLevel: 1,
  },

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

  pageLevels: {
    barraco: 1,
    giro: 1,
    lavagem: 1,
    luxury: 1,
    arsenal: 1,
    bribery: 1,
    hierarchy: 1,
    home: 1,
    game: 1,
  },

  skills: {
    attack: 0,
    defense: 0,
    intelligence: 0,
    agility: 0,
    respect: 0,
    vigor: 0,
  },

  power: 0,
  hierarchyBadge: 'Antena',

  barracoPosition: {
    x: 0,
    y: 0,
    z: 0,
  },

  laundryProgress: {
    activeOperations: [],
    dailyOperations: [],
  },
};

function mergePlayer(incoming?: Partial<PlayerState> | null): PlayerState {
  return {
    ...initialPlayer,
    ...(incoming || {}),

    niveis: {
      ...initialPlayer.niveis,
      ...(incoming?.niveis || {}),
    },

    balances: {
      ...initialPlayer.balances,
      ...(incoming?.balances || {}),
    },

    inventory: {
      ...initialPlayer.inventory,
      ...(incoming?.inventory || {}),
      items: incoming?.inventory?.items || initialPlayer.inventory.items,
      gifts: incoming?.inventory?.gifts || initialPlayer.inventory.gifts,
      rewards: incoming?.inventory?.rewards || initialPlayer.inventory.rewards,
    },

    pageLevels: {
      ...initialPlayer.pageLevels,
      ...(incoming?.pageLevels || {}),
    },

    skills: {
      ...initialPlayer.skills,
      ...(incoming?.skills || {}),
    },

    barracoPosition: {
      ...initialPlayer.barracoPosition,
      ...(incoming?.barracoPosition || {}),
    },

    laundryProgress: {
      activeOperations: incoming?.laundryProgress?.activeOperations || initialPlayer.laundryProgress.activeOperations,
      dailyOperations: incoming?.laundryProgress?.dailyOperations || initialPlayer.laundryProgress.dailyOperations,
    },
  };
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  player: initialPlayer,
  isLoaded: false,
  isSyncing: false,
  syncError: null,

  loadPlayer: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        set({
          player: initialPlayer,
          isLoaded: true,
          syncError: null,
        });
        return;
      }

      const parsed = JSON.parse(stored);
      const merged = mergePlayer(parsed);

      set({
        player: merged,
        isLoaded: true,
        syncError: null,
      });
    } catch (error) {
      console.error('Erro ao carregar playerData:', error);
      set({
        player: initialPlayer,
        isLoaded: true,
        syncError: 'Erro ao carregar player local',
      });
    }
  },

  setPlayer: (incoming) => {
    const merged = mergePlayer({
      ...get().player,
      ...incoming,
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

    set({
      player: merged,
      syncError: null,
    });

    get().scheduleSync();
  },

  hydratePlayerFromServer: (playerData) => {
    const merged = mergePlayer(playerData);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

    set({
      player: merged,
      syncError: null,
    });

    // Não dispara scheduleSync para evitar loop de sincronização
  },

  clearPlayer: () => {
    localStorage.removeItem(STORAGE_KEY);

    set({
      player: initialPlayer,
      isLoaded: true,
      isSyncing: false,
      syncError: null,
    });
  },

  saveLocal: () => {
    const player = get().player;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
  },

  scheduleSync: () => {
    if (syncTimeout) clearTimeout(syncTimeout);

    syncTimeout = setTimeout(() => {
      get().syncPlayerToBackend();
    }, 500);
  },

  syncPlayerToBackend: async () => {
    const player = get().player;

    try {
      set({
        isSyncing: true,
        syncError: null,
      });

      const data = await syncPlayerUpdate(player);

      const merged = mergePlayer(data.player);

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

  addDirtyMoney: (amount) => {
    const current = get().player;

    const updated = mergePlayer({
      ...current,
      balances: {
        ...current.balances,
        dirtyMoney: current.balances.dirtyMoney + amount,
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  removeDirtyMoney: (amount) => {
    const current = get().player;

    const updated = mergePlayer({
      ...current,
      balances: {
        ...current.balances,
        dirtyMoney: Math.max(0, current.balances.dirtyMoney - amount),
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  removeDirtyMoneyPercent: (percent) => {
    const current = get().player;
    const loss = current.balances.dirtyMoney * (percent / 100);

    const updated = mergePlayer({
      ...current,
      balances: {
        ...current.balances,
        dirtyMoney: Math.max(0, current.balances.dirtyMoney - loss),
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  addCleanMoney: (amount) => {
    const current = get().player;

    const updated = mergePlayer({
      ...current,
      balances: {
        ...current.balances,
        cleanMoney: current.balances.cleanMoney + amount,
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  removeCleanMoney: (amount) => {
    const current = get().player;

    const updated = mergePlayer({
      ...current,
      balances: {
        ...current.balances,
        cleanMoney: Math.max(0, current.balances.cleanMoney - amount),
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  addCorre: (amount) => {
    const current = get().player;

    const updated = mergePlayer({
      ...current,
      balances: {
        ...current.balances,
        corre: current.balances.corre + amount,
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  removeCorre: (amount) => {
    const current = get().player;

    const updated = mergePlayer({
      ...current,
      balances: {
        ...current.balances,
        corre: Math.max(0, current.balances.corre - amount),
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  addInventoryItem: (item) => {
    const current = get().player;

    const updated = mergePlayer({
      ...current,
      inventory: {
        ...current.inventory,
        items: [...current.inventory.items, item],
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  removeInventoryItem: (itemId) => {
    const current = get().player;

    const updated = mergePlayer({
      ...current,
      inventory: {
        ...current.inventory,
        items: current.inventory.items.filter((item: any) => item?.id !== itemId && item?._id !== itemId),
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  addGift: (gift) => {
    const current = get().player;

    const updated = mergePlayer({
      ...current,
      inventory: {
        ...current.inventory,
        gifts: [...current.inventory.gifts, gift],
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  addReward: (reward) => {
    const current = get().player;

    const updated = mergePlayer({
      ...current,
      inventory: {
        ...current.inventory,
        rewards: [...current.inventory.rewards, reward],
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  setNiveis: (incoming) => {
    const current = get().player;

    const updated = mergePlayer({
      ...current,
      niveis: {
        ...current.niveis,
        ...incoming,
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  setPageLevel: (page, level) => {
    const current = get().player;

    const updated = mergePlayer({
      ...current,
      pageLevels: {
        ...current.pageLevels,
        [page]: level,
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  setSkills: (incoming) => {
    const current = get().player;

    const updated = mergePlayer({
      ...current,
      skills: {
        ...current.skills,
        ...incoming,
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  addSkill: (skill, value) => {
    const current = get().player;

    const updated = mergePlayer({
      ...current,
      skills: {
        ...current.skills,
        [skill]: (current.skills[skill] || 0) + value,
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  addSkillPercent: (skill, percent) => {
    const current = get().player;
    const currentValue = current.skills[skill] || 0;
    const increase = currentValue * (percent / 100);

    const updated = mergePlayer({
      ...current,
      skills: {
        ...current.skills,
        [skill]: currentValue + increase,
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  setPower: (value) => {
    const current = get().player;

    const updated = mergePlayer({
      ...current,
      power: value,
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  setHierarchyBadge: (badge) => {
    const current = get().player;

    const updated = mergePlayer({
      ...current,
      hierarchyBadge: badge,
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  setBarracoPosition: (position) => {
    const current = get().player;

    const updated = mergePlayer({
      ...current,
      barracoPosition: {
        ...current.barracoPosition,
        ...position,
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  startLaundryOperation: (operation) => {
    const current = get().player;
    const { dirtyMoney } = current.balances;

    // Verifica se tem dinheiro sujo suficiente
    if (dirtyMoney < operation.grossAmount) {
      return false;
    }

    // Debita o dinheiro sujo
    const newDirtyMoney = dirtyMoney - operation.grossAmount;

    // Cria a operação com status 'processing'
    const newOperation: ActiveOperation = {
      ...operation,
      status: 'processing',
    };

    const updated = mergePlayer({
      ...current,
      balances: {
        ...current.balances,
        dirtyMoney: newDirtyMoney,
      },
      laundryProgress: {
        ...current.laundryProgress,
        activeOperations: [...current.laundryProgress.activeOperations, newOperation],
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();

    return true;
  },

  completeLaundryOperation: (businessId) => {
    const current = get().player;
    const operationIndex = current.laundryProgress.activeOperations.findIndex(
      (op) => op.businessId === businessId && op.status === 'processing'
    );

    if (operationIndex === -1) {
      return false;
    }

    const operation = current.laundryProgress.activeOperations[operationIndex];
    const today = new Date().toISOString().split('T')[0];

    // Marca como completa
    const completedOperation: ActiveOperation = {
      ...operation,
      status: 'completed',
    };

    // Registra na operação diária
    const dailyOp: DailyOperation = {
      businessId: operation.businessId,
      date: today,
      amount: operation.netAmount,
    };

    // Remove da lista de ativas e adiciona à diária
    const activeOps = current.laundryProgress.activeOperations.filter(
      (_, idx) => idx !== operationIndex
    );

    // Credita o dinheiro limpo
    const newCleanMoney = current.balances.cleanMoney + operation.netAmount;

    const updated = mergePlayer({
      ...current,
      balances: {
        ...current.balances,
        cleanMoney: newCleanMoney,
      },
      laundryProgress: {
        activeOperations: activeOps,
        dailyOperations: [...current.laundryProgress.dailyOperations, dailyOp],
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();

    return true;
  },

  hydrateLaundryProgress: () => {
    const current = get().player;
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Limpa operações ativas que expiraram
    const activeOps = current.laundryProgress.activeOperations.filter((op) => {
      const endsAt = new Date(op.endsAt);
      return endsAt > now;
    });

    // Completa automaticamente operações que chegaram ao tempo
    const completedOps: DailyOperation[] = [];
    const newActiveOps: ActiveOperation[] = [];

    current.laundryProgress.activeOperations.forEach((op) => {
      const endsAt = new Date(op.endsAt);
      if (endsAt <= now && op.status === 'processing') {
        // Completa a operação
        completedOps.push({
          businessId: op.businessId,
          date: today,
          amount: op.netAmount,
        });
      } else if (endsAt > now) {
        newActiveOps.push(op);
      }
    });

    // Soma o dinheiro limpo das operações completadas
    const totalCleanMoneyFromCompleted = completedOps.reduce((sum, op) => sum + op.amount, 0);

    const updated = mergePlayer({
      ...current,
      balances: {
        ...current.balances,
        cleanMoney: current.balances.cleanMoney + totalCleanMoneyFromCompleted,
      },
      laundryProgress: {
        activeOperations: newActiveOps,
        dailyOperations: [...current.laundryProgress.dailyOperations, ...completedOps],
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  clearFinishedLaundryOperations: () => {
    const current = get().player;
    const today = new Date().toISOString().split('T')[0];

    // Remove operações diárias de dias anteriores
    const recentDailyOps = current.laundryProgress.dailyOperations.filter(
      (op) => op.date === today
    );

    const updated = mergePlayer({
      ...current,
      laundryProgress: {
        ...current.laundryProgress,
        dailyOperations: recentDailyOps,
      },
    });

    set({ player: updated });
    get().saveLocal();
    get().scheduleSync();
  },

  canOperateLaundryToday: (businessId, maxPerDay) => {
    const current = get().player;
    const today = new Date().toISOString().split('T')[0];

    // Conta quantas operações foram completadas hoje para este negócio
    const operationsToday = current.laundryProgress.dailyOperations.filter(
      (op) => op.businessId === businessId && op.date === today
    ).length;

    return operationsToday < maxPerDay;
  },
}));