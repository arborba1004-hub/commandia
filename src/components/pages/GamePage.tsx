/**
 * GamePage.tsx — Mapa multiplayer em tempo real (FINAL CORRIGIDO)
 *
 * ARQUITETURA:
 *   ✅ Socket é a ÚNICA fonte de verdade (sem polling REST)
 *   ✅ realtimeMapPlayersLayer APENAS renderiza barracos 3D + cache raycasting
 *   ✅ isMe() usa cache local `myId` (síncrono, sem depender do playerStore)
 *   ✅ myId é definido ANTES de processar mapSnapshot (sem race condition)
 *   ✅ playerMoved/playerTeleported do socket é IGNORADO se for o próprio jogador
 *   ✅ Um ÚNICO barraco por jogador, sem duplicação
 *   ✅ Ao montar, se socket já conectado, solicita mapSnapshot via 'requestMapSnapshot'
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE             from 'three';
import { OrbitControls }      from 'three/examples/jsm/controls/OrbitControls';
import { useNavigate }        from 'react-router-dom';
import { GLTFLoader }         from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader }        from 'three/examples/jsm/loaders/DRACOLoader';
import { mountFixedMapBuildings }      from '@/components/game/fixedMapBuildings';
import { mountPlayerMapSpace }         from '@/components/game/playerMapSpace';
import { mountRealtimeMapPlayersLayer } from '@/components/game/realtimeMapPlayersLayer';
import { teleportPlayerMapSpace }      from '@/components/game/playerTeleport';
import { usePlayerStore }              from '@/store/playerStore';
import { getSocket }                   from '@/socket';
import Header                          from '@/components/Header';
import OtherPlayerBarracoModal, { 
  type OtherPlayerBarracoTarget,
  createOtherPlayerBarracoModalState,
  openOtherPlayerBarracoModal,
  closeOtherPlayerBarracoModal,
} from '@/components/game/OtherPlayerBarracoModal';
import { fetchAllRegisteredPlayers } from '@/api/mapPlayersApi';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES DO MAPA
// ═══════════════════════════════════════════════════════════════════════════════
const GRID_WIDTH   = 120;
const GRID_HEIGHT  = 120;
const TILE_SIZE    = 1;
const PLATFORM_HEIGHT = 1.2;

const FLOOR_TEXTURE =
  'https://static.wixstatic.com/media/50f4bf_df004e568945465ba2231dc36addfe09~mv2.jpeg';

// ═══════════════════════════════════════════════════════════════════════════════
// DRACO LOADER (descompressão de modelos GLB)
// ═══════════════════════════════════════════════════════════════════════════════
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function GamePage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const navigate  = useNavigate();
  const player    = usePlayerStore((state) => state.player);
  const [modalState, setModalState] = useState(createOtherPlayerBarracoModalState());
  const playerMapSpaceRef = useRef<any>(null);

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    let isMounted = true;

    // ── SCENE ──────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050505');

    // ── CAMERA ─────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      50,
      mountEl.clientWidth / Math.max(mountEl.clientHeight, 1),
      0.1,
      1000
    );

    // ── RENDERER ───────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    mountEl.appendChild(renderer.domElement);

    // ── CONTROLES DE CÂMERA ────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping  = true;
    controls.dampingFactor  = 0.06;
    controls.minDistance    = 10;
    controls.maxDistance    = 70;
    controls.maxPolarAngle  = Math.PI / 2.05;

    // ── LUZ AMBIENTE ───────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.25));

    // ── LUZ DIRECIONAL (SOL) ───────────────────────────────────────────────
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.35);
    dirLight.position.set(40, 90, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width  = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near   = 1;
    dirLight.shadow.camera.far    = 300;
    dirLight.shadow.camera.left   = -90;
    dirLight.shadow.camera.right  = 90;
    dirLight.shadow.camera.top    = 90;
    dirLight.shadow.camera.bottom = -90;
    scene.add(dirLight);

    // ── PLATAFORMA (CHÃO) ──────────────────────────────────────────────────
    const textureLoader = new THREE.TextureLoader();
    const floorTexture  = textureLoader.load(FLOOR_TEXTURE);
    floorTexture.wrapS  = THREE.ClampToEdgeWrapping;
    floorTexture.wrapT  = THREE.ClampToEdgeWrapping;
    floorTexture.repeat.set(1, 1);
    floorTexture.anisotropy  = renderer.capabilities.getMaxAnisotropy();
    floorTexture.magFilter   = THREE.LinearFilter;
    floorTexture.minFilter   = THREE.LinearMipmapLinearFilter;

    const platformGeometry = new THREE.BoxGeometry(
      GRID_WIDTH * TILE_SIZE,
      PLATFORM_HEIGHT,
      GRID_HEIGHT * TILE_SIZE
    );
    const platformMaterial = new THREE.MeshStandardMaterial({
      map:        floorTexture,
      roughness:  1,
      metalness:  0,
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, -PLATFORM_HEIGHT / 2, 0);
    platform.receiveShadow = true;
    scene.add(platform);
// ═══════════════════════════════════════════════════════════════════════
// GLTF LOADER (modelos 3D)
// ═══════════════════════════════════════════════════════════════════════
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// ═══════════════════════════════════════════════════════════════════════
// PRÉDIOS FIXOS DO MAPA
// ═══════════════════════════════════════════════════════════════════════
const fixedBuildingsLayer = mountFixedMapBuildings({
  scene,
  loader,
  camera,
  container: mountEl,
  onNavigate: (path: string) => navigate(path),
  onMessage:  () => {},
});

// ═══════════════════════════════════════════════════════════════════════
// ESPAÇO DO PRÓPRIO JOGADOR (BARRACO 3D + ÁREA 6x6)
// ═══════════════════════════════════════════════════════════════════════
const playerMapSpace = mountPlayerMapSpace({
  scene,
  tileX:        Number(player?.mapPosition?.tileX ?? 0),
  tileY:        Number(player?.mapPosition?.tileY ?? 0),
  barracoLevel: Number(player?.niveis?.barracoLevel ?? 1),
  gridWidth:    GRID_WIDTH,
  gridHeight:   GRID_HEIGHT,
  tileSize:     TILE_SIZE,
});

playerMapSpaceRef.current = playerMapSpace;

// ── Centraliza câmera no barraco do jogador ──────────────────────────
controls.target.set(playerMapSpace.worldX, 0, playerMapSpace.worldZ);
camera.position.set(
  playerMapSpace.worldX + 12,
  10,
  playerMapSpace.worldZ + 12
);
controls.update();

// ═══════════════════════════════════════════════════════════════════════
// PLANO DE CLIQUE INVISÍVEL (para detectar clique no chão)
// ═══════════════════════════════════════════════════════════════════════
const clickPlaneGeo = new THREE.PlaneGeometry(
  GRID_WIDTH * TILE_SIZE,
  GRID_HEIGHT * TILE_SIZE
);
const clickPlaneMat = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity:     0,
  side:        THREE.DoubleSide,
  depthWrite:  false,
});
const clickPlane = new THREE.Mesh(clickPlaneGeo, clickPlaneMat);
clickPlane.rotation.x = -Math.PI / 2;
clickPlane.position.y = 0.05;
scene.add(clickPlane);

// ═══════════════════════════════════════════════════════════════════════
// SELETOR VISUAL DE TILE (quadrado dourado ao clicar)
// ═══════════════════════════════════════════════════════════════════════
const selectionGeo = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
const selectionMat = new THREE.MeshBasicMaterial({
  color:       0xd9b764,
  transparent: true,
  opacity:     0.4,
  side:        THREE.DoubleSide,
  depthWrite:  false,
});
const selectionMesh = new THREE.Mesh(selectionGeo, selectionMat);
selectionMesh.rotation.x = -Math.PI / 2;
selectionMesh.position.set(
  0.5 - GRID_WIDTH / 2,
  0.06,
  0.5 - GRID_HEIGHT / 2
);
selectionMesh.visible = false;
scene.add(selectionMesh);

// ═══════════════════════════════════════════════════════════════════════
// CAMADA DE JOGADORES EM TEMPO REAL (SOMENTE RENDERIZAÇÃO 3D + CACHE)
// ═══════════════════════════════════════════════════════════════════════
//
// IMPORTANTE: Esta camada NÃO faz polling REST.
// O Socket é a ÚNICA fonte de verdade para posições.
// O layer apenas:
//   1. Cria/atualiza/remove meshes 3D dos barracos
//   2. Mantém cache local para raycasting (clicar em barraco)
//
const realtimePlayersLayer = mountRealtimeMapPlayersLayer({
  scene,
  gridWidth:  GRID_WIDTH,
  gridHeight: GRID_HEIGHT,
  tileSize:   TILE_SIZE,
  pollingMs:  300000,        // ← POLLING DESLIGADO
  showSpaces: true,
});
// ⚠️ NÃO chamamos realtimePlayersLayer.start() — socket é a fonte única

// ═══════════════════════════════════════════════════════════════════════
// ESTADO LOCAL DOS JOGADORES (cache para verificação de tiles ocupados)
// ═══════════════════════════════════════════════════════════════════════
const localPlayers = new Map<string, { tileX: number; tileY: number }>();

// ═══════════════════════════════════════════════════════════════════════
// myId: CACHE LOCAL SÍNCRONO do ID do próprio jogador
// ═══════════════════════════════════════════════════════════════════════
let myId: string | null = player?._id ? String(player._id) : null;

const isMe = (id: string): boolean => {
  if (!myId) return false;
  return String(id) === myId;
};

// ═══════════════════════════════════════════════════════════════════════
// SOCKET.IO — FONTE ÚNICA DE VERDADE
// ═══════════════════════════════════════════════════════════════════════
const socket = getSocket();

// ───────────────────────────────────────────────────────────────────────
// playerInit: PRIMEIRO evento ao conectar.
// Define myId ANTES de qualquer outro evento ser processado.
// ───────────────────────────────────────────────────────────────────────
socket.on('playerInit', (data: { player: any; faction?: any }) => {
  if (!isMounted) return;

  const incomingId = String(data.player?._id || data.player?.id || '');
  if (incomingId) {
    myId = incomingId;
    console.log('✅ playerInit recebido - myId definido:', myId);
  }

  // Hidrata o playerStore para outras páginas (Header, etc.)
  usePlayerStore.getState().hydratePlayerFromServer(data.player);
});

// ───────────────────────────────────────────────────────────────────────
// mapSnapshot: Array com TODOS os jogadores cadastrados (online ou offline).
// Filtra o PRÓPRIO jogador usando isMe() síncrono.
// ───────────────────────────────────────────────────────────────────────
socket.on('mapSnapshot', async (players: any[]) => {
  if (!isMounted) return;

  console.log('📍 mapSnapshot recebido com', players?.length || 0, 'jogadores cadastrados. myId:', myId);
  console.log('📍 Dados brutos:', players);

  const others = players.filter((p) => !isMe(String(p.id)));
  console.log('📍 Após filtro (excluindo self):', others.length, 'jogadores para renderizar');

  // Limpa cache local e renderiza TODOS os jogadores cadastrados
  localPlayers.clear();
  
  for (const p of others) {
    localPlayers.set(String(p.id), {
      tileX: Number(p.tileX),
      tileY: Number(p.tileY),
    });
  }

  for (const p of others) {
    if (!isMounted) break;
    console.log('🎮 Adicionando barraco ao mapa:', p.id, 'em', p.tileX, p.tileY, '| Status:', p.status || 'unknown');
    await realtimePlayersLayer.upsertPlayer({
      id:           String(p.id),
      name:         p.name || 'Jogador',
      tileX:        Number(p.tileX),
      tileY:        Number(p.tileY),
      barracoLevel: Number(p.barracoLevel ?? 1),
      power:        Number(p.power ?? 0),
      factionId:    p.factionId ?? null,
    });
  }
  
  console.log('✅ mapSnapshot processado com sucesso - Total de barracos renderizados:', others.length);
});

// ───────────────────────────────────────────────────────────────────────
// playerJoined: Novo jogador entrou no mapa.
// IGNORA se for o próprio jogador.
// ───────────────────────────────────────────────────────────────────────
socket.on('playerJoined', async (p: any) => {
  if (!isMounted || isMe(String(p.id))) return;

  localPlayers.set(String(p.id), {
    tileX: Number(p.tileX),
    tileY: Number(p.tileY),
  });

  await realtimePlayersLayer.upsertPlayer({
    id:           String(p.id),
    name:         p.name || 'Jogador',
    tileX:        Number(p.tileX),
    tileY:        Number(p.tileY),
    barracoLevel: Number(p.barracoLevel ?? 1),
    power:        Number(p.power ?? 0),
    factionId:    p.factionId ?? null,
  });
});

// ───────────────────────────────────────────────────────────────────────
// playerMoved: Jogador se moveu.
// IGNORA se for o próprio jogador (evita teleporte duplo).
// ───────────────────────────────────────────────────────────────────────
socket.on('playerMoved', async (data: {
  playerId: string;
  name?:    string;
  tileX:    number;
  tileY:    number;
}) => {
  if (!isMounted) {
    console.log('⚠️ playerMoved ignorado: componente não montado');
    return;
  }

  console.log('🚀 playerMoved recebido:', data.playerId, 'em', data.tileX, data.tileY, '| myId:', myId, '| isMe:', isMe(String(data.playerId)));

  if (isMe(String(data.playerId))) {
    console.log('⏭️ playerMoved ignorado: é o próprio jogador');
    return;
  }

  localPlayers.set(String(data.playerId), {
    tileX: Number(data.tileX),
    tileY: Number(data.tileY),
  });

  console.log('🎮 Atualizando posição do jogador:', data.playerId);
  await realtimePlayersLayer.upsertPlayer({
    id:    String(data.playerId),
    name:  data.name || 'Jogador',
    tileX: Number(data.tileX),
    tileY: Number(data.tileY),
  });
});

// ───────────────────────────────────────────────────────────────────────
// playerTeleported: Jogador se teleportou.
// IGNORA se for o próprio jogador (evita teleporte duplo).
// ───────────────────────────────────────────────────────────────────────
socket.on('playerTeleported', async (data: {
  playerId:    string;
  name?:       string;
  oldPosition: { tileX: number; tileY: number };
  newPosition: { tileX: number; tileY: number };
}) => {
  if (!isMounted || isMe(String(data.playerId))) return;

  localPlayers.set(String(data.playerId), {
    tileX: Number(data.newPosition.tileX),
    tileY: Number(data.newPosition.tileY),
  });

  await realtimePlayersLayer.upsertPlayer({
    id:    String(data.playerId),
    name:  data.name || 'Jogador',
    tileX: Number(data.newPosition.tileX),
    tileY: Number(data.newPosition.tileY),
  });
});

// ───────────────────────────────────────────────────────────────────────
// playerLeft: Jogador desconectou.
// ───────────────────────────────────────────────────────────────────────
socket.on('playerLeft', (data: { playerId: string }) => {
  if (!isMounted) return;
  localPlayers.delete(String(data.playerId));
  void realtimePlayersLayer.refresh();
});

// ═══════════════════════════════════════════════════════════════════════
// SOLICITA SNAPSHOT INICIAL SE O SOCKET JÁ ESTIVER CONECTADO
// ═══════════════════════════════════════════════════════════════════════
if (socket.connected) {
  console.log('🔌 Socket já conectado - solicitando mapSnapshot');
  socket.emit('requestMapSnapshot');
} else {
  console.log('⏳ Socket ainda não conectado - aguardando conexão');
  socket.once('connect', () => {
    console.log('🔌 Socket conectado - solicitando mapSnapshot');
    socket.emit('requestMapSnapshot');
  });
}
    // ═══════════════════════════════════════════════════════════════════════
    // CLICK HANDLER — Raycasting para interação com o mapa
    // ═══════════════════════════════════════════════════════════════════════
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();

    function handleClick(event: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((event.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // ── Clique no PRÓPRIO barraco → navega para /barraco ──────────────
      const ownHits = raycaster.intersectObjects(
        playerMapSpaceRef.current?.modelContainer?.children || [],
        true
      );
      if (ownHits.length > 0) {
        navigate('/barraco');
        return;
      }

      // ── Clique em barraco de OUTRO jogador → abre modal ────────────────
      const otherHits = raycaster.intersectObjects(
        realtimePlayersLayer.group.children,
        true
      );
      if (otherHits.length > 0) {
        const hitObject = otherHits[0].object;
        let current: any = hitObject;

        while (current) {
          if (current.userData?.playerId) {
            const playerId = String(current.userData.playerId);

            // Busca no cache local do layer (100% síncrono)
            const playerData = realtimePlayersLayer
              .players()
              .find((p: any) => String(p.id) === playerId);

            if (playerData) {
              setModalState(openOtherPlayerBarracoModal({
                id:           playerData.id,
                name:         playerData.name || 'Jogador',
                barracoLevel: playerData.barracoLevel,
                factionId:    playerData.factionId,
              }));
            }
            return;
          }
          current = current.parent;
        }
      }

      // ── Clique no chão → move o jogador ────────────────────────────────
      const hits = raycaster.intersectObject(clickPlane, false);
      if (!hits.length) return;

      const point = hits[0].point;
      const tileX = Math.floor(point.x + GRID_WIDTH  / 2);
      const tileY = Math.floor(point.z + GRID_HEIGHT / 2);

      if (
        tileX < 0 || tileX >= GRID_WIDTH ||
        tileY < 0 || tileY >= GRID_HEIGHT
      ) return;

      const tileKey = `${tileX},${tileY}`;
      const occupied = Array.from(localPlayers.values()).some(
        (p) => `${p.tileX},${p.tileY}` === tileKey
      );

      if (occupied) {
        // Tile ocupado — futuramente abrir modal de ataque/invasão
        return;
      }

      // ── Move o jogador (UMA ÚNICA VEZ) ─────────────────────────────────
      selectionMesh.position.set(
        tileX - GRID_WIDTH / 2 + 0.5,
        0.06,
        tileY - GRID_HEIGHT / 2 + 0.5
      );
      selectionMesh.visible = true;

      teleportPlayerMapSpace(playerMapSpaceRef.current, {
        clickedTileX: tileX,
        clickedTileY: tileY,
        occupiedOrigins: [],
        gridWidth:  GRID_WIDTH,
        gridHeight: GRID_HEIGHT,
      });

      usePlayerStore.getState().applyPlayerUpdate((p) => ({
        ...p,
        mapPosition: {
          tileX,
          tileY,
          worldX: (tileX - GRID_WIDTH  / 2) * TILE_SIZE + TILE_SIZE / 2,
          worldY: (tileY - GRID_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2,
        },
      }));

      socket.emit('move', { tileX, tileY });
    }

    renderer.domElement.addEventListener('click', handleClick);

    // ═══════════════════════════════════════════════════════════════════════
    // RESIZE — Redimensiona câmera e renderer quando a janela mudar
    // ═══════════════════════════════════════════════════════════════════════
    function handleResize() {
      if (!mountEl) return;
      const w = mountEl.clientWidth;
      const h = Math.max(mountEl.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mountEl);

    // ═══════════════════════════════════════════════════════════════════════
    // ANIMATION LOOP
    // ═══════════════════════════════════════════════════════════════════════
    let animationFrameId = 0;

    function animate() {
      animationFrameId = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // ═══════════════════════════════════════════════════════════════════════
    // CLEANUP — Desmontagem completa ao sair da página
    // ═══════════════════════════════════════════════════════════════════════
    return () => {
      isMounted = false;
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('click', handleClick);

      // Remove TODOS os listeners do socket
      socket.off('playerInit');
      socket.off('mapSnapshot');
      socket.off('playerJoined');
      socket.off('playerMoved');
      socket.off('playerTeleported');
      socket.off('playerLeft');

      // Cleanup das camadas 3D
      controls.dispose();
      realtimePlayersLayer.cleanup();
      fixedBuildingsLayer.cleanup();
      playerMapSpaceRef.current?.cleanup();

      // Dispose de geometrias e materiais
      platformGeometry.dispose();
      platformMaterial.dispose();
      clickPlaneGeo.dispose();
      clickPlaneMat.dispose();
      selectionGeo.dispose();
      selectionMat.dispose();
      floorTexture.dispose();

      // Remove objetos da cena
      scene.remove(platform);
      scene.remove(clickPlane);
      scene.remove(selectionMesh);

      // Remove o canvas do DOM
      renderer.dispose();
      if (
        mountEl &&
        renderer.domElement &&
        renderer.domElement.parentNode === mountEl
      ) {
        mountEl.removeChild(renderer.domElement);
      }
    };
  }, [
    navigate,
    player?.mapPosition?.tileX,
    player?.mapPosition?.tileY,
    player?._id,
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — JSX
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div
        ref={mountRef}
        className="w-full h-[calc(100vh-104px)] min-h-[500px]"
      />
      <OtherPlayerBarracoModal
        state={modalState}
        onClose={() => setModalState(closeOtherPlayerBarracoModal())}
        onSendPrivateMessage={(target) => {
          console.log('Enviar mensagem para:', target);
          setModalState(closeOtherPlayerBarracoModal());
        }}
        onInviteToFaction={(target) => {
          console.log('Convidar para facção:', target);
          setModalState(closeOtherPlayerBarracoModal());
        }}
        onAttack={(target) => {
          console.log('Atacar:', target);
          setModalState(closeOtherPlayerBarracoModal());
        }}
      />
    </div>
  );
}