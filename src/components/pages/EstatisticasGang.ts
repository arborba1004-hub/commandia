import type { GangMemberType } from '@/components/gang/GangMembros';
import {
  getGangAtributos,
  getGangAtributosComando,
  type GangAtributos,
} from '@/components/gang/AtributosGang';

export type GangNivelBase = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type GangStatKey = keyof GangAtributos;

export type PartialGangAtributos = Partial<GangAtributos>;

export type GangStatSource =
  | 'base'
  | 'galeria'
  | 'fuga'
  | 'barraco'
  | 'arsenal'
  | 'investimento'
  | 'suborno'
  | 'faccao_investimento'
  | 'compras_reais'
  | 'evento'
  | 'manual';

export type GangMemberBaseConfig = {
  nivel: GangNivelBase;
  comando?: boolean;
  quantidade?: number;
};

export type GangMembersBaseConfig = Record<GangMemberType, GangMemberBaseConfig>;

export type GangStatModifier = {
  id: string;
  source: GangStatSource;
  target: GangMemberType | 'all';
  enabled?: boolean;
  flat?: PartialGangAtributos;
  percent?: PartialGangAtributos;
  note?: string;
};

export type GangStatSourceMap = Record<GangStatSource, GangStatModifier[]>;

export type GangMemberResolvedStats = {
  memberType: GangMemberType;
  nivel: GangNivelBase;
  comando: boolean;
  quantidade: number;
  base: GangAtributos;
  bonusFlat: GangAtributos;
  bonusPercent: GangAtributos;
  finalUnit: GangAtributos;
  finalTotal: GangAtributos;
  appliedModifiers: GangStatModifier[];
};

export type GangStatsSnapshot = {
  members: Record<GangMemberType, GangMemberResolvedStats>;
  sources: GangStatSourceMap;
};

export const ALL_GANG_STAT_SOURCES: GangStatSource[] = [
  'base',
  'galeria',
  'fuga',
  'barraco',
  'arsenal',
  'investimento',
  'suborno',
  'faccao_investimento',
  'compras_reais',
  'evento',
  'manual',
];

export const DEFAULT_GANG_BASE_CONFIG: GangMembersBaseConfig = {
  capanga: { nivel: 1, comando: false, quantidade: 1 },
  frente: { nivel: 1, comando: false, quantidade: 1 },
  executor: { nivel: 1, comando: false, quantidade: 1 },
  assassino: { nivel: 1, comando: false, quantidade: 1 },
  muralha: { nivel: 1, comando: false, quantidade: 1 },
  certeiro: { nivel: 1, comando: false, quantidade: 1 },
  motorista: { nivel: 1, comando: false, quantidade: 1 },
  nitro: { nivel: 1, comando: false, quantidade: 1 },
};

export function createEmptyGangAtributos(): GangAtributos {
  return {
    rajada: 0,
    blindagem: 0,
    folego: 0,
    quebra: 0,
  };
}

export function cloneGangAtributos(value: GangAtributos): GangAtributos {
  return {
    rajada: Number(value.rajada || 0),
    blindagem: Number(value.blindagem || 0),
    folego: Number(value.folego || 0),
    quebra: Number(value.quebra || 0),
  };
}

export function createEmptyGangStatSourceMap(): GangStatSourceMap {
  return {
    base: [],
    galeria: [],
    fuga: [],
    barraco: [],
    arsenal: [],
    investimento: [],
    suborno: [],
    faccao_investimento: [],
    compras_reais: [],
    evento: [],
    manual: [],
  };
}

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toPositiveInt(value: unknown, fallback = 1) {
  const numeric = Math.floor(toNumber(value, fallback));
  return numeric > 0 ? numeric : fallback;
}

function normalizeGangNivel(value: unknown): GangNivelBase {
  const numeric = Math.floor(toNumber(value, 1));

  if (numeric <= 1) return 1;
  if (numeric >= 10) return 10;
  return numeric as GangNivelBase;
}

