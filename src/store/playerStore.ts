/**
 * playerStore.ts — Estado do jogador em runtime
 *
 * ARQUITETURA NOVA vs. anterior:
 *
 * REMOVIDO:
 *   - localStorage para playerData (escreve e lê) — hidratação vem do socket
 *   - startPolling / stopPolling / pollPlayerFromBackend — polling eliminado
 *   - buildInitialState que lia playerData do localStorage
 *
 * MANTIDO (compatibilidade com 14+ páginas existentes):
 *   - loadPlayer()          → no-op. Socket envia 'playerInit' → hydratePlayerFromServer
 *   - startPolling()        → no-op. Socket substitui polling
 *   - stopPolling()         → no-op
 *   - scheduleSync()        → debounce 500ms → syncPlayerToBackend (mantido)
 *   - syncPlayerToBackend() → chama PATCH /player/update; resultado vem pelo socket
 *   - hydratePlayerFromServer() → chamado por: useGameSocket, GiroPage, factionStore, gangStore
 *   - applyPlayerUpdate()   → atualização otimista + scheduleSync
 *   - Todos os setters      → inalterados
 *
 * FLUXO PRINCIPAL:
 *   Google Login
 *     → JWT em localStorage.authToken
 *     → reconnectSocket() [useGoogleAuth]
 *     → socket connect → backend envia 'playerInit'
 *     → useGameSocket ouve 'playerInit' → hydratePlayerFromServer(player)
 *     → isLoaded = true → todas as 14 páginas renderizam
 *
 *   Qualquer mutação (laundry, arsenal, etc.)
 *     → HTTP POST → backend salva → emitToPlayer('playerUpdate', player)
 *     → useGameSocket ouve 'playerUpdate' → hydratePlayerFromServer(player)
 */

import {
  canOperateLaundry,
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

const GRID_WIDTH  = 120;
const GRID_HEIGHT = 120;

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem('authToken') ?? null; } catch { return null; }
}

