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
        reason: 'Giro está disponível a partir do barraco nível 1.',
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'lavagem':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Lavagem',
        reason: 'Lavagem está disponível a partir do barraco nível 1.',
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'luxury':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Galeria',
        reason: 'Galeria está disponível a partir do barraco nível 1.',
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'arsenal':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Arsenal',
        reason: 'Arsenal está disponível a partir do barraco nível 1.',
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'bribery':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Suborno',
        reason: 'Suborno está disponível a partir do barraco nível 1.',
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'hierarchy':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Hierarquia',
        reason: 'Hierarquia está disponível a partir do barraco nível 1.',
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'faction':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Facção',
        reason: 'Facção está disponível a partir do barraco nível 1.',
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'talents':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Talentos',
        reason: 'Talentos estão disponíveis a partir do barraco nível 1.',
        currentValue: barracoLevel,
        requiredValue: 1,
      };

    case 'fuga':
      return {
        unlocked: barracoLevel >= 1,
        title: 'Fuga',
        reason: 'Fuga está disponível a partir do barraco nível 1.',
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