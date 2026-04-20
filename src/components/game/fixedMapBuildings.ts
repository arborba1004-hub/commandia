import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const MAP_CENTER = new THREE.Vector3(0, 0, 0);

export type FixedBuildingConfig = {
  key: string;
  name: string;
  url: string;
  x: number;
  z: number;
  footprint: number;
  route?: string;
  comingSoon?: boolean;
  frontOffsetY?: number;
};

export const FIXED_BUILDINGS: FixedBuildingConfig[] = [
  {
    key: 'qg',
    name: 'QG',
    url: 'https://static.wixstatic.com/3d/50f4bf_eec7859d96b643a390259dccace8134c.glb',
    x: 0,
    z: 0,
    footprint: 10,
    comingSoon: true,
  },

  {
    key: 'ct_nw',
    name: 'CT Norte Oeste',
    url: 'https://static.wixstatic.com/3d/50f4bf_28e058f8bcc74daabc52cd7abf653245.glb',
    x: -52,
    z: -52,
    footprint: 7,
    route: '/gang',
  },
  {
    key: 'ct_ne',
    name: 'CT Norte Leste',
    url: 'https://static.wixstatic.com/3d/50f4bf_28e058f8bcc74daabc52cd7abf653245.glb',
    x: 52,
    z: -52,
    footprint: 7,
    route: '/gang',
  },
  {
    key: 'ct_sw',
    name: 'CT Sul Oeste',
    url: 'https://static.wixstatic.com/3d/50f4bf_28e058f8bcc74daabc52cd7abf653245.glb',
    x: -52,
    z: 52,
    footprint: 7,
    route: '/gang',
  },
  {
    key: 'ct_se',
    name: 'CT Sul Leste',
    url: 'https://static.wixstatic.com/3d/50f4bf_28e058f8bcc74daabc52cd7abf653245.glb',
    x: 52,
    z: 52,
    footprint: 7,
    route: '/gang',
  },

  {
    key: 'predio_publico',
    name: 'Prédio Público',
    url: 'https://static.wixstatic.com/3d/50f4bf_1545792f30154be8bab945391281c429.glb',
    x: -24,
    z: -52,
    footprint: 7,
    route: '/suborno-ilustrado',
  },
  {
    key: 'delegacia',
    name: 'Delegacia',
    url: 'https://static.wixstatic.com/3d/50f4bf_45e197f9ee134edb83c942454e77bd16.glb',
    x: 0,
    z: -52,
    footprint: 7,
    comingSoon: true,
  },
  {
    key: 'loja_luxo',
    name: 'Loja de Luxo',
    url: 'https://static.wixstatic.com/3d/50f4bf_cf2720eb5bf8455eb61feb001ecb6d44.glb',
    x: 24,
    z: -52,
    footprint: 7,
    route: '/luxuryshowroom',
  },

  {
    key: 'garagem',
    name: 'Garagem',
    url: 'https://static.wixstatic.com/3d/50f4bf_0a1039e7f16c480b87ad52ed7183428d.glb',
    x: -24,
    z: 52,
    footprint: 7,
    route: '/fuga',
  },
  {
    key: 'centro_comercial',
    name: 'Centro Comercial',
    url: 'https://static.wixstatic.com/3d/50f4bf_97b32dc3705749c188576ebd392c553a.glb',
    x: 0,
    z: 52,
    footprint: 7,
    route: '/lavagem-de-dinheiro',
  },
  {
    key: 'centro_comunitario',
    name: 'Centro Comunitário',
    url: 'https://static.wixstatic.com/3d/50f4bf_803533144e3e411ca8f83da3de514cd4.glb',
    x: 24,
    z: 52,
    footprint: 7,
    route: '/faccao',
  },

  {
    key: 'casino',
    name: 'Cassino',
    url: 'https://static.wixstatic.com/3d/50f4bf_ca4b6bff1e9a494d8f123219ea925720.glb',
    x: 52,
    z: 0,
    footprint: 7,
    route: '/giro',
  },
];

type MountFixedMapBuildingsParams = {
  scene: THREE.Scene;
  loader: GLTFLoader;
  camera: THREE.Camera;
  container: HTMLDivElement;
  onNavigate: (path: string) => void;
  onMessage: (message: string) => void;
};

export type FixedMapBuildingsLayer = {
  tryHandleBuildingClick: (clientX: number, clientY: number) => boolean;
  cleanup: () => void;
};

