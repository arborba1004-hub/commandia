import type { GangAtributos, GangMemberType } from '@/types/gang';

export type LuxuryItemKey =
  | 'ring'
  | 'bracelet'
  | 'watch'
  | 'bag'
  | 'sunglasses'
  | 'chain';

export type LuxuryGangStat = keyof GangAtributos;

export type LuxuryShowroomItem = {
  key: LuxuryItemKey;
  name: string;
  image: string;
  targetType: GangMemberType;
  targetStat: LuxuryGangStat;
  description: string;
};

export type LuxuryLevelTheme = {
  level: number;
  name: string;
  primary: string;
  secondary: string;
  tertiary: string;
  text: string;
  cardBackground: string;
  pageBackground: string;
  heroBackground: string;
  previewBackground: string;
  itemHalo: string;
  particles: string;
  borderColor: string;
  shadowColor: string;
  buttonBackground: string;
};

export const LUXURY_MAX_LEVEL = 100;
export const LUXURY_BASE_PRICE = 120;
export const LUXURY_PRICE_MULTIPLIER = 1.1;
export const LUXURY_BONUS_PERCENT = 1;

export const LUXURY_SHOWROOM_ITEMS: LuxuryShowroomItem[] = [
  {
    key: 'ring',
    name: 'Anel',
    image: 'https://static.wixstatic.com/media/50f4bf_b4ba3afc05854898ba783d0de389365c~mv2.png',
    targetType: 'frente',
    targetStat: 'rajada',
    description: 'Peça de presença para aumentar a pressão da linha de frente.',
  },
  {
    key: 'bracelet',
    name: 'Pulseira',
    image: 'https://static.wixstatic.com/media/50f4bf_80f3ea6ada6a4239b5fde6e862c0f4b0~mv2.png',
    targetType: 'muralha',
    targetStat: 'blindagem',
    description: 'Proteção de alto padrão para reforçar a muralha.',
  },
  {
    key: 'watch',
    name: 'Relógio',
    image: 'https://static.wixstatic.com/media/50f4bf_226ad016652549d4a32bf5d065c22547~mv2.png',
    targetType: 'motorista',
    targetStat: 'folego',
    description: 'Controle e resistência para comboios e blindados.',
  },
  {
    key: 'bag',
    name: 'Bolsa',
    image: 'https://static.wixstatic.com/media/50f4bf_226ad016652549d4a32bf5d065c22547~mv2.png',
    targetType: 'capanga',
    targetStat: 'folego',
    description: 'Luxo funcional para sustentar o bonde por mais tempo.',
  },
  {
    key: 'sunglasses',
    name: 'Óculos de sol',
    image: 'https://static.wixstatic.com/media/50f4bf_f07ae5cb61874c1da022510d81baad88~mv2.png',
    targetType: 'certeiro',
    targetStat: 'rajada',
    description: 'Estilo e mira fria para fortalecer os certeiros.',
  },
  {
    key: 'chain',
    name: 'Corrente',
    image: 'https://static.wixstatic.com/media/50f4bf_64a0ccaf2f3f4310a2eb7658c5f48d6d~mv2.png',
    targetType: 'executor',
    targetStat: 'quebra',
    description: 'Ostentação pesada para aumentar o dano final dos executores.',
  },
];

export const LUXURY_MEMBER_LABELS: Record<GangMemberType, string> = {
  capanga: 'Capanga',
  frente: 'Frente',
  executor: 'Executor',
  assassino: 'Assassino',
  muralha: 'Muralha',
  certeiro: 'Certeiro',
  motorista: 'Motorista',
  nitro: 'Nitro',
};

export const LUXURY_STAT_LABELS: Record<LuxuryGangStat, string> = {
  rajada: 'Rajada',
  blindagem: 'Blindagem',
  folego: 'Fôlego',
  quebra: 'Quebra',
};

type ThemeSeed = {
  name: string;
  primary: string;
  secondary: string;
  tertiary: string;
  text?: string;
  mode?: 'solid' | 'gradient' | 'neon' | 'metal' | 'spiral' | 'stars';
};

