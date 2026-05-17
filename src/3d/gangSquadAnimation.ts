/**
 * 3d/gangSquadAnimation.ts
 * Animação de deslocamento do comboio no mapa.
 *
 * Responsabilidade única:
 * - animar um grupo Three.js ao longo de uma rota de tiles;
 * - renderizar o visual do comboio usando skins de src/data/convoySkins.ts;
 * - preservar a API pública usada pelos hooks de ataque.
 *
 * Não calcula batalha, não altera saldo, não resolve ataque e não fala com backend.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import {
  getConvoySkinById,
  type ConvoySkinAsset,
  type ConvoySkinDefinition,
} from '@/data/convoySkins';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═════════════════════════════════════════════════════════════════════════════

export type RouteTile = {
  tileX: number;
  tileY: number;
};

export type SquadMarkerOptions = {
  /** Número de membros exibido no label do squad */
  memberCount: number;
  /** Cor hex usada na trilha discreta do deslocamento */
  color?: string;
};

export type GangSquadAnimationParams = {
  scene: THREE.Scene;
  route: RouteTile[];
  gridWidth: number;
  gridHeight: number;
  tileSize?: number;
  /** Nível do barraco determina fallback de velocidade quando backend não envia tempo. */
  barracoLevel?: number;
  memberCount?: number;
  color?: string;
  onStep?: (stepIndex: number, tile: RouteTile) => void;
  onArrived?: () => void;
  timePerTileMs?: number;
  totalDurationMs?: number;
  /** Skin visual do comboio. Se vier ausente/inválida, usa comboio_padrao. */
  convoySkinId?: string | null;
};

export type MountedSquadAnimation = {
  group: THREE.Group;
  routeDistanceTiles: number;
  totalDurationMs: number;
  start: () => Promise<void>;
  cancel: () => void;
  cleanup: () => void;
};

// ═════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═════════════════════════════════════════════════════════════════════════════

/** Tempo base por tile em ms. Dividido pelo nível do barraco quando não vier tempo do backend. */
const BASE_MS_PER_TILE = 5000;

/** Altura do root do comboio em relação ao piso. */
const CONVOY_WORLD_Y = 0.14;

/** Margem extra dentro de cada GLB normalizado para impedir afundar no chão. */
const MODEL_FLOOR_LIFT = 0.10;

/** Tamanho máximo normalizado de cada GLB antes de aplicar asset.scale. */
const MODEL_BASE_SIZE = 0.95;

/** Altura do label de membros acima do comboio. */
const LABEL_HEIGHT = 1.75;

/** Offset de rotação caso os GLBs apontem para outra direção. 0 significa frente local +Z. */
const CONVOY_ROTATION_OFFSET_Y = 0;

// Cache por URL, não por skin. Skins futuras podem reaproveitar GLBs.
const convoyModelCache = new Map<string, THREE.Object3D>();
const convoyModelPending = new Map<string, Promise<THREE.Object3D>>();

const sharedDracoLoader = new DRACOLoader();
sharedDracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

const sharedGltfLoader = new GLTFLoader();
sharedGltfLoader.setDRACOLoader(sharedDracoLoader);

// ═════════════════════════════════════════════════════════════════════════════
// CONVERSÃO TILE → MUNDO
// ═════════════════════════════════════════════════════════════════════════════

function tileToWorld(
  tileX: number,
  tileY: number,
  gridWidth: number,
  gridHeight: number,
  tileSize: number
): { worldX: number; worldZ: number } {
  return {
    worldX: (tileX - gridWidth / 2) * tileSize + tileSize / 2,
    worldZ: (tileY - gridHeight / 2) * tileSize + tileSize / 2,
  };
}

