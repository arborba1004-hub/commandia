/**
 * store/mapAttackStore.ts
 *
 * Store de UX do fluxo de ataque PvP no mapa.
 *
 * Responsabilidade: orquestrar o estado visual do ataque em tempo real:
 *   - preview aberto/fechado (modal de seleção de tropas)
 *   - tropas selecionadas pelo jogador antes de confirmar
 *   - rota da viagem ida+volta e progresso no mapa
 *   - posição do squad no mundo 3D
 *   - resultado final (recebido do backend)
 *
 * NÃO faz cálculo de batalha — isso é 100% backend (resolveAttack.js).
 * NÃO persiste — recarrega a página = reseta. O ataque continua no backend.
 *
 * Eventos que alimentam este store:
 *   - usuário clica em barraco inimigo no mapa → openPreview(target, origin)
 *   - usuário ajusta sliders de tropas no modal → updateTroopSelection(type, qty)
 *   - usuário confirma ataque → useMapAttack chama startBattle e atualiza phase
 *   - socket 'attackResolved' chega → setResolution(...)
 *   - jogador fecha tela de resultado → resetAttack()
 */

import { create } from 'zustand';
import type {
  MapAttackState,
  MapAttackPhase,
  RouteTile,
  AttackTarget,
  AttackOrigin,
  AttackResolution,
  SquadWorldPosition,
} from '@/types/mapAttack';

// ─────────────────────────────────────────────────────────────────────────────
// Tipo da tropa selecionada (não está em types/mapAttack.ts; é só de UX)
// ─────────────────────────────────────────────────────────────────────────────

export type SelectedTroop = {
  type: string;        // GangMemberType (capanga, frente, ...)
  quantity: number;    // qtd selecionada nesse tipo
};

// ─────────────────────────────────────────────────────────────────────────────
// Estado completo
// ─────────────────────────────────────────────────────────────────────────────

export type MapAttackStoreState = MapAttackState & {
  selectedTroops: SelectedTroop[];
  battleId?: string;
  arriveAtIso?: string;
  launchedAtIso?: string;
  role?: 'attacker' | 'defender' | null;
  isRecovered?: boolean;
};

export type MapAttackStoreActions = {
  /** Abre o modal de preview/seleção de tropas para um alvo */
  openPreview: (target: AttackTarget, origin: AttackOrigin) => void;

  /** Fecha o modal de preview sem iniciar ataque */
  closePreview: () => void;

  /** Atualiza a quantidade de um tipo de tropa selecionado.
   *  Quantity = 0 remove a entrada. */
  updateTroopSelection: (type: string, quantity: number) => void;

  /** Substitui a seleção inteira (usado quando o modal de membros agrega) */
  setSelectedTroops: (troops: SelectedTroop[]) => void;

  /** Limpa toda a seleção */
  clearSelectedTroops: () => void;

  /** Define a estimativa retornada pelo backend (chance e loot esperado) */
  setEstimation: (estimatedChance: number, estimatedLoot: number) => void;

  /** Define a rota completa ida e (opcionalmente) volta */
  setRoute: (toTarget: RouteTile[], back?: RouteTile[]) => void;

  /** Avança o passo atual na rota corrente (chamado pela animação) */
  setCurrentStep: (step: number) => void;

  /** Posição mundo do squad (para sincronizar overlay/HUD com o 3D) */
  setSquadWorldPosition: (pos: SquadWorldPosition | null) => void;

  /** Mostra/oculta o squad no mapa (após resolução, antes de voltar) */
  setSquadVisible: (visible: boolean) => void;

  /** Muda a fase do ataque */
  setPhase: (phase: MapAttackPhase) => void;

  /** Metadados do ataque ativo persistido no backend. */
  setBattleMeta: (meta: Partial<Pick<MapAttackStoreState, 'battleId' | 'arriveAtIso' | 'launchedAtIso' | 'role' | 'isRecovered'>>) => void;

  /** Define a resolução final (chega via socket attackResolved ou resolveBattle) */
  setResolution: (resolution: AttackResolution) => void;

  /** Reset completo — volta ao estado idle */
  resetAttack: () => void;
};

export type MapAttackStore = MapAttackStoreState & MapAttackStoreActions;

