import {
  canOperateLaundry,
  fetchCurrentPlayerWithFaction,
  laundryCompleteWithFaction,
  laundryStartWithFaction,
  syncPlayerUpdateWithFaction,
} from '@/api/playerApi';
import { GAME_MODE } from '@/config/gameMode';
import { getBarracoUpgradeRequirements } from '@/services/barracoProgressionService';
import {
  clearExpiredPunishments,
  isCleanMoneyBlocked,
  isDirtyMoneyBlocked,
  isMoneyLaunderingBlocked,
} from '@/services/punishmentService';
import { create } from 'zustand';

const STORAGE_KEY = 'playerData';
const POLLING_INTERVAL = 3000; // 3 segundos
const GRID_WIDTH = 120;
const GRID_HEIGHT = 120;

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let pollingInterval: ReturnType<typeof setInterval> | null = null;

function getStoredAuthToken(): string | null {
  const token = localStorage.getItem('authToken');
  return token && token.trim() ? token.trim() : null;
}

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
  customName?: string;
  customAvatar?: string;
};

type BarracoPosition = {
  x: number;
  y: number;
  z: number;
};

type MapPosition = {
  tileX: number;
  tileY: number;
  worldX?: number;
  worldY?: number;
};

type ActiveOperation = {
  id: string;
  operationId: string;
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

type GangMember = {
  id: string;
  type: string;
  level: number;
  status: 'ativo' | 'ferido' | 'morto' | 'treinando';
  recruitedAt: string;
  trainingEndsAt?: string | null;
  injuryEndsAt?: string | null;
};

type GangStats = {
  totalMembers: number;
  activemembers: number;
  injuredMembers: number;
  deadMembers: number;
  trainingMembers: number;
  totalPower: number;
  averageLevel: number;
};

type AttackNotification = {
  id: string;
  type: 'attack_received' | 'attack_success' | 'revenge_available';
  attackerId?: string;
  attackerName?: string;
  targetId?: string;
  targetName?: string;
  success: boolean;
  loot: number;
  createdAt: string;
  read: boolean;
};

type AttackHistoryItem = {
  id: string;
  attackerId: string;
  attackerName: string;
  targetId: string;
  targetName: string;
  success: boolean;
  loot: number;
  createdAt: string;
  attackerGangLosses?: Record<string, number>;
  defenderGangLosses?: Record<string, number>;
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
  currentRank?: string;
  unlockedRanks?: string[];

  barracoPosition: BarracoPosition;
  mapPosition?: MapPosition;
  laundryProgress: LaundryProgress;
  punishments: PunishmentsState;
  skillBoostMultiplier: number;
  headerCustomization?: HeaderCustomization;
  ownedVehicles?: string[];
  purchasedAccessories?: PurchasedAccessory[];
  accessories?: Accessories;
  notifications?: AttackNotification[];
  attackHistory?: AttackHistoryItem[];
  factionId?: string | null;
  
  // Gang system
  gangMembers?: GangMember[];
  gangStats?: GangStats;
  lastAttackAt?: string | null;
  pvpProtectionUntil?: string | null;
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
  pendingLocalChanges: boolean;
  lastLocalMutationAt: number;
  lastServerHydrationAt: number;

  loadPlayer: () => Promise<void>;
  setPlayer: (incoming: Partial<PlayerState>) => void;
  hydratePlayerFromServer: (playerData: Partial<PlayerState>) => void;
  clearPlayer: () => void;
  applyPlayerUpdate: (updater: (current: PlayerState) => PlayerState) => void;

  saveLocal: () => void;
  scheduleSync: () => void;
  syncPlayerToBackend: () => Promise<void>;

  startPolling: () => void;
  stopPolling: () => void;
  pollPlayerFromBackend: () => Promise<void>;

  upgradeBarracoLocal: () => { ok: boolean; reason?: string; cost?: number };
  purchaseLuxuryItemLocal: (payload: {
    itemId: number;
    name: string;
    price: number;
    skillType: string;
    skillBonusPercent: number;
    insurance: boolean;
  }) => { ok: boolean; reason?: string };

  setBalances: (balances: Partial<Balances>) => void;
  addDirtyMoney: (amount: number) => void;
  removeDirtyMoney: (value: number) => void;
  removeDirtyMoneyPercent: (percent: number) => void;

  addCleanMoney: (amount: number) => void;
  removeCleanMoney: (amount: number) => void;

  addCorre: (amount: number) => void;
  removeCorre: (amount: number) => void;

  removeInventoryItem: (itemId: string) => void;
  addGift: (gift: any) => void;
  addReward: (reward: any) => void;

  setNiveis: (incoming: Partial<Niveis>) => void;
  setPageLevel: (page: string, level: number) => void;

  setSkills: (incoming: Partial<Skills>) => void;
  addSkillPercent: (skill: keyof Skills, percent: number) => void;

  setPower: (value: number) => void;
  setHierarchyBadge: (badge: string) => void;
  setCurrentRank: (rank: string) => void;
  addUnlockedRank: (rank: string) => void;
  setBarracoPosition: (position: Partial<BarracoPosition>) => void;

  setHeaderCustomization: (customization: Partial<HeaderCustomization>) => void;

  startLaundryOperation: (
    operation: Omit<ActiveOperation, 'status' | 'id'>
  ) => Promise<boolean>;
  completeLaundryOperation: (operationId: string) => Promise<boolean>;
  clearFinishedLaundryOperations: () => void;
  canOperateLaundryToday: (businessId: number) => Promise<boolean>;

  addOwnedVehicle: (vehicleId: string) => void;
  removeOwnedVehicle: (vehicleId: string) => void;
  setCleanMoney: (amount: number) => void;
  addSkillBonus: (skillType: string, percent: number) => void;

  purchaseAccessory: (accessoryId: string, skillType: string) => void;
  getAccessoryBonusPercent: () => number;
  addAccessory: (
    type: 'vehicles' | 'weapons',
    itemId: string,
    accessoryName: string
  ) => void;

  setNotifications: (notifications: AttackNotification[]) => void;
  addNotification: (notification: AttackNotification) => void;
  markNotificationAsRead: (notificationId: string) => void;

  setAttackHistory: (history: AttackHistoryItem[]) => void;
  addAttackHistoryItem: (item: AttackHistoryItem) => void;

  applyRemoteAttackResult: (payload: {
    dirtyMoneyDelta: number;
    notification?: AttackNotification;
    historyItem?: AttackHistoryItem;
    pvpProtectionUntil?: string | null;
  }) => void;

  setFactionId: (factionId: string | null) => void;

  // Gang system methods
  setGangMembers: (members: GangMember[]) => void;
  addGangMember: (member: GangMember) => void;
  updateGangMember: (memberId: string, updates: Partial<GangMember>) => void;
  removeGangMember: (memberId: string) => void;
  setGangStats: (stats: GangStats) => void;
  updateGangStats: (updates: Partial<GangStats>) => void;
  setLastAttackAt: (timestamp: string | null) => void;
  setPvpProtectionUntil: (timestamp: string | null) => void;
  getGangMemberById: (memberId: string) => GangMember | undefined;
  getActiveGangMembers: () => GangMember[];
  getInjuredGangMembers: () => GangMember[];
  getTrainingGangMembers: () => GangMember[];
  getDeadGangMembers: () => GangMember[];
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
    dirtyMoney: GAME_MODE.debugEconomy ? GAME_MODE.debugDirtyMoney : 1000,
    cleanMoney: GAME_MODE.debugEconomy ? GAME_MODE.debugCleanMoney : 0,
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
  currentRank: 'Atividade',
  unlockedRanks: ['Atividade'],

  barracoPosition: {
    x: 0,
    y: 0,
    z: 0,
  },

  mapPosition: {
    tileX: GRID_WIDTH / 2,
    tileY: GRID_HEIGHT / 2,
    worldX: 0,
    worldY: 0,
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
  notifications: [],
  attackHistory: [],
  factionId: null,
};

function mergePlayer(incoming?: Partial<PlayerState> | null): PlayerState {
  return {
    ...initialPlayer,
    ...(incoming || {}),
    _id:
      (incoming as any)?._id ||
      (incoming as any)?.id ||
      (incoming as any)?.googleId ||
      initialPlayer._id,

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
      tileX:
        incoming?.mapPosition?.tileX ??
        initialPlayer.mapPosition?.tileX ??
        GRID_WIDTH / 2,
      tileY:
        incoming?.mapPosition?.tileY ??
        initialPlayer.mapPosition?.tileY ??
        GRID_HEIGHT / 2,
      worldX:
        incoming?.mapPosition?.worldX ??
        initialPlayer.mapPosition?.worldX ??
        0,
      worldY:
        incoming?.mapPosition?.worldY ??
        initialPlayer.mapPosition?.worldY ??
        0,
    },

    headerCustomization: {
      playerNameFont:
        incoming?.headerCustomization?.playerNameFont || 'oswald',
      playerNameFontSize:
        incoming?.headerCustomization?.playerNameFontSize || '1.875rem',
      playerNameColor:
        incoming?.headerCustomization?.playerNameColor || '#1a1205',
      customName: incoming?.headerCustomization?.customName || '',
      customAvatar: incoming?.headerCustomization?.customAvatar || '',
    },

    laundryProgress: {
      activeOperations:
        incoming?.laundryProgress?.activeOperations ||
        initialPlayer.laundryProgress.activeOperations,
      dailyOperations:
        incoming?.laundryProgress?.dailyOperations ||
        initialPlayer.laundryProgress.dailyOperations,
    },

    punishments: {
      active: incoming?.punishments?.active || initialPlayer.punishments.active,
      delacao:
        incoming?.punishments?.delacao || initialPlayer.punishments.delacao,
      inventoryBlocked:
        incoming?.punishments?.inventoryBlocked ??
        initialPlayer.punishments.inventoryBlocked,
      dirtyMoneyBlocked:
        incoming?.punishments?.dirtyMoneyBlocked ??
        initialPlayer.punishments.dirtyMoneyBlocked,
      cleanMoneyBlocked:
        incoming?.punishments?.cleanMoneyBlocked ??
        initialPlayer.punishments.cleanMoneyBlocked,
      levelProgressionBlocked:
        incoming?.punishments?.levelProgressionBlocked ??
        initialPlayer.punishments.levelProgressionBlocked,
      inventoryBonusReductionPercent:
        incoming?.punishments?.inventoryBonusReductionPercent ??
        initialPlayer.punishments.inventoryBonusReductionPercent,
      pvpProtectionUntil:
        incoming?.punishments?.pvpProtectionUntil ??
        initialPlayer.punishments.pvpProtectionUntil,
      delacaoRewardPending:
        incoming?.punishments?.delacaoRewardPending ??
        initialPlayer.punishments.delacaoRewardPending,
      delacaoRewardUnlockAt:
        incoming?.punishments?.delacaoRewardUnlockAt ??
        initialPlayer.punishments.delacaoRewardUnlockAt,
      pendingSkillBoost:
        incoming?.punishments?.pendingSkillBoost ??
        initialPlayer.punishments.pendingSkillBoost,
      lastVehicleLost:
        incoming?.punishments?.lastVehicleLost ??
        initialPlayer.punishments.lastVehicleLost,
    },

    skillBoostMultiplier:
      incoming?.skillBoostMultiplier ?? initialPlayer.skillBoostMultiplier,

    ownedVehicles: incoming?.ownedVehicles || initialPlayer.ownedVehicles || [],
    accessories: incoming?.accessories || initialPlayer.accessories || {},
    purchasedAccessories:
      incoming?.purchasedAccessories ||
      initialPlayer.purchasedAccessories ||
      [],
    notifications: incoming?.notifications || initialPlayer.notifications || [],
    attackHistory: incoming?.attackHistory || initialPlayer.attackHistory || [],

    factionId: incoming?.factionId ?? initialPlayer.factionId,
  };
}

async function syncFactionStoreFromEnvelope(
  faction: any | null,
  options?: { allowClear?: boolean }
) {
  try {
    const { useFactionStore } = await import('@/store/factionStore');

    if (faction) {
      useFactionStore.getState().setFaction(faction);
      return;
    }

    if (options?.allowClear) {
      useFactionStore.getState().setFaction(null);
    }
  } catch (error) {
    console.warn(
      'Não foi possível sincronizar factionStore a partir do playerStore:',
      error
    );
  }
}

function persistMergedPlayer(playerData: Partial<PlayerState>) {
  const merged = clearExpiredPunishments(mergePlayer(playerData));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

function buildInitialState(): { player: PlayerState; isLoaded: boolean } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const merged = clearExpiredPunishments(mergePlayer(parsed));
      return { player: merged, isLoaded: true };
    }
  } catch {
    // localStorage corrompido — começa do zero
  }
  return { player: initialPlayer, isLoaded: false };
}

