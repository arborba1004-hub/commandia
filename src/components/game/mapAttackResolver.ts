import type {
  GangBattleCasualtyResult,
  GangBattleCompositionStats,
} from '@/types/gangWar';
import { resolveGangCasualties } from '@/services/gangWarCalculationService';

type LuxuryItemLike = {
  id: string;
  name?: string;
  baseValue?: number;
  insured?: boolean;
  broken?: boolean;
  equipped?: boolean;
  prestigeBonus?: number;
  protectionBonus?: number;
  attackBonus?: number;
};

type AttackInput = {
  attacker: {
    attack: number;
    agility: number;
    weaponBonus?: number;
    prestige?: number;
    corre?: number;
    level?: number;
    gangMembers?: any[];
    gangStats?: GangBattleCompositionStats;
    ctLevel?: number;
  };
  defender: {
    defense: number;
    resistance: number;
    protectionBonus?: number;
    prestige?: number;
    corre?: number;
    level?: number;
    luxuryItems?: LuxuryItemLike[];
    gangMembers?: any[];
    gangStats?: GangBattleCompositionStats;
    ctLevel?: number;
  };
  targetDirtyMoney?: number;
};

export type SpoilsResult = {
  dirtyMoneyLoot: number;
  correLoot: number;
  prestigeLoot: number;
  brokenLuxuryItemId?: string | null;
  brokenLuxuryItemName?: string | null;
  brokenLuxuryItemValue?: number | null;
  luxuryConvertedDirtyMoney: number;
};

