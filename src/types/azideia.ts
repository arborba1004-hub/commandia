export type AzideiaTargetType = 'x9';
export type AzideiaRewardType = 'convoy_2x';

export type AzideiaX9Target = {
  id: string;
  type: AzideiaTargetType;
  name: string;
  modelUrl: string;
  tileX: number;
  tileY: number;
  costDirtyMoney: number;
};

export type AzideiaTargetsResponse = {
  targets: AzideiaX9Target[];
  costDirtyMoney: number;
  dailyKills: number;
  dailyLimit: number;
  remainingToday: number;
};

export type AzideiaAttackResult = {
  success: boolean;
  targetId: string;
  targetType: AzideiaTargetType;
  costDirtyMoney: number;
  immediateReward: {
    rewardType: AzideiaRewardType;
    quantity: number;
  };
  factionReward?: {
    factionId: string;
    rewardType: AzideiaRewardType;
    quantityPerMember: number;
    memberCount: number;
    batchId: string;
  } | null;
  routeTiles: Array<{ tileX: number; tileY: number }>;
  travelDurationMs: number;
  dailyKills: number;
  dailyLimit: number;
  remainingToday: number;
  player?: unknown;
};

export type AzideiaRewardStatus = {
  factionId: string | null;
  available: Record<AzideiaRewardType, number>;
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
  claimed: Record<AzideiaRewardType, number>;
  totalClaimed: number;
  player?: unknown;
};