const _initial = buildInitialState();

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  player: _initial.player,
  isLoaded: _initial.isLoaded,
  isSyncing: false,
  syncError: null,
  isPolling: false,
  pollingAttempts: 0,
  maxPollingAttempts: 5,
  localVersion: 0,
  lastSyncAt: 0,
  pendingLocalChanges: false,
  lastLocalMutationAt: 0,
  lastServerHydrationAt: 0,

  loadPlayer: async () => {
    try {
      const token = getStoredAuthToken();
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = clearExpiredPunishments(mergePlayer(parsed));

        set({
          player: merged,
          isLoaded: true,
          syncError: null,
          lastSyncAt: Date.now(),
        });
      } else {
        set({
          player: initialPlayer,
          isLoaded: true,
          syncError: null,
          lastSyncAt: Date.now(),
        });
      }

      if (!token) return;

      const serverEnvelope = await fetchCurrentPlayerWithFaction();
      if (!serverEnvelope?.player) return;

      const mergedServer = persistMergedPlayer(serverEnvelope.player);

      set({
        player: mergedServer,
        isLoaded: true,
        syncError: null,
        lastSyncAt: Date.now(),
        pollingAttempts: 0,
      });

      await syncFactionStoreFromEnvelope(serverEnvelope.faction, {
        allowClear: serverEnvelope.player?.factionId == null,
      });
    } catch (error) {
      console.error('Erro ao carregar playerData:', error);
      set((state) => ({
        player: state.player,
        isLoaded: true,
        syncError: 'Erro ao carregar player',
        lastSyncAt: Date.now(),
      }));
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
      lastLocalMutationAt: Date.now(),
      pendingLocalChanges: true,
    });

    get().scheduleSync();
  },

  hydratePlayerFromServer: (playerData) => {
    const merged = persistMergedPlayer(playerData);

    set({
      player: merged,
      isLoaded: true,
      syncError: null,
      lastSyncAt: Date.now(),
      lastServerHydrationAt: Date.now(),
      pollingAttempts: 0,
      pendingLocalChanges: false,
    });

    void syncFactionStoreFromEnvelope((playerData as any)?.faction ?? null, {
      allowClear: (playerData as any)?.factionId == null,
    });
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
      lastLocalMutationAt: Date.now(),
      pendingLocalChanges: true,
    });

    get().scheduleSync();
  },

  clearPlayer: () => {
    localStorage.removeItem(STORAGE_KEY);

    if (syncTimeout) {
      clearTimeout(syncTimeout);
      syncTimeout = null;
    }

    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }

    set({
      player: initialPlayer,
      isLoaded: true,
      isSyncing: false,
      syncError: null,
      isPolling: false,
      pollingAttempts: 0,
      localVersion: 0,
      lastSyncAt: 0,
      pendingLocalChanges: false,
      lastLocalMutationAt: 0,
      lastServerHydrationAt: 0,
    });

    void syncFactionStoreFromEnvelope(null, { allowClear: true });
  },

  saveLocal: () => {
    const player = get().player;
    persistMergedPlayer(player);
  },

  scheduleSync: () => {
    if (get().isSyncing) return;
    if (!getStoredAuthToken()) return;

    if (syncTimeout) clearTimeout(syncTimeout);

    syncTimeout = setTimeout(() => {
      void get().syncPlayerToBackend();
    }, 500);
  },

  syncPlayerToBackend: async () => {
    if (get().isSyncing) return;
    if (!getStoredAuthToken()) return;

    const player = get().player;

    try {
      set({
        isSyncing: true,
        syncError: null,
      });

      const data = await syncPlayerUpdateWithFaction(player);
      const merged = persistMergedPlayer(data.player);

      set((state) => ({
        player: merged,
        isSyncing: false,
        syncError: null,
        lastSyncAt: Date.now(),
        lastServerHydrationAt: Date.now(),
        pendingLocalChanges: false,
        localVersion: Math.max(
          state.localVersion,
          ((data.player as any)?.version ?? state.localVersion)
        ),
      }));

      await syncFactionStoreFromEnvelope(data.faction, {
        allowClear: data.player?.factionId == null,
      });
    } catch (error) {
      console.error('Erro sync player:', error);
      set({
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Erro ao sincronizar',
      });
    }
  },

  startPolling: () => {
    const token = getStoredAuthToken();
    if (!token) return;

    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    set({ isPolling: true });

    void get().pollPlayerFromBackend();

    pollingInterval = setInterval(() => {
      void get().pollPlayerFromBackend();
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
    const token = getStoredAuthToken();
    if (!token) {
      get().stopPolling();
      return;
    }

    if (get().isSyncing) return;

    const now = Date.now();
    const msSinceLastLocalChange = now - get().lastLocalMutationAt;

    if (msSinceLastLocalChange < 1500) return;

    if (get().pendingLocalChanges && now - get().lastLocalMutationAt < 8000) {
      return;
    }

    try {
      const serverEnvelope = await fetchCurrentPlayerWithFaction();
      if (!serverEnvelope?.player) return;

      const merged = persistMergedPlayer(serverEnvelope.player);

      set({
        player: merged,
        syncError: null,
        pollingAttempts: 0,
        lastSyncAt: Date.now(),
        pendingLocalChanges: false,
        lastServerHydrationAt: Date.now(),
      });

      await syncFactionStoreFromEnvelope(serverEnvelope.faction, {
        allowClear: serverEnvelope.player?.factionId == null,
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
setBalances: (balances) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      balances: {
        ...player.balances,
        ...balances,
      },
    }));
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

  removeInventoryItem: (itemId) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      inventory: {
        ...player.inventory,
        items: player.inventory.items.filter(
          (item: any) => item?.id !== itemId && item?._id !== itemId
        ),
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

  setCurrentRank: (rank) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      currentRank: rank,
    }));
  },

  addUnlockedRank: (rank) => {
    get().applyPlayerUpdate((player) => {
      const unlockedRanks = player.unlockedRanks || [];
      if (!unlockedRanks.includes(rank)) {
        return {
          ...player,
          unlockedRanks: [...unlockedRanks, rank],
        };
      }
      return player;
    });
  },

  startLaundryOperation: async (operation) => {
    const current = get().player;

    if (isMoneyLaunderingBlocked(current)) {
      return false;
    }

    const { dirtyMoney } = current.balances;

    if (dirtyMoney < operation.grossAmount) {
      return false;
    }

    try {
      const response = await laundryStartWithFaction({
        businessId: operation.businessId,
        businessName: operation.businessName,
        grossAmount: operation.grossAmount,
        feePercentage: operation.feePercentage,
        feeAmount: operation.feeAmount,
        netAmount: operation.netAmount,
      });

      const updated = persistMergedPlayer(response.player);

      set({
        player: updated,
        syncError: null,
        lastSyncAt: Date.now(),
        pollingAttempts: 0,
        pendingLocalChanges: false,
        lastServerHydrationAt: Date.now(),
      });

      await syncFactionStoreFromEnvelope(response.faction);

      return true;
    } catch (error: any) {
      console.error('Erro ao iniciar operação de lavagem:', error);
      throw error;
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
      const response = await laundryCompleteWithFaction(operationId);
      const updated = persistMergedPlayer(response.player);

      set({
        player: updated,
        syncError: null,
        lastSyncAt: Date.now(),
        pollingAttempts: 0,
        pendingLocalChanges: false,
        lastServerHydrationAt: Date.now(),
      });

      await syncFactionStoreFromEnvelope(response.faction);

      get().clearFinishedLaundryOperations();

      return true;
    } catch (error) {
      console.error('Erro ao completar operação de lavagem:', error);
      return false;
    }
  },

  clearFinishedLaundryOperations: () => {
    const current = get().player;
    const today = new Date().toISOString().split('T')[0];

    const updated = mergePlayer({
      ...current,
      laundryProgress: {
        ...current.laundryProgress,
        dailyOperations: current.laundryProgress.dailyOperations.filter(
          (op) => op.date === today
        ),
      },
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    set({
      player: updated,
      syncError: null,
      lastSyncAt: Date.now(),
    });
  },

  canOperateLaundryToday: async (businessId) => {
    try {
      const result = await canOperateLaundry(businessId);
      return result.allowed;
    } catch (error) {
      console.error('Erro ao verificar limite diário de lavagem:', error);
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
    return playerLevel <= 50 ? 1 : 2;
  },

  addAccessory: (type, itemId, accessoryName) => {
    get().applyPlayerUpdate((player) => {
      const existing = player.accessories?.[type]?.[itemId] || [];

      if (existing.includes(accessoryName)) {
        return player;
      }

      return {
        ...player,
        accessories: {
          ...player.accessories,
          [type]: {
            ...player.accessories?.[type],
            [itemId]: [...existing, accessoryName],
          },
        },
      };
    });
  },

setNotifications: (notifications) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      notifications,
    }));
  },

  addNotification: (notification) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      notifications: [...(player.notifications || []), notification],
    }));
  },

  markNotificationAsRead: (notificationId) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      notifications: (player.notifications || []).map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      ),
    }));
  },

  setAttackHistory: (history) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      attackHistory: history,
    }));
  },

  addAttackHistoryItem: (item) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      attackHistory: [...(player.attackHistory || []), item],
    }));
  },

  applyRemoteAttackResult: (payload) => {
    get().applyPlayerUpdate((player) => {
      const updated: PlayerState = {
        ...player,
        balances: {
          ...player.balances,
          dirtyMoney: Math.max(
            0,
            player.balances.dirtyMoney + payload.dirtyMoneyDelta
          ),
        },
      };

      if (payload.notification) {
        updated.notifications = [
          ...(updated.notifications || []),
          payload.notification,
        ];
      }

      if (payload.historyItem) {
        updated.attackHistory = [
          ...(updated.attackHistory || []),
          payload.historyItem,
        ];
      }

      if (payload.pvpProtectionUntil !== undefined) {
        updated.punishments = {
          ...updated.punishments,
          pvpProtectionUntil: payload.pvpProtectionUntil,
        };
      }

      return updated;
    });
  },

  upgradeBarracoLocal: () => {
    const player = get().player;
    const requirements = getBarracoUpgradeRequirements(player);

    if (!requirements.allowed) {
      return {
        ok: false,
        reason: requirements.reason,
      };
    }

    const cost = requirements.cost;

    get().applyPlayerUpdate((current) => ({
      ...current,
      niveis: {
        ...current.niveis,
        barracoLevel: current.niveis.barracoLevel + 1,
      },
      pageLevels: {
        ...current.pageLevels,
        barraco: current.niveis.barracoLevel + 1,
      },
      balances: {
        ...current.balances,
        cleanMoney: Math.max(0, current.balances.cleanMoney - cost),
      },
    }));

    return {
      ok: true,
      cost,
    };
  },

  purchaseLuxuryItemLocal: ({
    itemId,
    name,
    price,
    skillType,
    skillBonusPercent,
    insurance,
  }) => {
    const player = get().player;
    const cleanMoney = player?.balances?.cleanMoney ?? 0;

    if (cleanMoney < price) {
      return { ok: false, reason: 'Saldo insuficiente' };
    }

    const playerLevel = player?.niveis?.playerLevel ?? 1;

    const alreadyOwned = (player?.inventory?.items || []).some(
      (item: any) => item.itemId === itemId && item.level === playerLevel
    );

    if (alreadyOwned) {
      return { ok: false, reason: 'Item já comprado neste nível' };
    }

    const newItem = {
      id: `${itemId}-${playerLevel}-${Date.now()}`,
      itemId,
      name,
      price,
      purchasedAt: new Date().toISOString(),
      insurance,
      level: playerLevel,
    };

    get().applyPlayerUpdate((current) => ({
      ...current,
      balances: {
        ...current.balances,
        cleanMoney: current.balances.cleanMoney - price,
      },
      inventory: {
        ...current.inventory,
        items: [...(current.inventory?.items || []), newItem],
      },
      skills: {
        ...current.skills,
        [skillType]: Number(
          ((current.skills?.[skillType] || 0) + skillBonusPercent).toFixed(2)
        ),
      },
      pageLevels: {
        ...current.pageLevels,
        luxury: Math.max(current.pageLevels?.luxury || 1, playerLevel),
      },
    }));

    return { ok: true };
  },

  setFactionId: (factionId) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      factionId,
    }));
  },

  setGangMembers: (members) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      gangMembers: members,
    }));
  },

  addGangMember: (member) => {
    get().applyPlayerUpdate((player) => {
      const existing = player.gangMembers || [];
      return {
        ...player,
        gangMembers: [...existing, member],
      };
    });
  },

  updateGangMember: (memberId, updates) => {
    get().applyPlayerUpdate((player) => {
      const members = (player.gangMembers || []).map((m) =>
        m.id === memberId ? { ...m, ...updates } : m
      );
      return {
        ...player,
        gangMembers: members,
      };
    });
  },

  removeGangMember: (memberId) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      gangMembers: (player.gangMembers || []).filter((m) => m.id !== memberId),
    }));
  },

  setGangStats: (stats) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      gangStats: stats,
    }));
  },

  updateGangStats: (updates) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      gangStats: {
        ...player.gangStats,
        ...updates,
      },
    }));
  },

  setLastAttackAt: (timestamp) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      lastAttackAt: timestamp,
    }));
  },

  setPvpProtectionUntil: (timestamp) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      pvpProtectionUntil: timestamp,
    }));
  },

  getGangMemberById: (memberId) => {
    const members = get().player.gangMembers || [];
    return members.find((m) => m.id === memberId);
  },

  getActiveGangMembers: () => {
    const members = get().player.gangMembers || [];
    return members.filter((m) => m.status === 'ativo');
  },

  getInjuredGangMembers: () => {
    const members = get().player.gangMembers || [];
    return members.filter((m) => m.status === 'ferido');
  },

  getTrainingGangMembers: () => {
    const members = get().player.gangMembers || [];
    return members.filter((m) => m.status === 'treinando');
  },

  getDeadGangMembers: () => {
    const members = get().player.gangMembers || [];
    return members.filter((m) => m.status === 'morto');
  },
}));
