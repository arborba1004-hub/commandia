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

export function getLuxuryItemBackground(level: number, itemIndex = 0): string {
  const safeLevel = clampLuxuryLevel(level);
  const hue = (safeLevel * 29 + itemIndex * 37) % 360;
  const hue2 = (hue + 48) % 360;
  const hue3 = (hue + 120) % 360;

  return `
    radial-gradient(circle at 24% 18%, hsla(${hue}, 95%, 66%, 0.42), transparent 32%),
    radial-gradient(circle at 82% 12%, hsla(${hue3}, 82%, 62%, 0.22), transparent 28%),
    linear-gradient(135deg, hsl(${hue}, 52%, 17%), hsl(${hue2}, 64%, 8%) 58%, #050207)
  `;
}

export function getLuxuryItemGlow(level: number, itemIndex = 0): string {
  const safeLevel = clampLuxuryLevel(level);
  const hue = (safeLevel * 29 + itemIndex * 37) % 360;
  return `0 0 22px hsla(${hue}, 95%, 65%, 0.40), 0 18px 60px rgba(0,0,0,0.42)`;
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
