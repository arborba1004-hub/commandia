/**
 * store/gangEstatisticasStore.ts
 *
 * Sistema de ESTATÍSTICAS da gangue — análogo à tela "Estatísticas" do Mafia City.
 *
 * ─── DIFERENÇA CONCEITUAL ─────────────────────────────────────────────────────
 *
 *   ATRIBUTOS  → Valores base do membro, definidos pelo tipo + nível.
 *                Ex: Capanga nível 5 → { rajada: 15, blindagem: 21, folego: 20, quebra: 12 }
 *                Fonte: ATRIBUTOS_GANG (data/gangAtributos.ts)
 *                São fixos por tipo e nível. Não mudam por sistemas externos.
 *
 *   ESTATÍSTICAS → Sistema CONSUMIDOR alimentado por outras fontes (formação, CT,
 *                  arsenal, suborno, facção, etc.). Cada fonte registra o quanto
 *                  ela INFLUENCIA cada atributo, e o store computa o multiplicador
 *                  final aplicado em batalha.
 *
 *                  Os valores em StatBonusPercent (rajada, blindagem, folego, quebra)
 *                  NÃO são "estatísticas" — são PERCENTUAIS aplicados sobre o atributo
 *                  homônimo do membro. "rajada: 18" significa "+18% no atributo rajada".
 *
 *                  Multiplicadores começam em 1.0 (sem bônus = 100% do atributo base).
 *                  Análogo Mafia City: "All Crew Attack +150%", "Capanga Defense +80%".
 *
 *   STAT EFETIVA EM BATALHA = atributo_base × multiplicador_global × multiplicador_por_tipo
 *
 * ─── ESTRUTURA DOS BÔNUS ──────────────────────────────────────────────────────
 *
 *   Global   → aplica a TODOS os tipos (ex: "All Crew Attack +X%")
 *   Por tipo → aplica só ao tipo específico (ex: "Capanga Attack +X%")
 *
 *   Os bônus de múltiplas fontes se somam (acumulação aditiva):
 *     multiplicador_final = 1 + (soma_de_todos_os_%_aplicáveis) / 100
 *
 * ─── FONTES QUE ALIMENTAM ESTE STORE ─────────────────────────────────────────
 *
 *   'formacao'    → GangFormationSelector / gangStore.setFormation()
 *   'ct'          → Nível do CT
 *   'arsenal'     → Sistema de arsenal
 *   'suborno'     → Sistema de suborno ilustrado
 *   'investimento'→ Centro de investimentos (futuro)
 *   'faccao'      → Bônus de facção
 *   'evento'      → Eventos temporários do servidor
 *   'manual'      → Admin / testes / debug
 *
 * ─── COMO USAR ────────────────────────────────────────────────────────────────
 *
 *   // Aplicar bônus de formação (All Crew)
 *   useGangEstatisticasStore.getState().applyBonus('formacao', {
 *     global: { rajada: 18, quebra: 14, blindagem: -8, folego: -4 },
 *   });
 *
 *   // Aplicar bônus de arsenal só para certeiro
 *   useGangEstatisticasStore.getState().applyBonus('arsenal', {
 *     porTipo: { certeiro: { rajada: 25 } },
 *   });
 *
 *   // Ler multiplicador final do capanga em rajada
 *   const mult = useGangEstatisticasStore.getState().getMultiplier('capanga', 'rajada');
 *   // → 1.0 sem bônus; 1.18 com formação pressao_total aplicada
 *
 *   // Aplicar ao atributo base para obter stat efetiva
 *   const stat = useGangEstatisticasStore.getState().getEstatisticaFinal('capanga', 'rajada', 15);
 *   // → 15 × 1.18 = 17.7
 */

import { create } from 'zustand';
import type { GangMemberType, GangFormationType } from '@/types/gang';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS PÚBLICOS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Os 4 stats de combate.
 *   rajada    = ataque   (Mafia City: Attack)
 *   blindagem = defesa   (Mafia City: Defense)
 *   folego    = vida     (Mafia City: HP)
 *   quebra    = dano     (Mafia City: Lethality)
 */
export type EstatisticaStat = 'rajada' | 'blindagem' | 'folego' | 'quebra';

/** Percentuais de bônus para cada stat. 0 = sem bônus (multiplicador 1.0). */
export type StatBonusPercent = {
  rajada:    number;
  blindagem: number;
  folego:    number;
  quebra:    number;
};

/** Multiplicadores finais. Todos iniciam em 1.0. */
export type StatMultipliers = {
  rajada:    number;
  blindagem: number;
  folego:    number;
  quebra:    number;
};

