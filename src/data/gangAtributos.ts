/**
 * data/gangAtributos.ts
 * Tabela canônica de ATRIBUTOS por tipo de membro e nível (1–10).
 * Substitui: AtributosGang.ts, GangMembros.ts, gangWarDefinitions.ts
 *
 * ─── ATRIBUTOS ≠ ESTATÍSTICAS ────────────────────────────────────────────────
 * Atributos: valores fixos do card, definidos por tipo + nível.
 *            NÃO sofrem influência de sistemas externos (formação, CT, etc.).
 * Estatísticas: multiplicadores de conta que amplificam os atributos em batalha.
 *               Gerenciadas pelo gangEstatisticasStore.ts.
 *
 * ─── MAPEAMENTO COM MAFIA CITY ───────────────────────────────────────────────
 *   rajada    → Attack   (dano ofensivo, base da pressão de batalha)
 *   blindagem → Defense  (redução de dano recebido)
 *   folego    → HP       (capacidade de sobrevivência)
 *   quebra    → Lethality/Damage (penetração e dano final)
 *
 * ─── FONTE ───────────────────────────────────────────────────────────────────
 * Tabela confirmada no backend: services/attack/resolveAttack.js
 * Os valores são idênticos — este arquivo é a versão TypeScript frontend.
 */

import type { GangAtributos, GangMemberType } from '@/types/gang';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═════════════════════════════════════════════════════════════════════════════

export type GangNivel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type AtributosPorNivel = Record<GangNivel, GangAtributos>;

// ═════════════════════════════════════════════════════════════════════════════
// TABELA CANÔNICA (backend resolveAttack.js / AtributosGang.ts original)
// ═════════════════════════════════════════════════════════════════════════════

