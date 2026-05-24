export type AzideiaTargetType = 'x9' | 'correria';
export type AzideiaRewardType = 'convoy_2x' | 'corre';
export type AzideiaMissionStatus = 'travelling' | 'returning' | 'completed' | 'cancelled';

export type AzideiaRouteTile = { tileX: number; tileY: number };

export type AzideiaX9Target = {
  id: string;
  type: AzideiaTargetType;
  name: string;
  modelUrl: string;
  tileX: number;
  tileY: number;
  costDirtyMoney: number;
  rewardType?: AzideiaRewardType;
  rewardQuantity?: number;
  reserved?: boolean;
};

export type AzideiaMission = {
  missionId: string;
  status: AzideiaMissionStatus;
  targetId: string;
  targetType: AzideiaTargetType;
  targetName: string;
  targetModelUrl: string;
  targetTileX: number;
  targetTileY: number;
  originTileX: number;
  originTileY: number;
  routeTiles: AzideiaRouteTile[];
  returnRouteTiles: AzideiaRouteTile[];
  travelDurationMs: number;
  returnDurationMs: number;
  launchedAtIso: string;
  arriveAtIso: string;
  returnAtIso: string;
  costDirtyMoney: number;
  rewardType: AzideiaRewardType;
  rewardQuantity: number;
};

export type AzideiaTargetsResponse = {
  targets: AzideiaX9Target[];
  x9Targets?: AzideiaX9Target[];
  correriaTargets?: AzideiaX9Target[];
  costDirtyMoney: number;
  correriaCostDirtyMoney?: number;
  dailyKills: number;
  dailyLimit: number;
  remainingToday: number;
  dailyCorreriaNegotiations?: number;
  correriaDailyLimit?: number;
  correriaRemainingToday?: number;
  correriaFactionReceivedToday?: number;
  correriaFactionDailyLimit?: number;
  activeAzideiaConvoys?: number;
  maxParallelAzideiaConvoys?: number;
};

export type AzideiaAttackResult = AzideiaMission & {
  success: boolean;
  phase: 'travelling' | 'returning' | 'completed';
  immediateReward: null | {
    rewardType: AzideiaRewardType;
    quantity: number;
  };
  factionReward?: {
    factionId: string;
    rewardType: AzideiaRewardType;
    quantityPerMember: number;
    memberCount: number;
    batchId?: string;
    cappedMembersCount?: number;
    dailyLimit?: number;
  } | null;
  dailyKills: number;
  dailyLimit: number;
  remainingToday: number;
  dailyCorreriaNegotiations?: number;
  correriaDailyLimit?: number;
  correriaRemainingToday?: number;
  correriaFactionReceivedToday?: number;
  correriaFactionDailyLimit?: number;
  activeAzideiaConvoys?: number;
  maxParallelAzideiaConvoys?: number;
  player?: unknown;
};

export type AzideiaActiveMissionsResponse = {
  missions: AzideiaMission[];
};

export type AzideiaRewardStatus = {
  factionId: string | null;
  available: Partial<Record<AzideiaRewardType, number>>;
  totalAvailable: number;
  batches: Array<{
    id: string;
    rewardType: AzideiaRewardType;
    quantity: number;
    killerName: string;
    createdAt: string;
  }>;
};

export type AzideiaClaimResult = AzideiaRewardStatus & {
  claimed: Partial<Record<AzideiaRewardType, number>>;
  totalClaimed: number;
  player?: unknown;
};