function stripGangState<T extends Partial<PlayerState>>(playerData: T): T {
  const clone = { ...(playerData as any) };
  delete clone.gangMembers;
  delete clone.gangStats;
  return clone as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────
// Identical to previous version — all components depend on these

type Balances          = { dirtyMoney: number; cleanMoney: number; corre: number };
type Inventory         = { items: any[]; gifts: any[]; rewards: any[] };
type PageLevels        = { barraco: number; giro: number; lavagem: number; luxury: number; arsenal: number; bribery: number; hierarchy: number; home: number; game: number; [key: string]: number };
type Skills            = { attack: number; defense: number; intelligence: number; agility: number; respect: number; vigor: number; [key: string]: number };
type Niveis            = { playerLevel: number; barracoLevel: number; hierarchyLevel: number; arsenalLevel: number; giroLevel: number; lavagemLevel: number; luxuryLevel: number; briberyLevel: number };
type HeaderCustomization = { playerNameFont: string; playerNameFontSize?: string; playerNameColor?: string; customName?: string; customAvatar?: string };
type BarracoPosition   = { x: number; y: number; z: number };
type MapPosition       = { tileX: number; tileY: number; worldX?: number; worldY?: number };
type ActiveOperation   = { id: string; operationId: string; businessId: number; businessName: string; startedAt: string; endsAt: string; grossAmount: number; feePercentage: number; feeAmount: number; netAmount: number; status: 'processing' | 'completed' };
type DailyOperation    = { businessId: number; date: string; amount: number };
type LaundryProgress   = { activeOperations: ActiveOperation[]; dailyOperations: DailyOperation[] };
type PunishmentsState  = { active: { type: 'fiscal' | 'arsenal' | 'militia' | 'blitz' | 'threat'; expiresAt: string }[]; delacao: { active: boolean; expiresAt: string | null } | null; inventoryBlocked: boolean; dirtyMoneyBlocked: boolean; cleanMoneyBlocked: boolean; levelProgressionBlocked: boolean; inventoryBonusReductionPercent: number; pvpProtectionUntil: string | null; delacaoRewardPending: boolean; delacaoRewardUnlockAt: string | null; pendingSkillBoost: number; lastVehicleLost?: boolean };
type PurchasedAccessory = { accessoryId: string; skillType: string; purchasedAt: string };
type Accessories       = { vehicles?: Record<string, string[]>; weapons?: Record<string, string[]> };
type GangMember        = { id: string; type: string; level: number; status: 'ativo' | 'ferido' | 'morto' | 'treinando' | 'marchando'; recruitedAt: string; trainingEndsAt?: string | null; injuryEndsAt?: string | null };
type GangStats         = { totalMembers: number; activeMembers: number; injuredMembers: number; deadMembers: number; trainingMembers: number; marchingMembers: number; totalPower: number; averageLevel: number };
type AttackNotification = { id: string; type: 'attack_received' | 'attack_success' | 'attack_failed' | 'revenge_available'; attackerId?: string; attackerName?: string; targetId?: string; targetName?: string; success: boolean; loot: number; createdAt: string; read: boolean };
type AttackHistoryItem  = { id: string; attackerId: string; attackerName: string; targetId: string; targetName: string; success: boolean; loot: number; createdAt: string; attackerGangLosses?: Record<string, number>; defenderGangLosses?: Record<string, number> };

export type PlayerState = {
  _id?: string; googleId?: string; email?: string; name?: string; avatar?: string;
  niveis: Niveis; balances: Balances; inventory: Inventory; pageLevels: PageLevels; skills: Skills;
  power: number; hierarchyBadge: string; currentRank?: string; unlockedRanks?: string[];
  barracoPosition: BarracoPosition; mapPosition?: MapPosition;
  laundryProgress: LaundryProgress; punishments: PunishmentsState;
  skillBoostMultiplier: number; headerCustomization?: HeaderCustomization;
  ownedVehicles?: string[]; purchasedAccessories?: PurchasedAccessory[];
  accessories?: Accessories; notifications?: AttackNotification[];
  attackHistory?: AttackHistoryItem[]; factionId?: string | null; gangId?: string | null;
  gangMembers?: GangMember[]; gangStats?: GangStats;
  gang?: {
    members?: GangMember[];
    trainingSlots?: any[];
    stats?: GangStats;
    updatedAtIso?: string | null;
  };
  lastAttackAt?: string | null; pvpProtectionUntil?: string | null;
};

type PlayerStore = {
  player:                PlayerState;
  isLoaded:              boolean;
  isSyncing:             boolean;
  syncError:             string | null;
  isPolling:             boolean;   // mantido por compatibilidade (sempre false)
  pollingAttempts:       number;
  maxPollingAttempts:    number;
  localVersion:          number;
  lastSyncAt:            number;
  pendingLocalChanges:   boolean;
  lastLocalMutationAt:   number;
  lastServerHydrationAt: number;

  // ── Hidratação / Estado ─────────────────────────────────────────────────
  loadPlayer:               () => Promise<void>;   // no-op (socket envia playerInit)
  setPlayer:                (incoming: Partial<PlayerState>) => void;
  hydratePlayerFromServer:  (playerData: Partial<PlayerState>) => void;
  clearPlayer:              () => void;
  applyPlayerUpdate:        (updater: (current: PlayerState) => PlayerState) => void;

  // ── Sync ────────────────────────────────────────────────────────────────
  saveLocal:                () => void;            // no-op
  scheduleSync:             () => void;
  syncPlayerToBackend:      () => Promise<void>;

  // ── Polling (mantido por compatibilidade, sem efeito) ───────────────────
  startPolling:             () => void;            // no-op
  stopPolling:              () => void;            // no-op
  pollPlayerFromBackend:    () => Promise<void>;   // no-op

  // ── Upgrades locais ─────────────────────────────────────────────────────
  upgradeBarracoLocal:      () => { ok: boolean; reason?: string; cost?: number };
  purchaseLuxuryItemLocal:  (payload: { itemId: number; name: string; price: number; skillType: string; skillBonusPercent: number; insurance: boolean }) => { ok: boolean; reason?: string };

  // ── Balances ────────────────────────────────────────────────────────────
  setBalances:              (balances: Partial<Balances>) => void;
  addDirtyMoney:            (amount: number) => void;
  removeDirtyMoney:         (value: number) => void;
  removeDirtyMoneyPercent:  (percent: number) => void;
  addCleanMoney:            (amount: number) => void;
  removeCleanMoney:         (amount: number) => void;
  addCorre:                 (amount: number) => void;
  removeCorre:              (amount: number) => void;

  // ── Inventory ───────────────────────────────────────────────────────────
  removeInventoryItem:      (itemId: string) => void;
  addGift:                  (gift: any) => void;
  addReward:                (reward: any) => void;

  // ── Progressão ──────────────────────────────────────────────────────────
  setNiveis:                (incoming: Partial<Niveis>) => void;
  setPageLevel:             (page: string, level: number) => void;
  setSkills:                (incoming: Partial<Skills>) => void;
  addSkillPercent:          (skill: keyof Skills, percent: number) => void;
  setPower:                 (value: number) => void;
  setHierarchyBadge:        (badge: string) => void;
  setCurrentRank:           (rank: string) => void;
  addUnlockedRank:          (rank: string) => void;
  setBarracoPosition:       (position: Partial<BarracoPosition>) => void;
  setHeaderCustomization:   (customization: Partial<HeaderCustomization>) => void;

  // ── Laundry ─────────────────────────────────────────────────────────────
  startLaundryOperation:    (operation: Omit<ActiveOperation, 'status' | 'id'>) => Promise<boolean>;
  completeLaundryOperation: (operationId: string) => Promise<boolean>;
  clearFinishedLaundryOperations: () => void;
  canOperateLaundryToday:   (businessId: number) => Promise<boolean>;

  // ── Vehicles / Accessories ───────────────────────────────────────────────
  addOwnedVehicle:          (vehicleId: string) => void;
  removeOwnedVehicle:       (vehicleId: string) => void;
  setCleanMoney:            (amount: number) => void;
  addSkillBonus:            (skillType: string, percent: number) => void;
  purchaseAccessory:        (accessoryId: string, skillType: string) => void;
  getAccessoryBonusPercent: () => number;
  addAccessory:             (type: 'vehicles' | 'weapons', itemId: string, accessoryName: string) => void;

  // ── Notifications ────────────────────────────────────────────────────────
  setNotifications:         (notifications: AttackNotification[]) => void;
  addNotification:          (notification: AttackNotification) => void;
  markNotificationAsRead:   (notificationId: string) => void;
  setAttackHistory:         (history: AttackHistoryItem[]) => void;
  addAttackHistoryItem:     (item: AttackHistoryItem) => void;
  applyRemoteAttackResult:  (payload: { dirtyMoneyDelta: number; notification?: AttackNotification; historyItem?: AttackHistoryItem; pvpProtectionUntil?: string | null }) => void;

  // ── Faction ──────────────────────────────────────────────────────────────
  setFactionId:             (factionId: string | null) => void;

  // ── Gang ─────────────────────────────────────────────────────────────────
  setGangMembers:           (members: GangMember[]) => void;
  addGangMember:            (member: GangMember) => void;
  updateGangMember:         (memberId: string, updates: Partial<GangMember>) => void;
  removeGangMember:         (memberId: string) => void;
  setGangStats:             (stats: GangStats) => void;
  updateGangStats:          (updates: Partial<GangStats>) => void;
  setLastAttackAt:          (timestamp: string | null) => void;
  setPvpProtectionUntil:    (timestamp: string | null) => void;
  getGangMemberById:        (memberId: string) => GangMember | undefined;
  getActiveGangMembers:     () => GangMember[];
  getInjuredGangMembers:    () => GangMember[];
  getTrainingGangMembers:   () => GangMember[];
  getDeadGangMembers:       () => GangMember[];
};

// ─── Estado inicial ───────────────────────────────────────────────────────────

const initialPlayer: PlayerState = {
  _id: '', googleId: '', email: '', name: '', avatar: '',
  niveis:    { playerLevel: 1, barracoLevel: 1, hierarchyLevel: 1, arsenalLevel: 1, giroLevel: 1, lavagemLevel: 1, luxuryLevel: 1, briberyLevel: 1 },
  balances:  { dirtyMoney: GAME_MODE.debugEconomy ? GAME_MODE.debugDirtyMoney : 1000, cleanMoney: GAME_MODE.debugEconomy ? GAME_MODE.debugCleanMoney : 0, corre: 1000 },
  inventory: { items: [], gifts: [], rewards: [] },
  pageLevels: { barraco: 1, giro: 1, lavagem: 1, luxury: 1, arsenal: 1, bribery: 1, hierarchy: 1, home: 1, game: 1 },
  skills:    { attack: 0, defense: 0, intelligence: 0, agility: 0, respect: 0, vigor: 0 },
  power:     0,
  hierarchyBadge: 'Antena',
  currentRank:    'Atividade',
  unlockedRanks:  ['Atividade'],
  barracoPosition: { x: 0, y: 0, z: 0 },
  mapPosition:     { tileX: GRID_WIDTH / 2, tileY: GRID_HEIGHT / 2, worldX: 0, worldY: 0 },
  laundryProgress: { activeOperations: [], dailyOperations: [] },
  punishments: {
    active: [], delacao: { active: false, expiresAt: null },
    inventoryBlocked: false, dirtyMoneyBlocked: false, cleanMoneyBlocked: false,
    levelProgressionBlocked: false, inventoryBonusReductionPercent: 0,
    pvpProtectionUntil: null, delacaoRewardPending: false, delacaoRewardUnlockAt: null,
    pendingSkillBoost: 0, lastVehicleLost: false,
  },
  skillBoostMultiplier: 1.0,
  notifications: [], attackHistory: [],
  factionId: null, gangId: null,
  gangMembers: [],
  gangStats: {
    totalMembers: 0,
    activeMembers: 0,
    injuredMembers: 0,
    deadMembers: 0,
    trainingMembers: 0,
    marchingMembers: 0,
    totalPower: 0,
    averageLevel: 0,
  },
  lastAttackAt: null, pvpProtectionUntil: null,
};

// ─── mergePlayer (sem writes de localStorage) ─────────────────────────────────

function mergePlayer(incoming?: Partial<PlayerState> | null): PlayerState {
  const inc = incoming || {};
  const niveis       = (inc.niveis              && typeof inc.niveis              === 'object') ? inc.niveis              : {};
  const balances     = (inc.balances            && typeof inc.balances            === 'object') ? inc.balances            : {};
  const inventory    = (inc.inventory           && typeof inc.inventory           === 'object') ? inc.inventory           : {};
  const pageLevels   = (inc.pageLevels          && typeof inc.pageLevels          === 'object') ? inc.pageLevels          : {};
  const skills       = (inc.skills              && typeof inc.skills              === 'object') ? inc.skills              : {};
  const barracoPos   = (inc.barracoPosition     && typeof inc.barracoPosition     === 'object') ? inc.barracoPosition     : {};
  const mapPos       = (inc.mapPosition         && typeof inc.mapPosition         === 'object') ? inc.mapPosition         : {};
  const headerCust   = (inc.headerCustomization && typeof inc.headerCustomization === 'object') ? inc.headerCustomization : {};
  const laundryProg  = (inc.laundryProgress     && typeof inc.laundryProgress     === 'object') ? inc.laundryProgress     : {};
  const punishments  = (inc.punishments         && typeof inc.punishments         === 'object') ? inc.punishments         : {};
  const incomingGang = inc.gang && typeof inc.gang === 'object' ? inc.gang : null;

  return {
    ...initialPlayer,
    ...inc,
    _id: (inc as any)?._id || (inc as any)?.id || (inc as any)?.googleId || initialPlayer._id,
    niveis:       { ...initialPlayer.niveis,    ...niveis },
    balances:     { ...initialPlayer.balances,  ...balances },
    inventory:    { ...initialPlayer.inventory, ...inventory, items: (inventory as any)?.items ?? initialPlayer.inventory.items, gifts: (inventory as any)?.gifts ?? initialPlayer.inventory.gifts, rewards: (inventory as any)?.rewards ?? initialPlayer.inventory.rewards },
    pageLevels:   { ...initialPlayer.pageLevels, ...pageLevels },
    skills:       { ...initialPlayer.skills,    ...skills },
    barracoPosition: { ...initialPlayer.barracoPosition, ...barracoPos },
    mapPosition:  { tileX: (mapPos as any)?.tileX ?? GRID_WIDTH / 2, tileY: (mapPos as any)?.tileY ?? GRID_HEIGHT / 2, worldX: (mapPos as any)?.worldX ?? 0, worldY: (mapPos as any)?.worldY ?? 0 },
    headerCustomization: { playerNameFont: (headerCust as any)?.playerNameFont || 'oswald', playerNameFontSize: (headerCust as any)?.playerNameFontSize || '1.875rem', playerNameColor: (headerCust as any)?.playerNameColor || '#1a1205', customName: (headerCust as any)?.customName || '', customAvatar: (headerCust as any)?.customAvatar || '' },
    laundryProgress: { activeOperations: (laundryProg as any)?.activeOperations ?? initialPlayer.laundryProgress.activeOperations, dailyOperations: (laundryProg as any)?.dailyOperations ?? initialPlayer.laundryProgress.dailyOperations },
    punishments: { active: (punishments as any)?.active ?? initialPlayer.punishments.active, delacao: (punishments as any)?.delacao ?? initialPlayer.punishments.delacao, inventoryBlocked: (punishments as any)?.inventoryBlocked ?? false, dirtyMoneyBlocked: (punishments as any)?.dirtyMoneyBlocked ?? false, cleanMoneyBlocked: (punishments as any)?.cleanMoneyBlocked ?? false, levelProgressionBlocked: (punishments as any)?.levelProgressionBlocked ?? false, inventoryBonusReductionPercent: (punishments as any)?.inventoryBonusReductionPercent ?? 0, pvpProtectionUntil: (punishments as any)?.pvpProtectionUntil ?? null, delacaoRewardPending: (punishments as any)?.delacaoRewardPending ?? false, delacaoRewardUnlockAt: (punishments as any)?.delacaoRewardUnlockAt ?? null, pendingSkillBoost: (punishments as any)?.pendingSkillBoost ?? 0, lastVehicleLost: (punishments as any)?.lastVehicleLost ?? false },
    skillBoostMultiplier: inc?.skillBoostMultiplier ?? 1.0,
    ownedVehicles: inc?.ownedVehicles || [],
    accessories:   inc?.accessories   || {},
    purchasedAccessories: inc?.purchasedAccessories || [],
    notifications: inc?.notifications || [],
    attackHistory: inc?.attackHistory || [],
    factionId:     inc?.factionId ?? null,
    gangId:        inc?.gangId    ?? null,
    gang:          incomingGang ?? inc.gang ?? initialPlayer.gang,
    gangMembers:   incomingGang?.members ?? inc.gangMembers ?? initialPlayer.gangMembers,
    gangStats:     incomingGang?.stats ?? inc.gangStats ?? initialPlayer.gangStats,
    lastAttackAt:  inc?.lastAttackAt  ?? null,
    pvpProtectionUntil: inc?.pvpProtectionUntil ?? (punishments as any)?.pvpProtectionUntil ?? null,
  };
}

async function syncFactionStoreFromEnvelope(faction: any, options?: { allowClear?: boolean }) {
  try {
    const { useFactionStore } = await import('@/store/factionStore');
    if (faction) { useFactionStore.getState().setFaction(faction); return; }
    if (options?.allowClear) { useFactionStore.getState().setFaction(null); }
  } catch (error) {
    console.warn('Não foi possível sincronizar factionStore:', error);
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // Inicia vazio — socket envia playerInit para hidratar
  player:                initialPlayer,
  isLoaded:              false,
  isSyncing:             false,
  syncError:             null,
  isPolling:             false,
  pollingAttempts:       0,
  maxPollingAttempts:    5,
  localVersion:          0,
  lastSyncAt:            0,
  pendingLocalChanges:   false,
  lastLocalMutationAt:   0,
  lastServerHydrationAt: 0,

  // ── no-op: socket envia 'playerInit' → hydratePlayerFromServer ─────────────
  // Mantido para compatibilidade com 14+ páginas que chamam loadPlayer()
  loadPlayer: async () => { /* no-op — socket handles hydration */ },

  // ── no-ops: polling eliminado ────────────────────────────────────────────
  // Mantido por compatibilidade com useGoogleAuth e outros hooks
  startPolling: () => { /* no-op */ },
  stopPolling:  () => { /* no-op */ },
  pollPlayerFromBackend: async () => { /* no-op */ },

  // ── no-op: não há mais localStorage para playerData ──────────────────────
  saveLocal: () => { /* no-op */ },

  // ── Hidratação do servidor ─────────────────────────────────────────────────
  // Chamado por: useGameSocket ('playerInit', 'playerUpdate'), GiroPage, factionStore, gangStore
  hydratePlayerFromServer: (playerData) => {
    try {
      if (!playerData || typeof playerData !== 'object') return;
      
      // Skip during SSR/build to prevent infinite loops
      if (typeof window === 'undefined') {
        console.log('⚠️ hydratePlayerFromServer skipped during SSR/build');
        return;
      }
      
      const merged = clearExpiredPunishments(mergePlayer(playerData));
      const normalized = {
        ...merged,
        _id: String((playerData as any)?._id || (playerData as any)?.id || (playerData as any)?.googleId || merged._id || ''),
      };
      set({
        player:                normalized,
        isLoaded:              true,
        syncError:             null,
        lastSyncAt:            Date.now(),
        lastServerHydrationAt: Date.now(),
        pendingLocalChanges:   false,
      });
      
      // Only sync faction store on client-side
      if (typeof window !== 'undefined') {
        syncFactionStoreFromEnvelope((playerData as any)?.faction ?? null, {
          allowClear: (playerData as any)?.factionId == null,
        }).catch(console.warn);
      }
    } catch (error) {
      console.error('Erro ao hidratar playerData:', error);
    }
  },

  setPlayer: (incoming) => {
    const merged = clearExpiredPunishments(mergePlayer({ ...get().player, ...incoming }));
    set({ player: merged, localVersion: get().localVersion + 1, lastLocalMutationAt: Date.now(), pendingLocalChanges: true });
    get().scheduleSync();
  },

  applyPlayerUpdate: (updater) => {
    const updated = clearExpiredPunishments(mergePlayer(updater(get().player)));
    set({ player: updated, localVersion: get().localVersion + 1, lastLocalMutationAt: Date.now(), pendingLocalChanges: true });
    get().scheduleSync();
  },

  clearPlayer: () => {
    if (syncTimeout) { clearTimeout(syncTimeout); syncTimeout = null; }
    set({ player: initialPlayer, isLoaded: false, isSyncing: false, syncError: null, isPolling: false, pollingAttempts: 0, localVersion: 0, lastSyncAt: 0, pendingLocalChanges: false, lastLocalMutationAt: 0, lastServerHydrationAt: 0 });
    syncFactionStoreFromEnvelope(null, { allowClear: true }).catch(() => {});
  },

  // ── scheduleSync: debounce 500ms → syncPlayerToBackend ────────────────────
  // Usado por applyPlayerUpdate (talents, customizações, arsenal, etc.)
  scheduleSync: () => {
    if (get().isSyncing) return;
    if (!getStoredAuthToken()) return;
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => { void get().syncPlayerToBackend(); }, 500);
  },

  // ── syncPlayerToBackend: PATCH /player/update ─────────────────────────────
  // Não atualiza o store com a resposta HTTP — socket traz 'playerUpdate'
  // Mantido pois: TalentsMenu, AvatarNameCustomizationModal, BarracoDetailPage o chamam
  syncPlayerToBackend: async () => {
    if (get().isSyncing) return;
    if (!getStoredAuthToken()) return;
    const player = stripGangState(get().player);
    try {
      set({ isSyncing: true, syncError: null });
      await syncPlayerUpdateWithFaction(player);
      // NÃO atualiza store aqui — socket emite 'playerUpdate' após o save
      set({ isSyncing: false, pendingLocalChanges: false, lastSyncAt: Date.now() });
    } catch (error) {
      set({ isSyncing: false, syncError: error instanceof Error ? error.message : 'Erro ao sincronizar' });
    }
  },

  // ── Laundry ───────────────────────────────────────────────────────────────
  startLaundryOperation: async (operation) => {
    const current = get().player;
    if (isMoneyLaunderingBlocked(current)) return false;
    if (current.balances.dirtyMoney < operation.grossAmount) return false;
    try {
      const response = await laundryStartWithFaction({ businessId: operation.businessId, businessName: operation.businessName, grossAmount: operation.grossAmount, feePercentage: operation.feePercentage, feeAmount: operation.feeAmount, netAmount: operation.netAmount });
      const merged = clearExpiredPunishments(mergePlayer(response.player));
      set({ player: merged, lastSyncAt: Date.now(), pendingLocalChanges: false, lastServerHydrationAt: Date.now() });
      await syncFactionStoreFromEnvelope(response.faction);
      return true;
    } catch (error: any) { throw error; }
  },

  completeLaundryOperation: async (operationId) => {
    if (get().player.laundryProgress.activeOperations.findIndex((op) => op.operationId === operationId && op.status === 'processing') === -1) return false;
    try {
      const response = await laundryCompleteWithFaction(operationId);
      const merged = clearExpiredPunishments(mergePlayer(response.player));
      set({ player: merged, lastSyncAt: Date.now(), pendingLocalChanges: false, lastServerHydrationAt: Date.now() });
      await syncFactionStoreFromEnvelope(response.faction);
      get().clearFinishedLaundryOperations();
      return true;
    } catch { return false; }
  },

  clearFinishedLaundryOperations: () => {
    const today = new Date().toISOString().split('T')[0];
    const c = get().player;
    set({ player: clearExpiredPunishments(mergePlayer({ ...c, laundryProgress: { ...c.laundryProgress, dailyOperations: c.laundryProgress.dailyOperations.filter((op) => op.date === today) } })) });
  },

  canOperateLaundryToday: async (businessId) => {
    try { const r = await canOperateLaundry(businessId); return r.allowed; } catch { return true; }
  },

  // ── Setters ───────────────────────────────────────────────────────────────
  setBalances: (b) => get().applyPlayerUpdate((p) => ({ ...p, balances: { ...p.balances, ...b } })),
  addDirtyMoney: (a) => { if (!isDirtyMoneyBlocked(get().player)) get().applyPlayerUpdate((p) => ({ ...p, balances: { ...p.balances, dirtyMoney: p.balances.dirtyMoney + a } })); },
  removeDirtyMoney: (v) => { if (!isDirtyMoneyBlocked(get().player)) get().applyPlayerUpdate((p) => ({ ...p, balances: { ...p.balances, dirtyMoney: Math.max(0, p.balances.dirtyMoney - v) } })); },
  removeDirtyMoneyPercent: (pct) => { if (!isDirtyMoneyBlocked(get().player)) get().applyPlayerUpdate((p) => ({ ...p, balances: { ...p.balances, dirtyMoney: Math.max(0, p.balances.dirtyMoney - p.balances.dirtyMoney * (pct / 100)) } })); },
  addCleanMoney: (a) => { if (!isCleanMoneyBlocked(get().player)) get().applyPlayerUpdate((p) => ({ ...p, balances: { ...p.balances, cleanMoney: p.balances.cleanMoney + a } })); },
  removeCleanMoney: (a) => { if (!isCleanMoneyBlocked(get().player)) get().applyPlayerUpdate((p) => ({ ...p, balances: { ...p.balances, cleanMoney: Math.max(0, p.balances.cleanMoney - a) } })); },
  addCorre: (a) => get().applyPlayerUpdate((p) => ({ ...p, balances: { ...p.balances, corre: p.balances.corre + a } })),
  removeCorre: (a) => get().applyPlayerUpdate((p) => ({ ...p, balances: { ...p.balances, corre: Math.max(0, p.balances.corre - a) } })),
  removeInventoryItem: (id) => get().applyPlayerUpdate((p) => ({ ...p, inventory: { ...p.inventory, items: p.inventory.items.filter((i: any) => i?.id !== id && i?._id !== id) } })),
  addGift: (g) => get().applyPlayerUpdate((p) => ({ ...p, inventory: { ...p.inventory, gifts: [...p.inventory.gifts, g] } })),
  addReward: (r) => get().applyPlayerUpdate((p) => ({ ...p, inventory: { ...p.inventory, rewards: [...p.inventory.rewards, r] } })),
  setNiveis: (n) => get().applyPlayerUpdate((p) => ({ ...p, niveis: { ...p.niveis, ...n } })),
  setPageLevel: (page, level) => get().applyPlayerUpdate((p) => ({ ...p, pageLevels: { ...p.pageLevels, [page]: level } })),
  setSkills: (s) => get().applyPlayerUpdate((p) => ({ ...p, skills: { ...p.skills, ...s } })),
  addSkillPercent: (skill, pct) => get().applyPlayerUpdate((p) => ({ ...p, skills: { ...p.skills, [skill]: (p.skills[skill] || 0) + (p.skills[skill] || 0) * (pct / 100) } })),
  setPower: (v) => get().applyPlayerUpdate((p) => ({ ...p, power: v })),
  setHierarchyBadge: (b) => get().applyPlayerUpdate((p) => ({ ...p, hierarchyBadge: b })),
  setCurrentRank: (r) => get().applyPlayerUpdate((p) => ({ ...p, currentRank: r })),
  addUnlockedRank: (r) => get().applyPlayerUpdate((p) => { const ranks = p.unlockedRanks || []; return ranks.includes(r) ? p : { ...p, unlockedRanks: [...ranks, r] }; }),
  setBarracoPosition: (pos) => get().applyPlayerUpdate((p) => ({ ...p, barracoPosition: { ...p.barracoPosition, ...pos } })),
  setHeaderCustomization: (c) => get().applyPlayerUpdate((p) => ({ ...p, headerCustomization: { ...p.headerCustomization, ...c } as HeaderCustomization })),
  addOwnedVehicle: (id) => get().applyPlayerUpdate((p) => { const v = p.ownedVehicles || []; return v.includes(id) ? p : { ...p, ownedVehicles: [...v, id] }; }),
  removeOwnedVehicle: (id) => get().applyPlayerUpdate((p) => ({ ...p, ownedVehicles: (p.ownedVehicles || []).filter((v) => v !== id) })),
  setCleanMoney: (a) => get().applyPlayerUpdate((p) => ({ ...p, balances: { ...p.balances, cleanMoney: a } })),
  addSkillBonus: (type, pct) => get().applyPlayerUpdate((p) => ({ ...p, skills: { ...p.skills, [type]: (p.skills[type] || 0) + pct } })),
  purchaseAccessory: (id, type) => get().applyPlayerUpdate((p) => { const a = p.purchasedAccessories || []; if (a.some((x) => x.accessoryId === id)) return p; return { ...p, purchasedAccessories: [...a, { accessoryId: id, skillType: type, purchasedAt: new Date().toISOString() }] }; }),
  getAccessoryBonusPercent: () => ((get().player.niveis.playerLevel || 1) <= 50 ? 1 : 2),
  addAccessory: (type, itemId, name) => get().applyPlayerUpdate((p) => { const ex = p.accessories?.[type]?.[itemId] || []; if (ex.includes(name)) return p; return { ...p, accessories: { ...p.accessories, [type]: { ...p.accessories?.[type], [itemId]: [...ex, name] } } }; }),
  setNotifications: (n) => get().applyPlayerUpdate((p) => ({ ...p, notifications: n })),
  addNotification: (n) => get().applyPlayerUpdate((p) => ({ ...p, notifications: [...(p.notifications || []), n] })),
  markNotificationAsRead: (id) => get().applyPlayerUpdate((p) => ({ ...p, notifications: (p.notifications || []).map((n) => n.id === id ? { ...n, read: true } : n) })),
  setAttackHistory: (h) => get().applyPlayerUpdate((p) => ({ ...p, attackHistory: h })),
  addAttackHistoryItem: (i) => get().applyPlayerUpdate((p) => ({ ...p, attackHistory: [...(p.attackHistory || []), i] })),
  applyRemoteAttackResult: (payload) => get().applyPlayerUpdate((p) => {
    const u: PlayerState = { ...p, balances: { ...p.balances, dirtyMoney: Math.max(0, p.balances.dirtyMoney + payload.dirtyMoneyDelta) } };
    if (payload.notification) u.notifications = [...(u.notifications || []), payload.notification];
    if (payload.historyItem)  u.attackHistory  = [...(u.attackHistory  || []), payload.historyItem];
    if (payload.pvpProtectionUntil !== undefined) u.punishments = { ...u.punishments, pvpProtectionUntil: payload.pvpProtectionUntil };
    return u;
  }),

  upgradeBarracoLocal: () => {
    const r = getBarracoUpgradeRequirements(get().player);
    if (!r.allowed) return { ok: false, reason: r.reason };
    get().applyPlayerUpdate((p) => ({ ...p, niveis: { ...p.niveis, barracoLevel: p.niveis.barracoLevel + 1 }, pageLevels: { ...p.pageLevels, barraco: p.niveis.barracoLevel + 1 }, balances: { ...p.balances, cleanMoney: Math.max(0, p.balances.cleanMoney - r.cost) } }));
    return { ok: true, cost: r.cost };
  },

  purchaseLuxuryItemLocal: ({ itemId, name, price, skillType, skillBonusPercent, insurance }) => {
    const p = get().player;
    if ((p?.balances?.cleanMoney ?? 0) < price) return { ok: false, reason: 'Saldo insuficiente' };
    const lv = p?.niveis?.playerLevel ?? 1;
    if ((p?.inventory?.items || []).some((i: any) => i.itemId === itemId && i.level === lv)) return { ok: false, reason: 'Item já comprado neste nível' };
    const item = { id: `${itemId}-${lv}-${Date.now()}`, itemId, name, price, purchasedAt: new Date().toISOString(), insurance, level: lv };
    get().applyPlayerUpdate((cp) => ({ ...cp, balances: { ...cp.balances, cleanMoney: cp.balances.cleanMoney - price }, inventory: { ...cp.inventory, items: [...(cp.inventory?.items || []), item] }, skills: { ...cp.skills, [skillType]: Number(((cp.skills?.[skillType] || 0) + skillBonusPercent).toFixed(2)) }, pageLevels: { ...cp.pageLevels, luxury: Math.max(cp.pageLevels?.luxury || 1, lv) } }));
    return { ok: true };
  },

  setFactionId: (factionId) => get().applyPlayerUpdate((p) => ({ ...p, factionId })),

  // ── Gang ──────────────────────────────────────────────────────────────────
  setGangMembers: (members) => set((s) => ({ player: { ...s.player, gangMembers: members } })),
  addGangMember: (member) => set((s) => ({ player: { ...s.player, gangMembers: [...(s.player.gangMembers || []), member] } })),
  updateGangMember: (id, updates) => set((s) => ({ player: { ...s.player, gangMembers: (s.player.gangMembers || []).map((m) => m.id === id ? { ...m, ...updates } : m) } })),
  removeGangMember: (id) => set((s) => ({ player: { ...s.player, gangMembers: (s.player.gangMembers || []).filter((m) => m.id !== id) } })),
  setGangStats: (stats) => set((s) => ({ player: { ...s.player, gangStats: stats } })),
  updateGangStats: (updates) => set((s) => ({ player: { ...s.player, gangStats: { ...s.player.gangStats!, ...updates } } })),
  setLastAttackAt: (t) => get().applyPlayerUpdate((p) => ({ ...p, lastAttackAt: t })),
  setPvpProtectionUntil: (t) => get().applyPlayerUpdate((p) => ({ ...p, pvpProtectionUntil: t, punishments: { ...p.punishments, pvpProtectionUntil: t } })),
  getGangMemberById: (id) => (get().player.gangMembers || []).find((m) => m.id === id),
  getActiveGangMembers: () => (get().player.gangMembers || []).filter((m) => m.status === 'ativo'),
  getInjuredGangMembers: () => (get().player.gangMembers || []).filter((m) => m.status === 'ferido'),
  getTrainingGangMembers: () => (get().player.gangMembers || []).filter((m) => m.status === 'treinando'),
  getDeadGangMembers: () => (get().player.gangMembers || []).filter((m) => m.status === 'morto'),
}));
