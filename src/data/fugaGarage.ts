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

export type FugaVehicleKind =
  | 'muscle'
  | 'suv'
  | 'moto'
  | 'coupe'
  | 'pickup'
  | 'sedan'
  | 'armored'
  | 'super';

export type FugaStatKey = keyof GangAtributos;

export type FugaVehicle = {
  id: FugaVehicleId;
  name: string;
  codename: string;
  kind: FugaVehicleKind;
  unlockBarracoLevel: number;
  priceCleanMoney: number;
  targetType: GangMemberType;
  targetStat: FugaStatKey;
  bonusPercent: number;
  role: string;
  headline: string;
  lore: string;
  mechanicNote: string;
  paint: {
    body: string;
    body2: string;
    neon: string;
    glass: string;
    rim: string;
  };
};

export const FUGA_BONUS_PERCENT = 1;

export const FUGA_VEHICLES: FugaVehicle[] = [
  {
    id: 'touro_negro',
    name: 'Touro Negro',
    codename: 'TN-01',
    kind: 'muscle',
    unlockBarracoLevel: 1,
    priceCleanMoney: 850,
    targetType: 'frente',
    targetStat: 'rajada',
    bonusPercent: FUGA_BONUS_PERCENT,
    role: 'Arrancada de intimidação',
    headline: 'Motor bruto, saída violenta e presença na rua.',
    lore: 'Um muscle car preparado para abrir caminho quando a fuga vira confronto. O ronco aparece antes do carro e pressiona a linha de frente.',
    mechanicNote: 'Ajuste de torque curto, pneus largos e suspensão baixa para arrancadas agressivas.',
    paint: { body: '#171717', body2: '#5b1111', neon: '#ff3b2f', glass: '#89f5ff', rim: '#ffd166' },
  },
  {
    id: 'bastiao_vx',
    name: 'Bastião VX',
    codename: 'BVX',
    kind: 'suv',
    unlockBarracoLevel: 5,
    priceCleanMoney: 1250,
    targetType: 'muralha',
    targetStat: 'blindagem',
    bonusPercent: FUGA_BONUS_PERCENT,
    role: 'Blindagem urbana',
    headline: 'Um cofre sobre rodas para segurar pressão.',
    lore: 'SUV pesado usado para retirar aliados de zonas quentes. Aguenta impacto, fecha corredor e protege o bonde.',
    mechanicNote: 'Chapas internas, vidros reforçados e pneus run-flat para manter movimento sob perseguição.',
    paint: { body: '#1b2a2f', body2: '#0f5f4f', neon: '#58ffd6', glass: '#a8e8ff', rim: '#c8fff2' },
  },
  {
    id: 'vibora_900',
    name: 'Víbora 900',
    codename: 'V900',
    kind: 'moto',
    unlockBarracoLevel: 10,
    priceCleanMoney: 1850,
    targetType: 'assassino',
    targetStat: 'quebra',
    bonusPercent: FUGA_BONUS_PERCENT,
    role: 'Escape silencioso',
    headline: 'Some no corredor antes da sirene entender a rota.',
    lore: 'Moto de fuga leve, baixa e precisa. Ideal para quem entra e sai sem deixar tempo para reação.',
    mechanicNote: 'Mapa de injeção agressivo, escapamento abafado e relação final curta.',
    paint: { body: '#260b3f', body2: '#8f1aff', neon: '#ff4fd8', glass: '#e5d3ff', rim: '#f7b7ff' },
  },
  {
    id: 'mirage_gt',
    name: 'Mirage GT',
    codename: 'MGT',
    kind: 'coupe',
    unlockBarracoLevel: 15,
    priceCleanMoney: 2700,
    targetType: 'certeiro',
    targetStat: 'rajada',
    bonusPercent: FUGA_BONUS_PERCENT,
    role: 'Precisão em alta velocidade',
    headline: 'Controle fino para fuga limpa e mira fria.',
    lore: 'Cupê discreto com resposta precisa. Não é o mais barulhento, mas é o que mantém a rota quando tudo fecha.',
    mechanicNote: 'Freio cerâmico, tração ajustada e eletrônica calibrada para curvas rápidas.',
    paint: { body: '#0c2147', body2: '#1769ff', neon: '#4fd6ff', glass: '#bfefff', rim: '#e9fbff' },
  },
  {
    id: 'lastro_4x4',
    name: 'Lastro 4x4',
    codename: 'L4X',
    kind: 'pickup',
    unlockBarracoLevel: 20,
    priceCleanMoney: 3900,
    targetType: 'capanga',
    targetStat: 'folego',
    bonusPercent: FUGA_BONUS_PERCENT,
    role: 'Carga, resistência e apoio',
    headline: 'Quando a rota é ruim, ele continua.',
    lore: 'Caminhonete de apoio para fuga longa. Carrega gente, equipamento e ainda atravessa trecho que carro baixo não passa.',
    mechanicNote: 'Amortecedor reforçado, diferencial travado e caixa protegida.',
    paint: { body: '#2c1a0c', body2: '#cc7a1f', neon: '#ffb84d', glass: '#ffe0a8', rim: '#fff0c7' },
  },
  {
    id: 'silenciador_s',
    name: 'Silenciador S',
    codename: 'S-S',
    kind: 'sedan',
    unlockBarracoLevel: 30,
    priceCleanMoney: 5400,
    targetType: 'executor',
    targetStat: 'quebra',
    bonusPercent: FUGA_BONUS_PERCENT,
    role: 'Discrição executiva',
    headline: 'Luxo escuro, placa fria e saída sem espetáculo.',
    lore: 'Sedan executivo preparado para sumir no trânsito. A fuga perfeita nem sempre é a mais rápida; às vezes é a mais limpa.',
    mechanicNote: 'Motor silencioso, película total, suspensão confortável e módulos anti-rastreamento.',
    paint: { body: '#080b12', body2: '#3e4a62', neon: '#b8c7ff', glass: '#d6ddff', rim: '#f0f3ff' },
  },
  {
    id: 'dinamo_lx',
    name: 'Dínamo LX',
    codename: 'DLX',
    kind: 'armored',
    unlockBarracoLevel: 40,
    priceCleanMoney: 8200,
    targetType: 'motorista',
    targetStat: 'folego',
    bonusPercent: FUGA_BONUS_PERCENT,
    role: 'Transporte blindado',
    headline: 'Uma muralha móvel para manter a frota viva.',
    lore: 'Blindado compacto para retirada de equipe. Não ganha beleza, ganha tempo, resistência e respeito.',
    mechanicNote: 'Radiador protegido, para-choque reforçado e compartimento interno de emergência.',
    paint: { body: '#10251f', body2: '#2dd690', neon: '#8dffcb', glass: '#c7ffed', rim: '#eafff7' },
  },
  {
    id: 'nitro_phantom',
    name: 'Nitro Phantom',
    codename: 'NPH',
    kind: 'super',
    unlockBarracoLevel: 50,
    priceCleanMoney: 12500,
    targetType: 'nitro',
    targetStat: 'rajada',
    bonusPercent: FUGA_BONUS_PERCENT,
    role: 'Fuga extrema',
    headline: 'A rua vira túnel quando o nitro abre.',
    lore: 'Supercarro clandestino de fuga final. Chamativo demais para ser discreto, rápido demais para ser alcançado.',
    mechanicNote: 'Dois estágios de nitro, aerodinâmica baixa e mapa de potência sem piedade.',
    paint: { body: '#1a0838', body2: '#ff2fb3', neon: '#ffe66d', glass: '#b6f5ff', rim: '#fff3a6' },
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
