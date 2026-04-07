import { create } from 'zustand';
import { fetchCurrentPlayer, syncPlayerUpdate, laundryStart, laundryComplete, canOperateLaundry } from '@/api/playerApi';
import { clearExpiredPunishments, isMoneyLaunderingBlocked, isDirtyMoneyBlocked, isCleanMoneyBlocked } from '@/Services/punishmentService';
import { generateUUID } from '@/lib/uuid';
import { initiateAttack, calculateGangBattlePower } from '@/api/attackApi';
import { useGangBattleStore } from '@/stores/gangBattleStore';

const STORAGE_KEY = 'playerData';
const POLLING_INTERVAL = 5000;
let pollingInterval: ReturnType<typeof setInterval> | null = null;

// ==================== TIPOS ====================
type Balances = { dirtyMoney: number; cleanMoney: number; corre: number; };
type Inventory = { items: any[]; gifts: any[]; rewards: any[]; };
type PageLevels = { barraco: number; giro: number; lavagem: number; luxury: number; arsenal: number; bribery: number; hierarchy: number; home: number; game: number; };
type Skills = { attack: number; defense: number; intelligence: number; agility: number; respect: number; vigor: number; };
type Niveis = { playerLevel: number; barracoLevel: number; hierarchyLevel: number; arsenalLevel: number; giroLevel: number; lavagemLevel: number; luxuryLevel: number; briberyLevel: number; };
type HeaderCustomization = { playerNameFont: string; playerNameFontSize?: string; playerNameColor?: string; };
type BarracoPosition = { x: number; y: number; z: number; };
type MapPosition = { tileX: number; tileY: number; worldX?: number; worldY?: number; };
type ActiveOperation = { id: string; operationId: string; businessId: number; businessName: string; startedAt: string; endsAt: string; grossAmount: number; feePercentage: number; feeAmount: number; netAmount: number; status: 'processing' | 'completed'; };
type DailyOperation = { businessId: number; date: string; amount: number; };
type LaundryProgress = { activeOperations: ActiveOperation[]; dailyOperations: DailyOperation[]; };
type PunishmentsState = {
  active: { type: 'fiscal' | 'arsenal' | 'militia' | 'blitz' | 'threat'; expiresAt: string; }[];
  delacao: { active: boolean; expiresAt: string | null; } | null;
  inventoryBlocked: boolean; dirtyMoneyBlocked: boolean; cleanMoneyBlocked: boolean;
  levelProgressionBlocked: boolean; inventoryBonusReductionPercent: number;
  pvpProtectionUntil: string | null; delacaoRewardPending: boolean;
  delacaoRewardUnlockAt: string | null; pendingSkillBoost: number; lastVehicleLost?: boolean;
};
type PurchasedAccessory = { accessoryId: string; skillType: string; purchasedAt: string; };
type Accessories = { vehicles?: Record<string, string[]>; weapons?: Record<string, string[]>; };
type AttackNotification = { id: string; type: string; attackerId?: string; attackerName?: string; targetId?: string; targetName?: string; success: boolean; loot: number; createdAt: string; read: boolean; };
type AttackHistoryItem = { id: string; attackerId: string; attackerName: string; targetId: string; targetName: string; success: boolean; loot: number; createdAt: string; };

export type PlayerState = {
  _id?: string; googleId?: string; email?: string; name?: string; avatar?: string;
  niveis: Niveis; balances: Balances; inventory: Inventory; pageLevels: PageLevels;
  skills: Skills; power: number; hierarchyBadge: string; barracoPosition: BarracoPosition;
  mapPosition?: MapPosition; laundryProgress: LaundryProgress; punishments: PunishmentsState;
  skillBoostMultiplier: number; headerCustomization?: HeaderCustomization;
  ownedVehicles?: string[]; purchasedAccessories?: PurchasedAccessory[]; accessories?: Accessories;
  notifications?: AttackNotification[]; attackHistory?: AttackHistoryItem[];
  vip?: boolean; factionId?: string | null; lastSkillTrainAt?: number; lastAttackAt?: number;
  lastPassiveIncomeAt?: number; lastSpinAt?: number; version: number;
};

