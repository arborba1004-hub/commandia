export function calculateCombat(attacker: any, defender: any) {
  const atk = attacker.skills;
  const def = defender.skills;

  const offense =
    atk.attack * 1.5 +
    atk.agility * 1.1 +
    atk.intelligence * 1.0 +
    atk.respect * 0.6;

  const defense =
    def.defense * 1.5 +
    def.vigor * 1.2 +
    def.intelligence * 0.8 +
    def.respect * 0.7;

  const atkRand = 0.9 + Math.random() * 0.2;
  const defRand = 0.9 + Math.random() * 0.2;

  const finalAtk = offense * atkRand;
  const finalDef = defense * defRand;

  let winChance = finalAtk / (finalAtk + finalDef);

  winChance = Math.max(0.1, Math.min(0.9, winChance));

  const didWin = Math.random() < winChance;

  return {
    winChance,
    didWin,
    finalAtk,
    finalDef,
  };
}