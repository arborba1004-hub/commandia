import type { PlayerState } from '@/store/playerStore';

export type BranchKey =
  | 'barraco'
  | 'giro'
  | 'lavagem'
  | 'luxury'
  | 'arsenal'
  | 'bribery'
  | 'hierarchy'
  | 'faction'
  | 'talents'
  | 'fuga';

export type BranchRequirementResult = {
  unlocked: boolean;
  title: string;
  reason: string;
  currentValue?: number;
  requiredValue?: number;
};

function getBarracoLevel(player: PlayerState): number {
  return Number(player?.niveis?.barracoLevel || 1);
}

function getLavagemLevel(player: PlayerState): number {
  return Number(player?.pageLevels?.lavagem || 1);
}

function getPower(player: PlayerState): number {
  return Number(player?.power || 0);
}

function getPageLevel(player: PlayerState, pageName: string): number {
  return Number(player?.pageLevels?.[pageName] || 1);
}

export function getBranchRequirement(
  branch: BranchKey,
  player: PlayerState
): BranchRequirementResult {
  const barracoLevel = getBarracoLevel(player);
  const lavagemLevel = getLavagemLevel(player);
  const power = getPower(player);

  switch (branch) {
    case 'barraco':
      return {
        unlocked: true,
        title: 'Barraco',
        reason: '',
      };

    case 'giro':
      // Desbloqueado a partir do barraco nível 1
      return {
        unlocked: barracoLevel >= 1,
        title: 'Giro',
        reason: `Giro disponível a partir do barraco nível 1.`,
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'lavagem':
      // Desbloqueado a partir do barraco nível 1
      return {
        unlocked: barracoLevel >= 1,
        title: 'Lavagem de Dinheiro',
        reason: `Lavagem disponível a partir do barraco nível 1.`,
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'luxury':
      // Galeria desbloqueada a partir do barraco nível 1
      return {
        unlocked: barracoLevel >= 1,
        title: 'Galeria',
        reason: `Galeria disponível a partir do barraco nível 1.`,
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'arsenal':
      // Arsenal desbloqueado a partir do barraco nível 1
      return {
        unlocked: barracoLevel >= 1,
        title: 'Arsenal',
        reason: `Arsenal disponível a partir do barraco nível 1.`,
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'bribery':
      // Suborno desbloqueado a partir do barraco nível 1
      return {
        unlocked: barracoLevel >= 1,
        title: 'Suborno',
        reason: `Suborno disponível a partir do barraco nível 1.`,
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'hierarchy':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Hierarquia',
        reason: `Hierarquia disponível a partir do barraco nível 1.`,
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'faction':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Facção',
        reason: `Facção disponível a partir do barraco nível 1.`,
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'talents':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Talentos',
        reason: `Talentos disponíveis a partir do barraco nível 1.`,
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'fuga':
      // Fuga desbloqueada a partir do barraco nível 1
      return {
        unlocked: barracoLevel >= 1,
        title: 'Fuga Ilustrada',
        reason: `Fuga disponível a partir do barraco nível 1.`,
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    default:
      return {
        unlocked: true,
        title: 'Sistema',
        reason: '',
      };
  }
}

/**
 * Verifica os requisitos para evoluir um branch para o próximo nível
 * Regra: Para evoluir para nível 3, todos os outros branches devem estar no nível 2
 */
export function getEvolutionRequirement(
  branch: BranchKey,
  player: PlayerState,
  targetLevel: number
): BranchRequirementResult {
  const barracoLevel = getBarracoLevel(player);
  const subornoLevel = getPageLevel(player, 'bribery');
  const arsenalLevel = getPageLevel(player, 'arsenal');
  const fugaLevel = getPageLevel(player, 'fuga');
  const galeriaLevel = getPageLevel(player, 'luxury');

  // Para evoluir para nível 3, todos os outros branches devem estar no nível 2
  if (targetLevel === 3) {
    const allOthersAtLevel2 =
      (branch === 'barraco' ? true : barracoLevel >= 2) &&
      (branch === 'bribery' ? true : subornoLevel >= 2) &&
      (branch === 'arsenal' ? true : arsenalLevel >= 2) &&
      (branch === 'fuga' ? true : fugaLevel >= 2) &&
      (branch === 'luxury' ? true : galeriaLevel >= 2);

    if (!allOthersAtLevel2) {
      const missing = [];
      if (branch !== 'barraco' && barracoLevel < 2) missing.push('Barraco');
      if (branch !== 'bribery' && subornoLevel < 2) missing.push('Suborno');
      if (branch !== 'arsenal' && arsenalLevel < 2) missing.push('Arsenal');
      if (branch !== 'fuga' && fugaLevel < 2) missing.push('Fuga');
      if (branch !== 'luxury' && galeriaLevel < 2) missing.push('Galeria');

      return {
        unlocked: false,
        title: `Evolução para Nível 3 - ${branch}`,
        reason: `Para evoluir para nível 3, todos os branches devem estar no nível 2. Faltam: ${missing.join(', ')}`,
        currentValue: targetLevel,
        requiredValue: 3,
      };
    }
  }

  return {
    unlocked: true,
    title: `Evolução para Nível ${targetLevel} - ${branch}`,
    reason: `Requisitos atendidos para evolução.`,
    currentValue: targetLevel,
    requiredValue: targetLevel,
  };
}

export function getBranchRequirementSummary(player: PlayerState) {
  return {
    barracoLevel: getBarracoLevel(player),
    lavagemLevel: getLavagemLevel(player),
    power: getPower(player),
  };
}