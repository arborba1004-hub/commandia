import type { GangAtributos, GangMemberType } from '@/types/gang';

export type FugaSkillType = 'attack' | 'defense' | 'agility' | 'intelligence' | 'respect' | 'vigor';
export type FugaGangStat = keyof GangAtributos;

export type FugaTheme = {
  name: string;
  background: string;
  cardBackground: string;
  mediaBackground: string;
  accent: string;
  accentSoft: string;
  border: string;
  shadow: string;
  textGlow: string;
};

export type FugaVehicleUpgrade = {
  key: string;
  name: string;
  description: string;
  targetType: GangMemberType;
  targetStat: FugaGangStat;
};

export const FUGA_MAX_LEVEL = 100;
export const FUGA_MIN_PRICE = 103;
export const FUGA_MAX_PRICE = 750_000_000;
export const FUGA_BASE_BONUS_PERCENT = 1;

export const FUGA_VEHICLE_UPGRADES: FugaVehicleUpgrade[] = [
  {
    key: 'turbo_reforcado',
    name: 'Turbo Reforçado',
    description: 'Arrancada brutal para escapar antes da blitz fechar o cerco.',
    targetType: 'motorista',
    targetStat: 'rajada',
  },
  {
    key: 'pneus_alta_performance',
    name: 'Pneus de Alta Performance',
    description: 'Mais controle em curva, fuga mais estável e menor risco de perder o bonde.',
    targetType: 'motorista',
    targetStat: 'folego',
  },
  {
    key: 'motor_preparado',
    name: 'Motor Preparado',
    description: 'Potência extra para blindados e comboios pesados.',
    targetType: 'nitro',
    targetStat: 'rajada',
  },
  {
    key: 'blindagem_leve',
    name: 'Blindagem Leve',
    description: 'Proteção contra interceptação, tiro perdido e batida de bloqueio.',
    targetType: 'motorista',
    targetStat: 'blindagem',
  },
  {
    key: 'anti_rastreamento',
    name: 'Sistema Anti-Rastreamento',
    description: 'Corta rastreio, reduz risco operacional e melhora resposta da equipe.',
    targetType: 'certeiro',
    targetStat: 'quebra',
  },
  {
    key: 'nitrox',
    name: 'Nitrox',
    description: 'Explosão de mobilidade para escapar em último segundo.',
    targetType: 'nitro',
    targetStat: 'quebra',
  },
];

export function clampFugaLevel(level: number): number {
  return Math.min(FUGA_MAX_LEVEL, Math.max(1, Math.floor(Number(level) || 1)));
}

export function getFugaVehiclePrice(level: number): number {
  const safeLevel = clampFugaLevel(level);
  if (safeLevel <= 1) return FUGA_MIN_PRICE;
  if (safeLevel >= FUGA_MAX_LEVEL) return FUGA_MAX_PRICE;

  const ratio = Math.pow(FUGA_MAX_PRICE / FUGA_MIN_PRICE, (safeLevel - 1) / (FUGA_MAX_LEVEL - 1));
  return Number((FUGA_MIN_PRICE * ratio).toFixed(2));
}

export function getFugaVehicleUpgradePrice(vehicleLevel: number, upgradeIndex = 0): number {
  const vehiclePrice = getFugaVehiclePrice(vehicleLevel);
  const multiplier = 0.045 + upgradeIndex * 0.01;
  return Number(Math.max(99, vehiclePrice * multiplier).toFixed(2));
}

export function getFugaBonusPercent(playerLevel: number): number {
  return Number(playerLevel || 1) >= 51 ? 2 : 1;
}

export function getFugaProtectionPercentFromInventory(player: any): number {
  const ownedCount = Array.isArray(player?.ownedVehicles) ? player.ownedVehicles.length : 0;
  const items = Array.isArray(player?.inventory?.items) ? player.inventory.items : [];
  const bestLevel = items.reduce((max: number, item: any) => {
    const isFugaVehicle = item?.category === 'fuga_vehicle' || (item?.source === 'fuga' && (item?.vehicleId || item?.category === 'vehicle'));
    return isFugaVehicle ? Math.max(max, clampFugaLevel(item?.level || 1)) : max;
  }, 0);

  return Math.min(55, Math.round((bestLevel * 0.45 + ownedCount * 1.25) * 10) / 10);
}

