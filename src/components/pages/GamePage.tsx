import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { usePlayerStore } from '@/store/playerStore';
import { getPlayerRank } from '@/utils/hierarchySystem';
import { mountFixedMapBuildings } from '@/components/game/fixedMapBuildings';
import { mountRealtimeMapPlayersLayer } from '@/components/game/realtimeMapPlayersLayer';
import { fetchMapPlayersSnapshot } from '@/api/mapPlayersApi';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
);

const GRID_WIDTH = 120;
const GRID_HEIGHT = 120;
const TILE_SIZE = 1;
const PLATFORM_HEIGHT = 1.2;

const BARRACO_MODELS = [
  {
    min: 1,
    max: 9,
    url: 'https://static.wixstatic.com/3d/50f4bf_78d8f707f621482698830308447c3ff2.glb',
  },
  {
    min: 10,
    max: 19,
    url: 'https://static.wixstatic.com/3d/50f4bf_e10d19cfeff147ce95eee1d04a31b04a.glb',
  },
  {
    min: 20,
    max: 29,
    url: 'https://static.wixstatic.com/3d/50f4bf_ad7304550b404996b3b82c425be28df8.glb',
  },
  {
    min: 30,
    max: 39,
    url: 'https://static.wixstatic.com/3d/50f4bf_d2c8efd640c24cabb3bda73016b7a6b7.glb',
  },
  {
    min: 40,
    max: 49,
    url: 'https://static.wixstatic.com/3d/50f4bf_0d7791cd61534906a7658b0599f1fcdd.glb',
  },
  {
    min: 50,
    max: 59,
    url: 'https://static.wixstatic.com/3d/50f4bf_efa8cf1ef0574d1a8fc0c80a894d4669.glb',
  },
];

function getBarracoModelUrl(level: number) {
  return (
    BARRACO_MODELS.find((model) => level >= model.min && level <= model.max)
      ?.url ?? BARRACO_MODELS[0].url
  );
}

const LOT_SIZE_TILES = 8;
const FOUNDATION_HEIGHT = 0.18;

function getBarracoFootprintTiles(barracoLevel: number) {
  if (barracoLevel >= 60) return 4;
  if (barracoLevel >= 30) return 3;
  return 2;
}

function snapTileToLotOrigin(tile: number, maxTiles: number) {
  const numericTile = Number.isFinite(Number(tile)) ? Math.floor(Number(tile)) : 0;
  const snapped = Math.floor(numericTile / LOT_SIZE_TILES) * LOT_SIZE_TILES;
  return THREE.MathUtils.clamp(snapped, 0, maxTiles - LOT_SIZE_TILES);
}

function getLotCenterWorldPosition(tileX: number, tileY: number) {
  const originTileX = snapTileToLotOrigin(tileX, GRID_WIDTH);
  const originTileY = snapTileToLotOrigin(tileY, GRID_HEIGHT);

  return {
    worldX:
      (originTileX - GRID_WIDTH / 2) * TILE_SIZE +
      (LOT_SIZE_TILES * TILE_SIZE) / 2,
    worldZ:
      (originTileY - GRID_HEIGHT / 2) * TILE_SIZE +
      (LOT_SIZE_TILES * TILE_SIZE) / 2,
  };
}

