/**
 * 3d/gangSquadAnimation.ts
 * Animação de deslocamento do squad no mapa.
 *
 * Responsabilidade única: animar um comboio Three.js ao longo de uma rota de tiles.
 * O visual do comboio vem de src/data/convoySkins.ts para permitir skins futuras.
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
  /** Cor hex do squad (atacante = '#ef4444', etc.) */
  color?: string;
};

export type GangSquadAnimationParams = {
  scene:         THREE.Scene;
  route:         RouteTile[];
  gridWidth:     number;
  gridHeight:    number;
  tileSize?:     number;
  /** nível do barraco determina velocidade de deslocamento */
  barracoLevel?: number;
  memberCount?:  number;
  color?:        string;
  onStep?:       (stepIndex: number, tile: RouteTile) => void;
  onArrived?:    () => void;
  timePerTileMs?: number;
  totalDurationMs?: number;
  /** Skin visual do comboio. Se vier ausente/inválida, usa comboio_padrao. */
  convoySkinId?: string | null;
};

export type MountedSquadAnimation = {
  group:              THREE.Group;
  routeDistanceTiles: number;
  totalDurationMs:    number;
  start:              () => Promise<void>;
  cancel:             () => void;
  cleanup:            () => void;
};

// ═════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═════════════════════════════════════════════════════════════════════════════

/** Tempo base por tile em ms. Dividido pelo nível do barraco. */
const BASE_MS_PER_TILE = 5000;
const CONVOY_HEIGHT    = 0.06;
const LABEL_HEIGHT     = 1.65;
const MODEL_BASE_SIZE  = 0.95;

// Cache por URL, não por skin. Skins futuras podem reaproveitar os mesmos GLBs.
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
    worldX: (tileX - gridWidth  / 2) * tileSize + tileSize / 2,
    worldZ: (tileY - gridHeight / 2) * tileSize + tileSize / 2,
  };
}

function getMsPerTile(barracoLevel: number): number {
  const safe = Math.max(1, Math.floor(barracoLevel));
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

// ═════════════════════════════════════════════════════════════════════════════
// MODELOS DO COMBOIO
// ═════════════════════════════════════════════════════════════════════════════

function applyModelShadows(root: THREE.Object3D) {
  root.traverse((obj: any) => {
    if (obj?.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      
      // Ajustar propriedades de material para melhor iluminação
      if (Array.isArray(obj.material)) {
        obj.material.forEach((mat: any) => {
          if ('metalness' in mat) mat.metalness = Math.min(mat.metalness ?? 0, 0.6);
          if ('roughness' in mat) mat.roughness = Math.max(mat.roughness ?? 0.7, 0.45);
          if ('envMapIntensity' in mat) mat.envMapIntensity = 1.2;
          mat.needsUpdate = true;
        });
      } else if (obj.material) {
        const mat: any = obj.material;
        if ('metalness' in mat) mat.metalness = Math.min(mat.metalness ?? 0, 0.6);
        if ('roughness' in mat) mat.roughness = Math.max(mat.roughness ?? 0.7, 0.45);
        if ('envMapIntensity' in mat) mat.envMapIntensity = 1.2;
        mat.needsUpdate = true;
      }
    }
  });
}

function normalizeModel(root: THREE.Object3D, desiredSize = MODEL_BASE_SIZE) {
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxAxis = Math.max(size.x || 1, size.y || 1, size.z || 1);
  const scale = desiredSize / maxAxis;
  root.scale.multiplyScalar(scale);

  root.updateMatrixWorld(true);

  const scaledBox = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  scaledBox.getCenter(center);

  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= scaledBox.min.y;

  return root;
}

function createFallbackVehicle(index: number) {
  const group = new THREE.Group();
  group.name = `convoy-fallback-${index}`;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.34, 1.15),
    new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.55, metalness: 0.15 })
  );
  body.castShadow = true;
  body.receiveShadow = true;
  body.position.y = 0.25;
  group.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.28, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.45, metalness: 0.2 })
  );
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  cabin.position.set(0, 0.55, -0.08);
  group.add(cabin);

  return group;
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
      const scene = gltf.scene || gltf.scenes?.[0];

      if (!scene) {
        const fallback = createFallbackVehicle(index);
        convoyModelCache.set(url, fallback);
        return fallback;
      }

      const base = scene.clone(true);
      applyModelShadows(base);
      normalizeModel(base, MODEL_BASE_SIZE);
      convoyModelCache.set(url, base);
      return base;
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
  applyModelShadows(clone);
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

      model.position.set(slot.x, slot.y, slot.z);

      if (Number.isFinite(asset.scale)) {
        model.scale.multiplyScalar(Number(asset.scale));
      }

      if (Number.isFinite(asset.rotationY)) {
        model.rotation.y += Number(asset.rotationY);
      }

      group.add(model);
    })
  );

  if (group.children.length === 0) {
    group.add(createFallbackVehicle(0));
  }

  // Adicionar luzes auxiliares locais presas ao comboio
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  group.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(4, 8, 3);
  keyLight.castShadow = false;
  group.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
  fillLight.position.set(-4, 5, -3);
  fillLight.castShadow = false;
  group.add(fillLight);

  return group;
}

// ═════════════════════════════════════════════════════════════════════════════
// LABEL E EFEITOS VISUAIS DO COMBOIO
// ═════════════════════════════════════════════════════════════════════════════

