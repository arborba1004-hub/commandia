import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { usePlayerStore } from '@/store/playerStore';

// IMPORTAÇÃO DAS UTILIDADES
import { fixDarkMaterials, createTextLabel, GRID_CONFIG } from './mapUtils';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const BARRACO_MODELS = [
  { min: 1, max: 9, url: 'https://static.wixstatic.com/3d/50f4bf_78d8f707f621482698830308447c3ff2.glb' },
  { min: 10, max: 19, url: 'https://static.wixstatic.com/3d/50f4bf_e10d19cfeff147ce95eee1d04a31b04a.glb' },
  { min: 20, max: 29, url: 'https://static.wixstatic.com/3d/50f4bf_ad7304550b404996b3b82c425be28df8.glb' },
  { min: 30, max: 39, url: 'https://static.wixstatic.com/3d/50f4bf_d2c8efd640c24cabb3bda73016b7a6b7.glb' },
  { min: 40, max: 49, url: 'https://static.wixstatic.com/3d/50f4bf_0d7791cd61534906a7658b0599f1fcdd.glb' },
  { min: 50, max: 59, url: 'https://static.wixstatic.com/3d/50f4bf_efa8cf1ef0574d1a8fc0c80a894d4669.glb' },
];

const FLOOR_TEXTURE = 'https://static.wixstatic.com/media/50f4bf_df004e568945465ba2231dc36addfe09~mv2.jpeg';

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
  const displayName = playerState?.headerCustomization?.customName || playerState?.name || 'CAPO GHOST';

  const getBarracoSize = (level: number) => {
    if (level >= 60) return 4;
    if (level >= 30) return 3;
    return 2;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    let isMounted = true; 
    const container = containerRef.current;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // 1. RENDERER
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

    // 2. ELEMENTOS DE CENA
    const highlight = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    );
    highlight.rotation.x = -Math.PI / 2;
    highlight.position.y = 0.05;
    highlight.visible = false;
    scene.add(highlight);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const myTileX = playerState?.mapPosition?.tileX ?? (GRID_CONFIG.WIDTH / 2);
    const myTileY = playerState?.mapPosition?.tileY ?? (GRID_CONFIG.HEIGHT / 2);
    const playerWorldX = (myTileX - GRID_CONFIG.WIDTH / 2) * GRID_CONFIG.TILE_SIZE;
    const playerWorldZ = (myTileY - GRID_CONFIG.HEIGHT / 2) * GRID_CONFIG.TILE_SIZE;

    // 3. CÂMERA E CONTROLES
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

    // 4. ILUMINAÇÃO
    scene.add(new THREE.AmbientLight(0xffffff, 2.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(8, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const loader = new GLTFLoader().setDRACOLoader(dracoLoader);
    const loadedPlayerModels: THREE.Object3D[] = [];

    // 5. CARREGAMENTO REUTILIZÁVEL (Bairros e Nomes)
    const spawnBarraco = (name: string, lvl: number, x: number, z: number, isMe: boolean) => {
      loader.load(getBarracoModelUrl(lvl), (gltf) => {
        if (!isMounted) return;
        const model = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const bSize = getBarracoSize(lvl);
        model.scale.setScalar(bSize / (Math.max(size.x, size.z) || 1));

        const finalBox = new THREE.Box3().setFromObject(model);
        model.position.set(x, -finalBox.min.y, z);
        model.traverse(fixDarkMaterials);
        scene.add(model);
        loadedPlayerModels.push(model);

        const label = createTextLabel(name);
        label.position.set(x, finalBox.max.y + 1.2, z);
        scene.add(label);
        loadedPlayerModels.push(label);

        if (isMe) {
          const reservedArea = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 4),
            new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
          );
          reservedArea.rotation.x = -Math.PI / 2;
          reservedArea.position.set(x, 0.06, z); 
          scene.add(reservedArea);
          loadedPlayerModels.push(reservedArea);
        }
      });
    };

    // Spawn Meu Barraco
    spawnBarraco(displayName, level, playerWorldX, playerWorldZ, true);

    // Carregar Outros Jogadores
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
          const posX = (p.tileX - GRID_CONFIG.WIDTH / 2) * GRID_CONFIG.TILE_SIZE;
          const posZ = (p.tileY - GRID_CONFIG.HEIGHT / 2) * GRID_CONFIG.TILE_SIZE;
          spawnBarraco(p.name, p.barracoLevel || 1, posX, posZ, false);
        });
      });
    }

    // 6. CHÃO E GRID
    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load(FLOOR_TEXTURE);
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;

    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(GRID_CONFIG.WIDTH, GRID_CONFIG.PLATFORM_Y, GRID_CONFIG.HEIGHT),
      [
        new THREE.MeshStandardMaterial({ color: '#6e5742' }),
        new THREE.MeshStandardMaterial({ color: '#6e5742' }),
        new THREE.MeshStandardMaterial({ map: floorTexture }),
        new THREE.MeshStandardMaterial({ color: '#6e5742' }),
        new THREE.MeshStandardMaterial({ color: '#6e5742' }),
        new THREE.MeshStandardMaterial({ color: '#6e5742' }),
      ]
    );
    platform.position.set(0, -GRID_CONFIG.PLATFORM_Y / 2, 0);
    platform.receiveShadow = true;
    scene.add(platform);

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 });
    for (let x = 0; x <= GRID_CONFIG.WIDTH; x++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x - GRID_CONFIG.WIDTH / 2, 0.03, -GRID_CONFIG.HEIGHT / 2),
        new THREE.Vector3(x - GRID_CONFIG.WIDTH / 2, 0.03, GRID_CONFIG.HEIGHT / 2),
      ]);
      scene.add(new THREE.Line(geo, lineMaterial));
    }
    for (let z = 0; z <= GRID_CONFIG.HEIGHT; z++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-GRID_CONFIG.WIDTH / 2, 0.03, z - GRID_CONFIG.HEIGHT / 2),
        new THREE.Vector3(GRID_CONFIG.WIDTH / 2, 0.03, z - GRID_CONFIG.HEIGHT / 2),
      ]);
      scene.add(new THREE.Line(geo, lineMaterial));
    }

    // 7. CLIQUES
    let pointerDownPos = { x: 0, y: 0 };
    const handlePointerDown = (event: PointerEvent) => { pointerDownPos = { x: event.clientX, y: event.clientY }; };
    const handlePointerUp = (event: PointerEvent) => {
      if (!containerRef.current) return;
      const moveDistance = Math.abs(event.clientX - pointerDownPos.x) + Math.abs(event.clientY - pointerDownPos.y);
      if (moveDistance > 5) return; 

      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(platform);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        highlight.visible = true;
        highlight.position.set(Math.floor(point.x + 0.5), 0.05, Math.floor(point.z + 0.5));
        
        // Espaço para lógica de teleporte/ação futura
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointerup', handlePointerUp);

    // 8. LOOP E CLEANUP
    let animationId = 0;
    const animate = () => {
      controls.update(); 
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false; 
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointerup', handlePointerUp);
      controls.dispose(); 
      loadedPlayerModels.forEach(model => scene.remove(model));
      renderer.dispose();
    };
  }, [playerState?.mapPosition, displayName]);

  return <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing outline-none" />;
}
