export type MapAttackPhase =
  | 'idle'
  | 'preview'
  | 'moving'
  | 'arriving'
  | 'resolving'
  | 'returning'
  | 'finished';

export type RouteTile = {
  tileX: number;
  tileY: number;
};

export type SquadWorldPosition = {
  x: number;
  y: number;
  z: number;
};

export type AttackTarget = {
  playerId: string;
  playerName: string;
  tileX: number;
  tileY: number;
  barracoLevel?: number;
  power?: number;
  dirtyMoney?: number;
};

export type AttackOrigin = {
  playerId: string;
  playerName: string;
  tileX: number;
  tileY: number;
};

export type AttackResolution = {
  success: boolean;
  loot: number;
  chance: number;
  attackerPower: number;
  defenderPower: number;
  message: string;
  critical?: boolean;
};

export type MapAttackState = {
  active: boolean;
  phase: MapAttackPhase;

  origin: AttackOrigin | null;
  target: AttackTarget | null;

  previewOpen: boolean;
  estimatedLoot: number;
  estimatedChance: number;

  routeToTarget: RouteTile[];
  routeBack: RouteTile[];

  currentRoute: RouteTile[];
  currentStep: number;

  squadWorldPosition: SquadWorldPosition | null;
  squadVisible: boolean;

  resolution: AttackResolution | null;

  startedAt: number | null;
  finishedAt: number | null;
};