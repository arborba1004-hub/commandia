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

      const startResponse = await startBattle({
        targetId: state.target.playerId,
        targetName: state.target.playerName,
        targetTileX: state.target.tileX,
        targetTileY: state.target.tileY,
        originTileX: state.origin.tileX,
        originTileY: state.origin.tileY,
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

              await loadGang();

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
                  : -Math.floor((usePlayerStore.getState().player?.balances?.dirtyMoney || 0) * 0.05),
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

   