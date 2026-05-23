/**
 * types/gang.ts
 * Tipos canônicos do sistema de gangue e ataque PVP.
 * Substitui: gangWar.ts, mapAttack.ts
 *
 * Regra de ouro: nenhum outro arquivo define GangMemberType, GangMember, etc.
 * Todos importam daqui.
 */

// ═════════════════════════════════════════════════════════════════════════════
// MEMBROS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * 8 tipos canônicos de membro.
 * Confirmado no backend: services/attack/resolveAttack.js e gangWarService.js
 * Pares por função (análogo ao Mafia City):
 *   muralha   + frente   → linha de frente (tanque + melee)
 *   capanga   + assassino→ bonde/ofensivo
 *   certeiro  + executor → longo alcance / retaguarda
 *   motorista + nitro    → blindado / resistência pesada
 */
export type GangMemberType =
  | 'capanga'
  | 'frente'
  | 'executor'
  | 'assassino'
  | 'muralha'
  | 'certeiro'
  | 'motorista'
  | 'nitro';

export type GangMemberStatus = 'ativo' | 'ferido' | 'morto' | 'treinando' | 'marchando';

/** Unidade individual de membro (análogo ao "crew member" do Mafia City). */
export type GangMember = {
  id: string;
  type: GangMemberType;
  level: number;            // 1–10
  status: GangMemberStatus;
  recruitedAt?: number;     // timestamp
  trainingEndsAt?: number | null;
  injuryEndsAt?: number | null;
  lastBattleAt?: number | null;
  activeAttackId?: string | null;
  marchingUntil?: string | null;

  // Calculado pelo backend a partir de atributos base + fontes de estatística.
  // Não salvar estes campos como atributo manual do membro.
  baseAttributes?: GangAtributos;
  bonusPercent?: GangAtributos;
  bonusFlat?: GangAtributos;
  effectiveStats?: GangAtributos;
  activeStatSources?: string[];
};

/** Alias para compatibilidade com código legado. */
export type GangUnit = GangMember;

/** Tipo principal da gangue — contém APENAS membros. */
export type Gang = {
  members: GangMember[];
  statSources?: GangStatSource[];
  statSnapshot?: GangStatSnapshot | null;
};

// ═════════════════════════════════════════════════════════════════════════════
// ATRIBUTOS (base por tipo+nível — imutável por sistemas externos)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Os 4 atributos base de cada membro.
 * Vêm da tabela ATRIBUTOS_GANG (data/gangAtributos.ts).
 * NÃO são modificados por formação, CT ou arsenal — isso é função das Estatísticas.
 *
 * rajada    = ataque   (Mafia City: Attack)
 * blindagem = defesa   (Mafia City: Defense)
 * folego    = vida     (Mafia City: HP)
 * quebra    = dano     (Mafia City: Lethality)
 */
export type GangAtributos = {
  rajada: number;
  blindagem: number;
  folego: number;
  quebra: number;
};

// ═════════════════════════════════════════════════════════════════════════════
// ESTATÍSTICAS ALIMENTADAS (bônus salvos por fonte; não alteram atributos base)
// ═════════════════════════════════════════════════════════════════════════════

export type GangStatSourceKind =
  | 'formacao'
  | 'ct'
  | 'arsenal'
  | 'suborno'
  | 'investimento'
  | 'faccao'
  | 'evento'
  | 'manual'
  | 'barraco'
  | 'loja'
  | 'item';

export type GangStatTargetScope = 'global' | 'type' | 'member';

export type GangStatSource = {
  id: string;
  source: GangStatSourceKind;
  label: string;
  targetScope: GangStatTargetScope;
  targetType?: GangMemberType | null;
  targetMemberId?: string | null;
  percent: GangAtributos;
  flat: GangAtributos;
  enabled: boolean;
  expiresAt?: string | null;
  updatedAtIso?: string | null;
};

export type GangMemberStatSnapshot = {
  id: string;
  type: GangMemberType;
  level: number;
  status: GangMemberStatus | string;
  baseAttributes: GangAtributos;
  bonusPercent: GangAtributos;
  bonusFlat: GangAtributos;
  effectiveStats: GangAtributos;
  activeStatSources: string[];
};

