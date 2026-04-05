/**
 * Calcula o bônus de acessório baseado no nível do jogador
 * @param level - Nível do jogador
 * @returns Bônus em percentual (1 ou 2)
 */
export function getAccessoryBonus(level: number): number {
  return level >= 51 ? 2 : 1;
}