export function normalizeFugaSkill(value?: string | null): FugaSkillType {
  const normalized = String(value || '').trim().toLowerCase();
  const map: Record<string, FugaSkillType> = {
    attack: 'attack',
    ataque: 'attack',
    rajada: 'attack',
    defense: 'defense',
    defesa: 'defense',
    blindagem: 'defense',
    agility: 'agility',
    agilidade: 'agility',
    mobilidade: 'agility',
    intelligence: 'intelligence',
    inteligencia: 'intelligence',
    inteligência: 'intelligence',
    respect: 'respect',
    respeito: 'respect',
    vigor: 'vigor',
    folego: 'vigor',
    fôlego: 'vigor',
  };

  return map[normalized] || 'agility';
}

export function getFugaSkillLabel(skill?: string | null): string {
  const normalized = normalizeFugaSkill(skill);
  const labels: Record<FugaSkillType, string> = {
    attack: 'Ataque',
    defense: 'Defesa',
    agility: 'Agilidade',
    intelligence: 'Inteligência',
    respect: 'Respeito',
    vigor: 'Vigor',
  };
  return labels[normalized];
}

export function getFugaGangBonusTarget(skill?: string | null): { targetType: GangMemberType; targetStat: FugaGangStat; label: string } {
  const normalized = normalizeFugaSkill(skill);
  const map: Record<FugaSkillType, { targetType: GangMemberType; targetStat: FugaGangStat; label: string }> = {
    attack: { targetType: 'nitro', targetStat: 'rajada', label: 'Rajada em Nitro' },
    defense: { targetType: 'motorista', targetStat: 'blindagem', label: 'Blindagem em Motorista' },
    agility: { targetType: 'motorista', targetStat: 'folego', label: 'Fôlego em Motorista' },
    intelligence: { targetType: 'certeiro', targetStat: 'quebra', label: 'Quebra em Certeiro' },
    respect: { targetType: 'capanga', targetStat: 'blindagem', label: 'Blindagem em Capanga' },
    vigor: { targetType: 'nitro', targetStat: 'folego', label: 'Fôlego em Nitro' },
  };
  return map[normalized];
}

function themeFromPair(level: number, hue: number, hue2: number, name: string): FugaTheme {
  const safe = clampFugaLevel(level);
  return {
    name,
    background: `
      radial-gradient(circle at 16% 16%, hsla(${hue}, 95%, 62%, 0.30), transparent 30%),
      radial-gradient(circle at 84% 22%, hsla(${hue2}, 92%, 58%, 0.24), transparent 28%),
      radial-gradient(circle at 50% 88%, hsla(${(hue + 78) % 360}, 92%, 52%, 0.20), transparent 34%),
      linear-gradient(135deg, hsl(${hue}, 50%, 10%), hsl(${hue2}, 62%, 7%))
    `,
    cardBackground: `
      radial-gradient(circle at 22% 16%, hsla(${hue}, 95%, 65%, 0.30), transparent 36%),
      radial-gradient(circle at 82% 20%, hsla(${hue2}, 92%, 60%, 0.22), transparent 34%),
      linear-gradient(155deg, hsla(${hue}, 56%, 18%, 0.94), hsla(${hue2}, 54%, 8%, 0.96))
    `,
    mediaBackground: `
      radial-gradient(circle at 50% 45%, hsla(${hue}, 90%, 62%, 0.24), transparent 36%),
      linear-gradient(145deg, hsla(${hue}, 46%, 14%, 0.86), rgba(0,0,0,0.70))
    `,
    accent: `hsl(${hue}, 95%, ${safe >= 90 ? 72 : 62}%)`,
    accentSoft: `hsla(${hue}, 95%, 62%, 0.28)`,
    border: `hsla(${hue}, 88%, 72%, 0.42)`,
    shadow: `0 0 28px hsla(${hue}, 96%, 62%, 0.24), 0 24px 80px rgba(0,0,0,0.55)`,
    textGlow: `0 0 22px hsla(${hue}, 95%, 68%, 0.34)`,
  };
}

