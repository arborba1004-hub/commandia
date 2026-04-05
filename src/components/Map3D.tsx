
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
// IMPORTAÇÃO NOVA: O controle de câmera profissional
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { handleTileInvasion, worldToTileCoordinates, OtherPlayer } from '@/components/game/tileInvasion';
import { createComplexoBuildings, type ComplexoBuildingHitbox } from '@/components/map/createComplexoBuildings';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const GRID_WIDTH = 40;
const GRID_HEIGHT = 20;
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

function getBarracoModelUrl(level: number) {
  return (
    BARRACO_MODELS.find((model) => level >= model.min && level <= model.max)?.url ??
    BARRACO_MODELS[0].url
  );
}

// === FUNÇÃO PARA CRIAR O NOME FLUTUANTE ===
function createTextLabel(text: string) {
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
  context.fillStyle = '#d9b764'; // Cor dourada padrão
  context.fillText(text.toUpperCase(), 256, 85);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(3.2, 0.8, 1);
  return sprite;
}

export default function Map3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const playerState = usePlayerStore((state) => state.player);
  const level = playerState?.niveis?.barracoLevel || 1;
  const displayName = playerState?.headerCustomization?.customName || playerState?.name || 'CAPO GHOST';

  const getBarracoSize = (level: number) => {
    if (level >= 60) return 4;
    if (level >= 30) return 3;
    return 2;
  };

  const barracoSize = getBarracoSize(level);

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

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
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
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    const cameraTarget = new THREE.Vector3(playerWorldX, 0, playerWorldZ);
    
    camera.position.set(cameraTarget.x + 15, 18, cameraTarget.z + 15);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(cameraTarget); 
    controls.enableDamping = true; 
    controls.dampingFactor = 0.05; 
    controls.maxPolarAngle = Math.PI / 2 - 0.05; 
    controls.minDistance = 8; 
    controls.maxDistance = 50; 

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

    const complexoBuildings = createComplexoBuildings(loader);

    scene.add(complexoBuildings.group);
    loadedPlayerModels.push(complexoBuildings.group);
    cleanupDisposables.push(...complexoBuildings.disposables);

    complexoBuildings
      .load()
      .then(() => {
        if (!isMounted) return;

        complexoBuildings.clickableMeshes.forEach((item) => {
          clickableBuildingMeshes.push(item.mesh);
          clickableBuildingMeta.set(item.mesh, item);
        });
      })
      .catch((error) => {
        console.error('❌ Erro ao carregar prédios do complexo:', error);
      });

    // ... keep existing code (CARREGANDO O SEU BARRACO section)
    let barraco: THREE.Object3D | null = null;
    const loadedPlayerModels: THREE.Object3D[] = [];
    const clickableBuildingMeshes: THREE.Object3D[] = [];
    const clickableBuildingMeta = new Map<THREE.Object3D, ComplexoBuildingHitbox>();
    const cleanupDisposables: Array<any> = [];

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
    );

    // CARREGANDO OS OUTROS JOGADORES DO BACKEND
    let otherPlayersData: OtherPlayer[] = [];
    const token = localStorage.getItem('authToken');
    if (token) {
      fetch('https://comando-backend.onrender.com/players', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(players => {
          if (!isMounted) return;

          // Store other players data for tile availability check
          otherPlayersData = players
            .filter((p: any) => p.id !== playerState?._id)
            .map((p: any) => ({
              id: p.id,
              tileX: p.tileX,
              tileY: p.tileY,
              name: p.name
            }));

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

              // NOMES DOS VIZINHOS
              const vLabel = createTextLabel(p.name || 'VIZINHO');
              vLabel.position.set(posX, 3.5, posZ);
              scene.add(vLabel);
              loadedPlayerModels.push(vLabel);
            });
          });
        })
        .catch(err => console.error("❌ Erro ao buscar vizinhos do backend:", err));
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

      const moveDistance =
        Math.abs(event.clientX - pointerDownPos.x) +
        Math.abs(event.clientY - pointerDownPos.y);

      if (moveDistance > 5) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // 1) Primeiro verifica prédios clicáveis
      if (clickableBuildingMeshes.length > 0) {
        const buildingIntersects = raycaster.intersectObjects(clickableBuildingMeshes, false);

        if (buildingIntersects.length > 0) {
          const clickedMesh = buildingIntersects[0].object;
          const clickedBuilding = clickableBuildingMeta.get(clickedMesh);

          if (clickedBuilding?.route) {
            navigate(clickedBuilding.route);
            return;
          }
        }
      }

      // 2) Se não clicou em prédio, trata como clique no chão
      const floorIntersects = raycaster.intersectObject(platform);

      if (floorIntersects.length > 0) {
        const point = floorIntersects[0].point;

        const rawTileX = Math.floor(point.x + GRID_WIDTH / 2);
        const rawTileZ = Math.floor(point.z + GRID_HEIGHT / 2);

        const tileX = THREE.MathUtils.clamp(rawTileX, 0, GRID_WIDTH - 1);
        const tileZ = THREE.MathUtils.clamp(rawTileZ, 0, GRID_HEIGHT - 1);

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

        handleTileInvasion(tileX, tileZ, otherPlayersData);
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

      // Dispose specific geometries and materials
      highlightGeometry.dispose();
      highlightMaterial.dispose();
      playerGeometry.dispose();
      playerMaterial.dispose();
      floorTexture.dispose();

      // Dispose loaded player models
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

      // Dispose cleanup disposables with comprehensive handling
      cleanupDisposables.forEach((item) => {
        if (!item) return;

        if (item instanceof THREE.Texture) {
          item.dispose();
          return;
        }

        if (item instanceof THREE.Material) {
          item.dispose();
          return;
        }

        if ((item as any).isObject3D) {
          (item as THREE.Object3D).traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (!mesh.isMesh) return;

            if (mesh.geometry) mesh.geometry.dispose();

            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => mat.dispose());
            } else if (mesh.material) {
              mesh.material.dispose();
            }
          });
        }
      });

      platformGeometry.dispose();
      topMaterial.dispose();
      sideMaterial.dispose();
      lineMaterial.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [playerState?.mapPosition?.tileX, playerState?.mapPosition?.tileY, playerState?._id, displayName, level, navigate]);

  return <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing outline-none" />;
}