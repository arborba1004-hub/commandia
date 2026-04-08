// ==========================================
// LUXURY ITEMS SYSTEM - 100 FIXED LEVELS
// ==========================================

export type LuxuryItemKey =
  | 'ring'
  | 'bracelet'
  | 'chain'
  | 'watch'
  | 'bag'
  | 'sunglasses';

export type SkillType =
  | 'attack'
  | 'defense'
  | 'intelligence'
  | 'agility'
  | 'respect'
  | 'vigor';

export type LuxuryItemBase = {
  key: LuxuryItemKey;
  name: string;
  image: string;
  skill: SkillType;
  priceMultiplier: number;
  bonusMultiplier: number;
};

export type LuxuryVisualTier = {
  level: number;
  collectionName: string;
  themeColor: string;
  accentColor: string;
  glowColor: string;
  shadowColor: string;
  textColor: string;
  frameStyle: string;
  background: string;
  backgroundSolid: string;
};

export type LuxuryItem = {
  key: LuxuryItemKey;
  name: string;
  image: string;
  price: number;
  skill: SkillType;
  themeColor: string;
  accentColor: string;
  glowColor: string;
  frameStyle: string;
  collectionLevel: number;
  collectionName: string;
  bonusValue: number;
  withInsurancePrice: number;
};

export type LuxurySystem = {
  level: number;
  collectionName: string;
  themeColor: string;
  accentColor: string;
  glowColor: string;
  shadowColor: string;
  textColor: string;
  frameStyle: string;
  background: string;
  backgroundSolid: string;
  items: LuxuryItem[];
};

const ITEM_TYPES: LuxuryItemBase[] = [
  {
    key: 'ring',
    name: 'Anel',
    image: 'https://static.wixstatic.com/media/50f4bf_651d1089b4f94751b866a45cbd902243~mv2.png',
    skill: 'attack',
    priceMultiplier: 1.0,
    bonusMultiplier: 1.0,
  },
  {
    key: 'bracelet',
    name: 'Pulseira',
    image: 'https://static.wixstatic.com/media/50f4bf_44c2d719e7974529b9e0eea26dc937fa~mv2.png',
    skill: 'defense',
    priceMultiplier: 1.08,
    bonusMultiplier: 1.04,
  },
  {
    key: 'chain',
    name: 'Corrente',
    image: 'https://static.wixstatic.com/media/50f4bf_95112066aaa34deba75e3955a7a9198b~mv2.png',
    skill: 'intelligence',
    priceMultiplier: 1.16,
    bonusMultiplier: 1.08,
  },
  {
    key: 'watch',
    name: 'Relógio',
    image: 'https://static.wixstatic.com/media/50f4bf_9589a22c92ea41d0a4d64f480b077d89~mv2.png',
    skill: 'agility',
    priceMultiplier: 1.24,
    bonusMultiplier: 1.12,
  },
  {
    key: 'bag',
    name: 'Bolsa',
    image: 'https://static.wixstatic.com/media/50f4bf_0ed2c4ee08714e1b923b1e2def99fce9~mv2.png',
    skill: 'respect',
    priceMultiplier: 1.32,
    bonusMultiplier: 1.16,
  },
  {
    key: 'sunglasses',
    name: 'Óculos',
    image: 'https://static.wixstatic.com/media/50f4bf_34b7f97d84b44ab7868db573ab58e00a~mv2.png',
    skill: 'vigor',
    priceMultiplier: 1.4,
    bonusMultiplier: 1.2,
  },
];

