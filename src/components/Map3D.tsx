import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { usePlayerStore } from '@/store/playerStore';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const GRID_WIDTH = 40;
const GRID_HEIGHT = 20;
const TILE_SIZE = 1;
const PLATFORM_HEIGHT = 1.2;
const FLOOR_TEXTURE = 'https://static.wixstatic.com/media/50f4bf_df004e568945465ba2231dc36addfe09~mv2.jpeg';

const BARRACO_MODELS = [
  { min: 1, max: 9, url: 'https://static.wixstatic.com/3d/50f4bf_78d8f707f621482698830308447c3ff2.glb' },
  { min: 10, max: 19, url: 'https://static.wixstatic.com/3d/50f4bf_e10d19cfeff147ce95eee1d04a31b04a.glb' },
  { min: 20, max: 29, url: 'https://static.wixstatic.com/3d/50f4bf_ad7304550b404996b3b82c425be28df8.glb' },
  { min: 30, max: 39, url: 'https://static.wixstatic.com/3d/50f4bf_d2c8efd640c24cabb3bda73016b7a6b7.glb' },
  { min: 40, max: 49, url: 'https://static.wixstatic.com/3d/50f4bf_0d7791cd61534906a7658b0599f1fcdd.glb' },
  { min: 50, max: 59, url: 'https://static.wixstatic.com/3d/50f4bf_efa8cf1ef0574d1a8fc0c80a894d4669.glb' },
];

// FUNÇÃO NOVA: Cria uma etiqueta de texto flutuante
function createTextLabel(text: string) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Group();

  canvas.width = 512;
  canvas.height = 128;

  context.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Fundo semi-transparente
  context.roundRect(0, 0, 512, 128, 20);
  context.fill();

  context.font = 'bold 60px Oswald, Arial';
  context.textAlign = 'center';
  context.fillStyle = '#ffffff'; // Cor do texto
  context.fillText(text.toUpperCase(), 256, 85);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(3, 0.75, 1); // Tamanho da etiqueta no mundo
  return sprite;
}

export default function Map3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerState = usePlayerStore((state) => state.player);
  
  // Pega o nome personalizado ou o padrão
  const displayName = playerState?.headerCustomization?.customName || playerState?.name || 'CAPO GHOST';
  const level = playerState?.niveis?.barracoLevel || 1;

  const getBarracoSize = (level: number) => {
    if (level >= 60) return 4;
    if (level >= 30) return 3;
    return 2;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    let isMounted = true;
    const container = containerRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');

    const myTileX = playerState?.mapPosition?.tileX ?? 20;
    const myTileY = playerState?.mapPosition?.tileY ?? 10;
    const playerWorldX = (myTileX - 20) * TILE_SIZE;
    const playerWorldZ = (myTileY - 10) * TILE_SIZE;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    const cameraTarget = new THREE.Vector3(playerWorldX, 0, playerWorldZ);
    camera.position.set(cameraTarget.x + 15, 18, cameraTarget.z + 15);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(cameraTarget);
    controls.enableDamping = true;

    // LUZES
    scene.add(new THREE.AmbientLight(0xffffff, 2.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(8, 20, 10);
    scene.add(dirLight);

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    const fixDarkMaterials = (child: any) => {
      if (child.isMesh) {
        child.material.metalness = 0;
        child.material.roughness = 0.8;
        child.material.emissive = new THREE.Color(0x3a220f);
        child.material.emissiveIntensity = 0.2;
      }
    };

    // CARREGAR MEU BARRACO COM NOME FLUTUANTE
    loader.load(getBarracoModelUrl(level), (gltf) => {
      if (!isMounted) return;
      const model = gltf.scene;
      
      // Ajuste de escala e posição (Igual ao código anterior)
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      model.scale.setScalar(getBarracoSize(level) / Math.max(size.x, size.z));
      const finalBox = new THREE.Box3().setFromObject(model);
      model.position.set(playerWorldX, -finalBox.min.y, playerWorldZ);
      model.traverse(fixDarkMaterials);
      scene.add(model);

      // ADICIONAR O NOME FLUTUANTE
      const nameLabel = createTextLabel(displayName);
      // Posiciona o nome 3 unidades acima do topo do barraco
      nameLabel.position.set(playerWorldX, finalBox.max.y + 1.5, playerWorldZ);
      scene.add(nameLabel);
    });

    // CARREGAR VIZINHOS DO BACKEND (Adaptado para mostrar nomes deles também se houver)
    const token = localStorage.getItem('authToken');
    if (token) {
      fetch('https://comando-backend.onrender.com/players', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(players => {
          players.forEach((p: any) => {
            if (p.id === playerState?._id) return;
            const pUrl = getBarracoModelUrl(p.barracoLevel || 1);
            loader.load(pUrl, (gltf) => {
              const m = gltf.scene;
              const pX = (p.tileX - 20) * TILE_SIZE;
              const pZ = (p.tileY - 10) * TILE_SIZE;
              m.position.set(pX, 0, pZ);
              m.traverse(fixDarkMaterials);
              scene.add(m);

              // Nome do vizinho flutuando
              const vLabel = createTextLabel(p.name || 'OUTRO PLAYER');
              vLabel.position.set(pX, 3.5, pZ);
              scene.add(vLabel);
            });
          });
        });
    }

    // CHÃO
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(GRID_WIDTH, PLATFORM_HEIGHT, GRID_HEIGHT),
      new THREE.MeshStandardMaterial({ color: '#444' })
    );
    platform.position.y = -PLATFORM_HEIGHT/2;
    scene.add(platform);

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      if (isMounted) requestAnimationFrame(animate);
    };
    animate();

    return () => { isMounted = false; renderer.dispose(); };
  }, [playerState?.mapPosition, displayName]);

  return <div ref={containerRef} className="w-full h-full" />;
}

// Helper para URL
function getBarracoModelUrl(level: number) {
  return BARRACO_MODELS.find((m) => level >= m.min && level <= m.max)?.url ?? BARRACO_MODELS[0].url;
}
