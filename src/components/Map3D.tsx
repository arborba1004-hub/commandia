import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { usePlayerStore } from '@/store/playerStore';

// IMPORTAÇÃO DAS SUAS UTILIDADES (Certifique-se que o arquivo mapUtils.ts está na mesma pasta)
import { fixDarkMaterials, createTextLabel, GRID_CONFIG } from './mapUtils';

// CONFIGURAÇÃO TÉCNICA DO LOADER
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const FLOOR_TEXTURE = 'https://static.wixstatic.com/media/50f4bf_df004e568945465ba2231dc36addfe09~mv2.jpeg';

const BARRACO_MODELS = [
  { min: 1, max: 9, url: 'https://static.wixstatic.com/3d/50f4bf_78d8f707f621482698830308447c3ff2.glb' },
  { min: 10, max: 19, url: 'https://static.wixstatic.com/3d/50f4bf_e10d19cfeff147ce95eee1d04a31b04a.glb' },
  { min: 20, max: 29, url: 'https://static.wixstatic.com/3d/50f4bf_ad7304550b404996b3b82c425be28df8.glb' },
  { min: 30, max: 39, url: 'https://static.wixstatic.com/3d/50f4bf_d2c8efd640c24cabb3bda73016b7a6b7.glb' },
  { min: 40, max: 49, url: 'https://static.wixstatic.com/3d/50f4bf_0d7791cd61534906a7658b0599f1fcdd.glb' },
  { min: 50, max: 59, url: 'https://static.wixstatic.com/3d/50f4bf_efa8cf1ef0574d1a8fc0c80a894d4669.glb' },
];

function getBarracoUrl(level: number) {
  return BARRACO_MODELS.find((m) => level >= m.min && level <= m.max)?.url ?? BARRACO_MODELS[0].url;
}

