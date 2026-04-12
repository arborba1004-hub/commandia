export type FactionRole =
  | 'leader'
  | 'subleader'
  | 'recruiter'
  | 'treasurer'
  | 'diplomat'
  | 'member';

export type FactionPermissionKey =
  | 'canInvite'
  | 'canAcceptRequests'
  | 'canManageTreasury'
  | 'canManageInvestments'
  | 'canManageDiplomacy'
  | 'canStartEvents';

export type FactionPermissions = {
  canInvite: boolean;
  canAcceptRequests: boolean;
  canManageTreasury: boolean;
  canManageInvestments: boolean;
  canManageDiplomacy: boolean;
  canStartEvents: boolean;
};

export type FactionTreasury = {
  dirtyMoney: number;
  cleanMoney: number;
  corre: number;
};

export type FactionContribution = {
  dirtyMoney: number;
  cleanMoney: number;
  corre: number;
  totalValue: number;
};

export type FactionMember = {
  playerId: string;
  playerName: string;
  avatar?: string;
  role: FactionRole;
  joinedAt: string;
  lastSeenAt: string;
  power: number;
  barracoLevel: number;
  hierarchyBadge?: string;
  permissions: FactionPermissions;
  contribution: FactionContribution;
};

export type FactionJoinRequest = {
  playerId: string;
  playerName: string;
  avatar?: string;
  power: number;
  barracoLevel: number;
  createdAt: string;
};

export type FactionInvite = {
  playerId: string;
  playerName: string;
  invitedByPlayerId: string;
  invitedByPlayerName: string;
  createdAt: string;
  expiresAt: string;
};

export type FactionBuff = {
  id: string;
  name: string;
  type: string;
  value: number;
  startedAt: string;
  endsAt: string;
};

export type FactionInvestmentBranch =
  | 'arsenalColetivo'
  | 'caixaOperacional'
  | 'mobilidade'
  | 'influencia'
  | 'inteligencia'
  | 'fortificacao'
  | 'logistica'
  | 'doutrina';

export type FactionInvestments = {
  arsenalColetivo: number;
  caixaOperacional: number;
  mobilidade: number;
  influencia: number;
  inteligencia: number;
  fortificacao: number;
  logistica: number;
  doutrina: number;
};

export type FactionInvestmentBuffs = {
  attackPercent: number;
  defensePercent: number;
  hpPercent: number;
  dirtyMoneyGainPercent: number;
  cleanMoneyGainPercent: number;
  agilityPercent: number;
  intelligencePercent: number;
  respectPercent: number;
  baseDefensePercent: number;
  donationEfficiencyPercent: number;
  buffDurationPercent: number;
};

export type FactionInvestmentLog = {
  id: string;
  branch: FactionInvestmentBranch;
  levelBefore: number;
  levelAfter: number;
  cost: {
    dirtyMoney?: number;
    cleanMoney?: number;
    corre?: number;
  };
  upgradedByPlayerId: string;
  upgradedByPlayerName: string;
  createdAt: string;
};

export type FactionActivityLogType =
  | 'member_joined'
  | 'member_left'
  | 'member_kicked'
  | 'leadership_transferred'
  | 'donation'
  | 'request_created'
  | 'request_accepted'
  | 'request_rejected'
  | 'invite_sent'
  | 'invite_accepted'
  | 'invite_rejected'
  | 'investment_upgraded'
  | 'role_updated'
  | 'settings_updated'
  | 'diplomacy_updated'
  | 'buff_started'
  | 'buff_ended'
  | 'war_declared'
  | 'territory_won'
  | 'territory_lost';

export type FactionActivityLog = {
  id: string;
  type: FactionActivityLogType;
  actorPlayerId?: string;
  actorPlayerName?: string;
  targetPlayerId?: string;
  targetPlayerName?: string;
  metadata?: Record<string, any>;
  createdAt: string;
};

export type FactionSettings = {
  description: string;
  isPrivate: boolean;
  minimumPower: number;
  minimumBarracoLevel: number;
  allowMemberInvites: boolean;
  allowJoinRequests: boolean;
  autoAcceptRequests: boolean;
};

