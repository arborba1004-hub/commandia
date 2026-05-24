import * as THREE from 'three';
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import type { AzideiaX9Target } from '@/types/azideia';
import { getAzideiaX9Targets } from '@/api/azideiaApi';

export type MountedAzideiaX9Layer = {
  group: THREE.Group;
  start: () => Promise<void>;
  refresh: () => Promise<void>;
  removeTarget: (targetId: string) => void;
  playDeathAndRemove: (targetId: string, durationMs?: number) => Promise<void>;
  tryHandleClick: (raycaster: THREE.Raycaster) => boolean;
  tryHandlePointer: (clientX: number, clientY: number, camera: THREE.Camera, domElement: HTMLElement, raycaster?: THREE.Raycaster) => boolean;
  cleanup: () => void;
};

// Touch em celular precisa ser muito mais generoso do que clique de mouse.
// O GLB do X9 é pequeno e pode ficar parcialmente atrás de barraco/prédio,
// então usamos uma hitbox 3D invisível maior + fallback por distância em tela.
const X9_TOUCH_RADIUS_WORLD = 2.45;
const X9_TOUCH_RADIUS_SCREEN_PX = 104;
const X9_CLICK_DEBOUNCE_MS = 280;

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


function createTouchHitbox(targetId: string) {
  const geometry = new THREE.SphereGeometry(X9_TOUCH_RADIUS_WORLD, 16, 12);
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
  });
  const hitbox = new THREE.Mesh(geometry, material);
  hitbox.name = `azideia-x9-touch-hitbox-${targetId}`;
  hitbox.position.set(0, 1.2, 0);
  hitbox.userData.azideiaTargetId = targetId;
  hitbox.userData.azideiaTouchHitbox = true;
  hitbox.renderOrder = 999;
  return hitbox;
}

function findTargetRootFromHit(object: THREE.Object3D | null): { id: string; dying: boolean } | null {
  let current: any = object;
  while (current) {
    const id = current.userData?.azideiaTargetId;
    if (id) {
      return {
        id: String(id),
        dying: Boolean(current.userData?.azideiaDying),
      };
    }
    current = current.parent;
  }
  return null;
}

function getPointerNdc(clientX: number, clientY: number, domElement: HTMLElement) {
  const rect = domElement.getBoundingClientRect();
  return new THREE.Vector2(
    ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1,
    -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1
  );
}

