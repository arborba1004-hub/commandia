import type {
  GangCTState,
  GangMemberDefinition,
  GangMemberType,
} from '@/types/gangWar';

export const GANG_MAX_MEMBER_LEVEL = 10;
export const GANG_BASE_CAPACITY   = 12;
export const GANG_CT_MAX_LEVEL    = 10;

export const DEFAULT_GANG_CT_STATE: GangCTState = {
  level:                    1,
  maxLevel:                 GANG_CT_MAX_LEVEL,
  trainingSlots:            1,
  recoveryBonusPercent:     0,
  trainingSpeedBonusPercent: 0,
  gangCapacityBonus:        0,
};

// ─────────────────────────────────────────────
// CAMADAS DE FORMAÇÃO (sistema de layers)
//
//  Frente → absorve primeiro
//  Retaguarda → atingida por último (exceto pelo BONDE)
//
//  Camada | Tipo       | Alcance | Posição
//    1    | muralha    |    1    | frente absoluta
//    2    | motorista  |    1    | defesa secundária
//    3    | frente     |    1    | ofensiva melee
//    4    | nitro      |    1    | melee com BONDE
//    5    | capanga    |    4    | ranged curto + BONDE
//    6    | wifi       |    5    | ranged médio
//    7    | certeiro   |    8    | ranged longo
//    8    | executor   |   10    | retaguarda devastadora
// ─────────────────────────────────────────────
export const BATTLE_LAYERS: Record<GangMemberType, number> = {
  muralha:    1,
  motorista:  2,
  frente:     3,
  nitro:      4,
  capanga:    5,
  wifi:       6,
  certeiro:   7,
  executor:   8,
  // Tipos de suporte/econômico — posicionados junto à retaguarda
  assassino:  5,
  armeiro:    6,
  informante: 5,
  medico:     7,
  lavador:    7,
  ladrao:     5,
  negociador: 6,
};

// Tipos com talento BONDE (bypass das camadas 1-4, atacam direto camadas 5-8)
export const BONDE_TYPES: GangMemberType[] = ['nitro', 'capanga'];

// Tipos ranged (alvos prioritários do BONDE)
export const RANGED_TYPES: GangMemberType[] = ['wifi', 'certeiro', 'executor', 'armeiro', 'informante', 'medico', 'lavador', 'ladrao', 'negociador'];

