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
  | 'talents';

export type BranchRequirementResult = {
  unlocked: boolean;
  title: string;
  reason: string;
  currentValue?: number;
  requiredValue?: number;
};

export function getBranchRequirement(
  branch: BranchKey,
  player: PlayerState
): BranchRequirementResult {
  const barracoLevel = player?.niveis?.barracoLevel ?? 1;
  const lavagemLevel = player?.pageLevels?.lavagem ?? 1;
  const power = player?.power ?? 0;

  switch (branch) {
    case 'barraco':
      return {
        unlocked: true,
        title: 'Barraco',
        reason: '',
      };

    case 'giro':
      return {
        unlocked: barracoLevel >= 2,
        title: 'Giro',
        reason: 'Evolua o barraco até o nível 2 para desbloquear o Giro.',
        currentValue: barracoLevel,
        requiredValue: 2,
      };

    case 'lavagem':
      return {
        unlocked: barracoLevel >= 5,
        title: 'Lavagem',
        reason: 'Evolua o barraco até o nível 5 para desbloquear a Lavagem.',
        currentValue: barracoLevel,
        requiredValue: 5,
      };

    case 'luxury':
      return {
        unlocked: barracoLevel >= 8,
        title: 'Luxo',
        reason: 'Evolua o barraco até o nível 8 para desbloquear a Galeria.',
        currentValue: barracoLevel,
        requiredValue: 8,
      };

    case 'arsenal':
      return {
        unlocked: barracoLevel >= 12 && lavagemLevel >= 3,
        title: 'Arsenal',
        reason: 'Arsenal exige barraco nível 12 e lavagem nível 3.',
        currentValue: barracoLevel,
        requiredValue: 12,
      };

    case 'bribery':
      return {
        unlocked: barracoLevel >= 15 && power >= 500,
        title: 'Suborno',
        reason: 'Suborno exige barraco nível 15 e poder mínimo 500.',
        currentValue: barracoLevel,
        requiredValue: 15,
      };

    case 'hierarchy':
      return {
        unlocked: barracoLevel >= 10,
        title: 'Hierarquia',
        reason: 'Hierarquia exige barraco nível 10.',
        currentValue: barracoLevel,
        requiredValue: 10,
      };

    case 'faction':
      return {
        unlocked: barracoLevel >= 6,
        title: 'Facção',
        reason: 'Facção exige barraco nível 6.',
        currentValue: barracoLevel,
        requiredValue: 6,
      };

    case 'talents':
      return {
        unlocked: barracoLevel >= 7,
        title: 'Talentos',
        reason: 'Talentos exige barraco nível 7.',
        currentValue: barracoLevel,
        requiredValue: 7,
      };

    default:
      return {
        unlocked: true,
        title: 'Sistema',
        reason: '',
      };
  }
}