const THEME_SEEDS: ThemeSeed[] = [
  { name: 'Cinza fundador', primary: '#9ca3af', secondary: '#4b5563', tertiary: '#111827', text: '#f3f4f6', mode: 'solid' },
  { name: 'Verde ascensão', primary: '#22c55e', secondary: '#064e3b', tertiary: '#01140c', text: '#dcfce7', mode: 'solid' },
  { name: 'Amarelo ouro inicial', primary: '#facc15', secondary: '#a16207', tertiary: '#1f1600', text: '#fef9c3', mode: 'solid' },
  { name: 'Laranja cartel', primary: '#fb923c', secondary: '#9a3412', tertiary: '#1c0700', mode: 'solid' },
  { name: 'Vermelho rubi', primary: '#ef4444', secondary: '#7f1d1d', tertiary: '#160202', mode: 'solid' },
  { name: 'Vinho nobre', primary: '#be123c', secondary: '#4c0519', tertiary: '#120208', mode: 'solid' },
  { name: 'Roxo elite', primary: '#a855f7', secondary: '#581c87', tertiary: '#0f021a', mode: 'solid' },
  { name: 'Azul safira', primary: '#3b82f6', secondary: '#1e3a8a', tertiary: '#020817', mode: 'solid' },
  { name: 'Ciano gelo', primary: '#06b6d4', secondary: '#164e63', tertiary: '#011014', mode: 'solid' },
  { name: 'Esmeralda escura', primary: '#10b981', secondary: '#065f46', tertiary: '#010f0a', mode: 'solid' },
  { name: 'Bronze premium', primary: '#cd7f32', secondary: '#6b3f16', tertiary: '#140901', mode: 'gradient' },
  { name: 'Prata urbana', primary: '#d1d5db', secondary: '#64748b', tertiary: '#0f172a', mode: 'gradient' },
  { name: 'Turquesa luxo', primary: '#2dd4bf', secondary: '#0f766e', tertiary: '#031312', mode: 'gradient' },
  { name: 'Limão neon', primary: '#a3e635', secondary: '#3f6212', tertiary: '#091103', mode: 'gradient' },
  { name: 'Rose gold', primary: '#fb7185', secondary: '#9f1239', tertiary: '#16030a', mode: 'gradient' },
  { name: 'Magenta privado', primary: '#e879f9', secondary: '#86198f', tertiary: '#140216', mode: 'gradient' },
  { name: 'Índigo royal', primary: '#818cf8', secondary: '#3730a3', tertiary: '#07071d', mode: 'gradient' },
  { name: 'Azul petróleo', primary: '#38bdf8', secondary: '#075985', tertiary: '#020d16', mode: 'gradient' },
  { name: 'Verde tóxico', primary: '#84cc16', secondary: '#365314', tertiary: '#081003', mode: 'gradient' },
  { name: 'Dourado fosco', primary: '#eab308', secondary: '#713f12', tertiary: '#130b01', mode: 'gradient' },
  { name: 'Neon rubi', primary: '#ff2d55', secondary: '#7f001b', tertiary: '#150005', mode: 'neon' },
  { name: 'Neon violeta', primary: '#c026d3', secondary: '#581c87', tertiary: '#0c0314', mode: 'neon' },
  { name: 'Neon azul', primary: '#2563eb', secondary: '#1d4ed8', tertiary: '#020617', mode: 'neon' },
  { name: 'Neon ciano', primary: '#22d3ee', secondary: '#0e7490', tertiary: '#031015', mode: 'neon' },
  { name: 'Neon verde', primary: '#00ff88', secondary: '#047857', tertiary: '#000f08', mode: 'neon' },
  { name: 'Neon âmbar', primary: '#f59e0b', secondary: '#92400e', tertiary: '#160b01', mode: 'neon' },
  { name: 'Neon pink', primary: '#ec4899', secondary: '#831843', tertiary: '#15020b', mode: 'neon' },
  { name: 'Neon lavanda', primary: '#a78bfa', secondary: '#6d28d9', tertiary: '#0b0518', mode: 'neon' },
  { name: 'Neon oceano', primary: '#0ea5e9', secondary: '#0c4a6e', tertiary: '#020b12', mode: 'neon' },
  { name: 'Neon selva', primary: '#4ade80', secondary: '#166534', tertiary: '#021107', mode: 'neon' },
  { name: 'Metal carbono', primary: '#e5e7eb', secondary: '#374151', tertiary: '#030712', mode: 'metal' },
  { name: 'Metal ouro velho', primary: '#fbbf24', secondary: '#92400e', tertiary: '#120801', mode: 'metal' },
  { name: 'Metal cobre', primary: '#f97316', secondary: '#7c2d12', tertiary: '#160601', mode: 'metal' },
  { name: 'Metal rubi', primary: '#f43f5e', secondary: '#881337', tertiary: '#150208', mode: 'metal' },
  { name: 'Metal ametista', primary: '#d946ef', secondary: '#701a75', tertiary: '#110214', mode: 'metal' },
  { name: 'Metal safira', primary: '#60a5fa', secondary: '#1d4ed8', tertiary: '#020617', mode: 'metal' },
  { name: 'Metal turquesa', primary: '#5eead4', secondary: '#0f766e', tertiary: '#031311', mode: 'metal' },
  { name: 'Metal oliva', primary: '#bef264', secondary: '#4d7c0f', tertiary: '#081202', mode: 'metal' },
  { name: 'Metal champagne', primary: '#fde68a', secondary: '#b45309', tertiary: '#170b01', mode: 'metal' },
  { name: 'Metal grafite roxo', primary: '#c4b5fd', secondary: '#5b21b6', tertiary: '#090416', mode: 'metal' },
];

