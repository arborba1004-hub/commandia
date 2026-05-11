/**
 * Sistema Hierárquico de Cargos
 * 21 cargos baseados no nível do barraco (1-100, a cada 5 níveis)
 */

export interface HierarchyRank {
  level: number;
  title: string;
  icon: string;
  color: string;
  slang: string; // Gíria da quebrada para notificação
}

export const HIERARCHY_RANKS: HierarchyRank[] = [
  { level: 1, title: 'Atividade', icon: '🟢', color: '#22c55e', slang: 'Tá começando a jornada, mano!' },
  { level: 5, title: 'Contenção', icon: '🟡', color: '#eab308', slang: 'Tá segurando a onda, irmão!' },
  { level: 10, title: 'Antena', icon: '📡', color: '#3b82f6', slang: 'Tá ligado em tudo, patrão!' },
  { level: 15, title: 'Mão de obra', icon: '🔨', color: '#f59e0b', slang: 'Tá trabalhando pesado, guerreiro!' },
  { level: 20, title: 'Vapor', icon: '💨', color: '#ec4899', slang: 'Tá voando alto, mano!' },
  { level: 25, title: 'Frente', icon: '🎯', color: '#8b5cf6', slang: 'Tá na frente da batalha, soldado!' },
  { level: 30, title: 'Soldado', icon: '⚔️', color: '#ef4444', slang: 'Tá pronto pro combate, guerreiro!' },
  { level: 35, title: 'Gerente de Asfalto', icon: '🛣️', color: '#6366f1', slang: 'Tá mandando na rua, chefe!' },
  { level: 40, title: 'Gerente de Quebrada', icon: '🏘️', color: '#14b8a6', slang: 'Tá dominando a quebrada, patrão!' },
  { level: 45, title: 'Dono da quebrada', icon: '👑', color: '#f97316', slang: 'Tá dono da quebrada, rei!' },
  { level: 50, title: 'Gerente do Complexo', icon: '🏢', color: '#06b6d4', slang: 'Tá gerenciando o complexo, mestre!' },
  { level: 55, title: 'Chefe de Complexo', icon: '🏛️', color: '#a855f7', slang: 'Tá chefão do complexo, patrão!' },
  { level: 60, title: 'Líder do Complexo', icon: '🎖️', color: '#fbbf24', slang: 'Tá liderando o complexo, general!' },
  { level: 65, title: 'Gerente do comando', icon: '📋', color: '#10b981', slang: 'Tá gerenciando o comando, capitão!' },
  { level: 70, title: 'Chefe do comando', icon: '⚡', color: '#f43f5e', slang: 'Tá chefão do comando, mestre!' },
  { level: 75, title: 'Líder do Comando', icon: '🔱', color: '#06b6d4', slang: 'Tá liderando o comando, imperador!' },
  { level: 80, title: 'Conselheiro', icon: '🧙', color: '#8b5cf6', slang: 'Tá aconselhando os guerreiros, sábio!' },
  { level: 85, title: 'Rei do Complexo', icon: '👑', color: '#fbbf24', slang: 'Tá reinando no complexo, majestade!' },
  { level: 90, title: 'Vice-rei do comando', icon: '🏆', color: '#ec4899', slang: 'Tá vice-reinando o comando, nobre!' },
  { level: 95, title: 'Príncipe do Comando', icon: '💎', color: '#06b6d4', slang: 'Tá príncipe do comando, alteza!' },
  { level: 100, title: 'Rei do Comando', icon: '👑', color: '#fbbf24', slang: 'Tá rei do comando, sua majestade!' },
];

/**
 * Obtém o cargo atual baseado no nível do barraco
 */
export function getPlayerRank(level: number): HierarchyRank {
  const rank = HIERARCHY_RANKS.slice()
    .reverse()
    .find((r) => level >= r.level);
  return rank || HIERARCHY_RANKS[0];
}

/**
 * Verifica se o jogador foi promovido
 */
export function checkRankPromotion(
  previousLevel: number,
  newLevel: number
): HierarchyRank | null {
  const previousRank = getPlayerRank(previousLevel);
  const newRank = getPlayerRank(newLevel);

  if (previousRank.level !== newRank.level) {
    return newRank;
  }

  return null;
}

/**
 * Obtém todos os cargos até um nível específico (para exibição de distintivos)
 */
export function getUnlockedRanks(level: number): HierarchyRank[] {
  return HIERARCHY_RANKS.filter((r) => level >= r.level);
}

/**
 * Obtém o próximo cargo
 */
export function getNextRank(level: number): HierarchyRank | null {
  const currentRank = getPlayerRank(level);
  const nextRank = HIERARCHY_RANKS.find((r) => r.level > currentRank.level);
  return nextRank || null;
}

/**
 * Calcula quantos níveis faltam para o próximo cargo
 */
export function getLevelsUntilNextRank(level: number): number {
  const nextRank = getNextRank(level);
  if (!nextRank) return 0;
  return nextRank.level - level;
}
