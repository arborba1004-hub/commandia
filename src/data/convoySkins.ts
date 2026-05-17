export type ConvoySkinVisualClass = 'auto' | 'character' | 'vehicle' | 'prop';

export type ConvoySkinAsset = {
  url: string;
  /**
   * Opcional: força a classe visual usada no ajuste proporcional.
   * - character: normaliza pela altura.
   * - vehicle: normaliza pelo comprimento/largura horizontal.
   * - auto: detecta pela proporção do bounding box.
   */
  visualClass?: ConvoySkinVisualClass;
  /** Multiplicador final depois da normalização proporcional. */
  scale?: number;
  /** Ajuste fino do tamanho-alvo. Para character = altura; para vehicle = comprimento/largura horizontal. */
  fitSize?: number;
  /** Rotação local do asset dentro da formação. */
  rotationY?: number;
  /** Levanta o asset depois de alinhar a base no chão. */
  liftY?: number;
  /** Posição local dentro do grupo do comboio. */
  position?: {
    x: number;
    y: number;
    z: number;
  };
};

export type ConvoySkinDefinition = {
  id: string;
  name: string;
  description: string;
  rarity: 'free' | 'common' | 'rare' | 'epic' | 'legendary';
  purchasable: boolean;
  assets: ConvoySkinAsset[];
};

export const DEFAULT_CONVOY_SKIN_ID = 'comboio_padrao';

export const CONVOY_SKINS: Record<string, ConvoySkinDefinition> = {
  comboio_padrao: {
    id: 'comboio_padrao',
    name: 'Comboio Padrão',
    description: 'Comboio visual padrão usado nas marchas de ataque.',
    rarity: 'free',
    purchasable: false,
    assets: [
      {
        url: 'https://static.wixstatic.com/3d/50f4bf_3d710d145f1b455d9360a59766a17f45.glb',
        visualClass: 'auto',
        position: { x: -0.85, y: 0, z: 0.95 },
      },
      {
        url: 'https://static.wixstatic.com/3d/50f4bf_fba4d4f447c64d4ba6ba2f710d2af326.glb',
        visualClass: 'auto',
        position: { x: 0.85, y: 0, z: 0.95 },
      },
      {
        url: 'https://static.wixstatic.com/3d/50f4bf_e1753da6697d42b89e89f43f2dc14ef4.glb',
        visualClass: 'auto',
        position: { x: -1.25, y: 0, z: -0.65 },
      },
      {
        url: 'https://static.wixstatic.com/3d/50f4bf_543161c59f824a3fac85ba696a9a5efd.glb',
        visualClass: 'auto',
        position: { x: 0, y: 0, z: -0.65 },
      },
      {
        url: 'https://static.wixstatic.com/3d/50f4bf_3946576a583344c78d1d912657570015.glb',
        visualClass: 'auto',
        position: { x: 1.25, y: 0, z: -0.65 },
      },
      {
        url: 'https://static.wixstatic.com/3d/50f4bf_9406cb84f4834b84aba259f58e073e8b.glb',
        visualClass: 'auto',
        position: { x: 0, y: 0, z: -2.15 },
      },
    ],
  },
};

export function getConvoySkinById(id?: string | null): ConvoySkinDefinition {
  return CONVOY_SKINS[id || DEFAULT_CONVOY_SKIN_ID] || CONVOY_SKINS[DEFAULT_CONVOY_SKIN_ID];
}
