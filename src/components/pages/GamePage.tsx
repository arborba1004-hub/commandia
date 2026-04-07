import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
// IMPORTAÇÃO NOVA: O controle de câmera profissional
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { usePlayerStore } from '@/store/playerStore';
import { handleTileInvasion } from '@/components/game/tileInvasion';
import { createComplexoBuildings } from '@/components/map/createComplexoBuidings';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { initiateAttack, calculateGangBattlePower } from '@/api/attackApi';
import { useGangBattleStore } from '@/stores/gangBattleStore';
import { useGangStore } from '@/store/gangStore';
import { useMapAttackStore } from '@/store/mapAttackStore';
import { buildManhattanAttackRoute } from '@/components/game/mapAttackPath';
import { resolveMapAttack } from '@/components/game/mapAttackResolver';
import { loadSquadModel } from '@/components/game/createSquadVisual';
import { animateSquadOnRoute } from '@/components/game/animateSquadOnRoute';
import {
  attachEnemyBarracoData,
  pickEnemyBarracoFromIntersections,
} from '@/components/game/EnemyBarracoSelector';
import {
  createImpactFlash,
  shakeObject,
} from '@/components/game/mapAttackEffects';
import { pushAttackFeed } from '@/components/game/mapAttackFeed';
import AttackResultOverlay from '@/components/game/AttackResultOverlay';
import { useFactionStore } from '@/store/factionStore';




const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const GRID_WIDTH = 80;
const GRID_HEIGHT = 40;
const TILE_SIZE = 1;
const PLATFORM_HEIGHT = 1.2;
const FLOOR_TEXTURE =
  'https://static.wixstatic.com/media/50f4bf_df004e568945465ba2231dc36addfe09~mv2.jpeg';

const BARRACO_MODELS = [
  { min: 1, max: 9, url: 'https://static.wixstatic.com/3d/50f4bf_78d8f707f621482698830308447c3ff2.glb' },
  { min: 10, max: 19, url: 'https://static.wixstatic.com/3d/50f4bf_e10d19cfeff147ce95eee1d04a31b04a.glb' },
  { min: 20, max: 29, url: 'https://static.wixstatic.com/3d/50f4bf_ad7304550b404996b3b82c425be28df8.glb' },
  { min: 30, max: 39, url: 'https://static.wixstatic.com/3d/50f4bf_d2c8efd640c24cabb3bda73016b7a6b7.glb' },
  { min: 40, max: 49, url:  'https://static.wixstatic.com/3d/50f4bf_0d7791cd61534906a7658b0599f1fcdd.glb' },
  { min: 50, max: 59, url: 'https://static.wixstatic.com/3d/50f4bf_efa8cf1ef0574d1a8fc0c80a894d4669.glb' },
];

function getBarracoModelUrl(level: number) {
  return (
    BARRACO_MODELS.find((model) => level >= model.min && level <= model.max)?.url ??
    BARRACO_MODELS[0].url
  );
}

// === FUNÇÃO PARA CRIAR O NOME FLUTUANTE ===
function createTextLabel(text: string): THREE.Sprite | THREE.Group {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Group();

  canvas.width = 512;
  canvas.height = 128;

  context.fillStyle = 'rgba(0, 0, 0, 0.5)';
  context.roundRect(0, 0, 512, 128, 20);
  context.fill();

  context.font = 'bold 54px Oswald, Impact, Arial';
  context.textAlign = 'center';
  context.fillStyle = '#d9b764';
  context.fillText(text.toUpperCase(), 256, 85);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(3.2, 0.8, 1);
  return sprite;
}

