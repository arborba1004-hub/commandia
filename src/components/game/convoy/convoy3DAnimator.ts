import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { tileToWorldCenter } from '@/components/game/playerMapSpace';
import type { ConvoySkin } from '@/types/convoy';

export type ConvoyRouteTile = { tileX: number; tileY: number };

export type MountAttackConvoy3DParams = {
  scene: THREE.Scene;
  route: ConvoyRouteTile[];
  gridWidth: number;
  gridHeight: number;
  skin: ConvoySkin;
  durationMs: number;
  memberCount?: number;
  label?: string;
  height?: number;
  /** Progresso inicial de 0 a 1 para animar eventos recebidos atrasados via socket. */
  initialProgress?: number;
};

export type MountedAttackConvoy3D = {
  group: THREE.Group;
  start: () => Promise<void>;
  cancel: () => void;
  cleanup: () => void;
};

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

function routeToWorldPoints(route: ConvoyRouteTile[], gridWidth: number, gridHeight: number, height: number) {
  return route.map((step) => {
    const { worldX, worldZ } = tileToWorldCenter(step.tileX, step.tileY, gridWidth, gridHeight);
    return new THREE.Vector3(worldX, height, worldZ);
  });
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child: any) => {
    if (child.geometry) child.geometry.dispose?.();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m: any) => {
          m.map?.dispose?.();
          m.dispose?.();
        });
      } else {
        child.material.map?.dispose?.();
        child.material.dispose?.();
      }
    }
  });
}

function createCanvasLabel(text: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.roundRect?.(0, 0, canvas.width, canvas.height, 28);
    if (!ctx.roundRect) ctx.fillRect(0, 0, canvas.width, canvas.height);
    else ctx.fill();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 42px Oswald, Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4.5, 1.1, 1);
  sprite.position.set(0, 1.45, 0);
  return sprite;
}

function createProceduralVehicle(skin: ConvoySkin) {
  const group = new THREE.Group();
  group.name = `procedural-${skin.id}`;

  const color = new THREE.Color(skin.accentColor);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color,
    emissive: color.clone().multiplyScalar(0.18),
    emissiveIntensity: 0.5,
    roughness: 0.42,
    metalness: 0.25,
  });

  const darkMaterial = new THREE.MeshStandardMaterial({
    color: '#101010',
    roughness: 0.6,
    metalness: 0.2,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 2.25), bodyMaterial);
  body.position.y = 0.35;
  body.castShadow = true;
  group.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.55, 0.8), bodyMaterial.clone());
  cabin.position.set(0, 0.85, 0.45);
  cabin.castShadow = true;
  group.add(cabin);

  const wheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.22, 18);
  const wheelPositions = [
    [-0.95, 0.16, -0.75],
    [0.95, 0.16, -0.75],
    [-0.95, 0.16, 0.75],
    [0.95, 0.16, 0.75],
  ];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, darkMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    group.add(wheel);
  }

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(1.35, 1.75, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.05;
  halo.name = 'convoy-halo';
  group.add(halo);

  return group;
}

function normalizeModelToFit(
  model: THREE.Object3D,
  fitTileLength: number,
  extraScale: number,
  maxModelHeight = 1.5,
  groundOffsetY = 0,
) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const safeWidth = Math.max(0.2, fitTileLength || 1);
  const safeHeight = Math.max(0.25, maxModelHeight || 1.5);
  const largestHorizontal = Math.max(size.x || 1, size.z || 1);
  const rawScale = (safeWidth / largestHorizontal) * Math.max(0.05, extraScale || 1);
  const heightAfterRawScale = (size.y || 1) * rawScale;
  const safeScale = heightAfterRawScale > safeHeight
    ? (safeHeight / Math.max(0.001, size.y || 1))
    : rawScale;

  model.scale.multiplyScalar(safeScale);

  const normalizedBox = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  normalizedBox.getCenter(center);
  const minY = normalizedBox.min.y;
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= minY + groundOffsetY;
}

async function tryLoadGLB(skin: ConvoySkin): Promise<THREE.Object3D | null> {
  if (!skin.modelUrl) return null;

  try {
    const gltf = await gltfLoader.loadAsync(skin.modelUrl);
    const model = gltf.scene;
    model.name = `convoy-model-${skin.id}`;
    normalizeModelToFit(model, skin.fitTileLength, skin.modelScale, skin.maxModelHeight ?? 1.5, skin.groundOffsetY ?? 0);
    const visualScaleMultiplier = Math.max(0.1, Number(skin.visualScaleMultiplier) || 1);
    model.scale.multiplyScalar(visualScaleMultiplier);
    const materialBoost = Math.max(1, Number(skin.materialBoost) || 1);
    model.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Mesmo tratamento visual usado nos prédios/CTs do mapa.
        const materials = Array.isArray(child.material) ? child.material : [child.material];

        for (const material of materials) {
          if (!material) continue;

          if ('metalness' in material) material.metalness = 0;
          if ('roughness' in material) material.roughness = 0.8;

          if ('emissive' in material) {
            material.emissive = new THREE.Color(0x3a220f);
          }

          if ('emissiveIntensity' in material) {
            material.emissiveIntensity = 0.32;
          }

          if ('envMapIntensity' in material) {
            material.envMapIntensity = 1.8;
          }

          material.needsUpdate = true;
        }
      }
    });
    return model;
  } catch (err) {
    console.warn('[convoy3DAnimator] Falha ao carregar GLB do comboio:', skin.id, err);
    return null;
  }
}

