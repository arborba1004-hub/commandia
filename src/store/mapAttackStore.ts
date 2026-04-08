import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MapAttackPhase =
  | 'idle'
  | 'preview'
  | 'moving'
  | 'arriving'
  | 'resolving'
  | 'returning'
  | 'finished'
  | 'cancelled'
  | 'error';

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
};

export type AttackTimeline = {
  previewOpenedAt: number | null;
  startedAt: number | null;
  arrivedAt: number | null;
  resolvedAt: number | null;
  returningAt: number | null;
  finishedAt: number | null;
  cancelledAt: number | null;
};

type PreviewPayload = {
  target: AttackTarget;
  origin: AttackOrigin;
  estimatedLoot?: number;
  estimatedChance?: number;
};

type StartAttackPayload = {
  attackId?: string;
  target: AttackTarget;
  origin: AttackOrigin;
  routeToTarget: RouteTile[];
  routeBack?: RouteTile[];
  squadWorldPosition?: SquadWorldPosition | null;
  estimatedLoot?: number;
  estimatedChance?: number;
};

type MapAttackState = {
  attackId: string | null;
  active: boolean;
  locked: boolean;
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
  timeline: AttackTimeline;

  lastCompletedAttackId: string | null;
  lastError: string | null;

  openPreview: (payload: PreviewPayload) => void;
  closePreview: () => void;

  startAttack: (payload: StartAttackPayload) => void;
  setPhase: (phase: MapAttackPhase) => void;
  setArrived: () => void;
  setSquadWorldPosition: (position: SquadWorldPosition | null) => void;
  setCurrentStep: (step: number) => void;
  advanceStep: () => void;

  setResolution: (resolution: AttackResolution | null) => void;
  startReturn: () => void;

  cancelAttack: (reason?: string) => void;
  failAttack: (reason: string) => void;
  finishAttack: () => void;
  resetAttack: () => void;

  isAttackingPlayer: (playerId: string) => boolean;
  isTargetingPlayer: (playerId: string) => boolean;
  hasActiveAttack: () => boolean;
  getCurrentTile: () => RouteTile | null;
};

const now = () => Date.now();

const makeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `atk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
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

const emptyTimeline = (): AttackTimeline => ({
  previewOpenedAt: null,
  startedAt: null,
  arrivedAt: null,
  resolvedAt: null,
  returningAt: null,
  finishedAt: null,
  cancelledAt: null,
});

const initialState = {
  attackId: null as string | null,
  active: false,
  locked: false,
  phase: 'idle' as MapAttackPhase,

  origin: null as AttackOrigin | null,
  target: null as AttackTarget | null,

  previewOpen: false,
  estimatedLoot: 0,
  estimatedChance: 0,

  routeToTarget: [] as RouteTile[],
  routeBack: [] as RouteTile[],
  currentRoute: [] as RouteTile[],
  currentStep: 0,

  squadWorldPosition: null as SquadWorldPosition | null,
  squadVisible: false,

  resolution: null as AttackResolution | null,
  timeline: emptyTimeline(),

  lastCompletedAttackId: null as string | null,
  lastError: null as string | null,
};

const sanitizeRoute = (route: RouteTile[]) =>
  route.filter(
    (tile) =>
      Number.isFinite(tile?.tileX) &&
      Number.isFinite(tile?.tileY)
  );

export const useMapAttackStore = create<MapAttackState>()(
  persist(
    (set, get) => ({
      ...initialState,

      openPreview: ({ target, origin, estimatedLoot = 0, estimatedChance = 0 }) => {
        const state = get();
        if (state.active || state.locked) return;

        set({
          previewOpen: true,
          phase: 'preview',
          target,
          origin,
          estimatedLoot: Math.max(0, estimatedLoot),
          estimatedChance: Math.max(0, Math.min(1, estimatedChance)),
          resolution: null,
          lastError: null,
          timeline: {
            ...emptyTimeline(),
            previewOpenedAt: now(),
          },
          routeToTarget: [],
          routeBack: [],
          currentRoute: [],
          currentStep: 0,
          squadWorldPosition: null,
          squadVisible: false,
        });
      },

      closePreview: () => {
        const state = get();

        if (state.active) {
          set({ previewOpen: false });
          return;
        }

        set({
          previewOpen: false,
          phase: 'idle',
          origin: null,
          target: null,
          estimatedLoot: 0,
          estimatedChance: 0,
          routeToTarget: [],
          routeBack: [],
          currentRoute: [],
          currentStep: 0,
          squadWorldPosition: null,
          squadVisible: false,
          resolution: null,
          lastError: null,
          attackId: null,
          timeline: emptyTimeline(),
        });
      },

      startAttack: ({
        attackId,
        target,
        origin,
        routeToTarget,
        routeBack,
        squadWorldPosition = null,
        estimatedLoot = 0,
        estimatedChance = 0,
      }) => {
        const state = get();
        if (state.active || state.locked) return;

        const safeRouteToTarget = sanitizeRoute(routeToTarget);
        const safeRouteBack = sanitizeRoute(
          routeBack && routeBack.length > 0 ? routeBack : [...safeRouteToTarget].reverse()
        );

        if (!origin || !target) {
          set({
            phase: 'error',
            lastError: 'Ataque sem origem ou alvo.',
          });
          return;
        }

        if (safeRouteToTarget.length === 0) {
          set({
            phase: 'error',
            lastError: 'Ataque sem rota válida.',
          });
          return;
        }

        set({
          attackId: attackId ?? makeId(),
          active: true,
          locked: true,
          previewOpen: false,
          phase: 'moving',

          target,
          origin,

          estimatedLoot: Math.max(0, estimatedLoot),
          estimatedChance: Math.max(0, Math.min(1, estimatedChance)),

          routeToTarget: safeRouteToTarget,
          routeBack: safeRouteBack,
          currentRoute: safeRouteToTarget,
          currentStep: 0,

          squadWorldPosition,
          squadVisible: true,

          resolution: null,
          lastError: null,

          timeline: {
            ...emptyTimeline(),
            startedAt: now(),
          },
        });
      },

      setPhase: (phase) => {
        set({ phase });
      },

      setArrived: () => {
        set((state) => ({
          phase: 'arriving',
          timeline: {
            ...state.timeline,
            arrivedAt: state.timeline.arrivedAt ?? now(),
          },
        }));
      },

      setSquadWorldPosition: (position) => {
        set({
          squadWorldPosition: position,
          squadVisible: !!position,
        });
      },

      setCurrentStep: (step) => {
        set((state) => ({
          currentStep: Math.max(
            0,
            Math.min(step, Math.max(state.currentRoute.length - 1, 0))
          ),
        }));
      },

      advanceStep: () => {
        set((state) => ({
          currentStep: Math.min(
            state.currentStep + 1,
            Math.max(state.currentRoute.length - 1, 0)
          ),
        }));
      },

      setResolution: (resolution) => {
        set((state) => ({
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
          timeline: {
            ...state.timeline,
            resolvedAt: resolution ? now() : state.timeline.resolvedAt,
          },
        }));
      },

      startReturn: () => {
        const state = get();
        const nextRoute =
          state.routeBack.length > 0
            ? state.routeBack
            : [...state.currentRoute].reverse();

        set({
          phase: 'returning',
          currentRoute: nextRoute,
          currentStep: 0,
          timeline: {
            ...state.timeline,
            returningAt: state.timeline.returningAt ?? now(),
          },
        });
      },

      cancelAttack: (reason) => {
        set((state) => ({
          active: false,
          locked: false,
          previewOpen: false,
          phase: 'cancelled',
          squadVisible: false,
          squadWorldPosition: null,
          lastError: reason ?? null,
          timeline: {
            ...state.timeline,
            cancelledAt: now(),
          },
        }));
      },

      failAttack: (reason) => {
        set((state) => ({
          active: false,
          locked: false,
          phase: 'error',
          squadVisible: false,
          squadWorldPosition: null,
          lastError: reason,
          timeline: {
            ...state.timeline,
            cancelledAt: state.timeline.cancelledAt ?? now(),
          },
        }));
      },

      finishAttack: () => {
        set((state) => ({
          active: false,
          locked: false,
          previewOpen: false,
          phase: 'finished',
          squadVisible: false,
          squadWorldPosition: null,
          currentRoute: state.routeBack.length ? state.routeBack : state.currentRoute,
          currentStep: 0,
          lastCompletedAttackId: state.attackId,
          timeline: {
            ...state.timeline,
            finishedAt: now(),
          },
        }));
      },

      resetAttack: () => {
        set({
          ...initialState,
          timeline: emptyTimeline(),
        });
      },

      isAttackingPlayer: (playerId) => {
        const origin = get().origin;
        return !!origin && origin.playerId === playerId;
      },

      isTargetingPlayer: (playerId) => {
        const target = get().target;
        return !!target && target.playerId === playerId;
      },

      hasActiveAttack: () => {
        const state = get();
        return state.active;
      },

      getCurrentTile: () => {
        const state = get();
        if (!state.currentRoute.length) return null;
        return state.currentRoute[state.currentStep] ?? null;
      },
    }),
    {
      name: 'map-attack-storage',
      partialize: (state) => ({
        attackId: state.attackId,
        active: state.active,
        locked: state.locked,
        phase: state.phase,
        origin: state.origin,
        target: state.target,
        previewOpen: state.previewOpen,
        estimatedLoot: state.estimatedLoot,
        estimatedChance: state.estimatedChance,
        routeToTarget: state.routeToTarget,
        routeBack: state.routeBack,
        currentRoute: state.currentRoute,
        currentStep: state.currentStep,
        squadWorldPosition: state.squadWorldPosition,
        squadVisible: state.squadVisible,
        resolution: state.resolution,
        timeline: state.timeline,
        lastCompletedAttackId: state.lastCompletedAttackId,
        lastError: state.lastError,
      }),
    }
  )
);