export default function GamePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const enemyBarracosRef = useRef<THREE.Object3D[]>([]);
  const enemyBarracoMapRef = useRef<Record<string, THREE.Object3D>>({});
  const squadRef = useRef<THREE.Object3D | null>(null);
  const activeAnimationRef = useRef<any>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const previewOpen = useMapAttackStore((state) => state.previewOpen);

  // === FUNÇÃO DE ATAQUE ===
  function executeMapAttack() {
  const state = useMapAttackStore.getState();
  const scene = sceneRef.current;
  const isSameFaction = useFactionStore.getState().isSameFaction;

  if (!scene || !state.origin || !state.target) return;

  const targetId =
  state.target?.playerId ||
  state.target?.id ||
  state.target?._id;;

  if (targetId && isSameFaction(targetId)) {
    pushAttackFeed('🚫 Não pode atacar membro da sua facção');
    return;
  }

    const route = buildManhattanAttackRoute({
      fromTileX: state.origin.tileX,
      fromTileY: state.origin.tileY,
      toTileX: state.target.tileX,
      toTileY: state.target.tileY,
      includeOrigin: true,
    });

    if (!route.length) return;

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
        onComplete: () => {
          resolveCombat();
        },
      });
    }, 20);
  }

  async function resolveCombat() {
  const state = useMapAttackStore.getState();
  const scene = sceneRef.current;
  if (!state.target || !scene) return;

  // Obtém o ID do alvo (o backend espera targetId)
  const targetId = state.target.playerId || state.target.id;
  
  // Calcula o poder da gangue (apenas para exibição ou para enviar ao backend se quiser)
  const gangPower = calculateGangBattlePower();
  console.log('Poder da gangue:', gangPower);

  try {
    // Chama o backend (ou simulação) para processar o ataque
    const result = await initiateAttack(targetId);

    // Cria efeito visual de impacto
    const posX = (state.target.tileX - GRID_WIDTH / 2) * TILE_SIZE;
    const posZ = (state.target.tileY - GRID_HEIGHT / 2) * TILE_SIZE;
    createImpactFlash({ scene, position: new THREE.Vector3(posX, 0.6, posZ) });

    // Atualiza a store do jogador com os dados retornados (se o backend retornar o player atualizado)
    if (result.attacker) {
      usePlayerStore.getState().hydratePlayerFromServer(result.attacker);
    }

    // Registra o resultado na store de ataque
    useMapAttackStore.getState().setResolution({
      success: result.success,
      critical: result.critical,
      loot: result.loot,
      chance: result.chance,
      attackerPower: result.attackerPower,
      defenderPower: result.defenderPower,
      message: result.message,
      spoils: {
        dirtyMoneyLoot: result.success ? result.loot : 0,
        correLoot: 0,
        prestigeLoot: result.success ? 10 : 0,
        brokenLuxuryItemId: null,
        brokenLuxuryItemName: null,
        brokenLuxuryItemValue: null,
        luxuryConvertedDirtyMoney: 0,
      },
    });

    // Adiciona mensagem no feed
    pushAttackFeed(result.message);

    // Inicia o retorno do squad após um pequeno delay
    setTimeout(() => {
      returnSquad();
    }, 800);
  } catch (error) {
    console.error('Erro no ataque:', error);
    pushAttackFeed('❌ Erro ao processar ataque. Tente novamente.');
    // Em caso de erro, finaliza o ataque sem danos
    finishAttack();
  }
}

  // === FUNÇÃO PARA RETORNAR O SQUAD (FORA DO useEffect) ===
  function returnSquad() {
    const state = useMapAttackStore.getState();
    const backRoute = [...state.routeToTarget].reverse();

    if (!squadRef.current) return;

    const squadY = squadRef.current.position.y;

    activeAnimationRef.current = animateSquadOnRoute({
      squad: squadRef.current,
      route: backRoute,
      tileSize: TILE_SIZE,
      gridWidth: GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
      y: squadY,
      onComplete: () => {
        finishAttack();
      },
    });
  }

  // === FUNÇÃO PARA FINALIZAR O ATAQUE ===
  function finishAttack() {
    if (squadRef.current && sceneRef.current) {
      sceneRef.current.remove(squadRef.current);
      squadRef.current = null;
    }

    if (activeAnimationRef.current?.stop) {
      activeAnimationRef.current.stop();
    }

    activeAnimationRef.current = null;
    useMapAttackStore.getState().finishAttack();
  }

  const playerState = usePlayerStore((state) => state.player);
  const level = playerState?.niveis?.barracoLevel || 1;
  const displayName = playerState?.headerCustomization?.customName || playerState?.name || 'CAPO GHOST';

  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Galeria', path: '/galeria' },
    { name: 'Perfil', path: '/profile' },
    { name: 'Giro', path: '/giro' },
    { name: 'Luxo Showroom', path: '/luxuryshowroom' },
    { name: 'Lavagem de Dinheiro', path: '/lavagem-de-dinheiro' },
    { name: 'Suborno Ilustrado', path: '/suborno-ilustrado' },
    { name: 'Delação Premiada', path: '/delacao-premiada' },
    { name: 'Arsenal', path: '/arsenal' },
    { name: 'Armas', path: '/armas' },
    { name: 'Gang', path: '/gang' },
    { name: 'Barraco', path: '/barraco' },
    { name: 'Fuga Ilustrada', path: '/fuga-ilustrada' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const getBarracoSize = (level: number) => {
    if (level >= 60) return 4;
    if (level >= 30) return 3;
    return 2;
  };

  const barracoSize = getBarracoSize(level);


function getRandomSpawnPosition(existingPlayers: any[] = []) {
  const margin = 3;
  const minDistance = 2;

  let attempts = 0;
  let valid = false;

  let tileX = GRID_WIDTH / 2;
  let tileY = GRID_HEIGHT / 2;

  const centerX = GRID_WIDTH / 2;
  const centerY = GRID_HEIGHT / 2;

  while (!valid && attempts < 50) {
    tileX = Math.floor(Math.random() * (GRID_WIDTH - margin * 2)) + margin;
    tileY = Math.floor(Math.random() * (GRID_HEIGHT - margin * 2)) + margin;

    valid = true;

    // 🚫 NÃO NASCER NO CENTRO
    const distFromCenter = Math.sqrt(
      (tileX - centerX) ** 2 + (tileY - centerY) ** 2
    );

    if (distFromCenter < 6) {
      valid = false;
    }

    // 🚫 NÃO NASCER EM CIMA DE OUTROS
    for (const p of existingPlayers) {
      const dx = p.tileX - tileX;
      const dy = p.tileY - tileY;

      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        valid = false;
        break;
      }
    }

    attempts++;
  }

  return { tileX, tileY };
}

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    const container = containerRef.current;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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

    const myTileX = playerState?.mapPosition?.tileX ?? (GRID_WIDTH / 2);
    const myTileY = playerState?.mapPosition?.tileY ?? (GRID_HEIGHT / 2);

    const playerWorldX = (myTileX - GRID_WIDTH / 2) * TILE_SIZE;
    const playerWorldZ = (myTileY - GRID_HEIGHT / 2) * TILE_SIZE;

    // === NOVA CÂMERA E CONTROLES ORBIT ===
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    cameraRef.current = camera;

    // mirar no centro do complexo, não no jogador
    const cameraTarget = new THREE.Vector3(8, 0, 0);

    camera.position.set(26, 24, 18);
    camera.lookAt(cameraTarget);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(cameraTarget);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 70;

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

    const modelUrl = getBarracoModelUrl(level);
    let barraco: THREE.Object3D | null = null;
    const loadedPlayerModels: THREE.Object3D[] = [];

    // === TEMPORARY TEST: Load squad model ===
    loadSquadModel((model) => {
      model.position.x = playerWorldX + 2;
      model.position.z = playerWorldZ;
      model.position.y = 0.25;
      model.rotation.y = Math.PI;
      scene.add(model);
      loadedPlayerModels.push(model);
      console.log('TRIO TESTE carregado');
    }, 20);

    // === CARREGANDO OS EDIFÍCIOS DO COMPLEXO ===
    const complexoResult = createComplexoBuildings(loader);
    scene.add(complexoResult.group);
    loadedPlayerModels.push(complexoResult.group);

    complexoResult.load().catch(err => console.error('❌ Erro ao carregar edifícios do complexo:', err));

    const fixDarkMaterials = (child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.metalness = 0;
          child.material.roughness = 0.8;
          child.material.emissive = new THREE.Color(0x3a220f);
          child.material.emissiveIntensity = 0.2;
          child.material.needsUpdate = true;
        }
      }
    };

    // CARREGANDO O SEU BARRACO
    loader.load(
      modelUrl,
      (gltf) => {
        if (!isMounted) return;

        barraco = gltf.scene;
        const box = new THREE.Box3().setFromObject(barraco);
        const size = new THREE.Vector3();
        box.getSize(size);

        const maxDimension = Math.max(size.x, size.z) || 1;
        const scale = barracoSize / maxDimension;
        barraco.scale.setScalar(scale);

        const scaledBox = new THREE.Box3().setFromObject(barraco);
        const center = new THREE.Vector3();
        scaledBox.getCenter(center);
        barraco.position.sub(center);

        const finalBox = new THREE.Box3().setFromObject(barraco);
        barraco.position.y -= finalBox.min.y;

        barraco.position.x = playerWorldX;
        barraco.position.z = playerWorldZ;

        barraco.traverse(fixDarkMaterials);

        scene.add(barraco);
        loadedPlayerModels.push(barraco);

        // NOME DO JOGADOR LOGADO
        const label = createTextLabel(displayName);
        label.position.set(playerWorldX, finalBox.max.y + 1.2, playerWorldZ);
        scene.add(label);
        loadedPlayerModels.push(label);

        const reservedArea = new THREE.Mesh(
          new THREE.PlaneGeometry(4, 4),
          new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
        );
        reservedArea.rotation.x = -Math.PI / 2;
        reservedArea.position.set(playerWorldX, 0.06, playerWorldZ);

        scene.add(reservedArea);
        loadedPlayerModels.push(reservedArea);
      },
      undefined,
      (error) => console.error('❌ Erro crítico ao carregar o modelo:', error)
    );// CARREGANDO OS OUTROS JOGADORES DO BACKEND
    const token = localStorage.getItem('authToken');
    if (token) {
      fetch('https://comando-backend.onrender.com/players', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(players => {
          if (!isMounted) return;

          players.forEach((p: any) => {
            if (p.id === playerState?._id) return;

            const pLevel = p.barracoLevel || 1;
            const mInfo = BARRACO_MODELS.find(m => pLevel >= m.min && pLevel <= m.max) || BARRACO_MODELS[0];

            loader.load(mInfo.url, (gltf) => {
              if (!isMounted) return;
              const model = gltf.scene;

              const bSize = getBarracoSize(pLevel);
              const sBox = new THREE.Box3().setFromObject(model);
              const size = new THREE.Vector3();
              sBox.getSize(size);
              model.scale.setScalar(bSize / (Math.max(size.x, size.z) || 1));

              const posX = (p.tileX - GRID_WIDTH / 2) * TILE_SIZE;
              const posZ = (p.tileY - GRID_HEIGHT / 2) * TILE_SIZE;

              model.position.set(posX, 0, posZ);
              const sBoxFinal = new THREE.Box3().setFromObject(model);
              model.position.y -= sBoxFinal.min.y;

              model.traverse(fixDarkMaterials);

              scene.add(model);
              loadedPlayerModels.push(model);

              // REGISTRAR DADOS DO BARRACO INIMIGO
              attachEnemyBarracoData(model, {
                playerId: p.id || p._id,
                playerName: p.name || 'VIZINHO',
                tileX: p.tileX,
                tileY: p.tileY,
                barracoLevel: p.barracoLevel || 1,
                power: p.power || 100,
                dirtyMoney: p.dirtyMoney || 100000,
              });

              enemyBarracosRef.current.push(model);
              enemyBarracoMapRef.current[p.id || p._id] = model;

              // NOMES DOS VIZINHOS
              const vLabel = createTextLabel(p.name || 'VIZINHO');
              vLabel.position.set(posX, 3.5, posZ);
              scene.add(vLabel);
              loadedPlayerModels.push(vLabel);
            });
          });
        })
        .catch(err => console.error('❌ Erro ao buscar vizinhos do backend:', err));
    }

    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load(FLOOR_TEXTURE);
    floorTexture.wrapS = THREE.ClampToEdgeWrapping;
    floorTexture.wrapT = THREE.ClampToEdgeWrapping;
    floorTexture.repeat.set(1, 1);

    const topMaterial = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 1, metalness: 0 });
    const sideMaterial = new THREE.MeshStandardMaterial({ color: '#6e5742', roughness: 1, metalness: 0 });

    const platformGeometry = new THREE.BoxGeometry(GRID_WIDTH, PLATFORM_HEIGHT, GRID_HEIGHT);
    const platform = new THREE.Mesh(platformGeometry, [
      sideMaterial, sideMaterial, topMaterial, sideMaterial, sideMaterial, sideMaterial,
    ]);
    platform.position.set(0, -PLATFORM_HEIGHT / 2, 0);
    platform.receiveShadow = true;
    platform.castShadow = true;
    scene.add(platform);

    const gridGroup = new THREE.Group();
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 });

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

    // === SISTEMA DE CLIQUE INTELIGENTE ===
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerDown = (event: PointerEvent) => {
      pointerDownPos = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!containerRef.current) return;

      const moveDistance = Math.abs(event.clientX - pointerDownPos.x) + Math.abs(event.clientY - pointerDownPos.y);
      if (moveDistance > 5) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // 🔥 DETECÇÃO DE CLIQUE EM BARRACOS INIMIGOS (ANTES DO CLIQUE NO CHÃO)
      const enemyHits = raycaster.intersectObjects(enemyBarracosRef.current, true);
      const target = pickEnemyBarracoFromIntersections(enemyHits);

      if (target && playerState) {
        useMapAttackStore.getState().openPreview({
          origin: {
            playerId: playerState._id,
            playerName: playerState.name,
            tileX: playerState.mapPosition.tileX,
            tileY: playerState.mapPosition.tileY,
          },
          target,
          estimatedLoot: Math.floor((target.dirtyMoney || 0) * 0.2),
          estimatedChance: 0.6,
        });

        return;
      }

      const intersects = raycaster.intersectObject(platform);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        const tileX = Math.floor(point.x + GRID_WIDTH / 2);
        const tileZ = Math.floor(point.z + GRID_HEIGHT / 2);

        highlight.visible = true;
        highlight.position.set(tileX - GRID_WIDTH / 2 + 0.5, 0.05, tileZ - GRID_HEIGHT / 2 + 0.5);
        playerModel.position.set(tileX - GRID_WIDTH / 2 + 0.5, 0.3, tileZ - GRID_HEIGHT / 2 + 0.5);

        handleTileInvasion(tileX, tileZ);
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

      // Limpar disposables do complexo
      complexoResult.disposables.forEach(disposable => {
        if (disposable.dispose) {
          disposable.dispose();
        }
      });

      loadedPlayerModels.forEach(model => {
        scene.remove(model);
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(mat => mat.dispose());
            } else if (mesh.material) {
              mesh.material.dispose();
            }
          }
        });
      });

      platformGeometry.dispose();
      topMaterial.dispose();
      sideMaterial.dispose();
      lineMaterial.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();

      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
    };
  }, [playerState?.mapPosition?.tileX, playerState?.mapPosition?.tileY, playerState?._id, displayName]);

  return (
    <div className="w-full h-full relative">
      {/* Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="absolute top-4 left-4 z-50 bg-primary text-primary-foreground p-2 rounded-lg hover:bg-opacity-90 transition-all"
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Navigation Menu */}
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

      {/* Attack Result Overlay */}
      <AttackResultOverlay />

      {/* Invadir Barraco Modal */}
      {previewOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-end justify-center">
          <div className="w-full max-w-md rounded-t-3xl bg-[#090909] border border-red-500/30 p-5">
            <h2 className="text-2xl font-black text-white mb-4">
              Invadir barraco
            </h2>

            <div className="flex gap-3">
              <button
                onClick={() => useMapAttackStore.getState().closePreview()}
                className="flex-1 rounded-2xl bg-zinc-700 px-4 py-4 font-bold text-white"
              >
                Cancelar
              </button>

              <button
                onClick={executeMapAttack}
                className="flex-1 rounded-2xl bg-red-600 px-4 py-4 font-black text-white"
              >
                INVADIR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing outline-none" />
    </div>
  );
}