// ==================== INTERFACE DA STORE ====================
interface PlayerStore {
  player: PlayerState;
  isLoaded: boolean;
  isSyncing: boolean;
  syncError: string | null;
  isPolling: boolean;
  localVersion: number;
  lastSyncAt: number;

  loadPlayer: () => void;
  setPlayer: (incoming: Partial<PlayerState>) => void;
  hydratePlayerFromServer: (playerData: Partial<PlayerState>) => void;
  applyPlayerUpdate: (updater: (current: PlayerState) => PlayerState) => void;
  scheduleSync: () => void;
  syncPlayerToBackend: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  pollPlayerFromBackend: () => Promise<void>;
  clearPlayer: () => void;

  // Saldos
  addDirtyMoney: (amount: number) => void;
  removeDirtyMoney: (value: number) => void;
  removeDirtyMoneyPercent: (percent: number) => void;
  addCleanMoney: (amount: number) => void;
  removeCleanMoney: (amount: number) => void;
  addCorre: (amount: number) => void;
  removeCorre: (amount: number) => void;

  // Inventário
  removeInventoryItem: (itemId: string) => void;
  addGift: (gift: any) => void;
  addReward: (reward: any) => void;

  // Níveis e skills
  setNiveis: (incoming: Partial<Niveis>) => void;
  setPageLevel: (page: string, level: number) => void;
  setSkills: (incoming: Partial<Skills>) => void;
  addSkillPercent: (skill: keyof Skills, percent: number) => void;
  setPower: (value: number) => void;
  setHierarchyBadge: (badge: string) => void;

  // Lavagem
  startLaundryOperation: (operation: Omit<ActiveOperation, 'status' | 'id'>) => Promise<boolean>;
  completeLaundryOperation: (operationId: string) => Promise<boolean>;
  clearFinishedLaundryOperations: () => void;
  canOperateLaundryToday: (businessId: number) => Promise<boolean>;

  // Posições
  setBarracoPosition: (position: Partial<BarracoPosition>) => void;
  setHeaderCustomization: (customization: Partial<HeaderCustomization>) => void;

  // Veículos e acessórios
  addOwnedVehicle: (vehicleId: string) => void;
  removeOwnedVehicle: (vehicleId: string) => void;
  setCleanMoney: (amount: number) => void;
  addSkillBonus: (skillType: string, percent: number) => void;
  purchaseAccessory: (accessoryId: string, skillType: string) => void;
  getAccessoryBonusPercent: () => number;
  addAccessory: (type: 'vehicles' | 'weapons', itemId: string, accessoryName: string) => void;

  // Notificações e histórico
  setNotifications: (notifications: AttackNotification[]) => void;
  addNotification: (notification: AttackNotification) => void;
  markNotificationAsRead: (notificationId: string) => void;
  setAttackHistory: (history: AttackHistoryItem[]) => void;
  addAttackHistoryItem: (item: AttackHistoryItem) => void;
  applyRemoteAttackResult: (payload: { dirtyMoneyDelta: number; notification?: AttackNotification; historyItem?: AttackHistoryItem; pvpProtectionUntil?: string | null; }) => void;
}

