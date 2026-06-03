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
  fetchCurrentPlayerWithFaction,
  syncPlayerUpdateWithFaction,
  upgradeBarracoWithFaction,
  claimBarracoUpgradeWithFaction,
  accelerateBarracoUpgradeWithFaction,
} from '@/api/playerApi';
import { GAME_MODE } from '@/config/gameMode';
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
let loadPlayerPromise: Promise<void> | null = null;


function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem('authToken') ?? null; } catch { return null; }
}

function stripServerControlledState<T extends Partial<PlayerState>>(playerData: T): T {
  const clone = { ...(playerData as any) };

  // Esses campos agora são controlados por endpoints oficiais do backend.
  // /player/update não deve persistir economia nem progressão.
  delete clone.niveis;
  delete clone.balances;
  delete clone.pageLevels;
  delete clone.barracoUpgrade;
  delete clone.barracoAccelerators;

  delete clone.inventory;
  delete clone.skills;
  delete clone.vip;
  delete clone.lastSkillTrainAt;
  delete clone.lastAttackAt;
  delete clone.hierarchyBadge;
  delete clone.barracoPosition;
  delete clone.mapPosition;
  delete clone.laundryProgress;
  delete clone.punishments;
  delete clone.skillBoostMultiplier;
  delete clone.ownedVehicles;
  delete clone.purchasedAccessories;
  delete clone.accessories;
  delete clone.notifications;
  delete clone.attackHistory;
  delete clone.factionId;
  delete clone.gangId;
  delete clone.gang;
  delete clone.gangMembers;
  delete clone.gangStats;
  delete clone.power;
  delete clone.battlePrestige;
  delete clone.dailyCorre;
  delete clone.prisonHistory;
  delete clone.spinRateLimit;
  delete clone.cardCollection;
  delete clone.pvpProtectionUntil;
  delete clone.currentRank;
  delete clone.unlockedRanks;

  return clone as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────
// Identical to previous version — all components depend on these

type Balances          = { dirtyMoney: number; cleanMoney: number; corre: number };
type Inventory         = { items: any[]; gifts: any[]; rewards: any[] };
type PageLevels        = { barraco: number; giro: number; lavagem: number; luxury: number; fuga: number; arsenal: number; bribery: number; hierarchy: number; home: number; game: number; [key: string]: number };
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
type ConvoyAccelerators = { twoX: number };
type BarracoAccelerators = { seconds: number; [key: string]: number };
type BarracoUpgradeState = {
  active: boolean;
  status: 'idle' | 'building' | 'ready' | 'completed' | string;
  fromLevel: number;
  toLevel: number;
  cost: number;
  durationMs: number;
  startedAt: string | null;
  endsAt: string | null;
  completedAt: string | null;
  acceleratedMs: number;
};
type GangMember        = { id: string; type: string; level: number; status: 'ativo' | 'ferido' | 'morto' | 'treinando' | 'marchando'; recruitedAt: string; trainingEndsAt?: string | null; injuryEndsAt?: string | null };
type GangStats         = { totalMembers: number; activeMembers: number; injuredMembers: number; deadMembers: number; trainingMembers: number; marchingMembers: number; totalPower: number; averageLevel: number };
type AttackNotification = { id: string; type: 'attack_received' | 'attack_success' | 'attack_failed' | 'revenge_available'; attackerId?: string; attackerName?: string; targetId?: string; targetName?: string; success: boolean; loot: number; createdAt: string; read: boolean };
type AttackHistoryItem  = { id: string; attackerId: string; attackerName: string; targetId: string; targetName: string; success: boolean; loot: number; createdAt: string; attackerGangLosses?: Record<string, number>; defenderGangLosses?: Record<string, number> };
type DailyCorreState = { streak: number; lastClaimDate: string; totalClaims: number };
type PrisonHistoryState = { windowStart: number; countInWindow: number; lastPrisonAt: number; cooldownUntil: number };
type SpinRateLimitState = { windowStart: number; spinCount: number };
type GiroCard = { cardId: string; setId: string; name?: string; rarity: 'common' | 'rare' | 'epic' | 'legendary'; quantity: number; isGolden?: boolean; firstCollectedAt?: string };
type CardCollectionState = { cards: GiroCard[]; completedSets: string[]; totalCardsCollected: number; chests?: { common?: number; rare?: number; epic?: number } };

export type PlayerState = {
  _id?: string; googleId?: string; email?: string; name?: string; avatar?: string;
  niveis: Niveis; balances: Balances; inventory: Inventory; pageLevels: PageLevels; skills: Skills;
  power: number; battlePrestige?: number; hierarchyBadge: string; currentRank?: string; unlockedRanks?: string[];
  barracoPosition: BarracoPosition; mapPosition?: MapPosition;
  laundryProgress: LaundryProgress; punishments: PunishmentsState;
  skillBoostMultiplier: number; headerCustomization?: HeaderCustomization;
  ownedVehicles?: string[]; purchasedAccessories?: PurchasedAccessory[];
  accessories?: Accessories; convoyAccelerators?: ConvoyAccelerators;
  barracoAccelerators?: BarracoAccelerators; barracoUpgrade?: BarracoUpgradeState;
  notifications?: AttackNotification[];
  attackHistory?: AttackHistoryItem[]; factionId?: string | null; gangId?: string | null;
  dailyCorre?: DailyCorreState; prisonHistory?: PrisonHistoryState; spinRateLimit?: SpinRateLimitState;
  cardCollection?: CardCollectionState;
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
  applyLocalPlayerUpdate:   (updater: (current: PlayerState) => PlayerState) => void;

  // ── Sync ────────────────────────────────────────────────────────────────
  saveLocal:                () => void;            // no-op
  scheduleSync:             () => void;
  syncPlayerToBackend:      () => Promise<void>;

  // ── Polling (mantido por compatibilidade, sem efeito) ───────────────────
  startPolling:             () => void;            // no-op
  stopPolling:              () => void;            // no-op
  pollPlayerFromBackend:    () => Promise<void>;   // no-op

  // ── Upgrades locais ─────────────────────────────────────────────────────
  upgradeBarracoLocal:      () => Promise<{ ok: boolean; reason?: string; message?: string; action?: string; cost?: number; previousLevel?: number; currentLevel?: number; targetLevel?: number; durationMs?: number; remainingMs?: number }>;
  claimBarracoUpgradeLocal: () => Promise<{ ok: boolean; reason?: string; message?: string; action?: string; currentLevel?: number }>;
  accelerateBarracoUpgradeLocal: (seconds: number) => Promise<{ ok: boolean; reason?: string; message?: string; appliedSeconds?: number; remainingMs?: number }>;
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
  balances:  { dirtyMoney: GAME_MODE.debugEconomy ? GAME_MODE.debugDirtyMoney : 35000, cleanMoney: GAME_MODE.debugEconomy ? GAME_MODE.debugCleanMoney : 2500, corre: 100 },
  inventory: { items: [], gifts: [], rewards: [] },
  pageLevels: { barraco: 1, giro: 1, lavagem: 1, luxury: 1, fuga: 1, arsenal: 1, bribery: 1, hierarchy: 1, home: 1, game: 1 },
  skills:    { attack: 0, defense: 0, intelligence: 0, agility: 0, respect: 0, vigor: 0 },
  power:     0,
  battlePrestige: 0,
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
  convoyAccelerators: { twoX: 0 },
  barracoAccelerators: { seconds: 0 },
  barracoUpgrade: {
    active: false,
    status: 'idle',
    fromLevel: 1,
    toLevel: 1,
    cost: 0,
    durationMs: 0,
    startedAt: null,
    endsAt: null,
    completedAt: null,
    acceleratedMs: 0,
  },
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
  dailyCorre: { streak: 0, lastClaimDate: '', totalClaims: 0 },
  prisonHistory: { windowStart: 0, countInWindow: 0, lastPrisonAt: 0, cooldownUntil: 0 },
  spinRateLimit: { windowStart: 0, spinCount: 0 },
  cardCollection: { cards: [], completedSets: [], totalCardsCollected: 0, chests: { common: 0, rare: 0, epic: 0 } },
};

// ─── mergePlayer (sem writes de localStorage) ─────────────────────────────────

function hasOwn<T extends object>(obj: T, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function hasPersistablePlayerUpdate(playerData: Partial<PlayerState>): boolean {
  const clean = stripServerControlledState(playerData || {});
  return Object.keys(clean as Record<string, unknown>).length > 0;
}

function stableJson(value: unknown): string {
  try { return JSON.stringify(value ?? null); } catch { return ''; }
}

function getPlayerIdentifier(player?: Partial<PlayerState> | null): string {
  return String((player as any)?._id || (player as any)?.id || player?.googleId || '').trim();
}

function mergePlayer(
  incoming?: Partial<PlayerState> | null,
  basePlayer?: Partial<PlayerState> | null
): PlayerState {
  const inc = incoming || {};
  const base = mergePlayerBase(basePlayer);

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
  const convoyAccelerators = (inc as any).convoyAccelerators && typeof (inc as any).convoyAccelerators === 'object'
    ? (inc as any).convoyAccelerators
    : {};
  const barracoAccelerators = (inc as any).barracoAccelerators && typeof (inc as any).barracoAccelerators === 'object'
    ? (inc as any).barracoAccelerators
    : {};
  const barracoUpgrade = (inc as any).barracoUpgrade && typeof (inc as any).barracoUpgrade === 'object'
    ? (inc as any).barracoUpgrade
    : {};

  const baseMapPosition = base.mapPosition || initialPlayer.mapPosition!;
  const baseHeader = base.headerCustomization || initialPlayer.headerCustomization || {};
  const baseLaundry = base.laundryProgress || initialPlayer.laundryProgress;
  const basePunishments = base.punishments || initialPlayer.punishments;
  const baseBarracoUpgrade = base.barracoUpgrade || initialPlayer.barracoUpgrade!;

  return {
    ...initialPlayer,
    ...base,
    ...inc,
    _id: (inc as any)?._id || (inc as any)?.id || (inc as any)?.googleId || base._id || base.googleId || initialPlayer._id,
    niveis:       { ...initialPlayer.niveis,    ...(base.niveis || {}),    ...niveis },
    balances:     { ...initialPlayer.balances,  ...(base.balances || {}),  ...balances },
    inventory:    {
      ...initialPlayer.inventory,
      ...(base.inventory || {}),
      ...inventory,
      items: (inventory as any)?.items ?? base.inventory?.items ?? initialPlayer.inventory.items,
      gifts: (inventory as any)?.gifts ?? base.inventory?.gifts ?? initialPlayer.inventory.gifts,
      rewards: (inventory as any)?.rewards ?? base.inventory?.rewards ?? initialPlayer.inventory.rewards,
    },
    pageLevels:   { ...initialPlayer.pageLevels, ...(base.pageLevels || {}), ...pageLevels },
    skills:       { ...initialPlayer.skills,    ...(base.skills || {}),    ...skills },
    barracoPosition: { ...initialPlayer.barracoPosition, ...(base.barracoPosition || {}), ...barracoPos },
    mapPosition:  {
      tileX: (mapPos as any)?.tileX ?? baseMapPosition.tileX ?? GRID_WIDTH / 2,
      tileY: (mapPos as any)?.tileY ?? baseMapPosition.tileY ?? GRID_HEIGHT / 2,
      worldX: (mapPos as any)?.worldX ?? baseMapPosition.worldX ?? 0,
      worldY: (mapPos as any)?.worldY ?? baseMapPosition.worldY ?? 0,
    },
    headerCustomization: {
      playerNameFont: (headerCust as any)?.playerNameFont || (baseHeader as any)?.playerNameFont || 'oswald',
      playerNameFontSize: (headerCust as any)?.playerNameFontSize || (baseHeader as any)?.playerNameFontSize || '1.875rem',
      playerNameColor: (headerCust as any)?.playerNameColor || (baseHeader as any)?.playerNameColor || '#1a1205',
      customName: (headerCust as any)?.customName ?? (baseHeader as any)?.customName ?? '',
      customAvatar: (headerCust as any)?.customAvatar ?? (baseHeader as any)?.customAvatar ?? '',
    },
    laundryProgress: {
      activeOperations: (laundryProg as any)?.activeOperations ?? baseLaundry.activeOperations ?? initialPlayer.laundryProgress.activeOperations,
      dailyOperations: (laundryProg as any)?.dailyOperations ?? baseLaundry.dailyOperations ?? initialPlayer.laundryProgress.dailyOperations,
    },
    punishments: {
      active: (punishments as any)?.active ?? basePunishments.active ?? initialPlayer.punishments.active,
      delacao: (punishments as any)?.delacao ?? basePunishments.delacao ?? initialPlayer.punishments.delacao,
      inventoryBlocked: (punishments as any)?.inventoryBlocked ?? basePunishments.inventoryBlocked ?? false,
      dirtyMoneyBlocked: (punishments as any)?.dirtyMoneyBlocked ?? basePunishments.dirtyMoneyBlocked ?? false,
      cleanMoneyBlocked: (punishments as any)?.cleanMoneyBlocked ?? basePunishments.cleanMoneyBlocked ?? false,
      levelProgressionBlocked: (punishments as any)?.levelProgressionBlocked ?? basePunishments.levelProgressionBlocked ?? false,
      inventoryBonusReductionPercent: (punishments as any)?.inventoryBonusReductionPercent ?? basePunishments.inventoryBonusReductionPercent ?? 0,
      pvpProtectionUntil: (punishments as any)?.pvpProtectionUntil ?? basePunishments.pvpProtectionUntil ?? null,
      delacaoRewardPending: (punishments as any)?.delacaoRewardPending ?? basePunishments.delacaoRewardPending ?? false,
      delacaoRewardUnlockAt: (punishments as any)?.delacaoRewardUnlockAt ?? basePunishments.delacaoRewardUnlockAt ?? null,
      pendingSkillBoost: (punishments as any)?.pendingSkillBoost ?? basePunishments.pendingSkillBoost ?? 0,
      lastVehicleLost: (punishments as any)?.lastVehicleLost ?? basePunishments.lastVehicleLost ?? false,
    },
    skillBoostMultiplier: inc?.skillBoostMultiplier ?? base.skillBoostMultiplier ?? 1.0,
    ownedVehicles: inc?.ownedVehicles ?? base.ownedVehicles ?? [],
    accessories:   inc?.accessories   ?? base.accessories   ?? {},
    purchasedAccessories: inc?.purchasedAccessories ?? base.purchasedAccessories ?? [],
    convoyAccelerators: {
      twoX: Math.max(0, Math.floor(Number((convoyAccelerators as any).twoX ?? base.convoyAccelerators?.twoX ?? initialPlayer.convoyAccelerators?.twoX ?? 0)))
    },
    barracoAccelerators: {
      seconds: Math.max(0, Math.floor(Number((barracoAccelerators as any).seconds ?? base.barracoAccelerators?.seconds ?? initialPlayer.barracoAccelerators?.seconds ?? 0)))
    },
    barracoUpgrade: {
      active: Boolean((barracoUpgrade as any).active ?? baseBarracoUpgrade.active ?? false),
      status: String((barracoUpgrade as any).status ?? baseBarracoUpgrade.status ?? 'idle'),
      fromLevel: Math.max(1, Math.floor(Number((barracoUpgrade as any).fromLevel ?? baseBarracoUpgrade.fromLevel ?? base.niveis?.barracoLevel ?? 1))),
      toLevel: Math.max(1, Math.floor(Number((barracoUpgrade as any).toLevel ?? baseBarracoUpgrade.toLevel ?? base.niveis?.barracoLevel ?? 1))),
      cost: Math.max(0, Math.floor(Number((barracoUpgrade as any).cost ?? baseBarracoUpgrade.cost ?? 0))),
      durationMs: Math.max(0, Math.floor(Number((barracoUpgrade as any).durationMs ?? baseBarracoUpgrade.durationMs ?? 0))),
      startedAt: (barracoUpgrade as any).startedAt ?? baseBarracoUpgrade.startedAt ?? null,
      endsAt: (barracoUpgrade as any).endsAt ?? baseBarracoUpgrade.endsAt ?? null,
      completedAt: (barracoUpgrade as any).completedAt ?? baseBarracoUpgrade.completedAt ?? null,
      acceleratedMs: Math.max(0, Math.floor(Number((barracoUpgrade as any).acceleratedMs ?? baseBarracoUpgrade.acceleratedMs ?? 0))),
    },
    notifications: inc?.notifications ?? base.notifications ?? [],
    attackHistory: inc?.attackHistory ?? base.attackHistory ?? [],
    factionId:     hasOwn(inc, 'factionId') ? (inc.factionId ?? null) : (base.factionId ?? null),
    gangId:        hasOwn(inc, 'gangId') ? (inc.gangId ?? null) : (base.gangId ?? null),
    gang:          incomingGang ?? inc.gang ?? base.gang ?? initialPlayer.gang,
    gangMembers:   incomingGang?.members ?? inc.gangMembers ?? base.gangMembers ?? initialPlayer.gangMembers,
    gangStats:     incomingGang?.stats ?? inc.gangStats ?? base.gangStats ?? initialPlayer.gangStats,
    lastAttackAt:  hasOwn(inc, 'lastAttackAt') ? (inc.lastAttackAt ?? null) : (base.lastAttackAt ?? null),
    pvpProtectionUntil: hasOwn(inc, 'pvpProtectionUntil')
      ? (inc.pvpProtectionUntil ?? (punishments as any)?.pvpProtectionUntil ?? null)
      : (base.pvpProtectionUntil ?? basePunishments.pvpProtectionUntil ?? null),
    dailyCorre: (inc as any)?.dailyCorre && typeof (inc as any).dailyCorre === 'object'
      ? { ...initialPlayer.dailyCorre!, ...(base.dailyCorre || {}), ...(inc as any).dailyCorre }
      : (base.dailyCorre ?? initialPlayer.dailyCorre),
    prisonHistory: (inc as any)?.prisonHistory && typeof (inc as any).prisonHistory === 'object'
      ? { ...initialPlayer.prisonHistory!, ...(base.prisonHistory || {}), ...(inc as any).prisonHistory }
      : (base.prisonHistory ?? initialPlayer.prisonHistory),
    spinRateLimit: (inc as any)?.spinRateLimit && typeof (inc as any).spinRateLimit === 'object'
      ? { ...initialPlayer.spinRateLimit!, ...(base.spinRateLimit || {}), ...(inc as any).spinRateLimit }
      : (base.spinRateLimit ?? initialPlayer.spinRateLimit),
    cardCollection: (inc as any)?.cardCollection && typeof (inc as any).cardCollection === 'object'
      ? { ...initialPlayer.cardCollection!, ...(base.cardCollection || {}), ...(inc as any).cardCollection }
      : (base.cardCollection ?? initialPlayer.cardCollection),
  };
}

function mergePlayerBase(basePlayer?: Partial<PlayerState> | null): PlayerState {
  if (!basePlayer || basePlayer === initialPlayer) return initialPlayer;
  return { ...initialPlayer, ...(basePlayer as PlayerState) };
}

async function syncFactionStoreFromEnvelope(faction: any, options?: { allowClear?: boolean }) {
  try {
    const { useFactionStore } = await import('@/store/factionStore');
    const factionStore = useFactionStore.getState();

    if (faction) {
      const current = factionStore.myFaction;
      const incomingHasMembers = Array.isArray(faction.members);
      const currentHasMembers = Array.isArray(current?.members) && current.members.length > 0;
      const sameFaction = current && String((current as any).id || '') === String((faction as any).id || '');

      // /player/me pode devolver facção resumida. Nunca deixe esse resumo apagar
      // members/joinRequests/invites já carregados por /faction/my.
      if (!incomingHasMembers && sameFaction && currentHasMembers) {
        factionStore.setFaction({ ...current, ...faction, members: current.members } as any);
      } else {
        factionStore.setFaction(faction);
      }
      return;
    }

    if (options?.allowClear) {
      factionStore.setFaction(null);
    }
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

  // ── Fallback HTTP: estabiliza refresh/mobile quando o socket demora ────────
  // O socket continua sendo realtime, mas /player/me garante que ProtectedRoute,
  // Header e GamePage não fiquem pretos se o playerInit atrasar ou for perdido.
  loadPlayer: async () => {
    const current = get().player;
    if (get().isLoaded && getPlayerIdentifier(current)) return;
    if (!getStoredAuthToken()) return;
    if (loadPlayerPromise) return loadPlayerPromise;

    loadPlayerPromise = (async () => {
      try {
        set({ isSyncing: true, syncError: null });
        const envelope = await fetchCurrentPlayerWithFaction();
        const merged = clearExpiredPunishments(mergePlayer(envelope.player, get().player));
        const normalized = {
          ...merged,
          _id: String((envelope.player as any)?._id || (envelope.player as any)?.id || (envelope.player as any)?.googleId || merged._id || ''),
        };

        set({
          player: normalized,
          isLoaded: true,
          isSyncing: false,
          syncError: null,
          lastSyncAt: Date.now(),
          lastServerHydrationAt: Date.now(),
          pendingLocalChanges: false,
        });

        await syncFactionStoreFromEnvelope(envelope.faction ?? null, {
          allowClear: (envelope.player as any)?.factionId == null,
        });
      } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Erro ao carregar jogador';
        set({ isSyncing: false, syncError: message });

        if (error?.status === 401 || error?.status === 403) {
          try { localStorage.removeItem('authToken'); } catch { /* noop */ }
          get().clearPlayer();
        }
      } finally {
        loadPlayerPromise = null;
      }
    })();

    return loadPlayerPromise;
  },

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
      
      const merged = clearExpiredPunishments(mergePlayer(playerData, get().player));
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
    const current = get().player;
    const merged = clearExpiredPunishments(mergePlayer(incoming, current));
    const shouldPersist = hasPersistablePlayerUpdate(incoming);
    set({ player: merged, localVersion: get().localVersion + 1, lastLocalMutationAt: Date.now(), pendingLocalChanges: shouldPersist });
    if (shouldPersist) get().scheduleSync();
  },

  applyPlayerUpdate: (updater) => {
    const current = get().player;
    const updated = clearExpiredPunishments(mergePlayer(updater(current), current));
    const beforePersistable = stripServerControlledState(current);
    const afterPersistable = stripServerControlledState(updated);
    const shouldPersist = stableJson(beforePersistable) !== stableJson(afterPersistable);

    set({
      player: updated,
      localVersion: get().localVersion + 1,
      lastLocalMutationAt: Date.now(),
      pendingLocalChanges: shouldPersist,
    });

    // Depois do fechamento de /player/update, só customização do cabeçalho pode
    // persistir por este caminho. Economia/gangue/mapa/punições vêm dos endpoints oficiais.
    if (shouldPersist) get().scheduleSync();
  },

  applyLocalPlayerUpdate: (updater) => {
    const current = get().player;
    const updated = clearExpiredPunishments(mergePlayer(updater(current), current));
    set({
      player: updated,
      localVersion: get().localVersion + 1,
      lastLocalMutationAt: Date.now(),
      pendingLocalChanges: false,
    });
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
    syncTimeout = setTimeout(() => { get().syncPlayerToBackend().catch(() => {}); }, 500);
  },

  // ── syncPlayerToBackend: PATCH /player/update ─────────────────────────────
  // Não atualiza o store com a resposta HTTP — socket traz 'playerUpdate'
  // Mantido pois: TalentsMenu, AvatarNameCustomizationModal, BarracoDetailPage o chamam
  syncPlayerToBackend: async () => {
    if (get().isSyncing) return;
    if (!getStoredAuthToken()) return;
    const player = stripServerControlledState(get().player);
    if (Object.keys(player as Record<string, unknown>).length === 0) {
      set({ pendingLocalChanges: false, syncError: null, lastSyncAt: Date.now() });
      return;
    }
    try {
      set({ isSyncing: true, syncError: null });
      await syncPlayerUpdateWithFaction(player);
      // NÃO atualiza store aqui — socket emite 'playerUpdate' após o save
      set({ isSyncing: false, pendingLocalChanges: false, lastSyncAt: Date.now() });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao sincronizar';
      set({ isSyncing: false, syncError: message });
      throw new Error(message);
    }
  },

  // ── Laundry ───────────────────────────────────────────────────────────────
  startLaundryOperation: async (operation) => {
    const current = get().player;
    if (isMoneyLaunderingBlocked(current)) return false;
    if (current.balances.dirtyMoney < operation.grossAmount) return false;
    try {
      const response = await laundryStartWithFaction({
        businessId: operation.businessId,
        businessName: operation.businessName,
      });
      const merged = clearExpiredPunishments(mergePlayer(response.player, get().player));
      set({ player: merged, lastSyncAt: Date.now(), pendingLocalChanges: false, lastServerHydrationAt: Date.now() });
      await syncFactionStoreFromEnvelope(response.faction);
      return true;
    } catch (error: any) { throw error; }
  },

  completeLaundryOperation: async (operationId) => {
    if (get().player.laundryProgress.activeOperations.findIndex((op) => op.operationId === operationId && op.status === 'processing') === -1) return false;
    try {
      const response = await laundryCompleteWithFaction(operationId);
      const merged = clearExpiredPunishments(mergePlayer(response.player, get().player));
      set({ player: merged, lastSyncAt: Date.now(), pendingLocalChanges: false, lastServerHydrationAt: Date.now() });
      await syncFactionStoreFromEnvelope(response.faction);
      get().clearFinishedLaundryOperations();
      return true;
    } catch { return false; }
  },

  clearFinishedLaundryOperations: () => {
    const today = new Date().toISOString().split('T')[0];
    const c = get().player;
    set({ player: clearExpiredPunishments(mergePlayer({ ...c, laundryProgress: { ...c.laundryProgress, dailyOperations: c.laundryProgress.dailyOperations.filter((op) => op.date === today) } }, c)) });
  },

  canOperateLaundryToday: async (businessId) => {
    try { const r = await canOperateLaundry(businessId); return r.allowed; } catch { return true; }
  },

  // ── Setters ───────────────────────────────────────────────────────────────
  setBalances: (b) => get().applyLocalPlayerUpdate((p) => ({ ...p, balances: { ...p.balances, ...b } })),
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
  setNotifications: (n) => get().applyLocalPlayerUpdate((p) => ({ ...p, notifications: n })),
  addNotification: (n) => get().applyLocalPlayerUpdate((p) => ({ ...p, notifications: [...(p.notifications || []), n] })),
  markNotificationAsRead: (id) => get().applyLocalPlayerUpdate((p) => ({ ...p, notifications: (p.notifications || []).map((n) => n.id === id ? { ...n, read: true } : n) })),
  setAttackHistory: (h) => get().applyLocalPlayerUpdate((p) => ({ ...p, attackHistory: h })),
  addAttackHistoryItem: (i) => get().applyLocalPlayerUpdate((p) => ({ ...p, attackHistory: [...(p.attackHistory || []), i] })),
  applyRemoteAttackResult: (payload) => get().applyLocalPlayerUpdate((p) => {
    const u: PlayerState = { ...p, balances: { ...p.balances, dirtyMoney: Math.max(0, p.balances.dirtyMoney + payload.dirtyMoneyDelta) } };
    if (payload.notification) u.notifications = [...(u.notifications || []), payload.notification];
    if (payload.historyItem)  u.attackHistory  = [...(u.attackHistory  || []), payload.historyItem];
    if (payload.pvpProtectionUntil !== undefined) u.punishments = { ...u.punishments, pvpProtectionUntil: payload.pvpProtectionUntil };
    return u;
  }),

  upgradeBarracoLocal: async () => {
    try {
      const response = await upgradeBarracoWithFaction();
      const merged = clearExpiredPunishments(mergePlayer(response.player, get().player));

      set({
        player: merged,
        lastSyncAt: Date.now(),
        pendingLocalChanges: false,
        lastServerHydrationAt: Date.now(),
        syncError: null,
      });

      await syncFactionStoreFromEnvelope(response.faction);

      return {
        ok: true,
        message: response.message,
        action: response.barraco?.action || 'started',
        cost: response.barraco?.cost,
        previousLevel: response.barraco?.previousLevel,
        currentLevel: response.barraco?.currentLevel,
        targetLevel: response.barraco?.targetLevel,
        durationMs: response.barraco?.durationMs,
        remainingMs: response.barraco?.remainingMs,
      };
    } catch (error: any) {
      const reason = error?.message || 'Erro ao iniciar evolução do barraco';
      set({ syncError: reason });
      return { ok: false, reason };
    }
  },

  claimBarracoUpgradeLocal: async () => {
    try {
      const response = await claimBarracoUpgradeWithFaction();
      const merged = clearExpiredPunishments(mergePlayer(response.player, get().player));

      set({
        player: merged,
        lastSyncAt: Date.now(),
        pendingLocalChanges: false,
        lastServerHydrationAt: Date.now(),
        syncError: null,
      });

      await syncFactionStoreFromEnvelope(response.faction);

      return {
        ok: true,
        message: response.message,
        action: response.barraco?.action || 'claimed',
        currentLevel: response.barraco?.currentLevel,
      };
    } catch (error: any) {
      const reason = error?.message || 'Erro ao finalizar evolução do barraco';
      set({ syncError: reason });
      return { ok: false, reason };
    }
  },

  accelerateBarracoUpgradeLocal: async (seconds) => {
    try {
      const response = await accelerateBarracoUpgradeWithFaction(seconds);
      const merged = clearExpiredPunishments(mergePlayer(response.player, get().player));

      set({
        player: merged,
        lastSyncAt: Date.now(),
        pendingLocalChanges: false,
        lastServerHydrationAt: Date.now(),
        syncError: null,
      });

      await syncFactionStoreFromEnvelope(response.faction);

      return {
        ok: true,
        message: response.message,
        appliedSeconds: response.barraco?.appliedSeconds,
        remainingMs: response.barraco?.remainingMs,
      };
    } catch (error: any) {
      const reason = error?.message || 'Erro ao usar acelerador do barraco';
      set({ syncError: reason });
      return { ok: false, reason };
    }
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

  setFactionId: (factionId) => get().applyLocalPlayerUpdate((p) => ({ ...p, factionId })),

  // ── Gang ──────────────────────────────────────────────────────────────────
  setGangMembers: (members) => get().applyLocalPlayerUpdate((p) => ({
    ...p,
    gangMembers: members,
    gang: { ...(p.gang || {}), members },
  })),
  addGangMember: (member) => get().applyLocalPlayerUpdate((p) => {
    const members = [...(p.gang?.members || p.gangMembers || []), member];
    return { ...p, gangMembers: members, gang: { ...(p.gang || {}), members } };
  }),
  updateGangMember: (id, updates) => get().applyLocalPlayerUpdate((p) => {
    const members = (p.gang?.members || p.gangMembers || []).map((m) => String(m.id) === String(id) ? { ...m, ...updates } : m);
    return { ...p, gangMembers: members, gang: { ...(p.gang || {}), members } };
  }),
  removeGangMember: (id) => get().applyLocalPlayerUpdate((p) => {
    const members = (p.gang?.members || p.gangMembers || []).filter((m) => String(m.id) !== String(id));
    return { ...p, gangMembers: members, gang: { ...(p.gang || {}), members } };
  }),
  setGangStats: (stats) => get().applyLocalPlayerUpdate((p) => ({
    ...p,
    gangStats: stats,
    gang: { ...(p.gang || {}), stats },
  })),
  updateGangStats: (updates) => get().applyLocalPlayerUpdate((p) => {
    const stats = { ...(p.gangStats || p.gang?.stats || {}), ...updates };
    return { ...p, gangStats: stats, gang: { ...(p.gang || {}), stats } };
  }),
  setLastAttackAt: (t) => get().applyLocalPlayerUpdate((p) => ({ ...p, lastAttackAt: t })),
  setPvpProtectionUntil: (t) => get().applyLocalPlayerUpdate((p) => ({ ...p, pvpProtectionUntil: t, punishments: { ...p.punishments, pvpProtectionUntil: t } })),
  getGangMemberById: (id) => (get().player.gangMembers || []).find((m) => m.id === id),
  getActiveGangMembers: () => (get().player.gangMembers || []).filter((m) => m.status === 'ativo'),
  getInjuredGangMembers: () => (get().player.gangMembers || []).filter((m) => m.status === 'ferido'),
  getTrainingGangMembers: () => (get().player.gangMembers || []).filter((m) => m.status === 'treinando'),
  getDeadGangMembers: () => (get().player.gangMembers || []).filter((m) => m.status === 'morto'),
}));
