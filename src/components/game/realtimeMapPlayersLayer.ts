import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { tileToWorldCenter, type TileOrigin } from '@/components/game/playerMapSpace';

const BACKEND_URL = 'https://comando-backend.onrender.com';
const DEFAULT_POLLING_MS = 3000;
const DEFAULT_LIMIT = 1000;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const BARRACO_MODELS = [
  { min: 1, max: 9, url: 'https://static.wixstatic.com/3d/50f4bf_0a763db5131547a588ce702d6de0a388.glb' },
  { min: 10, max: 19, url: 'https://static.wixstatic.com/3d/50f4bf_134ce80560954ebb890dd74baed878e0.glb' },
  { min: 20, max: 29, url: 'https://static.wixstatic.com/3d/50f4bf_a089f0d52f38465f8db77877509f12d6.glb' },
  { min: 30, max: 39, url: 'https://static.wixstatic.com/3d/50f4bf_f78d5d13df3d4a9e9b62061425cc4f30.glb' },
  { min: 40, max: 49, url: 'https://static.wixstatic.com/3d/50f4bf_fcfd85e45b61474eab924ba144e1b256.glb' },
  { min: 50, max: 59, url: 'https://static.wixstatic.com/3d/50f4bf_8ddf8382a1d24e1d8003a7d851132a11.glb' },
  { min: 60, max: 69, url: 'https://static.wixstatic.com/3d/50f4bf_97904fbc3ca74bb094a29e7052c79fb4.glb' },
  { min: 70, max: 79, url: 'https://static.wixstatic.com/3d/50f4bf_5e9f2aa54cf041b29f49258cc63eb746.glb' },
  { min: 80, max: 89, url: 'https://static.wixstatic.com/3d/50f4bf_ac1c5e207bbc425f80619a581e2e2cba.glb' },
  { min: 90, max: 100, url: 'https://static.wixstatic.com/3d/50f4bf_a8dd587eba644115b376b9a0b0dc67d5.glb' },
];

export type MapPlayerSnapshot = {
  id: string;
  name?: string;
  tileX: number;
  tileY: number;
  barracoLevel?: number;
  power?: number;
  factionId?: string | null;
};

export type RealtimeMapPlayersLayerOptions = {
  scene: THREE.Scene;
  gridWidth: number;
  gridHeight: number;
  tileSize?: number;
  pollingMs?: number;
  limit?: number;
  showSpaces?: boolean;
};

export type RealtimeMapPlayersLayer = {
  group: THREE.Group;
  refresh: () => Promise<void>;
  refreshNow: () => Promise<MapPlayerSnapshot[]>;
  getSnapshots: () => MapPlayerSnapshot[];
  getOccupiedOrigins: (excludePlayerId?: string | null) => TileOrigin[];
  start: () => void;
  stop: () => void;
  cleanup: () => void;
};

type PlayerVisualEntry = {
  id: string;
  group: THREE.Group;
  spaceMesh: THREE.Mesh | null;
  modelContainer: THREE.Group;
  label: THREE.Sprite | null;
  modelUrl: string | null;
  barracoLevel: number;
  labelY: number;
};

const modelPromiseCache = new Map<string, Promise<THREE.Object3D>>();

function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

function getBarracoModelUrl(level: number): string {
  return (
    BARRACO_MODELS.find((item) => level >= item.min && level <= item.max)?.url ??
    BARRACO_MODELS[0].url
  );
}

function getBarracoTileFootprint(level: number) {
  if (level >= 70) return 6;
  if (level >= 50) return 5;
  if (level >= 40) return 4;
  if (level >= 20) return 3;
  return 2;
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach((item) => disposeMaterial(item));
    return;
  }

  const mat = material as THREE.Material & {
    map?: THREE.Texture | null;
    alphaMap?: THREE.Texture | null;
    normalMap?: THREE.Texture | null;
    roughnessMap?: THREE.Texture | null;
    metalnessMap?: THREE.Texture | null;
    emissiveMap?: THREE.Texture | null;
    aoMap?: THREE.Texture | null;
  };

  mat.map?.dispose();
  mat.alphaMap?.dispose();
  mat.normalMap?.dispose();
  mat.roughnessMap?.dispose();
  mat.metalnessMap?.dispose();
  mat.emissiveMap?.dispose();
  mat.aoMap?.dispose();
  mat.dispose();
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child: any) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {
      disposeMaterial(child.material);
    }
  });
}

function setMeshQuality(child: any) {
  if (!child?.isMesh) return;

  child.castShadow = true;
  child.receiveShadow = true;

  if (child.material) {
    const material = Array.isArray(child.material)
      ? child.material.map((item: THREE.Material) => item.clone())
      : child.material.clone();

    child.material = material;

    const materials = Array.isArray(material) ? material : [material];
    materials.forEach((mat: any) => {
      mat.metalness = 0;
      mat.roughness = 0.82;

      if ('emissive' in mat) {
        mat.emissive = new THREE.Color(0x3a220f);
        mat.emissiveIntensity = 0.12;
      }

      mat.needsUpdate = true;
    });
  }
}

