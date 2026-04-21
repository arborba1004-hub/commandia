import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { FIXED_BUILDINGS } from '@/components/game/fixedMapBuildings';

export const PLAYER_SPACE_WIDTH = 6;
export const PLAYER_SPACE_HEIGHT = 6;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const modelPromiseCache = new Map<string, Promise<THREE.Object3D>>();

const BARRACO_MODELS = [
  {
    min: 1,
    max: 9,
    url: 'https://static.wixstatic.com/3d/50f4bf_0a763db5131547a588ce702d6de0a388.glb',
  },
  {
    min: 10,
    max: 19,
    url: 'https://static.wixstatic.com/3d/50f4bf_134ce80560954ebb890dd74baed878e0.glb',
  },
  {
    min: 20,
    max: 29,
    url: 'https://static.wixstatic.com/3d/50f4bf_a089f0d52f38465f8db77877509f12d6.glb',
  },
  {
    min: 30,
    max: 39,
    url: 'https://static.wixstatic.com/3d/50f4bf_f78d5d13df3d4a9e9b62061425cc4f30.glb',
  },
  {
    min: 40,
    max: 49,
    url: 'https://static.wixstatic.com/3d/50f4bf_fcfd85e45b61474eab924ba144e1b256.glb',
  },
  {
    min: 50,
    max: 59,
    url: 'https://static.wixstatic.com/3d/50f4bf_8ddf8382a1d24e1d8003a7d851132a11.glb',
  },
  {
    min: 60,
    max: 69,
    url: 'https://static.wixstatic.com/3d/50f4bf_97904fbc3ca74bb094a29e7052c79fb4.glb',
  },
  {
    min: 70,
    max: 79,
    url: 'https://static.wixstatic.com/3d/50f4bf_5e9f2aa54cf041b29f49258cc63eb746.glb',
  },
  {
    min: 80,
    max: 89,
    url: 'https://static.wixstatic.com/3d/50f4bf_ac1c5e207bbc425f80619a581e2e2cba.glb',
  },
  {
    min: 90,
    max: 100,
    url: 'https://static.wixstatic.com/3d/50f4bf_a8dd587eba644115b376b9a0b0dc67d5.glb',
  },
];

export type TileOrigin = {
  tileX: number;
  tileY: number;
};

export type PlayerSpaceRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PlayerMapSpaceOptions = {
  scene: THREE.Scene;
  tileX: number;
  tileY: number;
  gridWidth: number;
  gridHeight: number;
  barracoLevel?: number;
  tileSize?: number;
  baseY?: number;
  occupiedOrigins?: TileOrigin[];
};

export type MountedPlayerMapSpace = {
  group: THREE.Group;
  spaceMesh: THREE.Mesh;
  modelContainer: THREE.Group;
  tileX: number;
  tileY: number;
  worldX: number;
  worldZ: number;
  widthTiles: number;
  heightTiles: number;
  barracoLevel: number;
  updatePosition: (tileX: number, tileY: number, occupiedOrigins?: TileOrigin[]) => void;
  updateBarracoLevel: (level: number) => Promise<void>;
  cleanup: () => void;
};

function toInt(value: number, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rectanglesOverlap(a: PlayerSpaceRect, b: PlayerSpaceRect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function distanceSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach((item) => disposeMaterial(item));
    return;
  }

  const mat = material as THREE.Material & {
    map?: THREE.Texture | null;
    alphaMap?: THREE.Texture | null;
    normalMap?: THREE.Texture | null;
    roughnessMap?: THREE.Texture | null;
    metalnessMap?: THREE.Texture | null;
    emissiveMap?: THREE.Texture | null;
    aoMap?: THREE.Texture | null;
  };

  mat.map?.dispose();
  mat.alphaMap?.dispose();
  mat.normalMap?.dispose();
  mat.roughnessMap?.dispose();
  mat.metalnessMap?.dispose();
  mat.emissiveMap?.dispose();
  mat.aoMap?.dispose();
  mat.dispose();
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child: any) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (child.material) {
      disposeMaterial(child.material);
    }
  });
}

function clearGroup(group: THREE.Group) {
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    disposeObject(child);
  }
}

function setMeshQuality(child: any) {
  if (!child?.isMesh) return;

  child.castShadow = true;
  child.receiveShadow = true;

  if (child.material) {
    const clonedMaterial = Array.isArray(child.material)
      ? child.material.map((item: THREE.Material) => item.clone())
      : child.material.clone();

    child.material = clonedMaterial;

    const materials = Array.isArray(clonedMaterial) ? clonedMaterial : [clonedMaterial];
    materials.forEach((mat: any) => {
      mat.metalness = 0;
      mat.roughness = 0.82;

      if ('emissive' in mat) {
        mat.emissive = new THREE.Color(0x3a220f);
        mat.emissiveIntensity = 0.12;
      }

      mat.needsUpdate = true;
    });
  }
}

