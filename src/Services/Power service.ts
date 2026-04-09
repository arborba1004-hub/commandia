export function applySoftCap(value: number, capStart: number, reduction: number) {
  if (value <= capStart) return value;

  const excess = value - capStart;
  return capStart + excess * reduction;
}

export function calculateEffectiveSkill(
  base: number,
  bonus: number = 0,
  multiplier: number = 1
) {
  const raw = (base + bonus) * multiplier;

  // SOFT CAP INVISÍVEL
  return applySoftCap(raw, 500, 0.35);
}

export function calculatePlayerPower(player: any) {
  const skills = player.skills || {};

  const premiumMultiplier = player?.vip ? 1.1 : 1.0;

  const attack = calculateEffectiveSkill(skills.attack || 0, 0, premiumMultiplier);
  const defense = calculateEffectiveSkill(skills.defense || 0, 0, premiumMultiplier);
  const intelligence = calculateEffectiveSkill(skills.intelligence || 0, 0, premiumMultiplier);
  const agility = calculateEffectiveSkill(skills.agility || 0, 0, premiumMultiplier);
  const respect = calculateEffectiveSkill(skills.respect || 0, 0, premiumMultiplier);
  const vigor = calculateEffectiveSkill(skills.vigor || 0, 0, premiumMultiplier);

  const power =
    attack * 1.4 +
    defense * 1.2 +
    intelligence * 1.1 +
    agility * 1.15 +
    respect * 0.9 +
    vigor * 1.25;

  return Math.floor(power);
}