export type MemberClass =
  | 'Assassino'
  | 'Ladrão'
  | 'Lavador'
  | 'Motorista'
  | 'Armeiro'
  | 'Informante'
  | 'Capanga'
  | 'Médico'
  | 'Executor'
  | 'Negociador';

export type Rarity = 'Comum' | 'Raro' | 'Épico' | 'Lendário' | 'Mítico';
export type RecruitMethod = 'mission' | 'market' | 'premium';
export type GangUpgradeId = 'training' | 'hideout' | 'blackmarket';

export interface MemberSkill {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  effect: string;
}

export interface GangMember {
  id: string;
  name: string;
  class: MemberClass;
  rarity: Rarity;
  level: number;
  exp: number;
  expToNext: number;
  loyalty: number;
  skills: MemberSkill[];
  equipment: {
    weaponId?: string;
    armorId?: string;
    vehicleId?: string;
  };
  active: boolean;
  recruitedAt: string;
  lastMissionAt?: string;
  victories: number;
  defeats: number;
}

export interface GangTreasury {
  dirtyMoney: number;
  cleanMoney: number;
  corre: number;
}

export interface GangUpgrades {
  trainingGroundsLevel: number;
  hideoutLevel: number;
  blackMarketLevel: number;
}

export interface Gang {
  id: string;
  name: string;
  tag: string;
  level: number;
  exp: number;
  expToNext: number;
  slots: number;
  treasury: GangTreasury;
  members: GangMember[];
  activeMemberIds: string[];
  upgrades: GangUpgrades;
  createdAt: string;
  totalVictories: number;
}

export interface RecruitOptions {
  method: RecruitMethod;
  cost?: number;
  costType?: 'dirty' | 'clean' | 'corre';
}

export interface GangDoctrineBonus {
  trainingBonusPercent: number;
  defenseBonusPercent: number;
  lootBonusPercent: number;
  rarityBonusPercent: number;
}

export interface GangBattleSnapshot {
  activeMembers: GangMember[];
  reserveMembers: GangMember[];
  rawPower: number;
  totalPower: number;
  attackPower: number;
  defensePower: number;
  lootPower: number;
}