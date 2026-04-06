import { create } from 'zustand';
import { fetchCurrentPlayer, syncPlayerUpdate, laundryStart, laundryComplete, canOperateLaundry } from '@/api/playerApi';
import {
  clearExpiredPunishments,
  isMoneyLaunderingBlocked,
  isDirtyMoneyBlocked,
  isCleanMoneyBlocked,
} from '@/Services/punishmentService';
import { generateUUID } from '@/lib/uuid';

const STORAGE_KEY = 'playerData';
const POLLING_INTERVAL = 3000; // 3 segundos
const GRID_WIDTH = 40;
const GRID_HEIGHT = 20;

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let pollingInterval: ReturnType<typeof setInterval> | null = null;

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

type HeaderCustomization = {
  playerNameFont: string;
  playerNameFontSize?: string;
  playerNameColor?: string;
};

type BarracoPosition = {
  x: number;
  y: number;
  z: number;
};

type MapPosition = {
  tileX: number;
  tileY: number;
};

type ActiveOperation = {
  id: string;
  operationId: string; // ID retornado pelo backend
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

type PunishmentsState = {
  active: {
    type: 'fiscal' | 'arsenal' | 'militia' | 'blitz' | 'threat';
    expiresAt: string;
  }[];
  delacao: {
    active: boolean;
    expiresAt: string | null;
  } | null;
  inventoryBlocked: boolean;
  dirtyMoneyBlocked: boolean;
  cleanMoneyBlocked: boolean;
  levelProgressionBlocked: boolean;
  inventoryBonusReductionPercent: number;
  pvpProtectionUntil: string | null;
  delacaoRewardPending: boolean;
  delacaoRewardUnlockAt: string | null;
  pendingSkillBoost: number;
  lastVehicleLost?: boolean;
};

type PurchasedAccessory = {
  accessoryId: string;
  skillType: string;
  purchasedAt: string;
};

type Accessories = {
  vehicles?: Record<string, string[]>;
  weapons?: Record<string, string[]>;
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

  mapPosition?: MapPosition;

  laundryProgress: LaundryProgress;

  punishments: PunishmentsState;

  skillBoostMultiplier: number;

  headerCustomization?: HeaderCustomization;

  ownedVehicles?: string[];

  purchasedAccessories?: PurchasedAccessory[];

  accessories?: Accessories;
};

type PlayerStore = {
  player: PlayerState;
  isLoaded: boolean;
  isSyncing: boolean;
  syncError: string | null;
  isPolling: boolean;
  pollingAttempts: number;
  maxPollingAttempts: number;
  localVersion: number;
  lastSyncAt: number;

  loadPlayer: () => void;
  setPlayer: (incoming: Partial<PlayerState>) => void;
  hydratePlayerFromServer: (playerData: Partial<PlayerState>) => void;
  clearPlayer: () => void;
  applyPlayerUpdate: (updater: (current: PlayerState) => PlayerState) => void;

  saveLocal: () => void;
  scheduleSync: () => void;
  syncPlayerToBackend: () => Promise<void>;
  
  // POLLING
  startPolling: () => void;
  stopPolling: () => void;
  pollPlayerFromBackend: () => Promise<void>;

  // BALANCES
  setBalances: (balances: Partial<Balances>) => void;
  addDirtyMoney: (amount: number) => void;
  removeDirtyMoney: (value: number) => void;
  removeDirtyMoneyPercent: (percent: number) => void;

  addCleanMoney: (amount: number) => void;
  removeCleanMoney: (amount: number) => void;

  addCorre: (amount: number) => void;
  removeCorre: (amount: number) => void;

  // INVENTORY
  removeInventoryItem: (itemId: string) => void;
  addGift: (gift: any) => void;
  addReward: (reward: any) => void;

  // NIVEIS
  setNiveis: (incoming: Partial<Niveis>) => void;

  // PAGE LEVELS
  setPageLevel: (page: string, level: number) => void;

  // SKILLS
  setSkills: (incoming: Partial<Skills>) => void;
  addSkillPercent: (skill: keyof Skills, percent: number) => void;

  // POWER / BADGE / GRID
  setPower: (value: number) => void;
  setHierarchyBadge: (badge: string) => void;
  setBarracoPosition: (position: Partial<BarracoPosition>) => void;

  // HEADER CUSTOMIZATION
  setHeaderCustomization: (customization: Partial<HeaderCustomization>) => void;

  // LAVAGEM DE DINHEIRO
  startLaundryOperation: (operation: Omit<ActiveOperation, 'status' | 'id'>) => Promise<boolean>;
  completeLaundryOperation: (operationId: string) => Promise<boolean>;
  clearFinishedLaundryOperations: () => void;
  canOperateLaundryToday: (businessId: number) => Promise<boolean>;

  // VEÍCULOS DE FUGA
  addOwnedVehicle: (vehicleId: string) => void;
  removeOwnedVehicle: (vehicleId: string) => void;
  setCleanMoney: (amount: number) => void;
  addSkillBonus: (skillType: string, percent: number) => void;

  // ACESSÓRIOS DE FUGA
  purchaseAccessory: (accessoryId: string, skillType: string) => void;
  getAccessoryBonusPercent: () => number;
  addAccessory: (type: 'vehicles' | 'weapons', itemId: string, accessoryName: string) => void;
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
    dirtyMoney: 10000000000000,
    cleanMoney: 10000000000000,
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

  mapPosition: {
    tileX: GRID_WIDTH / 2,
    tileY: GRID_HEIGHT / 2,
  },

  laundryProgress: {
    activeOperations: [],
    dailyOperations: [],
  },

  punishments: {
    active: [],
    delacao: {
      active: false,
      expiresAt: null,
    },
    inventoryBlocked: false,
    dirtyMoneyBlocked: false,
    cleanMoneyBlocked: false,
    levelProgressionBlocked: false,
    inventoryBonusReductionPercent: 0,
    pvpProtectionUntil: null,
    delacaoRewardPending: false,
    delacaoRewardUnlockAt: null,
    pendingSkillBoost: 0,
    lastVehicleLost: false,
  },

  skillBoostMultiplier: 1.0,
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

    mapPosition: {
      tileX: incoming?.mapPosition?.tileX ?? initialPlayer.mapPosition?.tileX ?? GRID_WIDTH / 2,
      tileY: incoming?.mapPosition?.tileY ?? initialPlayer.mapPosition?.tileY ?? GRID_HEIGHT / 2,
    },

    headerCustomization: {
      playerNameFont: incoming?.headerCustomization?.playerNameFont || 'oswald',
      playerNameFontSize: incoming?.headerCustomization?.playerNameFontSize || '1.875rem',
      playerNameColor: incoming?.headerCustomization?.playerNameColor || '#1a1205',
    },

    laundryProgress: {
      activeOperations: incoming?.laundryProgress?.activeOperations || initialPlayer.laundryProgress.activeOperations,
      dailyOperations: incoming?.laundryProgress?.dailyOperations || initialPlayer.laundryProgress.dailyOperations,
    },

    punishments: {
      active: incoming?.punishments?.active || initialPlayer.punishments.active,
      delacao: incoming?.punishments?.delacao || initialPlayer.punishments.delacao,
      inventoryBlocked:
        incoming?.punishments?.inventoryBlocked ?? initialPlayer.punishments.inventoryBlocked,
      dirtyMoneyBlocked:
        incoming?.punishments?.dirtyMoneyBlocked ?? initialPlayer.punishments.dirtyMoneyBlocked,
      cleanMoneyBlocked:
        incoming?.punishments?.cleanMoneyBlocked ?? initialPlayer.punishments.cleanMoneyBlocked,
      levelProgressionBlocked:
        incoming?.punishments?.levelProgressionBlocked ?? initialPlayer.punishments.levelProgressionBlocked,
      inventoryBonusReductionPercent:
        incoming?.punishments?.inventoryBonusReductionPercent ?? initialPlayer.punishments.inventoryBonusReductionPercent,
      pvpProtectionUntil:
        incoming?.punishments?.pvpProtectionUntil ?? initialPlayer.punishments.pvpProtectionUntil,
      delacaoRewardPending:
        incoming?.punishments?.delacaoRewardPending ?? initialPlayer.punishments.delacaoRewardPending,
      delacaoRewardUnlockAt:
        incoming?.punishments?.delacaoRewardUnlockAt ?? initialPlayer.punishments.delacaoRewardUnlockAt,
      pendingSkillBoost:
        incoming?.punishments?.pendingSkillBoost ?? initialPlayer.punishments.pendingSkillBoost,
      lastVehicleLost:
        incoming?.punishments?.lastVehicleLost ?? initialPlayer.punishments.lastVehicleLost,
    },

    skillBoostMultiplier: incoming?.skillBoostMultiplier ?? initialPlayer.skillBoostMultiplier,

    ownedVehicles: incoming?.ownedVehicles || initialPlayer.ownedVehicles || [],
    accessories: incoming?.accessories || initialPlayer.accessories || {},
    purchasedAccessories: incoming?.purchasedAccessories || initialPlayer.purchasedAccessories || [],
  };
}
export const usePlayerStore = create<PlayerStore>((set, get) => ({
  player: initialPlayer,
  isLoaded: false,
  isSyncing: false,
  syncError: null,
  isPolling: false,
  pollingAttempts: 0,
  maxPollingAttempts: 5,
  localVersion: 0,
  lastSyncAt: 0,

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
      const merged = clearExpiredPunishments(mergePlayer(parsed));

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
    const newVersion = get().localVersion + 1;
    const merged = mergePlayer({
      ...get().player,
      ...incoming,
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

    set({
      player: merged,
      syncError: null,
      localVersion: newVersion,
      lastSyncAt: Date.now(),
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

  applyPlayerUpdate: (updater) => {
    const current = get().player;
    const updated = mergePlayer(updater(current));
    const newVersion = get().localVersion + 1;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    set({
      player: updated,
      syncError: null,
      localVersion: newVersion,
      lastSyncAt: Date.now(),
    });

    get().scheduleSync();
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
    // Não agenda enquanto sincroniza
    if (get().isSyncing) return;

    if (syncTimeout) clearTimeout(syncTimeout);

    syncTimeout = setTimeout(() => {
      get().syncPlayerToBackend();
    }, 500);
  },

  syncPlayerToBackend: async () => {
    if (get().isSyncing) return;

    const player = get().player;

    try {
      set({
        isSyncing: true,
        syncError: null,
      });

      const data = await syncPlayerUpdate(player);
      const merged = mergePlayer(data.player);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

      set((state) => ({
        player: merged,
        isSyncing: false,
        syncError: null,
        lastSyncAt: Date.now(),
        localVersion: Math.max(state.localVersion, ((data.player as any)?.version ?? state.localVersion)),
      }));
    } catch (error) {
      console.error('Erro sync player:', error);
      set({
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Erro ao sincronizar',
      });
    }
  },
// ==========================================
// POLLING - HIDRATAÇÃO QUASE EM TEMPO REAL
// ==========================================
startPolling: () => {
  const token = localStorage.getItem('authToken');
  if (!token) return;

  // Evita múltiplas instâncias de polling
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  set({ isPolling: true });

  // Faz a primeira hidratação imediatamente
  get().pollPlayerFromBackend();

  // Depois, a cada 3 segundos
  pollingInterval = setInterval(() => {
    get().pollPlayerFromBackend();
  }, POLLING_INTERVAL);
},

stopPolling: () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  set({ isPolling: false });
},

pollPlayerFromBackend: async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    get().stopPolling();
    return;
  }

  if (get().isSyncing) return;

  try {
    const serverPlayer = await fetchCurrentPlayer();
    if (!serverPlayer) return;

    const merged = mergePlayer(serverPlayer);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

    set({
      player: merged,
      syncError: null,
      pollingAttempts: 0,
      lastSyncAt: Date.now(),
    });
  } catch (error: any) {
    console.error('Erro ao fazer polling do player:', error);

    const newAttempts = get().pollingAttempts + 1;
    set({ pollingAttempts: newAttempts });

    if (newAttempts >= get().maxPollingAttempts || error?.status === 401) {
      get().stopPolling();
      if (error?.status === 401) {
        localStorage.removeItem('authToken');
      }
    }
  }
},

// ==========================================
// SALDOS
// ==========================================
setBalances: (balances) => {
  const current = get().player;

  const updated = mergePlayer({
    ...current,
    balances: {
      ...current.balances,
      ...balances,
    },
  });

  set({ player: updated });
  get().saveLocal();
  get().scheduleSync();
},

addDirtyMoney: (amount) => {
  const current = get().player;
  if (isDirtyMoneyBlocked(current)) return;

  get().applyPlayerUpdate((player) => ({
    ...player,
    balances: {
      ...player.balances,
      dirtyMoney: player.balances.dirtyMoney + amount,
    },
  }));
},

removeDirtyMoney: (value) => {
  const current = get().player;
  if (isDirtyMoneyBlocked(current)) return;

  get().applyPlayerUpdate((player) => ({
    ...player,
    balances: {
      ...player.balances,
      dirtyMoney: Math.max(0, player.balances.dirtyMoney - value),
    },
  }));
},

removeDirtyMoneyPercent: (percent) => {
  const current = get().player;
  if (isDirtyMoneyBlocked(current)) return;

  get().applyPlayerUpdate((player) => {
    const loss = player.balances.dirtyMoney * (percent / 100);

    return {
      ...player,
      balances: {
        ...player.balances,
        dirtyMoney: Math.max(0, player.balances.dirtyMoney - loss),
      },
    };
  });
},

addCleanMoney: (amount) => {
  const current = get().player;
  if (isCleanMoneyBlocked(current)) return;

  get().applyPlayerUpdate((player) => ({
    ...player,
    balances: {
      ...player.balances,
      cleanMoney: player.balances.cleanMoney + amount,
    },
  }));
},

removeCleanMoney: (amount) => {
  const current = get().player;
  if (isCleanMoneyBlocked(current)) return;

  get().applyPlayerUpdate((player) => ({
    ...player,
    balances: {
      ...player.balances,
      cleanMoney: Math.max(0, player.balances.cleanMoney - amount),
    },
  }));
},

addCorre: (amount) => {
  get().applyPlayerUpdate((player) => ({
    ...player,
    balances: {
      ...player.balances,
      corre: player.balances.corre + amount,
    },
  }));
},

removeCorre: (amount) => {
  get().applyPlayerUpdate((player) => ({
    ...player,
    balances: {
      ...player.balances,
      corre: Math.max(0, player.balances.corre - amount),
    },
  }));
},

// ==========================================
// INVENTÁRIO
// ==========================================
removeInventoryItem: (itemId) => {
  get().applyPlayerUpdate((player) => ({
    ...player,
    inventory: {
      ...player.inventory,
      items: player.inventory.items.filter((item: any) => item?.id !== itemId && item?._id !== itemId),
    },
  }));
},

addGift: (gift) => {
  get().applyPlayerUpdate((player) => ({
    ...player,
    inventory: {
      ...player.inventory,
      gifts: [...player.inventory.gifts, gift],
    },
  }));
},

addReward: (reward) => {
  get().applyPlayerUpdate((player) => ({
    ...player,
    inventory: {
      ...player.inventory,
      rewards: [...player.inventory.rewards, reward],
    },
  }));
},

// ==========================================
// NÍVEIS E SKILLS
// ==========================================
setNiveis: (incoming) => {
  get().applyPlayerUpdate((player) => ({
    ...player,
    niveis: {
      ...player.niveis,
      ...incoming,
    },
  }));
},

setPageLevel: (page, level) => {
  get().applyPlayerUpdate((player) => ({
    ...player,
    pageLevels: {
      ...player.pageLevels,
      [page]: level,
    },
  }));
},

setSkills: (incoming) => {
  get().applyPlayerUpdate((player) => ({
    ...player,
    skills: {
      ...player.skills,
      ...incoming,
    },
  }));
},

addSkillPercent: (skill, percent) => {
  get().applyPlayerUpdate((player) => {
    const currentValue = player.skills[skill] || 0;
    const increase = currentValue * (percent / 100);

    return {
      ...player,
      skills: {
        ...player.skills,
        [skill]: currentValue + increase,
      },
    };
  });
},

setPower: (value) => {
  get().applyPlayerUpdate((player) => ({
    ...player,
    power: value,
  }));
},

setHierarchyBadge: (badge) => {
  get().applyPlayerUpdate((player) => ({
    ...player,
    hierarchyBadge: badge,
  }));
},

  // ==========================================
  // LAVAGEM DE DINHEIRO
  // ==========================================
  startLaundryOperation: async (operation) => {
    const current = get().player;

    if (isMoneyLaunderingBlocked(current)) {
      return false;
    }

    const { dirtyMoney } = current.balances;

    // Verifica se tem dinheiro sujo suficiente
    if (dirtyMoney < operation.grossAmount) {
      return false;
    }

    try {
      // Chama o backend para iniciar a operação
      const response = await laundryStart({
        businessId: operation.businessId,
        businessName: operation.businessName,
        grossAmount: operation.grossAmount,
        feePercentage: operation.feePercentage,
        feeAmount: operation.feeAmount,
        netAmount: operation.netAmount,
      });

      // Cria a operação local baseada na resposta do backend
      const newOperation: ActiveOperation = {
        ...operation,
        id: generateUUID(),
        operationId: response.operationId,
        endsAt: response.endsAt,
        status: 'processing',
      };

      // Atualiza o estado local com os dados retornados pelo backend
      const updated = mergePlayer({
        ...response.player,
        laundryProgress: {
          ...response.player.laundryProgress,
          activeOperations: [...response.player.laundryProgress.activeOperations, newOperation],
        },
      });

      get().hydratePlayerFromServer(updated);

      return true;
    } catch (error) {
      console.error('Erro ao iniciar operação de lavagem:', error);
      return false;
    }
  },

  completeLaundryOperation: async (operationId) => {
    const current = get().player;
    const operationIndex = current.laundryProgress.activeOperations.findIndex(
      (op) => op.operationId === operationId && op.status === 'processing'
    );

    if (operationIndex === -1) {
      return false;
    }

    try {
      // Chama o backend para completar a operação
      const response = await laundryComplete(operationId);

      // Atualiza o estado local com os dados retornados pelo backend
      const updated = mergePlayer(response.player);

      get().hydratePlayerFromServer(updated);

      // Limpa operações diárias antigas para manter apenas as do dia atual
      get().clearFinishedLaundryOperations();

      return true;
    } catch (error) {
      console.error('Erro ao completar operação de lavagem:', error);
      return false;
    }
  },

  clearFinishedLaundryOperations: () => {
    get().applyPlayerUpdate((player) => {
      const today = new Date().toISOString().split('T')[0];

      // Remove operações diárias de dias anteriores
      const recentDailyOps = player.laundryProgress.dailyOperations.filter(
        (op) => op.date === today
      );

      return {
        ...player,
        laundryProgress: {
          ...player.laundryProgress,
          dailyOperations: recentDailyOps,
        },
      };
    });
  },

  canOperateLaundryToday: async (businessId) => {
    try {
      const result = await canOperateLaundry(businessId);
      return result.allowed;
    } catch (error) {
      console.error('Erro ao verificar limite diário de lavagem:', error);
      // Fallback seguro: permite operar (evita bloquear o jogador por erro de rede)
      return true;
    }
  },

  setBarracoPosition: (position) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      barracoPosition: {
        ...player.barracoPosition,
        ...position,
      },
    }));
  },

  setHeaderCustomization: (customization) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      headerCustomization: {
        ...player.headerCustomization,
        ...customization,
      },
    }));
  },

  // ==========================================
  // VEÍCULOS DE FUGA
  // ==========================================
  addOwnedVehicle: (vehicleId) => {
    get().applyPlayerUpdate((player) => {
      const ownedVehicles = player.ownedVehicles || [];

      if (!ownedVehicles.includes(vehicleId)) {
        return {
          ...player,
          ownedVehicles: [...ownedVehicles, vehicleId],
        };
      }

      return player;
    });
  },

  removeOwnedVehicle: (vehicleId) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      ownedVehicles: (player.ownedVehicles || []).filter((id) => id !== vehicleId),
    }));
  },

  setCleanMoney: (amount) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      balances: {
        ...player.balances,
        cleanMoney: amount,
      },
    }));
  },

  addSkillBonus: (skillType, percent) => {
    get().applyPlayerUpdate((player) => {
      const currentValue = player.skills[skillType] || 0;

      return {
        ...player,
        skills: {
          ...player.skills,
          [skillType]: currentValue + percent,
        },
      };
    });
  },

  purchaseAccessory: (accessoryId, skillType) => {
    get().applyPlayerUpdate((player) => {
      const purchasedAccessories = player.purchasedAccessories || [];

      // Evita compras duplicadas
      if (purchasedAccessories.some((acc) => acc.accessoryId === accessoryId)) {
        return player;
      }

      const newAccessory: PurchasedAccessory = {
        accessoryId,
        skillType,
        purchasedAt: new Date().toISOString(),
      };

      return {
        ...player,
        purchasedAccessories: [...purchasedAccessories, newAccessory],
      };
    });
  },

  getAccessoryBonusPercent: () => {
    const current = get().player;
    const playerLevel = current.niveis.playerLevel || 1;

    // +1% até nível 50, +2% a partir de nível 51
    return playerLevel <= 50 ? 1 : 2;
  },

  addAccessory: (type, itemId, accessoryName) => {
    const current = get().player;
    const existing = current.accessories?.[type]?.[itemId] || [];

    if (existing.includes(accessoryName)) return;

    get().applyPlayerUpdate((player) => ({
      ...player,
      accessories: {
        ...player.accessories,
        [type]: {
          ...player.accessories?.[type],
          [itemId]: [...existing, accessoryName],
        },
      },
    }));
  },
}));