function getMsPerTile(barracoLevel: number): number {
  const safe = Math.max(1, Math.floor(Number(barracoLevel) || 1));
  return Math.max(400, BASE_MS_PER_TILE / safe);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function normalizeAngle(angle: number) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function lerpAngle(a: number, b: number, t: number) {
  return a + normalizeAngle(b - a) * t;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// ═════════════════════════════════════════════════════════════════════════════
// MATERIAIS / LUZ / NORMALIZAÇÃO DOS GLBS
// ═════════════════════════════════════════════════════════════════════════════

function forEachMaterial(
  material: THREE.Material | THREE.Material[] | undefined,
  callback: (material: THREE.Material) => void
) {
  if (!material) return;
  if (Array.isArray(material)) {
    material.forEach(callback);
    return;
  }
  callback(material);
}

function brightenMaterial(material: THREE.Material) {
  const mat = material as THREE.Material & {
    color?: THREE.Color;
    emissive?: THREE.Color;
    emissiveIntensity?: number;
    metalness?: number;
    roughness?: number;
    envMapIntensity?: number;
  };

  // Evita GLB quase preto quando a luz global do mapa é fraca.
  if (typeof mat.metalness === 'number') {
    mat.metalness = Math.min(mat.metalness, 0.45);
  }

  if (typeof mat.roughness === 'number') {
    mat.roughness = Math.max(mat.roughness, 0.42);
  }

  if (typeof mat.envMapIntensity === 'number') {
    mat.envMapIntensity = Math.max(mat.envMapIntensity, 1.35);
  }

  if (mat.color instanceof THREE.Color && mat.emissive instanceof THREE.Color) {
    mat.emissive.copy(mat.color).multiplyScalar(0.18);
    mat.emissiveIntensity = Math.max(Number(mat.emissiveIntensity) || 0, 0.42);
  }

  material.side = THREE.DoubleSide;
  material.needsUpdate = true;
}

function prepareModelMeshes(root: THREE.Object3D) {
  root.traverse((obj: THREE.Object3D) => {
    const mesh = obj as THREE.Mesh;
    if ((mesh as any).isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      forEachMaterial(mesh.material as THREE.Material | THREE.Material[] | undefined, brightenMaterial);
    }
  });
}

function normalizeIntoWrapper(content: THREE.Object3D, desiredSize = MODEL_BASE_SIZE): THREE.Group {
  /**
   * Importante:
   * O offset de normalização precisa ficar dentro de um wrapper.
   * Se normalizar ajustando root.position e depois aplicar slot.position,
   * o ajuste é perdido e o GLB afunda no chão.
   */
  const wrapper = new THREE.Group();
  wrapper.name = 'convoy-model-wrapper';
  wrapper.add(content);

  wrapper.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(content);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxAxis = Math.max(size.x || 1, size.y || 1, size.z || 1);
  const scale = desiredSize / maxAxis;
  content.scale.multiplyScalar(scale);

  wrapper.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(content);

  const center = new THREE.Vector3();
  box.getCenter(center);

  content.position.x -= center.x;
  content.position.z -= center.z;
  content.position.y -= box.min.y;
  content.position.y += MODEL_FLOOR_LIFT;

  wrapper.updateMatrixWorld(true);
  return wrapper;
}

function createConvoyLights() {
  const group = new THREE.Group();
  group.name = 'convoy-local-lights';

  const ambient = new THREE.AmbientLight(0xffffff, 1.05);
  group.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 1.55);
  key.position.set(4, 7, 3);
  key.castShadow = false;
  group.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.9);
  fill.position.set(-4, 5, -3);
  fill.castShadow = false;
  group.add(fill);

  const top = new THREE.PointLight(0xffffff, 1.1, 6.5, 1.2);
  top.position.set(0, 2.6, 0);
  top.castShadow = false;
  group.add(top);

  return group;
}

function createFallbackVehicle(index: number) {
  const raw = new THREE.Group();
  raw.name = `convoy-fallback-${index}`;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.34, 1.15),
    new THREE.MeshStandardMaterial({
      color: 0x4b5563,
      roughness: 0.48,
      metalness: 0.16,
      emissive: 0x20232a,
      emissiveIntensity: 0.35,
    })
  );
  body.castShadow = true;
  body.receiveShadow = true;
  body.position.y = 0.22;
  raw.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.28, 0.45),
    new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.44,
      metalness: 0.18,
      emissive: 0x1f2937,
      emissiveIntensity: 0.45,
    })
  );
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  cabin.position.set(0, 0.52, -0.08);
  raw.add(cabin);

  return normalizeIntoWrapper(raw, MODEL_BASE_SIZE);
}

async function loadBaseModel(url: string, index: number): Promise<THREE.Object3D> {
  if (convoyModelCache.has(url)) {
    return convoyModelCache.get(url)!;
  }

  if (convoyModelPending.has(url)) {
    return convoyModelPending.get(url)!;
  }

  const pending = (async () => {
    try {
      const gltf = await sharedGltfLoader.loadAsync(url);
      const gltfScene = gltf.scene || gltf.scenes?.[0];

      if (!gltfScene) {
        const fallback = createFallbackVehicle(index);
        convoyModelCache.set(url, fallback);
        return fallback;
      }

      const content = gltfScene.clone(true);
      prepareModelMeshes(content);

      const normalized = normalizeIntoWrapper(content, MODEL_BASE_SIZE);
      convoyModelCache.set(url, normalized);
      return normalized;
    } catch (err) {
      console.error('[CONVOY_GLB_LOAD_ERROR]', url, err);
      const fallback = createFallbackVehicle(index);
      convoyModelCache.set(url, fallback);
      return fallback;
    } finally {
      convoyModelPending.delete(url);
    }
  })();

  convoyModelPending.set(url, pending);
  return pending;
}