/**
 * Payload de bônus que uma fonte envia ao store.
 *
 * global   → "All Crew Attack +18%" — aplica a qualquer tipo
 * porTipo  → "Capanga Defense +20%" — aplica só ao tipo específico
 *
 * Valores são PERCENTUAIS inteiros ou decimais:
 *   +18 → multiplica por 1.18
 *   -8  → multiplica por 0.92
 *    0  → sem efeito
 */
export type EstatisticaBonus = {
  global?:  Partial<StatBonusPercent>;
  porTipo?: Partial<Record<GangMemberType, Partial<StatBonusPercent>>>;
};

/** Fontes que podem alimentar o sistema. */
export type EstatisticaSource =
  | 'formacao'
  | 'ct'
  | 'arsenal'
  | 'suborno'
  | 'investimento'
  | 'faccao'
  | 'evento'
  | 'manual';

/** Snapshot de estatísticas calculadas para um tipo de membro. */
export type EstatisticasMembroSnapshot = {
  tipo:              GangMemberType;
  multipliers:       StatMultipliers;
  bonusTotalPercent: StatBonusPercent;
  fontes:            EstatisticaSource[];
};

/** Snapshot de estatísticas para toda a gangue. */
export type EstatisticasGangSnapshot = {
  porTipo: Record<GangMemberType, EstatisticasMembroSnapshot>;
  global:  StatMultipliers;
};

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS INTERNOS DO STORE
// ═════════════════════════════════════════════════════════════════════════════

type GangEstatisticasStore = {
  sources: Record<EstatisticaSource, EstatisticaBonus>;

  // Mutações
  applyBonus:  (source: EstatisticaSource, bonus: EstatisticaBonus) => void;
  clearSource: (source: EstatisticaSource) => void;
  resetAll:    () => void;

  // Leitura
  getMultiplier:         (tipo: GangMemberType, stat: EstatisticaStat) => number;
  getMultipliersForTipo: (tipo: GangMemberType) => StatMultipliers;
  getBonusTotalPercent:  (tipo: GangMemberType) => StatBonusPercent;
  getEstatisticaFinal:   (tipo: GangMemberType, stat: EstatisticaStat, valorBase: number) => number;
  getSnapshotParaTipo:   (tipo: GangMemberType) => EstatisticasMembroSnapshot;
  getSnapshotGang:       () => EstatisticasGangSnapshot;
};

// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═════════════════════════════════════════════════════════════════════════════

const ALL_STATS: EstatisticaStat[] = ['rajada', 'blindagem', 'folego', 'quebra'];

const ALL_MEMBER_TYPES: GangMemberType[] = [
  'capanga', 'frente', 'executor', 'assassino',
  'muralha', 'certeiro', 'motorista', 'nitro',
];

const ALL_SOURCES: EstatisticaSource[] = [
  'formacao', 'ct', 'arsenal', 'suborno',
  'investimento', 'faccao', 'evento', 'manual',
];

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS INTERNOS
// ═════════════════════════════════════════════════════════════════════════════

function emptyBonus(): EstatisticaBonus {
  return { global: {}, porTipo: {} };
}

function emptySources(): Record<EstatisticaSource, EstatisticaBonus> {
  return Object.fromEntries(
    ALL_SOURCES.map((s) => [s, emptyBonus()])
  ) as Record<EstatisticaSource, EstatisticaBonus>;
}

function sumBonusPercent(
  sources: Record<EstatisticaSource, EstatisticaBonus>,
  tipo: GangMemberType,
  stat: EstatisticaStat,
): number {
  let total = 0;
  for (const source of ALL_SOURCES) {
    const entry = sources[source];
    total += Number(entry?.global?.[stat]          ?? 0);
    total += Number(entry?.porTipo?.[tipo]?.[stat] ?? 0);
  }
  return total;
}

