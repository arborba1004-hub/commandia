import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export type ComplexoBuildingRoute =
  | '/qg'
  | '/centro-comercial'
  | '/centro-comunitario';

export type ComplexoBuildingConfig = {
  name: 'QG' | 'Centro Comercial' | 'Centro Comunitário';
  url: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  route: ComplexoBuildingRoute;
  rotationY?: number;
  scaleMultiplier?: number;
};

export type ComplexoBuildingHitbox = {
  name: string;
  route: ComplexoBuildingRoute;
  mesh: THREE.Mesh;
};

export type CreateComplexoBuildingsResult = {
  group: THREE.Group;
  clickableMeshes: ComplexoBuildingHitbox[];
  disposables: Array<any>;
  load: () => Promise<void>;
};

const COMPLEXO_BUILDINGS: ComplexoBuildingConfig[] = [
  {
    name: 'QG',
    url: 'https://static.wixstatic.com/3d/50f4bf_938928189a844f56ac340bada0b551bd.glb',
    x: 0,
    z: 0,
    width: 4,
    depth: 4,
    route: '/qg',
    rotationY: 0,
    scaleMultiplier: 1,
  },
  {
    name: 'Centro Comercial',
    url: 'https://static.wixstatic.com/3d/50f4bf_122d344399914dd7b74c6e9c166a2d57.glb',
    x: 17,
    z: -5,
    width: 4,
    depth: 2,
    route: '/centro-comercial',
    rotationY: Math.PI,
    scaleMultiplier: 1,
  },
  {
    name: 'Centro Comunitário',
    url: 'https://static.wixstatic.com/3d/50f4bf_1641be50f6a74954848cfaae281d6b15.glb',
    x: 17,
    z: 2,
    width: 4,
    depth: 2,
    route: '/centro-comunitario',
    rotationY: Math.PI,
    scaleMultiplier: 1,
  },
];

function fixDarkMaterials(child: any) {
  if (!child.isMesh) return;

  child.castShadow = true;
  child.receiveShadow = true;

  if (!child.material) return;

  if (Array.isArray(child.material)) {
    child.material.forEach((mat: any) => {
      mat.metalness = 0;
      mat.roughness = 0.85;
      mat.emissive = new THREE.Color(0x2a190b);
      mat.emissiveIntensity = 0.12;
      mat.needsUpdate = true;
    });
  } else {
    child.material.metalness = 0;
    child.material.roughness = 0.85;
    child.material.emissive = new THREE.Color(0x2a190b);
    child.material.emissiveIntensity = 0.12;
    child.material.needsUpdate = true;
  }
}

function loadGLTF(loader: GLTFLoader, url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf.scene),
      undefined,
      (error) => reject(error)
    );
  });
}

function createTextLabel(text: string) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    return {
      sprite: new THREE.Sprite(),
      texture: null as THREE.Texture | null,
      material: null as THREE.SpriteMaterial | null,
    };
  }

  canvas.width = 512;
  canvas.height = 128;

  context.fillStyle = 'rgba(0,0,0,0.55)';
  context.beginPath();
  context.roundRect(0, 0, 512, 128, 20);
  context.fill();

  context.font = 'bold 52px Oswald, Impact, Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#d9b764';
  context.fillText(text.toUpperCase(), 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.8, 0.95, 1);

  return { sprite, texture, material };
}

export function createComplexoBuildings(loader: GLTFLoader): CreateComplexoBuildingsResult {
  const group = new THREE.Group();
  group.name = 'complexo-buildings-group';

  const clickableMeshes: ComplexoBuildingHitbox[] = [];
  const disposables: Array<any> = [];

  const load = async () => {
    for (const building of COMPLEXO_BUILDINGS) {
      try {
        const model = await loadGLTF(loader, building.url);
        model.traverse(fixDarkMaterials);

        const sourceBox = new THREE.Box3().setFromObject(model);
        const sourceSize = new THREE.Vector3();
        const sourceCenter = new THREE.Vector3();

        sourceBox.getSize(sourceSize);
        sourceBox.getCenter(sourceCenter);

        const safeX = Math.max(sourceSize.x, 0.001);
        const safeZ = Math.max(sourceSize.z, 0.001);

        const scaleX = building.width / safeX;
        const scaleZ = building.depth / safeZ;
        const uniformScale = Math.min(scaleX, scaleZ) * (building.scaleMultiplier ?? 1);

        model.scale.setScalar(uniformScale);

        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = new THREE.Vector3();
        const scaledSize = new THREE.Vector3();

        scaledBox.getCenter(scaledCenter);
        scaledBox.getSize(scaledSize);

        // centraliza o modelo no próprio pivô local
        model.position.x -= scaledCenter.x;
        model.position.y -= scaledBox.min.y;
        model.position.z -= scaledCenter.z;

        const wrapper = new THREE.Group();
        wrapper.name = `${building.name}-wrapper`;
        wrapper.position.set(building.x, 0, building.z);
        wrapper.rotation.y = building.rotationY ?? 0;

        wrapper.add(model);
        group.add(wrapper);

        disposables.push(wrapper);
        disposables.push(model);

        const hitboxHeight = Math.max(scaledSize.y + 1, 4);

        const hitbox = new THREE.Mesh(
          new THREE.BoxGeometry(building.width, hitboxHeight, building.depth),
          new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
          })
        );

        hitbox.name = `${building.name}-hitbox`;
        hitbox.position.set(0, hitboxHeight / 2, 0);
        hitbox.userData = {
          buildingName: building.name,
          route: building.route,
          isComplexoBuilding: true,
        };

        wrapper.add(hitbox);

        clickableMeshes.push({
          name: building.name,
          route: building.route,
          mesh: hitbox,
        });

        disposables.push(hitbox);
        disposables.push(hitbox.geometry);
        disposables.push(hitbox.material);

        const { sprite, texture, material } = createTextLabel(building.name);
        sprite.position.set(0, scaledSize.y + 1.4, 0);
        wrapper.add(sprite);

        disposables.push(sprite);
        if (texture) disposables.push(texture);
        if (material) disposables.push(material);

        console.log(`✅ ${building.name} carregado em x:${building.x} z:${building.z}`);
      } catch (error) {
        console.error(`❌ Erro ao carregar ${building.name}:`, error);
      }
    }
  };

  return {
    group,
    clickableMeshes,
    disposables,
    load,
  };
}