const SPECIAL_LEVELS: Partial<Record<number, ThemeSeed>> = {
  1: { name: 'Cinza fundador', primary: '#9ca3af', secondary: '#4b5563', tertiary: '#111827', text: '#f9fafb', mode: 'solid' },
  2: { name: 'Verde ascensão', primary: '#22c55e', secondary: '#064e3b', tertiary: '#01140c', text: '#dcfce7', mode: 'solid' },
  3: { name: 'Amarelo ouro inicial', primary: '#facc15', secondary: '#a16207', tertiary: '#1f1600', text: '#fef9c3', mode: 'solid' },
  10: { name: 'Ouro magnata', primary: '#f59e0b', secondary: '#7c2d12', tertiary: '#140701', mode: 'metal' },
  25: { name: 'Prisma royal', primary: '#38bdf8', secondary: '#a855f7', tertiary: '#060316', mode: 'neon' },
  50: { name: 'Diamante escuro', primary: '#e0f2fe', secondary: '#2563eb', tertiary: '#020617', mode: 'metal' },
  60: { name: 'Gradiente azul e roxo', primary: '#3b82f6', secondary: '#8b5cf6', tertiary: '#09041f', text: '#dbeafe', mode: 'neon' },
  75: { name: 'Platina imperial', primary: '#f8fafc', secondary: '#94a3b8', tertiary: '#09090b', mode: 'metal' },
  88: { name: 'Espiral rosa rara', primary: '#ff4fc3', secondary: '#a855f7', tertiary: '#19001d', text: '#ffe4f7', mode: 'spiral' },
  99: { name: 'Portal infinito', primary: '#67e8f9', secondary: '#c084fc', tertiary: '#020617', mode: 'spiral' },
  100: { name: 'Estrelas douradas', primary: '#ffd700', secondary: '#fff4b0', tertiary: '#1f1300', text: '#fff7c2', mode: 'stars' },
};

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '').trim();
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized.padEnd(6, '0').slice(0, 6);

  return {
    r: Number.parseInt(value.slice(0, 2), 16) || 0,
    g: Number.parseInt(value.slice(2, 4), 16) || 0,
    b: Number.parseInt(value.slice(4, 6), 16) || 0,
  };
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getThemeSeed(level: number): ThemeSeed {
  const safeLevel = clampLuxuryLevel(level);
  return SPECIAL_LEVELS[safeLevel] || THEME_SEEDS[(safeLevel - 1) % THEME_SEEDS.length];
}