function cloneModelForMarch(base: THREE.Object3D) {
  const clone = base.clone(true);
  prepareModelMeshes(clone);
  return clone;
}

async function createConvoyVehiclesGroup(skin: ConvoySkinDefinition) {
  const group = new THREE.Group();
  group.name = `convoy-skin-${skin.id}`;

  const assets = Array.isArray(skin.assets) ? skin.assets : [];

  await Promise.all(
    assets.map(async (asset: ConvoySkinAsset, index: number) => {
      const base = await loadBaseModel(asset.url, index);
      const model = cloneModelForMarch(base);
      const slot = asset.position ?? { x: 0, y: 0, z: -index };

      model.position.set(
        Number(slot.x) || 0,
        Number(slot.y) || 0,
        Number(slot.z) || -index
      );

      if (isFiniteNumber(asset.scale)) {
        model.scale.multiplyScalar(asset.scale);
      }

      if (isFiniteNumber(asset.rotationY)) {
        model.rotation.y += asset.rotationY;
      }

      group.add(model);
    })
  );

  if (group.children.length === 0) {
    group.add(createFallbackVehicle(0));
  }

  return group;
}

// ═════════════════════════════════════════════════════════════════════════════
// LABEL DO COMBOIO — SEM CÍRCULO / SEM HALO VERMELHO
// ═════════════════════════════════════════════════════════════════════════════

function buildConvoyLabel(options: SquadMarkerOptions): {
  group: THREE.Group;
  animatePulse: (elapsedMs: number) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0,0,0,0.68)';

  if (typeof (ctx as any).roundRect === 'function') {
    ctx.beginPath();
    (ctx as any).roundRect(0, 0, 512, 128, 18);
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, 512, 128);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 46px Oswald, Arial';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.75)';
  ctx.shadowBlur = 6;
  ctx.fillText(`${options.memberCount.toLocaleString('pt-BR')} membros`, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
  });

  const sprite = new THREE.Sprite(spriteMat);
  sprite.name = 'convoy-member-count-label';
  sprite.scale.set(4.8, 1.2, 1);
  sprite.position.set(0, LABEL_HEIGHT, 0);
  group.add(sprite);

  function animatePulse(elapsedMs: number) {
    const t = elapsedMs / 1000;
    sprite.position.y = LABEL_HEIGHT + Math.sin(t * 3.4) * 0.035;
  }

  function dispose() {
    texture.dispose();
    spriteMat.dispose();
  }

  return { group, animatePulse, dispose };
}

// ═════════════════════════════════════════════════════════════════════════════
// ANIMAÇÃO PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════