function normalizePartialGangAtributos(
  value?: PartialGangAtributos | null
): GangAtributos {
  return {
    rajada: toNumber(value?.rajada, 0),
    blindagem: toNumber(value?.blindagem, 0),
    folego: toNumber(value?.folego, 0),
    quebra: toNumber(value?.quebra, 0),
  };
}

function addGangAtributos(base: GangAtributos, extra: GangAtributos): GangAtributos {
  return {
    rajada: base.rajada + extra.rajada,
    blindagem: base.blindagem + extra.blindagem,
    folego: base.folego + extra.folego,
    quebra: base.quebra + extra.quebra,
  };
}

function multiplyGangAtributos(base: GangAtributos, factor: number): GangAtributos {
  return {
    rajada: base.rajada * factor,
    blindagem: base.blindagem * factor,
    folego: base.folego * factor,
    quebra: base.quebra * factor,
  };
}

function applyPercentGangAtributos(
  base: GangAtributos,
  percent: GangAtributos
): GangAtributos {
  return {
    rajada: Math.round(base.rajada * (1 + percent.rajada / 100)),
    blindagem: Math.round(base.blindagem * (1 + percent.blindagem / 100)),
    folego: Math.round(base.folego * (1 + percent.folego / 100)),
    quebra: Math.round(base.quebra * (1 + percent.quebra / 100)),
  };
}

function normalizeGangStatModifier(
  modifier: GangStatModifier
): GangStatModifier {
  return {
    id: String(modifier.id),
    source: modifier.source,
    target: modifier.target,
    enabled: modifier.enabled !== false,
    flat: normalizePartialGangAtributos(modifier.flat),
    percent: normalizePartialGangAtributos(modifier.percent),
    note: modifier.note,
  };
}

export function hydrateGangStatSourceMap(
  input?: Partial<Record<GangStatSource, GangStatModifier[]>>
): GangStatSourceMap {
  const hydrated = createEmptyGangStatSourceMap();

  if (!input) {
    return hydrated;
  }

  for (const source of ALL_GANG_STAT_SOURCES) {
    const modifiers = Array.isArray(input[source]) ? input[source] : [];
    hydrated[source] = modifiers.map(normalizeGangStatModifier);
  }

  return hydrated;
}

export function upsertGangStatModifier(
  sourceMap: GangStatSourceMap,
  modifier: GangStatModifier
): GangStatSourceMap {
  const hydrated = hydrateGangStatSourceMap(sourceMap);
  const normalized = normalizeGangStatModifier(modifier);

  const nextList = [...hydrated[normalized.source]];
  const existingIndex = nextList.findIndex((item) => item.id === normalized.id);

  if (existingIndex >= 0) {
    nextList[existingIndex] = normalized;
  } else {
    nextList.push(normalized);
  }

  hydrated[normalized.source] = nextList;
  return hydrated;
}

export function removeGangStatModifier(
  sourceMap: GangStatSourceMap,
  source: GangStatSource,
  modifierId: string
): GangStatSourceMap {
  const hydrated = hydrateGangStatSourceMap(sourceMap);

  hydrated[source] = hydrated[source].filter((item) => item.id !== modifierId);
  return hydrated;
}

export function getGangBaseAtributos(
  memberType: GangMemberType,
  nivel: GangNivelBase,
  comando = false
): GangAtributos {
  return comando
    ? cloneGangAtributos(getGangAtributosComando(memberType))
    : cloneGangAtributos(getGangAtributos(memberType, nivel));
}

