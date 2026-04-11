export type PlayerSkillKey =
  | 'attack'
  | 'defense'
  | 'intelligence'
  | 'agility'
  | 'respect'
  | 'vigor';

export interface PlayerSkills {
  attack: number;
  defense: number;
  intelligence: number;
  agility: number;
  respect: number;
  vigor: number;
}

export type PlayerInvestmentKey =
  | 'war'
  | 'laundering'
  | 'fuga'
  | 'luxury'
  | 'comando';

export interface PlayerInvestments {
  war: number;
  laundering: number;
  fuga: number;
  luxury: number;
  comando: number;
}

export type GangMemberRole =
  | 'frente'
  | 'muralha'
  | 'nitro'
  | 'certeiro'
  | 'wifi';

export interface GangMember {
  role: GangMemberRole;
  nickname: string;
  level: number;
}

export interface GangMembers {
  frente: GangMember;
  muralha: GangMember;
  nitro: GangMember;
  certeiro: GangMember;
  wifi: GangMember;
}

export interface GangComputedBonuses {
  attackPercent: number;
  invasionPercent: number;
  lootPercent: number;

  defensePercent: number;
  lifePercent: number;
  lossReductionPercent: number;

  escapePercent: number;
  mobilityPercent: number;
  cooldownReductionPercent: number;

  critPercent: number;
  damagePercent: number;
  accuracyPercent: number;

  launderingFeeReductionPercent: number;
  bribePercent: number;
  operationRiskReductionPercent: number;
  tacticalPercent: number;
}

export interface PowerSourcesBreakdown {
  barraco: number;
  arsenal: number;
  hierarchy: number;
  luxury: number;
  skills: number;
  investments: number;
  gang: number;
}

export interface PowerCalculationBreakdown {
  totalPower: number;
  sources: PowerSourcesBreakdown;
}

export interface BattleStats {
  totalPower: number;

  attackScore: number;
  defenseScore: number;
  tacticalScore: number;
  mobilityScore: number;
  supportScore: number;

  healthPoints: number;
  criticalChance: number;
  escapeChance: number;
  damageReduction: number;
  lootBonusPercent: number;
  cooldownReductionPercent: number;

  launderingEfficiencyPercent: number;
  bribeEfficiencyPercent: number;
}

export interface PlayerBattleContext {
  playerId: string;
  playerName: string;

  barracoLevel: number;
  arsenalLevel: number;
  hierarchyLevel: number;
  luxuryLevel: number;

  dirtyMoney: number;
  cleanMoney: number;
  corre: number;

  skills: PlayerSkills;
  investments: PlayerInvestments;
  gangMembers: GangMembers;
}

export interface BattleSnapshot {
  playerId: string;
  playerName: string;
  createdAt: number;

  context: PlayerBattleContext;
  gangBonuses: GangComputedBonuses;
  powerBreakdown: PowerCalculationBreakdown;
  battleStats: BattleStats;
}

export interface BattleResolutionInput {
  attacker: BattleSnapshot;
  defender: BattleSnapshot;
}

export interface BattleLosses {
  hpDamage: number;
  correLoss: number;
  dirtyMoneyLoss: number;
}

export interface BattleResolutionResult {
  success: boolean;
  winner: 'attacker' | 'defender';
  winChance: number;

  attackerScore: number;
  defenderScore: number;

  loot: number;

  attackerLosses: BattleLosses;
  defenderLosses: BattleLosses;

  attackerRemainingDirtyMoney: number;
  defenderRemainingDirtyMoney: number;

  report: {
    attacker: BattleStats;
    defender: BattleStats;
    attackerPower: number;
    defenderPower: number;
    attackerGangBonuses: GangComputedBonuses;
    defenderGangBonuses: GangComputedBonuses;
  };
}
