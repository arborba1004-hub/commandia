/**
 * 3d/gangSquadAnimation.ts
 * Animação de deslocamento do comboio de ataque no mapa.
 *
 * Responsabilidade única: renderizar e animar um comboio 3D ao longo de uma rota de tiles.
 * Não calcula batalha, não altera estado de jogador e não chama backend.
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
  /** Nível do barraco determina velocidade local quando o backend não envia duração. */
  barracoLevel?: number;
  memberCount?: number;
  color?: string;
  /** Skin visual do comboio. Se não vier ou for inválida, usa comboio_padrao. */
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
// CONFIGURAÇÃO
// ═════════════════════════════════════════════════════════════════════════════

const BASE_MS_PER_TILE = 5000;
const GROUND_Y = 0.08;
const LABEL_Y = 2.25;
const DEFAULT_CHARACTER_HEIGHT = 1.55;
const DEFAULT_VEHICLE_LENGTH = 2.15;
const DEFAULT_PROP_SIZE = 1.45;

// Modelos GLB ficam no cache por URL. Nunca adicionar o objeto do cache direto na cena.
const convoyModelCache = new Map<string, THREE.Object3D>();
const convoyModelPromises = new Map<string, Promise<THREE.Object3D>>();

let sharedGLTFLoader: GLTFLoader | null = null;
let sharedDRACOLoader: DRACOLoader | null = null;

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

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
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

  const existingPromise = convoyModelPromises.get(url);
  if (existingPromise) return existingPromise;

  const promise = getSharedGLTFLoader()
    .loadAsync(url)
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

function materialProbablyUsesAlpha(mat: any) {
  return Boolean(mat?.alphaMap || mat?.transparent || (typeof mat?.opacity === 'number' && mat.opacity < 1));
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

      // Mantém a textura/material original do GLB, mas elimina aparência de overlay semitransparente.
      // Para modelos recortados por PNG, alphaTest mantém o recorte sem deixar o objeto lavado.
      const usesAlpha = materialProbablyUsesAlpha(mat);
      mat.transparent = false;
      mat.opacity = 1;
      mat.alphaTest = usesAlpha ? Math.max(Number(mat.alphaTest || 0), 0.32) : 0;
      mat.depthWrite = true;
      mat.depthTest = true;

      if ('envMapIntensity' in mat) mat.envMapIntensity = Math.min(Number(mat.envMapIntensity ?? 1), 1);
      if ('emissiveIntensity' in mat) mat.emissiveIntensity = Math.min(Number(mat.emissiveIntensity ?? 0), 0.2);
      if ('toneMapped' in mat) mat.toneMapped = true;

      mat.needsUpdate = true;
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// TAMANHO PROPORCIONAL / NORMALIZAÇÃO
// ═════════════════════════════════════════════════════════════════════════════

function getBoxSize(root: THREE.Object3D) {
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

  // Veículos e cards horizontais costumam ser bem mais largos/compridos do que altos.
  if (horizontal / height >= 1.25 || (height / maxAxis <= 0.55 && horizontal > height)) {
    return 'vehicle';
  }

  // Personagens/capangas normalmente têm altura dominante.
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

  const { size } = getBoxSize(model);
  const visualClass = detectVisualClass(size, asset.visualClass);
  const targetSize = getTargetSize(asset, visualClass);

  const height = Math.max(size.y, 0.0001);
  const horizontal = Math.max(size.x, size.z, 0.0001);
  const maxAxis = Math.max(size.x, size.y, size.z, 0.0001);

  let baseScale = 1;
  if (visualClass === 'vehicle') {
    // Carros estavam pequenos quando normalizados igual a personagem.
    // Para veículo, o tamanho visual é controlado pelo comprimento/largura horizontal.
    baseScale = targetSize / horizontal;
  } else if (visualClass === 'character') {
    baseScale = targetSize / height;
  } else {
    baseScale = targetSize / maxAxis;
  }

  const finalScale = baseScale * (Number.isFinite(Number(asset.scale)) ? Number(asset.scale) : 1);
  model.scale.multiplyScalar(finalScale);

  // Depois da escala, centraliza no X/Z e encosta a base no chão sem afundar.
  const boxAfterScale = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  const min = new THREE.Vector3();
  boxAfterScale.getCenter(center);
  boxAfterScale.getMin(min);

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

// ═════════════════════════════════════════════════════════════════════════════
// FALLBACK SÓLIDO SE ALGUM GLB FALHAR
// ═════════════════════════════════════════════════════════════════════════════

function createFallbackVehicle(index: number) {
  const group = new THREE.Group();
  group.name = `convoy-fallback-${index}`;

  const bodyGeo = new THREE.BoxGeometry(1.5, 0.42, 0.82);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.48,
    metalness: 0.25,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  body.position.y = 0.3;
  group.add(body);

  const cabinGeo = new THREE.BoxGeometry(0.72, 0.38, 0.68);
  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.55,
    metalness: 0.18,
  });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  cabin.position.set(-0.1, 0.68, 0);
  group.add(cabin);

  group.userData.disposeFallback = () => {
    bodyGeo.dispose();
    bodyMat.dispose();
    cabinGeo.dispose();
    cabinMat.dispose();
  };

  return group;
}

