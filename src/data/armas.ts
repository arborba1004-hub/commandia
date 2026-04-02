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
  object3d: string;
  price: number;
  attackBonus: number;
  defenseBonus: number;
  filterName: string;
  brightness: number;
  saturation: number;
}

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

const FILTERS = [
  { name: 'Iniciante', brightness: 1, saturation: 0.2 },
  { name: 'Simples', brightness: 0.9, saturation: 0.3 },
  { name: 'Médio', brightness: 0.8, saturation: 0.4 },
  { name: 'Top', brightness: 0.85, saturation: 0.6 },
  { name: 'Militar', brightness: 0.75, saturation: 0.7 },
  { name: 'Profissional', brightness: 0.6, saturation: 0.8 },
  { name: 'Ultra', brightness: 0.7, saturation: 1 },
  { name: 'Max', brightness: 1.1, saturation: 0.5 },
  { name: 'Lendário', brightness: 1.2, saturation: 0.6 },
  { name: 'Domínio', brightness: 1.3, saturation: 0.8 },
];

function calculatePrice(level: number) {
  let price = 122;
  for (let i = 2; i <= level; i++) {
    price = price * 1.11 + 3;
  }
  return Math.floor(price);
}

function calculateBonus(level: number) {
  const base = 0.5 + (level - 1) * 0.1;

  return {
    attack: level % 2 === 0 ? base : 0,
    defense: level % 2 !== 0 ? base : 0,
  };
}

export const WEAPONS: Weapon[] = Array.from({ length: 100 }).map((_, i) => {
  const level = i + 1;
  const tier = Math.floor((level - 1) / 10);
  const filter = FILTERS[tier];
  const bonus = calculateBonus(level);

  return {
    level,
    name: `Arma Nível ${level}`,
    category: 'knife',
    object3d: GLB_MODELS[level % 10],
    price: calculatePrice(level),
    attackBonus: Number(bonus.attack.toFixed(2)),
    defenseBonus: Number(bonus.defense.toFixed(2)),
    filterName: filter.name,
    brightness: filter.brightness,
    saturation: filter.saturation,
  };
});