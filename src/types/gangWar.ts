export type GangMemberType =
  | 'capanga'
  | 'frente'
  | 'executor'
  | 'assassino'
  | 'muralha'
  | 'certeiro'
  | 'motorista'
  | 'nitro'
  | 'armeiro'
  | 'informante'
  | 'wifi'
  | 'medico'
  | 'lavador'
  | 'ladrao'
  | 'negociador';

export type GangMemberStatus =
  | 'ativo'
  | 'ferido'
  | 'morto'
  | 'treinando';

export type GangCoreStats = {
  rajada: number;
  blindagem: number;
  folego: number;
  quebra: number;
};

export type GangMemberDefinition = {
  type: GangMemberType;
  label: string;
  description: string;
  role: 'linha_de_frente' | 'tatico' | 'suporte' | 'economico';
  recruitBaseCostDirtyMoney: number;
  trainingBaseCostDirtyMoney: number;
  maintenanceBaseCostDirtyMoney: number;
  trainingBaseHours: number;
  casualtyWeight: number;
  battlePriority: number;
  baseStats: GangCoreStats;
  special: {
    medicalPower?: number;
    economyPower?: number;
    lootPower?: number;
    intelPower?: number;
    mobilityPower?: number;
    weaponPower?: number;
    coordinationPower?: number;
    negotiationPower?: number;
  };
};

export type GangUnit = {
  id: string;
  type: GangMemberType;
  level: number; // 1..10
  status: GangMemberStatus;
  recruitedAt: string;
  trainingEndsAt: string | null;
  injuryEndsAt: string | null;
  lastBattleAt?: string | null;
};

export type GangTrainingJob = {
  id: string;
  memberId: string;
  memberType: GangMemberType;
  fromLevel: number;
  toLevel: number;
  costDirtyMoney: number;
  startedAt: string;
  endsAt: string;
  completed: boolean;
};

export type GangCTState = {
  level: number;
  maxLevel: number;
  trainingSlots: number;
  recoveryBonusPercent: number;
  trainingSpeedBonusPercent: number;
  gangCapacityBonus: number;
};

export type GangBattleMemberStats = GangCoreStats & {
  effectivePower: number;
};

export type GangBattleCompositionStats = {
  totalMembers: number;
  ativos: number;
  feridos: number;
  mortos: number;

  rajada: number;
  blindagem: number;
  folego: number;
  quebra: number;

  medicalPower: number;
  economyPower: number;
  lootPower: number;
  intelPower: number;
  mobilityPower: number;
  weaponPower: number;
  coordinationPower: number;
  negotiationPower: number;

  totalPower: number;
};

export type GangBattleLossesByType = Record<GangMemberType, number>;

export type GangBattleCasualtyResult = {
  mortos: GangBattleLossesByType;
  feridos: GangBattleLossesByType;
  preservadosPeloMedico: number;
};

export type GangBattleResolution = {
  attackerStats: GangBattleCompositionStats;
  defenderStats: GangBattleCompositionStats;
  attackerLosses: GangBattleCasualtyResult;
  defenderLosses: GangBattleCasualtyResult;
};

export type GangDailyUpkeep = {
  totalDirtyMoneyCost: number;
  byType: Record<GangMemberType, number>;
};

export type GangStateSnapshot = {
  members: GangUnit[];
  ct: GangCTState;
  maxMembers: number;
  dailyUpkeep: GangDailyUpkeep;
};