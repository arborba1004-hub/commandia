import * as THREE from 'three';
import { FIXED_BUILDINGS } from '@/components/game/fixedMapBuildings';

export const PLAYER_SPACE_WIDTH = 6;
export const PLAYER_SPACE_HEIGHT = 6;

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
  tileSize?: number;
  baseY?: number;
  occupiedOrigins?: TileOrigin[];
};

export type MountedPlayerMapSpace = {
  group: THREE.Group;
  spaceMesh: THREE.Mesh;
  playerMarkerMesh: THREE.Mesh;
  tileX: number;
  tileY: number;
  worldX: number;
  worldZ: number;
  widthTiles: number;
  heightTiles: number;
  updatePosition: (tileX: number, tileY: number, occupiedOrigins?: TileOrigin[]) => void;
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

    const maxWidth = gridWidth - x;
    const maxHeight = gridHeight - y;

    return {
      x,
      y,
      width: Math.min(building.footprint + paddingTiles * 2, maxWidth),
      height: Math.min(building.footprint + paddingTiles * 2, maxHeight),
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

  const blockedRects = getFixedBuildingBlockedRects(gridWidth, gridHeight, 1);

  for (const blocked of blockedRects) {
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
  const desiredTileX = clamp(toInt(tileX), 0, Math.max(0, gridWidth - PLAYER_SPACE_WIDTH));
  const desiredTileY = clamp(toInt(tileY), 0, Math.max(0, gridHeight - PLAYER_SPACE_HEIGHT));

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

  const allCandidates = buildCandidateOrigins(gridWidth, gridHeight)
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
    );

  if (allCandidates.length === 0) {
    throw new Error('Nenhum espaço 6x6 livre no mapa');
  }

  const best = allCandidates[0];
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
  tileSize = 1,
  baseY = 0.06,
  occupiedOrigins = [],
}: PlayerMapSpaceOptions): MountedPlayerMapSpace {
  const group = new THREE.Group();

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

  const markerGeometry = new THREE.BoxGeometry(
    2 * tileSize,
    2 * tileSize,
    2 * tileSize
  );

  const markerMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0,
  });

  const playerMarkerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
  playerMarkerMesh.castShadow = true;
  playerMarkerMesh.receiveShadow = true;
  group.add(playerMarkerMesh);

  function applyPosition(nextTileX: number, nextTileY: number, nextOccupiedOrigins: TileOrigin[] = []) {
    const resolved = resolvePlayerSpawnSpace(
      nextTileX,
      nextTileY,
      nextOccupiedOrigins,
      gridWidth,
      gridHeight
    );

    group.position.set(resolved.worldX, 0, resolved.worldZ);
    spaceMesh.position.set(0, baseY, 0);
    playerMarkerMesh.position.set(0, tileSize, 0);

    mounted.tileX = resolved.tileX;
    mounted.tileY = resolved.tileY;
    mounted.worldX = resolved.worldX;
    mounted.worldZ = resolved.worldZ;
  }

  const mounted: MountedPlayerMapSpace = {
    group,
    spaceMesh,
    playerMarkerMesh,
    tileX: 0,
    tileY: 0,
    worldX: 0,
    worldZ: 0,
    widthTiles: PLAYER_SPACE_WIDTH,
    heightTiles: PLAYER_SPACE_HEIGHT,
    updatePosition(nextTileX: number, nextTileY: number, nextOccupiedOrigins: TileOrigin[] = []) {
      applyPosition(nextTileX, nextTileY, nextOccupiedOrigins);
    },
    cleanup() {
      scene.remove(group);
      spaceGeometry.dispose();
      spaceMaterial.dispose();
      markerGeometry.dispose();
      markerMaterial.dispose();
    },
  };

  applyPosition(tileX, tileY, occupiedOrigins);
  scene.add(group);

  return mounted;
}