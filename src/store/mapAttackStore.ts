import { create } from 'zustand';
import type {
  GangBattleCasualtyResult,
  GangBattleCompositionStats,
  GangMemberType,
  GangTroopSelection,
} from '@/types/gangWar';

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
  factionId?: string | null;
};

export type AttackOrigin = {
  playerId: string;
  playerName: string;
  tileX: number;
  tileY: number;
};

export type SpoilsResult = {
  dirtyMoneyLoot: number;
  correLoot: number;
  prestigeLoot: number;
  brokenLuxuryItemId?: string | null;
  brokenLuxuryItemName?: string | null;
  brokenLuxuryItemValue?: number | null;
  luxuryConvertedDirtyMoney: number;
};

export type AttackResolution = {
  success: boolean;
  loot: number;
  chance: number;
  attackerPower: number;
  defenderPower: number;
  message: string;
  critical?: boolean;
  spoils: SpoilsResult;
  attackerGangLosses?: GangBattleCasualtyResult;
  defenderGangLosses?: GangBattleCasualtyResult;
  attackerGangStats?: GangBattleCompositionStats;
  defenderGangStats?: GangBattleCompositionStats;
};

type PreviewPayload = {
  target: AttackTarget;
  origin: AttackOrigin;
  estimatedLoot?: number;
  estimatedChance?: number;
};

type StartAttackPayload = {
  target: AttackTarget;
  origin: AttackOrigin;
  routeToTarget: RouteTile[];
  routeBack?: RouteTile[];
  squadWorldPosition?: SquadWorldPosition | null;
};

type MapAttackState = {
  active: boolean;
  phase: MapAttackPhase;

  origin: AttackOrigin | null;
  target: AttackTarget | null;

  previewOpen: boolean;
  estimatedLoot: number;
  estimatedChance: number;

  selectedTroops: GangTroopSelection[];

  routeToTarget: RouteTile[];
  routeBack: RouteTile[];

  currentRoute: RouteTile[];
  currentStep: number;

  squadWorldPosition: SquadWorldPosition | null;
  squadVisible: boolean;

  resolution: AttackResolution | null;
  startedAt: number | null;
  finishedAt: number | null;

  openPreview: (payload: PreviewPayload) => void;
  closePreview: () => void;
  setEstimate: (payload: { estimatedLoot: number; estimatedChance: number }) => void;
  setSelectedTroops: (troops: GangTroopSelection[]) => void;
  clearSelectedTroops: () => void;
  updateTroopSelection: (type: GangMemberType, quantity: number) => void;

  startAttack: (payload: StartAttackPayload) => void;
  setPhase: (phase: MapAttackPhase) => void;

  setSquadWorldPosition: (position: SquadWorldPosition | null) => void;
  setCurrentStep: (step: number) => void;
  advanceStep: () => void;

  setResolution: (resolution: AttackResolution | null) => void;
  startReturn: () => void;
  finishAttack: () => void;
  resetAttack: () => void;
};

const emptySpoils: SpoilsResult = {
  dirtyMoneyLoot: 0,
  correLoot: 0,
  prestigeLoot: 0,
  brokenLuxuryItemId: null,
  brokenLuxuryItemName: null,
  brokenLuxuryItemValue: null,
  luxuryConvertedDirtyMoney: 0,
};

const initialState = {
  active: false,
  phase: 'idle' as MapAttackPhase,
  origin: null as AttackOrigin | null,
  target: null as AttackTarget | null,
  previewOpen: false,
  estimatedLoot: 0,
  estimatedChance: 0,
  selectedTroops: [] as GangTroopSelection[],
  routeToTarget: [] as RouteTile[],
  routeBack: [] as RouteTile[],
  currentRoute: [] as RouteTile[],
  currentStep: 0,
  squadWorldPosition: null as SquadWorldPosition | null,
  squadVisible: false,
  resolution: null as AttackResolution | null,
  startedAt: null as number | null,
  finishedAt: null as number | null,
};

export const useMapAttackStore = create<MapAttackState>((set, get) => ({
  ...initialState,

  openPreview: ({ target, origin, estimatedLoot = 0, estimatedChance = 0 }) =>
    set({
      previewOpen: true,
      phase: 'preview',
      target,
      origin,
      estimatedLoot,
      estimatedChance,
      active: false,
      resolution: null,
      finishedAt: null,
      routeToTarget: [],
      routeBack: [],
      currentRoute: [],
      currentStep: 0,
      squadWorldPosition: null,
      squadVisible: false,
      selectedTroops: [],
    }),

  closePreview: () =>
    set((state) => ({
      previewOpen: false,
      phase: state.active ? state.phase : 'idle',
      ...(state.active
        ? {}
        : {
            estimatedLoot: 0,
            estimatedChance: 0,
            origin: null,
            target: null,
            selectedTroops: [],
          }),
    })),

  setEstimate: ({ estimatedLoot, estimatedChance }) =>
    set({
      estimatedLoot,
      estimatedChance,
    }),

  setSelectedTroops: (troops) =>
    set({
      selectedTroops: troops.filter((troop) => troop.quantity > 0),
    }),

  clearSelectedTroops: () =>
    set({
      selectedTroops: [],
    }),

  updateTroopSelection: (type, quantity) =>
    set((state) => {
      const next = state.selectedTroops.filter((troop) => troop.type !== type);
      if (quantity > 0) next.push({ type, quantity });
      return { selectedTroops: next };
    }),

  startAttack: ({
    target,
    origin,
    routeToTarget,
    routeBack = [...routeToTarget].reverse(),
    squadWorldPosition = null,
  }) =>
    set((state) => ({
      active: true,
      previewOpen: false,
      phase: 'moving',
      target,
      origin,
      routeToTarget,
      routeBack,
      currentRoute: routeToTarget,
      currentStep: 0,
      squadWorldPosition,
      squadVisible: true,
      resolution: null,
      startedAt: Date.now(),
      finishedAt: null,
      selectedTroops: state.selectedTroops,
    })),

  setPhase: (phase) => set({ phase }),

  setSquadWorldPosition: (position) =>
    set({
      squadWorldPosition: position,
      squadVisible: !!position,
    }),

  setCurrentStep: (step) => set({ currentStep: step }),

  advanceStep: () =>
    set((state) => ({
      currentStep: Math.min(
        state.currentStep + 1,
        Math.max(state.currentRoute.length - 1, 0)
      ),
    })),

  setResolution: (resolution) =>
    set({
      resolution: resolution
        ? {
            ...resolution,
            spoils: {
              ...emptySpoils,
              ...resolution.spoils,
            },
          }
        : null,
      phase: 'resolving',
    }),

  startReturn: () => {
    const state = get();

    set({
      phase: 'returning',
      currentRoute: state.routeBack,
      currentStep: 0,
    });
  },

  finishAttack: () =>
    set((state) => ({
      active: false,
      previewOpen: false,
      phase: 'finished',
      squadVisible: false,
      squadWorldPosition: null,
      finishedAt: Date.now(),
      currentRoute: state.routeBack.length ? state.routeBack : state.currentRoute,
      currentStep: 0,
      selectedTroops: [],
    })),

  resetAttack: () =>
    set({
      ...initialState,
    }),
}));