export const collectionNames: Record<number, string> = {
  1: 'Básico',
  2: 'Simples',
  3: 'Refinado',
  4: 'Premium',
  5: 'Luxo',
  6: 'Elite',
  7: 'Supremo',
  8: 'Imperial',
  9: 'Real',
  10: 'Magnata',
  11: 'Aristocrata',
  12: 'Nobre',
  13: 'Dinastia',
  14: 'Herança',
  15: 'Fortuna',
  16: 'Prestige',
  17: 'Elite Suprema',
  18: 'Império',
  19: 'Apex',
  20: 'Soberano',
  21: 'Monarca',
  22: 'Coroa',
  23: 'Platinum',
  24: 'Royal',
  25: 'Infinite',
  26: 'Legacy',
  27: 'Obsidian',
  28: 'Velvet',
  29: 'Noir',
  30: 'Zenith',
  31: 'Imperial Noir',
  32: 'Crown Legacy',
  33: 'Supreme Dynasty',
  34: 'Golden Empire',
  35: 'Infinite Prestige',
  36: 'Platinum Empire',
  37: 'Diamond Sovereign',
  38: 'Black Crown',
  39: 'Obsidian Royalty',
  40: 'Apex Dynasty',
  41: 'Syndicate',
  42: 'Mafia Royale',
  43: 'Casino Prestige',
  44: 'Diamond Syndicate',
  45: 'Black Market',
  46: 'Underworld',
  47: 'Crimson Empire',
  48: 'Platinum Syndicate',
  49: 'Cartel Elite',
  50: 'Apex Underworld',
  51: 'Billionaire',
  52: 'Global Elite',
  53: 'Supreme Capital',
  54: 'Infinite Wealth',
  55: 'Ultra Dynasty',
  56: 'Titan',
  57: 'Apex Billionaire',
  58: 'Supreme Mogul',
  59: 'Infinite Empire',
  60: 'Ultimate Sovereign',
  61: 'Eternal',
  62: 'Divine',
  63: 'Celestial',
  64: 'Infinite Aura',
  65: 'Obsidian Legend',
  66: 'Diamond Eternity',
  67: 'Mythic',
  68: 'Majesty',
  69: 'Cosmic',
  70: 'Apex Infinity',
  71: 'Eternal Apex',
  72: 'Divine Infinity',
  73: 'Celestial Apex',
  74: 'Infinite Divinity',
  75: 'Godtier',
  76: 'Immortal',
  77: 'Mythic Infinity',
  78: 'Supreme Eternity',
  79: 'Cosmic Apex',
  80: 'Absolute Infinity',
  81: 'Eternal God',
  82: 'Divinity Prime',
  83: 'Celestial Absolute',
  84: 'Apex Divinity',
  85: 'Godhood',
  86: 'Absolute Supreme',
  87: 'Omnipotent',
  88: 'Transcendent',
  89: 'Cosmic Supreme',
  90: 'Overlord',
  91: 'Creator',
  92: 'Absolute Creator',
  93: 'Architect',
  94: 'Infinite Architect',
  95: 'Supreme Entity',
  96: 'Absolute Entity',
  97: 'Eternal Entity',
  98: 'Infinite Entity',
  99: 'Supreme Infinity',
  100: 'Domínio do Comando',
};

