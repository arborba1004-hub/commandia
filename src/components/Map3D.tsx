import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { usePlayerStore } from '@/store/playerStore';
import { fixDarkMaterials, createTextLabel, GRID_CONFIG } from './mapUtils';

// Configurações e Models (Mantidos aqui por facilidade de edição)
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
    const loader = new GLTFLoader().setDRACOLoader(dracoLoader);
    const loadedObjects: THREE.Object3D[] = [];

    // 1. SETUP RENDERER & SCENE
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');

    // 2. CÂMERA & LUZ
    const pX = (playerState?.mapPosition?.tileX ?? 20) - 20;
    const pZ = (playerState?.mapPosition?.tileY ?? 10) - 10;
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(pX + 15, 18, pZ + 15);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(pX, 0, pZ);
    controls.enableDamping = true;
    scene.add(new THREE.AmbientLight(0xffffff, 2.5));

    // 3. CARREGAR JOGADORES (Lógica Centralizada)
    const loadBarraco = (name: string, lvl: number, x: number, y: number, isMe: boolean) => {
      loader.load(getBarracoUrl(lvl), (gltf) => {
        if (!isMounted) return;
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        model.scale.setScalar((lvl >= 30 ? 3 : 2) / Math.max(box.max.x - box.min.x, box.max.z - box.min.z));
        model.position.set(x, 0, y);
        model.traverse(fixDarkMaterials);
        scene.add(model);
        loadedObjects.push(model);

        const label = createTextLabel(name);
        label.position.set(x, 3.5, y);
        scene.add(label);
        loadedObjects.push(label);

        if (isMe) {
          const base = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.15 }));
          base.rotation.x = -Math.PI / 2;
          base.position.set(x, 0.02, y);
          scene.add(base);
          loadedObjects.push(base);
        }
      });
    };

    // Meu Barraco
    loadBarraco(displayName, playerState?.niveis?.barracoLevel || 1, pX, pZ, true);

    // Outros Jogadores
    fetch('https://comando-backend.onrender.com/players', { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } })
      .then(res => res.json())
      .then(players => {
        players.forEach((p: any) => {
          if (p.id !== playerState?._id) loadBarraco(p.name, p.barracoLevel, p.tileX - 20, p.tileY - 10, false);
        });
      });

    // 4. CHÃO & CLIQUE
    const platform = new THREE.Mesh(new THREE.BoxGeometry(40, 1.2, 20), new THREE.MeshStandardMaterial({ color: '#333' }));
    platform.position.y = -0.6;
    scene.add(platform);

    const onUp = (e: PointerEvent) => {
      // Sua lógica de Teleporte aqui...
    };
    container.addEventListener('pointerup', onUp);

    // 5. ANIMATE & CLEANUP
    const animate = () => { if (isMounted) { controls.update(); renderer.render(scene, camera); requestAnimationFrame(animate); } };
    animate();

    return () => {
      isMounted = false;
      container.removeEventListener('pointerup', onUp);
      controls.dispose();
      renderer.dispose();
    };
  }, [playerState?.mapPosition, displayName]);

  return <div ref={containerRef} className="w-full h-full" />;
}
