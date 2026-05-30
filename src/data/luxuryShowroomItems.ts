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
  accent: string;
  accent2: string;
  accent3: string;
  cardBackground: string;
  showroomBackground: string;
  heroBackground: string;
  particleOverlay: string;
  itemHalo: string;
  sheen: string;
  chipBackground: string;
  levelPreview: string;
  borderColor: string;
  shadowColor: string;
  softShadow: string;
  textGlow: string;
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

const LEVEL_PRESTIGE_LABELS = [
  { max: 10, label: 'Entrada privada' },
  { max: 25, label: 'Luxo seletivo' },
  { max: 50, label: 'Alta joalheria' },
  { max: 75, label: 'Coleção de elite' },
  { max: 90, label: 'Edição rara' },
  { max: 99, label: 'Lenda do comando' },
  { max: 100, label: 'Domínio absoluto' },
];

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

export function getLuxuryPrestigeLabel(level: number): string {
  const safeLevel = clampLuxuryLevel(level);
  return LEVEL_PRESTIGE_LABELS.find((tier) => safeLevel <= tier.max)?.label || 'Coleção privada';
}

function makeTheme(input: Omit<LuxuryLevelTheme, 'softShadow' | 'textGlow'>): LuxuryLevelTheme {
  return {
    ...input,
    softShadow: `0 0 28px ${input.shadowColor}, 0 26px 95px rgba(0,0,0,0.58)`,
    textGlow: `0 0 20px ${input.shadowColor}, 0 0 48px ${input.shadowColor}`,
  };
}

