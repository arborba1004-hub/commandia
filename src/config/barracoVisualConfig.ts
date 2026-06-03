export const MAX_BARRACO_LEVEL = 100;

export type BarracoModelConfig = {
  min: number;
  max: number;
  url: string;
  name: string;
  description: string;
};

export const BARRACO_MODELS: BarracoModelConfig[] = [
  {
    min: 1,
    max: 9,
    url: 'https://static.wixstatic.com/3d/50f4bf_0a763db5131547a588ce702d6de0a388.glb',
    name: 'Barraco Inicial',
    description: 'Um barraco simples, mas é seu. Aqui começa o domínio.',
  },
  {
    min: 10,
    max: 19,
    url: 'https://static.wixstatic.com/3d/50f4bf_134ce80560954ebb890dd74baed878e0.glb',
    name: 'Casa de Alvenaria',
    description: 'A primeira evolução real: mais estrutura, mais presença e mais respeito.',
  },
  {
    min: 20,
    max: 29,
    url: 'https://static.wixstatic.com/3d/50f4bf_a089f0d52f38465f8db77877509f12d6.glb',
    name: 'Sobrado',
    description: 'O comando começa a ganhar altura e visibilidade no território.',
  },
  {
    min: 30,
    max: 39,
    url: 'https://static.wixstatic.com/3d/50f4bf_f78d5d13df3d4a9e9b62061425cc4f30.glb',
    name: 'Sobrado com Piscina',
    description: 'Luxo básico conquistado. O barraco já vira símbolo de status.',
  },
  {
    min: 40,
    max: 49,
    url: 'https://static.wixstatic.com/3d/50f4bf_fcfd85e45b61474eab924ba144e1b256.glb',
    name: 'Sobrado de Luxo',
    description: 'Mais proteção, mais ostentação e mais moral para a gangue.',
  },
  {
    min: 50,
    max: 59,
    url: 'https://static.wixstatic.com/3d/50f4bf_8ddf8382a1d24e1d8003a7d851132a11.glb',
    name: 'Triplex Alto Padrão',
    description: 'O comando se consolida. O barraco passa a parecer uma fortaleza urbana.',
  },
  {
    min: 60,
    max: 69,
    url: 'https://static.wixstatic.com/3d/50f4bf_97904fbc3ca74bb094a29e7052c79fb4.glb',
    name: 'Triplex com Piscina',
    description: 'A ostentação vira parte da estratégia: visual forte e bônus de gangue maior.',
  },
  {
    min: 70,
    max: 79,
    url: 'https://static.wixstatic.com/3d/50f4bf_5e9f2aa54cf041b29f49258cc63eb746.glb',
    name: 'Mansão do Complexo',
    description: 'Você já não mora no mapa: você marca o mapa.',
  },
  {
    min: 80,
    max: 89,
    url: 'https://static.wixstatic.com/3d/50f4bf_ac1c5e207bbc425f80619a581e2e2cba.glb',
    name: 'Mansão Blindada',
    description: 'Poder, defesa e presença visual de chefe grande.',
  },
  {
    min: 90,
    max: 100,
    url: 'https://static.wixstatic.com/3d/50f4bf_a8dd587eba644115b376b9a0b0dc67d5.glb',
    name: 'Castelo do Comando',
    description: 'O topo absoluto. O barraco ocupa o lote inteiro e vira monumento do comando.',
  },
];

export function normalizeBarracoLevel(level: unknown) {
  const numeric = Number(level);
  if (!Number.isFinite(numeric)) return 1;
  return Math.max(1, Math.min(MAX_BARRACO_LEVEL, Math.floor(numeric)));
}

export function getBarracoConfig(level: unknown): BarracoModelConfig {
  const safeLevel = normalizeBarracoLevel(level);
  return BARRACO_MODELS.find((item) => safeLevel >= item.min && safeLevel <= item.max) || BARRACO_MODELS[0];
}

export function getBarracoModelUrl(level: unknown) {
  return getBarracoConfig(level).url;
}

export function getBarracoName(level: unknown) {
  return getBarracoConfig(level).name;
}

export function getBarracoDescription(level: unknown) {
  return getBarracoConfig(level).description;
}

/**
 * Regra visual oficial no mapa 6x6 do jogador:
 * - níveis 1 a 29: ocupa 2x2
 * - níveis 30 a 59: ocupa 3x3
 * - níveis 60 a 89: ocupa 4x4
 * - níveis 90 a 100: ocupa 6x6, ocupando o lote completo
 */
export function getBarracoFootprintTiles(level: unknown) {
  const safeLevel = normalizeBarracoLevel(level);
  if (safeLevel >= 90) return 6;
  if (safeLevel >= 60) return 4;
  if (safeLevel >= 30) return 3;
  return 2;
}

export function getNextBarracoVisualLevel(level: unknown) {
  const safeLevel = normalizeBarracoLevel(level);
  const next = BARRACO_MODELS.find((item) => item.min > safeLevel);
  return next?.min ?? null;
}