function buildTheme(seed: ThemeSeed, level: number): LuxuryLevelTheme {
  const safeLevel = clampLuxuryLevel(level);
  const mode = seed.mode || 'gradient';
  const text = seed.text || '#ffffff';
  const primarySoft = rgba(seed.primary, 0.58);
  const primaryMid = rgba(seed.primary, 0.34);
  const primaryLow = rgba(seed.primary, 0.18);
  const secondaryMid = rgba(seed.secondary, 0.36);
  const secondarySoft = rgba(seed.secondary, 0.22);
  const tertiaryStrong = seed.tertiary;

  const commonParticles = `
    radial-gradient(circle at 12% 18%, ${rgba(seed.primary, 0.58)} 0 1.5px, transparent 2.5px),
    radial-gradient(circle at 78% 24%, ${rgba(seed.secondary, 0.46)} 0 1px, transparent 2px),
    radial-gradient(circle at 38% 82%, ${rgba(seed.primary, 0.32)} 0 1px, transparent 2px)
  `;

  if (mode === 'spiral') {
    return {
      level: safeLevel,
      name: seed.name,
      primary: seed.primary,
      secondary: seed.secondary,
      tertiary: seed.tertiary,
      text,
      cardBackground: `
        radial-gradient(circle at 50% 50%, ${rgba(seed.primary, 0.60)} 0%, ${rgba(seed.secondary, 0.30)} 14%, transparent 15%),
        conic-gradient(from ${safeLevel * 7}deg at 50% 50%, ${seed.primary}, ${seed.secondary}, ${seed.primary}, ${seed.tertiary}, ${seed.primary}),
        radial-gradient(circle at center, transparent 0%, rgba(0,0,0,.72) 76%)
      `,
      pageBackground: `
        radial-gradient(circle at 12% 0%, ${rgba(seed.primary, 0.40)}, transparent 34%),
        radial-gradient(circle at 92% 10%, ${rgba(seed.secondary, 0.34)}, transparent 30%),
        conic-gradient(from ${safeLevel * 4}deg at 50% 24%, ${rgba(seed.primary, 0.16)}, ${rgba(seed.secondary, 0.14)}, ${rgba(seed.primary, 0.16)}),
        linear-gradient(180deg, ${seed.tertiary} 0%, #050006 54%, #010101 100%)
      `,
      heroBackground: `linear-gradient(135deg, ${rgba(seed.primary, 0.34)}, ${rgba(seed.secondary, 0.30)}, rgba(0,0,0,.70))`,
      previewBackground: `conic-gradient(from ${safeLevel * 7}deg, ${seed.primary}, ${seed.secondary}, ${seed.primary})`,
      itemHalo: `radial-gradient(circle, ${rgba(seed.primary, 0.74)}, transparent 70%)`,
      particles: commonParticles,
      borderColor: rgba(seed.primary, 0.62),
      shadowColor: rgba(seed.primary, 0.54),
      buttonBackground: `linear-gradient(135deg, ${text}, ${seed.primary}, ${seed.secondary})`,
    };
  }

  if (mode === 'stars') {
    const starField = `
      radial-gradient(circle at 12% 18%, rgba(255,215,0,.98) 0 2px, transparent 3px),
      radial-gradient(circle at 28% 32%, rgba(255,244,176,.95) 0 1.5px, transparent 2.5px),
      radial-gradient(circle at 74% 22%, rgba(255,215,0,.98) 0 2px, transparent 3px),
      radial-gradient(circle at 82% 58%, rgba(255,244,176,.95) 0 1.5px, transparent 2.5px),
      radial-gradient(circle at 18% 76%, rgba(255,215,0,.98) 0 2px, transparent 3px),
      radial-gradient(circle at 62% 82%, rgba(255,244,176,.95) 0 1.5px, transparent 2.5px)
    `;
    return {
      level: safeLevel,
      name: seed.name,
      primary: seed.primary,
      secondary: seed.secondary,
      tertiary: seed.tertiary,
      text,
      cardBackground: `${starField}, radial-gradient(circle at 50% 50%, ${rgba(seed.primary, 0.28)}, transparent 60%), linear-gradient(135deg, #2a1b00, #8c6900 48%, #161000)`,
      pageBackground: `${starField}, radial-gradient(circle at 8% 8%, ${rgba(seed.primary, 0.42)}, transparent 30%), linear-gradient(180deg, #130d00 0%, #2a1b00 48%, #050300 100%)`,
      heroBackground: `linear-gradient(135deg, ${rgba(seed.primary, 0.32)}, rgba(121,86,0,.62), rgba(0,0,0,.74))`,
      previewBackground: `radial-gradient(circle at 26% 28%, #fff8c7 0 2px, transparent 3px), linear-gradient(135deg, #ffd700, #704f00)`,
      itemHalo: `radial-gradient(circle, rgba(255,215,0,.82), transparent 70%)`,
      particles: starField,
      borderColor: 'rgba(255,215,0,.68)',
      shadowColor: 'rgba(255,215,0,.60)',
      buttonBackground: 'linear-gradient(135deg, #fff8c7, #ffd700, #b88400)',
    };
  }

  const metalLayer = mode === 'metal'
    ? 'linear-gradient(118deg, rgba(255,255,255,.20), transparent 24%, rgba(255,255,255,.08) 44%, transparent 64%),'
    : '';
  const neonPower = mode === 'neon' ? 0.70 : mode === 'gradient' ? 0.52 : 0.42;

  return {
    level: safeLevel,
    name: seed.name,
    primary: seed.primary,
    secondary: seed.secondary,
    tertiary: seed.tertiary,
    text,
    cardBackground: `
      radial-gradient(circle at 18% 14%, ${rgba(seed.primary, neonPower)}, transparent 31%),
      radial-gradient(circle at 88% 18%, ${secondaryMid}, transparent 31%),
      ${metalLayer}
      linear-gradient(145deg, ${seed.primary} 0%, ${seed.secondary} 46%, ${tertiaryStrong} 100%)
    `,
    pageBackground: `
      radial-gradient(circle at 10% 0%, ${primaryMid}, transparent 34%),
      radial-gradient(circle at 94% 12%, ${secondarySoft}, transparent 30%),
      radial-gradient(circle at 50% 100%, ${primaryLow}, transparent 36%),
      linear-gradient(180deg, ${tertiaryStrong} 0%, #07020a 52%, #010101 100%)
    `,
    heroBackground: `linear-gradient(135deg, ${primaryMid}, ${secondarySoft}, rgba(0,0,0,.70))`,
    previewBackground: `linear-gradient(135deg, ${seed.primary}, ${seed.secondary})`,
    itemHalo: `radial-gradient(circle, ${primarySoft}, transparent 70%)`,
    particles: commonParticles,
    borderColor: rgba(seed.primary, mode === 'solid' ? 0.46 : 0.58),
    shadowColor: rgba(seed.primary, mode === 'solid' ? 0.34 : 0.48),
    buttonBackground: `linear-gradient(135deg, ${text}, ${seed.primary}, ${seed.secondary})`,
  };
}