function buildGeneratedTheme(level: number, itemIndex = 0): LuxuryLevelTheme {
  const safeLevel = clampLuxuryLevel(level);
  const hue = (safeLevel * 37 + itemIndex * 9) % 360;
  const hue2 = (hue + 42 + safeLevel) % 360;
  const hue3 = (hue + 126) % 360;

  const saturation = safeLevel < 12 ? 48 : safeLevel < 40 ? 62 : safeLevel < 70 ? 76 : 88;
  const light = safeLevel < 12 ? 44 : safeLevel < 40 ? 50 : safeLevel < 70 ? 56 : 63;

  const accent = `hsl(${hue}, ${saturation}%, ${light}%)`;
  const accent2 = `hsl(${hue2}, ${Math.min(saturation + 8, 96)}%, ${Math.min(light + 7, 72)}%)`;
  const accent3 = `hsl(${hue3}, ${Math.min(saturation + 12, 98)}%, ${Math.min(light + 3, 70)}%)`;
  const shadowColor = `hsla(${hue}, ${saturation}%, ${light}%, ${safeLevel >= 80 ? 0.54 : 0.38})`;
  const borderColor = `hsla(${hue}, ${saturation}%, ${Math.min(light + 16, 80)}%, ${safeLevel >= 80 ? 0.56 : 0.36})`;

  if (safeLevel <= 10) {
    return makeTheme({
      level: safeLevel,
      name: 'Coleção sólida',
      accent,
      accent2,
      accent3,
      cardBackground: `
        radial-gradient(circle at 22% 16%, hsla(${hue}, ${saturation}%, ${light + 8}%, 0.36), transparent 31%),
        linear-gradient(145deg, hsl(${hue}, 36%, 22%), hsl(${hue2}, 34%, 12%) 58%, #09070a)
      `,
      showroomBackground: `
        radial-gradient(circle at 16% 0%, hsla(${hue}, 80%, 52%, 0.20), transparent 32%),
        radial-gradient(circle at 92% 14%, hsla(${hue2}, 72%, 52%, 0.16), transparent 30%),
        linear-gradient(180deg, #07070a 0%, hsl(${hue}, 34%, 7%) 54%, #020102 100%)
      `,
      heroBackground: `linear-gradient(135deg, hsla(${hue}, 38%, 18%, .72), rgba(0,0,0,.62))`,
      particleOverlay: `radial-gradient(circle at 18% 24%, rgba(255,255,255,.20) 0 1px, transparent 2px), radial-gradient(circle at 72% 66%, hsla(${hue2},80%,74%,.24) 0 1.5px, transparent 2.5px)`,
      itemHalo: `radial-gradient(circle, hsla(${hue}, 90%, 62%, .42), transparent 70%)`,
      sheen: 'linear-gradient(115deg, transparent 0%, rgba(255,255,255,.12) 34%, transparent 58%)',
      chipBackground: `linear-gradient(135deg, ${accent}, ${accent2})`,
      levelPreview: `linear-gradient(135deg, hsl(${hue}, 42%, 27%), hsl(${hue2}, 46%, 13%))`,
      borderColor,
      shadowColor,
    });
  }

  if (safeLevel <= 35) {
    return makeTheme({
      level: safeLevel,
      name: 'Gradiente nobre',
      accent,
      accent2,
      accent3,
      cardBackground: `
        radial-gradient(circle at 20% 16%, hsla(${hue}, 96%, 68%, 0.44), transparent 30%),
        radial-gradient(circle at 88% 6%, hsla(${hue3}, 90%, 66%, 0.24), transparent 28%),
        linear-gradient(135deg, hsl(${hue}, ${saturation}%, 20%), hsl(${hue2}, ${saturation}%, 11%) 55%, #030208)
      `,
      showroomBackground: `
        radial-gradient(circle at 6% 5%, hsla(${hue}, 92%, 58%, .22), transparent 31%),
        radial-gradient(circle at 100% 18%, hsla(${hue3}, 92%, 58%, .18), transparent 28%),
        linear-gradient(180deg, #05010a 0%, hsl(${hue2}, 54%, 9%) 48%, #020102 100%)
      `,
      heroBackground: `linear-gradient(135deg, hsla(${hue}, 64%, 18%, .78), hsla(${hue2}, 64%, 12%, .66))`,
      particleOverlay: `radial-gradient(circle at 14% 18%, hsla(${hue},100%,80%,.28) 0 1.5px, transparent 2.5px), radial-gradient(circle at 78% 24%, hsla(${hue3},100%,76%,.22) 0 1px, transparent 2px), radial-gradient(circle at 44% 82%, rgba(255,255,255,.18) 0 1px, transparent 2px)`,
      itemHalo: `radial-gradient(circle, hsla(${hue}, 96%, 62%, .50), transparent 68%)`,
      sheen: `linear-gradient(115deg, transparent 0%, hsla(${hue2}, 100%, 86%, .15) 36%, transparent 58%)`,
      chipBackground: `linear-gradient(135deg, ${accent}, ${accent2})`,
      levelPreview: `linear-gradient(135deg, hsl(${hue}, 72%, 35%), hsl(${hue2}, 64%, 18%))`,
      borderColor,
      shadowColor,
    });
  }

  if (safeLevel <= 60) {
    return makeTheme({
      level: safeLevel,
      name: 'Neon executivo',
      accent,
      accent2,
      accent3,
      cardBackground: `
        radial-gradient(circle at 12% 10%, hsla(${hue}, 100%, 68%, .52), transparent 30%),
        radial-gradient(circle at 80% 20%, hsla(${hue2}, 100%, 65%, .34), transparent 32%),
        linear-gradient(145deg, hsl(${hue}, 74%, 16%), hsl(${hue2}, 78%, 9%) 58%, #020105)
      `,
      showroomBackground: `
        radial-gradient(circle at 12% 4%, hsla(${hue}, 100%, 58%, .28), transparent 32%),
        radial-gradient(circle at 92% 10%, hsla(${hue2}, 100%, 60%, .24), transparent 28%),
        radial-gradient(circle at 50% 100%, hsla(${hue3}, 100%, 52%, .16), transparent 36%),
        linear-gradient(180deg, #03000a 0%, hsl(${hue2}, 68%, 7%) 48%, #010102 100%)
      `,
      heroBackground: `linear-gradient(135deg, hsla(${hue}, 86%, 18%, .82), hsla(${hue2}, 86%, 10%, .66))`,
      particleOverlay: `radial-gradient(circle at 18% 20%, hsla(${hue},100%,80%,.38) 0 1.5px, transparent 2.5px), radial-gradient(circle at 86% 34%, hsla(${hue2},100%,78%,.26) 0 1px, transparent 2px), radial-gradient(circle at 48% 78%, hsla(${hue3},100%,74%,.24) 0 1px, transparent 2px)`,
      itemHalo: `radial-gradient(circle, hsla(${hue}, 100%, 66%, .60), transparent 70%)`,
      sheen: `linear-gradient(110deg, transparent 0%, hsla(${hue}, 100%, 88%, .17) 31%, hsla(${hue2},100%,82%,.10) 43%, transparent 62%)`,
      chipBackground: `linear-gradient(135deg, ${accent}, ${accent2})`,
      levelPreview: `linear-gradient(135deg, hsl(${hue}, 92%, 42%), hsl(${hue2}, 78%, 22%))`,
      borderColor,
      shadowColor,
    });
  }

  if (safeLevel <= 80) {
    return makeTheme({
      level: safeLevel,
      name: 'Metal raro',
      accent,
      accent2,
      accent3,
      cardBackground: `
        radial-gradient(circle at 18% 18%, hsla(${hue}, 100%, 72%, .52), transparent 30%),
        linear-gradient(125deg, rgba(255,255,255,.16), transparent 26%),
        linear-gradient(145deg, hsl(${hue}, 78%, 18%), hsl(${hue2}, 82%, 9%) 58%, #050205)
      `,
      showroomBackground: `
        radial-gradient(circle at 8% 0%, hsla(${hue}, 100%, 64%, .30), transparent 34%),
        radial-gradient(circle at 96% 10%, hsla(${hue2}, 100%, 62%, .26), transparent 28%),
        linear-gradient(180deg, #07020a 0%, hsl(${hue}, 72%, 7%) 50%, #010101 100%)
      `,
      heroBackground: `linear-gradient(135deg, rgba(255,255,255,.08), hsla(${hue}, 86%, 15%, .78), hsla(${hue2}, 86%, 9%, .64))`,
      particleOverlay: `radial-gradient(circle at 16% 16%, rgba(255,255,255,.38) 0 1.5px, transparent 2.5px), radial-gradient(circle at 76% 42%, hsla(${hue},100%,84%,.34) 0 1px, transparent 2px), radial-gradient(circle at 38% 86%, hsla(${hue2},100%,82%,.30) 0 1px, transparent 2px)`,
      itemHalo: `radial-gradient(circle, hsla(${hue}, 100%, 70%, .66), transparent 70%)`,
      sheen: `linear-gradient(112deg, transparent 0%, rgba(255,255,255,.20) 28%, hsla(${hue2},100%,84%,.10) 42%, transparent 62%)`,
      chipBackground: `linear-gradient(135deg, #ffffff, ${accent}, ${accent2})`,
      levelPreview: `linear-gradient(135deg, hsl(${hue}, 90%, 46%), hsl(${hue2}, 82%, 24%))`,
      borderColor,
      shadowColor,
    });
  }

  return makeTheme({
    level: safeLevel,
    name: 'Cósmico lendário',
    accent,
    accent2,
    accent3,
    cardBackground: `
      radial-gradient(circle at 18% 16%, hsla(${hue}, 100%, 72%, .62), transparent 28%),
      radial-gradient(circle at 84% 18%, hsla(${hue2}, 100%, 70%, .40), transparent 28%),
      conic-gradient(from ${safeLevel * 11}deg at 50% 52%, hsla(${hue},100%,60%,.52), hsla(${hue2},100%,60%,.28), hsla(${hue3},100%,62%,.48), hsla(${hue},100%,60%,.52)),
      radial-gradient(circle at center, rgba(0,0,0,.04), rgba(0,0,0,.68) 68%)
    `,
    showroomBackground: `
      radial-gradient(circle at 12% 0%, hsla(${hue}, 100%, 64%, .34), transparent 34%),
      radial-gradient(circle at 92% 10%, hsla(${hue2}, 100%, 66%, .30), transparent 28%),
      radial-gradient(circle at 50% 102%, hsla(${hue3}, 100%, 62%, .22), transparent 36%),
      linear-gradient(180deg, #03000b 0%, hsl(${hue2}, 82%, 6%) 46%, #010101 100%)
    `,
    heroBackground: `linear-gradient(135deg, hsla(${hue}, 96%, 18%, .86), hsla(${hue2}, 96%, 11%, .74), rgba(0,0,0,.70))`,
    particleOverlay: `radial-gradient(circle at 13% 18%, rgba(255,255,255,.64) 0 1.5px, transparent 2.5px), radial-gradient(circle at 36% 76%, hsla(${hue},100%,86%,.42) 0 1px, transparent 2px), radial-gradient(circle at 78% 28%, hsla(${hue2},100%,84%,.48) 0 1.5px, transparent 2.5px), radial-gradient(circle at 88% 84%, hsla(${hue3},100%,84%,.36) 0 1px, transparent 2px)`,
    itemHalo: `radial-gradient(circle, hsla(${hue}, 100%, 72%, .72), transparent 70%)`,
    sheen: `linear-gradient(108deg, transparent 0%, rgba(255,255,255,.22) 26%, hsla(${hue2},100%,88%,.16) 42%, transparent 63%)`,
    chipBackground: `linear-gradient(135deg, #ffffff, ${accent}, ${accent2})`,
    levelPreview: `linear-gradient(135deg, hsl(${hue}, 100%, 52%), hsl(${hue2}, 96%, 30%))`,
    borderColor,
    shadowColor,
  });
}