// ─────────────────────────────────────────────────────────────────────────────
// Estado inicial
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_STATE: MapAttackStoreState = {
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

  squadWorldPosition: null,
  squadVisible: false,

  resolution: null,

  startedAt: null,
  finishedAt: null,

  selectedTroops: [],
  battleId: undefined,
  arriveAtIso: undefined,
  launchedAtIso: undefined,
  role: null,
  isRecovered: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useMapAttackStore = create<MapAttackStore>((set, get) => ({
  ...INITIAL_STATE,

  openPreview: (target, origin) => {
    set({
      active: true,
      phase: 'preview',
      target,
      origin,
      previewOpen: true,
      // Não limpa selectedTroops aqui — alguns fluxos pré-carregam
    });
  },

  closePreview: () => {
    const phase = get().phase;
    // Só fecha se estiver realmente em preview. Não corta um ataque em andamento.
    if (phase === 'preview') {
      set({
        ...INITIAL_STATE,
      });
    } else {
      set({ previewOpen: false });
    }
  },

  updateTroopSelection: (type, quantity) => {
    const q = Math.max(0, Math.floor(Number(quantity) || 0));
    const current = get().selectedTroops;
    const idx = current.findIndex((t) => t.type === type);

    if (q === 0) {
      // Remove
      if (idx >= 0) {
        const next = [...current];
        next.splice(idx, 1);
        set({ selectedTroops: next });
      }
      return;
    }

    if (idx >= 0) {
      const next = [...current];
      next[idx] = { type, quantity: q };
      set({ selectedTroops: next });
    } else {
      set({ selectedTroops: [...current, { type, quantity: q }] });
    }
  },

  setSelectedTroops: (troops) => {
    const sanitized = (troops || [])
      .map((t) => ({
        type: String(t.type),
        quantity: Math.max(0, Math.floor(Number(t.quantity) || 0)),
      }))
      .filter((t) => t.quantity > 0);
    set({ selectedTroops: sanitized });
  },

  clearSelectedTroops: () => {
    set({ selectedTroops: [] });
  },

  setEstimation: (estimatedChance, estimatedLoot) => {
    set({
      estimatedChance: Math.max(0, Math.min(100, Number(estimatedChance) || 0)),
      estimatedLoot: Math.max(0, Math.floor(Number(estimatedLoot) || 0)),
    });
  },

  setRoute: (toTarget, back) => {
    const safeToTarget = Array.isArray(toTarget) ? toTarget : [];
    const safeBack = Array.isArray(back) ? back : [];
    set({
      routeToTarget: safeToTarget,
      routeBack: safeBack,
      currentRoute: safeToTarget,
      currentStep: 0,
    });
  },

  setCurrentStep: (step) => {
    const route = get().currentRoute;
    const max = Math.max(0, route.length - 1);
    set({ currentStep: Math.max(0, Math.min(max, Math.floor(step))) });
  },

  setSquadWorldPosition: (pos) => {
    set({ squadWorldPosition: pos });
  },

  setSquadVisible: (visible) => {
    set({ squadVisible: !!visible });
  },

  setBattleMeta: (meta) => {
    set({
      battleId: meta.battleId ?? get().battleId,
      arriveAtIso: meta.arriveAtIso ?? get().arriveAtIso,
      launchedAtIso: meta.launchedAtIso ?? get().launchedAtIso,
      role: meta.role ?? get().role,
      isRecovered: meta.isRecovered ?? get().isRecovered,
    });
  },

  setPhase: (phase) => {
    const updates: Partial<MapAttackStoreState> = { phase };

    if (phase === 'moving' && !get().startedAt) {
      updates.startedAt = Date.now();
    }
    if (phase === 'finished' && !get().finishedAt) {
      updates.finishedAt = Date.now();
    }
    // Quando começa a voltar, troca a rota corrente
    if (phase === 'returning') {
      const back = get().routeBack;
      if (back.length > 0) {
        updates.currentRoute = back;
        updates.currentStep = 0;
      }
    }

    set(updates);
  },

  setResolution: (resolution) => {
    set({
      resolution: {
        success:        !!resolution?.success,
        loot:           Math.max(0, Math.floor(Number(resolution?.loot) || 0)),
        chance:         Math.max(0, Math.min(100, Number(resolution?.chance) || 0)),
        attackerPower:  Math.max(0, Math.floor(Number(resolution?.attackerPower) || 0)),
        defenderPower:  Math.max(0, Math.floor(Number(resolution?.defenderPower) || 0)),
        message:        String(resolution?.message || ''),
        critical:       !!resolution?.critical,
      },
      phase: get().phase === 'moving' || get().phase === 'arriving'
        ? 'resolving'
        : get().phase,
    });
  },

  resetAttack: () => {
    set({ ...INITIAL_STATE });
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS de leitura síncrona (uso fora de hooks React)
// ─────────────────────────────────────────────────────────────────────────────

export function getMapAttackSnapshot() {
  return useMapAttackStore.getState();
}

export function isAttackInFlight(): boolean {
  const phase = useMapAttackStore.getState().phase;
  return phase === 'moving' || phase === 'arriving' || phase === 'resolving' || phase === 'returning';
}