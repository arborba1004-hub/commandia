import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils';
import { tileToWorldCenter, type TileOrigin } from '@/components/game/playerMapSpace';

export const GANG_ATTACK_BASE_TIME_PER_TILE_MS = 5000;
export const GANG_ATTACK_MARKER_HEIGHT = 0.02;

const SQUAD_MODEL_URLS = [
  'https://static.wixstatic.com/3d/50f4bf_fba4d4f447c64d4ba6ba2f710d2af326.glb',
  'https://static.wixstatic.com/3d/50f4bf_543161c59f824a3fac85ba696a9a5efd.glb',
  'https://static.wixstatic.com/3d/50f4bf_e1753da6697d42b89e89f43f2dc14ef4.glb',
  'https://static.wixstatic.com/3d/50f4bf_3946576a583344c78d1d912657570015.glb',
  'https://static.wixstatic.com/3d/50f4bf_9406cb84f4834b84aba259f58e073e8b.glb',
  'https://static.wixstatic.com/3d/50f4bf_3d710d145f1b455d9360a59766a17f45.glb',
] as const;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const modelPromiseCache = new Map<string, Promise<THREE.Object3D>>();

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

type DustParticle = {
  sprite: THREE.Sprite;
  angle: number;
  radius: number;
  baseY: number;
  speed: number;
  drift: number;
  phase: number;
};

