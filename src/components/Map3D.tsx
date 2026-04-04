import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { usePlayerStore } from '@/store/playerStore'; // <-- ADICIONADO

// Configuração global do DRACOLoader
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

export default function Map3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // <-- ADICIONADO: Puxando o jogador da Store
  const playerState = usePlayerStore((state) => state.player);

  // Pegando o nível real do jogador para o modelo base
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

    // MANTIDO: highlightGeometry original
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

    // MANTIDO: playerGeometry original (bolinha)
    const playerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff });
    const playerModel = new THREE.Mesh(playerGeometry, playerMaterial); // Renomeei para playerModel para não conflitar com a store
    playerModel.position.set(0, 0.3, 0);
    scene.add(playerModel);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };

    let zoomDistance = 28;
    const MIN_ZOOM = 12;
    const MAX_ZOOM = 60;

    let orbitAngle = Math.PI / 4;
    let orbitTilt = 0.62;

    // <-- ADICIONADO: Cálculo da posição inicial da câmera focada no jogador
    const myTileX = playerState?.mapPosition?.tileX ?? (GRID_WIDTH / 2);
    const myTileY = playerState?.mapPosition?.tileY ?? (GRID_HEIGHT / 2);
    const playerWorldX = (myTileX - GRID_WIDTH / 2) * TILE_SIZE;
    const playerWorldZ = (myTileY - GRID_HEIGHT / 2) * TILE_SIZE;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    // <-- ADICIONADO: O alvo da câmera agora é a posição do jogador
    const cameraTarget = new THREE.Vector3(playerWorldX, 0, playerWorldZ);

    const updateCamera = () => {
      const radius = zoomDistance;
      const y = radius * orbitTilt;
      // ADICIONADO: Soma a posição do alvo para focar e orbitar em volta
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

    // MANTIDO: Luzes originais
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

    // MANTIDO: Seu código original de carregamento do barraco principal e área laranja
    const modelUrl = getBarracoModelUrl(level);
    let barraco: THREE.Object3D | null = null;
    const loadedPlayerModels: THREE.Object3D[] = [];

    loader.load(
      modelUrl,
      (gltf) => {
        barraco = gltf.scene;

        const box = new THREE.Box3().setFromObject(barraco);
        const size = new THREE.Vector3();
        box.getSize(size);

        const maxDimension = Math.max(size.x, size.z) || 1;
        const reservedSize = 4;
        const visualSize = barracoSize;

        const scale = visualSize / maxDimension;
        barraco.scale.setScalar(scale);

        const scaledBox = new THREE.Box3().setFromObject(barraco);
        const center = new THREE.Vector3();
        scaledBox.getCenter(center);
        barraco.position.sub(center);

        const finalBox = new THREE.Box3().setFromObject(barraco);
        barraco.position.y -= finalBox.min.y;

        // ADICIONADO: Posicionando o SEU barraco principal baseado na API
        barraco.position.x = playerWorldX;
        barraco.position.z = playerWorldZ;
        barraco.position.y += PLATFORM_HEIGHT / 2; // Eleva para cima da plataforma

        barraco.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
              child.material.roughness = 0.7;
              child.material.metalness = 0;
              child.material.emissive = new THREE.Color(0x3a220f);
              child.material.emissiveIntensity = 0.35;
              child.material.needsUpdate = true;
            }
          }
        });

        scene.add(barraco);
        loadedPlayerModels.push(barraco);

        const reservedArea = new THREE.Mesh(
          new THREE.PlaneGeometry(reservedSize, reservedSize),
          new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.22,
            side: THREE.DoubleSide,
          })
        );

        reservedArea.rotation.x = -Math.PI / 2;
        // Posicionando a área reservada no seu barraco
        reservedArea.position.set(playerWorldX, PLATFORM_HEIGHT / 2 + 0.06, playerWorldZ);
        scene.add(reservedArea);
        loadedPlayerModels.push(reservedArea);
      },
      undefined,
      (error) => console.error('Erro ao carregar GLB:', error)
    );

    // <-- ADICIONADO: Buscar OS OUTROS jogadores (ignorando você, já que o seu código original carrega o seu)
    fetch('https://comando-backend.onrender.com/players', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    })
      .then(res => res.json())
      .then(players => {
        players.forEach((p: any) => {
          // Ignora o jogador logado, pois o modelo dele é carregado pela lógica acima
          if (p.id === playerState?._id) return;

          const pLevel = p.barracoLevel || 1;
          const modelInfo = BARRACO_MODELS.find(m => pLevel >= m.min && pLevel <= m.max) || BARRACO_MODELS[0];

          loader.load(modelInfo.url, (gltf) => {
            const model = gltf.scene;

            const bSize = getBarracoSize(pLevel);
            const sBox = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            sBox.getSize(size);
            const maxDimension = Math.max(size.x, size.z) || 1;
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
          });
        });
      })
      .catch(err => console.error("Erro ao buscar vizinhos do mapa:", err));

    // MANTIDO: Plataforma e Grid
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

    // MANTIDO: O Seu Click Handle Original
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObject(platform);

      if (intersects.length > 0) {
        const point = intersects[0].point;

        const tileX = Math.floor(point.x + GRID_WIDTH / 2);
        const tileZ = Math.floor(point.z + GRID_HEIGHT / 2);

        console.log('CLICK NO TILE:', tileX, tileZ);

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
      }
    };

    // MANTIDO: Controles e animações originais
    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMouse.x;
      const deltaY = e.clientY - previousMouse.y;
      moveCamera(deltaX, deltaY);
      previousMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

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

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID_WIDTH * 1.4, GRID_HEIGHT * 1.4),
      new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.28 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0, -PLATFORM_HEIGHT - 0.01, 0);
    scene.add(shadowPlane);

    let animationId = 0;
    const animate = () => {
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

    const handleWheel = (event: WheelEvent) => {
      zoomDistance += event.deltaY * 0.01;
      zoomDistance = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomDistance));
      updateCamera();
    };

    window.addEventListener('resize', handleResize);
    container.addEventListener('click', handleClick);
    container.addEventListener('wheel', handleWheel);
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      cancelAnimationFrame(animationId);

      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);

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
      shadowPlane.geometry.dispose();
      (shadowPlane.material as THREE.Material).dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [playerState?.mapPosition?.tileX, playerState?.mapPosition?.tileY, playerState?._id]);

  return <div ref={containerRef} className="w-full h-full" />;
}
