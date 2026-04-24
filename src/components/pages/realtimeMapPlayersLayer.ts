import * as THREE from 'three';

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

function getMarkerScale(level: number) {
  if (level >= 60) return 1.6;
  if (level >= 40) return 1.35;
  if (level >= 20) return 1.1;
  return 0.9;
}

function getLevelColor(level: number) {
  if (level >= 60) return new THREE.Color('#ffd700');
  if (level >= 40) return new THREE.Color('#ff9f43');
  if (level >= 20) return new THREE.Color('#7bed9f');
  return new THREE.Color('#70a1ff');
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

  const markerGeometry = new THREE.CylinderGeometry(0.35, 0.55, 1.2, 8, 1);
  const markerMaterial = new THREE.MeshStandardMaterial({
    color: '#70a1ff',
    roughness: 0.9,
    metalness: 0,
    emissive: new THREE.Color('#101010'),
    emissiveIntensity: 0.1,
  });

  const markersMesh = new THREE.InstancedMesh(
    markerGeometry,
    markerMaterial,
    maxPlayers
  );
  markersMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  markersMesh.castShadow = false;
  markersMesh.receiveShadow = false;
  root.add(markersMesh);

  const haloGeometry = new THREE.RingGeometry(0.42, 0.62, 18);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const haloMesh = new THREE.InstancedMesh(haloGeometry, haloMaterial, maxPlayers);
  haloMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  root.add(haloMesh);

  const dummy = new THREE.Object3D();
  const haloDummy = new THREE.Object3D();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let pollingTimer: ReturnType<typeof setInterval> | null = null;
  let requestInFlight = false;
  let players: MapRemotePlayer[] = [];

  const idToIndex = new Map<string, number>();
  const indexToPlayer = new Map<number, MapRemotePlayer>();

  function applyPlayersToScene(nextPlayers: MapRemotePlayer[]) {
    players = nextPlayers.slice(0, maxPlayers);
    idToIndex.clear();
    indexToPlayer.clear();

    markersMesh.count = players.length;
    haloMesh.count = players.length;

    for (let i = 0; i < players.length; i += 1) {
      const player = players[i];
      const level = player.barracoLevel || 1;
      const scale = getMarkerScale(level);
      const color = getLevelColor(level);

      const worldX = (player.tileX - gridWidth / 2) * tileSize + 0.5;
      const worldZ = (player.tileY - gridHeight / 2) * tileSize + 0.5;

      dummy.position.set(worldX, 0.6 * scale, worldZ);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();

      markersMesh.setMatrixAt(i, dummy.matrix);
      markersMesh.setColorAt(i, color);

      haloDummy.position.set(worldX, 0.04, worldZ);
      haloDummy.rotation.set(-Math.PI / 2, 0, 0);
      haloDummy.scale.setScalar(scale);
      haloDummy.updateMatrix();
      haloMesh.setMatrixAt(i, haloDummy.matrix);

      const haloColor = color.clone().lerp(new THREE.Color('#ffffff'), 0.35);
      haloMesh.setColorAt(i, haloColor);

      idToIndex.set(player.id, i);
      indexToPlayer.set(i, player);
    }

    markersMesh.instanceMatrix.needsUpdate = true;
    haloMesh.instanceMatrix.needsUpdate = true;

    if (markersMesh.instanceColor) {
      markersMesh.instanceColor.needsUpdate = true;
    }

    if (haloMesh.instanceColor) {
      haloMesh.instanceColor.needsUpdate = true;
    }
  }

  async function refreshNow() {
    if (requestInFlight) return;
    if (document.visibilityState === 'hidden') return;

    requestInFlight = true;

    try {
      const nextPlayers = await fetchPlayers();
      applyPlayersToScene(Array.isArray(nextPlayers) ? nextPlayers : []);
    } catch (error) {
      console.error('Erro ao atualizar layer de players do mapa:', error);
    } finally {
      requestInFlight = false;
    }
  }

  function start() {
    // CRITICAL: Only start polling in browser environment, never during build/SSR
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    stop();
    void refreshNow();

    // Set a maximum polling duration to prevent infinite loops
    const maxPollingDuration = 30 * 60 * 1000; // 30 minutes
    let pollingStartTime = Date.now();

    pollingTimer = setInterval(() => {
      // Stop polling if it's been running too long
      if (Date.now() - pollingStartTime > maxPollingDuration) {
        stop();
        return;
      }
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

    const hits = raycaster.intersectObject(markersMesh, true);
    if (!hits.length) return null;

    const instanceId = hits[0].instanceId;
    if (instanceId === undefined || instanceId === null) return null;

    return indexToPlayer.get(instanceId) || null;
  }

  function cleanup() {
    stop();

    scene.remove(root);

    markerGeometry.dispose();
    haloGeometry.dispose();
    markerMaterial.dispose();
    haloMaterial.dispose();

    idToIndex.clear();
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