// ==================== ESTADO INICIAL ====================
const initialPlayer: PlayerState = {
  _id: '', googleId: '', email: '', name: '', avatar: '',
  niveis: { playerLevel:1, barracoLevel:1, hierarchyLevel:1, arsenalLevel:1, giroLevel:1, lavagemLevel:1, luxuryLevel:1, briberyLevel:1 },
  balances: { dirtyMoney:1000, cleanMoney:0, corre:1000 },
  inventory: { items:[], gifts:[], rewards:[] },
  pageLevels: { barraco:1, giro:1, lavagem:1, luxury:1, arsenal:1, bribery:1, hierarchy:1, home:1, game:1 },
  skills: { attack:0, defense:0, intelligence:0, agility:0, respect:0, vigor:0 },
  power:0, hierarchyBadge:'Antena', barracoPosition:{ x:0,y:0,z:0 },
  mapPosition:{ tileX:40, tileY:20, worldX:40, worldY:20 },
  laundryProgress:{ activeOperations:[], dailyOperations:[] },
  punishments:{ active:[], delacao:{ active:false, expiresAt:null }, inventoryBlocked:false, dirtyMoneyBlocked:false, cleanMoneyBlocked:false, levelProgressionBlocked:false, inventoryBonusReductionPercent:0, pvpProtectionUntil:null, delacaoRewardPending:false, delacaoRewardUnlockAt:null, pendingSkillBoost:0 },
  skillBoostMultiplier:1.0, ownedVehicles:[], purchasedAccessories:[], accessories:{}, notifications:[], attackHistory:[],
  vip:false, factionId:null, lastSkillTrainAt:0, lastAttackAt:0, lastPassiveIncomeAt:Date.now(), lastSpinAt:0,
  version: 0,
};
function mergePlayer(incoming?: Partial<PlayerState> | null): PlayerState {
  return {
    ...initialPlayer,
    ...(incoming || {}),
    niveis: { ...initialPlayer.niveis, ...(incoming?.niveis || {}) },
    balances: { ...initialPlayer.balances, ...(incoming?.balances || {}) },
    inventory: { ...initialPlayer.inventory, items: incoming?.inventory?.items || [], gifts: incoming?.inventory?.gifts || [], rewards: incoming?.inventory?.rewards || [] },
    pageLevels: { ...initialPlayer.pageLevels, ...(incoming?.pageLevels || {}) },
    skills: { ...initialPlayer.skills, ...(incoming?.skills || {}) },
    barracoPosition: { ...initialPlayer.barracoPosition, ...(incoming?.barracoPosition || {}) },
    mapPosition: { ...initialPlayer.mapPosition, ...(incoming?.mapPosition || {}) },
    headerCustomization: { playerNameFont: 'oswald', playerNameFontSize: '1.875rem', playerNameColor: '#1a1205', ...(incoming?.headerCustomization || {}) },
    laundryProgress: { activeOperations: incoming?.laundryProgress?.activeOperations || [], dailyOperations: incoming?.laundryProgress?.dailyOperations || [] },
    punishments: { ...initialPlayer.punishments, ...(incoming?.punishments || {}) },
    ownedVehicles: incoming?.ownedVehicles || [],
    purchasedAccessories: incoming?.purchasedAccessories || [],
    accessories: incoming?.accessories || {},
    notifications: incoming?.notifications || [],
    attackHistory: incoming?.attackHistory || [],
    version: incoming?.version ?? 0,
  };
}