export type AttackResult = {
  success: boolean;
  loot: number;
  chance: number;
  attackerPower: number;
  defenderPower: number;
  message: string;
  critical: boolean;
  spoils: SpoilsResult;
  attackerGangLosses: GangBattleCasualtyResult;
  defenderGangLosses: GangBattleCasualtyResult;
  attackerGangStats: GangBattleCompositionStats;
  defenderGangStats: GangBattleCompositionStats;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function getLootCapByLevel(level = 1) {
  if (level <= 9) return 20000;
  if (level <= 19) return 50000;
  if (level <= 29) return 120000;
  if (level <= 39) return 300000;
  if (level <= 49) return 700000;
  if (level <= 59) return 1500000;
  if (level <= 69) return 3000000;
  if (level <= 79) return 6000000;
  if (level <= 89) return 10000000;
  return 20000000;
}

function pickBreakableLuxuryItem(items: LuxuryItemLike[] = []) {
  const candidates = items.filter((item) => !item.insured && !item.broken);
  if (!candidates.length) return null;

  const weighted: LuxuryItemLike[] = [];
  candidates.forEach((item) => {
    const weight = Math.max(1, Math.floor((item.baseValue || 1000) / 100000));
    for (let i = 0; i < weight; i += 1) {
      weighted.push(item);
    }
  });

  return weighted[Math.floor(Math.random() * weighted.length)] || candidates[0];
}

function buildEmptyGangLosses(): GangBattleCasualtyResult {
  return {
    mortos: {
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
    },
    feridos: {
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
    },
    preservadosPeloMedico: 0,
  };
}

function buildEmptyGangStats(): GangBattleCompositionStats {
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

export function resolveMapAttack({
  attacker,
  defender,
  targetDirtyMoney = 0,
}: AttackInput): AttackResult {
  const attackerGangStats = attacker.gangStats || buildEmptyGangStats();
  const defenderGangStats = defender.gangStats || buildEmptyGangStats();

  const attackerPersonalPower =
    attacker.attack +
    attacker.agility * 0.5 +
    (attacker.weaponBonus || 0) +
    (attacker.prestige || 0) * 0.1;

  const defenderPersonalPower =
    defender.defense +
    defender.resistance * 0.7 +
    (defender.protectionBonus || 0) +
    (defender.prestige || 0) * 0.08;

  const attackerGangPower =
    attackerGangStats.rajada * 1.15 +
    attackerGangStats.quebra * 1.2 +
    attackerGangStats.weaponPower * 0.4 +
    attackerGangStats.intelPower * 0.25 +
    attackerGangStats.mobilityPower * 0.2 +
    attackerGangStats.coordinationPower * 0.18;

  const defenderGangPower =
    defenderGangStats.blindagem * 1.2 +
    defenderGangStats.folego * 1.05 +
    defenderGangStats.intelPower * 0.22 +
    defenderGangStats.coordinationPower * 0.18 +
    defenderGangStats.medicalPower * 0.12;

  const attackPower = attackerPersonalPower + attackerGangPower;
  const defensePower = defenderPersonalPower + defenderGangPower;

  const rawChance = attackPower / Math.max(1, attackPower + defensePower);
  const chance = clamp(rawChance, 0.3, 0.9);

  const roll = Math.random();
  const success = roll <= chance;
  const critical = success && Math.random() < 0.15;

  let message = '';
  let dirtyMoneyLoot = 0;
  let correLoot = 0;
  let prestigeLoot = 0;
  let luxuryConvertedDirtyMoney = 0;
  let brokenLuxuryItemId: string | null = null;
  let brokenLuxuryItemName: string | null = null;
  let brokenLuxuryItemValue: number | null = null;

  if (success) {
    const exposedDirty = targetDirtyMoney * 0.4;
    const lootPercent = critical
      ? randomBetween(0.2, 0.25)
      : randomBetween(0.1, 0.15);

    const cap = getLootCapByLevel(attacker.level || 1);

    const gangLootFactor = (attackerGangStats.lootPower || 0) * 0.0035;
    const defenseReductionFactor =
      (defender.protectionBonus || 0) * 0.002 +
      (defenderGangStats.blindagem || 0) * 0.0008;

    dirtyMoneyLoot = Math.floor(
      Math.min(
        exposedDirty * Math.max(0.05, lootPercent + gangLootFactor - defenseReductionFactor),
        cap
      )
    );

    correLoot = critical
      ? Math.floor(randomBetween(3, 5))
      : Math.floor(randomBetween(1, 3));

    prestigeLoot = critical ? 25 : 10;

    const luxuryBreakChance =
      (critical ? 0.25 : 0.1) + (attackerGangStats.quebra || 0) * 0.0005;

    if (Math.random() <= luxuryBreakChance) {
      const brokenItem = pickBreakableLuxuryItem(defender.luxuryItems || []);
      if (brokenItem) {
        brokenLuxuryItemId = brokenItem.id;
        brokenLuxuryItemName = brokenItem.name || 'Item de luxo';
        brokenLuxuryItemValue = brokenItem.baseValue || 0;
        luxuryConvertedDirtyMoney = Math.floor(
          (brokenItem.baseValue || 0) * (critical ? 0.55 : 0.4)
        );
      }
    }

    message = critical
      ? 'ATAQUE CRÍTICO. O alvo foi esmagado.'
      : 'Ataque bem-sucedido. Território enfraquecido.';
  } else {
    message = 'Sua investida falhou. A defesa resistiu.';
  }

  const attackerGangLosses =
    attacker.gangMembers && attacker.gangMembers.length > 0
      ? resolveGangCasualties({
          members: attacker.gangMembers,
          ownStats: attackerGangStats,
          enemyStats: defenderGangStats,
          ctLevel: Number(attacker.ctLevel || 1),
          side: 'attacker',
        })
      : buildEmptyGangLosses();

  const defenderGangLosses =
    defender.gangMembers && defender.gangMembers.length > 0
      ? resolveGangCasualties({
          members: defender.gangMembers,
          ownStats: defenderGangStats,
          enemyStats: attackerGangStats,
          ctLevel: Number(defender.ctLevel || 1),
          side: 'defender',
        })
      : buildEmptyGangLosses();

  return {
    success,
    critical,
    loot: dirtyMoneyLoot + luxuryConvertedDirtyMoney,
    chance,
    attackerPower: Math.floor(attackPower),
    defenderPower: Math.floor(defensePower),
    message,
    spoils: {
      dirtyMoneyLoot,
      correLoot,
      prestigeLoot,
      brokenLuxuryItemId,
      brokenLuxuryItemName,
      brokenLuxuryItemValue,
      luxuryConvertedDirtyMoney,
    },
    attackerGangLosses,
    defenderGangLosses,
    attackerGangStats,
    defenderGangStats,
  };
}