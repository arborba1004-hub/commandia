import type {
  GangBattleCasualtyResult,
  GangBattleCompositionStats,
  GangCoreStats,
  GangDailyUpkeep,
  GangFormationType,
  GangMemberType,
  GangStateSnapshot,
  GangTrainingJob,
  GangUnit,
} from '@/types/gangWar';
import {
  GANG_BASE_CAPACITY,
  GANG_MAX_MEMBER_LEVEL,
  BONDE_TYPES,
  getCTStateFromLevel,
  getGangMemberDefinition,
} from '@/services/gangWarDefinitions';

function round(value: number) { return Math.round(value * 100) / 100; }
function levelMultiplier(level: number) { return 1 + (Math.max(1, level) - 1) * 0.18; }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function applyPercent(value: number, percent: number) { return Number((value * (1 + percent / 100)).toFixed(2)); }

const FORMATION_BONUSES: Record<GangFormationType, {
  rajadaPercent: number; blindagemPercent: number; folegoPercent: number;
  quebraPercent: number; lootPercent: number; casualtyReductionPercent: number;
  medicalEfficiencyPercent: number; mobilityPercent: number;
}> = {
  pressao_total: { rajadaPercent: 18,  blindagemPercent: -8,  folegoPercent: -4, quebraPercent: 14, lootPercent: 0,  casualtyReductionPercent: -6, medicalEfficiencyPercent: 0,  mobilityPercent: 6  },
  linha_fechada: { rajadaPercent: -6,  blindagemPercent: 20,  folegoPercent: 10, quebraPercent: -4, lootPercent: 0,  casualtyReductionPercent: 12, medicalEfficiencyPercent: 10, mobilityPercent: -4 },
  bote_certo:    { rajadaPercent: 10,  blindagemPercent: 0,   folegoPercent: 0,  quebraPercent: 10, lootPercent: 8,  casualtyReductionPercent: 0,  medicalEfficiencyPercent: 0,  mobilityPercent: 8  },
  cerco:         { rajadaPercent: 6,   blindagemPercent: 8,   folegoPercent: 6,  quebraPercent: 6,  lootPercent: 0,  casualtyReductionPercent: 6,  medicalEfficiencyPercent: 6,  mobilityPercent: 0  },
  saque_rapido:  { rajadaPercent: 0,   blindagemPercent: -6,  folegoPercent: -2, quebraPercent: 4,  lootPercent: 22, casualtyReductionPercent: -4, medicalEfficiencyPercent: 0,  mobilityPercent: 10 },
};

export function getGangMaxMembers(ctLevel: number, barracoLevel = 1, factionBonus = 0) {
  const ct = getCTStateFromLevel(ctLevel);
  return GANG_BASE_CAPACITY + ct.gangCapacityBonus + Math.floor(Math.max(1, barracoLevel) / 10) + factionBonus;
}

export function getMemberBattleStats(member: GangUnit): GangCoreStats {
  const def = getGangMemberDefinition(member.type);
  const mult = levelMultiplier(member.level);
  return {
    rajada:    round(def.baseStats.rajada    * mult),
    blindagem: round(def.baseStats.blindagem * mult),
    folego:    round(def.baseStats.folego    * mult),
    quebra:    round(def.baseStats.quebra    * mult),
  };
}

export function getMemberRecruitCost(type: GangMemberType) {
  return getGangMemberDefinition(type).recruitBaseCostDirtyMoney;
}

export function getMemberTrainingCost(type: GangMemberType, currentLevel: number) {
  const def = getGangMemberDefinition(type);
  return Math.round(def.trainingBaseCostDirtyMoney * (1 + (clamp(currentLevel, 1, GANG_MAX_MEMBER_LEVEL) - 1) * 0.25));
}

export function getMemberTrainingHours(type: GangMemberType, currentLevel: number, ctLevel: number) {
  const def = getGangMemberDefinition(type);
  const ct  = getCTStateFromLevel(ctLevel);
  const raw = def.trainingBaseHours * (1 + (Math.max(1, currentLevel) - 1) * 0.15);
  return Math.max(1, Math.ceil(raw * (1 - ct.trainingSpeedBonusPercent / 100)));
}