// ==================== STORE ====================
export const usePlayerStore = create<PlayerStore>((set, get) => ({
  player: initialPlayer,
  isLoaded: false,
  isSyncing: false,
  syncError: null,
  isPolling: false,
  localVersion: 0,
  lastSyncAt: 0,

  loadPlayer: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        set({ player: initialPlayer, isLoaded: true, lastSyncAt: Date.now() });
        return;
      }
      const parsed = JSON.parse(stored);
      const merged = clearExpiredPunishments(mergePlayer(parsed));
      set({ player: merged, isLoaded: true, lastSyncAt: Date.now() });
    } catch (error) {
      console.error('Erro loadPlayer:', error);
      set({ player: initialPlayer, isLoaded: true, syncError: 'Erro ao carregar dados' });
    }
  },

  setPlayer: (incoming) => {
    const current = get().player;
    const newVersion = current.version + 1;
    const merged = mergePlayer({ ...current, ...incoming, version: newVersion });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    set({ player: merged, localVersion: newVersion, lastSyncAt: Date.now(), syncError: null });
    get().scheduleSync();
  },

  hydratePlayerFromServer: (playerData) => {
    const serverVersion = playerData.version || 0;
    const localVersion = get().player.version;
    if (serverVersion <= localVersion) return;
    const merged = mergePlayer(playerData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    set({ player: merged, localVersion: serverVersion, lastSyncAt: Date.now(), syncError: null });
  },

  applyPlayerUpdate: (updater) => {
    const current = get().player;
    const updated = updater(current);
    const newVersion = current.version + 1;
    const merged = mergePlayer({ ...updated, version: newVersion });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    set({ player: merged, localVersion: newVersion, lastSyncAt: Date.now() });
    get().scheduleSync();
  },

  scheduleSync: () => {
    if (get().isSyncing) return;
    setTimeout(() => { get().syncPlayerToBackend(); }, 500);
  },

  syncPlayerToBackend: async () => {
    if (get().isSyncing) return;
    set({ isSyncing: true, syncError: null });
    try {
      const player = get().player;
      const response = await syncPlayerUpdate(player);
      const serverPlayer = response.player;
      const serverVersion = serverPlayer.version || 0;
      if (serverVersion > get().player.version) {
        const merged = mergePlayer(serverPlayer);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        set({ player: merged, localVersion: serverVersion, isSyncing: false, lastSyncAt: Date.now() });
      } else {
        set({ isSyncing: false, lastSyncAt: Date.now() });
      }
    } catch (error) {
      console.error('Erro sync:', error);
      set({ isSyncing: false, syncError: error instanceof Error ? error.message : 'Erro ao sincronizar' });
    }
  },

  startPolling: () => {
    if (pollingInterval) clearInterval(pollingInterval);
    set({ isPolling: true });
    get().pollPlayerFromBackend();
    pollingInterval = setInterval(() => { get().pollPlayerFromBackend(); }, POLLING_INTERVAL);
  },

  stopPolling: () => {
    if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }
    set({ isPolling: false });
  },

  pollPlayerFromBackend: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) { get().stopPolling(); return; }
    if (get().isSyncing) return;
    const now = Date.now();
    if (now - get().lastSyncAt < 2000) return;
    try {
      const serverPlayer = await fetchCurrentPlayer();
      if (!serverPlayer) return;
      const serverVersion = serverPlayer.version || 0;
      if (serverVersion > get().player.version) {
        const merged = mergePlayer(serverPlayer);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        set({ player: merged, localVersion: serverVersion, lastSyncAt: Date.now() });
      } else {
        set({ lastSyncAt: Date.now() });
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  },

  clearPlayer: () => {
    localStorage.removeItem(STORAGE_KEY);
    if (pollingInterval) clearInterval(pollingInterval);
    set({ player: initialPlayer, isLoaded: true, isSyncing: false, syncError: null, isPolling: false, localVersion: 0, lastSyncAt: 0 });
  },
// ========== SALDOS ==========
  addDirtyMoney: (amount) => {
    get().applyPlayerUpdate((p) => ({
      ...p,
      balances: { ...p.balances, dirtyMoney: p.balances.dirtyMoney + amount }
    }));
  },
  removeDirtyMoney: (value) => {
    get().applyPlayerUpdate((p) => ({
      ...p,
      balances: { ...p.balances, dirtyMoney: Math.max(0, p.balances.dirtyMoney - value) }
    }));
  },
  removeDirtyMoneyPercent: (percent) => {
    const current = get().player;
    if (isDirtyMoneyBlocked(current)) return;
    get().applyPlayerUpdate((player) => {
      const loss = player.balances.dirtyMoney * (percent / 100);
      return {
        ...player,
        balances: { ...player.balances, dirtyMoney: Math.max(0, player.balances.dirtyMoney - loss) }
      };
    });
  },
  addCleanMoney: (amount) => {
    const current = get().player;
    if (isCleanMoneyBlocked(current)) return;
    get().applyPlayerUpdate((player) => ({
      ...player,
      balances: { ...player.balances, cleanMoney: player.balances.cleanMoney + amount }
    }));
  },
  removeCleanMoney: (amount) => {
    const current = get().player;
    if (isCleanMoneyBlocked(current)) return;
    get().applyPlayerUpdate((player) => ({
      ...player,
      balances: { ...player.balances, cleanMoney: Math.max(0, player.balances.cleanMoney - amount) }
    }));
  },
  addCorre: (amount) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      balances: { ...player.balances, corre: player.balances.corre + amount }
    }));
  },
  removeCorre: (amount) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      balances: { ...player.balances, corre: Math.max(0, player.balances.corre - amount) }
    }));
  },

  // ========== INVENTÁRIO ==========
  removeInventoryItem: (itemId) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      inventory: { ...player.inventory, items: player.inventory.items.filter((item: any) => item?.id !== itemId && item?._id !== itemId) }
    }));
  },
  addGift: (gift) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      inventory: { ...player.inventory, gifts: [...player.inventory.gifts, gift] }
    }));
  },
  addReward: (reward) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      inventory: { ...player.inventory, rewards: [...player.inventory.rewards, reward] }
    }));
  },

  // ========== NÍVEIS E SKILLS ==========
  setNiveis: (incoming) => {
    get().applyPlayerUpdate((player) => ({ ...player, niveis: { ...player.niveis, ...incoming } }));
  },
  setPageLevel: (page, level) => {
    get().applyPlayerUpdate((player) => ({ ...player, pageLevels: { ...player.pageLevels, [page]: level } }));
  },
  setSkills: (incoming) => {
    get().applyPlayerUpdate((player) => ({ ...player, skills: { ...player.skills, ...incoming } }));
  },
  addSkillPercent: (skill, percent) => {
    get().applyPlayerUpdate((player) => {
      const currentValue = player.skills[skill] || 0;
      const increase = currentValue * (percent / 100);
      return { ...player, skills: { ...player.skills, [skill]: currentValue + increase } };
    });
  },
  setPower: (value) => {
    get().applyPlayerUpdate((player) => ({ ...player, power: value }));
  },
  setHierarchyBadge: (badge) => {
    get().applyPlayerUpdate((player) => ({ ...player, hierarchyBadge: badge }));
  },

  // ========== LAVAGEM ==========
  startLaundryOperation: async (operation) => {
    const current = get().player;
    if (isMoneyLaunderingBlocked(current)) return false;
    if (current.balances.dirtyMoney < operation.grossAmount) return false;
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
          activeOperations: [...response.player.laundryProgress.activeOperations, newOperation],
        },
      });
      get().hydratePlayerFromServer(updated);
      return true;
    } catch (error) {
      console.error('Erro ao iniciar lavagem:', error);
      return false;
    }
  },
  completeLaundryOperation: async (operationId) => {
    try {
      const response = await laundryComplete(operationId);
      const updated = mergePlayer(response.player);
      get().hydratePlayerFromServer(updated);
      get().clearFinishedLaundryOperations();
      return true;
    } catch (error) {
      console.error('Erro ao completar lavagem:', error);
      return false;
    }
  },
  clearFinishedLaundryOperations: () => {
    get().applyPlayerUpdate((player) => {
      const today = new Date().toISOString().split('T')[0];
      const recentDailyOps = player.laundryProgress.dailyOperations.filter((op) => op.date === today);
      return { ...player, laundryProgress: { ...player.laundryProgress, dailyOperations: recentDailyOps } };
    });
  },
  canOperateLaundryToday: async (businessId) => {
    try {
      const result = await canOperateLaundry(businessId);
      return result.allowed;
    } catch (error) {
      return true;
    }
  },

  // ========== POSIÇÕES E CUSTOMIZAÇÃO ==========
  setBarracoPosition: (position) => {
    get().applyPlayerUpdate((player) => ({ ...player, barracoPosition: { ...player.barracoPosition, ...position } }));
  },
  setHeaderCustomization: (customization) => {
    get().applyPlayerUpdate((player) => ({ ...player, headerCustomization: { ...player.headerCustomization, ...customization } }));
  },

  // ========== VEÍCULOS E ACESSÓRIOS ==========
  addOwnedVehicle: (vehicleId) => {
    get().applyPlayerUpdate((player) => {
      const owned = player.ownedVehicles || [];
      return owned.includes(vehicleId) ? player : { ...player, ownedVehicles: [...owned, vehicleId] };
    });
  },
  removeOwnedVehicle: (vehicleId) => {
    get().applyPlayerUpdate((player) => ({ ...player, ownedVehicles: (player.ownedVehicles || []).filter(id => id !== vehicleId) }));
  },
  setCleanMoney: (amount) => {
    get().applyPlayerUpdate((player) => ({ ...player, balances: { ...player.balances, cleanMoney: amount } }));
  },
  addSkillBonus: (skillType, percent) => {
    get().applyPlayerUpdate((player) => {
      const currentValue = player.skills[skillType] || 0;
      return { ...player, skills: { ...player.skills, [skillType]: currentValue + percent } };
    });
  },
  purchaseAccessory: (accessoryId, skillType) => {
    get().applyPlayerUpdate((player) => {
      const purchased = player.purchasedAccessories || [];
      if (purchased.some(acc => acc.accessoryId === accessoryId)) return player;
      const newAccessory: PurchasedAccessory = { accessoryId, skillType, purchasedAt: new Date().toISOString() };
      return { ...player, purchasedAccessories: [...purchased, newAccessory] };
    });
  },
  getAccessoryBonusPercent: () => {
    const level = get().player.niveis.playerLevel || 1;
    return level <= 50 ? 1 : 2;
  },
  addAccessory: (type, itemId, accessoryName) => {
    get().applyPlayerUpdate((player) => {
      const existing = player.accessories?.[type]?.[itemId] || [];
      if (existing.includes(accessoryName)) return player;
      return {
        ...player,
        accessories: {
          ...player.accessories,
          [type]: { ...player.accessories?.[type], [itemId]: [...existing, accessoryName] }
        }
      };
    });
  },

  // ========== NOTIFICAÇÕES E HISTÓRICO ==========
  setNotifications: (notifications) => {
    get().applyPlayerUpdate((player) => ({ ...player, notifications }));
  },
  addNotification: (notification) => {
    get().applyPlayerUpdate((player) => ({ ...player, notifications: [...(player.notifications || []), notification] }));
  },
  markNotificationAsRead: (notificationId) => {
    get().applyPlayerUpdate((player) => ({
      ...player,
      notifications: (player.notifications || []).map(notif => notif.id === notificationId ? { ...notif, read: true } : notif)
    }));
  },
  setAttackHistory: (history) => {
    get().applyPlayerUpdate((player) => ({ ...player, attackHistory: history }));
  },
  addAttackHistoryItem: (item) => {
    get().applyPlayerUpdate((player) => ({ ...player, attackHistory: [...(player.attackHistory || []), item] }));
  },
  applyRemoteAttackResult: (payload) => {
    get().applyPlayerUpdate((player) => {
      const updated = { ...player, balances: { ...player.balances, dirtyMoney: player.balances.dirtyMoney + payload.dirtyMoneyDelta } };
      if (payload.notification) updated.notifications = [...(updated.notifications || []), payload.notification];
      if (payload.historyItem) updated.attackHistory = [...(updated.attackHistory || []), payload.historyItem];
      if (payload.pvpProtectionUntil !== undefined) updated.punishments = { ...updated.punishments, pvpProtectionUntil: payload.pvpProtectionUntil };
      return updated;
    });
  },
}));