export default function Map3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerState = usePlayerStore((state) => state.player);
  
  const displayName = playerState?.headerCustomization?.customName || playerState?.name || 'CAPO GHOST';
  const myLevel = playerState?.niveis?.barracoLevel || 1;

  useEffect(() => {
    if (!containerRef.current) return;
    
    let isMounted = true; 
    const container = containerRef.current;

    // 1. RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');

    // 2. CÁLCULO DE POSIÇÃO INICIAL (Baseado no GRID_CONFIG)
    const myTileX = playerState?.mapPosition?.tileX ?? 20;
    const myTileY = playerState?.mapPosition?.tileY ?? 10;
    const worldX = (myTileX - GRID_CONFIG.WIDTH / 2) * GRID_CONFIG.TILE_SIZE;
    const worldZ = (myTileY - GRID_CONFIG.HEIGHT / 2) * GRID_CONFIG.TILE_SIZE;

    // 3. CÂMERA E FOCO
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    const cameraTarget = new THREE.Vector3(worldX, 0, worldZ);
    camera.position.set(cameraTarget.x + 15, 18, cameraTarget.z + 15);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(cameraTarget); 
    controls.enableDamping = true; 
    controls.maxPolarAngle = Math.PI / 2 - 0.1; 

    // 4. LUZES
    scene.add(new THREE.AmbientLight(0xffffff, 2.5));
    const dLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dLight.position.set(10, 20, 10);
    dLight.castShadow = true;
    scene.add(dLight);

    const loader = new GLTFLoader().setDRACOLoader(dracoLoader);
    const loadedModels: THREE.Object3D[] = [];

    // 5. FUNÇÃO INTERNA PARA SPAWN (Usa mapUtils)
    const spawn = (name: string, lvl: number, x: number, z: number, isMe: boolean) => {
      loader.load(getBarracoUrl(lvl), (gltf) => {
        if (!isMounted) return;
        const model = gltf.scene;
        
        // Ajuste de Escala conforme o nível
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const s = lvl >= 60 ? 4 : lvl >= 30 ? 3 : 2;
        model.scale.setScalar(s / (Math.max(size.x, size.z) || 1));

        // Posição no chão
        const finalBox = new THREE.Box3().setFromObject(model);
        model.position.set(x, -finalBox.min.y, z);
        
        // Aplica o clareamento do mapUtils
        model.traverse(fixDarkMaterials);
        scene.add(model);
        loadedModels.push(model);

        // Adiciona o nome do mapUtils
        const label = createTextLabel(name);
        label.position.set(x, finalBox.max.y + 1.2, z);
        scene.add(label);
        loadedModels.push(label);

        if (isMe) {
          const area = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 4),
            new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
          );
          area.rotation.x = -Math.PI / 2;
          area.position.set(x, 0.05, z);
          scene.add(area);
          loadedModels.push(area);
        }
      });
    };

    // Spawn do Jogador e Vizinhos
    spawn(displayName, myLevel, worldX, worldZ, true);

    const token = localStorage.getItem('authToken');
    if (token) {
      fetch('https://comando-backend.onrender.com/players', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(players => {
          if (!isMounted) return;
          players.forEach((p: any) => {
            if (p.id === playerState?._id) return;
            const vx = (p.tileX - GRID_CONFIG.WIDTH / 2) * GRID_CONFIG.TILE_SIZE;
            const vz = (p.tileY - GRID_CONFIG.HEIGHT / 2) * GRID_CONFIG.TILE_SIZE;
            spawn(p.name, p.barracoLevel || 1, vx, vz, false);
          });
        }).catch(() => console.log("Erro vizinhos"));
    }

    // 6. CHÃO E GRID
    const textureLoader = new THREE.TextureLoader();
    const floorTex = textureLoader.load(FLOOR_TEXTURE);
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(GRID_CONFIG.WIDTH, GRID_CONFIG.PLATFORM_Y, GRID_CONFIG.HEIGHT),
      [
        new THREE.MeshStandardMaterial({ color: '#6e5742' }),
        new THREE.MeshStandardMaterial({ color: '#6e5742' }),
        new THREE.MeshStandardMaterial({ map: floorTex }),
        new THREE.MeshStandardMaterial({ color: '#6e5742' }),
        new THREE.MeshStandardMaterial({ color: '#6e5742' }),
        new THREE.MeshStandardMaterial({ color: '#6e5742' }),
      ]
    );
    platform.position.y = -GRID_CONFIG.PLATFORM_Y / 2;
    platform.receiveShadow = true;
    scene.add(platform);

    // Grid Visual
    const lineMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.1 });
    for (let i = 0; i <= GRID_CONFIG.WIDTH; i++) {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i - 20, 0.01, -10), 
        new THREE.Vector3(i - 20, 0.01, 10)
      ]);
      scene.add(new THREE.Line(g, lineMat));
    }
    for (let i = 0; i <= GRID_CONFIG.HEIGHT; i++) {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-20, 0.01, i - 10), 
        new THREE.Vector3(20, 0.01, i - 10)
      ]);
      scene.add(new THREE.Line(g, lineMat));
    }

    // 7. HIGHLIGHT DE CLIQUE (Quadrado Amarelo)
    const highlight = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    );
    highlight.rotation.x = -Math.PI / 2;
    highlight.position.y = 0.06;
    highlight.visible = false;
    scene.add(highlight);

    // 8. EVENTOS DE PONTEIRO
    let downPos = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onDown = (e: PointerEvent) => { downPos = { x: e.clientX, y: e.clientY }; };
    const onUp = (e: PointerEvent) => {
      const dist = Math.abs(e.clientX - downPos.x) + Math.abs(e.clientY - downPos.y);
      if (dist > 5) return; // Foi arrasto de câmera
      
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(platform);
      if (hits.length > 0) {
        highlight.visible = true;
        highlight.position.set(Math.floor(hits[0].point.x + 0.5), 0.06, Math.floor(hits[0].point.z + 0.5));
        
        // Aqui você pode disparar o Teleporte se quiser depois
        console.log("Alvo para invasão:", Math.floor(hits[0].point.x + 20), Math.floor(hits[0].point.z + 10));
      }
    };

    container.addEventListener('pointerdown', onDown);
    container.addEventListener('pointerup', onUp);

    // 9. ANIMATE
    let animId = 0;
    const animate = () => {
      if (!isMounted) return;
      controls.update();
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', () => {});
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointerup', onUp);
      controls.dispose();
      renderer.dispose();
      loadedModels.forEach(m => scene.remove(m));
    };
  }, [playerState?.mapPosition, displayName, myLevel]);

  return <div ref={containerRef} className="w-full h-full outline-none" />;
}
