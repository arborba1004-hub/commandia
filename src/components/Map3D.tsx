import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { usePlayerStore } from '@/store/playerStore';

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

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };
    let zoomDistance = 28;
    const MIN_ZOOM = 12;
    const MAX_ZOOM = 60;
    let orbitAngle = Math.PI / 4;
    let orbitTilt = 0.62;

    const myTileX = playerState?.mapPosition?.tileX ?? (GRID_WIDTH / 2);
    const myTileY = playerState?.mapPosition?.tileY ?? (GRID_HEIGHT / 2);

    const playerWorldX = (myTileX - GRID_WIDTH / 2) * TILE_SIZE;
    const playerWorldZ = (myTileY - GRID_HEIGHT / 2) * TILE_SIZE;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    const cameraTarget = new THREE.Vector3(playerWorldX, 0, playerWorldZ);

    const updateCamera = () => {
      const radius = zoomDistance;
      const y = radius * orbitTilt;
      const x = cameraTarget.x + Math.cos(orbitAngle) * radius;
      const z = cameraTarget.z + Math.sin(orbitAngle) * radius;

      camera.position.set(x, y, z);
      camera.lookAt(cameraTarget);
    };

    const moveCamera = (deltaX: number, deltaY: number) => {
      orbitAngle -= deltaX * 0.01;
      zoomDistance += deltaY * 0.3;
      zoomDistance = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomDistance));
      updateCamera();
    };

    updateCamera();

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

    // FUNÇÃO PARA CLAREAR MATERIAIS (Tira o reflexo preto e dá brilho)
    const fixDarkMaterials = (child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.metalness = 0; // Tira o reflexo escuro
          child.material.roughness = 0.8; // Deixa mais fosco/natural
          child.material.emissive = new THREE.Color(0x3a220f); // Dá uma luzinha própria quente
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

        // APLICA O CLAREAMENTO AQUI
        barraco.traverse(fixDarkMaterials);

        scene.add(barraco);
        loadedPlayerModels.push(barraco);

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

              // APLICA O CLAREAMENTO NOS OUTROS JOGADORES TAMBÉM
              model.traverse(fixDarkMaterials);
  
              scene.add(model);
              loadedPlayerModels.push(model);
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
        
        highlight.visible = true;
        highlight.position.set(tileX - GRID_WIDTH / 2 + 0.5, 0.05, tileZ - GRID_HEIGHT / 2 + 0.5);
      }
    };

    const handleMouseDown = (e: MouseEvent) => { isDragging = true; previousMouse = { x: e.clientX, y: e.clientY }; };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      moveCamera(e.clientX - previousMouse.x, e.clientY - previousMouse.y);
      previousMouse = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUp = () => { isDragging = false; };

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

    return () => {
      isMounted = false; 
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);

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
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [playerState?.mapPosition?.tileX, playerState?.mapPosition?.tileY, playerState?._id]);

  return <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
}
