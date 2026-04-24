import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useNavigate } from 'react-router-dom';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { mountFixedMapBuildings } from '@/components/game/fixedMapBuildings';
import { mountPlayerMapSpace } from '@/components/game/playerMapSpace';
import { mountRealtimeMapPlayersLayer } from '@/components/game/realtimeMapPlayersLayer';
import { teleportPlayerMapSpace } from '@/components/game/playerTeleport';
import { usePlayerStore } from '@/store/playerStore';
import Header from '@/components/Header';

// 🔥 IMPORTANTE
import socket from '@/socket';

const GRID_WIDTH = 120;
const GRID_HEIGHT = 120;
const TILE_SIZE = 1;
const PLATFORM_HEIGHT = 1.2;

export default function GamePage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const player = usePlayerStore((state) => state.player);

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050505');

    const camera = new THREE.PerspectiveCamera(
      50,
      mountEl.clientWidth / Math.max(mountEl.clientHeight, 1),
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
    mountEl.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambientLight);

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
    );
    loader.setDRACOLoader(dracoLoader);

    const fixedBuildingsLayer = mountFixedMapBuildings({
      scene,
      loader,
      camera,
      container: mountEl,
      onNavigate: (path) => navigate(path),
      onMessage: () => {},
    });

    const playerMapSpace = mountPlayerMapSpace({
      scene,
      tileX: Number(player?.mapPosition?.tileX ?? 0),
      tileY: Number(player?.mapPosition?.tileY ?? 0),
      barracoLevel: Number(player?.niveis?.barracoLevel ?? 1),
      gridWidth: GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
      tileSize: TILE_SIZE,
    });

    const realtimePlayersLayer = mountRealtimeMapPlayersLayer({
      scene,
      gridWidth: GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
      tileSize: TILE_SIZE,
      pollingMs: 3000,
      showSpaces: true,
    });

    realtimePlayersLayer.start();

    // 🔥 SOCKET CONECTADO
    socket.on('connect', () => {
      console.log('✅ Conectado no tempo real');
    });

    socket.on('playerMoved', (data) => {
      console.log('👀 Outro jogador moveu:', data);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function handleClick(event: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();

      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const intersections = raycaster.intersectObjects(scene.children, true);
      if (!intersections.length) return;

      const point = intersections[0].point;

      const tileX = Math.floor(point.x + GRID_WIDTH / 2);
      const tileY = Math.floor(point.z + GRID_HEIGHT / 2);

      const teleported = teleportPlayerMapSpace(playerMapSpace, {
        clickedTileX: tileX,
        clickedTileY: tileY,
        occupiedOrigins: [],
        gridWidth: GRID_WIDTH,
        gridHeight: GRID_HEIGHT,
      });

      // 🔥 ENVIA MOVIMENTO
      socket.emit('move', {
        tileX,
        tileY,
      });
    }

    renderer.domElement.addEventListener('click', handleClick);

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    animate();

    return () => {
      socket.off('playerMoved');

      renderer.domElement.removeEventListener('click', handleClick);
      controls.dispose();

      realtimePlayersLayer.cleanup();
      fixedBuildingsLayer.cleanup();
      playerMapSpace.cleanup();

      renderer.dispose();
    };
  }, [navigate, player]);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div
        ref={mountRef}
        className="w-full h-[calc(100vh-104px)] min-h-[500px]"
      />
    </div>
  );
}