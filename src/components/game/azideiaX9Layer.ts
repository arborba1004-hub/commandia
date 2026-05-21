import * as THREE from 'three';
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import type { AzideiaX9Target } from '@/types/azideia';
import { getAzideiaX9Targets } from '@/api/azideiaApi';

export type MountedAzideiaX9Layer = {
  group: THREE.Group;
  start: () => Promise<void>;
  refresh: () => Promise<void>;
  removeTarget: (targetId: string) => void;
  tryHandleClick: (raycaster: THREE.Raycaster) => boolean;
  cleanup: () => void;
};

type MountParams = {
  scene: THREE.Scene;
  loader: GLTFLoader;
  gridWidth: number;
  gridHeight: number;
  tileSize?: number;
  onTargetClick: (target: AzideiaX9Target) => void;
};

function tileToWorld(tileX: number, tileY: number, gridWidth: number, gridHeight: number) {
  return {
    x: tileX - gridWidth / 2 + 0.5,
    z: tileY - gridHeight / 2 + 0.5,
  };
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child: any) => {
    child.geometry?.dispose?.();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        material.map?.dispose?.();
        material.dispose?.();
      }
    }
  });
}

function normalizeModel(model: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxHeight = 2.2;
  const fitLength = 1.6;
  const largestHorizontal = Math.max(size.x || 1, size.z || 1);
  const widthScale = fitLength / largestHorizontal;
  const heightScale = maxHeight / Math.max(0.001, size.y || 1);
  const scale = Math.min(widthScale, heightScale) * 1.05;
  model.scale.multiplyScalar(scale);

  const normalizedBox = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  normalizedBox.getCenter(center);
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= normalizedBox.min.y;

  model.traverse((child: any) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (!material) continue;
      if ('metalness' in material) material.metalness = 0;
      if ('roughness' in material) material.roughness = 0.82;
      if ('emissive' in material) material.emissive = new THREE.Color(0x180805);
      if ('emissiveIntensity' in material) material.emissiveIntensity = 0.1;
      if ('envMapIntensity' in material) material.envMapIntensity = 1.0;
      material.needsUpdate = true;
    }
  });
}

function createFallbackX9() {
  const group = new THREE.Group();
  group.name = 'azideia-x9-fallback';

  const material = new THREE.MeshStandardMaterial({
    color: '#7f1d1d',
    emissive: new THREE.Color(0x2a0505),
    emissiveIntensity: 0.25,
    roughness: 0.8,
    metalness: 0,
  });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.15, 6, 12), material);
  body.position.y = 0.95;
  body.castShadow = true;
  group.add(body);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.75, 1.05, 32),
    new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  group.add(ring);

  return group;
}

function createLabel(text: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 112;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.roundRect?.(0, 0, canvas.width, canvas.height, 24);
    if (ctx.roundRect) ctx.fill(); else ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 42px Oswald, Arial, sans-serif';
    ctx.fillStyle = '#fee2e2';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.8, 0.82, 1);
  sprite.position.set(0, 2.75, 0);
  return sprite;
}

async function createTargetObject(loader: GLTFLoader, target: AzideiaX9Target) {
  const root = new THREE.Group();
  root.name = `azideia-x9-${target.id}`;
  root.userData.azideiaTargetId = target.id;

  let model: THREE.Object3D | null = null;
  try {
    const gltf = await loader.loadAsync(target.modelUrl);
    model = gltf.scene;
    model.name = `azideia-x9-model-${target.id}`;
    normalizeModel(model);
  } catch (error) {
    console.warn('[azideiaX9Layer] Falha ao carregar GLB X9, usando fallback:', error);
    model = createFallbackX9();
  }

  model.traverse((child: any) => {
    child.userData.azideiaTargetId = target.id;
  });

  root.add(model);
  root.add(createLabel('X9'));

  return root;
}

export function mountAzideiaX9Layer({
  scene,
  loader,
  gridWidth,
  gridHeight,
  onTargetClick,
}: MountParams): MountedAzideiaX9Layer {
  const group = new THREE.Group();
  group.name = 'azideia-x9-layer';
  scene.add(group);

  const targetsById = new Map<string, AzideiaX9Target>();
  let disposed = false;
  let refreshToken = 0;

  function removeTarget(targetId: string) {
    targetsById.delete(String(targetId));
    const object = group.children.find((child) => child.userData?.azideiaTargetId === String(targetId));
    if (object) {
      group.remove(object);
      disposeObject(object);
    }
  }

  async function refresh() {
    const token = ++refreshToken;
    const response = await getAzideiaX9Targets();
    if (disposed || token !== refreshToken) return;

    const nextIds = new Set(response.targets.map((target) => target.id));
    for (const child of [...group.children]) {
      const id = String(child.userData?.azideiaTargetId || '');
      if (id && !nextIds.has(id)) {
        group.remove(child);
        disposeObject(child);
      }
    }

    for (const target of response.targets) {
      targetsById.set(target.id, target);
      const existing = group.children.find((child) => child.userData?.azideiaTargetId === target.id);
      const { x, z } = tileToWorld(target.tileX, target.tileY, gridWidth, gridHeight);
      if (existing) {
        existing.position.set(x, 0.06, z);
        continue;
      }
      const object = await createTargetObject(loader, target);
      if (disposed || token !== refreshToken) {
        disposeObject(object);
        return;
      }
      object.position.set(x, 0.06, z);
      group.add(object);
    }
  }

  function tryHandleClick(raycaster: THREE.Raycaster) {
    const hits = raycaster.intersectObjects(group.children, true);
    if (!hits.length) return false;

    let current: any = hits[0].object;
    while (current) {
      const id = current.userData?.azideiaTargetId;
      if (id) {
        const target = targetsById.get(String(id));
        if (target) onTargetClick(target);
        return true;
      }
      current = current.parent;
    }

    return false;
  }

  function cleanup() {
    disposed = true;
    for (const child of [...group.children]) {
      group.remove(child);
      disposeObject(child);
    }
    scene.remove(group);
  }

  return {
    group,
    start: refresh,
    refresh,
    removeTarget,
    tryHandleClick,
    cleanup,
  };
}