function createTextLabel(
  text: string,
  scaleX = 5.6,
  scaleY = 1.2
): THREE.Sprite | THREE.Group {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) return new THREE.Group();

  canvas.width = 700;
  canvas.height = 160;

  context.fillStyle = 'rgba(0, 0, 0, 0.58)';
  context.beginPath();

  if (typeof context.roundRect === 'function') {
    context.roundRect(0, 0, canvas.width, canvas.height, 24);
  } else {
    context.rect(0, 0, canvas.width, canvas.height);
  }

  context.fill();
  context.font = 'bold 46px Oswald, Impact, Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#d9b764';
  context.fillText(text.toUpperCase(), canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(scaleX, scaleY, 1);

  return sprite;
}

function setMeshQuality(child: any) {
  if (!child.isMesh) return;

  child.castShadow = true;
  child.receiveShadow = true;

  if (child.material) {
    child.material.metalness = 0;
    child.material.roughness = 0.8;
    child.material.emissive = new THREE.Color(0x3a220f);
    child.material.emissiveIntensity = 0.16;
    child.material.needsUpdate = true;
  }
}

function fitModelToFootprint(model: THREE.Object3D, footprint: number) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDimension = Math.max(size.x, size.z) || 1;
  const scale = footprint / maxDimension;
  model.scale.setScalar(scale);

  const scaledBox = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  scaledBox.getCenter(center);
  model.position.sub(center);

  const finalBox = new THREE.Box3().setFromObject(model);
  model.position.y -= finalBox.min.y;

  const adjustedBox = new THREE.Box3().setFromObject(model);

  return {
    box: adjustedBox,
    labelY: adjustedBox.max.y + 1.2,
  };
}

function findClickableRoot(object: THREE.Object3D | null): THREE.Object3D | null {
  let current: THREE.Object3D | null = object;

  while (current) {
    if (current.userData?.isMapBuilding) {
      return current;
    }
    current = current.parent;
  }

  return null;
}

export function mountFixedMapBuildings({
  scene,
  loader,
  camera,
  container,
  onNavigate,
  onMessage,
}: MountFixedMapBuildingsParams): FixedMapBuildingsLayer {
  const buildings: THREE.Object3D[] = [];
  const labels: Array<THREE.Sprite | THREE.Group> = [];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const loadFixedBuilding = (building: FixedBuildingConfig) => {
    loader.load(
      building.url,
      (gltf) => {
        const model = gltf.scene;
        const wrapper = new THREE.Group();

        const { labelY } = fitModelToFootprint(model, building.footprint);
        model.traverse((child) => setMeshQuality(child));

        wrapper.position.set(building.x, 0, building.z);
        wrapper.lookAt(MAP_CENTER);
        wrapper.rotateY(building.frontOffsetY ?? 0);
        wrapper.add(model);

        wrapper.userData.isMapBuilding = true;
        wrapper.userData.route = building.route || null;
        wrapper.userData.comingSoon = Boolean(building.comingSoon);
        wrapper.userData.buildingName = building.name;
        wrapper.userData.buildingKey = building.key;

        const label = createTextLabel(building.name);
        label.position.set(building.x, labelY, building.z);
        wrapper.userData.nameLabel = label;

        scene.add(wrapper);
        scene.add(label);

        buildings.push(wrapper);
        labels.push(label);
      },
      undefined,
      (error) => {
        console.error(`Erro ao carregar prédio fixo ${building.name}:`, error);
      }
    );
  };

  FIXED_BUILDINGS.forEach(loadFixedBuilding);

  const tryHandleBuildingClick = (clientX: number, clientY: number) => {
    if (buildings.length === 0) return false;

    const rect = container.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const buildingHits = raycaster.intersectObjects(buildings, true);
    if (buildingHits.length === 0) return false;

    const root = findClickableRoot(buildingHits[0].object);
    if (!root) return false;

    const route = root.userData?.route as string | null;
    const comingSoon = Boolean(root.userData?.comingSoon);
    const buildingName = String(root.userData?.buildingName || 'Sistema');

    if (route) {
      onNavigate(route);
      return true;
    }

    if (comingSoon) {
      onMessage(`${buildingName}: sistema ainda não disponível`);
      return true;
    }

    return false;
  };

  const cleanup = () => {
    buildings.forEach((building) => {
      scene.remove(building);
      if (building.userData?.nameLabel) {
        scene.remove(building.userData.nameLabel);
      }
    });

    labels.length = 0;
    buildings.length = 0;
  };

  return {
    tryHandleBuildingClick,
    cleanup,
  };
}