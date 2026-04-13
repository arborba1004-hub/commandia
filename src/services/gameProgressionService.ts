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
      const giroReq = 2;
      return {
        unlocked: barracoLevel >= giroReq,
        title: 'Giro',
        reason: `Giro disponível a partir do barraco nível ${giroReq}.`,
        currentValue: barracoLevel,
        requiredValue: giroReq,
      };

    case 'lavagem':
      const lavagemReq = 4;
      return {
        unlocked: barracoLevel >= lavagemReq,
        title: 'Lavagem de Dinheiro',
        reason: `Lavagem disponível a partir do barraco nível ${lavagemReq}.`,
        currentValue: barracoLevel,
        requiredValue: lavagemReq,
      };

    case 'luxury':
      const luxuryReq = 5;
      return {
        unlocked: barracoLevel >= luxuryReq,
        title: 'Galeria',
        reason: `Galeria disponível a partir do barraco nível ${luxuryReq}.`,
        currentValue: barracoLevel,
        requiredValue: luxuryReq,
      };

    case 'arsenal':
      const arsenalReq = 3;
      return {
        unlocked: barracoLevel >= arsenalReq,
        title: 'Arsenal',
        reason: `Arsenal disponível a partir do barraco nível ${arsenalReq}.`,
        currentValue: barracoLevel,
        requiredValue: arsenalReq,
      };

    case 'bribery':
      const briberyReq = 6;
      return {
        unlocked: barracoLevel >= briberyReq,
        title: 'Suborno',
        reason: `Suborno disponível a partir do barraco nível ${briberyReq}.`,
        currentValue: barracoLevel,
        requiredValue: briberyReq,
      };

    case 'hierarchy':
      const hierarchyReq = 2;
      return {
        unlocked: barracoLevel >= hierarchyReq,
        title: 'Hierarquia',
        reason: `Hierarquia disponível a partir do barraco nível ${hierarchyReq}.`,
        currentValue: barracoLevel,
        requiredValue: hierarchyReq,
      };

    case 'faction':
      const factionReq = 7;
      return {
        unlocked: barracoLevel >= factionReq,
        title: 'Facção',
        reason: `Facção disponível a partir do barraco nível ${factionReq}.`,
        currentValue: barracoLevel,
        requiredValue: factionReq,
      };

    case 'talents':
      const talentsReq = 8;
      return {
        unlocked: barracoLevel >= talentsReq,
        title: 'Talentos',
        reason: `Talentos disponíveis a partir do barraco nível ${talentsReq}.`,
        currentValue: barracoLevel,
        requiredValue: talentsReq,
      };

    case 'fuga':
      const fugaReq = 9;
      return {
        unlocked: barracoLevel >= fugaReq,
        title: 'Fuga Ilustrada',
        reason: `Fuga disponível a partir do barraco nível ${fugaReq}.`,
        currentValue: barracoLevel,
        requiredValue: fugaReq,
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