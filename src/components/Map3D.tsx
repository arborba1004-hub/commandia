import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { usePlayerStore } from '@/store/playerStore';

// Configuração global do DRACOLoader (melhor performance no carregamento de GLB)
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const GRID_WIDTH = 40;
const GRID_HEIGHT = 20;
const TILE_SIZE = 1;
const PLATFORM_HEIGHT = 1.2;
const FLOOR_TEXTURE =
  'https://static.wixstatic.com/media/50f4bf_df004e568945465ba2231dc36addfe09~mv2.jpeg';

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
    BARRACO_MODELS.find((model) => level >= model.min && level <= model.max)?.url ??
    BARRACO_MODELS[0].url
  );
}

export default function Map3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // PUXANDO O JOGADOR DA STORE
  const playerState = usePlayerStore((state) => state.player);

  const level = playerState?.niveis?.barracoLevel || 1;

  const getBarracoSize = (level: number) => {
    if (level >= 60) return 4;
    if (level >= 30) return 3;
    return 2;
  };

  const barracoSize = getBarracoSize(level);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // ==================== DETECÇÃO DE DISPOSITIVO ====================
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // ==================== RENDERER OTIMIZADO ====================
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

    // ==================== CÂMERA E FOCO NO JOGADOR ====================
    const myTileX = playerState?.mapPosition?.tileX ?? (GRID_WIDTH / 2);
    const myTileY = playerState?.mapPosition?.tileY ?? (GRID_HEIGHT / 2);

    // Converte a posição do Grid para o mundo 3D
    const playerWorldX = (myTileX - GRID_WIDTH / 2) * TILE_SIZE;
    const playerWorldZ = (myTileY - GRID_HEIGHT / 2) * TILE_SIZE;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    // Agora o "alvo" da câmera é a casa do jogador, e não o centro do mapa (0,0,0)
    const cameraTarget = new THREE.Vector3(playerWorldX, 0, playerWorldZ);

    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };

    let zoomDistance = 28;
    const MIN_ZOOM = 12;
    const MAX_ZOOM = 60;

    let orbitAngle = Math.PI / 4;
    let orbitTilt = 0.62;

    const updateCamera = () => {
      const radius = zoomDistance;
      const y = radius * orbitTilt;
      
      // O cálculo da posição X e Z precisa somar a posição do alvo para a câmera orbitar em volta da base do jogador
      const x = cameraTarget.x + Math.cos(orbitAngle) * radius;
      const z = cameraTarget.z + Math.sin(orbitAngle) * radius;

      camera.position.set(x, y, z);
      camera.lookAt(cameraTarget);
    };

    const panSpeed = 0.003;
    const rotateSpeed = 0.01;

    const moveCamera = (deltaX: number, deltaY: number) => {
      orbitAngle -= deltaX * rotateSpeed;
      zoomDistance += deltaY * panSpeed * 100;

      zoomDistance = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomDistance));

      updateCamera();
    };

    updateCamera();

    // ==================== ILUMINAÇÃO ====================
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(8, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffe0b0, 2);
    fillLight.position.set(-15, 10, -10);
    scene.add(fillLight);

    // ==================== CARREGAMENTO DOS JOGADORES (BACKEND) ====================
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader); 
    const loadedPlayerModels: THREE.Object3D[] = [];

    fetch('https://comando-backend.onrender.com/players', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    })
      .then(res => res.json())
      .then(players => {
        players.forEach((p: any) => {
          const pLevel = p.barracoLevel || 1;
          const modelInfo = BARRACO_MODELS.find(m => pLevel >= m.min && pLevel <= m.max) || BARRACO_MODELS[0];

          loader.load(modelInfo.url, (gltf) => {
            const model = gltf.scene;

            // Escala e posição
            const sBox = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            sBox.getSize(size);
            const maxDimension = Math.max(size.x, size.z) || 1;
            const bSize = getBarracoSize(pLevel);
            model.scale.setScalar(bSize / maxDimension);

            const posX = (p.tileX - GRID_WIDTH / 2) * TILE_SIZE;
            const posZ = (p.tileY - GRID_HEIGHT / 2) * TILE_SIZE;

            model.position.set(posX, PLATFORM_HEIGHT / 2, posZ);

            model.traverse((child: any) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });

            scene.add(model);
            loadedPlayerModels.push(model);

            // SE FOR O JOGADOR ATUAL, COLOCA UM ANEL VERDE BRILHANTE EM VOLTA
            if (p.id === playerState?._id) {
              const ringGeometry = new THREE.RingGeometry(bSize * 0.5, bSize * 0.6, 32);
              const ringMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x10b981, // Cor Esmeralda
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
              });
              const highlightRing = new THREE.Mesh(ringGeometry, ringMaterial);
              highlightRing.rotation.x = -Math.PI / 2;
              highlightRing.position.set(posX, (PLATFORM_HEIGHT / 2) + 0.05, posZ);
              
              scene.add(highlightRing);
              loadedPlayerModels.push(highlightRing);
            }
          });
        });
      })
      .catch(err => console.error("Erro ao buscar vizinhos do mapa:", err));

    // ==================== CHÃO DO MAPA ====================
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
      sideMaterial, sideMaterial, topMaterial, sideMaterial, sideMaterial, sideMaterial,
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

    // ==================== CONTROLES (MOUSE / TOUCH) ====================
    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      moveCamera(e.clientX - previousMouse.x, e.clientY - previousMouse.y);
      previousMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => { isDragging = false; };

    let lastDistance = 0;
    const getDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        isDragging = false;
        lastDistance = getDistance(e.touches);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging) {
        moveCamera(e.touches[0].clientX - previousMouse.x, e.touches[0].clientY - previousMouse.y);
        previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const distance = getDistance(e.touches);
        if (lastDistance) {
          zoomDistance += (lastDistance - distance) * 0.02;
          zoomDistance = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomDistance));
          updateCamera();
        }
        lastDistance = distance;
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
      lastDistance = 0;
    };

    const handleWheel = (event: WheelEvent) => {
      zoomDistance += event.deltaY * 0.01;
      zoomDistance = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomDistance));
      updateCamera();
    };

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    container.addEventListener('wheel', handleWheel);
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    // ==================== LOOP DE RENDERIZAÇÃO ====================
    let animationId = 0;
    const animate = () => {
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);

      window.removeEventListener('resize', handleResize);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);

      // Limpeza segura da memória
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
    };
  }, []); // Deixamos o array vazio para o Three.js montar a cena apenas 1 vez

  return <div ref={containerRef} className="w-full h-full" />;
}
