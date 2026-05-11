export function getSkillUpgradeCost(currentLevel: number) {
  return Math.floor(500 * Math.pow(1.22, currentLevel));
}

export function getSkillGain(currentLevel: number) {
  if (currentLevel < 20) return 10;
  if (currentLevel < 40) return 7;
  if (currentLevel < 70) return 4;
  return 2; // diminishing return pesado
}

export function canTrainSkill(player: any) {
  const now = Date.now();
  const last = player.lastSkillTrainAt || 0;

  const cooldown = player?.vip ? 2000 : 8000; // VIP treina mais rápido

  return now - last > cooldown;
}