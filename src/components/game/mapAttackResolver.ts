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
  };
  defender: {
    defense: number;
    resistance: number;
    protectionBonus?: number;
    prestige?: number;
    corre?: number;
    level?: number;
    luxuryItems?: LuxuryItemLike[];
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
    for (let i = 0; i < weight; i += 1) weighted.push(item);
  });

  return weighted[Math.floor(Math.random() * weighted.length)] || candidates[0];
}

export function resolveMapAttack({
  attacker,
  defender,
  targetDirtyMoney = 0,
}: AttackInput): AttackResult {
  const attackPower =
    attacker.attack +
    attacker.agility * 0.5 +
    (attacker.weaponBonus || 0) +
    (attacker.prestige || 0) * 0.1;

  const defensePower =
    defender.defense +
    defender.resistance * 0.7 +
    (defender.protectionBonus || 0) +
    (defender.prestige || 0) * 0.08;

  const rawChance = attackPower / (attackPower + defensePower);
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
    dirtyMoneyLoot = Math.floor(Math.min(exposedDirty * lootPercent, cap));

    correLoot = critical ? Math.floor(randomBetween(3, 5)) : Math.floor(randomBetween(1, 3));
    prestigeLoot = critical ? 25 : 10;

    const luxuryBreakChance = critical ? 0.25 : 0.1;
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

    const totalDirty = dirtyMoneyLoot + luxuryConvertedDirtyMoney;

    message = critical
      ? 'ATAQUE CRÍTICO. O alvo foi esmagado.'
      : 'Ataque bem-sucedido. Território enfraquecido.';

    return {
      success: true,
      critical,
      loot: totalDirty,
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
    };
  }

  message = 'Sua investida falhou. A defesa resistiu.';

  return {
    success: false,
    critical: false,
    loot: 0,
    chance,
    attackerPower: Math.floor(attackPower),
    defenderPower: Math.floor(defensePower),
    message,
    spoils: {
      dirtyMoneyLoot: 0,
      correLoot: 0,
      prestigeLoot: 0,
      brokenLuxuryItemId: null,
      brokenLuxuryItemName: null,
      brokenLuxuryItemValue: null,
      luxuryConvertedDirtyMoney: 0,
    },
  };
}