export function getGangDailyUpkeep(members: GangUnit[]): GangDailyUpkeep {
  const byType: Record<GangMemberType, number> = {
    capanga: 0, frente: 0, executor: 0, assassino: 0, muralha: 0,
    certeiro: 0, motorista: 0, nitro: 0, armeiro: 0, informante: 0,
    wifi: 0, medico: 0, lavador: 0, ladrao: 0, negociador: 0,
  };
  let totalDirtyMoneyCost = 0;
  for (const m of members) {
    if (m.status === 'morto') continue;
    const def  = getGangMemberDefinition(m.type);
    const cost = Math.round(def.maintenanceBaseCostDirtyMoney * levelMultiplier(m.level));
    byType[m.type] += cost;
    totalDirtyMoneyCost += cost;
  }
  return { totalDirtyMoneyCost, byType };
}

export function buildGangBattleCompositionStats(members: GangUnit[]): GangBattleCompositionStats {
  const active  = members.filter((m) => m.status === 'ativo');
  const feridos = members.filter((m) => m.status === 'ferido').length;
  const mortos  = members.filter((m) => m.status === 'morto').length;

  let rajada = 0, blindagem = 0, folego = 0, quebra = 0;
  let medicalPower = 0, economyPower = 0, lootPower = 0, intelPower = 0;
  let mobilityPower = 0, weaponPower = 0, coordinationPower = 0, negotiationPower = 0;
  let bondeAtivos = 0;

  for (const m of active) {
    const stats = getMemberBattleStats(m);
    const def   = getGangMemberDefinition(m.type);
    const mult  = levelMultiplier(m.level);

    rajada    += stats.rajada;
    blindagem += stats.blindagem;
    folego    += stats.folego;
    quebra    += stats.quebra;

    medicalPower      += (def.special.medicalPower      || 0) * mult;
    economyPower      += (def.special.economyPower      || 0) * mult;
    lootPower         += (def.special.lootPower         || 0) * mult;
    intelPower        += (def.special.intelPower        || 0) * mult;
    mobilityPower     += (def.special.mobilityPower     || 0) * mult;
    weaponPower       += (def.special.weaponPower       || 0) * mult;
    coordinationPower += (def.special.coordinationPower || 0) * mult;
    negotiationPower  += (def.special.negotiationPower  || 0) * mult;

    if (BONDE_TYPES.includes(m.type)) bondeAtivos++;
  }

  const totalPower =
    rajada * 1.15 + blindagem * 1.05 + folego * 0.95 + quebra * 1.20 +
    intelPower * 0.35 + mobilityPower * 0.30 + weaponPower * 0.40 + coordinationPower * 0.25;

  return {
    totalMembers: members.length, ativos: active.length, feridos, mortos,
    rajada: round(rajada), blindagem: round(blindagem), folego: round(folego), quebra: round(quebra),
    medicalPower: round(medicalPower), economyPower: round(economyPower),
    lootPower: round(lootPower), intelPower: round(intelPower),
    mobilityPower: round(mobilityPower), weaponPower: round(weaponPower),
    coordinationPower: round(coordinationPower), negotiationPower: round(negotiationPower),
    bondeAtivos, totalPower: round(totalPower),
  };
}

export function applyFormationToGangStats(stats: GangBattleCompositionStats, formation: GangFormationType): GangBattleCompositionStats {
  const bonus = FORMATION_BONUSES[formation] || FORMATION_BONUSES.pressao_total;
  const next: GangBattleCompositionStats = {
    ...stats,
    rajada:        applyPercent(stats.rajada,        bonus.rajadaPercent),
    blindagem:     applyPercent(stats.blindagem,     bonus.blindagemPercent),
    folego:        applyPercent(stats.folego,        bonus.folegoPercent),
    quebra:        applyPercent(stats.quebra,        bonus.quebraPercent),
    lootPower:     applyPercent(stats.lootPower,     bonus.lootPercent),
    mobilityPower: applyPercent(stats.mobilityPower, bonus.mobilityPercent),
    medicalPower:  applyPercent(stats.medicalPower,  bonus.medicalEfficiencyPercent),
    totalPower:    0,
  };
  next.totalPower = round(
    next.rajada * 1.15 + next.blindagem * 1.05 + next.folego * 0.95 + next.quebra * 1.20 +
    next.intelPower * 0.35 + next.mobilityPower * 0.30 + next.weaponPower * 0.40 + next.coordinationPower * 0.25
  );
  return next;
}

export function buildGangBattleStatsWithFormation(members: GangUnit[], formation: GangFormationType): GangBattleCompositionStats {
  return applyFormationToGangStats(buildGangBattleCompositionStats(members), formation);
}

