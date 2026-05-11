import * as THREE from 'three';
import { tileToWorldCenter, type TileOrigin } from '@/components/game/playerMapSpace';

export const GANG_ATTACK_BASE_TIME_PER_TILE_MS = 5000;
export const GANG_ATTACK_MARKER_HEIGHT = 1.35;

export type GangAttackAnimationParams = {
  scene: THREE.Scene;
  originTileX: number;
  originTileY: number;
  targetTileX: number;
  targetTileY: number;
  gridWidth: number;
  gridHeight: number;
  tileSize?: number;
  barracoLevel: number;
  baseTimePerTileMs?: number;
  quantity?: number;
  color?: string;
};

export type GangAttackRouteStep = TileOrigin & {
  worldX: number;
  worldZ: number;
};

export type MountedGangAttackAnimation = {
  group: THREE.Group;
  route: GangAttackRouteStep[];
  routeDistanceTiles: number;
  timePerTileMs: number;
  totalDurationMs: number;
  start: () => Promise<void>;
  cancel: () => void;
  cleanup: () => void;
};

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toPositiveNumber(value: unknown, fallback = 1) {
  const numeric = toNumber(value, fallback);
  return numeric > 0 ? numeric : fallback;
}

function lerp(start: number, end: number, alpha: number) {
  return start + (end - start) * alpha;
}

export function getGangAttackTimePerTileMs(
  barracoLevel: number,
  baseTimePerTileMs = GANG_ATTACK_BASE_TIME_PER_TILE_MS
) {
  const safeLevel = Math.max(1, Math.floor(toPositiveNumber(barracoLevel, 1)));
  const safeBaseTime = Math.max(1, toPositiveNumber(baseTimePerTileMs, GANG_ATTACK_BASE_TIME_PER_TILE_MS));

  return safeBaseTime / safeLevel;
}

export function buildGangAttackShortestRoute(params: {
  originTileX: number;
  originTileY: number;
  targetTileX: number;
  targetTileY: number;
  gridWidth: number;
  gridHeight: number;
  tileSize?: number;
}): GangAttackRouteStep[] {
  const tileSize = toPositiveNumber(params.tileSize, 1);
  const gridWidth = Math.max(1, Math.floor(toPositiveNumber(params.gridWidth, 1)));
  const gridHeight = Math.max(1, Math.floor(toPositiveNumber(params.gridHeight, 1)));

  let currentX = Math.max(0, Math.min(gridWidth - 1, Math.floor(toNumber(params.originTileX, 0))));
  let currentY = Math.max(0, Math.min(gridHeight - 1, Math.floor(toNumber(params.originTileY, 0))));
  const targetX = Math.max(0, Math.min(gridWidth - 1, Math.floor(toNumber(params.targetTileX, 0))));
  const targetY = Math.max(0, Math.min(gridHeight - 1, Math.floor(toNumber(params.targetTileY, 0))));

  const route: GangAttackRouteStep[] = [];

  function pushStep(tileX: number, tileY: number) {
    const { worldX, worldZ } = tileToWorldCenter(tileX, tileY, gridWidth, gridHeight);
    route.push({
      tileX,
      tileY,
      worldX: worldX * tileSize,
      worldZ: worldZ * tileSize,
    });
  }

  pushStep(currentX, currentY);

  while (currentX !== targetX || currentY !== targetY) {
    if (currentX < targetX) currentX += 1;
    else if (currentX > targetX) currentX -= 1;

    if (currentY < targetY) currentY += 1;
    else if (currentY > targetY) currentY -= 1;

    pushStep(currentX, currentY);
  }

  return route;
}

export function getGangAttackRouteDistanceTiles(route: GangAttackRouteStep[]) {
  return Math.max(0, route.length - 1);
}