function fitModelToFootprint(model: THREE.Object3D, footprint: number) {
  const initialBox = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  initialBox.getSize(size);

  const maxDimension = Math.max(size.x, size.z) || 1;
  const scale = footprint / maxDimension;
  model.scale.setScalar(scale);

  const scaledBox = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  scaledBox.getCenter(center);
  model.position.sub(center);

  const groundedBox = new THREE.Box3().setFromObject(model);
  model.position.y -= groundedBox.min.y;
}

function getBarracoConfig(level: number) {
  return (
    BARRACO_MODELS.find((item) => level >= item.min && level <= item.max) ??
    BARRACO_MODELS[0]
  );
}

function getBarracoTileFootprint(level: number) {
  if (level >= 70) return 6;
  if (level >= 50) return 5;
  if (level >= 40) return 4;
  if (level >= 20) return 3;
  return 2;
}

async function loadBarracoTemplate(loader: GLTFLoader, modelUrl: string) {
  const cached = modelPromiseCache.get(modelUrl);
  if (cached) return cached;

  const promise = new Promise<THREE.Object3D>((resolve, reject) => {
    loader.load(
      modelUrl,
      (gltf) => resolve(gltf.scene),
      undefined,
      (error) => reject(error)
    );
  });

  modelPromiseCache.set(modelUrl, promise);
  return promise;
}

export function getPlayerSpaceRect(tileX: number, tileY: number): PlayerSpaceRect {
  return {
    x: toInt(tileX),
    y: toInt(tileY),
    width: PLAYER_SPACE_WIDTH,
    height: PLAYER_SPACE_HEIGHT,
  };
}

export function isPlayerSpaceInsideMap(
  tileX: number,
  tileY: number,
  gridWidth: number,
  gridHeight: number
): boolean {
  const x = toInt(tileX);
  const y = toInt(tileY);

  return (
    x >= 0 &&
    y >= 0 &&
    x + PLAYER_SPACE_WIDTH <= gridWidth &&
    y + PLAYER_SPACE_HEIGHT <= gridHeight
  );
}

export function tileToWorldCenter(
  tileX: number,
  tileY: number,
  gridWidth: number,
  gridHeight: number
) {
  const x = toInt(tileX);
  const y = toInt(tileY);

  return {
    worldX: x - Math.floor(gridWidth / 2) + PLAYER_SPACE_WIDTH / 2,
    worldZ: y - Math.floor(gridHeight / 2) + PLAYER_SPACE_HEIGHT / 2,
  };
}

function worldToTileOriginFromCenter(
  worldX: number,
  worldZ: number,
  footprint: number,
  gridWidth: number,
  gridHeight: number
) {
  const centerTileX = worldX + gridWidth / 2;
  const centerTileY = worldZ + gridHeight / 2;

  return {
    tileX: Math.round(centerTileX - footprint / 2),
    tileY: Math.round(centerTileY - footprint / 2),
  };
}

export function getFixedBuildingBlockedRects(
  gridWidth: number,
  gridHeight: number,
  paddingTiles = 1
): PlayerSpaceRect[] {
  return FIXED_BUILDINGS.map((building) => {
    const origin = worldToTileOriginFromCenter(
      building.x,
      building.z,
      building.footprint,
      gridWidth,
      gridHeight
    );

    const x = clamp(origin.tileX - paddingTiles, 0, gridWidth - 1);
    const y = clamp(origin.tileY - paddingTiles, 0, gridHeight - 1);

    return {
      x,
      y,
      width: Math.min(building.footprint + paddingTiles * 2, gridWidth - x),
      height: Math.min(building.footprint + paddingTiles * 2, gridHeight - y),
    };
  });
}

export function isPlayerSpaceAvailable(
  tileX: number,
  tileY: number,
  occupiedOrigins: TileOrigin[],
  gridWidth: number,
  gridHeight: number
): boolean {
  if (!isPlayerSpaceInsideMap(tileX, tileY, gridWidth, gridHeight)) {
    return false;
  }

  const candidate = getPlayerSpaceRect(tileX, tileY);

  for (const blocked of getFixedBuildingBlockedRects(gridWidth, gridHeight, 1)) {
    if (rectanglesOverlap(candidate, blocked)) {
      return false;
    }
  }

  for (const occupiedOrigin of occupiedOrigins) {
    const occupied = getPlayerSpaceRect(occupiedOrigin.tileX, occupiedOrigin.tileY);

    if (rectanglesOverlap(candidate, occupied)) {
      return false;
    }
  }

  return true;
}

function buildCandidateOrigins(gridWidth: number, gridHeight: number): TileOrigin[] {
  const origins: TileOrigin[] = [];

  for (let y = 0; y <= gridHeight - PLAYER_SPACE_HEIGHT; y += 1) {
    for (let x = 0; x <= gridWidth - PLAYER_SPACE_WIDTH; x += 1) {
      origins.push({ tileX: x, tileY: y });
    }
  }

  return origins;
}