export function getFugaTheme(level: number): FugaTheme {
  const safe = clampFugaLevel(level);

  const overrides: Record<number, FugaTheme> = {
    1: {
      name: 'Asfalto Cinza',
      background: 'linear-gradient(135deg, #161616, #4b4b4b 52%, #090909)',
      cardBackground: 'linear-gradient(145deg, rgba(72,72,72,.96), rgba(18,18,18,.97))',
      mediaBackground: 'linear-gradient(145deg, rgba(90,90,90,.32), rgba(0,0,0,.72))',
      accent: '#c7c7c7',
      accentSoft: 'rgba(199,199,199,.24)',
      border: 'rgba(210,210,210,.38)',
      shadow: '0 0 24px rgba(210,210,210,.16), 0 24px 80px rgba(0,0,0,.55)',
      textGlow: '0 0 18px rgba(230,230,230,.24)',
    },
    2: {
      name: 'Verde Favela',
      background: 'linear-gradient(135deg, #06170d, #1f7a39 54%, #031009)',
      cardBackground: 'radial-gradient(circle at 24% 16%, rgba(96,255,159,.36), transparent 35%), linear-gradient(145deg, rgba(22,92,48,.96), rgba(2,17,9,.98))',
      mediaBackground: 'radial-gradient(circle at 52% 44%, rgba(73,245,136,.26), transparent 36%), linear-gradient(145deg, rgba(13,70,34,.8), rgba(0,0,0,.76))',
      accent: '#75ff9e',
      accentSoft: 'rgba(117,255,158,.28)',
      border: 'rgba(117,255,158,.42)',
      shadow: '0 0 30px rgba(83,255,145,.22), 0 24px 80px rgba(0,0,0,.55)',
      textGlow: '0 0 22px rgba(117,255,158,.28)',
    },
    3: {
      name: 'Amarelo Ouro',
      background: 'linear-gradient(135deg, #201500, #d7ae27 50%, #120b00)',
      cardBackground: 'radial-gradient(circle at 22% 18%, rgba(255,218,88,.38), transparent 35%), linear-gradient(145deg, rgba(116,84,9,.96), rgba(18,11,0,.98))',
      mediaBackground: 'radial-gradient(circle at 52% 45%, rgba(255,222,96,.28), transparent 36%), linear-gradient(145deg, rgba(116,82,8,.82), rgba(0,0,0,.76))',
      accent: '#ffd85b',
      accentSoft: 'rgba(255,216,91,.30)',
      border: 'rgba(255,216,91,.48)',
      shadow: '0 0 32px rgba(255,211,66,.26), 0 24px 80px rgba(0,0,0,.55)',
      textGlow: '0 0 22px rgba(255,216,91,.32)',
    },
    60: {
      name: 'Gradiente Azul Roxo',
      background: 'linear-gradient(135deg, #07153d, #1649ff 34%, #6f22ff 72%, #150522)',
      cardBackground: 'radial-gradient(circle at 18% 18%, rgba(70,128,255,.42), transparent 34%), radial-gradient(circle at 86% 28%, rgba(169,88,255,.35), transparent 36%), linear-gradient(145deg, rgba(12,36,130,.94), rgba(33,8,62,.98))',
      mediaBackground: 'radial-gradient(circle at 48% 46%, rgba(112,104,255,.30), transparent 38%), linear-gradient(145deg, rgba(10,34,125,.82), rgba(10,0,22,.78))',
      accent: '#8db2ff',
      accentSoft: 'rgba(141,178,255,.30)',
      border: 'rgba(151,123,255,.50)',
      shadow: '0 0 36px rgba(105,96,255,.30), 0 24px 90px rgba(0,0,0,.62)',
      textGlow: '0 0 24px rgba(141,178,255,.36)',
    },
    88: {
      name: 'Espiral Rosa',
      background: 'radial-gradient(circle at center, rgba(255,189,236,.25), transparent 24%), conic-gradient(from 18deg, #310016, #ff4fc3, #ffb3ea, #8b18ff, #ff4fc3, #310016)',
      cardBackground: 'radial-gradient(circle at 50% 50%, rgba(255,176,235,.24), transparent 23%), conic-gradient(from 28deg, rgba(255,79,195,.92), rgba(61,0,42,.96), rgba(142,24,255,.88), rgba(255,79,195,.92))',
      mediaBackground: 'radial-gradient(circle at 50% 45%, rgba(255,180,235,.34), transparent 34%), conic-gradient(from 8deg, rgba(255,79,195,.38), rgba(0,0,0,.76), rgba(142,24,255,.30), rgba(0,0,0,.72))',
      accent: '#ff95dd',
      accentSoft: 'rgba(255,149,221,.32)',
      border: 'rgba(255,149,221,.55)',
      shadow: '0 0 38px rgba(255,76,196,.34), 0 24px 90px rgba(0,0,0,.62)',
      textGlow: '0 0 25px rgba(255,149,221,.40)',
    },
    100: {
      name: 'Estrelas Douradas',
      background: `
        radial-gradient(circle at 10% 16%, rgba(255,215,0,.95) 0 2px, transparent 3px),
        radial-gradient(circle at 32% 26%, rgba(255,240,155,.95) 0 1.5px, transparent 2.5px),
        radial-gradient(circle at 70% 18%, rgba(255,215,0,.95) 0 2px, transparent 3px),
        radial-gradient(circle at 88% 54%, rgba(255,240,155,.95) 0 1.5px, transparent 2.5px),
        radial-gradient(circle at 18% 78%, rgba(255,215,0,.95) 0 2px, transparent 3px),
        radial-gradient(circle at 62% 84%, rgba(255,240,155,.95) 0 1.5px, transparent 2.5px),
        linear-gradient(135deg, #120a00, #7d5a00 48%, #1b1000)
      `,
      cardBackground: `
        radial-gradient(circle at 12% 18%, rgba(255,215,0,.70) 0 2px, transparent 3px),
        radial-gradient(circle at 78% 30%, rgba(255,245,178,.72) 0 1.5px, transparent 2.5px),
        radial-gradient(circle at 56% 74%, rgba(255,215,0,.70) 0 2px, transparent 3px),
        linear-gradient(145deg, rgba(128,92,0,.96), rgba(24,14,0,.98))
      `,
      mediaBackground: 'radial-gradient(circle at 50% 42%, rgba(255,217,79,.32), transparent 37%), linear-gradient(145deg, rgba(101,71,0,.82), rgba(0,0,0,.78))',
      accent: '#ffd76a',
      accentSoft: 'rgba(255,215,106,.34)',
      border: 'rgba(255,215,106,.62)',
      shadow: '0 0 44px rgba(255,215,0,.40), 0 24px 96px rgba(0,0,0,.66)',
      textGlow: '0 0 30px rgba(255,215,106,.44)',
    },
  };

  if (overrides[safe]) return overrides[safe];

  if (safe <= 10) return themeFromPair(safe, 92 + safe * 6, 152 + safe * 4, 'Rua Inicial');
  if (safe <= 20) return themeFromPair(safe, 28 + safe * 8, 204 + safe * 3, 'Cidade Quente');
  if (safe <= 40) return themeFromPair(safe, 192 + safe * 5, 256 + safe * 7, 'Neon Urbano');
  if (safe <= 60) return themeFromPair(safe, 220 + safe * 3, 278 + safe * 5, 'Noite Elétrica');
  if (safe <= 80) return themeFromPair(safe, 260 + safe * 4, 322 + safe * 6, 'Blindado Premium');
  if (safe <= 95) return themeFromPair(safe, 310 + safe * 3, 28 + safe * 5, 'Lendário');
  return themeFromPair(safe, 42 + safe * 2, 332 + safe * 4, 'Quase Supremo');
}

export function formatFugaMoney(value: number): string {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
