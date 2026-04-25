

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


const GRID_WIDTH = 120;
const GRID_HEIGHT = 120;
const TILE_SIZE = 1;
const PLATFORM_HEIGHT = 1.2;

const FLOOR_TEXTURE =
'https://static.wixstatic.com/media/50f4bf_df004e568945465ba2231dc36addfe09~mv2.jpeg';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
);

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
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));  
renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);  
renderer.shadowMap.enabled = true;  
renderer.shadowMap.type = THREE.PCFSoftShadowMap;  
mountEl.appendChild(renderer.domElement);  

const controls = new OrbitControls(camera, renderer.domElement);  
controls.enableDamping = true;  
controls.dampingFactor = 0.06;  
controls.minDistance = 10;  
controls.maxDistance = 70;  
controls.maxPolarAngle = Math.PI / 2.05;  

const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);  
scene.add(ambientLight);  

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.35);  
directionalLight.position.set(40, 90, 30);  
directionalLight.castShadow = true;  
directionalLight.shadow.mapSize.width = 2048;  
directionalLight.shadow.mapSize.height = 2048;  
directionalLight.shadow.camera.near = 1;  
directionalLight.shadow.camera.far = 300;  
directionalLight.shadow.camera.left = -90;  
directionalLight.shadow.camera.right = 90;  
directionalLight.shadow.camera.top = 90;  
directionalLight.shadow.camera.bottom = -90;  
scene.add(directionalLight);  

const textureLoader = new THREE.TextureLoader();  
const floorTexture = textureLoader.load(FLOOR_TEXTURE);  
floorTexture.wrapS = THREE.ClampToEdgeWrapping;  
floorTexture.wrapT = THREE.ClampToEdgeWrapping;  
floorTexture.repeat.set(1, 1);  
floorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();  
floorTexture.magFilter = THREE.LinearFilter;  
floorTexture.minFilter = THREE.LinearMipmapLinearFilter;  
floorTexture.needsUpdate = true;  

const platformGeometry = new THREE.BoxGeometry(  
  GRID_WIDTH * TILE_SIZE,  
  PLATFORM_HEIGHT,  
  GRID_HEIGHT * TILE_SIZE  
);  

const platformMaterial = new THREE.MeshStandardMaterial({  
  map: floorTexture,  
  roughness: 1,  
  metalness: 0,  
});  

const platform = new THREE.Mesh(platformGeometry, platformMaterial);  
platform.position.set(0, -PLATFORM_HEIGHT / 2, 0);  
platform.receiveShadow = true;  
platform.castShadow = false;  
scene.add(platform);  

const loader = new GLTFLoader();  
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

controls.target.set(playerMapSpace.worldX, 0, playerMapSpace.worldZ);  
camera.position.set(  
  playerMapSpace.worldX + 12,  
  10,  
  playerMapSpace.worldZ + 12  
);  
controls.update();  

const clickPlaneGeometry = new THREE.PlaneGeometry(  
  GRID_WIDTH * TILE_SIZE,  
  GRID_HEIGHT * TILE_SIZE  
);  

const clickPlaneMaterial = new THREE.MeshBasicMaterial({  
  transparent: true,  
  opacity: 0,  
  side: THREE.DoubleSide,  
  depthWrite: false,  
});  

const clickPlane = new THREE.Mesh(clickPlaneGeometry, clickPlaneMaterial);  
clickPlane.rotation.x = -Math.PI / 2;  
clickPlane.position.y = 0.05;  
scene.add(clickPlane);  

const selectionGeometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);  
const selectionMaterial = new THREE.MeshBasicMaterial({  
  color: 0xd9b764,  
  transparent: true,  
  opacity: 0.4,  
  side: THREE.DoubleSide,  
  depthWrite: false,  
});  

const selectionMesh = new THREE.Mesh(selectionGeometry, selectionMaterial);  
selectionMesh.rotation.x = -Math.PI / 2;  
selectionMesh.position.set(  
  0.5 - GRID_WIDTH / 2,  
  0.06,  
  0.5 - GRID_HEIGHT / 2  
);  
selectionMesh.visible = false;  
scene.add(selectionMesh);  