export type GangStatSnapshot = {
  members: GangMemberStatSnapshot[];
  statSources: GangStatSource[];
  totals: {
    baseAttributes: GangAtributos;
    bonusPercentAverage: GangAtributos;
    bonusFlat: GangAtributos;
    effectiveStats: GangAtributos;
  };
  summary: GangBattleStats;
  updatedAtIso: string;
};

// ═════════════════════════════════════════════════════════════════════════════
// FORMAÇÕES (análogo às formações de tropa do Mafia City)
// ═════════════════════════════════════════════════════════════════════════════

export type GangFormationType =
  | 'pressao_total'
  | 'linha_fechada'
  | 'bote_certo'
  | 'cerco'
  | 'saque_rapido';

// ═════════════════════════════════════════════════════════════════════════════
// TREINAMENTO (por CT do mapa — 4 CTs, 1 slot cada, compartilhado)
// ═════════════════════════════════════════════════════════════════════════════

/** Chaves dos 4 CTs fixos no mapa. */
export type CTKey = 'ct_nw' | 'ct_ne' | 'ct_sw' | 'ct_se';

/** Job de treinamento em andamento em um CT. */
export type GangTrainingJob = {
  id: string;
  batchId: string;
  memberIds?: string[];
  memberType: GangMemberType;
  quantity: number;
  fromLevel: number;
  toLevel: number;
  costDirtyMoney: number;
  startedAt: string;        // ISO
  endsAt: string;           // ISO
  completed: boolean;
};

// ═════════════════════════════════════════════════════════════════════════════
// CT (Centro de Treinamento)
// ═════════════════════════════════════════════════════════════════════════════

export type GangCTState = {
  level: number;
  maxLevel: number;
  trainingSlots: number;
  recoveryBonusPercent: number;
  trainingSpeedBonusPercent: number;
  gangCapacityBonus: number;
};

// ═════════════════════════════════════════════════════════════════════════════
// STATS DE BATALHA (calculadas — soma dos membros ativos)
// ═════════════════════════════════════════════════════════════════════════════

/** Stats agregadas de combate da gangue inteira. Alimentam o motor de batalha. */
export type GangBattleStats = {
  // Composição
  totalMembers: number;
  ativos: number;
  feridos: number;
  mortos: number;

  // Atributos agregados (soma de todos os membros ativos × estatísticas)
  rajada: number;
  blindagem: number;
  folego: number;
  quebra: number;

  // Poderes especiais (derivados dos tipos de membro)
  medicalPower: number;
  lootPower: number;
  mobilityPower: number;

  // Poder total calculado (usado para estimativa de vitória)
  totalPower: number;
};

// ═════════════════════════════════════════════════════════════════════════════
// BAIXAS DE BATALHA
// ═════════════════════════════════════════════════════════════════════════════

export type GangLossesByType = Record<GangMemberType, number>;

export type GangBattleCasualties = {
  mortos: GangLossesByType;
  feridos: GangLossesByType;
  preservadosPeloMedico: number;
};

// ═════════════════════════════════════════════════════════════════════════════
// SNAPSHOT DO ESTADO DA GANGUE (retornado pelo backend)
// ═════════════════════════════════════════════════════════════════════════════

export type GangStateSnapshot = {
  members: GangUnit[];
  ct: GangCTState;
  trainingJobs: GangTrainingJob[];
  formation: GangFormationType;
  maxMembers: number;
  gangLevel: number;
  dailyUpkeep: {
    totalDirtyMoneyCost: number;
    byType: Record<GangMemberType, number>;
  };
  trainingConfig: {
    quantityPerOrder: number;
    durationSeconds: number;
    slots: number;
  };
  statSources?: GangStatSource[];
  statSnapshot?: GangStatSnapshot | null;
  troopSummary: {
    totalMembers: number;
    activeMembers: number;
    injuredMembers: number;
    deadMembers: number;
    trainingMembers: number;
    byType: Record<GangMemberType, number>;
    activeByType: Record<GangMemberType, number>;
  };
};

export type GangApiEnvelope = {
  gang: GangStateSnapshot;
  playerBalances?: {
    dirtyMoney: number;
    cleanMoney: number;
    corre: number;
  };
};

