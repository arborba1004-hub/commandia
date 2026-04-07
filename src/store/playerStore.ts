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
const GRID_WIDTH = 80;
const GRID_HEIGHT = 40;

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
  worldX?: number;
  worldY?: number;
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

  notifications?: AttackNotification[];

  attackHistory?: AttackHistoryItem[];

  // Campos adicionados para sincronização completa
  vip?: boolean;
  factionId?: string | null;
  lastSkillTrainAt?: number;
  lastAttackAt?: number;
  lastPassiveIncomeAt?: number;
  lastSpinAt?: number;
  version?: number;
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

  // NOTIFICATIONS & ATTACK HISTORY
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

  mapPosition: {
    tileX: GRID_WIDTH / 2,
    tileY: GRID_HEIGHT / 2,
    worldX: GRID_WIDTH / 2,
    worldY: GRID_HEIGHT / 2,
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

  ownedVehicles: [],

  purchasedAccessories: [],

  accessories: {
    vehicles: {},
    weapons: {},
  },

  notifications: [],

  attackHistory: [],

  // Valores padrão para novos campos
  vip: false,
  factionId: null,
  lastSkillTrainAt: 0,
  lastAttackAt: 0,
  lastPassiveIncomeAt: Date.now(),
  lastSpinAt: 0,
  version: 0,
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
      worldX: incoming?.mapPosition?.worldX ?? initialPlayer.mapPosition?.worldX ?? GRID_WIDTH / 2,
      worldY: incoming?.mapPosition?.worldY ?? initialPlayer.mapPosition?.worldY ?? GRID_HEIGHT / 2,
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
    notifications: incoming?.notifications || initialPlayer.notifications || [],
    attackHistory: incoming?.attackHistory || initialPlayer.attackHistory || [],

    // Novos campos com sincronização
    vip: incoming?.vip ?? initialPlayer.vip,
    factionId: incoming?.factionId ?? initialPlayer.factionId,
    lastSkillTrainAt: incoming?.lastSkillTrainAt ?? initialPlayer.lastSkillTrainAt,
    lastAttackAt: incoming?.lastAttackAt ?? initialPlayer.lastAttackAt,
    lastPassiveIncomeAt: incoming?.lastPassiveIncomeAt ?? initialPlayer.lastPassiveIncomeAt,
    lastSpinAt: incoming?.lastSpinAt ?? initialPlayer.lastSpinAt,
    version: incoming?.version ?? initialPlayer.version,
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
      // Se o usuário está logado, não sobrescreve os dados do localStorage
      const token = localStorage.getItem('authToken');
      const stored = localStorage.getItem(STORAGE_KEY);

      // Se tem token e dados salvos, confia nos dados salvos
      if (token && stored) {
        const parsed = JSON.parse(stored);
        const merged = clearExpiredPunishments(mergePlayer(parsed));

        set({
          player: merged,
          isLoaded: true,
          syncError: null,
          lastSyncAt: Date.now(),
        });
        return;
      }

      // Se não tem dados salvos, usa o estado inicial
      if (!stored) {
        set({
          player: initialPlayer,
          isLoaded: true,
          syncError: null,
          lastSyncAt: Date.now(),
        });
        return;
      }

      // Se tem dados mas sem token, carrega normalmente
      const parsed = JSON.parse(stored);
      const merged = clearExpiredPunishments(mergePlayer(parsed));

      set({
        player: merged,
        isLoaded: true,
        syncError: null,
        lastSyncAt: Date.now(),
      });
    } catch (error) {
      console.error('Erro ao carregar playerData:', error);
      set({
        player: initialPlayer,
        isLoaded: true,
        syncError: 'Erro ao carregar player local',
        lastSyncAt: Date.now(),
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
      lastSyncAt: Date.now(),
      pollingAttempts: 0,
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

    const now = Date.now();
    // Só busca se a última alteração local foi há mais de 2 segundos
    if (now - get().lastSyncAt < 2000) return;

    try {
      const serverPlayer = await fetchCurrentPlayer();
      if (!serverPlayer) return;

      const localVersion = get().player.version || 0;
      const serverVersion = serverPlayer.version || 0;

      // Só atualiza se o servidor tiver uma versão mais nova
      if (serverVersion <= localVersion) {
        // Atualiza o timestamp mesmo sem mudar dados
        set({ lastSyncAt: Date.now() });
        return;
      }

      const currentPlayer = get().player;
      
      // ==========================================
      // MERGE INTELIGENTE: Preserva dados locais
      // ==========================================
      const intelligentMerge = mergePlayer({
        ...serverPlayer,
        
        // Preserva balances locais se forem maiores (jogador pode ter ganho localmente)
        balances: {
          dirtyMoney: Math.max(
            serverPlayer.balances?.dirtyMoney ?? currentPlayer.balances.dirtyMoney,
            currentPlayer.balances.dirtyMoney
          ),
          cleanMoney: Math.max(
            serverPlayer.balances?.cleanMoney ?? currentPlayer.balances.cleanMoney,
            currentPlayer.balances.cleanMoney
          ),
          corre: Math.max(
            serverPlayer.balances?.corre ?? currentPlayer.balances.corre,
            currentPlayer.balances.corre
          ),
        },
        
        // Preserva níveis locais se forem maiores (progresso local não deve ser perdido)
        niveis: {
          playerLevel: Math.max(
            serverPlayer.niveis?.playerLevel ?? currentPlayer.niveis.playerLevel,
            currentPlayer.niveis.playerLevel
          ),
          barracoLevel: Math.max(
            serverPlayer.niveis?.barracoLevel ?? currentPlayer.niveis.barracoLevel,
            currentPlayer.niveis.barracoLevel
          ),
          hierarchyLevel: Math.max(
            serverPlayer.niveis?.hierarchyLevel ?? currentPlayer.niveis.hierarchyLevel,
            currentPlayer.niveis.hierarchyLevel
          ),
          arsenalLevel: Math.max(
            serverPlayer.niveis?.arsenalLevel ?? currentPlayer.niveis.arsenalLevel,
            currentPlayer.niveis.arsenalLevel
          ),
          giroLevel: Math.max(
            serverPlayer.niveis?.giroLevel ?? currentPlayer.niveis.giroLevel,
            currentPlayer.niveis.giroLevel
          ),
          lavagemLevel: Math.max(
            serverPlayer.niveis?.lavagemLevel ?? currentPlayer.niveis.lavagemLevel,
            currentPlayer.niveis.lavagemLevel
          ),
          luxuryLevel: Math.max(
            serverPlayer.niveis?.luxuryLevel ?? currentPlayer.niveis.luxuryLevel,
            currentPlayer.niveis.luxuryLevel
          ),
          briberyLevel: Math.max(
            serverPlayer.niveis?.briberyLevel ?? currentPlayer.niveis.briberyLevel,
            currentPlayer.niveis.briberyLevel
          ),
        },
        
        // Preserva skills locais se forem maiores
        skills: {
          attack: Math.max(
            serverPlayer.skills?.attack ?? currentPlayer.skills.attack,
            currentPlayer.skills.attack
          ),
          defense: Math.max(
            serverPlayer.skills?.defense ?? currentPlayer.skills.defense,
            currentPlayer.skills.defense
          ),
          intelligence: Math.max(
            serverPlayer.skills?.intelligence ?? currentPlayer.skills.intelligence,
            currentPlayer.skills.intelligence
          ),
          agility: Math.max(
            serverPlayer.skills?.agility ?? currentPlayer.skills.agility,
            currentPlayer.skills.agility
          ),
          respect: Math.max(
            serverPlayer.skills?.respect ?? currentPlayer.skills.respect,
            currentPlayer.skills.respect
          ),
          vigor: Math.max(
            serverPlayer.skills?.vigor ?? currentPlayer.skills.vigor,
            currentPlayer.skills.vigor
          ),
        },
        
        // Preserva power local se for maior
        power: Math.max(
          serverPlayer.power ?? currentPlayer.power,
          currentPlayer.power
        ),
        
        // Mescla inventário: adiciona itens do servidor sem remover locais
        inventory: {
          items: [
            ...currentPlayer.inventory.items,
            ...(serverPlayer.inventory?.items || []).filter(
              (serverItem: any) =>
                !currentPlayer.inventory.items.some(
                  (localItem: any) =>
                    (localItem?.id || localItem?._id) === (serverItem?.id || serverItem?._id)
                )
            ),
          ],
          gifts: [
            ...currentPlayer.inventory.gifts,
            ...(serverPlayer.inventory?.gifts || []).filter(
              (serverGift: any) =>
                !currentPlayer.inventory.gifts.some(
                  (localGift: any) =>
                    (localGift?.id || localGift?._id) === (serverGift?.id || serverGift?._id)
                )
            ),
          ],
          rewards: [
            ...currentPlayer.inventory.rewards,
            ...(serverPlayer.inventory?.rewards || []).filter(
              (serverReward: any) =>
                !currentPlayer.inventory.rewards.some(
                  (localReward: any) =>
                    (localReward?.id || localReward?._id) === (serverReward?.id || serverReward?._id)
                )
            ),
          ],
        },
        
        // Mescla notificações: adiciona novas sem remover as locais
        notifications: [
          ...currentPlayer.notifications,
          ...(serverPlayer.notifications || []).filter(
            (serverNotif: any) =>
              !currentPlayer.notifications.some(
                (localNotif: any) => localNotif.id === serverNotif.id
              )
          ),
        ],
        
        // Mescla histórico de ataques
        attackHistory: [
          ...currentPlayer.attackHistory,
          ...(serverPlayer.attackHistory || []).filter(
            (serverItem: any) =>
              !currentPlayer.attackHistory.some(
                (localItem: any) => localItem.id === serverItem.id
              )
          ),
        ],
        
        // Preserva veículos locais e adiciona novos do servidor
        ownedVehicles: Array.from(
          new Set([
            ...(currentPlayer.ownedVehicles || []),
            ...(serverPlayer.ownedVehicles || []),
          ])
        ),
        
        // Preserva acessórios locais e mescla com servidor
        purchasedAccessories: [
          ...currentPlayer.purchasedAccessories,
          ...(serverPlayer.purchasedAccessories || []).filter(
            (serverAcc: any) =>
              !currentPlayer.purchasedAccessories.some(
                (localAcc: any) => localAcc.accessoryId === serverAcc.accessoryId
              )
          ),
        ],
        
        // Sempre usa dados do servidor para punições (crítico para segurança)
        punishments: serverPlayer.punishments || currentPlayer.punishments,
        
        // Sempre usa dados do servidor para operações de lavagem (crítico)
        laundryProgress: serverPlayer.laundryProgress || currentPlayer.laundryProgress,
        
        // Sempre usa dados do servidor para mapa (posição é crítica)
        mapPosition: serverPlayer.mapPosition || currentPlayer.mapPosition,
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(intelligentMerge));

      set({
        player: intelligentMerge,
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

    if (dirtyMoney < operation.grossAmount) {
      return false;
    }

    try {
      const response = await laundryStart({
        businessId: operation.businessId,
        businessName: operation.businessName,
        grossAmount: operation.grossAmount,
        feePercentage: operation.feePercentage,
        feeAmount: operation.feeAmount,
        netAmount: operation.netAmount,
      });

      const newOperation: ActiveOperation = {
        ...operation,
        id: generateUUID(),
        operationId: response.operationId,
        endsAt: response.endsAt,
        status: 'processing',
      };

      const updated = mergePlayer({
        ...response.player,
        laundryProgress: {
          ...response.player.laundryProgress,
          activeOperations: [
            ...response.player.laundryProgress.activeOperations,
            newOperation,
          ],
        },
      });

      get().hydratePlayerFromServer(updated);

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

  // ==========================================
  // NOTIFICATIONS & ATTACK HISTORY
  // ==========================================
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
      const updated = {
        ...player,
        balances: {
          ...player.balances,
          dirtyMoney: player.balances.dirtyMoney + payload.dirtyMoneyDelta,
        },
      };

      if (payload.notification) {
        updated.notifications = [...(updated.notifications || []), payload.notification];
      }

      if (payload.historyItem) {
        updated.attackHistory = [...(updated.attackHistory || []), payload.historyItem];
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
}));
