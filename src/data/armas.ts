// ================= TYPES =================

export type WeaponCategory =
  | 'knife'
  | 'revolver'
  | 'pistol'
  | 'auto_pistol'
  | 'smg'
  | 'shotgun'
  | 'rifle'
  | 'assault'
  | 'machinegun'
  | 'launcher';

export interface Weapon {
  level: number;
  name: string;
  category: WeaponCategory;
  glb: string;
  price: number;
  attackBonus: number;
  defenseBonus: number;
  filter: string;
  skillBonusType?: 'attack' | 'defense';
  object3d?: string;
  filterCode?: string;
  playerStoreLevel?: number;
  filterName?: string;
  brightness?: number;
  saturation?: number;
  value?: number;
}

// ================= CONFIG =================

// 10 MODELOS BASE (1 por categoria)
const GLB_MODELS = [
  'https://static.wixstatic.com/3d/50f4bf_0fe925d5b5cc4ffca5f14a46fa4e73ba.glb',
  'https://static.wixstatic.com/3d/50f4bf_ac14fbf2d0f349e99a3c03567cc26847.glb',
  'https://static.wixstatic.com/3d/50f4bf_55fd8f2718ec488c847dae76837e9bbf.glb',
  'https://static.wixstatic.com/3d/50f4bf_add70388854642838acf0abfc25e972a.glb',
  'https://static.wixstatic.com/3d/50f4bf_7a15b5b9c38c4d638eeb9c5945f75d27.glb',
  'https://static.wixstatic.com/3d/50f4bf_6de2648984e144cdac6dd1893c185e44.glb',
  'https://static.wixstatic.com/3d/50f4bf_1ea1ccbedeee478bb415d3ec5ee1930e.glb',
  'https://static.wixstatic.com/3d/50f4bf_ccea81e2beb44f11bb022ba5fb82088c.glb',
  'https://static.wixstatic.com/3d/50f4bf_1967999289d04f1ca4bc06e94924596c.glb',
  'https://static.wixstatic.com/3d/50f4bf_065ab40322644d4ebdc2be1d0d8f9bbe.glb',
];

const CATEGORIES: WeaponCategory[] = [
  'knife',
  'revolver',
  'pistol',
  'auto_pistol',
  'smg',
  'shotgun',
  'rifle',
  'assault',
  'machinegun',
  'launcher',
];

const FILTERS = [
  'branco',           // Iniciante
  'cinza leve',       // Simples
  'cinza escuro',     // Médio
  'marrom',           // Top
  'verde militar',    // Militar
  'preto',            // Profissional
  'preto neon',       // Ultra
  'prata',            // Max
  'bronze metálico',  // Lendário
  'dourado',          // Domínio
  'dourado neon',     // Comando
];

// ================= HELPERS =================

function getCategoryByLevel(level: number): WeaponCategory {
  return CATEGORIES[(level - 1) % 10];
}

function getGLBByLevel(level: number): string {
  return GLB_MODELS[(level - 1) % 10];
}

function getFilterByLevel(level: number): string {
  const tier = Math.floor((level - 1) / 10);
  return FILTERS[tier];
}

// ================= PRICE =================

function calculatePrice(level: number): number {
  let price = 122;

  for (let i = 2; i <= level; i++) {
    price = price * 1.11 + 3;
  }

  return Math.floor(price);
}

// ================= BONUS =================

function calculateBonus(level: number) {
  let attack = 0;
  let defense = 0;

  for (let i = 1; i <= level; i++) {
    const base = 0.5 + (i - 1) * 0.1;

    if (i % 2 === 0) {
      attack += base;
    } else {
      defense += base;
    }
  }

  return {
    attack: Number(attack.toFixed(2)),
    defense: Number(defense.toFixed(2)),
  };
}

// ================= GENERATOR =================

export function generateWeapons(): Weapon[] {
  const weapons: Weapon[] = [];

  for (let level = 1; level <= 100; level++) {
    const bonus = calculateBonus(level);

    weapons.push({
      level,
      name: `Arma Nível ${level}`,
      category: getCategoryByLevel(level),
      glb: getGLBByLevel(level),
      price: calculatePrice(level),
      attackBonus: bonus.attack,
      defenseBonus: bonus.defense,
      filter: getFilterByLevel(level),
    });
  }

  return weapons;
}

// ================= INSTANCE =================

export const WEAPONS = generateWeapons();

// ================= GAME RULE =================

// Pode comprar arma do nível atual ou inferior
export function canBuyWeapon(playerLevel: number, weaponLevel: number) {
  return weaponLevel <= playerLevel;
}

// ================= WEAPON GETTER =================

export function getWeaponByPlayerLevel(playerLevel: number): Weapon | null {
  if (playerLevel < 1 || playerLevel > 100) {
    return null;
  }

  const baseWeapon = WEAPONS[playerLevel - 1];
  if (!baseWeapon) {
    return null;
  }

  const bonus = calculateBonus(playerLevel);
  const skillBonusType = playerLevel % 2 === 0 ? 'attack' : 'defense';
  const skillBonusPercent = skillBonusType === 'attack' ? bonus.attack * 10 : bonus.defense * 10;

  return {
    ...baseWeapon,
    skillBonusType,
    skillBonusPercent: Math.round(skillBonusPercent),
    object3d: baseWeapon.glb,
    filterCode: baseWeapon.filter,
    playerStoreLevel: playerLevel,
    filterName: FILTERS[Math.floor((playerLevel - 1) / 10)],
    brightness: 100 + (playerLevel % 10) * 5,
    saturation: 80 + (playerLevel % 10) * 2,
    value: baseWeapon.price,
  };
}