export function resolvePlayerSpawnSpace(
  tileX: number,
  tileY: number,
  occupiedOrigins: TileOrigin[],
  gridWidth: number,
  gridHeight: number
) {
  const desiredTileX = clamp(
    toInt(tileX),
    0,
    Math.max(0, gridWidth - PLAYER_SPACE_WIDTH)
  );

  const desiredTileY = clamp(
    toInt(tileY),
    0,
    Math.max(0, gridHeight - PLAYER_SPACE_HEIGHT)
  );

  if (
    isPlayerSpaceAvailable(
      desiredTileX,
      desiredTileY,
      occupiedOrigins,
      gridWidth,
      gridHeight
    )
  ) {
    const { worldX, worldZ } = tileToWorldCenter(
      desiredTileX,
      desiredTileY,
      gridWidth,
      gridHeight
    );

    return {
      tileX: desiredTileX,
      tileY: desiredTileY,
      worldX,
      worldZ,
      widthTiles: PLAYER_SPACE_WIDTH,
      heightTiles: PLAYER_SPACE_HEIGHT,
    };
  }

  const best = buildCandidateOrigins(gridWidth, gridHeight)
    .filter((candidate) =>
      isPlayerSpaceAvailable(
        candidate.tileX,
        candidate.tileY,
        occupiedOrigins,
        gridWidth,
        gridHeight
      )
    )
    .sort(
      (a, b) =>
        distanceSq(a.tileX, a.tileY, desiredTileX, desiredTileY) -
        distanceSq(b.tileX, b.tileY, desiredTileX, desiredTileY)
    )[0];

  if (!best) {
    throw new Error('Nenhum espaço 6x6 livre no mapa');
  }

  const { worldX, worldZ } = tileToWorldCenter(
    best.tileX,
    best.tileY,
    gridWidth,
    gridHeight
  );

  return {
    tileX: best.tileX,
    tileY: best.tileY,
    worldX,
    worldZ,
    widthTiles: PLAYER_SPACE_WIDTH,
    heightTiles: PLAYER_SPACE_HEIGHT,
  };
}

export function mountPlayerMapSpace({
  scene,
  tileX,
  tileY,
  gridWidth,
  gridHeight,
  barracoLevel = 1,
  tileSize = 1,
  baseY = 0.06,
  occupiedOrigins = [],
}: PlayerMapSpaceOptions): MountedPlayerMapSpace {
  const group = new THREE.Group();

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  const spaceGeometry = new THREE.PlaneGeometry(
    PLAYER_SPACE_WIDTH * tileSize,
    PLAYER_SPACE_HEIGHT * tileSize
  );

  const spaceMaterial = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const spaceMesh = new THREE.Mesh(spaceGeometry, spaceMaterial);
  spaceMesh.rotation.x = -Math.PI / 2;
  group.add(spaceMesh);

  const modelContainer = new THREE.Group();
  group.add(modelContainer);

  let disposed = false;

  async function applyBarraco(level: number) {
    const config = getBarracoConfig(level);

    try {
      const template = await loadBarracoTemplate(loader, config.url);

      if (disposed) return;

      const model = template.clone(true);
      model.traverse((child) => setMeshQuality(child));
      fitModelToFootprint(model, getBarracoTileFootprint(level) * tileSize);

      clearGroup(modelContainer);
      modelContainer.add(model);

      mounted.barracoLevel = level;
    } catch (error) {
      console.error('Erro ao carregar barraco do jogador:', error);
    }
  }

  function applyPosition(
    nextTileX: number,
    nextTileY: number,
    nextOccupiedOrigins: TileOrigin[] = []
  ) {
    const resolved = resolvePlayerSpawnSpace(
      nextTileX,
      nextTileY,
      nextOccupiedOrigins,
      gridWidth,
      gridHeight
    );

    group.position.set(resolved.worldX, 0, resolved.worldZ);
    spaceMesh.position.set(0, baseY, 0);
    modelContainer.position.set(0, 0, 0);

    mounted.tileX = resolved.tileX;
    mounted.tileY = resolved.tileY;
    mounted.worldX = resolved.worldX;
    mounted.worldZ = resolved.worldZ;
  }

  const mounted: MountedPlayerMapSpace = {
    group,
    spaceMesh,
    modelContainer,
    tileX: 0,
    tileY: 0,
    worldX: 0,
    worldZ: 0,
    widthTiles: PLAYER_SPACE_WIDTH,
    heightTiles: PLAYER_SPACE_HEIGHT,
    barracoLevel: barracoLevel,
    updatePosition(nextTileX: number, nextTileY: number, nextOccupiedOrigins: TileOrigin[] = []) {
      applyPosition(nextTileX, nextTileY, nextOccupiedOrigins);
    },
    async updateBarracoLevel(level: number) {
      await applyBarraco(level);
    },
    cleanup() {
      disposed = true;
      scene.remove(group);
      clearGroup(modelContainer);
      spaceGeometry.dispose();
      spaceMaterial.dispose();
    },
  };

  applyPosition(tileX, tileY, occupiedOrigins);
  void applyBarraco(barracoLevel);
  scene.add(group);

  return mounted;
}