type SquadMarker = {
  group: THREE.Group;
  ensureLoaded: () => Promise<void>;
  animateVisuals: (elapsedMs: number) => void;
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

function cloneObjectMaterials(object: THREE.Object3D) {
  object.traverse((child: any) => {
    if (!child?.isMesh || !child.material) return;

    if (Array.isArray(child.material)) {
      child.material = child.material.map((material: THREE.Material) => material.clone());
    } else {
      child.material = child.material.clone();
    }
  });
}

function createTextSprite(text: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 160;

  const context = canvas.getContext('2d');
  if (!context) {
    const fallback = new THREE.Sprite();
    return {
      sprite: fallback,
      cleanup: () => {},
    };
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(0, 0, 0, 0.62)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(255,255,255,0.10)';
  context.lineWidth = 4;
  context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = 'bold 48px Oswald, Arial';
  context.fillStyle = '#ffffff';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4.8, 1.2, 1);

  return {
    sprite,
    cleanup: () => {
      texture.dispose();
      material.dispose();
    },
  };
}

function createDustTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;

  const context = canvas.getContext('2d');
  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(220, 205, 180, 0.75)');
  gradient.addColorStop(0.4, 'rgba(210, 190, 160, 0.35)');
  gradient.addColorStop(1, 'rgba(190, 170, 145, 0)');

  context.clearRect(0, 0, 128, 128);
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(64, 64, 64, 0, Math.PI * 2);
  context.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createDustEffect(color = '#c7b08a') {
  const root = new THREE.Group();
  const texture = createDustTexture();
  const particles: DustParticle[] = [];

  for (let index = 0; index < 14; index += 1) {
    const material = new THREE.SpriteMaterial({
      map: texture,
      color,
      transparent: true,
      opacity: 0.12 + Math.random() * 0.08,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.setScalar(0.55 + Math.random() * 0.6);

    const particle: DustParticle = {
      sprite,
      angle: (Math.PI * 2 * index) / 14,
      radius: 0.65 + Math.random() * 1.25,
      baseY: 0.05 + Math.random() * 0.18,
      speed: 0.75 + Math.random() * 0.8,
      drift: 0.06 + Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2,
    };

    sprite.position.set(
      Math.cos(particle.angle) * particle.radius,
      particle.baseY,
      Math.sin(particle.angle) * particle.radius
    );

    particles.push(particle);
    root.add(sprite);
  }

  return {
    group: root,
    animate(elapsedMs: number) {
      const t = elapsedMs / 1000;

      for (const particle of particles) {
        particle.angle += 0.0035 * particle.speed;
        const pulse = 0.85 + Math.sin(t * 2.4 + particle.phase) * 0.18;
        const radius = particle.radius + Math.sin(t * 1.7 + particle.phase) * particle.drift;

        particle.sprite.position.x = Math.cos(particle.angle + t * 0.5 * particle.speed) * radius;
        particle.sprite.position.z = Math.sin(particle.angle + t * 0.45 * particle.speed) * radius;
        particle.sprite.position.y =
          particle.baseY + Math.sin(t * 2.8 * particle.speed + particle.phase) * 0.05;

        particle.sprite.scale.setScalar((0.55 + particle.radius * 0.18) * pulse);

        const material = particle.sprite.material as THREE.SpriteMaterial;
        material.opacity = 0.08 + (Math.sin(t * 3.1 + particle.phase) + 1) * 0.045;
      }
    },
    cleanup() {
      for (const particle of particles) {
        const material = particle.sprite.material as THREE.SpriteMaterial;
        material.dispose();
      }
      texture.dispose();
    },
  };
}

function normalizeModelSize(model: THREE.Object3D, targetHeight = 1.75) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const currentHeight = Math.max(0.001, size.y);
  const scale = targetHeight / currentHeight;
  model.scale.setScalar(scale);

  const scaledBox = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  scaledBox.getCenter(center);
  model.position.sub(center);

  const groundedBox = new THREE.Box3().setFromObject(model);
  model.position.y -= groundedBox.min.y;
}

function applyModelQuality(model: THREE.Object3D) {
  model.traverse((child: any) => {
    if (!child?.isMesh) return;

    child.castShadow = true;
    child.receiveShadow = true;

    if (!child.material) return;

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    materials.forEach((material: any) => {
      if ('metalness' in material) material.metalness = 0;
      if ('roughness' in material) material.roughness = 0.95;
      if ('envMapIntensity' in material) material.envMapIntensity = 0.6;
      if ('needsUpdate' in material) material.needsUpdate = true;
    });
  });
}

async function loadModelTemplate(url: string) {
  const cached = modelPromiseCache.get(url);
  if (cached) return cached;

  const promise = new Promise<THREE.Object3D>((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => resolve(gltf.scene),
      undefined,
      (error) => reject(error)
    );
  });

  modelPromiseCache.set(url, promise);
  return promise;
}

async function createNpcClone(url: string) {
  const template = await loadModelTemplate(url);
  const clone = cloneSkeleton(template);
  cloneObjectMaterials(clone);
  applyModelQuality(clone);
  normalizeModelSize(clone, 1.7);
  return clone;
}

export function getGangAttackTimePerTileMs(
  barracoLevel: number,
  baseTimePerTileMs = GANG_ATTACK_BASE_TIME_PER_TILE_MS
) {
  const safeLevel = Math.max(1, Math.floor(toPositiveNumber(barracoLevel, 1)));
  const safeBaseTime = Math.max(
    1,
    toPositiveNumber(baseTimePerTileMs, GANG_ATTACK_BASE_TIME_PER_TILE_MS)
  );

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

  let currentX = Math.max(
    0,
    Math.min(gridWidth - 1, Math.floor(toNumber(params.originTileX, 0)))
  );
  let currentY = Math.max(
    0,
    Math.min(gridHeight - 1, Math.floor(toNumber(params.originTileY, 0)))
  );
  const targetX = Math.max(
    0,
    Math.min(gridWidth - 1, Math.floor(toNumber(params.targetTileX, 0)))
  );
  const targetY = Math.max(
    0,
    Math.min(gridHeight - 1, Math.floor(toNumber(params.targetTileY, 0)))
  );

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
}): SquadMarker {
  const root = new THREE.Group();
  const squadRoot = new THREE.Group();
  const fallbackRoot = new THREE.Group();

  root.add(squadRoot);
  root.add(fallbackRoot);

  const quantityLabel = createTextSprite(
    `${Math.max(1, Math.floor(params.quantity)).toLocaleString('pt-BR')} membros`
  );
  quantityLabel.sprite.position.set(0, 2.8, 0);
  root.add(quantityLabel.sprite);

  const ringGeometry = new THREE.RingGeometry(1.05, 1.45, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: params.color,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  root.add(ring);

  const dust = createDustEffect('#cdb28c');
  root.add(dust.group);

  const fallbackGeometry = new THREE.CapsuleGeometry(0.22, 0.45, 3, 8);
  const fallbackMaterial = new THREE.MeshStandardMaterial({
    color: '#f2f2f2',
    roughness: 0.85,
    metalness: 0,
    transparent: true,
    opacity: 0.35,
  });

  const fallbackOffsets = [
    [-0.75, 0.48, 0.55],
    [0, 0.48, 0.7],
    [0.75, 0.48, 0.55],
    [-0.55, 0.48, -0.2],
    [0.35, 0.48, -0.35],
    [1.05, 0.48, -0.2],
  ] as const;

  fallbackOffsets.forEach(([x, y, z]) => {
    const mesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    fallbackRoot.add(mesh);
  });

  const npcSlots = [
    { x: -1.05, z: 0.85, rotationY: 0.12 },
    { x: -0.25, z: 1.05, rotationY: 0.08 },
    { x: 0.65, z: 0.9, rotationY: -0.05 },
    { x: -0.8, z: -0.15, rotationY: 0.1 },
    { x: 0.15, z: -0.35, rotationY: -0.08 },
    { x: 1.0, z: -0.1, rotationY: -0.12 },
  ] as const;

  let loadedNpcs: THREE.Object3D[] = [];
  let loaded = false;

  const ensureLoaded = async () => {
    if (loaded) return;

    const clones = await Promise.all(SQUAD_MODEL_URLS.map((url) => createNpcClone(url)));

    clones.forEach((npc, index) => {
      const slot = npcSlots[index] ?? npcSlots[npcSlots.length - 1];
      npc.position.set(slot.x, 0, slot.z);
      npc.rotation.y = slot.rotationY;
      squadRoot.add(npc);
    });

    loadedNpcs = clones;
    fallbackRoot.visible = false;
    loaded = true;
  };

  return {
    group: root,
    ensureLoaded,
    animateVisuals(elapsedMs: number) {
      const t = elapsedMs / 1000;

      root.rotation.y = Math.sin(t * 1.8) * 0.025;
      root.position.y = Math.sin(t * 5.5) * 0.02;
      ring.scale.setScalar(1 + Math.sin(t * 5.2) * 0.03);
      ringMaterial.opacity = 0.24 + (Math.sin(t * 5.4) + 1) * 0.04;

      quantityLabel.sprite.position.y = 2.8 + Math.sin(t * 3.2) * 0.05;
      dust.animate(elapsedMs);

      if (loadedNpcs.length > 0) {
        loadedNpcs.forEach((npc, index) => {
          const phase = t * (2.2 + index * 0.08) + index * 0.7;
          npc.position.y = Math.sin(phase) * 0.03;
          npc.rotation.y =
            (npcSlots[index]?.rotationY ?? 0) + Math.sin(phase * 0.85) * 0.04;
          npc.position.x = (npcSlots[index]?.x ?? 0) + Math.sin(phase * 0.45) * 0.015;
          npc.position.z = (npcSlots[index]?.z ?? 0) + Math.cos(phase * 0.45) * 0.015;
        });
      } else {
        fallbackRoot.children.forEach((child, index) => {
          child.position.y = (fallbackOffsets[index]?.[1] ?? 0.48) + Math.sin(t * 4 + index) * 0.02;
        });
      }
    },
    cleanup() {
      quantityLabel.cleanup();
      ringGeometry.dispose();
      ringMaterial.dispose();
      fallbackGeometry.dispose();
      fallbackMaterial.dispose();
      dust.cleanup();

      loadedNpcs.forEach((npc) => disposeObject(npc));
      loadedNpcs = [];
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
  const timePerTileMs = getGangAttackTimePerTileMs(
    barracoLevel,
    baseTimePerTileMs
  );
  const totalDurationMs = routeDistanceTiles * timePerTileMs;

  const root = new THREE.Group();
  root.name = 'gang-attack-animation';

  const trailMaterial = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.3,
  });

  const trailPoints = route.map(
    (step) => new THREE.Vector3(step.worldX, 0.04, step.worldZ)
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
  let cleanedUp = false;

  if (route.length > 0) {
    marker.group.position.set(
      route[0].worldX,
      GANG_ATTACK_MARKER_HEIGHT,
      route[0].worldZ
    );
  }

  function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;

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

    await marker.ensureLoaded();

    if (routeDistanceTiles <= 0) {
      marker.group.position.set(
        route[route.length - 1]?.worldX ?? 0,
        GANG_ATTACK_MARKER_HEIGHT,
        route[route.length - 1]?.worldZ ?? 0
      );
      marker.animateVisuals(0);
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

        if (to) {
          const dx = to.worldX - from.worldX;
          const dz = to.worldZ - from.worldZ;
          if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
            root.rotation.y = Math.atan2(dx, dz);
          }
        }

        marker.animateVisuals(elapsedMs);

        if (cappedElapsedMs >= totalDurationMs) {
          marker.group.position.set(
            route[route.length - 1].worldX,
            GANG_ATTACK_MARKER_HEIGHT,
            route[route.length - 1].worldZ
          );
          marker.animateVisuals(elapsedMs);
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