export type Faction = {
  id: string;
  name: string;
  tag: string;
  leaderId: string;

  level: number;
  exp: number;
  expToNext: number;

  description: string;
  isPrivate: boolean;
  minimumPower: number;
  minimumBarracoLevel: number;
  allowMemberInvites: boolean;
  allowJoinRequests: boolean;
  autoAcceptRequests: boolean;

  treasury: FactionTreasury;

  members: FactionMember[];
  joinRequests: FactionJoinRequest[];
  invites: FactionInvite[];

  activeBuffs: FactionBuff[];

  enemyFactionIds: string[];
  allyFactionIds: string[];

  investments: FactionInvestments;
  investmentBuffs: FactionInvestmentBuffs;
  investmentLog: FactionInvestmentLog[];

  totalInvestmentLevel: number;
  investmentTierName: string;

  activityLog: FactionActivityLog[];

  createdAt: string;
  updatedAt: string;
};

export type FactionListItem = Pick<
  Faction,
  | 'id'
  | 'name'
  | 'tag'
  | 'leaderId'
  | 'level'
  | 'exp'
  | 'expToNext'
  | 'description'
  | 'isPrivate'
  | 'minimumPower'
  | 'minimumBarracoLevel'
  | 'createdAt'
  | 'updatedAt'
> & {
  memberCount: number;
  totalInvestmentLevel: number;
  investmentTierName: string;
};

export const DEFAULT_FACTION_PERMISSIONS_BY_ROLE: Record<FactionRole, FactionPermissions> = {
  leader: {
    canInvite: true,
    canAcceptRequests: true,
    canManageTreasury: true,
    canManageInvestments: true,
    canManageDiplomacy: true,
    canStartEvents: true,
  },
  subleader: {
    canInvite: true,
    canAcceptRequests: true,
    canManageTreasury: true,
    canManageInvestments: true,
    canManageDiplomacy: true,
    canStartEvents: true,
  },
  recruiter: {
    canInvite: true,
    canAcceptRequests: true,
    canManageTreasury: false,
    canManageInvestments: false,
    canManageDiplomacy: false,
    canStartEvents: false,
  },
  treasurer: {
    canInvite: false,
    canAcceptRequests: false,
    canManageTreasury: true,
    canManageInvestments: true,
    canManageDiplomacy: false,
    canStartEvents: false,
  },
  diplomat: {
    canInvite: false,
    canAcceptRequests: false,
    canManageTreasury: false,
    canManageInvestments: false,
    canManageDiplomacy: true,
    canStartEvents: false,
  },
  member: {
    canInvite: false,
    canAcceptRequests: false,
    canManageTreasury: false,
    canManageInvestments: false,
    canManageDiplomacy: false,
    canStartEvents: false,
  },
};

export const DEFAULT_FACTION_INVESTMENTS: FactionInvestments = {
  arsenalColetivo: 0,
  caixaOperacional: 0,
  mobilidade: 0,
  influencia: 0,
  inteligencia: 0,
  fortificacao: 0,
  logistica: 0,
  doutrina: 0,
};

export const DEFAULT_FACTION_INVESTMENT_BUFFS: FactionInvestmentBuffs = {
  attackPercent: 0,
  defensePercent: 0,
  hpPercent: 0,
  dirtyMoneyGainPercent: 0,
  cleanMoneyGainPercent: 0,
  agilityPercent: 0,
  intelligencePercent: 0,
  respectPercent: 0,
  baseDefensePercent: 0,
  donationEfficiencyPercent: 0,
  buffDurationPercent: 0,
};

export const FACTION_BRANCH_LABELS: Record<FactionInvestmentBranch, string> = {
  arsenalColetivo: 'Arsenal Coletivo',
  caixaOperacional: 'Caixa Operacional',
  mobilidade: 'Mobilidade',
  influencia: 'Influência',
  inteligencia: 'Inteligência',
  fortificacao: 'Fortificação',
  logistica: 'Logística',
  doutrina: 'Doutrina',
};

export const FACTION_BRANCH_DESCRIPTIONS: Record<FactionInvestmentBranch, string> = {
  arsenalColetivo: 'Aumenta ataque, defesa, HP e power coletivo.',
  caixaOperacional: 'Melhora ganhos sujos, limpos e eficiência de lavagem.',
  mobilidade: 'Melhora agilidade, fuga e tempo de resposta.',
  influencia: 'Melhora respeito, intimidação e recrutamento.',
  inteligencia: 'Melhora inteligência, leitura de inimigo e previsibilidade.',
  fortificacao: 'Aumenta defesa base da facção e resistência a invasões.',
  logistica: 'Aumenta eficiência de doações e duração de buffs.',
  doutrina: 'Concede bônus percentuais globais para toda a facção.',
};