function fitModelToFootprint(model: THREE.Object3D, footprint: number) {
  const initialBox = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  initialBox.getSize(size);

  const maxDimension = Math.max(size.x, size.z) || 1;
  const scale = footprint / maxDimension;
  model.scale.setScalar(scale);

  const scaledBox = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  scaledBox.getCenter(center);
  model.position.sub(center);

  const groundedBox = new THREE.Box3().setFromObject(model);
  model.position.y -= groundedBox.min.y;

  const finalBox = new THREE.Box3().setFromObject(model);

  return {
    labelY: finalBox.max.y + 1.2,
  };
}

function createLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    return new THREE.Sprite();
  }

  canvas.width = 720;
  canvas.height = 160;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(0, 0, 0, 0.58)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = 'bold 44px Oswald, Impact, Arial';
  context.fillStyle = '#d9b764';
  context.fillText((text || 'JOGADOR').toUpperCase(), canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(6, 1.35, 1);

  return sprite;
}

function disposeLabel(label: THREE.Sprite | null) {
  if (!label) return;

  const material = label.material as THREE.SpriteMaterial | undefined;
  material?.map?.dispose();
  material?.dispose();
}

function createSpaceMesh(tileSize: number): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(6 * tileSize, 6 * tileSize);
  const material = new THREE.MeshBasicMaterial({
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.14,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function syncEntryPlayerId(entry: PlayerVisualEntry, playerId: string) {
  entry.id = playerId;
  entry.group.userData.playerId = playerId;
  entry.modelContainer.userData.playerId = playerId;

  if (entry.spaceMesh) {
    entry.spaceMesh.userData.playerId = playerId;
  }

  if (entry.label) {
    entry.label.userData.playerId = playerId;
  }

  entry.modelContainer.traverse((child: any) => {
    child.userData.playerId = playerId;
  });
}

async function fetchMapPlayersSnapshot(limit = DEFAULT_LIMIT): Promise<MapPlayerSnapshot[]> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${BACKEND_URL}/players/snapshot?limit=${limit}`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let data: unknown = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errorMessage =
        typeof data === 'object' && data && 'error' in data
          ? String((data as any).error)
          : 'Erro ao buscar snapshot do mapa';

      throw new Error(errorMessage);
    }

    return Array.isArray(data) ? (data as MapPlayerSnapshot[]) : [];
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function loadBarracoTemplate(
  loader: GLTFLoader,
  modelUrl: string
): Promise<THREE.Object3D> {
  const cached = modelPromiseCache.get(modelUrl);
  if (cached) return cached;

  const promise = new Promise<THREE.Object3D>((resolve, reject) => {
    loader.load(
      modelUrl,
      (gltf) => resolve(gltf.scene),
      undefined,
      (error) => reject(error)
    );
  });

  modelPromiseCache.set(modelUrl, promise);
  return promise;
}

async function buildBarracoModel(
  loader: GLTFLoader,
  barracoLevel: number,
  tileSize: number
): Promise<{ model: THREE.Object3D; labelY: number }> {
  const modelUrl = getBarracoModelUrl(barracoLevel);
  const template = await loadBarracoTemplate(loader, modelUrl);
  const clone = template.clone(true);

  clone.traverse((child) => setMeshQuality(child));

  const { labelY } = fitModelToFootprint(
    clone,
    getBarracoTileFootprint(barracoLevel) * tileSize
  );

  return {
    model: clone,
    labelY,
  };
}

function setEntryWorldPosition(
  entry: PlayerVisualEntry,
  tileX: number,
  tileY: number,
  gridWidth: number,
  gridHeight: number
) {
  const { worldX, worldZ } = tileToWorldCenter(tileX, tileY, gridWidth, gridHeight);

  entry.group.position.set(worldX, 0, worldZ);

  if (entry.spaceMesh) {
    entry.spaceMesh.position.set(0, 0.06, 0);
  }

  entry.modelContainer.position.set(0, 0, 0);

  if (entry.label) {
    entry.label.position.set(0, entry.labelY, 0);
  }
}

function createVisualEntry(tileSize: number, showSpaces: boolean): PlayerVisualEntry {
  const group = new THREE.Group();

  const spaceMesh = showSpaces ? createSpaceMesh(tileSize) : null;
  if (spaceMesh) {
    group.add(spaceMesh);
  }

  const modelContainer = new THREE.Group();
  group.add(modelContainer);

  return {
    id: '',
    group,
    spaceMesh,
    modelContainer,
    label: null,
    modelUrl: null,
    barracoLevel: 1,
    labelY: 3.5,
  };
}

function clearModelContainer(container: THREE.Group) {
  while (container.children.length > 0) {
    const child = container.children[0];
    container.remove(child);
    disposeObject(child);
  }
}

export function mountRealtimeMapPlayersLayer({
  scene,
  gridWidth,
  gridHeight,
  tileSize = 1,
  pollingMs = DEFAULT_POLLING_MS,
  limit = DEFAULT_LIMIT,
  showSpaces = true,
}: RealtimeMapPlayersLayerOptions): RealtimeMapPlayersLayer {
  const group = new THREE.Group();
  scene.add(group);

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  const entries = new Map<string, PlayerVisualEntry>();
  let pollingHandle: ReturnType<typeof setInterval> | null = null;
  let disposed = false;
  let refreshInFlight = false;
  let latestSnapshots: MapPlayerSnapshot[] = [];

  async function ensureEntryVisual(entry: PlayerVisualEntry, snapshot: MapPlayerSnapshot) {
    const nextLevel = Number(snapshot.barracoLevel || 1);
    const nextUrl = getBarracoModelUrl(nextLevel);

    if (entry.modelUrl === nextUrl && entry.barracoLevel === nextLevel) {
      return;
    }

    const { model, labelY } = await buildBarracoModel(loader, nextLevel, tileSize);

    if (disposed) {
      disposeObject(model);
      return;
    }

    clearModelContainer(entry.modelContainer);
    entry.modelContainer.add(model);

    entry.modelUrl = nextUrl;
    entry.barracoLevel = nextLevel;
    entry.labelY = labelY;

    if (entry.label) {
      entry.label.position.set(0, entry.labelY, 0);
    }
  }

  function updateEntryLabel(entry: PlayerVisualEntry, snapshot: MapPlayerSnapshot) {
    if (entry.label) {
      entry.group.remove(entry.label);
      disposeLabel(entry.label);
      entry.label = null;
    }

    const label = createLabelSprite(snapshot.name || 'Jogador');
    label.userData.playerName = snapshot.name || 'Jogador';
    label.position.set(0, entry.labelY, 0);
    entry.label = label;
    entry.group.add(label);
  }

  async function syncSnapshot(players: MapPlayerSnapshot[]) {
    latestSnapshots = players.map((item) => ({ ...item }));

    const nextIds = new Set<string>();

    for (const snapshot of players) {
      const playerId = String(snapshot.id);
      nextIds.add(playerId);

      let entry = entries.get(playerId);

      if (!entry) {
        entry = createVisualEntry(tileSize, showSpaces);
        entries.set(playerId, entry);
        group.add(entry.group);
      }

      syncEntryPlayerId(entry, playerId);

      setEntryWorldPosition(
        entry,
        Number(snapshot.tileX || 0),
        Number(snapshot.tileY || 0),
        gridWidth,
        gridHeight
      );

      if (!entry.label || entry.label.userData?.playerName !== (snapshot.name || 'Jogador')) {
        updateEntryLabel(entry, snapshot);
        syncEntryPlayerId(entry, playerId);
      }

      await ensureEntryVisual(entry, snapshot);
      syncEntryPlayerId(entry, playerId);
    }

    for (const [playerId, entry] of entries.entries()) {
      if (nextIds.has(playerId)) continue;

      group.remove(entry.group);

      if (entry.spaceMesh) {
        entry.spaceMesh.geometry.dispose();
        disposeMaterial(entry.spaceMesh.material);
      }

      clearModelContainer(entry.modelContainer);
      disposeLabel(entry.label);

      entries.delete(playerId);
    }
  }

  async function refreshNow() {
    const players = await fetchMapPlayersSnapshot(limit);
    if (disposed) return latestSnapshots;
    await syncSnapshot(players);
    return latestSnapshots;
  }

  async function refresh() {
    if (disposed || refreshInFlight) return;

    refreshInFlight = true;
    try {
      await refreshNow();
    } catch (error) {
      console.error('Erro ao atualizar players em tempo real no mapa:', error);
    } finally {
      refreshInFlight = false;
    }
  }

  function getSnapshots() {
    return latestSnapshots.map((item) => ({ ...item }));
  }

  function getOccupiedOrigins(excludePlayerId?: string | null): TileOrigin[] {
    return latestSnapshots
      .filter((item) => {
        if (!excludePlayerId) return true;
        return String(item.id) !== String(excludePlayerId);
      })
      .map((item) => ({
        tileX: Number(item.tileX || 0),
        tileY: Number(item.tileY || 0),
      }));
  }

  function start() {
    if (pollingHandle || disposed) return;

    void refresh();
    pollingHandle = setInterval(() => {
      void refresh();
    }, pollingMs);
  }

  function stop() {
    if (!pollingHandle) return;
    clearInterval(pollingHandle);
    pollingHandle = null;
  }

  function cleanup() {
    disposed = true;
    stop();

    for (const [, entry] of entries.entries()) {
      group.remove(entry.group);

      if (entry.spaceMesh) {
        entry.spaceMesh.geometry.dispose();
        disposeMaterial(entry.spaceMesh.material);
      }

      clearModelContainer(entry.modelContainer);
      disposeLabel(entry.label);
    }

    entries.clear();
    latestSnapshots = [];
    scene.remove(group);
  }

  return {
    group,
    refresh,
    refreshNow,
    getSnapshots,
    getOccupiedOrigins,
    start,
    stop,
    cleanup,
  };
}
