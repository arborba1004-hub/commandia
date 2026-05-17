/**
 * 3d/gangSquadAnimation.ts
 *
 * Renderiza e anima o comboio de ataque no mapa.
 * Responsabilidade única: visual da marcha. Não calcula batalha, não altera player e não chama backend.
 *
 * Garantias importantes:
 * - start() começa imediatamente e nunca espera GLB remoto para iniciar a marcha;
 * - GLBs carregam em paralelo, com timeout e fallback individual;
 * - se um GLB falhar, só aquele asset vira fallback;
 * - não existe círculo/halo/trilha translúcida cobrindo os modelos;
 * - materiais dos GLBs ficam sólidos/opacos para evitar visual de overlay lavado;
 * - tamanhos são proporcionais por classe visual: vehicle, character ou prop.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils';
import {
  DEFAULT_CONVOY_SKIN_ID,
  getConvoySkinById,
  type ConvoySkinAsset,
  type ConvoySkinDefinition,
  type ConvoySkinVisualClass,
} from '@/data/convoySkins';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═════════════════════════════════════════════════════════════════════════════

export type RouteTile = {
  tileX: number;
  tileY: number;
};

export type GangSquadAnimationParams = {
  scene: THREE.Scene;
  route: RouteTile[];
  gridWidth: number;
  gridHeight: number;
  tileSize?: number;
  barracoLevel?: number;
  memberCount?: number;
  color?: string;
  convoySkinId?: string | null;
  onStep?: (stepIndex: number, tile: RouteTile) => void;
  onArrived?: () => void;
  timePerTileMs?: number;
  totalDurationMs?: number;
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
// CONFIG
// ═════════════════════════════════════════════════════════════════════════════

const BASE_MS_PER_TILE = 5000;
const GROUND_Y = 0.11;
const LABEL_Y = 2.55;
const MODEL_LOAD_TIMEOUT_MS = 7000;

const DEFAULT_CHARACTER_HEIGHT = 1.7;
const DEFAULT_VEHICLE_LENGTH = 2.75;
const DEFAULT_PROP_SIZE = 1.55;

// Cache por URL. Nunca adicionar o objeto do cache diretamente na cena.
const convoyModelCache = new Map<string, THREE.Object3D>();
const convoyModelPromises = new Map<string, Promise<THREE.Object3D>>();

let sharedGLTFLoader: GLTFLoader | null = null;
let sharedDRACOLoader: DRACOLoader | null = null;

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS BÁSICOS
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

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error(`Timeout carregando ${label}`));
    }, ms);

    promise
      .then((value) => {
        window.clearTimeout(timeout);
        resolve(value);
      })
      .catch((err) => {
        window.clearTimeout(timeout);
        reject(err);
      });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// LOADERS / CACHE
// ═════════════════════════════════════════════════════════════════════════════

function getSharedGLTFLoader() {
  if (!sharedGLTFLoader) {
    sharedGLTFLoader = new GLTFLoader();
    sharedDRACOLoader = new DRACOLoader();
    sharedDRACOLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    sharedGLTFLoader.setDRACOLoader(sharedDRACOLoader);
  }

  return sharedGLTFLoader;
}

async function loadModelBase(url: string): Promise<THREE.Object3D> {
  const cached = convoyModelCache.get(url);
  if (cached) return cached;

  const existing = convoyModelPromises.get(url);
  if (existing) return existing;

  const promise = withTimeout(getSharedGLTFLoader().loadAsync(url), MODEL_LOAD_TIMEOUT_MS, url)
    .then((gltf) => {
      const root = gltf.scene || gltf.scenes?.[0];
      if (!root) throw new Error(`GLB sem scene: ${url}`);

      root.name = `convoy-cache:${url}`;
      prepareModelMaterials(root);
      convoyModelCache.set(url, root);
      return root;
    })
    .catch((err) => {
      convoyModelPromises.delete(url);
      throw err;
    });

  convoyModelPromises.set(url, promise);
  return promise;
}

function cloneModel(root: THREE.Object3D): THREE.Object3D {
  try {
    return cloneSkeleton(root) as THREE.Object3D;
  } catch {
    return root.clone(true);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// MATERIAIS / NITIDEZ
// ═════════════════════════════════════════════════════════════════════════════

function getMaterials(material: THREE.Material | THREE.Material[] | undefined): THREE.Material[] {
  if (!material) return [];
  return Array.isArray(material) ? material : [material];
}

function materialHasCutoutData(mat: any) {
  return Boolean(
    mat?.alphaMap ||
    mat?.map?.format === THREE.RGBAFormat ||
    mat?.map?.source?.data?.hasAlpha ||
    mat?.transparent ||
    (typeof mat?.opacity === 'number' && mat.opacity < 1)
  );
}

function prepareModelMaterials(root: THREE.Object3D) {
  root.traverse((obj: any) => {
    if (!obj?.isMesh) return;

    obj.castShadow = true;
    obj.receiveShadow = true;
    obj.renderOrder = 0;
    obj.frustumCulled = false;

    const materials = getMaterials(obj.material);

    materials.forEach((mat: any) => {
      if (!mat) return;

      // Mantém o material original do GLB, mas impede visual de overlay/lavado.
      // alphaTest preserva recortes de textura sem tornar o modelo semitransparente.
      const cutout = materialHasCutoutData(mat);
      mat.transparent = false;
      mat.opacity = 1;
      mat.alphaTest = cutout ? Math.max(Number(mat.alphaTest || 0), 0.28) : 0;
      mat.depthWrite = true;
      mat.depthTest = true;

      if ('envMapIntensity' in mat) mat.envMapIntensity = Math.min(Number(mat.envMapIntensity ?? 1), 1);
      if ('emissiveIntensity' in mat) mat.emissiveIntensity = Math.min(Number(mat.emissiveIntensity ?? 0), 0.18);
      if ('toneMapped' in mat) mat.toneMapped = true;
      if ('needsUpdate' in mat) mat.needsUpdate = true;
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// TAMANHO PROPORCIONAL
// ═════════════════════════════════════════════════════════════════════════════

function getBox(root: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  return { box, size };
}

function detectVisualClass(size: THREE.Vector3, forced?: ConvoySkinVisualClass): Exclude<ConvoySkinVisualClass, 'auto'> {
  if (forced && forced !== 'auto') return forced;

  const height = Math.max(size.y, 0.0001);
  const horizontal = Math.max(size.x, size.z, 0.0001);
  const maxAxis = Math.max(size.x, size.y, size.z, 0.0001);

  if (horizontal / height >= 1.25 || (height / maxAxis <= 0.55 && horizontal > height)) {
    return 'vehicle';
  }
  if (height >= horizontal * 0.9) {
    return 'character';
  }
  return 'prop';
}

function getTargetSize(asset: ConvoySkinAsset, visualClass: Exclude<ConvoySkinVisualClass, 'auto'>) {
  if (typeof asset.fitSize === 'number' && Number.isFinite(asset.fitSize) && asset.fitSize > 0) {
    return asset.fitSize;
  }
  if (visualClass === 'vehicle') return DEFAULT_VEHICLE_LENGTH;
  if (visualClass === 'character') return DEFAULT_CHARACTER_HEIGHT;
  return DEFAULT_PROP_SIZE;
}

function normalizeModelInstance(model: THREE.Object3D, asset: ConvoySkinAsset): THREE.Group {
  const wrapper = new THREE.Group();
  wrapper.name = 'convoy-asset-wrapper';

  prepareModelMaterials(model);

  const { size } = getBox(model);
  const visualClass = detectVisualClass(size, asset.visualClass);
  const targetSize = getTargetSize(asset, visualClass);

  const height = Math.max(size.y, 0.0001);
  const horizontal = Math.max(size.x, size.z, 0.0001);
  const maxAxis = Math.max(size.x, size.y, size.z, 0.0001);

  let baseScale = 1;
  if (visualClass === 'vehicle') {
    baseScale = targetSize / horizontal;
  } else if (visualClass === 'character') {
    baseScale = targetSize / height;
  } else {
    baseScale = targetSize / maxAxis;
  }

  const finalScale = baseScale * (Number.isFinite(Number(asset.scale)) ? Number(asset.scale) : 1);
  model.scale.multiplyScalar(finalScale);

  const after = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  const min = new THREE.Vector3();
  after.getCenter(center);
  after.getMin(min);

  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= min.y;
  model.position.y += Number.isFinite(Number(asset.liftY)) ? Number(asset.liftY) : 0.045;

  if (typeof asset.rotationY === 'number' && Number.isFinite(asset.rotationY)) {
    model.rotation.y += asset.rotationY;
  }

  wrapper.add(model);
  return wrapper;
}

function placeAsset(model: THREE.Object3D, asset: ConvoySkinAsset, index: number) {
  const slot = asset.position ?? { x: 0, y: 0, z: -index * 1.25 };
  model.position.x += Number(slot.x) || 0;
  model.position.y += Number(slot.y) || 0;
  model.position.z += Number(slot.z) || 0;
}

// ═════════════════════════════════════════════════════════════════════════════
// FALLBACK IMEDIATO E FALLBACK POR ASSET
// ═════════════════════════════════════════════════════════════════════════════

function createFallbackVehicle(index: number, asset?: ConvoySkinAsset) {
  const group = new THREE.Group();
  group.name = `convoy-fallback-${index}`;

  const vehicleLike = asset?.visualClass === 'vehicle' || index < 2;

  const bodyGeo = vehicleLike
    ? new THREE.BoxGeometry(1.55, 0.42, 0.82)
    : new THREE.BoxGeometry(0.58, 1.15, 0.36);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: vehicleLike ? 0x242424 : 0x3a2c24,
    roughness: 0.52,
    metalness: vehicleLike ? 0.18 : 0.04,
  });

  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  body.position.y = vehicleLike ? 0.32 : 0.6;
  group.add(body);

  let cabinGeo: THREE.BufferGeometry | null = null;
  let cabinMat: THREE.Material | null = null;

  if (vehicleLike) {
    cabinGeo = new THREE.BoxGeometry(0.72, 0.34, 0.62);
    cabinMat = new THREE.MeshStandardMaterial({ color: 0x3f3f3f, roughness: 0.58, metalness: 0.12 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    cabin.position.set(-0.1, 0.67, 0);
    group.add(cabin);
  }

  group.userData.disposeFallback = () => {
    bodyGeo.dispose();
    bodyMat.dispose();
    cabinGeo?.dispose();
    cabinMat?.dispose();
  };

  return normalizeModelInstance(group, {
    ...asset,
    visualClass: asset?.visualClass && asset.visualClass !== 'auto' ? asset.visualClass : (vehicleLike ? 'vehicle' : 'character'),
    fitSize: asset?.fitSize ?? (vehicleLike ? DEFAULT_VEHICLE_LENGTH : DEFAULT_CHARACTER_HEIGHT),
  });
}

function createImmediateFallbackConvoy(skin: ConvoySkinDefinition) {
  const convoy = new THREE.Group();
  convoy.name = `attack-convoy-placeholder:${skin.id}`;

  const assets = Array.isArray(skin.assets) && skin.assets.length > 0
    ? skin.assets
    : getConvoySkinById(DEFAULT_CONVOY_SKIN_ID).assets;

  assets.forEach((asset, index) => {
    const fallback = createFallbackVehicle(index, asset);
    placeAsset(fallback, asset, index);
    convoy.add(fallback);
  });

  return convoy;
}

function disposeFallbacks(root: THREE.Object3D) {
  root.traverse((obj: any) => {
    if (typeof obj?.userData?.disposeFallback === 'function') {
      obj.userData.disposeFallback();
    }
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// COMBOIO GLB
// ═════════════════════════════════════════════════════════════════════════════

function addConvoyLights(convoy: THREE.Group) {
  // Luz local controlada. Não exagerar para não lavar os modelos.
  const ambient = new THREE.AmbientLight(0xffffff, 0.38);
  convoy.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 1.05);
  key.position.set(4, 7, 3);
  key.castShadow = false;
  convoy.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.32);
  fill.position.set(-3, 4, -2);
  fill.castShadow = false;
  convoy.add(fill);
}

async function createConvoyAsset(asset: ConvoySkinAsset, index: number): Promise<THREE.Object3D> {
  const base = await loadModelBase(asset.url);
  const clone = cloneModel(base);
  return normalizeModelInstance(clone, asset);
}

async function createConvoyGroup(skin: ConvoySkinDefinition) {
  const convoy = new THREE.Group();
  convoy.name = `attack-convoy:${skin.id}`;

  addConvoyLights(convoy);

  const assets = Array.isArray(skin.assets) && skin.assets.length > 0
    ? skin.assets
    : getConvoySkinById(DEFAULT_CONVOY_SKIN_ID).assets;

  const results = await Promise.allSettled(
    assets.map((asset, index) => createConvoyAsset(asset, index))
  );

  results.forEach((result, index) => {
    const asset = assets[index];
    const model = result.status === 'fulfilled'
      ? result.value
      : createFallbackVehicle(index, asset);

    if (result.status === 'rejected') {
      console.error('[GANG_SQUAD_CONVOY_GLB_ERROR]', asset.url, result.reason);
    }

    placeAsset(model, asset, index);
    convoy.add(model);
  });

  return convoy;
}

// ═════════════════════════════════════════════════════════════════════════════
// LABEL DISCRETO
// ═════════════════════════════════════════════════════════════════════════════

function createMemberLabel(memberCount: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { sprite: null as THREE.Sprite | null, dispose: () => undefined };
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0,0,0,0.46)';
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(34, 28, 444, 72, 16);
    ctx.fill();
  } else {
    ctx.fillRect(34, 28, 444, 72);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 38px Oswald, Arial, sans-serif';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0,0,0,0.58)';
  ctx.fillStyle = '#ffffff';

  const text = `${Math.max(0, Math.floor(memberCount)).toLocaleString('pt-BR')} membros`;
  ctx.strokeText(text, 256, 64);
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.95,
    depthTest: true,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.name = 'attack-convoy-member-label';
  sprite.scale.set(2.2, 0.55, 1);
  sprite.position.set(0, LABEL_Y, 0);

  return {
    sprite,
    dispose: () => {
      texture.dispose();
      material.dispose();
    },
  };
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
  color: _color = '#ef4444',
  convoySkinId,
  onStep,
  onArrived,
  timePerTileMs,
  totalDurationMs,
}: GangSquadAnimationParams): MountedSquadAnimation {
  const safeRoute = Array.isArray(route) ? route : [];
  const routeDistanceTiles = Math.max(0, safeRoute.length - 1);

  const fallbackMsPerTile = getMsPerTile(barracoLevel);
  const suppliedTotalDurationMs = Number(totalDurationMs);
  const suppliedTimePerTileMs = Number(timePerTileMs);

  const effectiveTotalDurationMs =
    Number.isFinite(suppliedTotalDurationMs) && suppliedTotalDurationMs >= 0
      ? suppliedTotalDurationMs
      : routeDistanceTiles * (
          Number.isFinite(suppliedTimePerTileMs) && suppliedTimePerTileMs > 0
            ? suppliedTimePerTileMs
            : fallbackMsPerTile
        );

  const effectiveMsPerTile =
    routeDistanceTiles > 0
      ? Math.max(1, effectiveTotalDurationMs / routeDistanceTiles)
      : fallbackMsPerTile;

  void _color;

  const skin = getConvoySkinById(convoySkinId);

  const root = new THREE.Group();
  root.name = 'gang-squad-animation';
  scene.add(root);

  const label = createMemberLabel(memberCount);
  if (label.sprite) root.add(label.sprite);

  let activeConvoy: THREE.Group | null = null;
  let isCancelled = false;
  let isRunning = false;
  let isCleaned = false;
  let frameId = 0;

  function setRootPositionFromTile(tile: RouteTile) {
    const { worldX, worldZ } = tileToWorld(tile.tileX, tile.tileY, gridWidth, gridHeight, tileSize);
    root.position.set(worldX, GROUND_Y, worldZ);
  }

  if (safeRoute.length > 0) {
    setRootPositionFromTile(safeRoute[0]);
  }

  function updateRotation(fromWorld: { worldX: number; worldZ: number }, toWorld: { worldX: number; worldZ: number }) {
    const dx = toWorld.worldX - fromWorld.worldX;
    const dz = toWorld.worldZ - fromWorld.worldZ;

    if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
      // Ajuste fino por skin deve ser feito no rotationY do asset do catálogo.
      root.rotation.y = Math.atan2(dx, dz);
    }
  }

  function replaceConvoy(next: THREE.Group) {
    if (isCancelled || isCleaned) {
      disposeFallbacks(next);
      return;
    }

    if (activeConvoy) {
      disposeFallbacks(activeConvoy);
      activeConvoy.removeFromParent();
    }

    activeConvoy = next;
    root.add(activeConvoy);
  }

  function cleanup() {
    if (isCleaned) return;
    isCleaned = true;

    cancelAnimationFrame(frameId);

    if (activeConvoy) {
      disposeFallbacks(activeConvoy);
      activeConvoy.removeFromParent();
      activeConvoy = null;
    }

    label.dispose();
    root.removeFromParent();
  }

  function cancel() {
    isCancelled = true;
    cleanup();
  }

  async function start(): Promise<void> {
    console.log('[GANG_SQUAD_ANIMATION_START]', { routeDistanceTiles, skinId: skin.id, memberCount });
    if (isRunning || isCancelled || isCleaned) return;
    isRunning = true;

    // Fallback imediato: a marcha começa na hora, sem depender dos 6 GLBs remotos.
    const fallbackConvoy = createImmediateFallbackConvoy(skin);
    fallbackConvoy.visible = true;
    fallbackConvoy.matrixWorldNeedsUpdate = true;
    replaceConvoy(fallbackConvoy);

    // GLBs carregam em paralelo. Quando terminarem, substituem o fallback se a marcha ainda existir.
    void createConvoyGroup(skin)
      .then((loaded) => {
        loaded.visible = true;
        loaded.matrixWorldNeedsUpdate = true;
        replaceConvoy(loaded);
      })
      .catch((err) => {
        // Não quebra a marcha. Mantém fallback imediato.
        console.error('[GANG_SQUAD_CONVOY_LOAD_FATAL]', err);
      });

    if (routeDistanceTiles === 0) {
      onArrived?.();
      return;
    }

    return new Promise<void>((resolve) => {
      const startedAt = performance.now();
      let lastStep = -1;

      function tick(now: number) {
        if (isCancelled || isCleaned) {
          resolve();
          return;
        }

        const elapsed = now - startedAt;
        const capped = Math.min(elapsed, effectiveTotalDurationMs);
        const progressTiles = capped / effectiveMsPerTile;
        const segIdx = Math.min(routeDistanceTiles - 1, Math.floor(progressTiles));
        const segAlpha = clamp01(progressTiles - segIdx);

        const from = safeRoute[segIdx];
        const to = safeRoute[Math.min(safeRoute.length - 1, segIdx + 1)];

        const fw = tileToWorld(from.tileX, from.tileY, gridWidth, gridHeight, tileSize);
        const tw = tileToWorld(to.tileX, to.tileY, gridWidth, gridHeight, tileSize);

        const worldX = lerp(fw.worldX, tw.worldX, segAlpha);
        const worldZ = lerp(fw.worldZ, tw.worldZ, segAlpha);

        root.position.set(worldX, GROUND_Y, worldZ);
        updateRotation(fw, tw);

        if (label.sprite) {
          label.sprite.position.y = LABEL_Y + Math.sin(elapsed / 600) * 0.025;
        }

        if (segIdx !== lastStep) {
          lastStep = segIdx;
          onStep?.(segIdx, safeRoute[segIdx]);
        }

        if (capped >= effectiveTotalDurationMs) {
          const last = safeRoute[safeRoute.length - 1];
          setRootPositionFromTile(last);
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
