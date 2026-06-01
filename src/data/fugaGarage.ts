import type { GangAtributos, GangMemberType } from '@/types/gang';

export type FugaVehicleId =
  | 'touro_negro'
  | 'bastiao_vx'
  | 'vibora_900'
  | 'mirage_gt'
  | 'lastro_4x4'
  | 'silenciador_s'
  | 'dinamo_lx'
  | 'nitro_phantom'
  | 'corvo_gt'
  | 'sentinela_x'
  | 'raposa_r'
  | 'executor_van'
  | 'gigante_6x6'
  | 'obus_mk'
  | 'fantasma_sedan'
  | 'cobra_negra'
  | 'falcao_4x4'
  | 'tempestade_gt'
  | 'imperador_lux'
  | 'eclipse_zero';

export type FugaStatKey = keyof GangAtributos;
export type FugaVehicleTier = 'rua' | 'pro' | 'blindado' | 'elite' | 'phantom' | 'lendario';

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
  classLabel: string;
  role: string;
  headline: string;
  lore: string;
  mechanicNote: string;
  image: string;
  accent: string;
  accent2: string;
  glow: string;
};

export const FUGA_BONUS_PERCENT = 1;
export const FUGA_MAX_VEHICLES = 20;

const ASSET_BASE = '/assets/fuga';

export const FUGA_GARAGE_BACKGROUNDS = {
  hero: `${ASSET_BASE}/garage-hero.png`,
  contract: `${ASSET_BASE}/garage-contract.png`,
};