function setDirection(vehicleRoot: THREE.Group, from: THREE.Vector3, to: THREE.Vector3) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  if (Math.abs(dx) < 0.0001 && Math.abs(dz) < 0.0001) return;
  vehicleRoot.rotation.y = Math.atan2(dx, dz);
}

export function mountAttackConvoy3D({
  scene,
  route,
  gridWidth,
  gridHeight,
  skin,
  durationMs,
  memberCount = 0,
  label,
  height = 0,
  initialProgress = 0,
}: MountAttackConvoy3DParams): MountedAttackConvoy3D {
  const safeRoute = Array.isArray(route) ? route.filter((p) => Number.isFinite(p.tileX) && Number.isFinite(p.tileY)) : [];
  const points = routeToWorldPoints(safeRoute, gridWidth, gridHeight, height);

  const root = new THREE.Group();
  root.name = `attack-convoy-${skin.id}`;

  const color = new THREE.Color(skin.accentColor);
  const lineMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.48 });
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(lineGeometry, lineMaterial);
  line.name = 'attack-convoy-route-line';
  root.add(line);

  const vehicleRoot = new THREE.Group();
  vehicleRoot.name = 'attack-convoy-vehicle-root';
  vehicleRoot.add(createProceduralVehicle(skin));
  root.add(vehicleRoot);

  // Luz local do comboio, equivalente à luz forte usada no mapa/CT.
  const convoyAmbient = new THREE.AmbientLight(0xffffff, 1.8);
  vehicleRoot.add(convoyAmbient);

  const convoyKeyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  convoyKeyLight.position.set(8, 20, 10);
  vehicleRoot.add(convoyKeyLight);

  const convoyFillLight = new THREE.DirectionalLight(0xffe0b0, 2);
  convoyFillLight.position.set(-15, 10, -10);
  vehicleRoot.add(convoyFillLight);

  const text = label || `${skin.name}${memberCount > 0 ? ` • ${memberCount.toLocaleString('pt-BR')}` : ''}`;
  const labelSprite = createCanvasLabel(text);
  vehicleRoot.add(labelSprite);

  if (points[0]) vehicleRoot.position.copy(points[0]);
  if (points[0] && points[1]) setDirection(vehicleRoot, points[0], points[1]);

  scene.add(root);

  let cancelled = false;
  let cleaned = false;
  let frameId = 0;

  // Carrega GLB sem travar a animação. Se falhar, mantém o veículo procedural.
  void tryLoadGLB(skin).then((model) => {
    if (!model || cancelled || cleaned) return;
    const old = vehicleRoot.children.find((child) => child.name.startsWith('procedural-'));
    if (old) {
      vehicleRoot.remove(old);
      disposeObject(old);
    }
    vehicleRoot.add(model);
  });

  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    if (frameId) cancelAnimationFrame(frameId);
    scene.remove(root);
    lineGeometry.dispose();
    lineMaterial.dispose();
    disposeObject(root);
  }

  function cancel() {
    cancelled = true;
    cleanup();
  }

  async function start() {
    if (points.length <= 1 || durationMs <= 0) {
      if (points[points.length - 1]) vehicleRoot.position.copy(points[points.length - 1]);
      return;
    }

    const totalDurationMs = Math.max(1, durationMs);
    const segmentCount = points.length - 1;
    const safeInitialProgress = Math.max(0, Math.min(0.999, Number(initialProgress) || 0));

    await new Promise<void>((resolve) => {
      const startedAt = performance.now() - totalDurationMs * safeInitialProgress;

      function animate(now: number) {
        if (cancelled) {
          resolve();
          return;
        }

        const elapsed = Math.min(totalDurationMs, now - startedAt);
        const progress = elapsed / totalDurationMs;
        const routeProgress = progress * segmentCount;
        const index = Math.min(segmentCount - 1, Math.floor(routeProgress));
        const alpha = Math.max(0, Math.min(1, routeProgress - index));
        const from = points[index];
        const to = points[index + 1];

        vehicleRoot.position.lerpVectors(from, to, alpha);
        setDirection(vehicleRoot, from, to);

        const pulse = 1 + Math.sin(elapsed / 120) * 0.025;
        vehicleRoot.scale.setScalar(pulse);
        labelSprite.position.y = 1.45 + Math.sin(elapsed / 180) * 0.05;

        const halo = vehicleRoot.getObjectByName('convoy-halo') as THREE.Mesh | undefined;
        if (halo) {
          halo.scale.setScalar(1 + Math.sin(elapsed / 160) * 0.05);
          const mat = halo.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.22 + (Math.sin(elapsed / 170) + 1) * 0.08;
        }

        if (elapsed >= totalDurationMs) {
          vehicleRoot.position.copy(points[points.length - 1]);
          resolve();
          return;
        }

        frameId = requestAnimationFrame(animate);
      }

      frameId = requestAnimationFrame(animate);
    });
  }

  return { group: root, start, cancel, cleanup };
}