function createTextLabel(text: string, rank?: string): THREE.Sprite | THREE.Group {
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

  const displayText = rank ? `${text.toUpperCase()} (${rank})` : text.toUpperCase();
  context.fillText(displayText, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(6, 1.35, 1);

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

export default function GamePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number>(0);
  const playerBarracoRef = useRef<THREE.Object3D | null>(null);
  const playerLabelRef = useRef<THREE.Sprite | THREE.Group | null>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mapBootError, setMapBootError] = useState<string | null>(null);
  const [mapMessage, setMapMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const playerState = usePlayerStore((state) => state.player);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const loadPlayer = usePlayerStore((state) => state.loadPlayer);

  const playerId =
    (playerState as any)?._id ||
    (playerState as any)?.id ||
    playerState?.googleId ||
    '';

  const barracoLevel = playerState?.niveis?.barracoLevel || 1;
  const tileX = playerState?.mapPosition?.tileX ?? 60;
  const tileY = playerState?.mapPosition?.tileY ?? 60;
  const displayName =
    (playerState as any)?.headerCustomization?.customName ||
    playerState?.name ||
    '—';

  useEffect(() => {
    if (!isLoaded) {
      void loadPlayer();
    }
  }, [isLoaded, loadPlayer]);

  useEffect(() => {
    if (!containerRef.current || !isLoaded || !playerId) return;

    const container = containerRef.current;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        depth: true,
        preserveDrawingBuffer: false,
      });
    } catch (error) {
      console.error('Erro ao inicializar WebGLRenderer:', error);
      setMapBootError('Falha ao iniciar o mapa 3D');
      return;
    }

    setMapBootError(null);

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isMobile ? 0.8 : Math.min(window.devicePixelRatio, 1.25));
    renderer.shadowMap.enabled = !isMobile;

    if (!isMobile) {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');

    const { worldX, worldZ } = getLotCenterWorldPosition(tileX, tileY);
    const barracoFootprintTiles = getBarracoFootprintTiles(barracoLevel);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    const cameraTarget = new THREE.Vector3(worldX, 0.8, worldZ);
    camera.position.set(worldX + 34, 42, worldZ + 34);
    camera.lookAt(cameraTarget);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(cameraTarget);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 18;
    controls.maxDistance = 150;
    controls.update();

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, isMobile ? 1.35 : 2.2);
    dirLight.position.set(8, 20, 10);
    dirLight.castShadow = !isMobile;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffe0b0, 2);
    fillLight.position.set(-15, 10, -10);
    scene.add(fillLight);

    const platformGeometry = new THREE.BoxGeometry(
      GRID_WIDTH,
      PLATFORM_HEIGHT,
      GRID_HEIGHT
    );

    const topMaterial = new THREE.MeshStandardMaterial({
      color: '#3f3428',
      roughness: 1,
      metalness: 0,
    });

    const sideMaterial = new THREE.MeshStandardMaterial({
      color: '#6e5742',
      roughness: 1,
      metalness: 0,
    });

    const platform = new THREE.Mesh(platformGeometry, [
      sideMaterial,
      sideMaterial,
      topMaterial,
      sideMaterial,
      sideMaterial,
      sideMaterial,
    ]);

    platform.position.set(0, -PLATFORM_HEIGHT / 2, 0);
    platform.receiveShadow = true;
    platform.castShadow = true;
    scene.add(platform);

    const gridGroup = new THREE.Group();
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.18,
    });

    for (let x = 0; x <= GRID_WIDTH; x++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x - GRID_WIDTH / 2, 0.03, -GRID_HEIGHT / 2),
        new THREE.Vector3(x - GRID_WIDTH / 2, 0.03, GRID_HEIGHT / 2),
      ]);
      gridGroup.add(new THREE.Line(geo, lineMaterial));
    }

    for (let z = 0; z <= GRID_HEIGHT; z++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-GRID_WIDTH / 2, 0.03, z - GRID_HEIGHT / 2),
        new THREE.Vector3(GRID_WIDTH / 2, 0.03, z - GRID_HEIGHT / 2),
      ]);
      gridGroup.add(new THREE.Line(geo, lineMaterial));
    }

    scene.add(gridGroup);

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    const showMapMessage = (message: string) => {
      setMapMessage(message);

      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }

      messageTimeoutRef.current = setTimeout(() => {
        setMapMessage(null);
      }, 1800);
    };

    loader.load(
      getBarracoModelUrl(barracoLevel),
      (gltf) => {
        const barraco = gltf.scene;
        const { labelY } = fitModelToFootprint(
          barraco,
          getBarracoSize(barracoLevel)
        );

        barraco.position.set(worldX, 0, worldZ);
        barraco.traverse((child) => setMeshQuality(child));
        barraco.userData.isPlayerBarraco = true;
        barraco.userData.route = '/barraco';

        playerBarracoRef.current = barraco;
        scene.add(barraco);

        const playerRank = getPlayerRank(barracoLevel);
        const label = createTextLabel(displayName, playerRank.title);
        label.position.set(worldX, labelY, worldZ);
        playerLabelRef.current = label;
        scene.add(label);
      },
      undefined,
      (error) => {
        console.error('Erro ao carregar barraco do jogador:', error);
        setMapBootError('Erro ao carregar o barraco do jogador');
      }
    );

    const fixedBuildingsLayer = mountFixedMapBuildings({
      scene,
      loader,
      camera,
      container,
      onNavigate: (path) => navigate(path),
      onMessage: (message) => showMapMessage(message),
    });

    const realtimePlayersLayer = mountRealtimeMapPlayersLayer({
      scene,
      camera,
      container,
      gridWidth: GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
      tileSize: TILE_SIZE,
      fetchPlayers: async () => {
        const players = await fetchMapPlayersSnapshot(1000);
        return players.filter((p) => String(p.id) !== String(playerId));
      },
      pollingIntervalMs: 5000,
      maxPlayers: 1000,
    });

    realtimePlayersLayer.start();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerDown = (event: PointerEvent) => {
      pointerDownPos = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!containerRef.current) return;

      const moveDistance =
        Math.abs(event.clientX - pointerDownPos.x) +
        Math.abs(event.clientY - pointerDownPos.y);

      if (moveDistance > 5) return;

      const rect = containerRef.current.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      if (playerBarracoRef.current) {
        const ownHits = raycaster.intersectObject(playerBarracoRef.current, true);
        if (ownHits.length > 0) {
          navigate('/barraco');
          return;
        }
      }

      fixedBuildingsLayer.tryHandleBuildingClick(event.clientX, event.clientY);

      const pickedPlayer = realtimePlayersLayer.tryPickPlayer(
        event.clientX,
        event.clientY
      );

      if (pickedPlayer) {
        showMapMessage(`Alvo: ${pickedPlayer.name || 'Jogador'} [${pickedPlayer.id}]`);
        return;
      }
    };

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;

      camera.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };

    window.addEventListener('resize', handleResize);
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointerup', handlePointerUp);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);

      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }

      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointerup', handlePointerUp);

      controls.dispose();
      fixedBuildingsLayer.cleanup();
      realtimePlayersLayer.cleanup();

      if (playerBarracoRef.current) {
        scene.remove(playerBarracoRef.current);
        playerBarracoRef.current = null;
      }

      if (playerLabelRef.current) {
        scene.remove(playerLabelRef.current);
        playerLabelRef.current = null;
      }

      platformGeometry.dispose();
      topMaterial.dispose();
      sideMaterial.dispose();
      lineMaterial.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      container.innerHTML = '';
    };
  }, [isLoaded, playerId, barracoLevel, tileX, tileY, displayName, navigate]);

  if (!isLoaded || !playerId) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black text-white flex items-center justify-center pt-[140px] md:pt-[160px]">
          Carregando mapa...
        </div>
      </>
    );
  }

  if (mapBootError) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black text-white flex items-center justify-center pt-[140px] md:pt-[160px]">
          {mapBootError}
        </div>
      </>
    );
  }

  return (
    <div className="relative min-h-screen bg-black">
      <Header />

      <div className="relative pt-[84px] md:pt-[96px]">
        {mapMessage && (
          <div className="pointer-events-none absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-[#d7a84a]/40 bg-black/75 px-4 py-2 text-sm font-bold text-[#f6d27b] shadow-lg">
            {mapMessage}
          </div>
        )}

        <div
          ref={containerRef}
          className="w-full h-[calc(100vh-84px)] md:h-[calc(100vh-96px)] outline-none"
        />
      </div>
    </div>
  );
}