export function clampLuxuryLevel(level: number): number {
  return Math.min(LUXURY_MAX_LEVEL, Math.max(1, Math.floor(Number(level) || 1)));
}

export function getLuxuryLevelFromBarraco(barracoLevel: number): number {
  return clampLuxuryLevel(barracoLevel);
}

export function getLuxuryItemPrice(level: number): number {
  const safeLevel = clampLuxuryLevel(level);
  return Number((LUXURY_BASE_PRICE * Math.pow(LUXURY_PRICE_MULTIPLIER, safeLevel - 1)).toFixed(2));
}

export function getLuxuryItemId(itemKey: LuxuryItemKey | string, level: number): string {
  return `luxury:${String(itemKey)}:${clampLuxuryLevel(level)}`;
}

export function getLegacyLuxuryItemId(itemKey: LuxuryItemKey | string, level: number): string {
  return `luxury-${String(itemKey)}-${clampLuxuryLevel(level)}`;
}

export function getLuxuryItemByKey(itemKey: string): LuxuryShowroomItem | null {
  return LUXURY_SHOWROOM_ITEMS.find((item) => item.key === itemKey) || null;
}

export function getLuxuryLevelTheme(level: number): LuxuryLevelTheme {
  const safeLevel = clampLuxuryLevel(level);
  return buildTheme(getThemeSeed(safeLevel), safeLevel);
}

export function getLuxuryLevelName(level: number): string {
  return getLuxuryLevelTheme(level).name;
}

export function getLuxuryItemBackground(level: number, itemIndex = 0): string {
  const theme = getLuxuryLevelTheme(level);
  const offset = Math.max(0, Math.min(5, itemIndex));
  const intensity = 0.10 + offset * 0.025;

  // O itemIndex agora só muda um brilho sutil. A identidade dominante é sempre do nível.
  return `
    radial-gradient(circle at ${16 + offset * 12}% ${14 + offset * 5}%, rgba(255,255,255,${intensity}), transparent 28%),
    ${theme.cardBackground}
  `;
}

export function getLuxuryItemGlow(level: number, _itemIndex = 0): string {
  const theme = getLuxuryLevelTheme(level);
  return `0 0 0 1px ${theme.borderColor}, 0 0 32px ${theme.shadowColor}, 0 24px 80px rgba(0,0,0,0.56)`;
}

export function getLuxuryStatPercentPayload(stat: LuxuryGangStat, value = LUXURY_BONUS_PERCENT): GangAtributos {
  return {
    rajada: stat === 'rajada' ? value : 0,
    blindagem: stat === 'blindagem' ? value : 0,
    folego: stat === 'folego' ? value : 0,
    quebra: stat === 'quebra' ? value : 0,
  };
}

export function formatCleanMoney(value: number): string {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
