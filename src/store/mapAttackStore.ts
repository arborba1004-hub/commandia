/**
 * store/mapAttackStore.ts
 * Máquina de estados do ataque PVP no mapa.
 * Refatorado com tipos canônicos de @/types/gang.
 *
 * Fases do ciclo:
 *   idle → selecting → preview → moving → arriving → resolving → returning → finished → idle
 */

import { create } from 'zustand';
import type {
  MapAttackPhase,
  AttackTarget,
  AttackOrigin,
  RouteTile,
  SquadWorldPosition,
  BattleResolution,
  GangAttackSelection,
  GangTroopSelection,
  GangMemberType,
} from '@/types/gang';

// ═════════════════════════════════════════════════════════════════════════════
// ESTADO
// ═════════════════════════════════════════════════════════════════════════════

type MapAttackState = {
  phase:    MapAttackPhase;
  active:   boolean;

  origin:   AttackOrigin | null;
  target:   AttackTarget | null;

  // Estimativa (fase preview)
  previewOpen:      boolean;
  estimatedLoot:    number;
  estimatedChance:  number;

  // Seleção de tropas (Mafia City style: quantidade por tipo)
  selectedTroops: GangTroopSelection[];

  // Rota 3D
  routeToTarget: RouteTile[];
  routeBack:     RouteTile[];
  currentRoute:  RouteTile[];
  currentStep:   number;

  // Squad no mapa
  squadWorldPosition: SquadWorldPosition | null;
  squadVisible:       boolean;

  // Resultado
  resolution: BattleResolution | null;

  // Timestamps
  startedAt:  number | null;
  finishedAt: number | null;

  // Ações
  openPreview:   (payload: { target: AttackTarget; origin: AttackOrigin; estimatedLoot?: number; estimatedChance?: number }) => void;
  closePreview:  () => void;
  setEstimate:   (payload: { estimatedLoot: number; estimatedChance: number }) => void;

  setSelectedTroops:    (troops: GangTroopSelection[]) => void;
  clearSelectedTroops:  () => void;
  updateTroopCount:     (type: GangMemberType, quantity: number) => void;
  selectionAsRecord:    () => GangAttackSelection;

  startAttack: (payload: {
    target:         AttackTarget;
    origin:         AttackOrigin;
    routeToTarget:  RouteTile[];
    routeBack?:     RouteTile[];
    squadWorldPosition?: SquadWorldPosition | null;
  }) => void;

  setPhase:              (phase: MapAttackPhase) => void;
  setSquadWorldPosition: (position: SquadWorldPosition | null) => void;
  setCurrentStep:        (step: number) => void;
  advanceStep:           () => void;

  setResolution:  (resolution: BattleResolution | null) => void;
  startReturn:    () => void;
  finishAttack:   () => void;
  resetAttack:    () => void;
};

// ═════════════════════════════════════════════════════════════════════════════
// DEFAULTS
// ═════════════════════════════════════════════════════════════════════════════

const initialState = {
  phase:    'idle'  as MapAttackPhase,
  active:   false,
  origin:   null,
  target:   null,
  previewOpen:      false,
  estimatedLoot:    0,
  estimatedChance:  0,
  selectedTroops:   [] as GangTroopSelection[],
  routeToTarget:    [] as RouteTile[],
  routeBack:        [] as RouteTile[],
  currentRoute:     [] as RouteTile[],
  currentStep:      0,
  squadWorldPosition: null,
  squadVisible:       false,
  resolution: null,
  startedAt:  null,
  finishedAt: null,
};

// ═════════════════════════════════════════════════════════════════════════════
// STORE
// ═════════════════════════════════════════════════════════════════════════════

export const useMapAttackStore = create<MapAttackState>((set, get) => ({
  ...initialState,

  openPreview: ({ target, origin, estimatedLoot = 0, estimatedChance = 0 }) =>
    set({
      previewOpen:     true,
      phase:           'preview',
      target,
      origin,
      estimatedLoot,
      estimatedChance,
      active:          false,
      resolution:      null,
      finishedAt:      null,
      routeToTarget:   [],
      routeBack:       [],
      currentRoute:    [],
      currentStep:     0,
      squadWorldPosition: null,
      squadVisible:       false,
      selectedTroops:  [],
    }),

  closePreview: () =>
    set((state) => ({
      previewOpen: false,
      phase: state.active ? state.phase : 'idle',
      ...(state.active ? {} : {
        estimatedLoot:    0,
        estimatedChance:  0,
        origin:           null,
        target:           null,
        selectedTroops:   [],
      }),
    })),

  setEstimate: ({ estimatedLoot, estimatedChance }) =>
    set({ estimatedLoot, estimatedChance }),

  setSelectedTroops: (troops) =>
    set({ selectedTroops: troops.filter((t) => t.quantity > 0) }),

  clearSelectedTroops: () =>
    set({ selectedTroops: [] }),

  updateTroopCount: (type, quantity) =>
    set((state) => {
      const next = state.selectedTroops.filter((t) => t.type !== type);
      if (quantity > 0) next.push({ type, quantity });
      return { selectedTroops: next };
    }),

  /** Converte o array de seleção para Record<GangMemberType, number> para envio à API. */
  selectionAsRecord: (): GangAttackSelection => {
    const troops = get().selectedTroops;
    return {
      capanga:  0, frente:   0, executor:  0, assassino: 0,
      muralha:  0, certeiro: 0, motorista: 0, nitro:     0,
      ...Object.fromEntries(troops.map((t) => [t.type, t.quantity])),
    } as GangAttackSelection;
  },

  startAttack: ({ target, origin, routeToTarget, routeBack, squadWorldPosition = null }) =>
    set((state) => ({
      active:      true,
      previewOpen: false,
      phase:       'moving',
      target,
      origin,
      routeToTarget,
      routeBack:   routeBack ?? [...routeToTarget].reverse(),
      currentRoute: routeToTarget,
      currentStep:  0,
      squadWorldPosition,
      squadVisible: true,
      resolution:   null,
      startedAt:    Date.now(),
      finishedAt:   null,
      selectedTroops: state.selectedTroops,
    })),

  setPhase: (phase) => set({ phase }),

  setSquadWorldPosition: (position) =>
    set({ squadWorldPosition: position, squadVisible: !!position }),

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
      resolution,
      phase: 'resolving',
    }),

  startReturn: () => {
    const state = get();
    set({
      phase:        'returning',
      currentRoute: state.routeBack,
      currentStep:  0,
    });
  },

  finishAttack: () =>
    set((state) => ({
      active:       false,
      previewOpen:  false,
      phase:        'finished',
      squadVisible: false,
      squadWorldPosition: null,
      finishedAt:   Date.now(),
      currentStep:  0,
      selectedTroops: [],
    })),

  resetAttack: () => set({ ...initialState }),
}));