const LEVEL_COLORS: Array<{
  themeColor: string;
  accentColor: string;
  glowColor: string;
  shadowColor: string;
  textColor: string;
  frameStyle: string;
}> = [
  { themeColor: '#f3f4f6', accentColor: '#d1d5db', glowColor: '#ffffff', shadowColor: 'rgba(255,255,255,0.18)', textColor: '#f9fafb', frameStyle: 'ice-silver' },
  { themeColor: '#9ca3af', accentColor: '#6b7280', glowColor: '#e5e7eb', shadowColor: 'rgba(209,213,219,0.22)', textColor: '#f3f4f6', frameStyle: 'urban-silver' },

  { themeColor: '#d9f99d', accentColor: '#84cc16', glowColor: '#ecfccb', shadowColor: 'rgba(190,242,100,0.24)', textColor: '#f7fee7', frameStyle: 'lime-flare' },
  { themeColor: '#4d7c0f', accentColor: '#365314', glowColor: '#a3e635', shadowColor: 'rgba(132,204,22,0.24)', textColor: '#ecfccb', frameStyle: 'olive-lux' },

  { themeColor: '#bfdbfe', accentColor: '#60a5fa', glowColor: '#dbeafe', shadowColor: 'rgba(147,197,253,0.24)', textColor: '#eff6ff', frameStyle: 'sky-glass' },
  { themeColor: '#1d4ed8', accentColor: '#1e3a8a', glowColor: '#93c5fd', shadowColor: 'rgba(59,130,246,0.24)', textColor: '#dbeafe', frameStyle: 'royal-blue' },

  { themeColor: '#fde68a', accentColor: '#f59e0b', glowColor: '#fef3c7', shadowColor: 'rgba(251,191,36,0.24)', textColor: '#fffbeb', frameStyle: 'gold-light' },
  { themeColor: '#b45309', accentColor: '#78350f', glowColor: '#fbbf24', shadowColor: 'rgba(245,158,11,0.24)', textColor: '#fef3c7', frameStyle: 'gold-heavy' },

  { themeColor: '#fecdd3', accentColor: '#fb7185', glowColor: '#ffe4e6', shadowColor: 'rgba(251,113,133,0.24)', textColor: '#fff1f2', frameStyle: 'rose-shine' },
  { themeColor: '#be123c', accentColor: '#881337', glowColor: '#fda4af', shadowColor: 'rgba(244,63,94,0.24)', textColor: '#ffe4e6', frameStyle: 'crimson-velvet' },

  { themeColor: '#e9d5ff', accentColor: '#c084fc', glowColor: '#f3e8ff', shadowColor: 'rgba(192,132,252,0.24)', textColor: '#faf5ff', frameStyle: 'violet-luxe' },
  { themeColor: '#6d28d9', accentColor: '#4c1d95', glowColor: '#d8b4fe', shadowColor: 'rgba(139,92,246,0.24)', textColor: '#f3e8ff', frameStyle: 'imperial-violet' },

  { themeColor: '#99f6e4', accentColor: '#2dd4bf', glowColor: '#ccfbf1', shadowColor: 'rgba(45,212,191,0.24)', textColor: '#f0fdfa', frameStyle: 'teal-mirror' },
  { themeColor: '#0f766e', accentColor: '#134e4a', glowColor: '#5eead4', shadowColor: 'rgba(20,184,166,0.24)', textColor: '#ccfbf1', frameStyle: 'deep-teal' },

  { themeColor: '#fdba74', accentColor: '#f97316', glowColor: '#ffedd5', shadowColor: 'rgba(249,115,22,0.24)', textColor: '#fff7ed', frameStyle: 'orange-fusion' },
  { themeColor: '#c2410c', accentColor: '#7c2d12', glowColor: '#fb923c', shadowColor: 'rgba(234,88,12,0.24)', textColor: '#ffedd5', frameStyle: 'burnt-orange' },

  { themeColor: '#c7d2fe', accentColor: '#818cf8', glowColor: '#e0e7ff', shadowColor: 'rgba(129,140,248,0.24)', textColor: '#eef2ff', frameStyle: 'indigo-ice' },
  { themeColor: '#4338ca', accentColor: '#312e81', glowColor: '#a5b4fc', shadowColor: 'rgba(99,102,241,0.24)', textColor: '#e0e7ff', frameStyle: 'indigo-crown' },

  { themeColor: '#a7f3d0', accentColor: '#34d399', glowColor: '#d1fae5', shadowColor: 'rgba(52,211,153,0.24)', textColor: '#ecfdf5', frameStyle: 'emerald-soft' },
  { themeColor: '#047857', accentColor: '#064e3b', glowColor: '#6ee7b7', shadowColor: 'rgba(16,185,129,0.24)', textColor: '#d1fae5', frameStyle: 'emerald-royal' },

  { themeColor: '#f5d0fe', accentColor: '#e879f9', glowColor: '#fae8ff', shadowColor: 'rgba(232,121,249,0.24)', textColor: '#fdf4ff', frameStyle: 'fuchsia-glam' },
  { themeColor: '#a21caf', accentColor: '#701a75', glowColor: '#f0abfc', shadowColor: 'rgba(217,70,239,0.24)', textColor: '#fae8ff', frameStyle: 'fuchsia-noir' },

  { themeColor: '#67e8f9', accentColor: '#06b6d4', glowColor: '#cffafe', shadowColor: 'rgba(34,211,238,0.24)', textColor: '#ecfeff', frameStyle: 'cyan-prime' },
  { themeColor: '#0e7490', accentColor: '#164e63', glowColor: '#67e8f9', shadowColor: 'rgba(6,182,212,0.24)', textColor: '#cffafe', frameStyle: 'cyan-depth' },

  { themeColor: '#fca5a5', accentColor: '#ef4444', glowColor: '#fee2e2', shadowColor: 'rgba(248,113,113,0.24)', textColor: '#fef2f2', frameStyle: 'ruby-light' },
  { themeColor: '#b91c1c', accentColor: '#7f1d1d', glowColor: '#fca5a5', shadowColor: 'rgba(239,68,68,0.24)', textColor: '#fee2e2', frameStyle: 'ruby-crime' },

  { themeColor: '#fde047', accentColor: '#eab308', glowColor: '#fef9c3', shadowColor: 'rgba(250,204,21,0.24)', textColor: '#fefce8', frameStyle: 'solar-gold' },
  { themeColor: '#a16207', accentColor: '#713f12', glowColor: '#facc15', shadowColor: 'rgba(234,179,8,0.24)', textColor: '#fef9c3', frameStyle: 'solar-onyx' },

  { themeColor: '#ddd6fe', accentColor: '#a78bfa', glowColor: '#ede9fe', shadowColor: 'rgba(167,139,250,0.24)', textColor: '#f5f3ff', frameStyle: 'amethyst-soft' },
  { themeColor: '#5b21b6', accentColor: '#3b0764', glowColor: '#c4b5fd', shadowColor: 'rgba(139,92,246,0.24)', textColor: '#ede9fe', frameStyle: 'amethyst-dark' },

  { themeColor: '#86efac', accentColor: '#22c55e', glowColor: '#dcfce7', shadowColor: 'rgba(74,222,128,0.24)', textColor: '#f0fdf4', frameStyle: 'green-glow' },
  { themeColor: '#166534', accentColor: '#14532d', glowColor: '#86efac', shadowColor: 'rgba(34,197,94,0.24)', textColor: '#dcfce7', frameStyle: 'green-empire' },

  { themeColor: '#fbcfe8', accentColor: '#ec4899', glowColor: '#fdf2f8', shadowColor: 'rgba(244,114,182,0.24)', textColor: '#fdf2f8', frameStyle: 'pink-luxe' },
  { themeColor: '#9d174d', accentColor: '#831843', glowColor: '#f9a8d4', shadowColor: 'rgba(236,72,153,0.24)', textColor: '#fce7f3', frameStyle: 'pink-noir' },

  { themeColor: '#bae6fd', accentColor: '#38bdf8', glowColor: '#e0f2fe', shadowColor: 'rgba(56,189,248,0.24)', textColor: '#f0f9ff', frameStyle: 'ice-blue' },
  { themeColor: '#075985', accentColor: '#082f49', glowColor: '#7dd3fc', shadowColor: 'rgba(14,165,233,0.24)', textColor: '#e0f2fe', frameStyle: 'ocean-royal' },

  { themeColor: '#e5e7eb', accentColor: '#94a3b8', glowColor: '#f8fafc', shadowColor: 'rgba(148,163,184,0.24)', textColor: '#f8fafc', frameStyle: 'steel-prime' },
  { themeColor: '#334155', accentColor: '#0f172a', glowColor: '#cbd5e1', shadowColor: 'rgba(100,116,139,0.24)', textColor: '#e2e8f0', frameStyle: 'steel-noir' },

  { themeColor: '#faf089', accentColor: '#fbbf24', glowColor: '#fffbea', shadowColor: 'rgba(251,191,36,0.24)', textColor: '#fffbea', frameStyle: 'champagne-light' },
  { themeColor: '#92400e', accentColor: '#451a03', glowColor: '#fcd34d', shadowColor: 'rgba(245,158,11,0.24)', textColor: '#fef3c7', frameStyle: 'champagne-noir' },

  { themeColor: '#d1fae5', accentColor: '#10b981', glowColor: '#ecfdf5', shadowColor: 'rgba(16,185,129,0.24)', textColor: '#ecfdf5', frameStyle: 'mint-glow' },
  { themeColor: '#065f46', accentColor: '#022c22', glowColor: '#6ee7b7', shadowColor: 'rgba(5,150,105,0.24)', textColor: '#d1fae5', frameStyle: 'mint-shadow' },

  { themeColor: '#fecaca', accentColor: '#f87171', glowColor: '#fef2f2', shadowColor: 'rgba(248,113,113,0.24)', textColor: '#fff1f2', frameStyle: 'coral-blush' },
  { themeColor: '#991b1b', accentColor: '#450a0a', glowColor: '#fca5a5', shadowColor: 'rgba(220,38,38,0.24)', textColor: '#fee2e2', frameStyle: 'coral-blood' },

  { themeColor: '#ede9fe', accentColor: '#8b5cf6', glowColor: '#f5f3ff', shadowColor: 'rgba(139,92,246,0.24)', textColor: '#faf5ff', frameStyle: 'ultra-violet' },
  { themeColor: '#4c1d95', accentColor: '#2e1065', glowColor: '#c4b5fd', shadowColor: 'rgba(124,58,237,0.24)', textColor: '#ede9fe', frameStyle: 'ultra-abyss' },

  { themeColor: '#f5f5f4', accentColor: '#a8a29e', glowColor: '#ffffff', shadowColor: 'rgba(214,211,209,0.24)', textColor: '#fafaf9', frameStyle: 'pearl-light' },
  { themeColor: '#44403c', accentColor: '#1c1917', glowColor: '#d6d3d1', shadowColor: 'rgba(120,113,108,0.24)', textColor: '#f5f5f4', frameStyle: 'pearl-obsidian' },

  { themeColor: '#ffe4e6', accentColor: '#fb7185', glowColor: '#fff1f2', shadowColor: 'rgba(251,113,133,0.24)', textColor: '#fff1f2', frameStyle: 'rose-diamond' },
  { themeColor: '#881337', accentColor: '#4c0519', glowColor: '#fda4af', shadowColor: 'rgba(225,29,72,0.24)', textColor: '#ffe4e6', frameStyle: 'rose-imperial' },

  { themeColor: '#fef3c7', accentColor: '#f59e0b', glowColor: '#fffbeb', shadowColor: 'rgba(245,158,11,0.24)', textColor: '#fff7ed', frameStyle: 'amber-light' },
  { themeColor: '#78350f', accentColor: '#451a03', glowColor: '#fbbf24', shadowColor: 'rgba(217,119,6,0.24)', textColor: '#fef3c7', frameStyle: 'amber-fortress' },

  // Levels 60-100 - Extended palette
  { themeColor: '#f3e8ff', accentColor: '#d8b4fe', glowColor: '#faf5ff', shadowColor: 'rgba(192,132,252,0.24)', textColor: '#faf5ff', frameStyle: 'lavender-light' },
  { themeColor: '#6b21a8', accentColor: '#4c1d95', glowColor: '#e9d5ff', shadowColor: 'rgba(168,85,247,0.24)', textColor: '#f3e8ff', frameStyle: 'lavender-dark' },

  { themeColor: '#fef08a', accentColor: '#facc15', glowColor: '#fffacd', shadowColor: 'rgba(250,204,21,0.24)', textColor: '#fffbeb', frameStyle: 'lemon-bright' },
  { themeColor: '#713f12', accentColor: '#451a03', glowColor: '#fcd34d', shadowColor: 'rgba(217,119,6,0.24)', textColor: '#fef3c7', frameStyle: 'lemon-dark' },

  { themeColor: '#e0e7ff', accentColor: '#a5b4fc', glowColor: '#f0f4ff', shadowColor: 'rgba(129,140,248,0.24)', textColor: '#eef2ff', frameStyle: 'periwinkle-light' },
  { themeColor: '#3730a3', accentColor: '#312e81', glowColor: '#818cf8', shadowColor: 'rgba(99,102,241,0.24)', textColor: '#e0e7ff', frameStyle: 'periwinkle-dark' },

  { themeColor: '#fce7f3', accentColor: '#f472b6', glowColor: '#fdf2f8', shadowColor: 'rgba(244,114,182,0.24)', textColor: '#fdf2f8', frameStyle: 'rose-light' },
  { themeColor: '#831843', accentColor: '#500724', glowColor: '#f9a8d4', shadowColor: 'rgba(236,72,153,0.24)', textColor: '#fce7f3', frameStyle: 'rose-dark' },

  { themeColor: '#dbeafe', accentColor: '#7dd3fc', glowColor: '#f0f9ff', shadowColor: 'rgba(56,189,248,0.24)', textColor: '#f0f9ff', frameStyle: 'sky-light' },
  { themeColor: '#0c4a6e', accentColor: '#082f49', glowColor: '#38bdf8', shadowColor: 'rgba(14,165,233,0.24)', textColor: '#dbeafe', frameStyle: 'sky-dark' },

  { themeColor: '#dcfce7', accentColor: '#86efac', glowColor: '#f0fdf4', shadowColor: 'rgba(74,222,128,0.24)', textColor: '#f0fdf4', frameStyle: 'lime-light' },
  { themeColor: '#15803d', accentColor: '#14532d', glowColor: '#4ade80', shadowColor: 'rgba(34,197,94,0.24)', textColor: '#dcfce7', frameStyle: 'lime-dark' },

  { themeColor: '#fef2f2', accentColor: '#fca5a5', glowColor: '#fff5f5', shadowColor: 'rgba(248,113,113,0.24)', textColor: '#fef2f2', frameStyle: 'red-light' },
  { themeColor: '#7f1d1d', accentColor: '#450a0a', glowColor: '#ef4444', shadowColor: 'rgba(239,68,68,0.24)', textColor: '#fee2e2', frameStyle: 'red-dark' },

  { themeColor: '#f0fdfa', accentColor: '#5eead4', glowColor: '#f0fdfa', shadowColor: 'rgba(45,212,191,0.24)', textColor: '#f0fdfa', frameStyle: 'teal-light' },
  { themeColor: '#134e4a', accentColor: '#0d3b3b', glowColor: '#2dd4bf', shadowColor: 'rgba(20,184,166,0.24)', textColor: '#ccfbf1', frameStyle: 'teal-dark' },

  { themeColor: '#fef9e7', accentColor: '#fbbf24', glowColor: '#fffbeb', shadowColor: 'rgba(251,191,36,0.24)', textColor: '#fffbeb', frameStyle: 'golden-light' },
  { themeColor: '#78350f', accentColor: '#451a03', glowColor: '#f59e0b', shadowColor: 'rgba(245,158,11,0.24)', textColor: '#fef3c7', frameStyle: 'golden-dark' },

  { themeColor: '#f5f3ff', accentColor: '#c4b5fd', glowColor: '#faf5ff', shadowColor: 'rgba(192,132,252,0.24)', textColor: '#faf5ff', frameStyle: 'purple-light' },
  { themeColor: '#4c1d95', accentColor: '#2e1065', glowColor: '#a78bfa', shadowColor: 'rgba(168,85,247,0.24)', textColor: '#ede9fe', frameStyle: 'purple-dark' },

  { themeColor: '#ecfdf5', accentColor: '#6ee7b7', glowColor: '#f0fdf4', shadowColor: 'rgba(16,185,129,0.24)', textColor: '#ecfdf5', frameStyle: 'emerald-light' },
  { themeColor: '#064e3b', accentColor: '#022c22', glowColor: '#10b981', shadowColor: 'rgba(16,185,129,0.24)', textColor: '#d1fae5', frameStyle: 'emerald-dark' },

  { themeColor: '#fdf4ff', accentColor: '#f0abfc', glowColor: '#faf5ff', shadowColor: 'rgba(232,121,249,0.24)', textColor: '#fdf4ff', frameStyle: 'magenta-light' },
  { themeColor: '#701a75', accentColor: '#581c87', glowColor: '#e879f9', shadowColor: 'rgba(217,70,239,0.24)', textColor: '#fae8ff', frameStyle: 'magenta-dark' },

  { themeColor: '#ecfeff', accentColor: '#67e8f9', glowColor: '#f0fdfa', shadowColor: 'rgba(34,211,238,0.24)', textColor: '#ecfeff', frameStyle: 'cyan-light' },
  { themeColor: '#0e7490', accentColor: '#164e63', glowColor: '#06b6d4', shadowColor: 'rgba(6,182,212,0.24)', textColor: '#cffafe', frameStyle: 'cyan-dark' },

  { themeColor: '#fff7ed', accentColor: '#fb923c', glowColor: '#fffbeb', shadowColor: 'rgba(249,115,22,0.24)', textColor: '#fff7ed', frameStyle: 'orange-light' },
  { themeColor: '#7c2d12', accentColor: '#431407', glowColor: '#f97316', shadowColor: 'rgba(234,88,12,0.24)', textColor: '#ffedd5', frameStyle: 'orange-dark' },

  { themeColor: '#eef2ff', accentColor: '#818cf8', glowColor: '#f5f3ff', shadowColor: 'rgba(129,140,248,0.24)', textColor: '#eef2ff', frameStyle: 'indigo-light' },
  { themeColor: '#312e81', accentColor: '#1e1b4b', glowColor: '#6366f1', shadowColor: 'rgba(99,102,241,0.24)', textColor: '#e0e7ff', frameStyle: 'indigo-dark' },

  { themeColor: '#f8fafc', accentColor: '#cbd5e1', glowColor: '#f1f5f9', shadowColor: 'rgba(148,163,184,0.24)', textColor: '#f8fafc', frameStyle: 'slate-light' },
  { themeColor: '#1e293b', accentColor: '#0f172a', glowColor: '#94a3b8', shadowColor: 'rgba(100,116,139,0.24)', textColor: '#e2e8f0', frameStyle: 'slate-dark' },

  { themeColor: '#fef3c7', accentColor: '#fbbf24', glowColor: '#fffbeb', shadowColor: 'rgba(251,191,36,0.24)', textColor: '#fffbeb', frameStyle: 'yellow-light' },
  { themeColor: '#92400e', accentColor: '#451a03', glowColor: '#f59e0b', shadowColor: 'rgba(245,158,11,0.24)', textColor: '#fef3c7', frameStyle: 'yellow-dark' },

  { themeColor: '#f0fdf4', accentColor: '#4ade80', glowColor: '#f0fdf4', shadowColor: 'rgba(74,222,128,0.24)', textColor: '#f0fdf4', frameStyle: 'green-light' },
  { themeColor: '#166534', accentColor: '#14532d', glowColor: '#22c55e', shadowColor: 'rgba(34,197,94,0.24)', textColor: '#dcfce7', frameStyle: 'green-dark' },

  { themeColor: '#fff1f2', accentColor: '#f87171', glowColor: '#fff5f5', shadowColor: 'rgba(248,113,113,0.24)', textColor: '#fff1f2', frameStyle: 'pink-light' },
  { themeColor: '#9f1239', accentColor: '#500724', glowColor: '#fb7185', shadowColor: 'rgba(244,63,94,0.24)', textColor: '#ffe4e6', frameStyle: 'pink-dark' },

  { themeColor: '#f0f9ff', accentColor: '#38bdf8', glowColor: '#f0f9ff', shadowColor: 'rgba(56,189,248,0.24)', textColor: '#f0f9ff', frameStyle: 'blue-light' },
  { themeColor: '#0c4a6e', accentColor: '#082f49', glowColor: '#0ea5e9', shadowColor: 'rgba(14,165,233,0.24)', textColor: '#dbeafe', frameStyle: 'blue-dark' },

  { themeColor: '#faf5ff', accentColor: '#d8b4fe', glowColor: '#faf5ff', shadowColor: 'rgba(192,132,252,0.24)', textColor: '#faf5ff', frameStyle: 'violet-light' },
  { themeColor: '#5b21b6', accentColor: '#3b0764', glowColor: '#c084fc', shadowColor: 'rgba(168,85,247,0.24)', textColor: '#ede9fe', frameStyle: 'violet-dark' },
];

