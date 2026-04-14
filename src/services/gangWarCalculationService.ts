import type {
  GangBattleCasualtyResult,
  GangBattleCompositionStats,
  GangCoreStats,
  GangDailyUpkeep,
  GangMemberType,
  GangStateSnapshot,
  GangTrainingJob,
  GangUnit,
} from '@/types/gangWar';
import {
  GANG_BASE_CAPACITY,
  GANG_MAX_MEMBER_LEVEL,
  getCTStateFromLevel,
  getGangMemberDefinition,
} from '@/services/gangWarDefinitions';

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function levelMultiplier(level: number) {
  return 1 + (Math.max(1, level) - 1) * 0.18;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function getGangMaxMembers(ctLevel: number, barracoLevel = 1, factionBonus = 0) {
  const ct = getCTStateFromLevel(ctLevel);
  const barracoBonus = Math.floor(Math.max(1, barracoLevel) / 10);
  return GANG_BASE_CAPACITY + ct.gangCapacityBonus + barracoBonus + factionBonus;
}

export function getMemberBattleStats(member: GangUnit): GangCoreStats {
  const def = getGangMemberDefinition(member.type);
  const mult = levelMultiplier(member.level);

  return {
    rajada: round(def.baseStats.rajada * mult),
    blindagem: round(def.baseStats.blindagem * mult),
    folego: round(def.baseStats.folego * mult),
    quebra: round(def.baseStats.quebra * mult),
  };
}

export function getMemberRecruitCost(type: GangMemberType) {
  return getGangMemberDefinition(type).recruitBaseCostDirtyMoney;
}

export function getMemberTrainingCost(type: GangMemberType, currentLevel: number) {
  const def = getGangMemberDefinition(type);
  const safeLevel = clamp(currentLevel, 1, GANG_MAX_MEMBER_LEVEL);
  return Math.round(def.trainingBaseCostDirtyMoney * (1 + (safeLevel - 1) * 0.25));
}

export function getMemberTrainingHours(type: GangMemberType, currentLevel: number, ctLevel: number) {
  const def = getGangMemberDefinition(type);
  const ct = getCTStateFromLevel(ctLevel);
  const rawHours =
    def.trainingBaseHours * (1 + (Math.max(1, currentLevel) - 1) * 0.15);
  const reduced = rawHours * (1 - ct.trainingSpeedBonusPercent / 100);
  return Math.max(1, Math.ceil(reduced));
}

export function getGangDailyUpkeep(members: GangUnit[]): GangDailyUpkeep {
  const byType = {
    capanga: 0,
    frente: 0,
    executor: 0,
    assassino: 0,
    muralha: 0,
    certeiro: 0,
    motorista: 0,
    nitro: 0,
    armeiro: 0,
    informante: 0,
    wifi: 0,
    medico: 0,
    lavador: 0,
    ladrao: 0,
    negociador: 0,
  };

  let totalDirtyMoneyCost = 0;

  for (const member of members) {
    if (member.status === 'morto') continue;

    const def = getGangMemberDefinition(member.type);
    const cost = Math.round(
      def.maintenanceBaseCostDirtyMoney * levelMultiplier(member.level)
    );

    byType[member.type] += cost;
    totalDirtyMoneyCost += cost;
  }

  return {
    totalDirtyMoneyCost,
    byType,
  };
}

export function buildGangSnapshot(params: {
  members: GangUnit[];
  ctLevel: number;
  barracoLevel?: number;
  factionBonusCapacity?: number;
}): GangStateSnapshot {
  const ct = getCTStateFromLevel(params.ctLevel);

  return {
    members: params.members,
    ct,
    maxMembers: getGangMaxMembers(
      params.ctLevel,
      params.barracoLevel,
      params.factionBonusCapacity
    ),
    dailyUpkeep: getGangDailyUpkeep(params.members),
  };
}

export function buildGangBattleCompositionStats(members: GangUnit[]): GangBattleCompositionStats {
  const activeMembers = members.filter((m) => m.status === 'ativo');
  const feridos = members.filter((m) => m.status === 'ferido').length;
  const mortos = members.filter((m) => m.status === 'morto').length;

  let rajada = 0;
  let blindagem = 0;
  let folego = 0;
  let quebra = 0;

  let medicalPower = 0;
  let economyPower = 0;
  let lootPower = 0;
  let intelPower = 0;
  let mobilityPower = 0;
  let weaponPower = 0;
  let coordinationPower = 0;
  let negotiationPower = 0;

  for (const member of activeMembers) {
    const stats = getMemberBattleStats(member);
    const def = getGangMemberDefinition(member.type);
    const mult = levelMultiplier(member.level);

    rajada += stats.rajada;
    blindagem += stats.blindagem;
    folego += stats.folego;
    quebra += stats.quebra;

    medicalPower += (def.special.medicalPower || 0) * mult;
    economyPower += (def.special.economyPower || 0) * mult;
    lootPower += (def.special.lootPower || 0) * mult;
    intelPower += (def.special.intelPower || 0) * mult;
    mobilityPower += (def.special.mobilityPower || 0) * mult;
    weaponPower += (def.special.weaponPower || 0) * mult;
    coordinationPower += (def.special.coordinationPower || 0) * mult;
    negotiationPower += (def.special.negotiationPower || 0) * mult;
  }

  const totalPower =
    rajada * 1.15 +
    blindagem * 1.05 +
    folego * 0.95 +
    quebra * 1.2 +
    intelPower * 0.35 +
    mobilityPower * 0.3 +
    weaponPower * 0.4 +
    coordinationPower * 0.25;

  return {
    totalMembers: members.length,
    ativos: activeMembers.length,
    feridos,
    mortos,
    rajada: round(rajada),
    blindagem: round(blindagem),
    folego: round(folego),
    quebra: round(quebra),
    medicalPower: round(medicalPower),
    economyPower: round(economyPower),
    lootPower: round(lootPower),
    intelPower: round(intelPower),
    mobilityPower: round(mobilityPower),
    weaponPower: round(weaponPower),
    coordinationPower: round(coordinationPower),
    negotiationPower: round(negotiationPower),
    totalPower: round(totalPower),
  };
}

function emptyLossRecord(): Record<GangMemberType, number> {
  return {
    capanga: 0,
    frente: 0,
    executor: 0,
    assassino: 0,
    muralha: 0,
    certeiro: 0,
    motorista: 0,
    nitro: 0,
    armeiro: 0,
    informante: 0,
    wifi: 0,
    medico: 0,
    lavador: 0,
    ladrao: 0,
    negociador: 0,
  };
}

export function resolveGangCasualties(params: {
  members: GangUnit[];
  ownStats: GangBattleCompositionStats;
  enemyStats: GangBattleCompositionStats;
  ctLevel: number;
  side: 'attacker' | 'defender';
}): GangBattleCasualtyResult {
  const ativos = params.members.filter((m) => m.status === 'ativo');
  const mortos = emptyLossRecord();
  const feridos = emptyLossRecord();

  if (!ativos.length) {
    return { mortos, feridos, preservadosPeloMedico: 0 };
  }

  const ct = getCTStateFromLevel(params.ctLevel);
  const enemyPressure =
    params.enemyStats.rajada * 1.05 + params.enemyStats.quebra * 1.1;
  const ownProtection =
    params.ownStats.blindagem * 0.9 + params.ownStats.folego * 0.85;

  const rawLossRate = clamp(
    (enemyPressure - ownProtection * 0.55) / Math.max(params.ownStats.totalPower, 1),
    0.04,
    0.65
  );

  const sideModifier = params.side === 'attacker' ? 1.08 : 0.94;
  const casualtyCount = Math.min(
    ativos.length,
    Math.max(1, Math.round(ativos.length * rawLossRate * sideModifier))
  );

  const sortedTargets = [...ativos].sort((a, b) => {
    const aDef = getGangMemberDefinition(a.type);
    const bDef = getGangMemberDefinition(b.type);
    return bDef.casualtyWeight - aDef.casualtyWeight;
  });

  const medicalSaveChance = clamp(
    0.18 +
      params.ownStats.medicalPower * 0.0025 +
      ct.recoveryBonusPercent * 0.003,
    0.18,
    0.9
  );

  let preservadosPeloMedico = 0;

  for (let i = 0; i < casualtyCount; i += 1) {
    const target = sortedTargets[i % sortedTargets.length];
    const saved = Math.random() < medicalSaveChance;

    if (saved) {
      feridos[target.type] += 1;
      preservadosPeloMedico += 1;
    } else {
      const deathChanceBase =
        0.52 -
        params.ownStats.folego * 0.0009 -
        params.ownStats.blindagem * 0.0007 -
        params.ownStats.medicalPower * 0.0012;

      const finalDeathChance = clamp(deathChanceBase, 0.12, 0.72);

      if (Math.random() < finalDeathChance) {
        mortos[target.type] += 1;
      } else {
        feridos[target.type] += 1;
      }
    }
  }

  return {
    mortos,
    feridos,
    preservadosPeloMedico,
  };
}

export function buildTrainingJob(params: {
  member: GangUnit;
  ctLevel: number;
  nowIso?: string;
}): GangTrainingJob {
  const now = params.nowIso ? new Date(params.nowIso) : new Date();
  const fromLevel = params.member.level;
  const toLevel = clamp(fromLevel + 1, 1, GANG_MAX_MEMBER_LEVEL);
  const hours = getMemberTrainingHours(params.member.type, fromLevel, params.ctLevel);
  const endsAt = new Date(now.getTime() + hours * 60 * 60 * 1000);

  return {
    id: `gang_training_${params.member.id}_${Date.now()}`,
    memberId: params.member.id,
    memberType: params.member.type,
    fromLevel,
    toLevel,
    costDirtyMoney: getMemberTrainingCost(params.member.type, fromLevel),
    startedAt: now.toISOString(),
    endsAt: endsAt.toISOString(),
    completed: false,
  };
}