/**
 * store/mapAttackStore.ts
 * Store Zustand para gerenciar estado de ataques no mapa.
 * Mantém informações sobre o ataque em progresso, animações, e resultados.
 */

import { create } from 'zustand';
import type { AttackTarget, AttackOrigin, AttackResolution, MapAttackPhase, RouteTile } from '@/types/mapAttack';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═════════════════════════════════════════════════════════════════════════════

export type { AttackTarget, AttackOrigin, AttackResolution, MapAttackPhase, RouteTile } from '@/types/mapAttack';

type MapAttackStore = {
  // Estado do ataque
  active: boolean;
  phase: MapAttackPhase;
  origin: AttackOrigin | null;
  target: AttackTarget | null;

  // Preview
  previewOpen: boolean;
  estimatedLoot: number;
  estimatedChance: number;

  // Rota e animação
  routeToTarget: RouteTile[];
  routeBack: RouteTile[];
  currentRoute: RouteTile[];
  currentStep: number;

  // Seleção de tropas
  selectedTroops: Record<string, number>;

  // Resultado
  resolution: AttackResolution | null;

  // Timestamps
  startedAt: number | null;
  finishedAt: number | null;

  // Ações
  startAttack: (data: { origin: AttackOrigin; target: AttackTarget; routeToTarget: RouteTile[] }) => void;
  setPhase: (phase: MapAttackPhase) => void;
  setCurrentStep: (step: number) => void;
  setResolution: (resolution: AttackResolution) => void;
  startReturn: () => void;
  finishAttack: () => void;
  resetAttack: () => void;

  // Preview actions
  openPreview: (target: AttackTarget) => void;
  closePreview: () => void;
  setEstimation: (loot: number, chance: number) => void;

  // Troop selection
  updateTroopSelection: (troops: Record<string, number>) => void;
  clearSelectedTroops: () => void;
};

// ═════════════════════════════════════════════════════════════════════════════
// STORE
// ═════════════════════════════════════════════════════════════════════════════

export const useMapAttackStore = create<MapAttackStore>((set) => ({
  active: false,
  phase: 'idle',
  origin: null,
  target: null,
  previewOpen: false,
  estimatedLoot: 0,
  estimatedChance: 0,
  routeToTarget: [],
  routeBack: [],
  currentRoute: [],
  currentStep: 0,
  selectedTroops: {},
  resolution: null,
  startedAt: null,
  finishedAt: null,

  startAttack: (data) =>
    set({
      active: true,
      phase: 'moving',
      origin: data.origin,
      target: data.target,
      routeToTarget: data.routeToTarget,
      currentRoute: data.routeToTarget,
      currentStep: 0,
      startedAt: Date.now(),
    }),

  setPhase: (phase) => set({ phase }),

  setCurrentStep: (step) => set({ currentStep: step }),

  setResolution: (resolution) => set({ resolution, phase: 'resolving' }),

  startReturn: () => set({ phase: 'returning' }),

  finishAttack: () =>
    set({
      active: false,
      phase: 'finished',
      finishedAt: Date.now(),
    }),

  resetAttack: () =>
    set({
      active: false,
      phase: 'idle',
      origin: null,
      target: null,
      previewOpen: false,
      routeToTarget: [],
      routeBack: [],
      currentRoute: [],
      currentStep: 0,
      selectedTroops: {},
      resolution: null,
      startedAt: null,
      finishedAt: null,
    }),

  openPreview: (target) => set({ previewOpen: true, target }),

  closePreview: () => set({ previewOpen: false, target: null }),

  setEstimation: (loot, chance) => set({ estimatedLoot: loot, estimatedChance: chance }),

  updateTroopSelection: (troops) => set({ selectedTroops: troops }),

  clearSelectedTroops: () => set({ selectedTroops: {} }),
}));