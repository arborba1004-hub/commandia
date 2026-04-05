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
  disposables: Array<THREE.Object3D | THREE.Material | THREE.Texture>;
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
    url: 'https://static.wixstatic.com/3d/50f4bf_8b894931f3c241f285c4292c4842c4f0.glb',
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

  if (child.material) {
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
  const disposables: Array<THREE.Object3D | THREE.Material | THREE.Texture> = [];

  const load = async () => {
    for (const building of COMPLEXO_BUILDINGS) {
      const model = await loadGLTF(loader, building.url);

      model.traverse(fixDarkMaterials);

      const initialBox = new THREE.Box3().setFromObject(model);
      const initialSize = new THREE.Vector3();
      initialBox.getSize(initialSize);

      const currentMaxX = Math.max(initialSize.x, 0.001);
      const currentMaxZ = Math.max(initialSize.z, 0.001);

      const scaleX = building.width / currentMaxX;
      const scaleZ = building.depth / currentMaxZ;
      const uniformScale = Math.min(scaleX, scaleZ) * (building.scaleMultiplier ?? 1);

      model.scale.setScalar(uniformScale);

      const scaledBox = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      scaledBox.getCenter(center);

      model.position.sub(center);

      const groundedBox = new THREE.Box3().setFromObject(model);
      model.position.y -= groundedBox.min.y;

      model.position.x = building.x;
      model.position.z = building.z;
      model.rotation.y = building.rotationY ?? 0;

      group.add(model);
      disposables.push(model);

      const finalBox = new THREE.Box3().setFromObject(model);
      const finalSize = new THREE.Vector3();
      finalBox.getSize(finalSize);

      const hitboxHeight = Math.max(finalSize.y + 1, 4);

      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(building.width, hitboxHeight, building.depth),
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
      );

      hitbox.name = `${building.name}-hitbox`;
      hitbox.position.set(building.x, hitboxHeight / 2, building.z);
      hitbox.userData = {
        buildingName: building.name,
        route: building.route,
        isComplexoBuilding: true,
      };

      group.add(hitbox);
      clickableMeshes.push({
        name: building.name,
        route: building.route,
        mesh: hitbox,
      });

      disposables.push(hitbox);
      disposables.push(hitbox.geometry);
      disposables.push(hitbox.material);

      const { sprite, texture, material } = createTextLabel(building.name);
      sprite.position.set(building.x, finalBox.max.y + 1.4, building.z);
      group.add(sprite);
      disposables.push(sprite);

      if (texture) disposables.push(texture);
      if (material) disposables.push(material);
    }
  };

  return {
    group,
    clickableMeshes,
    disposables,
    load,
  };
}