// ─────────────────────────────────────────────
// DEFINIÇÕES DOS MEMBROS
// ─────────────────────────────────────────────
export const GANG_MEMBER_DEFINITIONS: Record<GangMemberType, GangMemberDefinition> = {
  // ─── CAMADA 1: ESCUDO FRONTAL ───────────────
  muralha: {
    type:  'muralha',
    label: 'Muralha',
    description: 'Tanque da gangue. Absorve todo o dano da frente, protegendo os de trás. Não mata muito, mas sem ele o bonde todo cai.',
    role:  'linha_de_frente',
    recruitBaseCostDirtyMoney:    3000,
    trainingBaseCostDirtyMoney:   1600,
    maintenanceBaseCostDirtyMoney: 360,
    trainingBaseHours:  4,
    casualtyWeight:     0.8,
    battlePriority:     6,
    battleLayer:        1,
    talent:             'colete',         // reduz dano de Certeiros e Wifis em 30%
    hasBonde:           false,
    isRanged:           false,
    baseStats: { rajada: 4, blindagem: 10, folego: 10, quebra: 4 },
    special: {},
  },

  // ─── CAMADA 2: DEFESA SECUNDÁRIA ────────────
  motorista: {
    type:  'motorista',
    label: 'Motorista',
    description: 'Mobilidade e cobertura. Ganha bônus de blindagem ao atacar território alheio.',
    role:  'tatico',
    recruitBaseCostDirtyMoney:    2300,
    trainingBaseCostDirtyMoney:   1300,
    maintenanceBaseCostDirtyMoney: 290,
    trainingBaseHours:  3,
    casualtyWeight:     1.0,
    battlePriority:     6,
    battleLayer:        2,
    talent:             'cobertura',      // +blindagem ao atacar território
    hasBonde:           false,
    isRanged:           false,
    baseStats: { rajada: 6, blindagem: 6, folego: 7, quebra: 7 },
    special: { mobilityPower: 8 },
  },

  // ─── CAMADA 3: OFENSIVA MELEE ────────────────
  frente: {
    type:  'frente',
    label: 'Frente',
    description: 'Linha de entrada pesada. Dano crítico contra Capangas. Chance de causar 3× dano.',
    role:  'linha_de_frente',
    recruitBaseCostDirtyMoney:    1800,
    trainingBaseCostDirtyMoney:    950,
    maintenanceBaseCostDirtyMoney: 240,
    trainingBaseHours:  3,
    casualtyWeight:     1.15,
    battlePriority:     9,
    battleLayer:        3,
    talent:             'porrada',        // dano crítico vs Capangas, chance de 3× dano
    hasBonde:           false,
    isRanged:           false,
    baseStats: { rajada: 9, blindagem: 6, folego: 8, quebra: 7 },
    special: {},
  },

  executor: {
    type:  'executor',
    label: 'Executor',
    description: 'Finalização pesada. Fica na retaguarda e detona alvos de longa distância. +ataque ao invadir barraco.',
    role:  'linha_de_frente',
    recruitBaseCostDirtyMoney:    2600,
    trainingBaseCostDirtyMoney:   1400,
    maintenanceBaseCostDirtyMoney: 320,
    trainingBaseHours:  4,
    casualtyWeight:     1.1,
    battlePriority:     8,
    battleLayer:        8,               // retaguarda — camada 8
    talent:             'pesado',        // altíssimo dano; +ataque ao invadir barraco
    hasBonde:           false,
    isRanged:           true,
    baseStats: { rajada: 9, blindagem: 6, folego: 7, quebra: 9 },
    special: {},
  },

  assassino: {
    type:  'assassino',
    label: 'Assassino',
    description: 'Ofensiva letal e silenciosa. Alta rajada mas blindagem baixa.',
    role:  'tatico',
    recruitBaseCostDirtyMoney:    3200,
    trainingBaseCostDirtyMoney:   1700,
    maintenanceBaseCostDirtyMoney: 380,
    trainingBaseHours:  4,
    casualtyWeight:     1.25,
    battlePriority:     7,
    battleLayer:        5,
    talent:             'silencioso',    // reduz chance de retaliação
    hasBonde:           false,
    isRanged:           true,
    baseStats: { rajada: 10, blindagem: 4, folego: 6, quebra: 9 },
    special: {},
  },

  // ─── CAMADA 4 + BONDE: MELEE COM BYPASS ─────
  nitro: {
    type:  'nitro',
    label: 'Nitro',
    description: 'Explosão ofensiva. Tem o talento BONDE — bypassa as camadas da frente e ataca diretamente quem fica atrás.',
    role:  'tatico',
    recruitBaseCostDirtyMoney:    2500,
    trainingBaseCostDirtyMoney:   1350,
    maintenanceBaseCostDirtyMoney: 300,
    trainingBaseHours:  3,
    casualtyWeight:     1.1,
    battlePriority:     6,
    battleLayer:        4,
    talent:             'bonde',         // BONDE: bypassa camadas 1-4 e ataca ranged
    hasBonde:           true,
    isRanged:           false,
    baseStats: { rajada: 8, blindagem: 4, folego: 6, quebra: 6 },
    special: { mobilityPower: 6 },
  },

  // ─── CAMADA 5: RANGED CURTO + BONDE ──────────
  capanga: {
    type:  'capanga',
    label: 'Capanga',
    description: 'Base numérica da firma. Tem talento BONDE — ataca direto a retaguarda inimiga. Bônus extra em confrontos por recursos.',
    role:  'linha_de_frente',
    recruitBaseCostDirtyMoney:    1200,
    trainingBaseCostDirtyMoney:    700,
    maintenanceBaseCostDirtyMoney: 180,
    trainingBaseHours:  2,
    casualtyWeight:     1.05,
    battlePriority:     10,
    battleLayer:        5,
    talent:             'bonde',         // BONDE + bônus em roubo de recursos
    hasBonde:           true,
    isRanged:           true,
    baseStats: { rajada: 7, blindagem: 6, folego: 7, quebra: 6 },
    special: {},
  },

  // ─── CAMADA 5-6: RANGED ESPECIALISTAS ────────
  certeiro: {
    type:  'certeiro',
    label: 'Certeiro',
    description: 'Precisão de longa distância. Muito eficaz na defesa do território. Fraco no ataque frontal.',
    role:  'tatico',
    recruitBaseCostDirtyMoney:    2800,
    trainingBaseCostDirtyMoney:   1500,
    maintenanceBaseCostDirtyMoney: 330,
    trainingBaseHours:  4,
    casualtyWeight:     1.15,
    battlePriority:     7,
    battleLayer:        7,
    talent:             'mira',          // +ataque ao defender território
    hasBonde:           false,
    isRanged:           true,
    baseStats: { rajada: 9, blindagem: 4, folego: 6, quebra: 7 },
    special: {},
  },

  wifi: {
    type:  'wifi',
    label: 'WiFi',
    description: 'Coordenação do bonde. Velocidade de ataque dupla, mas pouco efetivo contra Muralhas.',
    role:  'tatico',
    recruitBaseCostDirtyMoney:    2200,
    trainingBaseCostDirtyMoney:   1200,
    maintenanceBaseCostDirtyMoney: 260,
    trainingBaseHours:  3,
    casualtyWeight:     1.15,
    battlePriority:     4,
    battleLayer:        6,
    talent:             'fogo_duplo',    // ataque 2× mais rápido; -eficácia vs muralhas
    hasBonde:           false,
    isRanged:           true,
    baseStats: { rajada: 3, blindagem: 4, folego: 6, quebra: 3 },
    special: { coordinationPower: 10 },
  },

  armeiro: {
    type:  'armeiro',
    label: 'Armeiro',
    description: 'Sustenta o poder de fogo. Potencializa o weaponPower da formação.',
    role:  'tatico',
    recruitBaseCostDirtyMoney:    2600,
    trainingBaseCostDirtyMoney:   1400,
    maintenanceBaseCostDirtyMoney: 310,
    trainingBaseHours:  3,
    casualtyWeight:     1.0,
    battlePriority:     5,
    battleLayer:        6,
    talent:             'arsenal_vivo',  // +weaponPower global da formação
    hasBonde:           false,
    isRanged:           true,
    baseStats: { rajada: 6, blindagem: 5, folego: 6, quebra: 8 },
    special: { weaponPower: 9 },
  },

  informante: {
    type:  'informante',
    label: 'Informante',
    description: 'Leitura tática. Aumenta o intelPower — melhora estimativas e reduz surpresas.',
    role:  'tatico',
    recruitBaseCostDirtyMoney:    2400,
    trainingBaseCostDirtyMoney:   1250,
    maintenanceBaseCostDirtyMoney: 280,
    trainingBaseHours:  3,
    casualtyWeight:     1.2,
    battlePriority:     5,
    battleLayer:        5,
    talent:             'antena',        // +intelPower; revela stats do inimigo
    hasBonde:           false,
    isRanged:           true,
    baseStats: { rajada: 5, blindagem: 4, folego: 6, quebra: 5 },
    special: { intelPower: 10 },
  },

  // ─── CAMADA 7: SUPORTE ────────────────────────
  medico: {
    type:  'medico',
    label: 'Médico',
    description: 'Converte mortos em feridos. Quanto mais médicos, menos baixas permanentes em batalha.',
    role:  'suporte',
    recruitBaseCostDirtyMoney:    3400,
    trainingBaseCostDirtyMoney:   1800,
    maintenanceBaseCostDirtyMoney: 400,
    trainingBaseHours:  4,
    casualtyWeight:     0.95,
    battlePriority:     4,
    battleLayer:        7,
    talent:             'salva_vidas',   // +medicalPower; reduz mortes permanentes
    hasBonde:           false,
    isRanged:           true,
    baseStats: { rajada: 2, blindagem: 4, folego: 9, quebra: 2 },
    special: { medicalPower: 12 },
  },

  negociador: {
    type:  'negociador',
    label: 'Negociador',
    description: 'Reduz custo de recrutamento e manutenção. Aumenta o negotiationPower.',
    role:  'suporte',
    recruitBaseCostDirtyMoney:    2600,
    trainingBaseCostDirtyMoney:   1350,
    maintenanceBaseCostDirtyMoney: 280,
    trainingBaseHours:  3,
    casualtyWeight:     1.05,
    battlePriority:     3,
    battleLayer:        6,
    talent:             'conversa',      // -custo de upkeep da gangue
    hasBonde:           false,
    isRanged:           true,
    baseStats: { rajada: 2, blindagem: 5, folego: 6, quebra: 2 },
    special: { negotiationPower: 10 },
  },

  // ─── CAMADA 7: ECONÔMICO ─────────────────────
  lavador: {
    type:  'lavador',
    label: 'Lavador',
    description: 'Sustentação financeira. Gera economyPower — aumenta ganhos de lavagem de dinheiro.',
    role:  'economico',
    recruitBaseCostDirtyMoney:    2800,
    trainingBaseCostDirtyMoney:   1450,
    maintenanceBaseCostDirtyMoney: 290,
    trainingBaseHours:  3,
    casualtyWeight:     1.05,
    battlePriority:     3,
    battleLayer:        7,
    talent:             'giro_limpo',    // +economyPower; bônus em lavagem
    hasBonde:           false,
    isRanged:           true,
    baseStats: { rajada: 2, blindagem: 4, folego: 7, quebra: 2 },
    special: { economyPower: 10 },
  },

  ladrao: {
    type:  'ladrao',
    label: 'Ladrão',
    description: 'Especialista em saque. Aumenta o lootPower — você rouba mais dinheiro sujo por ataque.',
    role:  'economico',
    recruitBaseCostDirtyMoney:    2100,
    trainingBaseCostDirtyMoney:   1150,
    maintenanceBaseCostDirtyMoney: 240,
    trainingBaseHours:  3,
    casualtyWeight:     1.1,
    battlePriority:     4,
    battleLayer:        5,
    talent:             'gatuno',        // +lootPower; bônus de saque em ataque bem-sucedido
    hasBonde:           false,
    isRanged:           true,
    baseStats: { rajada: 5, blindagem: 4, folego: 6, quebra: 5 },
    special: { lootPower: 10 },
  },
};

export function getGangMemberDefinition(type: GangMemberType): GangMemberDefinition {
  return GANG_MEMBER_DEFINITIONS[type];
}

export function getCTStateFromLevel(level: number): GangCTState {
  const safeLevel = Math.max(1, Math.min(GANG_CT_MAX_LEVEL, Number(level || 1)));

  return {
    level:                    safeLevel,
    maxLevel:                 GANG_CT_MAX_LEVEL,
    trainingSlots:            1 + Math.floor((safeLevel - 1) / 2),
    recoveryBonusPercent:     (safeLevel - 1) * 4,
    trainingSpeedBonusPercent:(safeLevel - 1) * 5,
    gangCapacityBonus:        (safeLevel - 1) * 4,
  };
}

/** Custo de upgrade do CT: 4000 × 1.35^(N-1) */
export function getCTUpgradeCost(currentLevel: number): number {
  return Math.round(4000 * Math.pow(1.35, Math.max(0, currentLevel - 1)));
}
