/**
 * Tipos de membros da gangue que participam de combate.
 * Use este Set para filtrar membros ao calcular estatísticas de batalha.
 */
export const COMBAT_MEMBER_TYPES = new Set([
  'capanga',
  'frente',
  'executor',
  'assassino',
  'muralha',
  'certeiro',
  'motorista',
]);

/**
 * Bônus percentuais do barraco para atributos de combate da gangue.
 * Aplica-se exclusivamente aos membros listados em COMBAT_MEMBER_TYPES.
 */
export interface BarracoCombatBonuses {
  rajada: number;    // % de aumento no atributo Rajada
  blindagem: number; // % de aumento no atributo Blindagem
  folego: number;    // % de aumento no atributo Fôlego
  quebra: number;    // % de aumento no atributo Quebra
}

/**
 * Retorna os bônus percentuais de combate concedidos pelo barraco.
 * O foco principal é blindagem.
 *
 * @param barracoLevel - Nível do barraco (1 a 100)
 */
export function getBarracoCombatBonuses(barracoLevel: number): BarracoCombatBonuses {
  const level = Math.max(1, Math.min(100, Math.floor(barracoLevel)));

  // Progressão por nível:
  // Blindagem: 0.5% por nível → máximo +50% no nível 100
  // Rajada:    0.3% por nível → máximo +30% no nível 100
  // Fôlego:    0.25% por nível → máximo +25% no nível 100
  // Quebra:    0.2% por nível → máximo +20% no nível 100
  const blindagem = level * 0.5;
  const rajada = level * 0.3;
  const folego = level * 0.25;
  const quebra = level * 0.2;

  return {
    rajada: Number(rajada.toFixed(2)),
    blindagem: Number(blindagem.toFixed(2)),
    folego: Number(folego.toFixed(2)),
    quebra: Number(quebra.toFixed(2)),
  };
}