export function mountGangSquadAnimation({
  scene,
  route,
  gridWidth,
  gridHeight,
  tileSize = 1,
  barracoLevel = 1,
  memberCount = 100,
  color = '#ef4444',
  onStep,
  onArrived,
  timePerTileMs,
  totalDurationMs,
  convoySkinId,
}: GangSquadAnimationParams): MountedSquadAnimation {
  const safeRoute = Array.isArray(route) ? route : [];
  const routeDistanceTiles = Math.max(0, safeRoute.length - 1);

  const fallbackMsPerTile = getMsPerTile(barracoLevel);
  const suppliedTotalDurationMs = Number(totalDurationMs);
  const suppliedTimePerTileMs = Number(timePerTileMs);

  const effectiveTotalDurationMs =
    Number.isFinite(suppliedTotalDurationMs) && suppliedTotalDurationMs >= 0
      ? suppliedTotalDurationMs
      : routeDistanceTiles *
        (
          Number.isFinite(suppliedTimePerTileMs) && suppliedTimePerTileMs > 0
            ? suppliedTimePerTileMs
            : fallbackMsPerTile
        );

  const effectiveMsPerTile =
    routeDistanceTiles > 0
      ? Math.max(1, effectiveTotalDurationMs / routeDistanceTiles)
      : fallbackMsPerTile;

  const convoySkin = getConvoySkinById(convoySkinId);

  const root = new THREE.Group();
  root.name = 'gang-squad-animation';

  const lights = createConvoyLights();
  root.add(lights);

  const label = buildConvoyLabel({ memberCount, color });
  root.add(label.group);

  // Trilha discreta. Não é círculo, não é halo e não usa geometria vermelha sob o comboio.
  const trailPoints = safeRoute.map((step) => {
    const { worldX, worldZ } = tileToWorld(step.tileX, step.tileY, gridWidth, gridHeight, tileSize);
    return new THREE.Vector3(worldX, CONVOY_WORLD_Y + 0.025, worldZ);
  });

  const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPoints);
  const trailMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const trailLine = new THREE.Line(trailGeo, trailMat);
  trailLine.name = 'convoy-route-line';
  root.add(trailLine);

  let convoyGroup: THREE.Group | null = null;
  let isCancelled = false;
  let isRunning = false;
  let frameId = 0;
  let didCleanup = false;
  let currentRotationY = 0;

  scene.add(root);

  if (safeRoute.length > 0) {
    const { worldX, worldZ } = tileToWorld(
      safeRoute[0].tileX,
      safeRoute[0].tileY,
      gridWidth,
      gridHeight,
      tileSize
    );
    root.position.set(worldX, CONVOY_WORLD_Y, worldZ);
  }

  function setRootRotationTowards(from: RouteTile, to: RouteTile, instant = false) {
    const fw = tileToWorld(from.tileX, from.tileY, gridWidth, gridHeight, tileSize);
    const tw = tileToWorld(to.tileX, to.tileY, gridWidth, gridHeight, tileSize);
    const dx = tw.worldX - fw.worldX;
    const dz = tw.worldZ - fw.worldZ;

    if (Math.abs(dx) < 0.0001 && Math.abs(dz) < 0.0001) return;

    const targetRotationY = Math.atan2(dx, dz) + CONVOY_ROTATION_OFFSET_Y;
    currentRotationY = instant ? targetRotationY : lerpAngle(currentRotationY, targetRotationY, 0.24);
    root.rotation.y = currentRotationY;
  }

  function cleanup() {
    if (didCleanup) return;
    didCleanup = true;

    cancelAnimationFrame(frameId);
    scene.remove(root);

    trailGeo.dispose();
    trailMat.dispose();
    label.dispose();

    if (convoyGroup) {
      root.remove(convoyGroup);
      convoyGroup = null;
    }

    root.clear();
  }

  function cancel() {
    isCancelled = true;
    cleanup();
  }

  async function start(): Promise<void> {
    if (isRunning || isCancelled) return;
    isRunning = true;

    if (safeRoute.length === 0) {
      onArrived?.();
      return;
    }

    if (safeRoute.length > 1) {
      setRootRotationTowards(safeRoute[0], safeRoute[1], true);
    }

    const loadedConvoy = await createConvoyVehiclesGroup(convoySkin);

    if (isCancelled || didCleanup) {
      return;
    }

    convoyGroup = loadedConvoy;
    root.add(convoyGroup);

    if (routeDistanceTiles === 0) {
      onStep?.(0, safeRoute[0]);
      onArrived?.();
      return;
    }

    return new Promise<void>((resolve) => {
      const startedAt = performance.now();
      let lastStep = -1;

      function tick(now: number) {
        if (isCancelled || didCleanup) {
          resolve();
          return;
        }

        const elapsed = now - startedAt;
        const capped = Math.min(elapsed, effectiveTotalDurationMs);
        const progressTiles = effectiveMsPerTile > 0 ? capped / effectiveMsPerTile : routeDistanceTiles;
        const segIdx = Math.min(routeDistanceTiles - 1, Math.max(0, Math.floor(progressTiles)));
        const segAlpha = Math.min(1, Math.max(0, progressTiles - segIdx));

        const from = safeRoute[segIdx];
        const to = safeRoute[Math.min(safeRoute.length - 1, segIdx + 1)];

        const fw = tileToWorld(from.tileX, from.tileY, gridWidth, gridHeight, tileSize);
        const tw = tileToWorld(to.tileX, to.tileY, gridWidth, gridHeight, tileSize);

        root.position.set(
          lerp(fw.worldX, tw.worldX, segAlpha),
          CONVOY_WORLD_Y,
          lerp(fw.worldZ, tw.worldZ, segAlpha)
        );

        setRootRotationTowards(from, to);
        label.animatePulse(elapsed);

        if (segIdx !== lastStep) {
          lastStep = segIdx;
          onStep?.(segIdx, safeRoute[segIdx]);
        }

        if (capped >= effectiveTotalDurationMs) {
          const last = safeRoute[safeRoute.length - 1];
          const prev = safeRoute[Math.max(0, safeRoute.length - 2)];
          const lw = tileToWorld(last.tileX, last.tileY, gridWidth, gridHeight, tileSize);

          root.position.set(lw.worldX, CONVOY_WORLD_Y, lw.worldZ);
          setRootRotationTowards(prev, last, false);
          onStep?.(safeRoute.length - 1, last);
          onArrived?.();
          resolve();
          return;
        }

        frameId = requestAnimationFrame(tick);
      }

      frameId = requestAnimationFrame(tick);
    });
  }

  return {
    group: root,
    routeDistanceTiles,
    totalDurationMs: effectiveTotalDurationMs,
    start,
    cancel,
    cleanup,
  };
}
