import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

type CreateSquadParams = {
  level?: number;
};

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const SQUAD_GLB_URL =
  'https://static.wixstatic.com/3d/50f4bf_471a8eec1715484ebc36bdd3b9002999.glb';

export function loadSquadModel(callback: (squad: THREE.Group) => void, _level: number = 20) {
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    SQUAD_GLB_URL,
    (gltf) => {
      const container = new THREE.Group();
      const model = gltf.scene;

      model.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat: any) => {
                if ('metalness' in mat) mat.metalness = 0;
                if ('roughness' in mat) mat.roughness = 0.9;
                if ('emissive' in mat) mat.emissive = new THREE.Color(0x220000);
                if ('emissiveIntensity' in mat) mat.emissiveIntensity = 0.12;
                mat.needsUpdate = true;
              });
            } else {
              if ('metalness' in child.material) child.material.metalness = 0;
              if ('roughness' in child.material) child.material.roughness = 0.9;
              if ('emissive' in child.material) child.material.emissive = new THREE.Color(0x220000);
              if ('emissiveIntensity' in child.material) child.material.emissiveIntensity = 0.12;
              child.material.needsUpdate = true;
            }
          }
        }
      });

      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);

      const desiredWidth = 1.6;
      const scale = desiredWidth / Math.max(size.x, size.z, 1);
      model.scale.setScalar(scale);

      const scaledBox = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      scaledBox.getCenter(center);

      model.position.x -= center.x;
      model.position.z -= center.z;

      const finalBox = new THREE.Box3().setFromObject(model);

      // 🔥 corrige o "afundamento" no modelo filho, não no container
      model.position.y -= finalBox.min.y;
      model.position.y += 0.02;

      container.add(model);
      container.name = 'SQUAD_ENTITY';

      callback(container);
    },
    undefined,
    (error) => {
      console.error('Erro ao carregar squad 3D:', error);
    }
  );
}

export function createSquadVisual({ level = 1 }: CreateSquadParams = {}) {
  const group = new THREE.Group();

  const memberCount =
    level < 5 ? 2 :
    level < 15 ? 3 :
    level < 30 ? 4 :
    level < 60 ? 5 : 6;

  const hasVehicle = level >= 20;
  const isHighLevel = level >= 50;

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: isHighLevel ? 0xff2a2a : 0xffffff,
    emissive: isHighLevel ? 0x550000 : 0x000000,
    metalness: 0.3,
    roughness: 0.6,
  });

  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd7a3,
  });

  const weaponMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.8,
    roughness: 0.2,
  });

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.25,
  });

  function createMember(index: number) {
    const member = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.12, 0.3, 4, 8),
      bodyMaterial
    );
    body.position.y = 0.25;

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      headMaterial
    );
    head.position.y = 0.55;

    const weapon = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.05, 0.05),
      weaponMaterial
    );
    weapon.position.set(0.15, 0.35, 0);

    member.add(body, head, weapon);

    const spacing = 0.35;
    const row = Math.floor(index / 3);
    const col = index % 3;

    member.position.x = (col - 1) * spacing;
    member.position.z = row * spacing;

    return member;
  }

  for (let i = 0; i < memberCount; i++) {
    group.add(createMember(i));
  }

  if (hasVehicle) {
    const vehicle = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.2, 1.2),
      new THREE.MeshStandardMaterial({
        color: isHighLevel ? 0x111111 : 0x333333,
        metalness: 0.7,
        roughness: 0.4,
      })
    );
    base.position.y = 0.15;

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.25, 0.6),
      new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.6,
        roughness: 0.3,
      })
    );
    cabin.position.y = 0.35;

    vehicle.add(base, cabin);
    vehicle.position.z = -0.6;
    group.add(vehicle);
  }

  if (isHighLevel) {
    const aura = new THREE.Mesh(
      new THREE.CircleGeometry(1.2, 32),
      glowMaterial
    );
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.02;

    group.add(aura);
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.8, 24),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.2,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;

  group.add(shadow);

  group.name = 'SQUAD_ENTITY_FALLBACK';

  return group;
}