const SPECIAL_LEVEL_THEME_BUILDERS: Partial<Record<number, () => LuxuryLevelTheme>> = {
  1: () => makeTheme({
    level: 1,
    name: 'Cinza fundador',
    accent: '#c9c9c9',
    accent2: '#868686',
    accent3: '#f0f0f0',
    cardBackground: 'radial-gradient(circle at 24% 18%, rgba(255,255,255,.22), transparent 30%), linear-gradient(145deg, #5a5a5a, #2d2d2d 55%, #101010)',
    showroomBackground: 'radial-gradient(circle at 12% 0%, rgba(190,190,190,.22), transparent 32%), linear-gradient(180deg, #101010 0%, #050505 52%, #010101 100%)',
    heroBackground: 'linear-gradient(135deg, rgba(120,120,120,.52), rgba(0,0,0,.68))',
    particleOverlay: 'radial-gradient(circle at 22% 24%, rgba(255,255,255,.34) 0 1px, transparent 2px), radial-gradient(circle at 76% 62%, rgba(255,255,255,.20) 0 1.5px, transparent 2.5px)',
    itemHalo: 'radial-gradient(circle, rgba(255,255,255,.34), transparent 70%)',
    sheen: 'linear-gradient(110deg, transparent, rgba(255,255,255,.16), transparent)',
    chipBackground: 'linear-gradient(135deg, #eeeeee, #8a8a8a)',
    levelPreview: 'linear-gradient(135deg, #6d6d6d, #252525)',
    borderColor: 'rgba(225,225,225,.34)',
    shadowColor: 'rgba(190,190,190,.28)',
  }),
  2: () => makeTheme({
    level: 2,
    name: 'Verde ascensão',
    accent: '#57ff96',
    accent2: '#0ea85a',
    accent3: '#b8ffd0',
    cardBackground: 'radial-gradient(circle at 22% 16%, rgba(93,255,157,.42), transparent 31%), linear-gradient(145deg, #1f7a45, #0d3b24 58%, #03130b)',
    showroomBackground: 'radial-gradient(circle at 12% 0%, rgba(88,255,151,.24), transparent 32%), linear-gradient(180deg, #031209 0%, #05120b 48%, #010301 100%)',
    heroBackground: 'linear-gradient(135deg, rgba(34,126,73,.66), rgba(0,0,0,.68))',
    particleOverlay: 'radial-gradient(circle at 18% 20%, rgba(134,255,181,.42) 0 1.5px, transparent 2.5px), radial-gradient(circle at 82% 72%, rgba(83,255,150,.24) 0 1px, transparent 2px)',
    itemHalo: 'radial-gradient(circle, rgba(87,255,150,.50), transparent 70%)',
    sheen: 'linear-gradient(110deg, transparent, rgba(190,255,213,.18), transparent)',
    chipBackground: 'linear-gradient(135deg, #b8ffd0, #15c66f)',
    levelPreview: 'linear-gradient(135deg, #20a65a, #082b18)',
    borderColor: 'rgba(120,255,174,.40)',
    shadowColor: 'rgba(87,255,150,.32)',
  }),
  3: () => makeTheme({
    level: 3,
    name: 'Amarelo ouro inicial',
    accent: '#ffe15a',
    accent2: '#c99a13',
    accent3: '#fff6b8',
    cardBackground: 'radial-gradient(circle at 24% 16%, rgba(255,232,104,.50), transparent 32%), linear-gradient(145deg, #caa018, #5d4504 58%, #130d01)',
    showroomBackground: 'radial-gradient(circle at 12% 0%, rgba(255,226,90,.26), transparent 32%), linear-gradient(180deg, #120d01 0%, #0b0801 48%, #020101 100%)',
    heroBackground: 'linear-gradient(135deg, rgba(175,126,13,.68), rgba(0,0,0,.70))',
    particleOverlay: 'radial-gradient(circle at 18% 20%, rgba(255,246,184,.52) 0 1.5px, transparent 2.5px), radial-gradient(circle at 82% 72%, rgba(255,210,48,.30) 0 1px, transparent 2px)',
    itemHalo: 'radial-gradient(circle, rgba(255,225,90,.62), transparent 70%)',
    sheen: 'linear-gradient(110deg, transparent, rgba(255,255,220,.23), transparent)',
    chipBackground: 'linear-gradient(135deg, #fff6b8, #f0bb21)',
    levelPreview: 'linear-gradient(135deg, #f0bd22, #654908)',
    borderColor: 'rgba(255,232,104,.46)',
    shadowColor: 'rgba(255,225,90,.36)',
  }),
  60: () => makeTheme({
    level: 60,
    name: 'Azul e roxo executivo',
    accent: '#57a7ff',
    accent2: '#9b5cff',
    accent3: '#d7c3ff',
    cardBackground: 'radial-gradient(circle at 18% 12%, rgba(87,167,255,.62), transparent 30%), radial-gradient(circle at 88% 18%, rgba(155,92,255,.48), transparent 30%), linear-gradient(135deg, #123fba, #6e24d6 54%, #0b061b)',
    showroomBackground: 'radial-gradient(circle at 12% 0%, rgba(87,167,255,.36), transparent 34%), radial-gradient(circle at 92% 8%, rgba(155,92,255,.32), transparent 30%), linear-gradient(180deg, #020616 0%, #120728 50%, #010102 100%)',
    heroBackground: 'linear-gradient(135deg, rgba(20,68,190,.82), rgba(105,34,206,.74), rgba(0,0,0,.70))',
    particleOverlay: 'radial-gradient(circle at 15% 18%, rgba(183,219,255,.62) 0 1.5px, transparent 2.5px), radial-gradient(circle at 79% 34%, rgba(215,195,255,.54) 0 1.5px, transparent 2.5px), radial-gradient(circle at 52% 82%, rgba(87,167,255,.38) 0 1px, transparent 2px)',
    itemHalo: 'radial-gradient(circle, rgba(124,148,255,.72), transparent 70%)',
    sheen: 'linear-gradient(112deg, transparent 0%, rgba(217,236,255,.22) 30%, rgba(206,175,255,.17) 45%, transparent 64%)',
    chipBackground: 'linear-gradient(135deg, #b8ddff, #57a7ff, #9b5cff)',
    levelPreview: 'linear-gradient(135deg, #1a64d8, #7b2ee6)',
    borderColor: 'rgba(178,210,255,.52)',
    shadowColor: 'rgba(117,119,255,.46)',
  }),
  88: () => makeTheme({
    level: 88,
    name: 'Espiral rosa rara',
    accent: '#ff5ed4',
    accent2: '#ff9ee8',
    accent3: '#ffd5f4',
    cardBackground: 'radial-gradient(circle at 50% 50%, rgba(255,196,241,.44) 0%, rgba(255,94,212,.24) 14%, transparent 15%), conic-gradient(from 18deg at 50% 50%, #ff4fc3, #ff9ee8, #a855f7, #ff4fc3, #ffd5f4, #ff4fc3), radial-gradient(circle at center, rgba(0,0,0,.05), rgba(0,0,0,.68) 70%)',
    showroomBackground: 'radial-gradient(circle at 12% 0%, rgba(255,94,212,.36), transparent 34%), radial-gradient(circle at 92% 10%, rgba(168,85,247,.32), transparent 30%), conic-gradient(from 90deg at 50% 30%, rgba(255,79,195,.14), rgba(168,85,247,.12), rgba(255,158,232,.12), rgba(255,79,195,.14)), linear-gradient(180deg, #160014 0%, #180020 54%, #050005 100%)',
    heroBackground: 'linear-gradient(135deg, rgba(255,79,195,.34), rgba(168,85,247,.32), rgba(0,0,0,.72))',
    particleOverlay: 'radial-gradient(circle at 17% 18%, rgba(255,213,244,.70) 0 1.5px, transparent 2.5px), radial-gradient(circle at 76% 34%, rgba(255,158,232,.54) 0 1.5px, transparent 2.5px), radial-gradient(circle at 48% 82%, rgba(255,94,212,.48) 0 1px, transparent 2px)',
    itemHalo: 'radial-gradient(circle, rgba(255,94,212,.76), transparent 70%)',
    sheen: 'linear-gradient(108deg, transparent 0%, rgba(255,255,255,.26) 28%, rgba(255,158,232,.18) 45%, transparent 66%)',
    chipBackground: 'linear-gradient(135deg, #ffd5f4, #ff5ed4, #a855f7)',
    levelPreview: 'conic-gradient(from 18deg, #ff4fc3, #ff9ee8, #a855f7, #ff4fc3)',
    borderColor: 'rgba(255,158,232,.62)',
    shadowColor: 'rgba(255,94,212,.52)',
  }),
  100: () => makeTheme({
    level: 100,
    name: 'Estrelas douradas',
    accent: '#ffd700',
    accent2: '#fff4b0',
    accent3: '#b88400',
    cardBackground: 'radial-gradient(circle at 12% 18%, rgba(255,215,0,.98) 0 2px, transparent 3px), radial-gradient(circle at 28% 32%, rgba(255,244,176,.95) 0 1.5px, transparent 2.5px), radial-gradient(circle at 74% 22%, rgba(255,215,0,.98) 0 2px, transparent 3px), radial-gradient(circle at 82% 58%, rgba(255,244,176,.95) 0 1.5px, transparent 2.5px), radial-gradient(circle at 18% 76%, rgba(255,215,0,.98) 0 2px, transparent 3px), radial-gradient(circle at 62% 82%, rgba(255,244,176,.95) 0 1.5px, transparent 2.5px), radial-gradient(circle at 50% 50%, rgba(255,215,0,.18), transparent 56%), linear-gradient(135deg, #2a1b00, #8c6900 46%, #161000 100%)',
    showroomBackground: 'radial-gradient(circle at 8% 8%, rgba(255,215,0,.42), transparent 30%), radial-gradient(circle at 92% 6%, rgba(255,244,176,.36), transparent 28%), radial-gradient(circle at 50% 100%, rgba(255,215,0,.24), transparent 36%), radial-gradient(circle at 18% 42%, rgba(255,244,176,.80) 0 1px, transparent 2px), radial-gradient(circle at 76% 60%, rgba(255,215,0,.75) 0 1.5px, transparent 2.5px), linear-gradient(180deg, #130d00 0%, #2a1b00 48%, #050300 100%)',
    heroBackground: 'linear-gradient(135deg, rgba(255,215,0,.26), rgba(121,86,0,.62), rgba(0,0,0,.72))',
    particleOverlay: 'radial-gradient(circle at 13% 18%, rgba(255,244,176,.98) 0 1.5px, transparent 2.5px), radial-gradient(circle at 36% 76%, rgba(255,215,0,.88) 0 1px, transparent 2px), radial-gradient(circle at 78% 28%, rgba(255,244,176,.94) 0 1.5px, transparent 2.5px), radial-gradient(circle at 88% 84%, rgba(255,215,0,.84) 0 1px, transparent 2px)',
    itemHalo: 'radial-gradient(circle, rgba(255,215,0,.78), transparent 70%)',
    sheen: 'linear-gradient(110deg, transparent 0%, rgba(255,255,255,.36) 26%, rgba(255,215,0,.20) 44%, transparent 66%)',
    chipBackground: 'linear-gradient(135deg, #fff8c7, #ffd700, #b88400)',
    levelPreview: 'radial-gradient(circle at 24% 28%, #fff8c7 0 2px, transparent 3px), linear-gradient(135deg, #ffd700, #704f00)',
    borderColor: 'rgba(255,215,0,.66)',
    shadowColor: 'rgba(255,215,0,.58)',
  }),
};

export function getLuxuryLevelTheme(level: number, itemIndex = 0): LuxuryLevelTheme {
  const safeLevel = clampLuxuryLevel(level);
  const specialTheme = SPECIAL_LEVEL_THEME_BUILDERS[safeLevel]?.();
  if (!specialTheme) return buildGeneratedTheme(safeLevel, itemIndex);

  if (itemIndex <= 0) return specialTheme;

  const slightGlow = Math.min(0.12 + itemIndex * 0.035, 0.30);
  return {
    ...specialTheme,
    cardBackground: `
      radial-gradient(circle at ${18 + itemIndex * 9}% ${12 + itemIndex * 4}%, rgba(255,255,255,${slightGlow}), transparent 30%),
      ${specialTheme.cardBackground}
    `,
  };
}

export function getLuxuryItemBackground(level: number, itemIndex = 0): string {
  return getLuxuryLevelTheme(level, itemIndex).cardBackground;
}

export function getLuxuryItemGlow(level: number, itemIndex = 0): string {
  return getLuxuryLevelTheme(level, itemIndex).softShadow;
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
