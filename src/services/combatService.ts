import type { GangBattleCompositionStats } from '@/types/gangWar';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getSafeSkills(entity: any) {
  return {
    attack: Number(entity?.skills?.attack || 0),
    defense: Number(entity?.skills?.defense || 0),
    intelligence: Number(entity?.skills?.intelligence || 0),
    agility: Number(entity?.skills?.agility || 0),
    respect: Number(entity?.skills?.respect || 0),
    vigor: Number(entity?.skills?.vigor || 0),
  };
}

function getEmptyGangStats(): GangBattleCompositionStats {
  return {
    totalMembers: 0,
    ativos: 0,
    feridos: 0,
    mortos: 0,
    rajada: 0,
    blindagem: 0,
    folego: 0,
    quebra: 0,
    medicalPower: 0,
    economyPower: 0,
    lootPower: 0,
    intelPower: 0,
    mobilityPower: 0,
    weaponPower: 0,
    coordinationPower: 0,
    negotiationPower: 0,
    totalPower: 0,
  };
}

export function calculateCombat(
  attacker: any,
  defender: any,
  options?: {
    attackerGangStats?: GangBattleCompositionStats;
    defenderGangStats?: GangBattleCompositionStats;
  }
) {
  const atk = getSafeSkills(attacker);
  const def = getSafeSkills(defender);

  const attackerGang = options?.attackerGangStats || getEmptyGangStats();
  const defenderGang = options?.defenderGangStats || getEmptyGangStats();

  const attackerSkillOffense =
    atk.attack * 1.5 +
    atk.agility * 1.1 +
    atk.intelligence * 1.0 +
    atk.respect * 0.6;

  const defenderSkillDefense =
    def.defense * 1.5 +
    def.vigor * 1.2 +
    def.intelligence * 0.8 +
    def.respect * 0.7;

  const attackerGangOffense =
    attackerGang.rajada * 1.15 +
    attackerGang.quebra * 1.2 +
    attackerGang.weaponPower * 0.4 +
    attackerGang.intelPower * 0.25 +
    attackerGang.mobilityPower * 0.2 +
    attackerGang.coordinationPower * 0.18 +
    attackerGang.totalPower * 0.35;

  const defenderGangDefense =
    defenderGang.blindagem * 1.2 +
    defenderGang.folego * 1.05 +
    defenderGang.intelPower * 0.2 +
    defenderGang.coordinationPower * 0.15 +
    defenderGang.medicalPower * 0.12 +
    defenderGang.totalPower * 0.35;

  const atkRand = 0.9 + Math.random() * 0.2;
  const defRand = 0.9 + Math.random() * 0.2;

  const finalAtk = (attackerSkillOffense + attackerGangOffense) * atkRand;
  const finalDef = (defenderSkillDefense + defenderGangDefense) * defRand;

  let winChance = finalAtk / Math.max(1, finalAtk + finalDef);
  winChance = clamp(winChance, 0.1, 0.9);

  const didWin = Math.random() < winChance;

  return {
    winChance,
    didWin,
    finalAtk,
    finalDef,
    attackerBreakdown: {
      skills: attackerSkillOffense,
      gang: attackerGangOffense,
      totalGangPower: attackerGang.totalPower,
    },
    defenderBreakdown: {
      skills: defenderSkillDefense,
      gang: defenderGangDefense,
      totalGangPower: defenderGang.totalPower,
    },
  };
}