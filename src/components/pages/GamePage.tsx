import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { usePlayerStore } from '@/store/playerStore';
import { useGangStore } from '@/store/gangStore';
import { handleTileInvasion } from '@/components/game/tileInvasion';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useMapAttackStore } from '@/store/mapAttackStore';
import { buildManhattanAttackRoute } from '@/components/game/mapAttackPath';
import {
  getAttackEstimate,
  startBattle,
  resolveBattleById,
} from '@/api/attackApi';
import { loadSquadModel } from '@/components/game/createSquadVisual';
import { animateSquadOnRoute } from '@/components/game/animateSquadOnRoute';
import {
  attachEnemyBarracoData,
  pickEnemyBarracoFromIntersections,
} from '@/components/game/EnemyBarracoSelector';
import { createImpactFlash, shakeObject } from '@/components/game/mapAttackEffects';
import { pushAttackFeed } from '@/components/game/mapAttackFeed';
import AttackResultOverlay from '@/components/game/AttackResultOverlay';
import { getPlayerRank, checkRankPromotion } from '@/utils/hierarchySystem';
import RankPromotionNotification from '@/components/RankPromotionNotification';
import Header from '@/components/Header';
import { fetchOtherPlayersMap } from '@/api/playersApi';
import MapTargetActionModal from '@/components/game/MapTargetActionModal';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const GRID_WIDTH = 120;
const GRID_HEIGHT = 120;
const TILE_SIZE = 1;
const PLATFORM_HEIGHT = 1.2;

const FLOOR_TEXTURE =
  'https://static.wixstatic.com/media/50f4bf_df004e568945465ba2231dc36addfe09~mv2.jpeg';

const BARRACO_MODELS = [
  { min: 1, max: 9, url: 'https://static.wixstatic.com/3d/50f4bf_78d8f707f621482698830308447c3ff2.glb' },
  { min: 10, max: 19, url: 'https://static.wixstatic.com/3d/50f4bf_e10d19cfeff147ce95eee1d04a31b04a.glb' },
  { min: 20, max: 29, url: 'https://static.wixstatic.com/3d/50f4bf_ad7304550b404996b3b82c425be28df8.glb' },
  { min: 30, max: 39, url: 'https://static.wixstatic.com/3d/50f4bf_d2c8efd640c24cabb3bda73016b7a6b7.glb' },
  { min: 40, max: 49, url: 'https://static.wixstatic.com/3d/50f4bf_0d7791cd61534906a7658b0599f1fcdd.glb' },
  { min: 50, max: 59, url: 'https://static.wixstatic.com/3d/50f4bf_efa8cf1ef0574d1a8fc0c80a894d4669.glb' },
];

const COMPLEXO_BUILDINGS = [
  {
    key: 'faccao',
    name: 'Facção',
    path: '/faccao',
    url: 'https://static.wixstatic.com/3d/50f4bf_cbaa982319094fbaa77f4bec142a6a30.glb',
    x: -26,
    z: -24,
    footprint: 6,
  },
  {
    key: 'luxury',
    name: 'Galeria',
    path: '/galeria',
    url: 'https://static.wixstatic.com/3d/50f4bf_cf2720eb5bf8455eb61feb001ecb6d44.glb',
    x: -8,
    z: -24,
    footprint: 6,
  },
  {
    key: 'fuga',
    name: 'Garagem Fuga',
    path: '/fuga-ilustrada',
    url: 'https://static.wixstatic.com/3d/50f4bf_0a1039e7f16c480b87ad52ed7183428d.glb',
    x: 10,
    z: -24,
    footprint: 6,
  },
  {
    key: 'suborno',
    name: 'Suborno',
    path: '/suborno-ilustrado',
    url: 'https://static.wixstatic.com/3d/50f4bf_45e197f9ee134edb83c942454e77bd16.glb',
    x: 28,
    z: -24,
    footprint: 6,
  },
  {
    key: 'home',
    name: 'Home',
    path: '/',
    url: 'https://static.wixstatic.com/3d/50f4bf_803533144e3e411ca8f83da3de514cd4.glb',
    x: -26,
    z: -6,
    footprint: 6,
  },
  {
    key: 'lavagem',
    name: 'Lavagem',
    path: '/lavagem-de-dinheiro',
    url: 'https://static.wixstatic.com/3d/50f4bf_67ec314b5e804d38926bb0bb0b89342f.glb',
    x: -8,
    z: -6,
    footprint: 6,
  },
  {
    key: 'giro',
    name: 'Cassino',
    path: '/giro',
    url: 'https://static.wixstatic.com/3d/50f4bf_ca4b6bff1e9a494d8f123219ea925720.glb',
    x: 10,
    z: -6,
    footprint: 6,
  },
  {
    key: 'arsenal',
    name: 'Arsenal',
    path: '/arsenal',
    url: 'https://static.wixstatic.com/3d/50f4bf_28e058f8bcc74daabc52cd7abf653245.glb',
    x: 28,
    z: -6,
    footprint: 6,
  },
];