function createSquadMarker(params: {
  quantity: number;
  color: string;
}) {
  const group = new THREE.Group();

  const quantity = Math.max(1, Math.floor(toPositiveNumber(params.quantity, 1)));
  const color = new THREE.Color(params.color);

  const coreGeometry = new THREE.SphereGeometry(0.32, 18, 18);
  const coreMaterial = new THREE.MeshStandardMaterial({
    color,
    emissive: color.clone().multiplyScalar(0.3),
    emissiveIntensity: 0.7,
    roughness: 0.35,
    metalness: 0.05,
    transparent: true,
    opacity: 0.95,
  });

  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.castShadow = true;
  core.receiveShadow = false;
  group.add(core);

  const haloGeometry = new THREE.RingGeometry(0.48, 0.72, 24);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const halo = new THREE.Mesh(haloGeometry, haloMaterial);
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = -0.28;
  group.add(halo);

  const quantityCanvas = document.createElement('canvas');
  quantityCanvas.width = 512;
  quantityCanvas.height = 128;
  const context = quantityCanvas.getContext('2d');

  let quantitySprite: THREE.Sprite | null = null;

  if (context) {
    context.clearRect(0, 0, quantityCanvas.width, quantityCanvas.height);
    context.fillStyle = 'rgba(0,0,0,0.58)';
    context.fillRect(0, 0, quantityCanvas.width, quantityCanvas.height);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = 'bold 46px Oswald, Arial';
    context.fillStyle = '#ffffff';
    context.fillText(`${quantity.toLocaleString('pt-BR')} membros`, quantityCanvas.width / 2, quantityCanvas.height / 2);

    const texture = new THREE.CanvasTexture(quantityCanvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });

    quantitySprite = new THREE.Sprite(spriteMaterial);
    quantitySprite.scale.set(4.8, 1.2, 1);
    quantitySprite.position.set(0, 1.25, 0);
    group.add(quantitySprite);
  }

  return {
    group,
    animateVisuals(elapsedMs: number) {
      const t = elapsedMs / 1000;
      core.position.y = Math.sin(t * 4.2) * 0.08;
      halo.scale.setScalar(1 + Math.sin(t * 5.4) * 0.06);
      halo.material.opacity = 0.32 + (Math.sin(t * 5.2) + 1) * 0.08;

      if (quantitySprite) {
        quantitySprite.position.y = 1.25 + Math.sin(t * 3.6) * 0.04;
      }
    },
    cleanup() {
      coreGeometry.dispose();
      coreMaterial.dispose();
      haloGeometry.dispose();
      haloMaterial.dispose();

      if (quantitySprite) {
        const material = quantitySprite.material as THREE.SpriteMaterial;
        material.map?.dispose();
        material.dispose();
      }
    },
  };
}

export function mountGangAttackAnimation({
  scene,
  originTileX,
  originTileY,
  targetTileX,
  targetTileY,
  gridWidth,
  gridHeight,
  tileSize = 1,
  barracoLevel,
  baseTimePerTileMs = GANG_ATTACK_BASE_TIME_PER_TILE_MS,
  quantity = 100,
  color = '#ff3b30',
}: GangAttackAnimationParams): MountedGangAttackAnimation {
  const route = buildGangAttackShortestRoute({
    originTileX,
    originTileY,
    targetTileX,
    targetTileY,
    gridWidth,
    gridHeight,
    tileSize,
  });

  const routeDistanceTiles = getGangAttackRouteDistanceTiles(route);
  const timePerTileMs = getGangAttackTimePerTileMs(barracoLevel, baseTimePerTileMs);
  const totalDurationMs = routeDistanceTiles * timePerTileMs;

  const root = new THREE.Group();
  root.name = 'gang-attack-animation';

  const trailMaterial = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.5,
  });

  const trailPoints = route.map(
    (step) => new THREE.Vector3(step.worldX, GANG_ATTACK_MARKER_HEIGHT - 0.65, step.worldZ)
  );
  const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
  const trailLine = new THREE.Line(trailGeometry, trailMaterial);
  root.add(trailLine);

  const marker = createSquadMarker({
    quantity,
    color,
  });

  root.add(marker.group);
  scene.add(root);

  let isCancelled = false;
  let isRunning = false;
  let frameId = 0;

  if (route.length > 0) {
    marker.group.position.set(route[0].worldX, GANG_ATTACK_MARKER_HEIGHT, route[0].worldZ);
  }

  function cleanup() {
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }

    scene.remove(root);
    trailGeometry.dispose();
    trailMaterial.dispose();
    marker.cleanup();
  }

  function cancel() {
    isCancelled = true;
    cleanup();
  }

  async function start() {
    if (isRunning) return;
    isRunning = true;

    if (routeDistanceTiles <= 0) {
      marker.group.position.set(
        route[route.length - 1]?.worldX ?? 0,
        GANG_ATTACK_MARKER_HEIGHT,
        route[route.length - 1]?.worldZ ?? 0
      );
      return;
    }

    await new Promise<void>((resolve) => {
      const startedAt = performance.now();

      function animate(now: number) {
        if (isCancelled) {
          resolve();
          return;
        }

        const elapsedMs = now - startedAt;
        const cappedElapsedMs = Math.min(elapsedMs, totalDurationMs);
        const progressTiles = cappedElapsedMs / timePerTileMs;
        const segmentIndex = Math.min(routeDistanceTiles - 1, Math.floor(progressTiles));
        const segmentAlpha = Math.min(1, Math.max(0, progressTiles - segmentIndex));

        const from = route[segmentIndex];
        const to = route[Math.min(route.length - 1, segmentIndex + 1)];

        marker.group.position.set(
          lerp(from.worldX, to.worldX, segmentAlpha),
          GANG_ATTACK_MARKER_HEIGHT,
          lerp(from.worldZ, to.worldZ, segmentAlpha)
        );

        marker.animateVisuals(elapsedMs);

        if (cappedElapsedMs >= totalDurationMs) {
          marker.group.position.set(
            route[route.length - 1].worldX,
            GANG_ATTACK_MARKER_HEIGHT,
            route[route.length - 1].worldZ
          );
          resolve();
          return;
        }

        frameId = requestAnimationFrame(animate);
      }

      frameId = requestAnimationFrame(animate);
    });
  }

  return {
    group: root,
    route,
    routeDistanceTiles,
    timePerTileMs,
    totalDurationMs,
    start,
    cancel,
    cleanup,
  };
}