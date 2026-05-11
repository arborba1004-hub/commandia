// ==========================================
// LUXURY ITEMS SYSTEM - PROJECT CURRENT VERSION
// ==========================================

export type LuxuryItemKey =
  | 'ring'
  | 'bracelet'
  | 'chain'
  | 'watch'
  | 'bag'
  | 'sunglasses';

export type SkillType = 'attack' | 'defense' | 'intelligence' | 'agility' | 'respect' | 'vigor';

export type LuxuryItem = {
  key: LuxuryItemKey;
  name: string;
  image: string;
  price: number;
  skill?: SkillType;
};

export type LuxurySystem = {
  items: LuxuryItem[];
  background: string;
  collectionName: string;
};

const ITEM_TYPES: Array<{
  key: LuxuryItemKey;
  name: string;
  image: string;
  skill: SkillType;
}> = [
  {
    key: 'ring',
    name: 'Anel',
    image: 'https://static.wixstatic.com/media/50f4bf_651d1089b4f94751b866a45cbd902243~mv2.png',
    skill: 'attack',
  },
  {
    key: 'bracelet',
    name: 'Pulseira',
    image: 'https://static.wixstatic.com/media/50f4bf_44c2d719e7974529b9e0eea26dc937fa~mv2.png',
    skill: 'defense',
  },
  {
    key: 'chain',
    name: 'Corrente',
    image: 'https://static.wixstatic.com/media/50f4bf_95112066aaa34deba75e3955a7a9198b~mv2.png',
    skill: 'intelligence',
  },
  {
    key: 'watch',
    name: 'Relógio',
    image: 'https://static.wixstatic.com/media/50f4bf_9589a22c92ea41d0a4d64f480b077d89~mv2.png',
    skill: 'agility',
  },
  {
    key: 'bag',
    name: 'Bolsa',
    image: 'https://static.wixstatic.com/media/50f4bf_0ed2c4ee08714e1b923b1e2def99fce9~mv2.png',
    skill: 'respect',
  },
  {
    key: 'sunglasses',
    name: 'Óculos',
    image: 'https://static.wixstatic.com/media/50f4bf_34b7f97d84b44ab7868db573ab58e00a~mv2.png',
    skill: 'vigor',
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

export function getCollectionNameByLevel(level: number): string {
  const safeLevel = Math.min(100, Math.max(1, Number(level) || 1));
  return collectionNames[safeLevel] || `Coleção ${safeLevel}`;
}

export function getLuxuryPrice(level: number, _itemKey?: LuxuryItemKey): number {
  const safeLevel = Math.min(100, Math.max(1, Number(level) || 1));

  // Level 1 = 120, subsequent levels = previous * 1.1
  const basePrice = 120;
  const price = basePrice * Math.pow(1.1, safeLevel - 1);

  return Number(price.toFixed(2));
}

export function getLuxuryPriceWithInsurance(level: number, withInsurance: boolean, _itemKey?: LuxuryItemKey): number {
  const basePrice = getLuxuryPrice(level, _itemKey);
  
  if (withInsurance) {
    // Add 10% for insurance
    return Number((basePrice * 1.1).toFixed(2));
  }
  
  return basePrice;
}

export function getSkillByItemId(itemId: number): SkillType {
  const itemIndex = (itemId - 1) % ITEM_TYPES.length;
  return ITEM_TYPES[itemIndex]?.skill || 'attack';
}

export function generateLuxuryItems(level: number): LuxuryItem[] {
  const safeLevel = Math.min(100, Math.max(1, Number(level) || 1));

  return ITEM_TYPES.map((item) => ({
    key: item.key,
    name: item.name,
    image: item.image,
    price: getLuxuryPrice(safeLevel, item.key),
    skill: item.skill,
  }));
}

export function getBackgroundByLevel(level: number): string {
  const safeLevel = Math.min(100, Math.max(1, Number(level) || 1));

  if (safeLevel <= 10) {
    return 'linear-gradient(135deg, #2c2c2c, #1a1a1a)';
  }

  if (safeLevel <= 25) {
    return 'linear-gradient(135deg, #1e3c72, #2a5298)';
  }

  if (safeLevel <= 50) {
    return 'linear-gradient(135deg, #3a0ca3, #7209b7)';
  }

  if (safeLevel <= 75) {
    return 'linear-gradient(135deg, #000000, #d4af37)';
  }

  if (safeLevel <= 90) {
    return 'radial-gradient(circle at 30% 30%, #ffd700, #000000)';
  }

  return 'radial-gradient(circle at 50% 50%, #ffffff, #ffd700, #000000)';
}

export function getBackgroundColorByLevel(level: number): string {
  const safeLevel = Math.min(100, Math.max(1, Number(level) || 1));

  if (safeLevel <= 10) return '#2c2c2c';
  if (safeLevel <= 25) return '#1e3c72';
  if (safeLevel <= 50) return '#3a0ca3';
  if (safeLevel <= 75) return '#d4af37';
  if (safeLevel <= 90) return '#ffd700';
  return '#ffffff';
}

export function getLuxurySystem(playerBarracoLevel: number): LuxurySystem {
  const safeLevel = Math.min(100, Math.max(1, Number(playerBarracoLevel) || 1));

  return {
    items: generateLuxuryItems(safeLevel),
    background: getBackgroundByLevel(safeLevel),
    collectionName: getCollectionNameByLevel(safeLevel),
  };
}