const realtimePlayersLayer = mountRealtimeMapPlayersLayer({  
  scene,  
  gridWidth: GRID_WIDTH,  
  gridHeight: GRID_HEIGHT,  
  tileSize: TILE_SIZE,  
  pollingMs: 3000,  
  showSpaces: true,  
});  

// 🔥 SOCKET (correto)
let socket: any = null;
try {
  const { io } = require('socket.io-client');
  socket = io('https://comando-backend.onrender.com', {
    transports: ['websocket'],
  });
  socket.on('connect', () => {
    console.log('✅ Conectado no tempo real');
  });
  socket.on('playerMoved', (data: any) => {
    console.log('👀 Outro jogador moveu:', data);
  });
} catch (err) {
  console.log('Socket não carregou', err);
}

const raycaster = new THREE.Raycaster();  
const mouse = new THREE.Vector2();  

function handleClick(event: MouseEvent) {  
  const rect = renderer.domElement.getBoundingClientRect();  

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;  
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;  

  raycaster.setFromCamera(mouse, camera);  

  const ownBarracoHits = raycaster.intersectObjects(  
    playerMapSpace.modelContainer.children,  
    true  
  );  

  if (ownBarracoHits.length > 0) {  
    navigate('/barraco');  
    return;  
  }  

  const intersections = raycaster.intersectObject(clickPlane, false);  

  if (!intersections.length) return;  

  const point = intersections[0].point;  
  const tileX = Math.floor(point.x + GRID_WIDTH / 2);  
  const tileY = Math.floor(point.z + GRID_HEIGHT / 2);  

  if (  
    tileX < 0 ||  
    tileX >= GRID_WIDTH ||  
    tileY < 0 ||  
    tileY >= GRID_HEIGHT  
  ) {  
    return;  
  }  

  selectionMesh.position.set(  
    tileX - GRID_WIDTH / 2 + 0.5,  
    0.06,  
    tileY - GRID_HEIGHT / 2 + 0.5  
  );  
  selectionMesh.visible = true;  

  const teleported = teleportPlayerMapSpace(playerMapSpace, {  
    clickedTileX: tileX,  
    clickedTileY: tileY,  
    occupiedOrigins: [],  
    gridWidth: GRID_WIDTH,  
    gridHeight: GRID_HEIGHT,  
  });  
  socket?.emit('move', {
    tileX,
    tileY,
  });
}  

renderer.domElement.addEventListener('click', handleClick);  

function handleResize() {  
  const width = mountEl.clientWidth;  
  const height = Math.max(mountEl.clientHeight, 1);  

  camera.aspect = width / height;  
  camera.updateProjectionMatrix();  
  renderer.setSize(width, height);  
}  

const resizeObserver = new ResizeObserver(handleResize);  
resizeObserver.observe(mountEl);  

let animationFrameId = 0;  

function animate() {  
  animationFrameId = window.requestAnimationFrame(animate);  
  controls.update();  
  renderer.render(scene, camera);  
}  

animate();  

return () => {  
  window.cancelAnimationFrame(animationFrameId);  
  resizeObserver.disconnect();  
  renderer.domElement.removeEventListener('click', handleClick);  
  controls.dispose();  

  realtimePlayersLayer.cleanup();  
  socket?.disconnect();
  fixedBuildingsLayer.cleanup();  
  playerMapSpace.cleanup();  

  platformGeometry.dispose();  
  platformMaterial.dispose();  
  clickPlaneGeometry.dispose();  
  clickPlaneMaterial.dispose();  
  selectionGeometry.dispose();  
  selectionMaterial.dispose();  
  floorTexture.dispose();  

  scene.remove(platform);  
  scene.remove(clickPlane);  
  scene.remove(selectionMesh);  

  renderer.dispose();  

  if (mountEl.contains(renderer.domElement)) {  
    mountEl.removeChild(renderer.domElement);  
  }  
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