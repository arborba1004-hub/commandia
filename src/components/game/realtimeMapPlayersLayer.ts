import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { tileToWorldCenter } from '@/components/game/playerMapSpace';

const BACKEND_URL = 'https://comando-backend.onrender.com';
const DEFAULT_POLLING_MS = 60000;
const DEFAULT_LIMIT = 1000;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const BARRACO_MODELS = [
  { min: 1,  max: 9,   url: 'https://static.wixstatic.com/3d/50f4bf_0a763db5131547a588ce702d6de0a388.glb' },
  { min: 10, max: 19,  url: 'https://static.wixstatic.com/3d/50f4bf_134ce80560954ebb890dd74baed878e0.glb' },
  { min: 20, max: 29,  url: 'https://static.wixstatic.com/3d/50f4bf_a089f0d52f38465f8db77877509f12d6.glb' },
  { min: 30, max: 39,  url: 'https://static.wixstatic.com/3d/50f4bf_f78d5d13df3d4a9e9b62061425cc4f30.glb' },
  { min: 40, max: 49,  url: 'https://static.wixstatic.com/3d/50f4bf_fcfd85e45b61474eab924ba144e1b256.glb' },
  { min: 50, max: 59,  url: 'https://static.wixstatic.com/3d/50f4bf_8ddf8382a1d24e1d8003a7d851132a11.glb' },
  { min: 60, max: 69,  url: 'https://static.wixstatic.com/3d/50f4bf_97904fbc3ca74bb094a29e7052c79fb4.glb' },
  { min: 70, max: 79,  url: 'https://static.wixstatic.com/3d/50f4bf_5e9f2aa54cf041b29f49258cc63eb746.glb' },
  { min: 80, max: 89,  url: 'https://static.wixstatic.com/3d/50f4bf_ac1c5e207bbc425f80619a581e2e2cba.glb' },
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
  /**
   * Retorna o ID do próprio jogador para ser filtrado da camada de outros jogadores.
   * Evita duplicidade: o barraco próprio é renderizado via mountPlayerMapSpace,
   * não via esta camada. Deve ser uma closure que lê a variável atualizada em tempo real.
   */
  getMyId?: () => string | null;
};

export type RealtimeMapPlayersLayer = {
  group: THREE.Group;
  refresh: () => Promise<void>;
  start: () => void;
  stop: () => void;
  cleanup: () => void;
  players: () => MapPlayerSnapshot[];
  tileToWorld: (tileX: number, tileY: number) => { worldX: number; worldZ: number };
  upsertPlayer: (snapshot: MapPlayerSnapshot) => Promise<void>;
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
  tileX: number;
  tileY: number;
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
    if (child.geometry) child.geometry.dispose();
    if (child.material) disposeMaterial(child.material);
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
  return { labelY: finalBox.max.y + 1.2 };
}

function createLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Sprite();
  canvas.width = 720;
  canvas.height = 160;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(0, 0, 0, 0.58)';
  context.beginPath();
  if (typeof (context as any).roundRect === 'function') {
    (context as any).roundRect(0, 0, canvas.width, canvas.height, 26);
  } else {
    context.rect(0, 0, canvas.width, canvas.height);
  }
  context.fill();
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = 'bold 44px Oswald, Impact, Arial';
  context.fillStyle = '#d9b764';
  context.fillText((text || 'JOGADOR').toUpperCase(), canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
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
    color: 0x60a5fa, transparent: true, opacity: 0.14,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

async function fetchMapPlayersSnapshot(limit = DEFAULT_LIMIT): Promise<MapPlayerSnapshot[]> {
  const token = getAuthToken();
  if (!token) throw new Error('Usuário não autenticado');
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${BACKEND_URL}/players/snapshot?limit=${limit}`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    let data: unknown = null;
    try { data = await response.json(); } catch { data = null; }
    if (!response.ok) {
      const errorMessage =
        typeof data === 'object' && data && 'error' in data
          ? String((data as any).error)
          : 'Erro ao buscar snapshot do mapa';
      throw new Error(errorMessage);
    }
    return Array.isArray(data) ? (data as MapPlayerSnapshot[]) : [];
  } catch (error: any) {
    if (error?.name === 'AbortError') throw new Error('Timeout ao buscar snapshot do mapa');
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function loadBarracoTemplate(loader: GLTFLoader, modelUrl: string): Promise<THREE.Object3D> {
  const cached = modelPromiseCache.get(modelUrl);
  if (cached) return cached;
  const promise = new Promise<THREE.Object3D>((resolve, reject) => {
    loader.load(modelUrl, (gltf) => resolve(gltf.scene), undefined, (error) => reject(error));
  });
  modelPromiseCache.set(modelUrl, promise);
  return promise;
}

async function buildBarracoModel(
  loader: GLTFLoader, barracoLevel: number, tileSize: number
): Promise<{ model: THREE.Object3D; labelY: number }> {
  const modelUrl = getBarracoModelUrl(barracoLevel);
  const template = await loadBarracoTemplate(loader, modelUrl);
  const clone = template.clone(true);
  clone.traverse((child) => setMeshQuality(child));
  const { labelY } = fitModelToFootprint(clone, getBarracoTileFootprint(barracoLevel) * tileSize);
  return { model: clone, labelY };
}

function setEntryWorldPosition(
  entry: PlayerVisualEntry, tileX: number, tileY: number,
  gridWidth: number, gridHeight: number
) {
  const { worldX, worldZ } = tileToWorldCenter(tileX, tileY, gridWidth, gridHeight);
  entry.group.position.set(worldX, 0, worldZ);
  if (entry.spaceMesh) entry.spaceMesh.position.set(0, 0.06, 0);
  entry.modelContainer.position.set(0, 0, 0);
  if (entry.label) entry.label.position.set(0, entry.labelY, 0);
}

function createVisualEntry(tileSize: number, showSpaces: boolean): PlayerVisualEntry {
  const group = new THREE.Group();
  const spaceMesh = showSpaces ? createSpaceMesh(tileSize) : null;
  if (spaceMesh) group.add(spaceMesh);
  const modelContainer = new THREE.Group();
  group.add(modelContainer);
  return { id: '', group, spaceMesh, modelContainer, label: null, modelUrl: null, barracoLevel: 1, labelY: 3.5, tileX: 0, tileY: 0 };
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
  getMyId,
}: RealtimeMapPlayersLayerOptions): RealtimeMapPlayersLayer {
  const group = new THREE.Group();
  scene.add(group);

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  const entries = new Map<string, PlayerVisualEntry>();
  let pollingHandle: ReturnType<typeof setInterval> | null = null;
  let disposed = false;
  let refreshInFlight = false;

  async function ensureEntryVisual(entry: PlayerVisualEntry, snapshot: MapPlayerSnapshot) {
    const nextLevel = Number(snapshot.barracoLevel || 1);
    const nextUrl = getBarracoModelUrl(nextLevel);
    if (entry.modelUrl === nextUrl && entry.barracoLevel === nextLevel) return;
    const { model, labelY } = await buildBarracoModel(loader, nextLevel, tileSize);
    if (disposed) { disposeObject(model); return; }
    clearModelContainer(entry.modelContainer);
    entry.modelContainer.add(model);
    entry.modelUrl = nextUrl;
    entry.barracoLevel = nextLevel;
    entry.labelY = labelY;
    if (entry.label) entry.label.position.set(0, entry.labelY, 0);
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
    // ── FILTRO ANTI-DUPLICIDADE ──────────────────────────────────────────────
    // Remove o próprio jogador do snapshot REST para que seu barraco seja
    // renderizado exclusivamente via mountPlayerMapSpace (não aqui).
    const myId = getMyId?.() ?? null;
    const nextIds = new Set<string>();

    for (const snapshot of players) {
      const playerId = String(snapshot.id);

      // Pula o próprio jogador — evita barraco duplicado no mapa
      if (myId && playerId === myId) {
        console.log('⏭️ syncSnapshot: ignorando próprio jogador:', playerId);
        continue;
      }

      nextIds.add(playerId);

      let entry = entries.get(playerId);
      if (!entry) {
        entry = createVisualEntry(tileSize, showSpaces);
        entry.id = playerId;
        entries.set(playerId, entry);
        group.add(entry.group);
        updateEntryLabel(entry, snapshot);
      }

      // Salva o tile original
      entry.tileX = Number(snapshot.tileX ?? 0);
      entry.tileY = Number(snapshot.tileY ?? 0);

      setEntryWorldPosition(entry, entry.tileX, entry.tileY, gridWidth, gridHeight);

      if (!entry.label || entry.label.userData?.playerName !== (snapshot.name || 'Jogador')) {
        updateEntryLabel(entry, snapshot);
      }

      await ensureEntryVisual(entry, snapshot);
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

  async function refresh() {
    if (disposed || refreshInFlight) return;
    refreshInFlight = true;
    try {
      const players = await fetchMapPlayersSnapshot(limit);
      if (disposed) return;
      await syncSnapshot(players);
    } catch (error) {
      console.error('Erro ao atualizar players em tempo real no mapa:', error);
    } finally {
      refreshInFlight = false;
    }
  }

  function start() {
    if (pollingHandle || disposed) return;
    void refresh();
    pollingHandle = setInterval(() => { void refresh(); }, pollingMs);
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
    scene.remove(group);
  }

  function getPlayers(): MapPlayerSnapshot[] {
    return Array.from(entries.values()).map((entry) => {
      return {
        id: entry.id,
        name: entry.label?.userData?.playerName || 'Jogador',
        tileX: entry.tileX,
        tileY: entry.tileY,
        barracoLevel: entry.barracoLevel,
      };
    });
  }

  function tileToWorld(tileX: number, tileY: number) {
    return tileToWorldCenter(tileX, tileY, gridWidth, gridHeight);
  }

  async function upsertPlayer(snapshot: MapPlayerSnapshot) {
    if (disposed) {
      console.log('⚠️ upsertPlayer ignorado: layer foi descartado');
      return;
    }

    // ── FILTRO ANTI-DUPLICIDADE (guarda de segurança) ───────────────────────
    // O próprio jogador nunca deve ser inserido aqui.
    // Seu barraco é gerenciado exclusivamente por mountPlayerMapSpace.
    const myId = getMyId?.() ?? null;
    if (myId && String(snapshot.id) === myId) {
      console.log('⏭️ upsertPlayer ignorado: próprio jogador (guard getMyId)');
      return;
    }

    const playerId = String(snapshot.id);
    console.log('🎮 upsertPlayer chamado para:', playerId, 'em', snapshot.tileX, snapshot.tileY);

    let entry = entries.get(playerId);
    if (!entry) {
      console.log('✨ Criando nova entrada visual para:', playerId);
      entry = createVisualEntry(tileSize, showSpaces);
      entry.id = playerId;
      entries.set(playerId, entry);
      group.add(entry.group);
      updateEntryLabel(entry, snapshot);
    }

    // Salva o tile original
    entry.tileX = Number(snapshot.tileX ?? 0);
    entry.tileY = Number(snapshot.tileY ?? 0);

    setEntryWorldPosition(entry, entry.tileX, entry.tileY, gridWidth, gridHeight);

    if (!entry.label || entry.label.userData?.playerName !== (snapshot.name || 'Jogador')) {
      updateEntryLabel(entry, snapshot);
    }

    await ensureEntryVisual(entry, snapshot);

    // Marca o modelo com ID do jogador para raycasting
    entry.modelContainer.children.forEach((child: any) => {
      child.userData.playerId = playerId;
      child.traverse((subChild: any) => { subChild.userData.playerId = playerId; });
    });

    console.log('✅ upsertPlayer concluído para:', playerId, '| Total:', entries.size);
  }

  return { group, refresh, start, stop, cleanup, players: getPlayers, tileToWorld, upsertPlayer };
}