function getBarracoModelUrl(level: number) {
  return (
    BARRACO_MODELS.find((model) => level >= model.min && level <= model.max)?.url ??
    BARRACO_MODELS[0].url
  );
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
  if (child.isMesh) {
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
  const playerBarracoRef = useRef<THREE.Object3D | null>(null);
  const publicBuildingsRef = useRef<THREE.Object3D[]>([]);
  const enemyBarracosRef = useRef<THREE.Object3D[]>([]);
  const enemyBarracoMapRef = useRef<Record<string, THREE.Object3D>>({});
  const squadRef = useRef<THREE.Object3D | null>(null);
  const activeAnimationRef = useRef<any>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const previousLevelRef = useRef<number | null>(null);

  const navigate = useNavigate();
  const previewOpen = useMapAttackStore((state) => state.previewOpen);
  const playerState = usePlayerStore((state) => state.player);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const loadPlayer = usePlayerStore((state) => state.loadPlayer);
  const startPolling = usePlayerStore((state) => state.startPolling);
  const stopPolling = usePlayerStore((state) => state.stopPolling);
  const applyRemoteAttackResult = usePlayerStore((state) => state.applyRemoteAttackResult);
  const addAttackHistoryItem = usePlayerStore((state) => state.addAttackHistoryItem);
  const addNotification = usePlayerStore((state) => state.addNotification);
  const gang = useGangStore((state) => state.gang);
  const getGangBattleStats = useGangStore((state) => state.getBattleStats);
  const applyBattleLossesToBackend = useGangStore(
    (state) => state.applyBattleLossesToBackend
  );
  const loadGang = useGangStore((state) => state.loadGang);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [otherPlayers, setOtherPlayers] = useState<any[]>([]);
  const [promotionRank, setPromotionRank] = useState<any>(null);
  const [showPromotion, setShowPromotion] = useState(false);
  const [isStartingBattle, setIsStartingBattle] = useState(false);
  const [activeBattleId, setActiveBattleId] = useState<string | null>(null);

  const level = playerState?.niveis?.barracoLevel || 1;
  const displayName =
    (playerState as any)?.headerCustomization?.customName ||
    playerState?.name ||
    '—';

  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Galeria', path: '/galeria' },
    { name: 'Giro', path: '/giro' },
    { name: 'Lavagem de Dinheiro', path: '/lavagem-de-dinheiro' },
    { name: 'Suborno Ilustrado', path: '/suborno-ilustrado' },
    { name: 'Delação Premiada', path: '/delacao-premiada' },
    { name: 'Arsenal', path: '/arsenal' },
    { name: 'Facção', path: '/faccao' },
    { name: 'Gangue', path: '/gang' },
    { name: 'Barraco', path: '/barraco' },
    { name: 'Fuga Ilustrada', path: '/fuga-ilustrada' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const getBarracoSize = (barracoLevel: number) => {
    if (barracoLevel >= 60) return 4;
    if (barracoLevel >= 30) return 3;
    return 2;
  };

  async function executeMapAttack() {
    const state = useMapAttackStore.getState();
    const scene = sceneRef.current;

    if (!scene || !state.origin || !state.target || isStartingBattle) return;

    try {
      setIsStartingBattle(true);

      const attackerGangMembers = gang?.members || [];
      const attackerGangStats = getGangBattleStats();
      const attackerCTLevel = gang?.ct?.level || 1;

      const startResponse = await startBattle({
        origin: state.origin,
        target: state.target,
      });

      setActiveBattleId(startResponse.battleId);

      const route = buildManhattanAttackRoute({
        fromTileX: state.origin.tileX,
        fromTileY: state.origin.tileY,
        toTileX: state.target.tileX,
        toTileY: state.target.tileY,
        includeOrigin: true,
      });

      if (!route.length) {
        setIsStartingBattle(false);
        return;
      }

      loadSquadModel((squad) => {
        const startX = (route[0].tileX - GRID_WIDTH / 2) * TILE_SIZE;
        const startZ = (route[0].tileY - GRID_HEIGHT / 2) * TILE_SIZE;

        squad.position.x = startX;
        squad.position.z = startZ;
        squad.position.y = 0.25;
        squad.rotation.y = Math.PI;

        const squadY = squad.position.y;

        scene.add(squad);
        squadRef.current = squad;

        useMapAttackStore.getState().startAttack({
          origin: state.origin,
          target: state.target,
          routeToTarget: route,
          routeBack: [...route].reverse(),
          squadWorldPosition: { x: startX, y: squadY, z: startZ },
        });

        activeAnimationRef.current = animateSquadOnRoute({
          squad,
          route,
          tileSize: TILE_SIZE,
          gridWidth: GRID_WIDTH,
          gridHeight: GRID_HEIGHT,
          y: squadY,
          onComplete: async () => {
            try {
              const report = await resolveBattleById(startResponse.battleId);
              useMapAttackStore.getState().setResolution(report.resolution);

              if (report?.resolution?.attackerGangLosses) {
                await applyBattleLossesToBackend(report.resolution.attackerGangLosses);
                await loadGang();
              }

              pushAttackFeed(
                report.resolution.success
                  ? `🔥 Você dominou ${report.defender.playerName}`
                  : `💀 ${report.defender.playerName} resistiu ao ataque`
              );

              const posX = (state.target.tileX - GRID_WIDTH / 2) * TILE_SIZE;
              const posZ = (state.target.tileY - GRID_HEIGHT / 2) * TILE_SIZE;

              createImpactFlash({
                scene,
                position: new THREE.Vector3(posX, 0.6, posZ),
              });

              const obj = enemyBarracoMapRef.current[state.target.playerId];
              if (obj) shakeObject(obj);

              applyRemoteAttackResult({
                dirtyMoneyDelta: report.resolution.success
                  ? report.resolution.loot
                  : -Math.floor((report.resolution.loot || 0) * 0.1),
                pvpProtectionUntil: null,
              });

              usePlayerStore.getState().removeCorre(10);

              addAttackHistoryItem({
                id: report.battleId,
                attackerId: report.attacker.playerId,
                attackerName: report.attacker.playerName,
                targetId: report.defender.playerId,
                targetName: report.defender.playerName,
                success: report.resolution.success,
                loot: report.resolution.loot || 0,
                createdAt: new Date().toISOString(),
              });

              addNotification({
                id: `battle_${report.battleId}`,
                type: report.resolution.success ? 'attack_success' : 'attack_failed',
                attackerId: report.attacker.playerId,
                attackerName: report.attacker.playerName,
                targetId: report.defender.playerId,
                targetName: report.defender.playerName,
                success: report.resolution.success,
                loot: report.resolution.loot || 0,
                createdAt: new Date().toISOString(),
                read: false,
              });

              window.setTimeout(() => {
                returnSquad();
              }, 800);
            } catch (error) {
              console.error('Erro ao resolver batalha:', error);
              finishAttack();
            } finally {
              setIsStartingBattle(false);
            }
          },
        });
      }, 20);
    } catch (error) {
      console.error('Erro ao iniciar batalha:', error);
      setIsStartingBattle(false);
    }
  }

  function returnSquad() {
    const state = useMapAttackStore.getState();
    const backRoute =
      state.routeBack && state.routeBack.length > 0
        ? state.routeBack
        : state.routeToTarget && state.routeToTarget.length > 0
        ? [...state.routeToTarget].reverse()
        : [];

    if (!squadRef.current || backRoute.length === 0) {
      finishAttack();
      return;
    }

    const squadY = squadRef.current.position.y;

    activeAnimationRef.current = animateSquadOnRoute({
      squad: squadRef.current,
      route: backRoute,
      tileSize: TILE_SIZE,
      gridWidth: GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
      y: squadY,
      onComplete: finishAttack,
    });
  }

  function finishAttack() {
    if (squadRef.current && sceneRef.current) {
      sceneRef.current.remove(squadRef.current);
      squadRef.current = null;
    }

    if (activeAnimationRef.current?.stop) {
      activeAnimationRef.current.stop();
    }

    activeAnimationRef.current = null;
    setActiveBattleId(null);
    useMapAttackStore.getState().finishAttack();
  }

  useEffect(() => {
    if (!isLoaded) {
      void loadPlayer();
    }
  }, [isLoaded, loadPlayer]);

useEffect(() => {
    const currentLevel = playerState?.niveis?.barracoLevel;
    if (!currentLevel) return;

    if (previousLevelRef.current === null) {
      previousLevelRef.current = currentLevel;
      return;
    }

    const previousLevel = previousLevelRef.current;

    if (currentLevel !== previousLevel) {
      const promotion = checkRankPromotion(previousLevel, currentLevel);
      if (promotion) {
        setPromotionRank(promotion);
        setShowPromotion(true);
      }
      previousLevelRef.current = currentLevel;
    }
  }, [playerState?.niveis?.barracoLevel]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token || !isLoaded) return;

    startPolling();
    return () => {
      stopPolling();
    };
  }, [isLoaded, startPolling, stopPolling]);

  const fetchOtherPlayers = useCallback(async () => {
    try {
      const data = await fetchOtherPlayersMap();

      const currentPlayerId =
        (playerState as any)?._id ||
        (playerState as any)?.id ||
        playerState?.googleId ||
        null;

      const filtered = data.filter(
        (p) => String(p.id || p._id) !== String(currentPlayerId)
      );

      setOtherPlayers(filtered);
    } catch (error) {
      console.error('Erro no polling de players:', error);
    }
  }, [playerState]);

  useEffect(() => {
    void fetchOtherPlayers();

    const playersInterval = setInterval(() => {
      void fetchOtherPlayers();
    }, 3000);

    return () => {
      clearInterval(playersInterval);
    };
  }, [fetchOtherPlayers]);

  useEffect(() => {
    if (!containerRef.current || !isLoaded) return;

    let isMounted = true;
    const container = containerRef.current;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    publicBuildingsRef.current = [];
    playerBarracoRef.current = null;
    enemyBarracosRef.current = [];
    enemyBarracoMapRef.current = {};

    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
      depth: true,
    });

    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#000000');

    const highlightGeometry = new THREE.PlaneGeometry(1, 1);
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });

    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.rotation.x = -Math.PI / 2;
    highlight.position.y = 0.05;
    highlight.visible = false;
    scene.add(highlight);

    const playerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff });
    const playerModel = new THREE.Mesh(playerGeometry, playerMaterial);
    playerModel.position.set(0, 0.3, 0);
    scene.add(playerModel);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const myTileX = playerState?.mapPosition?.tileX ?? 60;
    const myTileY = playerState?.mapPosition?.tileY ?? 60;

    const playerWorldX = (myTileX - GRID_WIDTH / 2) * TILE_SIZE;
    const playerWorldZ = (myTileY - GRID_HEIGHT / 2) * TILE_SIZE;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    const cameraTarget = new THREE.Vector3(playerWorldX, 1.2, playerWorldZ);
    camera.position.set(playerWorldX + 10, 11, playerWorldZ + 12);
    camera.lookAt(cameraTarget);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(cameraTarget);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 70;
    controls.update();

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(8, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffe0b0, 2);
    fillLight.position.set(-15, 10, -10);
    scene.add(fillLight);

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    const loadedObjects: THREE.Object3D[] = [];

    loader.load(
      getBarracoModelUrl(level),
      (gltf) => {
        if (!isMounted) return;

        const barraco = gltf.scene;
        const { labelY } = fitModelToFootprint(barraco, getBarracoSize(level));

        barraco.position.x = playerWorldX;
        barraco.position.z = playerWorldZ;
        barraco.traverse(setMeshQuality);

        barraco.userData.route = '/barraco';
        barraco.userData.type = 'player_barraco';
        playerBarracoRef.current = barraco;

        scene.add(barraco);
        loadedObjects.push(barraco);

        const playerRank = getPlayerRank(level);
        const label = createTextLabel(displayName, playerRank.title);
        label.position.set(playerWorldX, labelY, playerWorldZ);
        scene.add(label);
        loadedObjects.push(label);

        const reservedArea = new THREE.Mesh(
          new THREE.PlaneGeometry(4, 4),
          new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.22,
            side: THREE.DoubleSide,
          })
        );
        reservedArea.rotation.x = -Math.PI / 2;
        reservedArea.position.set(playerWorldX, 0.06, playerWorldZ);
        scene.add(reservedArea);
        loadedObjects.push(reservedArea);
      },
      undefined,
      (error) => console.error('❌ Erro crítico ao carregar o barraco:', error)
    );

    COMPLEXO_BUILDINGS.forEach((building) => {
      loader.load(
        building.url,
        (gltf) => {
          if (!isMounted) return;

          const model = gltf.scene;
          const { labelY } = fitModelToFootprint(model, building.footprint);

          model.position.x = building.x;
          model.position.z = building.z;
          model.traverse(setMeshQuality);

          model.userData.route = building.path;
          model.userData.type = 'public_building';
          model.userData.name = building.name;

          const label = createTextLabel(building.name);
          label.position.set(building.x, labelY, building.z);
          model.userData.nameLabel = label;

          scene.add(model);
          scene.add(label);

          publicBuildingsRef.current.push(model);
          loadedObjects.push(model);
          loadedObjects.push(label);
        },
        undefined,
        (error) => console.error(`❌ Erro ao carregar prédio ${building.name}:`, error)
      );
    });

    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load(FLOOR_TEXTURE);
    floorTexture.wrapS = THREE.ClampToEdgeWrapping;
    floorTexture.wrapT = THREE.ClampToEdgeWrapping;
    floorTexture.repeat.set(1, 1);

    const topMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 1,
      metalness: 0,
    });

    const sideMaterial = new THREE.MeshStandardMaterial({
      color: '#6e5742',
      roughness: 1,
      metalness: 0,
    });

    const platformGeometry = new THREE.BoxGeometry(GRID_WIDTH, PLATFORM_HEIGHT, GRID_HEIGHT);
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
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const publicHits = raycaster.intersectObjects(publicBuildingsRef.current, true);
      if (publicHits.length > 0) {
        let obj: THREE.Object3D | null = publicHits[0].object;
        while (obj && !obj.userData?.route) {
          obj = obj.parent;
        }
        if (obj?.userData?.route) {
          navigate(obj.userData.route);
          return;
        }
      }

      if (playerBarracoRef.current) {
        const ownHits = raycaster.intersectObject(playerBarracoRef.current, true);
        if (ownHits.length > 0) {
          navigate('/barraco');
          return;
        }
      }

      const enemyHits = raycaster.intersectObjects(enemyBarracosRef.current, true);
      const target = pickEnemyBarracoFromIntersections(enemyHits);

      if (target && playerState) {
        (async () => {
          try {
            const estimate = await getAttackEstimate(target);

            useMapAttackStore.getState().openPreview({
              origin: {
                playerId: playerState._id,
                playerName: playerState.name,
                tileX: playerState?.mapPosition?.tileX ?? 60,
                tileY: playerState?.mapPosition?.tileY ?? 60,
              },
              target,
              estimatedLoot: estimate.estimatedLoot,
              estimatedChance: estimate.estimatedChance / 100,
            });
          } catch (error) {
            console.error('Erro ao calcular estimativa de ataque:', error);
          }
        })();
        return;
      }

      const intersects = raycaster.intersectObject(platform);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const tileX = Math.floor(point.x + GRID_WIDTH / 2);
        const tileZ = Math.floor(point.z + GRID_HEIGHT / 2);

        highlight.visible = true;
        highlight.position.set(
          tileX - GRID_WIDTH / 2 + 0.5,
          0.05,
          tileZ - GRID_HEIGHT / 2 + 0.5
        );
        playerModel.position.set(
          tileX - GRID_WIDTH / 2 + 0.5,
          0.3,
          tileZ - GRID_HEIGHT / 2 + 0.5
        );

        void handleTileInvasion(tileX, tileZ, otherPlayers);
      }
    };

    let animationId = 0;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointerup', handlePointerUp);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationId);

      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointerup', handlePointerUp);

      controls.dispose();

      if (activeAnimationRef.current?.stop) {
        activeAnimationRef.current.stop();
      }

      if (sceneRef.current && squadRef.current) {
        sceneRef.current.remove(squadRef.current);
        squadRef.current = null;
      }

      publicBuildingsRef.current = [];
      playerBarracoRef.current = null;
      enemyBarracosRef.current = [];
      enemyBarracoMapRef.current = {};

      loadedObjects.forEach((obj) => {
        scene.remove(obj);
        obj.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => mat.dispose());
            } else if (mesh.material) {
              mesh.material.dispose();
            }
          }
        });
      });

      highlightGeometry.dispose();
      highlightMaterial.dispose();
      playerGeometry.dispose();
      playerMaterial.dispose();
      platformGeometry.dispose();
      topMaterial.dispose();
      sideMaterial.dispose();
      lineMaterial.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      sceneRef.current = null;
      rendererRef.current = null;
    };
  }, [
    isLoaded,
    navigate,
    playerState?._id,
    playerState?.mapPosition?.tileX,
    playerState?.mapPosition?.tileY,
    playerState?.niveis?.barracoLevel,
    (playerState as any)?.headerCustomization?.customName,
    playerState?.name,
  ]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    const currentIds = new Set(otherPlayers.map((p: any) => String(p.id || p._id)));

    Object.keys(enemyBarracoMapRef.current).forEach((playerId) => {
      if (!currentIds.has(playerId)) {
        const existing = enemyBarracoMapRef.current[playerId];
        if (existing) {
          scene.remove(existing);
          const label = existing.userData?.nameLabel;
          if (label) scene.remove(label);
          delete enemyBarracoMapRef.current[playerId];
          enemyBarracosRef.current = enemyBarracosRef.current.filter((obj) => obj !== existing);
        }
      }
    });

    otherPlayers.forEach((p: any) => {
      const playerId = String(p.id || p._id);
      const posX = (p.tileX - GRID_WIDTH / 2) * TILE_SIZE;
      const posZ = (p.tileY - GRID_HEIGHT / 2) * TILE_SIZE;
      const pLevel = p.barracoLevel || 1;
      const existing = enemyBarracoMapRef.current[playerId];

      if (existing) {
        existing.position.x = posX;
        existing.position.z = posZ;

        attachEnemyBarracoData(existing, {
          playerId,
          playerName: p.name || 'VIZINHO',
          tileX: p.tileX,
          tileY: p.tileY,
          barracoLevel: pLevel,
          power: p.power || 100,
          dirtyMoney: p.dirtyMoney || 100000,
          factionId: p.factionId ?? null,
        });

        const label = existing.userData?.nameLabel;
        if (label) {
          label.position.set(posX, label.position.y, posZ);
        }
        return;
      }

      loader.load(getBarracoModelUrl(pLevel), (gltf) => {
        const model = gltf.scene;
        const { labelY } = fitModelToFootprint(model, getBarracoSize(pLevel));

        model.position.set(posX, model.position.y, posZ);
        model.traverse(setMeshQuality);

        attachEnemyBarracoData(model, {
          playerId,
          playerName: p.name || 'VIZINHO',
          tileX: p.tileX,
          tileY: p.tileY,
          barracoLevel: pLevel,
          power: p.power || 100,
          dirtyMoney: p.dirtyMoney || 100000,
          factionId: p.factionId ?? null,
        });

        const label = createTextLabel(p.name || 'VIZINHO', getPlayerRank(pLevel).title);
        label.position.set(posX, labelY, posZ);
        model.userData.nameLabel = label;

        scene.add(model);
        scene.add(label);

        enemyBarracoMapRef.current[playerId] = model;
        enemyBarracosRef.current.push(model);
      });
    });

    return () => {
      enemyBarracosRef.current = enemyBarracosRef.current.filter((obj) =>
        currentIds.has(String(obj.userData?.playerId || obj.userData?.enemyBarracoData?.playerId))
      );
    };
  }, [otherPlayers]);

  if (!isLoaded || !playerState?._id) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black text-white flex items-center justify-center pt-[140px] md:pt-[160px]">
          Carregando mapa...
        </div>
      </>
    );
  }

  return (
    <div className="w-full h-full relative flex flex-col">
      <Header />

      <div className="flex-1 relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="absolute top-4 left-4 z-50 bg-primary text-primary-foreground p-2 rounded-lg hover:bg-opacity-90 transition-all"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {isMenuOpen && (
          <div className="absolute top-16 left-4 z-40 bg-background border border-primary rounded-lg shadow-lg p-4 max-w-xs max-h-96 overflow-y-auto">
            <h3 className="text-primary font-heading text-lg mb-4">Páginas</h3>
            <div className="grid grid-cols-1 gap-2">
              {pages.map((page) => (
                <button
                  key={page.path}
                  onClick={() => handleNavigate(page.path)}
                  className="w-full text-left px-4 py-2 rounded-lg bg-custom4 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-paragraph text-sm"
                >
                  {page.name}
                </button>
              ))}
            </div>
          </div>
        )}

       <AttackResultOverlay />

        <RankPromotionNotification
          rank={promotionRank}
          isVisible={showPromotion}
          onClose={() => setShowPromotion(false)}
        />

        <MapTargetActionModal
          isStartingBattle={isStartingBattle}
          onAttack={executeMapAttack}
        />

        <div
          ref={containerRef}
          className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
        />
      </div>
    </div>
  );
}