// ═════════════════════════════════════════════════════════════════════════════
// COMBOIO 3D
// ═════════════════════════════════════════════════════════════════════════════

function addConvoyLights(convoy: THREE.Group) {
  // Luz controlada: suficiente para ver os GLBs, sem lavar textura/contraste.
  const ambient = new THREE.AmbientLight(0xffffff, 0.42);
  convoy.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(4, 7, 3);
  key.castShadow = false;
  convoy.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.38);
  fill.position.set(-3, 4, -2);
  fill.castShadow = false;
  convoy.add(fill);
}

async function createConvoyAsset(asset: ConvoySkinAsset, index: number): Promise<THREE.Object3D> {
  try {
    const base = await loadModelBase(asset.url);
    const clone = cloneModel(base);
    return normalizeModelInstance(clone, asset);
  } catch (err) {
    console.error('[GANG_SQUAD_CONVOY_GLB_ERROR]', asset.url, err);
    const fallback = createFallbackVehicle(index);
    return normalizeModelInstance(fallback, {
      ...asset,
      visualClass: 'vehicle',
      fitSize: asset.fitSize ?? DEFAULT_VEHICLE_LENGTH,
    });
  }
}

async function createConvoyGroup(skin: ConvoySkinDefinition) {
  const convoy = new THREE.Group();
  convoy.name = `attack-convoy:${skin.id}`;

  addConvoyLights(convoy);

  const assets = Array.isArray(skin.assets) && skin.assets.length > 0
    ? skin.assets
    : getConvoySkinById(DEFAULT_CONVOY_SKIN_ID).assets;

  const models = await Promise.all(assets.map((asset, index) => createConvoyAsset(asset, index)));

  models.forEach((model, index) => {
    const asset = assets[index];
    const slot = asset.position ?? { x: 0, y: 0, z: -index * 1.25 };
    model.position.x += Number(slot.x) || 0;
    model.position.y += Number(slot.y) || 0;
    model.position.z += Number(slot.z) || 0;
    convoy.add(model);
  });

  return convoy;
}

// ═════════════════════════════════════════════════════════════════════════════
// LABEL DISCRETO DE QUANTIDADE
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
  ctx.fillStyle = 'rgba(0,0,0,0.58)';
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(16, 18, 480, 92, 18);
    ctx.fill();
  } else {
    ctx.fillRect(16, 18, 480, 92);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 44px Oswald, Arial, sans-serif';
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
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
    opacity: 1,
    depthTest: true,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.name = 'attack-convoy-member-label';
  sprite.scale.set(2.9, 0.72, 1);
  sprite.position.set(0, LABEL_Y, 0);

  return {
    sprite,
    dispose: () => {
      texture.dispose();
      material.dispose();
    },
  };
}

function disposeFallbacks(root: THREE.Object3D) {
  root.traverse((obj: any) => {
    if (typeof obj?.userData?.disposeFallback === 'function') {
      obj.userData.disposeFallback();
    }
  });
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

  let convoyGroup: THREE.Group | null = null;
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
      // O offset deixa a frente dos modelos mais coerente na maioria dos GLBs de veículo/personagem.
      // Se algum pacote futuro vier virado, ajuste rotationY do asset no catálogo.
      root.rotation.y = Math.atan2(dx, dz);
    }
  }

  function cleanup() {
    if (isCleaned) return;
    isCleaned = true;

    cancelAnimationFrame(frameId);

    if (convoyGroup) {
      disposeFallbacks(convoyGroup);
      convoyGroup.removeFromParent();
      convoyGroup = null;
    }

    label.dispose();
    root.removeFromParent();
  }

  function cancel() {
    isCancelled = true;
    cleanup();
  }

  async function start(): Promise<void> {
    if (isRunning || isCancelled || isCleaned) return;
    isRunning = true;

    if (routeDistanceTiles === 0) {
      onArrived?.();
      return;
    }

    const loadedConvoy = await createConvoyGroup(skin);
    if (isCancelled || isCleaned) {
      disposeFallbacks(loadedConvoy);
      return;
    }

    convoyGroup = loadedConvoy;
    root.add(convoyGroup);

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
          label.sprite.position.y = LABEL_Y + Math.sin(elapsed / 550) * 0.035;
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