export function buildGangMemberResolvedStats(
  memberType: GangMemberType,
  baseConfig: GangMemberBaseConfig,
  sourceMap: GangStatSourceMap
): GangMemberResolvedStats {
  const nivel = normalizeGangNivel(baseConfig.nivel);
  const comando = Boolean(baseConfig.comando);
  const quantidade = toPositiveInt(baseConfig.quantidade, 1);

  const base = getGangBaseAtributos(memberType, nivel, comando);
  let bonusFlat = createEmptyGangAtributos();
  let bonusPercent = createEmptyGangAtributos();
  const appliedModifiers: GangStatModifier[] = [];

  for (const source of ALL_GANG_STAT_SOURCES) {
    for (const rawModifier of sourceMap[source]) {
      const modifier = normalizeGangStatModifier(rawModifier);
      if (!modifier.enabled) continue;
      if (modifier.target !== 'all' && modifier.target !== memberType) continue;

      bonusFlat = addGangAtributos(
        bonusFlat,
        normalizePartialGangAtributos(modifier.flat)
      );

      bonusPercent = addGangAtributos(
        bonusPercent,
        normalizePartialGangAtributos(modifier.percent)
      );

      appliedModifiers.push(modifier);
    }
  }

  const basePlusFlat = addGangAtributos(base, bonusFlat);
  const finalUnit = applyPercentGangAtributos(basePlusFlat, bonusPercent);
  const finalTotal = multiplyGangAtributos(finalUnit, quantidade);

  return {
    memberType,
    nivel,
    comando,
    quantidade,
    base,
    bonusFlat,
    bonusPercent,
    finalUnit,
    finalTotal,
    appliedModifiers,
  };
}

export function buildGangStatsSnapshot(params?: {
  baseConfig?: Partial<GangMembersBaseConfig>;
  sources?: Partial<Record<GangStatSource, GangStatModifier[]>>;
}): GangStatsSnapshot {
  const sourceMap = hydrateGangStatSourceMap(params?.sources);

  const mergedBaseConfig: GangMembersBaseConfig = {
    capanga: {
      ...DEFAULT_GANG_BASE_CONFIG.capanga,
      ...(params?.baseConfig?.capanga ?? {}),
    },
    frente: {
      ...DEFAULT_GANG_BASE_CONFIG.frente,
      ...(params?.baseConfig?.frente ?? {}),
    },
    executor: {
      ...DEFAULT_GANG_BASE_CONFIG.executor,
      ...(params?.baseConfig?.executor ?? {}),
    },
    assassino: {
      ...DEFAULT_GANG_BASE_CONFIG.assassino,
      ...(params?.baseConfig?.assassino ?? {}),
    },
    muralha: {
      ...DEFAULT_GANG_BASE_CONFIG.muralha,
      ...(params?.baseConfig?.muralha ?? {}),
    },
    certeiro: {
      ...DEFAULT_GANG_BASE_CONFIG.certeiro,
      ...(params?.baseConfig?.certeiro ?? {}),
    },
    motorista: {
      ...DEFAULT_GANG_BASE_CONFIG.motorista,
      ...(params?.baseConfig?.motorista ?? {}),
    },
    nitro: {
      ...DEFAULT_GANG_BASE_CONFIG.nitro,
      ...(params?.baseConfig?.nitro ?? {}),
    },
  };

  return {
    members: {
      capanga: buildGangMemberResolvedStats(
        'capanga',
        mergedBaseConfig.capanga,
        sourceMap
      ),
      frente: buildGangMemberResolvedStats(
        'frente',
        mergedBaseConfig.frente,
        sourceMap
      ),
      executor: buildGangMemberResolvedStats(
        'executor',
        mergedBaseConfig.executor,
        sourceMap
      ),
      assassino: buildGangMemberResolvedStats(
        'assassino',
        mergedBaseConfig.assassino,
        sourceMap
      ),
      muralha: buildGangMemberResolvedStats(
        'muralha',
        mergedBaseConfig.muralha,
        sourceMap
      ),
      certeiro: buildGangMemberResolvedStats(
        'certeiro',
        mergedBaseConfig.certeiro,
        sourceMap
      ),
      motorista: buildGangMemberResolvedStats(
        'motorista',
        mergedBaseConfig.motorista,
        sourceMap
      ),
      nitro: buildGangMemberResolvedStats(
        'nitro',
        mergedBaseConfig.nitro,
        sourceMap
      ),
    },
    sources: sourceMap,
  };
}

export function getGangMemberFinalUnitStats(
  snapshot: GangStatsSnapshot,
  memberType: GangMemberType
) {
  return snapshot.members[memberType].finalUnit;
}

export function getGangMemberFinalTotalStats(
  snapshot: GangStatsSnapshot,
  memberType: GangMemberType
) {
  return snapshot.members[memberType].finalTotal;
}