function getActiveSources(
  sources: Record<EstatisticaSource, EstatisticaBonus>,
  tipo: GangMemberType,
): EstatisticaSource[] {
  return ALL_SOURCES.filter((source) => {
    const entry = sources[source];
    const hasGlobal  = ALL_STATS.some((s) => Number(entry?.global?.[s]          ?? 0) !== 0);
    const hasPorTipo = ALL_STATS.some((s) => Number(entry?.porTipo?.[tipo]?.[s] ?? 0) !== 0);
    return hasGlobal || hasPorTipo;
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// STORE
// ═════════════════════════════════════════════════════════════════════════════

export const useGangEstatisticasStore = create<GangEstatisticasStore>((set, get) => ({
  sources: emptySources(),

  // ── Mutações ──────────────────────────────────────────────────────────────

  applyBonus: (source, bonus) =>
    set((state) => ({
      sources: { ...state.sources, [source]: bonus },
    })),

  clearSource: (source) =>
    set((state) => ({
      sources: { ...state.sources, [source]: emptyBonus() },
    })),

  resetAll: () => set({ sources: emptySources() }),

  // ── Leitura ───────────────────────────────────────────────────────────────

  getMultiplier: (tipo, stat) => {
    const total = sumBonusPercent(get().sources, tipo, stat);
    return 1 + total / 100; // estado inicial = 1.0
  },

  getMultipliersForTipo: (tipo) => {
    const { getMultiplier } = get();
    return {
      rajada:    getMultiplier(tipo, 'rajada'),
      blindagem: getMultiplier(tipo, 'blindagem'),
      folego:    getMultiplier(tipo, 'folego'),
      quebra:    getMultiplier(tipo, 'quebra'),
    };
  },

  getBonusTotalPercent: (tipo) => {
    const sources = get().sources;
    return {
      rajada:    sumBonusPercent(sources, tipo, 'rajada'),
      blindagem: sumBonusPercent(sources, tipo, 'blindagem'),
      folego:    sumBonusPercent(sources, tipo, 'folego'),
      quebra:    sumBonusPercent(sources, tipo, 'quebra'),
    };
  },

  getEstatisticaFinal: (tipo, stat, valorBase) => {
    const mult = get().getMultiplier(tipo, stat);
    return Math.round(valorBase * mult * 100) / 100;
  },

  getSnapshotParaTipo: (tipo) => {
    const { getMultipliersForTipo, getBonusTotalPercent, sources } = get();
    return {
      tipo,
      multipliers:       getMultipliersForTipo(tipo),
      bonusTotalPercent: getBonusTotalPercent(tipo),
      fontes:            getActiveSources(sources, tipo),
    };
  },

  getSnapshotGang: () => {
    const { getSnapshotParaTipo, sources } = get();

    const globalPercent = ALL_STATS.reduce((acc, stat) => {
      let total = 0;
      for (const source of ALL_SOURCES) {
        total += Number(sources[source]?.global?.[stat] ?? 0);
      }
      acc[stat] = total;
      return acc;
    }, {} as Record<EstatisticaStat, number>);

    const global: StatMultipliers = {
      rajada:    1 + globalPercent.rajada    / 100,
      blindagem: 1 + globalPercent.blindagem / 100,
      folego:    1 + globalPercent.folego    / 100,
      quebra:    1 + globalPercent.quebra    / 100,
    };

    const porTipo = Object.fromEntries(
      ALL_MEMBER_TYPES.map((tipo) => [tipo, getSnapshotParaTipo(tipo)])
    ) as Record<GangMemberType, EstatisticasMembroSnapshot>;

    return { porTipo, global };
  },
}));

// ═════════════════════════════════════════════════════════════════════════════
// UTILITÁRIOS SÍNCRONOS (uso fora do React — gangStore, resolvers)
// ═════════════════════════════════════════════════════════════════════════════

export function getMultiplierSync(tipo: GangMemberType, stat: EstatisticaStat): number {
  return useGangEstatisticasStore.getState().getMultiplier(tipo, stat);
}

export function aplicarEstatistica(
  tipo: GangMemberType,
  stat: EstatisticaStat,
  base: number,
): number {
  return useGangEstatisticasStore.getState().getEstatisticaFinal(tipo, stat, base);
}

export function getSnapshotGangSync(): EstatisticasGangSnapshot {
  return useGangEstatisticasStore.getState().getSnapshotGang();
}

// ═════════════════════════════════════════════════════════════════════════════
// BRIDGE: FORMAÇÕES → BÔNUS DE ESTATÍSTICAS
// Chamado pelo gangStore.setFormation() automaticamente.
// ═════════════════════════════════════════════════════════════════════════════

const FORMACAO_BONUS: Record<GangFormationType, Partial<StatBonusPercent>> = {
  pressao_total: { rajada:  18, blindagem:  -8, folego:  -4, quebra: 14 },
  linha_fechada: { rajada:  -6, blindagem:  20, folego:  10, quebra: -4 },
  bote_certo:    { rajada:  10, blindagem:   0, folego:   0, quebra: 10 },
  cerco:         { rajada:   6, blindagem:   8, folego:   6, quebra:  6 },
  saque_rapido:  { rajada:   0, blindagem:  -6, folego:  -2, quebra:  4 },
};

/**
 * Converte uma formação no payload de bônus de estatísticas.
 * Uso no gangStore:
 *   useGangEstatisticasStore.getState().applyBonus(
 *     'formacao',
 *     getFormacaoBonusPayload(novaFormacao)
 *   );
 */
export function getFormacaoBonusPayload(formacao: GangFormationType): EstatisticaBonus {
  return {
    global: FORMACAO_BONUS[formacao] ?? {},
  };
}