function emptyLossRecord(): Record<GangMemberType, number> {
  return { capanga: 0, frente: 0, executor: 0, assassino: 0, muralha: 0,
    certeiro: 0, motorista: 0, nitro: 0, armeiro: 0, informante: 0,
    wifi: 0, medico: 0, lavador: 0, ladrao: 0, negociador: 0 };
}

export function resolveGangCasualties(params: {
  members: GangUnit[]; ownStats: GangBattleCompositionStats; enemyStats: GangBattleCompositionStats;
  ctLevel: number; side: 'attacker' | 'defender'; ownFormation?: GangFormationType;
}): GangBattleCasualtyResult {
  const ativos = params.members.filter((m) => m.status === 'ativo');
  const mortos = emptyLossRecord();
  const feridos = emptyLossRecord();
  if (!ativos.length) return { mortos, feridos, preservadosPeloMedico: 0 };

  const ct       = getCTStateFromLevel(params.ctLevel);
  const formBonus = FORMATION_BONUSES[params.ownFormation || 'pressao_total'];

  const bondePressure   = (params.enemyStats.bondeAtivos || 0) * 1.8;
  const frontalPressure = params.enemyStats.rajada * 1.05 + params.enemyStats.quebra * 1.1;
  const totalPressure   = frontalPressure + bondePressure * 0.4;
  const ownProtection   = params.ownStats.blindagem * 0.9 + params.ownStats.folego * 0.85;

  let rawLossRate = clamp(
    (totalPressure - ownProtection * 0.55) / Math.max(params.ownStats.totalPower, 1),
    0.04, 0.65
  );
  rawLossRate = clamp(rawLossRate * (1 - formBonus.casualtyReductionPercent / 100), 0.04, 0.65);

  const sideModifier  = params.side === 'attacker' ? 1.08 : 0.94;
  const casualtyCount = Math.min(ativos.length, Math.max(1, Math.round(ativos.length * rawLossRate * sideModifier)));

  const sorted = [...ativos].sort((a, b) =>
    getGangMemberDefinition(b.type).casualtyWeight - getGangMemberDefinition(a.type).casualtyWeight
  );

  const medSave = clamp(0.18 + params.ownStats.medicalPower * 0.0025 + ct.recoveryBonusPercent * 0.003, 0.18, 0.9);
  let preservadosPeloMedico = 0;

  for (let i = 0; i < casualtyCount; i++) {
    const target = sorted[i % sorted.length];
    if (Math.random() < medSave) {
      feridos[target.type]++;
      preservadosPeloMedico++;
    } else {
      const deathChance = clamp(
        0.52 - params.ownStats.folego * 0.0009 - params.ownStats.blindagem * 0.0007 - params.ownStats.medicalPower * 0.0012,
        0.12, 0.72
      );
      if (Math.random() < deathChance) mortos[target.type]++;
      else feridos[target.type]++;
    }
  }

  return { mortos, feridos, preservadosPeloMedico };
}

export function buildGangSnapshot(params: {
  members: GangUnit[]; ctLevel: number; trainingJobs: GangTrainingJob[];
  formation?: GangFormationType; barracoLevel?: number; factionBonusCapacity?: number;
}): GangStateSnapshot {
  const ct = getCTStateFromLevel(params.ctLevel);
  return {
    members: params.members, ct, trainingJobs: params.trainingJobs,
    formation: params.formation || 'pressao_total',
    maxMembers: getGangMaxMembers(params.ctLevel, params.barracoLevel, params.factionBonusCapacity),
    dailyUpkeep: getGangDailyUpkeep(params.members),
  };
}

export function buildTrainingJob(params: { member: GangUnit; ctLevel: number; nowIso?: string }): GangTrainingJob {
  const now = params.nowIso ? new Date(params.nowIso) : new Date();
  const fromLevel = params.member.level;
  const toLevel   = clamp(fromLevel + 1, 1, GANG_MAX_MEMBER_LEVEL);
  const hours     = getMemberTrainingHours(params.member.type, fromLevel, params.ctLevel);
  return {
    id: `gang_training_${params.member.id}_${Date.now()}`,
    memberId: params.member.id, memberType: params.member.type,
    fromLevel, toLevel,
    costDirtyMoney: getMemberTrainingCost(params.member.type, fromLevel),
    startedAt: now.toISOString(),
    endsAt: new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString(),
    completed: false,
  };
}
