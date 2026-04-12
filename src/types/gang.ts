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

export type GangSkillKey =
  | 'assalto'
  | 'emboscada'
  | 'resistencia'
  | 'fuga'
  | 'saque'
  | 'disciplina';

export type GangEquipmentType = 'weapon' | 'armor' | 'vehicle';

export interface MemberSkill {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  effect: string;
}

export interface GangMemberEquipment {
  weaponId?: string;
  armorId?: string;
  vehicleId?: string;
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
  equipment: GangMemberEquipment;
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

export interface GangDoctrineLevels {
  assalto: number;
  emboscada: number;
  resistencia: number;
  fuga: number;
  saque: number;
  disciplina: number;
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
  doctrine: GangDoctrineLevels;
  createdAt: string;
  totalVictories: number;
  totalDefeats: number;
}

export interface RecruitOptions {
  method: 'mission' | 'market' | 'premium';
  cost?: number;
  costType?: 'dirty' | 'clean' | 'premium_currency';
  waitTimeSeconds?: number;
}

export type GangBattleStats = {
  totalPower: number;
  avgLevel: number;
  activeCount: number;
  reserveCount: number;
  lootBonusPercent: number;
  attackBonusPercent: number;
  defenseBonusPercent: number;
};

export type GangDoctrineDefinition = {
  key: GangSkillKey;
  name: string;
  description: string;
  baseCost: number;
};

export const GANG_DOCTRINE_DEFINITIONS: GangDoctrineDefinition[] = [
  {
    key: 'assalto',
    name: 'Doutrina de Assalto',
    description: 'Aumenta pressão ofensiva da composição.',
    baseCost: 2500,
  },
  {
    key: 'emboscada',
    name: 'Doutrina de Emboscada',
    description: 'Melhora ataques rápidos e vantagem inicial.',
    baseCost: 3000,
  },
  {
    key: 'resistencia',
    name: 'Doutrina de Resistência',
    description: 'Melhora sustentação da tropa em combate.',
    baseCost: 3200,
  },
  {
    key: 'fuga',
    name: 'Doutrina de Fuga',
    description: 'Aumenta mobilidade e saída tática.',
    baseCost: 2200,
  },
  {
    key: 'saque',
    name: 'Doutrina de Saque',
    description: 'Aumenta eficiência de espólio.',
    baseCost: 2800,
  },
  {
    key: 'disciplina',
    name: 'Doutrina de Disciplina',
    description: 'Reduz perda de lealdade e melhora consistência.',
    baseCost: 2600,
  },
];