import type { GangAtributos, GangMemberType } from '@/types/gang';

export type FugaVehicleId =
  | 'touro_negro'
  | 'bastiao_vx'
  | 'vibora_900'
  | 'mirage_gt'
  | 'lastro_4x4'
  | 'silenciador_s'
  | 'dinamo_lx'
  | 'nitro_phantom';

export type FugaStatKey = keyof GangAtributos;

export type FugaVehicleTier = 'rua' | 'blindado' | 'elite' | 'phantom';

export type FugaVehicle = {
  id: FugaVehicleId;
  name: string;
  codename: string;
  tier: FugaVehicleTier;
  unlockBarracoLevel: number;
  priceCleanMoney: number;
  targetType: GangMemberType;
  targetStat: FugaStatKey;
  bonusPercent: number;
  role: string;
  headline: string;
  lore: string;
  mechanicNote: string;
  image: string;
  accent: string;
  accent2: string;
  danger: string;
};

export const FUGA_BONUS_PERCENT = 1;

const ASSET_BASE = '/assets/fuga';

export const FUGA_VEHICLES: FugaVehicle[] = [
  {
    id: 'touro_negro',
    name: 'Touro Negro',
    codename: 'TN-01',
    tier: 'rua',
    unlockBarracoLevel: 1,
    priceCleanMoney: 850,
    targetType: 'frente',
    targetStat: 'rajada',
    bonusPercent: FUGA_BONUS_PERCENT,
    role: 'Arrancada de intimidação',
    headline: 'Motor bruto, neon vermelho e saída violenta pela garagem clandestina.',
    lore: 'O Touro Negro não é feito para fugir escondido. Ele abre caminho, impõe presença e transforma a primeira arrancada em pressão psicológica contra qualquer bloqueio.',
    mechanicNote: 'Torque curto, pneus largos e frente baixa para resposta agressiva nos primeiros metros.',
    image: `${ASSET_BASE}/touro-negro.png`,
    accent: '#ff3355',
    accent2: '#74f7ff',
    danger: '#ff1d25',
  },
  {
    id: 'bastiao_vx',
    name: 'Bastião VX',
    codename: 'BVX',
    tier: 'blindado',
    unlockBarracoLevel: 5,
    priceCleanMoney: 1250,
    targetType: 'muralha',
    targetStat: 'blindagem',
    bonusPercent: FUGA_BONUS_PERCENT,
    role: 'Blindagem urbana',
    headline: 'Um cofre de luxo sobre rodas para tirar o bonde da zona quente.',
    lore: 'O Bastião VX segura a pressão quando a fuga vira pancada. A estrutura reforçada protege a equipe e mantém o comboio avançando mesmo sob cerco.',
    mechanicNote: 'Chapas internas, vidros reforçados, pneus run-flat e blindagem de rota urbana.',
    image: `${ASSET_BASE}/bastiao-vx.png`,
    accent: '#56ffd6',
    accent2: '#0e5f58',
    danger: '#8bfff0',
  },
  {
    id: 'vibora_900',
    name: 'Víbora 900',
    codename: 'V900',
    tier: 'elite',
    unlockBarracoLevel: 10,
    priceCleanMoney: 1850,
    targetType: 'assassino',
    targetStat: 'quebra',
    bonusPercent: FUGA_BONUS_PERCENT,
    role: 'Escape silencioso',
    headline: 'Moto baixa, veneno neon e precisão para entrar e desaparecer.',
    lore: 'A Víbora 900 foi preparada para fugas onde tamanho atrapalha. Corta corredor, some na fumaça e entrega uma vantagem letal aos operadores mais rápidos.',
    mechanicNote: 'Relação curta, escapamento abafado e mapa de injeção agressivo para fuga relâmpago.',
    image: `${ASSET_BASE}/vibora-900.png`,
    accent: '#ff42df',
    accent2: '#7b2dff',
    danger: '#ff78ea',
  },
  {
    id: 'mirage_gt',
    name: 'Mirage GT',
    codename: 'MGT',
    tier: 'elite',
    unlockBarracoLevel: 15,
    priceCleanMoney: 2700,
    targetType: 'certeiro',
    targetStat: 'rajada',
    bonusPercent: FUGA_BONUS_PERCENT,
    role: 'Precisão em alta velocidade',
    headline: 'Cupê de controle fino para uma rota limpa quando tudo fecha.',
    lore: 'O Mirage GT não precisa berrar para dominar. Ele mantém tração, curva e precisão no momento em que a perseguição exige frieza.',
    mechanicNote: 'Freios cerâmicos, aerodinâmica baixa e controle eletrônico calibrado para curvas rápidas.',
    image: `${ASSET_BASE}/mirage-gt.png`,
    accent: '#38c8ff',
    accent2: '#155dff',
    danger: '#91e8ff',
  },
  {
    id: 'lastro_4x4',
    name: 'Lastro 4x4',
    codename: 'L4X',
    tier: 'blindado',
    unlockBarracoLevel: 20,
    priceCleanMoney: 3900,
    targetType: 'capanga',
    targetStat: 'folego',
    bonusPercent: FUGA_BONUS_PERCENT,
    role: 'Carga, resistência e apoio',
    headline: 'Quando a rota é ruim, ele carrega a operação e continua.',
    lore: 'O Lastro 4x4 é a máquina de apoio do comando. Entra onde esportivo não entra, aguenta caminho quebrado e segura fuga longa.',
    mechanicNote: 'Suspensão elevada, diferencial travado, pneus off-road e proteção inferior reforçada.',
    image: `${ASSET_BASE}/lastro-4x4.png`,
    accent: '#ffb23e',
    accent2: '#55310d',
    danger: '#ffd18b',
  },
  {
    id: 'silenciador_s',
    name: 'Silenciador S',
    codename: 'S-S',
    tier: 'elite',
    unlockBarracoLevel: 30,
    priceCleanMoney: 5400,
    targetType: 'executor',
    targetStat: 'quebra',
    bonusPercent: FUGA_BONUS_PERCENT,
    role: 'Discrição executiva',
    headline: 'Luxo escuro, saída limpa e presença que não chama sirene.',
    lore: 'O Silenciador S é para missões em que a melhor fuga é não parecer fuga. Elegante, frio e preparado para sumir no trânsito.',
    mechanicNote: 'Módulo anti-rastreamento, película total, suspensão refinada e motor preparado para resposta silenciosa.',
    image: `${ASSET_BASE}/silenciador-s.png`,
    accent: '#dbe3ff',
    accent2: '#3b455f',
    danger: '#ffffff',
  },
  {
    id: 'dinamo_lx',
    name: 'Dínamo LX',
    codename: 'DLX',
    tier: 'phantom',
    unlockBarracoLevel: 40,
    priceCleanMoney: 8200,
    targetType: 'motorista',
    targetStat: 'folego',
    bonusPercent: FUGA_BONUS_PERCENT,
    role: 'Transporte blindado',
    headline: 'Muralha móvel para manter a frota viva até o fim da rota.',
    lore: 'O Dínamo LX é o veículo de retirada pesada. Não compete por beleza: compete por tempo, resistência e sobrevivência.',
    mechanicNote: 'Radiador protegido, para-choque reforçado, compartimento interno de emergência e blindagem estrutural.',
    image: `${ASSET_BASE}/dinamo-lx.png`,
    accent: '#4fd0ff',
    accent2: '#d4af37',
    danger: '#ffe27a',
  },
  {
    id: 'nitro_phantom',
    name: 'Nitro Phantom',
    codename: 'NPH',
    tier: 'phantom',
    unlockBarracoLevel: 50,
    priceCleanMoney: 12500,
    targetType: 'nitro',
    targetStat: 'rajada',
    bonusPercent: FUGA_BONUS_PERCENT,
    role: 'Fuga extrema',
    headline: 'A rua vira túnel quando o Phantom abre o segundo estágio.',
    lore: 'O Nitro Phantom é a vitrine final da garagem. Chamativo demais para ser discreto, rápido demais para ser alcançado.',
    mechanicNote: 'Dois estágios de nitro, aerodinâmica de pista e mapa de potência sem piedade.',
    image: `${ASSET_BASE}/nitro-phantom.png`,
    accent: '#8a4dff',
    accent2: '#1f7bff',
    danger: '#00d9ff',
  },
];

