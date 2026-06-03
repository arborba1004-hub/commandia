import type {
  Faction,
  FactionActivityLog,
  FactionActivityLogType,
  FactionInvestmentBranch,
  FactionInvestmentBuffs,
  FactionListItem,
  FactionMember,
  FactionPermissions,
  FactionRole,
  FactionSettings,
  FactionTreasury,
  FactionInvestments,
} from '@/types/faction';
import {
  DEFAULT_FACTION_INVESTMENT_BUFFS,
  DEFAULT_FACTION_INVESTMENTS,
  DEFAULT_FACTION_PERMISSIONS_BY_ROLE,
} from '@/types/faction';

const BACKEND_URL = 'https://comando-backend.onrender.com';
const REQUEST_TIMEOUT_MS = 15000;

function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

async function factionRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error('Tempo limite excedido no sistema de facção');
      (timeoutError as any).status = 408;
      throw timeoutError;
    }
    throw new Error('Falha de conexão com o sistema de facção');
  } finally {
    window.clearTimeout(timeoutId);
  }

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.error || 'Erro ao comunicar com o sistema de facção');
    (error as any).status = response.status;
    throw error;
  }

  return data as T;
}

function safeNumber(value: any, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeString(value: any, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function safeIso(value: any): string {
  const str = safeString(value);
  return str || new Date().toISOString();
}

function normalizePermissions(
  input: any,
  role: FactionRole = 'member'
): FactionPermissions {
  const base = DEFAULT_FACTION_PERMISSIONS_BY_ROLE[role];

  return {
    canInvite: Boolean(input?.canInvite ?? base.canInvite),
    canAcceptRequests: Boolean(input?.canAcceptRequests ?? base.canAcceptRequests),
    canManageTreasury: Boolean(input?.canManageTreasury ?? base.canManageTreasury),
    canManageInvestments: Boolean(input?.canManageInvestments ?? base.canManageInvestments),
    canManageDiplomacy: Boolean(input?.canManageDiplomacy ?? base.canManageDiplomacy),
    canStartEvents: Boolean(input?.canStartEvents ?? base.canStartEvents),
  };
}

export function normalizeFactionMember(input: any): FactionMember {
  const role = (safeString(input?.role, 'member') as FactionRole) || 'member';

  return {
    playerId: safeString(input?.playerId || input?.id),
    playerName: safeString(input?.playerName || input?.name, 'Jogador'),
    avatar: safeString(input?.avatar),
    role,
    joinedAt: safeIso(input?.joinedAt),
    lastSeenAt: safeIso(input?.lastSeenAt),
    power: safeNumber(input?.power, 0),
    barracoLevel: Math.max(1, safeNumber(input?.barracoLevel, 1)),
    hierarchyBadge: safeString(input?.hierarchyBadge),
    permissions: normalizePermissions(input?.permissions, role),
    contribution: {
      dirtyMoney: safeNumber(input?.contribution?.dirtyMoney, 0),
      cleanMoney: safeNumber(input?.contribution?.cleanMoney, 0),
      corre: safeNumber(input?.contribution?.corre, 0),
      totalValue: safeNumber(input?.contribution?.totalValue, 0),
    },
  };
}

function normalizeTreasury(input: any): FactionTreasury {
  return {
    dirtyMoney: safeNumber(input?.dirtyMoney, 0),
    cleanMoney: safeNumber(input?.cleanMoney, 0),
    corre: safeNumber(input?.corre, 0),
  };
}

function normalizeInvestments(input: any): FactionInvestments {
  return {
    arsenalColetivo: Math.max(0, safeNumber(input?.arsenalColetivo, DEFAULT_FACTION_INVESTMENTS.arsenalColetivo)),
    caixaOperacional: Math.max(0, safeNumber(input?.caixaOperacional, DEFAULT_FACTION_INVESTMENTS.caixaOperacional)),
    mobilidade: Math.max(0, safeNumber(input?.mobilidade, DEFAULT_FACTION_INVESTMENTS.mobilidade)),
    influencia: Math.max(0, safeNumber(input?.influencia, DEFAULT_FACTION_INVESTMENTS.influencia)),
    inteligencia: Math.max(0, safeNumber(input?.inteligencia, DEFAULT_FACTION_INVESTMENTS.inteligencia)),
    fortificacao: Math.max(0, safeNumber(input?.fortificacao, DEFAULT_FACTION_INVESTMENTS.fortificacao)),
    logistica: Math.max(0, safeNumber(input?.logistica, DEFAULT_FACTION_INVESTMENTS.logistica)),
    doutrina: Math.max(0, safeNumber(input?.doutrina, DEFAULT_FACTION_INVESTMENTS.doutrina)),
  };
}

export function calculateFactionInvestmentBuffs(
  investments: FactionInvestments
): FactionInvestmentBuffs {
  const arsenal = Math.max(0, investments.arsenalColetivo || 0);
  const caixa = Math.max(0, investments.caixaOperacional || 0);
  const mobilidade = Math.max(0, investments.mobilidade || 0);
  const influencia = Math.max(0, investments.influencia || 0);
  const inteligencia = Math.max(0, investments.inteligencia || 0);
  const fortificacao = Math.max(0, investments.fortificacao || 0);
  const logistica = Math.max(0, investments.logistica || 0);
  const doutrina = Math.max(0, investments.doutrina || 0);

  return {
    attackPercent: arsenal * 2 + doutrina * 0.5,
    defensePercent: arsenal * 1.5 + fortificacao * 2 + doutrina * 0.5,
    hpPercent: arsenal * 1 + fortificacao * 1.5 + doutrina * 0.5,
    dirtyMoneyGainPercent: caixa * 2 + doutrina * 0.5,
    cleanMoneyGainPercent: caixa * 1.5 + doutrina * 0.5,
    agilityPercent: mobilidade * 2 + doutrina * 0.5,
    intelligencePercent: inteligencia * 2 + doutrina * 0.5,
    respectPercent: influencia * 2 + doutrina * 0.5,
    baseDefensePercent: fortificacao * 2 + doutrina * 0.5,
    donationEfficiencyPercent: logistica * 2 + doutrina * 0.5,
    buffDurationPercent: logistica * 1.5 + doutrina * 0.5,
  };
}

export function calculateFactionTotalInvestmentLevel(investments: FactionInvestments): number {
  return Object.values(investments).reduce((sum, level) => sum + Math.max(0, Number(level || 0)), 0);
}

export function getFactionInvestmentTierName(totalLevel: number): string {
  if (totalLevel >= 150) return 'Supremo Comando';
  if (totalLevel >= 140) return 'Império do Asfalto';
  if (totalLevel >= 130) return 'Conselho Soberano';
  if (totalLevel >= 120) return 'Domínio Absoluto';
  if (totalLevel >= 110) return 'Elite do Comando';
  if (totalLevel >= 100) return 'Cúpula de Guerra';
  if (totalLevel >= 90) return 'Organização Blindada';
  if (totalLevel >= 80) return 'Clã de Ouro';
  if (totalLevel >= 70) return 'Tropa Dominante';
  if (totalLevel >= 60) return 'Frente de Elite';
  if (totalLevel >= 50) return 'Comando Pesado';
  if (totalLevel >= 40) return 'Linha de Frente';
  if (totalLevel >= 30) return 'Núcleo Estruturado';
  if (totalLevel >= 20) return 'Tropa Organizada';
  if (totalLevel >= 10) return 'Bonde em Ascensão';
  return 'Turma de Esquina';
}

export function getFactionInvestmentUpgradeCost(
  branch: FactionInvestmentBranch,
  currentLevel: number
): { cleanMoney: number } {
  const baseByBranch: Record<FactionInvestmentBranch, number> = {
    arsenalColetivo: 50000,
    caixaOperacional: 45000,
    mobilidade: 42000,
    influencia: 38000,
    inteligencia: 47000,
    fortificacao: 52000,
    logistica: 40000,
    doutrina: 65000,
  };

  const baseCost = baseByBranch[branch];
  const safeLevel = Math.max(0, Number(currentLevel || 0));
  const cost = Math.round(baseCost * Math.pow(1.22, safeLevel));

  return { cleanMoney: cost };
}

function normalizeActivityLogType(input: any): FactionActivityLogType {
  return (safeString(input) as FactionActivityLogType) || 'settings_updated';
}

function normalizeActivityLog(input: any): FactionActivityLog {
  return {
    id: safeString(input?.id),
    type: normalizeActivityLogType(input?.type),
    actorPlayerId: safeString(input?.actorPlayerId),
    actorPlayerName: safeString(input?.actorPlayerName),
    targetPlayerId: safeString(input?.targetPlayerId),
    targetPlayerName: safeString(input?.targetPlayerName),
    metadata: input?.metadata && typeof input.metadata === 'object' ? input.metadata : {},
    createdAt: safeIso(input?.createdAt),
  };
}

export function normalizeFaction(input: any): Faction {
  const investments = normalizeInvestments(input?.investments);
  const investmentBuffs = input?.investmentBuffs
    ? {
        attackPercent: safeNumber(input?.investmentBuffs?.attackPercent, 0),
        defensePercent: safeNumber(input?.investmentBuffs?.defensePercent, 0),
        hpPercent: safeNumber(input?.investmentBuffs?.hpPercent, 0),
        dirtyMoneyGainPercent: safeNumber(input?.investmentBuffs?.dirtyMoneyGainPercent, 0),
        cleanMoneyGainPercent: safeNumber(input?.investmentBuffs?.cleanMoneyGainPercent, 0),
        agilityPercent: safeNumber(input?.investmentBuffs?.agilityPercent, 0),
        intelligencePercent: safeNumber(input?.investmentBuffs?.intelligencePercent, 0),
        respectPercent: safeNumber(input?.investmentBuffs?.respectPercent, 0),
        baseDefensePercent: safeNumber(input?.investmentBuffs?.baseDefensePercent, 0),
        donationEfficiencyPercent: safeNumber(input?.investmentBuffs?.donationEfficiencyPercent, 0),
        buffDurationPercent: safeNumber(input?.investmentBuffs?.buffDurationPercent, 0),
      }
    : calculateFactionInvestmentBuffs(investments);

  const totalInvestmentLevel =
    safeNumber(input?.totalInvestmentLevel, calculateFactionTotalInvestmentLevel(investments));

  return {
    id: safeString(input?.id),
    name: safeString(input?.name),
    tag: safeString(input?.tag),
    leaderId: safeString(input?.leaderId),

    level: Math.max(1, safeNumber(input?.level, 1)),
    exp: Math.max(0, safeNumber(input?.exp, 0)),
    expToNext: Math.max(1, safeNumber(input?.expToNext, 100)),

    description: safeString(input?.description),
    isPrivate: Boolean(input?.isPrivate),
    minimumPower: Math.max(0, safeNumber(input?.minimumPower, 0)),
    minimumBarracoLevel: Math.max(1, safeNumber(input?.minimumBarracoLevel, 1)),
    allowMemberInvites: Boolean(input?.allowMemberInvites),
    allowJoinRequests: Boolean(input?.allowJoinRequests ?? true),
    autoAcceptRequests: Boolean(input?.autoAcceptRequests),

    treasury: normalizeTreasury(input?.treasury),

    members: Array.isArray(input?.members) ? input.members.map(normalizeFactionMember) : [],
    joinRequests: Array.isArray(input?.joinRequests) ? input.joinRequests.map((item: any) => ({
      playerId: safeString(item?.playerId),
      playerName: safeString(item?.playerName, 'Jogador'),
      avatar: safeString(item?.avatar),
      power: safeNumber(item?.power, 0),
      barracoLevel: Math.max(1, safeNumber(item?.barracoLevel, 1)),
      createdAt: safeIso(item?.createdAt),
    })) : [],
    invites: Array.isArray(input?.invites) ? input.invites.map((item: any) => ({
      playerId: safeString(item?.playerId),
      playerName: safeString(item?.playerName, 'Jogador'),
      invitedByPlayerId: safeString(item?.invitedByPlayerId),
      invitedByPlayerName: safeString(item?.invitedByPlayerName),
      createdAt: safeIso(item?.createdAt),
      expiresAt: safeIso(item?.expiresAt),
    })) : [],

    activeBuffs: Array.isArray(input?.activeBuffs) ? input.activeBuffs.map((item: any) => ({
      id: safeString(item?.id),
      name: safeString(item?.name),
      type: safeString(item?.type),
      value: safeNumber(item?.value, 0),
      startedAt: safeIso(item?.startedAt),
      endsAt: safeIso(item?.endsAt),
    })) : [],

    enemyFactionIds: Array.isArray(input?.enemyFactionIds) ? input.enemyFactionIds.map(String) : [],
    allyFactionIds: Array.isArray(input?.allyFactionIds) ? input.allyFactionIds.map(String) : [],

    investments,
    investmentBuffs,

    investmentLog: Array.isArray(input?.investmentLog) ? input.investmentLog.map((item: any) => ({
      id: safeString(item?.id),
      branch: item?.branch as FactionInvestmentBranch,
      levelBefore: Math.max(0, safeNumber(item?.levelBefore, 0)),
      levelAfter: Math.max(0, safeNumber(item?.levelAfter, 0)),
      cost: {
        dirtyMoney: safeNumber(item?.cost?.dirtyMoney, 0),
        cleanMoney: safeNumber(item?.cost?.cleanMoney, 0),
        corre: safeNumber(item?.cost?.corre, 0),
      },
      upgradedByPlayerId: safeString(item?.upgradedByPlayerId),
      upgradedByPlayerName: safeString(item?.upgradedByPlayerName),
      createdAt: safeIso(item?.createdAt),
    })) : [],

    totalInvestmentLevel,
    investmentTierName: safeString(
      input?.investmentTierName,
      getFactionInvestmentTierName(totalInvestmentLevel)
    ),

    activityLog: Array.isArray(input?.activityLog) ? input.activityLog.map(normalizeActivityLog) : [],

    createdAt: safeIso(input?.createdAt),
    updatedAt: safeIso(input?.updatedAt),
  };
}

export function normalizeFactionListItem(input: any): FactionListItem {
  const faction = normalizeFaction(input);

  return {
    id: faction.id,
    name: faction.name,
    tag: faction.tag,
    leaderId: faction.leaderId,
    level: faction.level,
    exp: faction.exp,
    expToNext: faction.expToNext,
    description: faction.description,
    isPrivate: faction.isPrivate,
    minimumPower: faction.minimumPower,
    minimumBarracoLevel: faction.minimumBarracoLevel,
    createdAt: faction.createdAt,
    updatedAt: faction.updatedAt,
    memberCount: Array.isArray(input?.members)
      ? input.members.length
      : safeNumber(input?.memberCount, faction.members.length),
    totalInvestmentLevel: faction.totalInvestmentLevel,
    investmentTierName: faction.investmentTierName,
  };
}

export async function fetchMyFaction(): Promise<Faction | null> {
  try {
    const response = await factionRequest<{ faction: any }>('/faction/my', { method: 'GET' });
    if (!response?.faction || typeof response.faction !== 'object' || !response.faction.id) {
      return null;
    }
    return normalizeFaction(response.faction);
  } catch (error: any) {
    if (error?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchFactionList(): Promise<FactionListItem[]> {
  const response = await factionRequest<{ factions: any[] }>('/faction/list', { method: 'GET' });
  return Array.isArray(response.factions) ? response.factions.map(normalizeFactionListItem) : [];
}

export async function createFaction(payload: {
  name: string;
  tag: string;
  description?: string;
  isPrivate?: boolean;
  minimumPower?: number;
  minimumBarracoLevel?: number;
  allowMemberInvites?: boolean;
  allowJoinRequests?: boolean;
  autoAcceptRequests?: boolean;
}): Promise<Faction> {
  const response = await factionRequest<{ faction: any }>('/faction/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return normalizeFaction(response.faction);
}

export async function joinFaction(factionId: string): Promise<Faction> {
  const response = await factionRequest<{ faction: any }>('/faction/join', {
    method: 'POST',
    body: JSON.stringify({ factionId }),
  });

  return normalizeFaction(response.faction);
}

export async function leaveFaction(): Promise<{ success: boolean; factionDeleted: boolean; faction: Faction | null }> {
  const response = await factionRequest<{ success: boolean; factionDeleted?: boolean; faction?: any }>(
    '/faction/leave',
    { method: 'POST' }
  );

  return {
    success: Boolean(response?.success),
    factionDeleted: Boolean(response?.factionDeleted),
    faction: response?.faction ? normalizeFaction(response.faction) : null,
  };
}

export async function donateToFaction(payload: {
  currency: keyof FactionTreasury;
  amount: number;
}): Promise<Faction> {
  const response = await factionRequest<{ faction: any }>('/faction/donate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return normalizeFaction(response.faction);
}

export async function upgradeFactionInvestment(payload: {
  branch: FactionInvestmentBranch;
}): Promise<Faction> {
  const response = await factionRequest<{ faction: any }>('/faction/invest', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return normalizeFaction(response.faction);
}

export async function updateFactionSettings(payload: Partial<FactionSettings>): Promise<Faction> {
  const response = await factionRequest<{ faction: any }>('/faction/update-settings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return normalizeFaction(response.faction);
}

export async function updateFactionMemberRole(payload: {
  targetPlayerId: string;
  role: FactionRole;
}): Promise<Faction> {
  const response = await factionRequest<{ faction: any }>('/faction/update-member-role', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return normalizeFaction(response.faction);
}

export async function kickFactionMember(targetPlayerId: string): Promise<Faction> {
  const response = await factionRequest<{ faction: any }>('/faction/kick', {
    method: 'POST',
    body: JSON.stringify({ memberId: targetPlayerId }),
  });

  return normalizeFaction(response.faction);
}

export async function transferFactionLeadership(targetPlayerId: string): Promise<Faction> {
  const response = await factionRequest<{ faction: any }>('/faction/transfer-leadership', {
    method: 'POST',
    body: JSON.stringify({ memberId: targetPlayerId }),
  });

  return normalizeFaction(response.faction);
}

export async function acceptFactionJoinRequest(targetPlayerId: string): Promise<Faction> {
  const response = await factionRequest<{ faction: any }>('/faction/accept-join-request', {
    method: 'POST',
    body: JSON.stringify({ targetPlayerId }),
  });

  return normalizeFaction(response.faction);
}

export async function rejectFactionJoinRequest(targetPlayerId: string): Promise<Faction> {
  const response = await factionRequest<{ faction: any }>('/faction/reject-join-request', {
    method: 'POST',
    body: JSON.stringify({ targetPlayerId }),
  });

  return normalizeFaction(response.faction);
}