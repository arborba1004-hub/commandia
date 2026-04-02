
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

export interface MemberSkill {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  effect: string; // descrição do efeito numérico
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

export interface Gang {
  id: string;
  name: string;
  tag: string;
  level: number;
  exp: number;
  expToNext: number;
  slots: number;
  treasury: {
    dirtyMoney: number;
    cleanMoney: number;
    corre: number;
  };
  members: GangMember[];
  activeMemberIds: string[];
  upgrades: {
    trainingGroundsLevel: number;
    hideoutLevel: number;
    blackMarketLevel: number;
  };
  createdAt: string;
  totalVictories: number;
}

export interface RecruitOptions {
  method: 'mission' | 'market' | 'premium';
  cost?: number;
  costType?: 'dirty' | 'clean' | 'premium_currency';
  waitTimeSeconds?: number;
}