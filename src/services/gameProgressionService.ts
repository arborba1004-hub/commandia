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
      return {
        unlocked: barracoLevel >= 1,
        title: 'Giro',
        reason: 'Giro disponível a partir do barraco nível 1.',
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'lavagem':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Lavagem de Dinheiro',
        reason: 'Lavagem disponível a partir do barraco nível 1.',
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'luxury':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Galeria',
        reason: 'Galeria disponível a partir do barraco nível 1.',
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'arsenal':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Arsenal',
        reason: 'Arsenal disponível a partir do barraco nível 1.',
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'bribery':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Suborno',
        reason: 'Suborno disponível a partir do barraco nível 1.',
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'hierarchy':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Hierarquia',
        reason: 'Hierarquia disponível a partir do barraco nível 1.',
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'faction':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Facção',
        reason: 'Facção disponível a partir do barraco nível 1.',
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'talents':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Talentos',
        reason: 'Talentos disponíveis a partir do barraco nível 1.',
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'fuga':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Fuga Ilustrada',
        reason: 'Fuga disponível a partir do barraco nível 1.',
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

export function getBranchRequirementSummary(player: PlayerState) {
  return {
    barracoLevel: getBarracoLevel(player),
    lavagemLevel: getLavagemLevel(player),
    power: getPower(player),
  };
}