export function getFugaVehicleById(vehicleId: string | null | undefined): FugaVehicle | null {
  return FUGA_VEHICLES.find((vehicle) => vehicle.id === vehicleId) || null;
}

export function isFugaVehicleOwned(player: any, vehicleId: string): boolean {
  const ownedVehicles = Array.isArray(player?.ownedVehicles) ? player.ownedVehicles.map(String) : [];
  if (ownedVehicles.includes(vehicleId)) return true;

  const inventoryItems = Array.isArray(player?.inventory?.items) ? player.inventory.items : [];
  return inventoryItems.some((item: any) => item?.id === `fuga:${vehicleId}` || item?.vehicleId === vehicleId);
}

export function getOwnedFugaVehicles(player: any): FugaVehicle[] {
  return FUGA_VEHICLES.filter((vehicle) => isFugaVehicleOwned(player, vehicle.id));
}

export function getUnlockedFugaVehicles(barracoLevel: number): FugaVehicle[] {
  const level = Math.max(1, Math.floor(Number(barracoLevel) || 1));
  return FUGA_VEHICLES.filter((vehicle) => level >= vehicle.unlockBarracoLevel);
}

export function getFugaStatLabel(stat: FugaStatKey): string {
  const labels: Record<FugaStatKey, string> = {
    rajada: 'Rajada',
    blindagem: 'Blindagem',
    folego: 'Fôlego',
    quebra: 'Quebra',
  };
  return labels[stat];
}

export function getFugaMemberLabel(type: GangMemberType): string {
  const labels: Record<GangMemberType, string> = {
    capanga: 'Capanga',
    frente: 'Frente',
    executor: 'Executor',
    assassino: 'Assassino',
    muralha: 'Muralha',
    certeiro: 'Certeiro',
    motorista: 'Motorista',
    nitro: 'Nitro',
  };
  return labels[type];
}

export function formatFugaMoney(value: number): string {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
