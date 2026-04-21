import * as THREE from 'three';

const LOT_SIZE_TILES = 8;
const FOUNDATION_HEIGHT = 0.18;

function snapTileToLotOrigin(tile: number, maxTiles: number) {
  const numericTile = Number.isFinite(Number(tile)) ? Math.floor(Number(tile)) : 0;
  const snapped = Math.floor(numericTile / LOT_SIZE_TILES) * LOT_SIZE_TILES;
  return Math.max(0, Math.min(maxTiles - LOT_SIZE_TILES, snapped));
}

function getLotWorldCenter(
  tileX: number,
  tileY: number,
  gridWidth: number,
  gridHeight: number,
  tileSize: number
) {
  const originTileX = snapTileToLotOrigin(tileX, gridWidth);
  const originTileY = snapTileToLotOrigin(tileY, gridHeight);

  return {
    worldX:
      (originTileX - gridWidth / 2) * tileSize +
      (LOT_SIZE_TILES * tileSize) / 2,
    worldZ:
      (originTileY - gridHeight / 2) * tileSize +
      (LOT_SIZE_TILES * tileSize) / 2,
  };
}

export type MapRemotePlayer = {
  id: string;
  name?: string;
  tileX: number;
  tileY: number;
  barracoLevel?: number;
  power?: number;
  factionId?: string | null;
};

type MountRealtimeMapPlayersLayerParams = {
  scene: THREE.Scene;
  camera: THREE.Camera;
  container: HTMLDivElement;
  gridWidth: number;
  gridHeight: number;
  tileSize: number;
  fetchPlayers: () => Promise<MapRemotePlayer[]>;
  pollingIntervalMs?: number;
  maxPlayers?: number;
};

export type RealtimeMapPlayersLayer = {
  start: () => void;
  stop: () => void;
  refreshNow: () => Promise<void>;
  cleanup: () => void;
  getPlayers: () => MapRemotePlayer[];
  tryPickPlayer: (clientX: number, clientY: number) => MapRemotePlayer | null;
};

function getHouseScale(level: number) {
  if (level >= 90) return 2.2;
  if (level >= 70) return 2.0;
  if (level >= 50) return 1.8;
  if (level >= 30) return 1.5;
  if (level >= 10) return 1.2;
  return 1.0;
}

function getWallColor(level: number) {
  if (level >= 90) return new THREE.Color('#d4af37');
  if (level >= 70) return new THREE.Color('#d98c2b');
  if (level >= 50) return new THREE.Color('#b86bff');
  if (level >= 30) return new THREE.Color('#44c0ff');
  if (level >= 10) return new THREE.Color('#5fbf72');
  return new THREE.Color('#7aa2ff');
}

function getRoofColor(level: number) {
  if (level >= 90) return new THREE.Color('#fff0a8');
  if (level >= 70) return new THREE.Color('#ffb347');
  if (level >= 50) return new THREE.Color('#d59cff');
  if (level >= 30) return new THREE.Color('#8ddcff');
  if (level >= 10) return new THREE.Color('#9be29f');
  return new THREE.Color('#c9825f');
}

function getLotColor(level: number) {
  if (level >= 90) return new THREE.Color('#ffe27a');
  if (level >= 70) return new THREE.Color('#ffb86c');
  if (level >= 50) return new THREE.Color('#caa6ff');
  if (level >= 30) return new THREE.Color('#93d9ff');
  if (level >= 10) return new THREE.Color('#88d89a');
  return new THREE.Color('#8ea4ff');
}