// ═════════════════════════════════════════════════════════════════════════════
// SELEÇÃO DE TROPAS PARA ATAQUE (Mafia City style: quantidade por tipo)
// ═════════════════════════════════════════════════════════════════════════════

export type GangTroopSelection = {
  type: GangMemberType;
  quantity: number;
};

/** Record de quantidade por tipo (usado no GangAttackModal). */
export type GangAttackSelection = Record<GangMemberType, number>;

// ═════════════════════════════════════════════════════════════════════════════
// ATAQUE PVP — ALVO E ORIGEM
// ═════════════════════════════════════════════════════════════════════════════

export type AttackTarget = {
  playerId: string;
  playerName: string;
  tileX: number;
  tileY: number;
  barracoLevel?: number;
  power?: number;
  dirtyMoney?: number;
  factionId?: string | null;
  factionName?: string | null;
  avatarUrl?: string | null;
};

export type AttackOrigin = {
  playerId: string;
  playerName: string;
  tileX: number;
  tileY: number;
};

// ═════════════════════════════════════════════════════════════════════════════
// ESPÓLIOS DE BATALHA
// ═════════════════════════════════════════════════════════════════════════════

export type BattleSpoils = {
  dirtyMoneyLoot: number;
  correLoot: number;
  prestigeLoot: number;
  brokenLuxuryItemId?: string | null;
  brokenLuxuryItemName?: string | null;
  brokenLuxuryItemValue?: number | null;
  luxuryConvertedDirtyMoney: number;
};

// ═════════════════════════════════════════════════════════════════════════════
// RESOLUÇÃO DE BATALHA (retornada pelo backend)
// ═════════════════════════════════════════════════════════════════════════════

export type BattleResolution = {
  success: boolean;
  loot: number;
  chance: number;
  attackerPower: number;
  defenderPower: number;
  message: string;
  critical: boolean;
  spoils: BattleSpoils;
  attackerGangLosses?: GangBattleCasualties;
  defenderGangLosses?: GangBattleCasualties;
  attackerGangStats?: GangBattleStats;
  defenderGangStats?: GangBattleStats;
};

// ═════════════════════════════════════════════════════════════════════════════
// FASES DO ATAQUE (máquina de estados do MapAttackStore)
// ═════════════════════════════════════════════════════════════════════════════

export type MapAttackPhase =
  | 'idle'       // sem ataque em andamento
  | 'selecting'  // jogador está selecionando tropas
  | 'preview'    // mostrando estimativa antes de confirmar
  | 'moving'     // squad animando em direção ao alvo
  | 'arriving'   // chegando ao alvo
  | 'resolving'  // aguardando resultado do backend
  | 'returning'  // squad voltando para a base
  | 'finished';  // ciclo encerrado

// ═════════════════════════════════════════════════════════════════════════════
// ROTA E POSIÇÃO 3D
// ═════════════════════════════════════════════════════════════════════════════

export type RouteTile = {
  tileX: number;
  tileY: number;
};

export type SquadWorldPosition = {
  x: number;
  y: number;
  z: number;
};

// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTES ÚTEIS
// ═════════════════════════════════════════════════════════════════════════════

export const ALL_GANG_MEMBER_TYPES: GangMemberType[] = [
  'capanga',
  'frente',
  'executor',
  'assassino',
  'muralha',
  'certeiro',
  'motorista',
  'nitro',
];

export const CT_KEYS: CTKey[] = ['ct_nw', 'ct_ne', 'ct_sw', 'ct_se'];

export const CT_LABELS: Record<CTKey, string> = {
  ct_nw: 'CT Norte Oeste',
  ct_ne: 'CT Norte Leste',
  ct_sw: 'CT Sul Oeste',
  ct_se: 'CT Sul Leste',
};

export function emptyGangAttackSelection(): GangAttackSelection {
  return {
    capanga: 0,
    frente: 0,
    executor: 0,
    assassino: 0,
    muralha: 0,
    certeiro: 0,
    motorista: 0,
    nitro: 0,
  };
}

export function emptyGangLossesByType(): GangLossesByType {
  return {
    capanga: 0,
    frente: 0,
    executor: 0,
    assassino: 0,
    muralha: 0,
    certeiro: 0,
    motorista: 0,
    nitro: 0,
  };
}