const DEFAULT_PALETTE = {
  themeColor: '#ffffff',
  accentColor: '#ffd700',
  glowColor: '#ffffff',
  shadowColor: 'rgba(255,255,255,0.18)',
  textColor: '#ffffff',
  frameStyle: 'default',
};

const LEVEL_THEME_MAP: Record<number, LuxuryVisualTier> = Object.fromEntries(
  Array.from({ length: 100 }, (_, index) => {
    const level = index + 1;
    const palette = LEVEL_COLORS[index] || DEFAULT_PALETTE;

    const background = `
      radial-gradient(circle at 18% 20%, ${hexToRgba(palette.glowColor, 0.34)} 0%, transparent 28%),
      radial-gradient(circle at 82% 18%, ${hexToRgba(palette.accentColor, 0.22)} 0%, transparent 24%),
      radial-gradient(circle at 50% 78%, ${hexToRgba(palette.themeColor, 0.14)} 0%, transparent 34%),
      linear-gradient(135deg, ${hexToRgba('#050505', 0.96)} 0%, ${hexToRgba(palette.accentColor, 0.3)} 38%, ${hexToRgba(palette.themeColor, 0.46)} 68%, ${hexToRgba('#000000', 0.98)} 100%)
    `.replace(/\s+/g, ' ').trim();

    const tier: LuxuryVisualTier = {
      level,
      collectionName: collectionNames[level] || `Coleção ${level}`,
      themeColor: palette.themeColor,
      accentColor: palette.accentColor,
      glowColor: palette.glowColor,
      shadowColor: palette.shadowColor,
      textColor: palette.textColor,
      frameStyle: palette.frameStyle,
      background,
      backgroundSolid: palette.themeColor,
    };

    return [level, tier];
  })
) as Record<number, LuxuryVisualTier>;

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');

  const safeHex =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  const num = parseInt(safeHex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function clampLevel(level: number): number {
  return Math.min(100, Math.max(1, Number(level) || 1));
}

export function getCollectionNameByLevel(level: number): string {
  const safeLevel = clampLevel(level);
  return collectionNames[safeLevel] || `Coleção ${safeLevel}`;
}

export function getLuxuryThemeByLevel(level: number): LuxuryVisualTier {
  const safeLevel = clampLevel(level);
  return LEVEL_THEME_MAP[safeLevel];
}

export function getLuxuryPrice(level: number, itemKey?: LuxuryItemKey): number {
  const safeLevel = clampLevel(level);
  const basePrice = 120;
  const levelScaledPrice = basePrice * Math.pow(1.1, safeLevel - 1);

  const item = ITEM_TYPES.find((entry) => entry.key === itemKey);
  const itemMultiplier = item?.priceMultiplier ?? 1;

  return Number((levelScaledPrice * itemMultiplier).toFixed(2));
}

export function getLuxuryPriceWithInsurance(
  level: number,
  withInsurance: boolean,
  itemKey?: LuxuryItemKey
): number {
  const basePrice = getLuxuryPrice(level, itemKey);

  if (withInsurance) {
    return Number((basePrice * 1.1).toFixed(2));
  }

  return basePrice;
}

export function getSkillByItemId(itemId: number): SkillType {
  const itemIndex = (itemId - 1) % ITEM_TYPES.length;
  return ITEM_TYPES[itemIndex]?.skill || 'attack';
}

export function getLuxuryBonusValue(level: number, itemKey: LuxuryItemKey): number {
  const safeLevel = clampLevel(level);
  const item = ITEM_TYPES.find((entry) => entry.key === itemKey);

  if (!item) return safeLevel;

  const rawBonus = safeLevel * item.bonusMultiplier;
  return Number(rawBonus.toFixed(2));
}

export function generateLuxuryItems(level: number): LuxuryItem[] {
  const safeLevel = clampLevel(level);
  const theme = getLuxuryThemeByLevel(safeLevel);

  return ITEM_TYPES.map((item) => ({
    key: item.key,
    name: item.name,
    image: item.image,
    price: getLuxuryPrice(safeLevel, item.key),
    skill: item.skill,
    themeColor: theme.themeColor,
    accentColor: theme.accentColor,
    glowColor: theme.glowColor,
    frameStyle: theme.frameStyle,
    collectionLevel: safeLevel,
    collectionName: theme.collectionName,
    bonusValue: getLuxuryBonusValue(safeLevel, item.key),
    withInsurancePrice: getLuxuryPriceWithInsurance(safeLevel, true, item.key),
  }));
}

export function getBackgroundByLevel(level: number): string {
  return getLuxuryThemeByLevel(level).background;
}

export function getBackgroundColorByLevel(level: number): string {
  return getLuxuryThemeByLevel(level).backgroundSolid;
}

export function getLuxurySystem(playerBarracoLevel: number): LuxurySystem {
  const safeLevel = clampLevel(playerBarracoLevel);
  const theme = getLuxuryThemeByLevel(safeLevel);

  return {
    level: safeLevel,
    collectionName: theme.collectionName,
    themeColor: theme.themeColor,
    accentColor: theme.accentColor,
    glowColor: theme.glowColor,
    shadowColor: theme.shadowColor,
    textColor: theme.textColor,
    frameStyle: theme.frameStyle,
    background: theme.background,
    backgroundSolid: theme.backgroundSolid,
    items: generateLuxuryItems(safeLevel),
  };
}

export const luxuryVisualTiers = LEVEL_THEME_MAP;
export const luxuryItemBases = ITEM_TYPES;