function getScreenDistancePx(
  object: THREE.Object3D,
  clientX: number,
  clientY: number,
  camera: THREE.Camera,
  domElement: HTMLElement
) {
  const rect = domElement.getBoundingClientRect();
  const world = new THREE.Vector3();
  object.getWorldPosition(world);
  world.y += 1.25;
  const projected = world.project(camera);
  if (projected.z < -1 || projected.z > 1) return Number.POSITIVE_INFINITY;
  const screenX = rect.left + ((projected.x + 1) / 2) * rect.width;
  const screenY = rect.top + ((-projected.y + 1) / 2) * rect.height;
  return Math.hypot(screenX - clientX, screenY - clientY);
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
  root.add(createTouchHitbox(target.id));
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
  let lastHandledTargetId = '';
  let lastHandledAt = 0;

  function removeTarget(targetId: string) {
    targetsById.delete(String(targetId));
    const object = group.children.find((child) => child.userData?.azideiaTargetId === String(targetId));
    if (object) {
      group.remove(object);
      disposeObject(object);
    }
  }

  async function playDeathAndRemove(targetId: string, durationMs = 140) {
    const id = String(targetId);
    targetsById.delete(id);
    const object = group.children.find((child) => child.userData?.azideiaTargetId === id);
    if (!object) return;

    object.userData.azideiaDying = true;

    // Morte seca/profissional: sem explosão, sem fade, sem impacto longo.
    // O X9 só tomba e é removido. Quem chama pode iniciar o retorno do comboio
    // imediatamente, sem aguardar essa microanimação terminar.
    if (durationMs <= 0) {
      object.rotation.x += Math.PI / 2;
      object.rotation.z += Math.PI / 10;
      object.position.y = 0.03;
      removeTarget(id);
      return;
    }

    const start = performance.now();
    const initialRotationX = object.rotation.x;
    const initialRotationZ = object.rotation.z;
    const initialY = object.position.y;
    const targetRotationX = initialRotationX + Math.PI / 2;
    const targetRotationZ = initialRotationZ + Math.PI / 10;

    await new Promise<void>((resolve) => {
      function animate(now: number) {
        if (disposed || !group.children.includes(object)) {
          resolve();
          return;
        }

        const progress = Math.max(0, Math.min(1, (now - start) / Math.max(1, durationMs)));
        const eased = 1 - Math.pow(1 - progress, 3);

        object.rotation.x = initialRotationX + (targetRotationX - initialRotationX) * eased;
        object.rotation.z = initialRotationZ + (targetRotationZ - initialRotationZ) * eased;
        object.position.y = Math.max(0.03, initialY * (1 - eased));

        if (progress >= 1) {
          removeTarget(id);
          resolve();
          return;
        }

        requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    });
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

  function handleTargetById(targetId: string, dying = false) {
    const id = String(targetId);
    const target = targetsById.get(id);
    if (dying || target?.reserved) return true;
    if (!target) return false;

    const now = performance.now();
    if (lastHandledTargetId === id && now - lastHandledAt < X9_CLICK_DEBOUNCE_MS) {
      return true;
    }

    lastHandledTargetId = id;
    lastHandledAt = now;
    onTargetClick(target);
    return true;
  }

  function tryHandleClick(raycaster: THREE.Raycaster) {
    const previousThreshold = raycaster.params.Points?.threshold;
    if (raycaster.params.Points) raycaster.params.Points.threshold = 1.4;

    // Prioriza hitboxes invisíveis do X9. Sem isso, em alguns ângulos o raycast
    // pega label/modelo/prédio antes do alvo e o toque parece “não selecionar”.
    const hitboxes: THREE.Object3D[] = [];
    for (const object of group.children) {
      object.traverse((child: any) => {
        if (child?.userData?.azideiaTouchHitbox) hitboxes.push(child);
      });
    }

    const hitboxHits = raycaster.intersectObjects(hitboxes, true);
    if (hitboxHits.length) {
      const resolved = findTargetRootFromHit(hitboxHits[0].object);
      if (raycaster.params.Points && typeof previousThreshold === 'number') {
        raycaster.params.Points.threshold = previousThreshold;
      }
      if (resolved) return handleTargetById(resolved.id, resolved.dying);
    }

    const hits = raycaster.intersectObjects(group.children, true);
    if (raycaster.params.Points && typeof previousThreshold === 'number') {
      raycaster.params.Points.threshold = previousThreshold;
    }
    if (!hits.length) return false;

    const resolved = findTargetRootFromHit(hits[0].object);
    if (!resolved) return false;
    return handleTargetById(resolved.id, resolved.dying);
  }

  function tryHandlePointer(
    clientX: number,
    clientY: number,
    camera: THREE.Camera,
    domElement: HTMLElement,
    raycaster = new THREE.Raycaster()
  ) {
    const mouse = getPointerNdc(clientX, clientY, domElement);
    raycaster.setFromCamera(mouse, camera);

    if (tryHandleClick(raycaster)) return true;

    let nearest: { id: string; distance: number; dying: boolean } | null = null;
    for (const object of group.children) {
      const id = String(object.userData?.azideiaTargetId || '');
      if (!id) continue;
      const distance = getScreenDistancePx(object, clientX, clientY, camera, domElement);
      if (!nearest || distance < nearest.distance) {
        nearest = { id, distance, dying: Boolean(object.userData?.azideiaDying) };
      }
    }

    if (nearest && nearest.distance <= X9_TOUCH_RADIUS_SCREEN_PX) {
      return handleTargetById(nearest.id, nearest.dying);
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
    playDeathAndRemove,
    tryHandleClick,
    tryHandlePointer,
    cleanup,
  };
}