export function mountRealtimeMapPlayersLayer({
  scene,
  camera,
  container,
  gridWidth,
  gridHeight,
  tileSize,
  fetchPlayers,
  pollingIntervalMs = 5000,
  maxPlayers = 1200,
}: MountRealtimeMapPlayersLayerParams): RealtimeMapPlayersLayer {
  const root = new THREE.Group();
  root.name = 'realtime-map-players-layer';
  scene.add(root);

  const bodyGeometry = new THREE.BoxGeometry(1.8, 1.0, 1.6);
  const roofGeometry = new THREE.ConeGeometry(1.35, 0.95, 4);
  const lotGeometry = new THREE.BoxGeometry(
    LOT_SIZE_TILES * tileSize,
    FOUNDATION_HEIGHT,
    LOT_SIZE_TILES * tileSize
  );

  roofGeometry.rotateY(Math.PI / 4);

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: '#7aa2ff',
    roughness: 0.95,
    metalness: 0,
    emissive: new THREE.Color('#101010'),
    emissiveIntensity: 0.08,
  });

  const roofMaterial = new THREE.MeshStandardMaterial({
    color: '#c9825f',
    roughness: 0.95,
    metalness: 0,
    emissive: new THREE.Color('#120808'),
    emissiveIntensity: 0.08,
  });

  const lotMaterial = new THREE.MeshBasicMaterial({
    color: '#8ea4ff',
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const bodyMesh = new THREE.InstancedMesh(bodyGeometry, bodyMaterial, maxPlayers);
  const roofMesh = new THREE.InstancedMesh(roofGeometry, roofMaterial, maxPlayers);
  const lotMesh = new THREE.InstancedMesh(lotGeometry, lotMaterial, maxPlayers);

  bodyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  roofMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  lotMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  bodyMesh.frustumCulled = false;
  roofMesh.frustumCulled = false;
  lotMesh.frustumCulled = false;

  bodyMesh.castShadow = false;
  bodyMesh.receiveShadow = false;
  roofMesh.castShadow = false;
  roofMesh.receiveShadow = false;

  root.add(lotMesh);
  root.add(bodyMesh);
  root.add(roofMesh);

  const bodyDummy = new THREE.Object3D();
  const roofDummy = new THREE.Object3D();
  const lotDummy = new THREE.Object3D();

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let pollingTimer: ReturnType<typeof setInterval> | null = null;
  let requestInFlight = false;
  let players: MapRemotePlayer[] = [];

  const indexToPlayer = new Map<number, MapRemotePlayer>();

  function applyPlayersToScene(nextPlayers: MapRemotePlayer[]) {
    players = nextPlayers.slice(0, maxPlayers);
    indexToPlayer.clear();

    bodyMesh.count = players.length;
    roofMesh.count = players.length;
    lotMesh.count = players.length;

    for (let i = 0; i < players.length; i += 1) {
      const player = players[i];
      const level = player.barracoLevel || 1;
      const scale = getHouseScale(level);

      const { worldX, worldZ } = getLotWorldCenter(
        player.tileX,
        player.tileY,
        gridWidth,
        gridHeight,
        tileSize
      );

      bodyDummy.position.set(worldX, FOUNDATION_HEIGHT + 0.52 * scale, worldZ);
      bodyDummy.rotation.set(0, 0, 0);
      bodyDummy.scale.setScalar(scale);
      bodyDummy.updateMatrix();
      bodyMesh.setMatrixAt(i, bodyDummy.matrix);
      bodyMesh.setColorAt(i, getWallColor(level));

      roofDummy.position.set(worldX, FOUNDATION_HEIGHT + 1.42 * scale, worldZ);
      roofDummy.rotation.set(0, 0, 0);
      roofDummy.scale.setScalar(scale);
      roofDummy.updateMatrix();
      roofMesh.setMatrixAt(i, roofDummy.matrix);
      roofMesh.setColorAt(i, getRoofColor(level));

      lotDummy.position.set(worldX, FOUNDATION_HEIGHT / 2, worldZ);
      lotDummy.rotation.set(0, 0, 0);
      lotDummy.scale.setScalar(scale);
      lotDummy.updateMatrix();
      lotMesh.setMatrixAt(i, lotDummy.matrix);
      lotMesh.setColorAt(i, getLotColor(level));

      indexToPlayer.set(i, player);
    }

    bodyMesh.instanceMatrix.needsUpdate = true;
    roofMesh.instanceMatrix.needsUpdate = true;
    lotMesh.instanceMatrix.needsUpdate = true;

    if (bodyMesh.instanceColor) bodyMesh.instanceColor.needsUpdate = true;
    if (roofMesh.instanceColor) roofMesh.instanceColor.needsUpdate = true;
    if (lotMesh.instanceColor) lotMesh.instanceColor.needsUpdate = true;
  }

  async function refreshNow() {
    if (requestInFlight) return;
    if (document.visibilityState === 'hidden') return;

    requestInFlight = true;

    try {
      const nextPlayers = await fetchPlayers();
      applyPlayersToScene(Array.isArray(nextPlayers) ? nextPlayers : []);
    } catch (error) {
      console.error('Erro ao atualizar barracos remotos do mapa:', error);
    } finally {
      requestInFlight = false;
    }
  }

  function start() {
    stop();
    void refreshNow();

    pollingTimer = setInterval(() => {
      void refreshNow();
    }, pollingIntervalMs);
  }

  function stop() {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  }

  function tryPickPlayer(clientX: number, clientY: number): MapRemotePlayer | null {
    if (!players.length) return null;

    const rect = container.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const roofHits = raycaster.intersectObject(roofMesh, true);
    if (roofHits.length > 0) {
      const instanceId = roofHits[0].instanceId;
      if (instanceId !== undefined && instanceId !== null) {
        return indexToPlayer.get(instanceId) || null;
      }
    }

    const bodyHits = raycaster.intersectObject(bodyMesh, true);
    if (bodyHits.length > 0) {
      const instanceId = bodyHits[0].instanceId;
      if (instanceId !== undefined && instanceId !== null) {
        return indexToPlayer.get(instanceId) || null;
      }
    }

    return null;
  }

  function cleanup() {
    stop();

    scene.remove(root);

    bodyGeometry.dispose();
    roofGeometry.dispose();
    lotGeometry.dispose();
    bodyMaterial.dispose();
    roofMaterial.dispose();
    lotMaterial.dispose();

    indexToPlayer.clear();
    players = [];
  }

  return {
    start,
    stop,
    refreshNow,
    cleanup,
    getPlayers: () => players,
    tryPickPlayer,
  };
}