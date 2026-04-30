/**
 * store/mapAttackStore.ts
 *
 * Máquina de estados do ataque PVP no mapa 3D.
 *
 * Esse store NÃO faz chamadas HTTP — quem orquestra é `hooks/useMapAttack.ts`,
 * que chama `attackApi` (estimate → start → resolve), reproduz a animação 3D do
 * squad em movimento, e vai sinalizando ao store qual fase do ciclo está ativa.
 *
 * ─── CICLO DE VIDA DE UM ATAQUE ──────────────────────────────────────────────
 *
 *   idle
 *     └─ jogador clica em barraco inimigo no mapa
 *        ↓
 *   selecting              (GangAttackModal aberto, escolhendo tropas)
 *     └─ jogador confirma seleção
 *        ↓
 *   preview                (estimateBattle em voo — opcional)
 *     └─ startBattle retorna battleId + travelMs
 *        ↓
 *   moving                 (squad animando até o alvo, currentStep avança)
 *     └─ animação chega ao final
 *        ↓
 *   arriving               (efeito de impacto, pequeno hold)
 *     └─ resolveBattle no backend
 *        ↓
 *   resolving              (aguardando resposta)
 *     └─ resolution recebida
 *        ↓
 *   returning              (squad volta para a base)
 *     └─ animação de retorno termina
 *        ↓
 *   finished               (overlay de resultado)
 *     └─ resetAttack() ou timeout
 *        ↓
 *   idle                   (volta ao começo)
 */

import { create } from 'zustand';
import type {
  AttackOrigin,
  AttackTarget,
  BattleResolution,
  MapAttackPhase,
  RouteTile,
} from '@/types/gang';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS DO STORE
// ═════════════════════════════════════════════════════════════════════════════

type MapAttackStore = {
  // ── Estado ────────────────────────────────────────────────────────────────
  phase:         MapAttackPhase;
  origin:        AttackOrigin    | null;
  target:        AttackTarget    | null;
  routeToTarget: RouteTile[];
  currentStep:   number;
  resolution:    BattleResolution | null;

  // ── Mutações ──────────────────────────────────────────────────────────────

  /** Sai de `idle` e entra em `moving` com origem, alvo e rota fixados. */
  startAttack: (payload: {
    origin:        AttackOrigin;
    target:        AttackTarget;
    routeToTarget: RouteTile[];
  }) => void;

  /** Atualiza qual tile da rota o squad está renderizando agora. */
  setCurrentStep: (stepIdx: number) => void;

  /** Mudança manual de fase. Usado para 'arriving', 'resolving', etc. */
  setPhase: (phase: MapAttackPhase) => void;

  /** Salva o resultado da batalha (já pode estar em 'resolving' ou 'finished'). */
  setResolution: (resolution: BattleResolution) => void;

  /** Atalho para `setPhase('returning')`. */
  startReturn: () => void;

  /** Atalho para `setPhase('finished')`. */
  finishAttack: () => void;

  /** Reset completo — volta para `idle` e limpa origem, alvo, rota, resolução. */
  resetAttack: () => void;
};

// ═════════════════════════════════════════════════════════════════════════════
// ESTADO INICIAL
// ═════════════════════════════════════════════════════════════════════════════

const INITIAL_STATE = {
  phase:         'idle' as MapAttackPhase,
  origin:        null,
  target:        null,
  routeToTarget: [] as RouteTile[],
  currentStep:   0,
  resolution:    null,
};

// ═════════════════════════════════════════════════════════════════════════════
// STORE
// ═════════════════════════════════════════════════════════════════════════════

export const useMapAttackStore = create<MapAttackStore>((set) => ({
  ...INITIAL_STATE,

  startAttack: ({ origin, target, routeToTarget }) => {
    set({
      phase:         'moving',
      origin,
      target,
      routeToTarget,
      currentStep:   0,
      resolution:    null,
    });
  },

  setCurrentStep: (stepIdx) => {
    set({ currentStep: Math.max(0, Math.floor(stepIdx)) });
  },

  setPhase: (phase) => {
    set({ phase });
  },

  setResolution: (resolution) => {
    set({ resolution });
  },

  startReturn: () => {
    set({ phase: 'returning' });
  },

  finishAttack: () => {
    set({ phase: 'finished' });
  },

  resetAttack: () => {
    set({ ...INITIAL_STATE });
  },
}));
