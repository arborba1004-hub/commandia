export type ConvoySkinAsset = {
  url: string;
  /** Escala adicional aplicada depois da normalização do GLB. */
  scale?: number;
  /** Rotação local extra do modelo em radianos. */
  rotationY?: number;
  /** Posição local do asset dentro do grupo do comboio. */
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
  /** Apenas metadado visual para loja futura. Não libera compra sozinho. */
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
        position: { x: 0, y: 0, z: 1.8 },
      },
      {
        url: 'https://static.wixstatic.com/3d/50f4bf_fba4d4f447c64d4ba6ba2f710d2af326.glb',
        position: { x: -0.9, y: 0, z: 0.4 },
      },
      {
        url: 'https://static.wixstatic.com/3d/50f4bf_e1753da6697d42b89e89f43f2dc14ef4.glb',
        position: { x: 0.9, y: 0, z: 0.4 },
      },
      {
        url: 'https://static.wixstatic.com/3d/50f4bf_543161c59f824a3fac85ba696a9a5efd.glb',
        position: { x: -1.2, y: 0, z: -1.1 },
      },
      {
        url: 'https://static.wixstatic.com/3d/50f4bf_3946576a583344c78d1d912657570015.glb',
        position: { x: 0, y: 0, z: -1.1 },
      },
      {
        url: 'https://static.wixstatic.com/3d/50f4bf_9406cb84f4834b84aba259f58e073e8b.glb',
        position: { x: 1.2, y: 0, z: -1.1 },
      },
    ],
  },
};

export function getConvoySkinById(id?: string | null): ConvoySkinDefinition {
  return CONVOY_SKINS[id || DEFAULT_CONVOY_SKIN_ID] || CONVOY_SKINS[DEFAULT_CONVOY_SKIN_ID];
}