// Liberação: veículo novo a cada 5 níveis do barraco.
// Preço: pensado para o starter cleanMoney=2.500, com começo acessível e fim aspiracional.
export const FUGA_VEHICLES: FugaVehicle[] = [
  {
    id: 'touro_negro',
    name: 'Touro Negro',
    codename: 'TN-01',
    tier: 'rua',
    unlockBarracoLevel: 1,
    priceCleanMoney: 450,
    targetType: 'frente',
    targetStat: 'rajada',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Muscle urbano',
    role: 'Arrancada de intimidação',
    headline: 'Motor bruto para abrir rota quando o cerco fecha.',
    lore: 'O primeiro contrato da garagem. Barulho, presença e saída violenta para transformar o começo da fuga em pressão psicológica.',
    mechanicNote: 'Torque curto, pneus largos e resposta agressiva nos primeiros metros.',
    image: `${ASSET_BASE}/touro-negro.png`,
    accent: '#ff2f4f',
    accent2: '#ff8a3d',
    glow: 'rgba(255,47,79,0.34)',
  },
  {
    id: 'bastiao_vx',
    name: 'Bastião VX',
    codename: 'BVX',
    tier: 'blindado',
    unlockBarracoLevel: 5,
    priceCleanMoney: 750,
    targetType: 'muralha',
    targetStat: 'blindagem',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'SUV blindado',
    role: 'Pressão com proteção',
    headline: 'Um cofre sobre rodas para segurar o bonde na rua.',
    lore: 'Quando a fuga vira pancada, o Bastião protege a equipe e mantém a marcha mesmo sob bloqueio.',
    mechanicNote: 'Blindagem leve, vidros reforçados e pneus run-flat.',
    image: `${ASSET_BASE}/bastiao-vx.png`,
    accent: '#d2a85d',
    accent2: '#7b6a49',
    glow: 'rgba(210,168,93,0.30)',
  },
  {
    id: 'vibora_900',
    name: 'Víbora 900',
    codename: 'V900',
    tier: 'pro',
    unlockBarracoLevel: 10,
    priceCleanMoney: 1100,
    targetType: 'assassino',
    targetStat: 'quebra',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Moto de infiltração',
    role: 'Corte relâmpago',
    headline: 'Entra estreito, some rápido, deixa só o rastro neon.',
    lore: 'Feita para operador que precisa furar corredor, quebrar perseguição e desaparecer sem precisar de massa bruta.',
    mechanicNote: 'Carenagem de carbono, escape abafado e aceleração curta.',
    image: `${ASSET_BASE}/vibora-900.png`,
    accent: '#ff3fe8',
    accent2: '#7b2dff',
    glow: 'rgba(255,63,232,0.34)',
  },
  {
    id: 'mirage_gt',
    name: 'Mirage GT',
    codename: 'MGT',
    tier: 'pro',
    unlockBarracoLevel: 15,
    priceCleanMoney: 1600,
    targetType: 'certeiro',
    targetStat: 'rajada',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Coupé de precisão',
    role: 'Controle limpo',
    headline: 'Curva, freio e saída com cálculo frio.',
    lore: 'Para rotas onde força demais denuncia. O Mirage entrega precisão e domínio no volante.',
    mechanicNote: 'Freios cerâmicos, suspensão baixa e controle eletrônico fino.',
    image: `${ASSET_BASE}/mirage-gt.png`,
    accent: '#28d7ff',
    accent2: '#1763ff',
    glow: 'rgba(40,215,255,0.32)',
  },
  {
    id: 'lastro_4x4',
    name: 'Lastro 4x4',
    codename: 'L4X',
    tier: 'blindado',
    unlockBarracoLevel: 20,
    priceCleanMoney: 2300,
    targetType: 'capanga',
    targetStat: 'folego',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Pickup tática',
    role: 'Apoio pesado',
    headline: 'Sustenta a operação quando a rua quebra.',
    lore: 'A máquina que carrega peça, gente, rota e pressão. Não é bonita; é indispensável.',
    mechanicNote: 'Suspensão elevada, diferencial travado e proteção inferior.',
    image: `${ASSET_BASE}/lastro-4x4.png`,
    accent: '#ffb23e',
    accent2: '#6c3a11',
    glow: 'rgba(255,178,62,0.30)',
  },
  {
    id: 'silenciador_s',
    name: 'Silenciador S',
    codename: 'S-S',
    tier: 'elite',
    unlockBarracoLevel: 25,
    priceCleanMoney: 3200,
    targetType: 'executor',
    targetStat: 'quebra',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Sedan executivo',
    role: 'Fuga sem sirene',
    headline: 'Luxo escuro, rota limpa e presença invisível.',
    lore: 'O Silenciador não entra em fuga para chamar atenção. Ele fecha negócio, muda rota e desaparece no trânsito.',
    mechanicNote: 'Módulo anti-rastreamento, película total e resposta silenciosa.',
    image: `${ASSET_BASE}/silenciador-s.png`,
    accent: '#dbe3ff',
    accent2: '#7f8da8',
    glow: 'rgba(219,227,255,0.24)',
  },
  {
    id: 'dinamo_lx',
    name: 'Dínamo LX',
    codename: 'DLX',
    tier: 'phantom',
    unlockBarracoLevel: 30,
    priceCleanMoney: 4500,
    targetType: 'motorista',
    targetStat: 'folego',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Transporte blindado',
    role: 'Retirada prolongada',
    headline: 'Muralha móvel para manter a frota viva até o fim.',
    lore: 'Quando a missão exige retirada pesada, o Dínamo sustenta a rota e segura a pressão da perseguição.',
    mechanicNote: 'Radiador protegido, blindagem estrutural e compartimento de emergência.',
    image: `${ASSET_BASE}/dinamo-lx.png`,
    accent: '#4fd0ff',
    accent2: '#d4af37',
    glow: 'rgba(79,208,255,0.30)',
  },
  {
    id: 'nitro_phantom',
    name: 'Nitro Phantom',
    codename: 'NPH',
    tier: 'phantom',
    unlockBarracoLevel: 35,
    priceCleanMoney: 6300,
    targetType: 'nitro',
    targetStat: 'rajada',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Supercar extremo',
    role: 'Segundo estágio',
    headline: 'A rua vira túnel quando o Phantom abre potência.',
    lore: 'Não é discreto, não é calmo, não é barato. É feito para o momento em que fugir devagar é morrer.',
    mechanicNote: 'Dois estágios de nitro, asa ativa e mapa de potência agressivo.',
    image: `${ASSET_BASE}/nitro-phantom.png`,
    accent: '#8a4dff',
    accent2: '#1f7bff',
    glow: 'rgba(138,77,255,0.35)',
  },
  {
    id: 'corvo_gt',
    name: 'Corvo GT',
    codename: 'CGT',
    tier: 'elite',
    unlockBarracoLevel: 40,
    priceCleanMoney: 8800,
    targetType: 'frente',
    targetStat: 'quebra',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Predador urbano',
    role: 'Quebra de bloqueio',
    headline: 'Verde ácido, frente baixa e saída predatória.',
    lore: 'O Corvo foi feito para morder barreira e abrir caminho quando o bloqueio vira parede.',
    mechanicNote: 'Kit largo, freio reforçado e mapa agressivo para saída curta.',
    image: `${ASSET_BASE}/corvo-gt.png`,
    accent: '#32ffbf',
    accent2: '#0e3d35',
    glow: 'rgba(50,255,191,0.28)',
  },
  {
    id: 'sentinela_x',
    name: 'Sentinela X',
    codename: 'STX',
    tier: 'blindado',
    unlockBarracoLevel: 45,
    priceCleanMoney: 12300,
    targetType: 'muralha',
    targetStat: 'folego',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Escolta pesada',
    role: 'Parede de contenção',
    headline: 'Blindado escuro para escoltar o bonde até o fim.',
    lore: 'Quando a frota vira alvo, o Sentinela assume a pressão e segura o ritmo.',
    mechanicNote: 'Proteção lateral, suspensão de carga e reforço contra impacto.',
    image: `${ASSET_BASE}/sentinela-x.png`,
    accent: '#c49d55',
    accent2: '#222222',
    glow: 'rgba(196,157,85,0.26)',
  },
  {
    id: 'raposa_r',
    name: 'Raposa R',
    codename: 'RPR',
    tier: 'pro',
    unlockBarracoLevel: 50,
    priceCleanMoney: 17200,
    targetType: 'assassino',
    targetStat: 'rajada',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Hatch de ataque',
    role: 'Corte de viela',
    headline: 'Pequeno, nervoso e impossível de cercar em rua curta.',
    lore: 'A Raposa R não disputa imponência: disputa espaço. Onde caminhão trava, ela escapa.',
    mechanicNote: 'Entre-eixos curto, turbo leve e direção rápida.',
    image: `${ASSET_BASE}/raposa-r.png`,
    accent: '#c7ff1e',
    accent2: '#39521d',
    glow: 'rgba(199,255,30,0.25)',
  },
  {
    id: 'executor_van',
    name: 'Executor Van',
    codename: 'EXV',
    tier: 'blindado',
    unlockBarracoLevel: 55,
    priceCleanMoney: 24000,
    targetType: 'executor',
    targetStat: 'blindagem',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Van blindada',
    role: 'Extração fechada',
    headline: 'Furgão preto para retirada sem exposição.',
    lore: 'A Executor Van leva equipe, carga e pressão sem abrir vitrine para o inimigo.',
    mechanicNote: 'Reforço no cofre, grade de vidro e compartimento protegido.',
    image: `${ASSET_BASE}/executor-van.png`,
    accent: '#ff2732',
    accent2: '#151515',
    glow: 'rgba(255,39,50,0.24)',
  },
  {
    id: 'gigante_6x6',
    name: 'Gigante 6x6',
    codename: 'G6X',
    tier: 'phantom',
    unlockBarracoLevel: 60,
    priceCleanMoney: 33000,
    targetType: 'motorista',
    targetStat: 'blindagem',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Seis rodas',
    role: 'Rota impossível',
    headline: 'Quando não existe caminho, ele cria um.',
    lore: 'O Gigante 6x6 é brutalidade logística. Uma base móvel para operações longas e fuga sob terreno ruim.',
    mechanicNote: 'Tração 6x6, motor diesel preparado e blindagem modular.',
    image: `${ASSET_BASE}/gigante-6x6.png`,
    accent: '#5bd9ff',
    accent2: '#b08d4f',
    glow: 'rgba(91,217,255,0.24)',
  },
  {
    id: 'obus_mk',
    name: 'Obus MK',
    codename: 'OBM',
    tier: 'phantom',
    unlockBarracoLevel: 65,
    priceCleanMoney: 45500,
    targetType: 'muralha',
    targetStat: 'quebra',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Fortaleza móvel',
    role: 'Choque pesado',
    headline: 'O veículo que transforma bloqueio em detalhe.',
    lore: 'O Obus MK não entra em fuga: ele atravessa o problema e leva o resto da frota junto.',
    mechanicNote: 'Placas externas, para-choque de aríete e eixo reforçado.',
    image: `${ASSET_BASE}/obus-mk.png`,
    accent: '#4aa3ff',
    accent2: '#d0a85c',
    glow: 'rgba(74,163,255,0.26)',
  },
  {
    id: 'fantasma_sedan',
    name: 'Fantasma Sedan',
    codename: 'FSD',
    tier: 'elite',
    unlockBarracoLevel: 70,
    priceCleanMoney: 62000,
    targetType: 'certeiro',
    targetStat: 'blindagem',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Executivo fantasma',
    role: 'Infiltração premium',
    headline: 'Aparece como luxo. Some como ameaça.',
    lore: 'O Fantasma Sedan é usado quando a operação precisa passar por segurança sem parecer operação.',
    mechanicNote: 'Ruído reduzido, rastreamento bloqueado e suspensão executiva.',
    image: `${ASSET_BASE}/fantasma-sedan.png`,
    accent: '#edf3ff',
    accent2: '#363a44',
    glow: 'rgba(237,243,255,0.22)',
  },
  {
    id: 'cobra_negra',
    name: 'Cobra Negra',
    codename: 'CBN',
    tier: 'elite',
    unlockBarracoLevel: 75,
    priceCleanMoney: 84000,
    targetType: 'assassino',
    targetStat: 'folego',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Moto carbono',
    role: 'Fôlego de perseguição',
    headline: 'Moto de carbono para fuga longa sem perder veneno.',
    lore: 'A Cobra Negra é menos explosiva que a Víbora, mas aguenta perseguição longa e rota suja.',
    mechanicNote: 'Carbono, refrigeração reforçada e relação alongada.',
    image: `${ASSET_BASE}/cobra-negra.png`,
    accent: '#ff4ced',
    accent2: '#5500c8',
    glow: 'rgba(255,76,237,0.30)',
  },
  {
    id: 'falcao_4x4',
    name: 'Falcão 4x4',
    codename: 'F4X',
    tier: 'blindado',
    unlockBarracoLevel: 80,
    priceCleanMoney: 112000,
    targetType: 'capanga',
    targetStat: 'blindagem',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Operação terrestre',
    role: 'Apoio fora de rota',
    headline: 'Preparado para sair do asfalto sem perder a operação.',
    lore: 'O Falcão é usado em fuga que abandona avenida e entra em rota de terra, morro ou pátio industrial.',
    mechanicNote: 'Guincho, pneus altos, iluminação auxiliar e proteção de chassi.',
    image: `${ASSET_BASE}/falcao-4x4.png`,
    accent: '#ffb03b',
    accent2: '#1b1b1b',
    glow: 'rgba(255,176,59,0.26)',
  },
  {
    id: 'tempestade_gt',
    name: 'Tempestade GT',
    codename: 'TPG',
    tier: 'phantom',
    unlockBarracoLevel: 85,
    priceCleanMoney: 150000,
    targetType: 'nitro',
    targetStat: 'folego',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'GT de tempestade',
    role: 'Velocidade sustentada',
    headline: 'Azul frio, rota limpa e fôlego para perseguir ou sumir.',
    lore: 'A Tempestade GT mantém velocidade alta por tempo demais para qualquer viatura comum acompanhar.',
    mechanicNote: 'Intercooler ampliado, estabilidade alta e resfriamento extra.',
    image: `${ASSET_BASE}/tempestade-gt.png`,
    accent: '#25d8ff',
    accent2: '#1344ff',
    glow: 'rgba(37,216,255,0.30)',
  },
  {
    id: 'imperador_lux',
    name: 'Imperador Lux',
    codename: 'ILX',
    tier: 'lendario',
    unlockBarracoLevel: 90,
    priceCleanMoney: 200000,
    targetType: 'executor',
    targetStat: 'folego',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Luxo clandestino',
    role: 'Comando discreto',
    headline: 'Sedan de elite para operações que exigem classe e fuga.',
    lore: 'O Imperador Lux move gente importante sem parecer que está fugindo. Status também é camuflagem.',
    mechanicNote: 'Blindagem discreta, conforto de longa rota e módulo anti-varredura.',
    image: `${ASSET_BASE}/imperador-lux.png`,
    accent: '#ffffff',
    accent2: '#8d8d8d',
    glow: 'rgba(255,255,255,0.20)',
  },
  {
    id: 'eclipse_zero',
    name: 'Eclipse Zero',
    codename: 'EZ0',
    tier: 'lendario',
    unlockBarracoLevel: 95,
    priceCleanMoney: 265000,
    targetType: 'nitro',
    targetStat: 'quebra',
    bonusPercent: FUGA_BONUS_PERCENT,
    classLabel: 'Hipercarro proibido',
    role: 'Fim de jogo',
    headline: 'A máquina final da garagem. Invisível na noite, absurda na pista.',
    lore: 'O Eclipse Zero é o contrato que fecha a garagem: caro, raro e feito para deixar o mapa pequeno.',
    mechanicNote: 'Aero ativa, fibra exposta, iluminação azul-violeta e potência brutal.',
    image: `${ASSET_BASE}/eclipse-zero.png`,
    accent: '#7d4dff',
    accent2: '#00b7ff',
    glow: 'rgba(125,77,255,0.36)',
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

export function getNextLockedFugaVehicle(barracoLevel: number): FugaVehicle | null {
  const level = Math.max(1, Math.floor(Number(barracoLevel) || 1));
  return FUGA_VEHICLES.find((vehicle) => vehicle.unlockBarracoLevel > level) || null;
}

export function getFugaProgressPercent(player: any): number {
  const total = FUGA_VEHICLES.length || 1;
  return Math.round((getOwnedFugaVehicles(player).length / total) * 100);
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
