/**
 * types/convoy.ts
 * Sistema novo de comboio de ataque.
 * Regra: o ataque só pode usar comboios comprados/liberados pelo jogador.
 */

export type ConvoySkinId =
  | 'comboio_padrao'
  | 'comboio_moto'
  | 'comboio_blindado'
  | 'comboio_pesado'
  | 'comboio_teste_glb'
  | 'comboio_real_199_glb';

export type ConvoyCurrency = 'cleanMoney' | 'dirtyMoney' | 'corre' | 'realMoney';

export type ConvoySkin = {
  id: ConvoySkinId;
  name: string;
  description: string;
  rarity: 'gratis' | 'comum' | 'raro' | 'epico' | 'lendario';
  price: number;
  currency: ConvoyCurrency;
  purchaseType?: 'gameMoney' | 'realMoney';
  realCurrency?: 'BRL';
  /** URL GLB real do comboio. Se ficar null, usa fallback procedural 3D. */
  modelUrl: string | null;
  /** Ícone usado na loja/modal quando não houver preview GLB. */
  icon: string;
  /** Cor visual do rastro/halo do comboio. */
  accentColor: string;
  /** Multiplicador visual/3D do modelo carregado. */
  modelScale: number;
  /** Tamanho alvo aproximado em tiles para normalizar GLBs de tamanhos diferentes. */
  fitTileLength: number;
  /** Futuro bônus de velocidade. Backend precisa validar antes de aplicar. */
  speedBonusPercent: number;
  /** Altura visual máxima alvo do GLB depois da normalização. */
  maxModelHeight?: number;
  /** Ajuste fino vertical para encostar melhor no chão. */
  groundOffsetY?: number;
  /** Multiplicador leve para clarear materiais muito escuros. */
  materialBoost?: number;
};

export type PlayerConvoyInventory = {
  ownedSkinIds: ConvoySkinId[];
  equippedSkinId: ConvoySkinId;
  player?: unknown;
};

export type ConvoyApiEnvelope = PlayerConvoyInventory & {
  player?: unknown;
};

export type AttackConvoySelection = {
  convoySkinId: ConvoySkinId;
};
