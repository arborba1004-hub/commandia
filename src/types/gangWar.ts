export type GangFormationType =
  | 'pressao_total'
  | 'linha_fechada'
  | 'bote_certo'
  | 'cerco'
  | 'saque_rapido';

export type GangMemberType =
  | 'capanga'
  | 'frente'
  | 'executor'
  | 'muralha'
  | 'certeiro'
  | 'motorista'
  | 'nitro'
  | 'armeiro'
  | 'informante'
  | 'wifi'
  | 'medico'
  | 'lavador'
  | 'negociador';

export type GangMemberStatus = 'ativo' | 'ferido' | 'morto' | 'treinando';

export type GangTroopSelection = {
  type: GangMemberType;
  quantity: number;
};

export type GangUnit = {
  id: string;
  type: GangMemberType;
  level: number;
  status: GangMemberStatus;
  recruitedAt: string;
  trainingEndsAt: string | null;
  injuryEndsAt: string | null;
  lastBattleAt?: string | null;
};

export type GangTrainingJob = {
  id: string;
  batchId: string;
  memberType: GangMemberType;
  quantity: number;
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

export type GangBattleCompositionStats = {
  totalMembers: number;
  ativos: number;
  feridos: number;
  mortos: number;
  bondeAtivos: number;
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

export type GangStateSnapshot = {
  members: GangUnit[];
  ct: GangCTState;
  trainingJobs: GangTrainingJob[];
  formation: GangFormationType;
  maxMembers: number;
  gangLevel: number;
  dailyUpkeep: {
    totalDirtyMoneyCost: number;
    byType: Record<GangMemberType, number>;
  };
  trainingConfig: {
    quantityPerOrder: number;
    durationSeconds: number;
    slots: number;
  };
  troopSummary: {
    totalMembers: number;
    activeMembers: number;
    injuredMembers: number;
    deadMembers: number;
    trainingMembers: number;
    byType: Record<GangMemberType, number>;
    activeByType: Record<GangMemberType, number>;
  };
};

export type GangWarApiEnvelope = {
  gang: GangStateSnapshot;
  playerBalances?: {
    dirtyMoney: number;
    cleanMoney: number;
    corre: number;
  };
};
