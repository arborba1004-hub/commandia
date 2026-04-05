import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { usePlayerStore } from '@/store/playerStore';

// Importando as funções do seu novo arquivo
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

function getBarracoUrl(lvl: number) {
  return BARRACO_MODELS.find(m => lvl >= m.min && lvl <= m.max)?.url || BARRACO_MODELS[0].url;
}

export default function Map3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerState = usePlayerStore((state) => state.player);
  const displayName = playerState?.headerCustomization?.customName || playerState?.name || 'CAPO GHOST';

  useEffect(() => {
    if (!containerRef.current) return;
    let isMounted = true;
    const container = containerRef.current;
    
    // 1. SETUP RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');

    const loader = new GLTFLoader().setDRACOLoader(dracoLoader);
    const loadedObjects: THREE.Object3D[] = [];

    // 2. POSIÇÃO E CÂMERA
    const myX = (playerState?.mapPosition?.tileX ?? 20) - GRID_CONFIG.WIDTH / 2;
    const myZ = (playerState?.mapPosition?.tileY ?? 10) - GRID_CONFIG.HEIGHT / 2;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(myX + 15, 18, myZ + 15);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(myX, 0, myZ);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Não deixa ver debaixo do mapa

    scene.add(new THREE.AmbientLight(0xffffff, 2.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 3. ELEMENTOS DE INTERAÇÃO (Bolinha e Highlight)
    const highlight = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    );
    highlight.rotation.x = -Math.PI / 2;
    highlight.position.y = 0.05;
    highlight.visible = false;
    scene.add(highlight);

    const playerBolinha = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x00ffff })
    );
    playerBolinha.position.set(myX, 0.3, myZ);
    scene.add(playerBolinha);

    // 4. FUNÇÃO REUTILIZÁVEL PARA CARREGAR BARRRACOS
    const spawnBarraco = (name: string, lvl: number, x: number, z: number, isMe: boolean) => {
      loader.load(getBarracoUrl(lvl), (gltf) => {
        if (!isMounted) return;
        const model = gltf.scene;
        
        // Ajuste de Escala
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const visualSize = lvl >= 30 ? 3 : 2;
        model.scale.setScalar(visualSize / Math.max(size.x, size.z));

        // Posição no chão
        const finalBox = new THREE.Box3().setFromObject(model);
        model.position.set(x, -finalBox.min.y, z);
        
        // Aplica a função do mapUtils
        model.traverse(fixDarkMaterials);
        
        scene.add(model);
        loadedObjects.push(model);

        // Adiciona o nome flutuante do mapUtils
        const label = createTextLabel(name);
        label.position.set(x, finalBox.max.y + 1.2, z);
        scene.add(label);
        loadedObjects.push(label);

        if (isMe) {
          const base = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 4),
            new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
          );
          base.rotation.x = -Math.PI / 2;
          base.position.set(x, 0.02, z);
          scene.add(base);
          loadedObjects.push(base);
        }
      });
    };

    // Carregar meu barraco
    spawnBarraco(displayName, playerState?.niveis?.barracoLevel || 1, myX, myZ, true);

    // Carregar vizinhos
    fetch('https://comando-backend.onrender.com/players', { 
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } 
    })
      .then(res => res.json())
      .then(players => {
        players.forEach((p: any) => {
          if (p.id !== playerState?._id) {
            const vx = p.tileX - GRID_CONFIG.WIDTH / 2;
            const vz = p.tileY - GRID_CONFIG.HEIGHT / 2;
            spawnBarraco(p.name, p.barracoLevel, vx, vz, false);
          }
        });
      });

    // 5. CHÃO COM TEXTURA E GRID
    const textureLoader = new THREE.TextureLoader();
    const floorTex = textureLoader.load(FLOOR_TEXTURE);
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(GRID_CONFIG.WIDTH, GRID_CONFIG.PLATFORM_Y, GRID_CONFIG.HEIGHT),
      [
        new THREE.MeshStandardMaterial({ color: '#444' }),
        new THREE.MeshStandardMaterial({ color: '#444' }),
        new THREE.MeshStandardMaterial({ map: floorTex }),
        new THREE.MeshStandardMaterial({ color: '#444' }),
        new THREE.MeshStandardMaterial({ color: '#444' }),
        new THREE.MeshStandardMaterial({ color: '#444' }),
      ]
    );
    platform.position.y = -GRID_CONFIG.PLATFORM_Y / 2;
    scene.add(platform);

    const lineMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.1 });
    for (let i = 0; i <= GRID_CONFIG.WIDTH; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i - 20, 0.01, -10), 
        new THREE.Vector3(i - 20, 0.01, 10)
      ]);
      scene.add(new THREE.Line(geo, lineMat));
    }
    for (let i = 0; i <= GRID_CONFIG.HEIGHT; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-20, 0.01, i - 10), 
        new THREE.Vector3(20, 0.01, i - 10)
      ]);
      scene.add(new THREE.Line(geo, lineMat));
    }

    // 6. EVENTOS E CLIQUE
    let pointerDownPos = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onDown = (e: PointerEvent) => { pointerDownPos = { x: e.clientX, y: e.clientY }; };
    const onUp = (e: PointerEvent) => {
      const dist = Math.abs(e.clientX - pointerDownPos.x) + Math.abs(e.clientY - pointerDownPos.y);
      if (dist > 5) return;
      
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(platform);
      if (intersects.length > 0) {
        const pt = intersects[0].point;
        const tx = Math.floor(pt.x + 0.5);
        const tz = Math.floor(pt.z + 0.5);
        
        highlight.visible = true;
        highlight.position.set(tx, 0.05, tz);
        playerBolinha.position.set(tx, 0.3, tz);
        
        // Aqui você pode colocar a pergunta do Teleporte se quiser
      }
    };

    container.addEventListener('pointerdown', onDown);
    container.addEventListener('pointerup', onUp);

    // 7. ANIMATE
    let animationId = 0;
    const animate = () => {
      if (!isMounted) return;
      controls.update();
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationId);
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointerup', onUp);
      controls.dispose();
      renderer.dispose();
      loadedObjects.forEach(obj => scene.remove(obj));
    };
  }, [playerState?.mapPosition, displayName]);

  return <div ref={containerRef} className="w-full h-full outline-none" />;
}
