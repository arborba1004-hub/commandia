type AttackInput = {
  attacker: {
    attack: number;
    agility: number;
    weaponBonus?: number;
  };
  defender: {
    defense: number;
    resistance: number;
    protectionBonus?: number;
  };
  targetDirtyMoney?: number;
};

export type AttackResult = {
  success: boolean;
  loot: number;
  chance: number;
  attackerPower: number;
  defenderPower: number;
  message: string;
  critical?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function resolveMapAttack({
  attacker,
  defender,
  targetDirtyMoney = 0,
}: AttackInput): AttackResult {
  const attackPower =
    attacker.attack +
    attacker.agility * 0.5 +
    (attacker.weaponBonus || 0);

  const defensePower =
    defender.defense +
    defender.resistance * 0.7 +
    (defender.protectionBonus || 0);

  let rawChance = attackPower / (attackPower + defensePower);

  // manipulação pra vício (NUNCA 0% ou 100%)
  const chance = clamp(rawChance, 0.3, 0.9);

  const roll = Math.random();

  const success = roll <= chance;

  let loot = 0;
  let message = '';
  let critical = false;

  if (success) {
    const basePercent = randomBetween(0.1, 0.3);

    // chance de crítico (dopamina)
    if (Math.random() < 0.15) {
      critical = true;
    }

    loot = Math.floor(targetDirtyMoney * basePercent);

    if (critical) {
      loot *= 2;
    }

    message = critical
      ? 'ATAQUE BRUTAL! Você dominou completamente o alvo.'
      : 'Ataque bem-sucedido. Território enfraquecido.';
  } else {
    // perda leve pra não frustrar demais
    const lossPercent = randomBetween(0.02, 0.08);
    loot = -Math.floor(targetDirtyMoney * lossPercent);

    message = 'Sua investida falhou. Defesa resistiu.';
  }

  return {
    success,
    loot,
    chance,
    attackerPower: Math.floor(attackPower),
    defenderPower: Math.floor(defensePower),
    message,
    critical,
  };
}