export const ATRIBUTOS_GANG: Record<GangMemberType, AtributosPorNivel> = {

  // ─── CAPANGA ─────────────────────────────────────────────────────────────
  // Função: bonde + linha de frente. Alta blindagem e fôlego, rajada moderada.
  // Análogo Mafia City: Bulkers (tanque ofensivo)
  capanga: {
    1:  { rajada: 9,  blindagem: 13, folego: 12, quebra: 8  },
    2:  { rajada: 10, blindagem: 15, folego: 14, quebra: 9  },
    3:  { rajada: 11, blindagem: 17, folego: 16, quebra: 10 },
    4:  { rajada: 13, blindagem: 19, folego: 18, quebra: 11 },
    5:  { rajada: 15, blindagem: 21, folego: 20, quebra: 12 },
    6:  { rajada: 17, blindagem: 23, folego: 22, quebra: 13 },
    7:  { rajada: 19, blindagem: 25, folego: 24, quebra: 14 },
    8:  { rajada: 21, blindagem: 27, folego: 26, quebra: 15 },
    9:  { rajada: 23, blindagem: 29, folego: 28, quebra: 16 },
    10: { rajada: 25, blindagem: 31, folego: 30, quebra: 17 },
  },

  // ─── FRENTE ──────────────────────────────────────────────────────────────
  // Função: melee ofensivo pesado. Alta rajada e quebra, baixa blindagem.
  // Análogo Mafia City: Combaters (ataque direto)
  frente: {
    1:  { rajada: 12, blindagem: 9,  folego: 10, quebra: 12 },
    2:  { rajada: 14, blindagem: 10, folego: 11, quebra: 14 },
    3:  { rajada: 16, blindagem: 11, folego: 12, quebra: 16 },
    4:  { rajada: 18, blindagem: 12, folego: 13, quebra: 18 },
    5:  { rajada: 20, blindagem: 14, folego: 15, quebra: 21 },
    6:  { rajada: 22, blindagem: 15, folego: 16, quebra: 23 },
    7:  { rajada: 25, blindagem: 17, folego: 18, quebra: 26 },
    8:  { rajada: 27, blindagem: 18, folego: 19, quebra: 28 },
    9:  { rajada: 30, blindagem: 20, folego: 21, quebra: 31 },
    10: { rajada: 32, blindagem: 22, folego: 23, quebra: 34 },
  },

  // ─── EXECUTOR ────────────────────────────────────────────────────────────
  // Função: retaguarda devastadora. Alta quebra, longo alcance.
  // Análogo Mafia City: Shooters / Snipers (longa distância)
  executor: {
    1:  { rajada: 11, blindagem: 7,  folego: 9,  quebra: 12 },
    2:  { rajada: 13, blindagem: 8,  folego: 10, quebra: 14 },
    3:  { rajada: 15, blindagem: 9,  folego: 11, quebra: 16 },
    4:  { rajada: 17, blindagem: 10, folego: 12, quebra: 18 },
    5:  { rajada: 19, blindagem: 11, folego: 13, quebra: 21 },
    6:  { rajada: 21, blindagem: 12, folego: 14, quebra: 23 },
    7:  { rajada: 24, blindagem: 13, folego: 15, quebra: 26 },
    8:  { rajada: 26, blindagem: 14, folego: 16, quebra: 29 },
    9:  { rajada: 29, blindagem: 15, folego: 17, quebra: 32 },
    10: { rajada: 31, blindagem: 16, folego: 18, quebra: 35 },
  },

  // ─── ASSASSINO ───────────────────────────────────────────────────────────
  // Função: ofensivo veloz e letal. Rajada e quebra máximas, baixa blindagem.
  // Análogo Mafia City: Bikers femininas / Female Assaulters
  assassino: {
    1:  { rajada: 12, blindagem: 7,  folego: 8,  quebra: 13 },
    2:  { rajada: 14, blindagem: 8,  folego: 9,  quebra: 15 },
    3:  { rajada: 16, blindagem: 9,  folego: 10, quebra: 17 },
    4:  { rajada: 18, blindagem: 10, folego: 11, quebra: 20 },
    5:  { rajada: 20, blindagem: 11, folego: 12, quebra: 23 },
    6:  { rajada: 22, blindagem: 12, folego: 13, quebra: 26 },
    7:  { rajada: 25, blindagem: 13, folego: 14, quebra: 29 },
    8:  { rajada: 27, blindagem: 14, folego: 15, quebra: 32 },
    9:  { rajada: 30, blindagem: 15, folego: 16, quebra: 35 },
    10: { rajada: 33, blindagem: 16, folego: 17, quebra: 38 },
  },

  // ─── MURALHA ─────────────────────────────────────────────────────────────
  // Função: tanque puro. Blindagem e fôlego máximos, rajada mínima.
  // Análogo Mafia City: Tankers / Bulkers defensivos
  muralha: {
    1:  { rajada: 6,  blindagem: 15, folego: 16, quebra: 5  },
    2:  { rajada: 7,  blindagem: 17, folego: 18, quebra: 6  },
    3:  { rajada: 8,  blindagem: 19, folego: 20, quebra: 7  },
    4:  { rajada: 9,  blindagem: 21, folego: 22, quebra: 8  },
    5:  { rajada: 10, blindagem: 24, folego: 25, quebra: 9  },
    6:  { rajada: 11, blindagem: 26, folego: 27, quebra: 10 },
    7:  { rajada: 12, blindagem: 29, folego: 30, quebra: 11 },
    8:  { rajada: 13, blindagem: 31, folego: 32, quebra: 12 },
    9:  { rajada: 14, blindagem: 34, folego: 35, quebra: 13 },
    10: { rajada: 15, blindagem: 37, folego: 38, quebra: 14 },
  },

  // ─── CERTEIRO ────────────────────────────────────────────────────────────
  // Função: atiradores defensivos. Equilibrado, excelente na defesa do território.
  // Análogo Mafia City: Gunners / Male Shooters
  certeiro: {
    1:  { rajada: 9,  blindagem: 10, folego: 10, quebra: 8  },
    2:  { rajada: 10, blindagem: 11, folego: 11, quebra: 9  },
    3:  { rajada: 11, blindagem: 12, folego: 12, quebra: 10 },
    4:  { rajada: 12, blindagem: 13, folego: 13, quebra: 11 },
    5:  { rajada: 13, blindagem: 15, folego: 14, quebra: 12 },
    6:  { rajada: 14, blindagem: 16, folego: 15, quebra: 13 },
    7:  { rajada: 16, blindagem: 18, folego: 17, quebra: 15 },
    8:  { rajada: 17, blindagem: 19, folego: 18, quebra: 16 },
    9:  { rajada: 19, blindagem: 21, folego: 20, quebra: 18 },
    10: { rajada: 21, blindagem: 23, folego: 22, quebra: 20 },
  },

  // ─── MOTORISTA ───────────────────────────────────────────────────────────
  // Função: blindado defensivo. Blindagem e fôlego altos, suporte à marcha.
  // Análogo Mafia City: Vehicles (Carriers — defesa)
  motorista: {
    1:  { rajada: 7,  blindagem: 14, folego: 14, quebra: 7  },
    2:  { rajada: 8,  blindagem: 16, folego: 16, quebra: 8  },
    3:  { rajada: 9,  blindagem: 18, folego: 18, quebra: 9  },
    4:  { rajada: 10, blindagem: 20, folego: 20, quebra: 10 },
    5:  { rajada: 11, blindagem: 23, folego: 23, quebra: 11 },
    6:  { rajada: 12, blindagem: 25, folego: 25, quebra: 12 },
    7:  { rajada: 13, blindagem: 28, folego: 28, quebra: 13 },
    8:  { rajada: 14, blindagem: 30, folego: 30, quebra: 14 },
    9:  { rajada: 15, blindagem: 33, folego: 33, quebra: 15 },
    10: { rajada: 17, blindagem: 36, folego: 36, quebra: 17 },
  },

  // ─── NITRO ───────────────────────────────────────────────────────────────
  // Função: resistência pesada. Fôlego excepcional, tanque de alto dano sustentado.
  // Análogo Mafia City: Vehicles (Assault Vehicles — ofensivo)
  nitro: {
    1:  { rajada: 8,  blindagem: 13, folego: 15, quebra: 8  },
    2:  { rajada: 9,  blindagem: 15, folego: 17, quebra: 9  },
    3:  { rajada: 10, blindagem: 17, folego: 19, quebra: 10 },
    4:  { rajada: 11, blindagem: 19, folego: 21, quebra: 11 },
    5:  { rajada: 12, blindagem: 21, folego: 24, quebra: 12 },
    6:  { rajada: 13, blindagem: 23, folego: 26, quebra: 13 },
    7:  { rajada: 15, blindagem: 26, folego: 29, quebra: 15 },
    8:  { rajada: 17, blindagem: 28, folego: 32, quebra: 17 },
    9:  { rajada: 19, blindagem: 31, folego: 35, quebra: 19 },
    10: { rajada: 21, blindagem: 34, folego: 38, quebra: 21 },
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// METADADOS DOS TIPOS (labels, descrições, papéis)
// ═════════════════════════════════════════════════════════════════════════════

export type GangMemberMeta = {
  tipo: GangMemberType;
  nome: string;
  descricao: string;
  /** Custo de recrutamento (dinheiro sujo) */
  custoRecrutamento: number;
  /** Custo de treinamento por unidade (dinheiro sujo) */
  custoTreinamento: number;
  /** Manutenção diária por unidade */
  manutencaoDiaria: number;
  /** Papel na batalha — determina a coloração na UI */
  papel: 'linha_de_frente' | 'ofensivo' | 'tanque' | 'retaguarda';
};

export const GANG_MEMBER_META: Record<GangMemberType, GangMemberMeta> = {
  capanga: {
    tipo: 'capanga',
    nome: 'Capanga',
    descricao: 'Bonde da firma. Alta resistência e presença de frente.',
    custoRecrutamento: 1200,
    custoTreinamento: 700,
    manutencaoDiaria: 180,
    papel: 'linha_de_frente',
  },
  frente: {
    tipo: 'frente',
    nome: 'Frente',
    descricao: 'Entrada pesada. Dano crítico corpo a corpo.',
    custoRecrutamento: 1800,
    custoTreinamento: 950,
    manutencaoDiaria: 240,
    papel: 'ofensivo',
  },
  executor: {
    tipo: 'executor',
    nome: 'Executor',
    descricao: 'Finaliza na retaguarda. Longa distância, alto dano.',
    custoRecrutamento: 2600,
    custoTreinamento: 1400,
    manutencaoDiaria: 320,
    papel: 'retaguarda',
  },
  assassino: {
    tipo: 'assassino',
    nome: 'Assassino',
    descricao: 'Velocidade e letalidade. Quebra máxima, blindagem mínima.',
    custoRecrutamento: 3200,
    custoTreinamento: 1700,
    manutencaoDiaria: 380,
    papel: 'ofensivo',
  },
  muralha: {
    tipo: 'muralha',
    nome: 'Muralha',
    descricao: 'Escudo total. Absorve todo o dano da frente.',
    custoRecrutamento: 3000,
    custoTreinamento: 1600,
    manutencaoDiaria: 360,
    papel: 'tanque',
  },
  certeiro: {
    tipo: 'certeiro',
    nome: 'Certeiro',
    descricao: 'Atiradores defensivos. Excelentes na guarda do território.',
    custoRecrutamento: 2800,
    custoTreinamento: 1500,
    manutencaoDiaria: 330,
    papel: 'retaguarda',
  },
  motorista: {
    tipo: 'motorista',
    nome: 'Motorista',
    descricao: 'Blindagem e mobilidade. Protege tropas frágeis.',
    custoRecrutamento: 2300,
    custoTreinamento: 1300,
    manutencaoDiaria: 290,
    papel: 'tanque',
  },
  nitro: {
    tipo: 'nitro',
    nome: 'Nitro',
    descricao: 'Resistência pesada explosiva. Fôlego excepcional.',
    custoRecrutamento: 2500,
    custoTreinamento: 1350,
    manutencaoDiaria: 300,
    papel: 'linha_de_frente',
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// FUNÇÕES DE ACESSO
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Retorna os atributos base de um membro por tipo e nível.
 * Uso: getAtributos('capanga', 5) → { rajada: 15, blindagem: 21, folego: 20, quebra: 12 }
 */
export function getAtributos(tipo: GangMemberType, nivel: number): GangAtributos {
  const safeNivel = Math.max(1, Math.min(10, Math.floor(nivel))) as GangNivel;
  return ATRIBUTOS_GANG[tipo][safeNivel];
}

/**
 * Retorna os metadados de um tipo de membro (nome, custo, papel).
 */
export function getMeta(tipo: GangMemberType): GangMemberMeta {
  return GANG_MEMBER_META[tipo];
}

/**
 * Soma os atributos de uma lista de membros ativos (sem multiplicadores).
 * Para obter os valores com multiplicadores, use com gangEstatisticasStore.
 */
export function somarAtributosAtivos(
  members: Array<{ type: GangMemberType; level: number; status: string }>
): GangAtributos {
  let rajada = 0, blindagem = 0, folego = 0, quebra = 0;

  for (const member of members) {
    if (member.status !== 'ativo') continue;
    const attrs = getAtributos(member.type, member.level);
    rajada    += attrs.rajada;
    blindagem += attrs.blindagem;
    folego    += attrs.folego;
    quebra    += attrs.quebra;
  }

  return { rajada, blindagem, folego, quebra };
}

/**
 * Nível mínimo do barraco para desbloquear o nível de membro.
 * Análogo aos requisitos de Mansão no Mafia City.
 */
export const NIVEL_DESBLOQUEIO_BARRACO: Record<number, number> = {
  1: 1,
  2: 10,
  3: 20,
  4: 30,
  5: 40,
  6: 50,
  7: 60,
  8: 70,
  9: 80,
  10: 90,
};

export function getNivelMaxPorBarraco(barracoLevel: number): number {
  let maxNivel = 1;
  for (const [nivel, requerido] of Object.entries(NIVEL_DESBLOQUEIO_BARRACO)) {
    if (barracoLevel >= requerido) {
      maxNivel = Number(nivel);
    }
  }
  return maxNivel;
}