function buildConvoyLabel(options: SquadMarkerOptions): {
  group: THREE.Group;
  animatePulse: (elapsedMs: number) => void;
  dispose: () => void;
} {
  const color = new THREE.Color(options.color ?? '#ef4444');
  const group = new THREE.Group();
  const toDisposeGeo: THREE.BufferGeometry[] = [];
  const toDisposeMat: THREE.Material[] = [];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0,0,0,0.68)';
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(0, 0, 512, 128, 18);
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, 512, 128);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 46px Oswald, Arial';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${options.memberCount.toLocaleString('pt-BR')} membros`, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(4.8, 1.2, 1);
  sprite.position.set(0, LABEL_HEIGHT, 0);
  group.add(sprite);

  function animatePulse(elapsedMs: number) {
    const t = elapsedMs / 1000;
    halo.scale.setScalar(1 + Math.sin(t * 4.8) * 0.045);
    haloMat.opacity = 0.23 + (Math.sin(t * 4.2) + 1) * 0.055;
    sprite.position.y = LABEL_HEIGHT + Math.sin(t * 3.4) * 0.035;
  }

  function dispose() {
    toDisposeGeo.forEach((g) => g.dispose());
    toDisposeMat.forEach((m) => m.dispose());
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
  tileSize     = 1,
  barracoLevel = 1,
  memberCount  = 100,
  color        = '#ef4444',
  onStep,
  onArrived,
  timePerTileMs,
  totalDurationMs,
  convoySkinId,
}: GangSquadAnimationParams): MountedSquadAnimation {
  const routeDistanceTiles = Math.max(0, route.length - 1);

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

  // Root group na cena
  const root = new THREE.Group();
  root.name = 'gang-squad-animation';

  // Trilha
  const trailPoints = route.map((step) => {
    const { worldX, worldZ } = tileToWorld(step.tileX, step.tileY, gridWidth, gridHeight, tileSize);
    return new THREE.Vector3(worldX, CONVOY_HEIGHT + 0.02, worldZ);
  });
  const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPoints);
  const trailMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 });
  const trailLine = new THREE.Line(trailGeo, trailMat);
  root.add(trailLine);

  const label = buildConvoyLabel({ memberCount, color });
  root.add(label.group);

  let convoyGroup: THREE.Group | null = null;
  let isCancelled = false;
  let isRunning = false;
  let frameId = 0;
  let didCleanup = false;
  let currentRotationY = 0;

  scene.add(root);

  // Posição inicial antes dos GLBs terminarem de carregar.
  if (route.length > 0) {
    const { worldX, worldZ } = tileToWorld(route[0].tileX, route[0].tileY, gridWidth, gridHeight, tileSize);
    root.position.set(worldX, CONVOY_HEIGHT, worldZ);
  }

  function setRootRotationTowards(from: RouteTile, to: RouteTile, instant = false) {
    const fw = tileToWorld(from.tileX, from.tileY, gridWidth, gridHeight, tileSize);
    const tw = tileToWorld(to.tileX, to.tileY, gridWidth, gridHeight, tileSize);
    const dx = tw.worldX - fw.worldX;
    const dz = tw.worldZ - fw.worldZ;

    if (Math.abs(dx) < 0.0001 && Math.abs(dz) < 0.0001) return;

    // A formação do comboio foi montada apontando para +Z.
    const targetRotationY = Math.atan2(dx, dz);
    currentRotationY = instant ? targetRotationY : lerpAngle(currentRotationY, targetRotationY, 0.22);
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
  }

  function cancel() {
    isCancelled = true;
    cleanup();
  }

  async function start(): Promise<void> {
    if (isRunning || isCancelled) return;
    isRunning = true;

    if (routeDistanceTiles === 0) {
      onArrived?.();
      return;
    }

    const loadedConvoy = await createConvoyVehiclesGroup(convoySkin);
    if (isCancelled || didCleanup) {
      return;
    }

    convoyGroup = loadedConvoy;
    root.add(convoyGroup);

    if (route.length > 1) {
      setRootRotationTowards(route[0], route[1], true);
    }

    return new Promise<void>((resolve) => {
      const startedAt = performance.now();
      let lastStep = -1;

      function tick(now: number) {
        if (isCancelled) { resolve(); return; }

        const elapsed = now - startedAt;
        const capped = Math.min(elapsed, effectiveTotalDurationMs);
        const progressTiles = capped / effectiveMsPerTile;
        const segIdx = Math.min(routeDistanceTiles - 1, Math.floor(progressTiles));
        const segAlpha = Math.min(1, Math.max(0, progressTiles - segIdx));

        const from = route[segIdx];
        const to = route[Math.min(route.length - 1, segIdx + 1)];

        const fw = tileToWorld(from.tileX, from.tileY, gridWidth, gridHeight, tileSize);
        const tw = tileToWorld(to.tileX, to.tileY, gridWidth, gridHeight, tileSize);

        root.position.set(
          lerp(fw.worldX, tw.worldX, segAlpha),
          CONVOY_HEIGHT,
          lerp(fw.worldZ, tw.worldZ, segAlpha),
        );

        setRootRotationTowards(from, to);
        label.animatePulse(elapsed);

        // Notifica mudança de tile
        if (segIdx !== lastStep) {
          lastStep = segIdx;
          onStep?.(segIdx, route[segIdx]);
        }

        if (capped >= effectiveTotalDurationMs) {
          const last = route[route.length - 1];
          const prev = route[Math.max(0, route.length - 2)];
          const lw = tileToWorld(last.tileX, last.tileY, gridWidth, gridHeight, tileSize);
          root.position.set(lw.worldX, CONVOY_HEIGHT, lw.worldZ);
          setRootRotationTowards(prev, last, false);
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
