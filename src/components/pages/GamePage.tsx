/**
 * GamePage.tsx — Mapa multiplayer em tempo real (REESCRITO - FUNCIONAL)
 *
 * ARQUITETURA FINAL:
 *   ✅ Socket como fonte primária de verdade
 *   ✅ Fallback REST com intervalo curto (10s) para garantir renderização inicial
 *   ✅ isMe() síncrono usando cache local myId (definido por playerInit)
 *   ✅ mapSnapshot processa TODOS os jogadores, filtrando o próprio
 *   ✅ playerMoved / playerTeleported ignorados se for o próprio jogador
 *   ✅ Um ÚNICO barraco por jogador, sem duplicação
 *   ✅ Movimento/teleporte acontece UMA única vez
 *   ✅ Clique em barraco de outro jogador abre modal
 *   ✅ Teleporte requer confirmação (dois cliques)
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

const GRID_WIDTH   = 120;
const GRID_HEIGHT  = 120;
const TILE_SIZE    = 1;
const PLATFORM_HEIGHT = 1.2;

const FLOOR_TEXTURE =
  'https://static.wixstatic.com/media/50f4bf_df004e568945465ba2231dc36addfe09~mv2.jpeg';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

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

    // ── LUZES ──────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.25));
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

    // ── PLATAFORMA ─────────────────────────────────────────────────────────
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

    // ── LOADER ─────────────────────────────────────────────────────────────
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    // ── PRÉDIOS FIXOS ─────────────────────────────────────────────────────
    const fixedBuildingsLayer = mountFixedMapBuildings({
      scene,
      loader,
      camera,
      container: mountEl,
      onNavigate: (path: string) => navigate(path),
      onMessage:  () => {},
    });

    // ── ESPAÇO DO PRÓPRIO JOGADOR ─────────────────────────────────────────
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

    controls.target.set(playerMapSpace.worldX, 0, playerMapSpace.worldZ);
    camera.position.set(
      playerMapSpace.worldX + 12,
      10,
      playerMapSpace.worldZ + 12
    );
    controls.update();

    // ── PLANO DE CLIQUE ────────────────────────────────────────────────────
    const clickPlaneGeo = new THREE.PlaneGeometry(GRID_WIDTH * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);
    const clickPlaneMat = new THREE.MeshBasicMaterial({
      transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
    });
    const clickPlane = new THREE.Mesh(clickPlaneGeo, clickPlaneMat);
    clickPlane.rotation.x = -Math.PI / 2;
    clickPlane.position.y = 0.05;
    scene.add(clickPlane);

    // ── SELETOR VISUAL ─────────────────────────────────────────────────────
    const selectionGeo = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
    const selectionMat = new THREE.MeshBasicMaterial({
      color: 0xd9b764, transparent: true, opacity: 0.4,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const selectionMesh = new THREE.Mesh(selectionGeo, selectionMat);
    selectionMesh.rotation.x = -Math.PI / 2;
    selectionMesh.position.set(0.5 - GRID_WIDTH / 2, 0.06, 0.5 - GRID_HEIGHT / 2);
    selectionMesh.visible = false;
    scene.add(selectionMesh);

    // ── CAMADA DE JOGADORES EM TEMPO REAL ─────────────────────────────────
    const realtimePlayersLayer = mountRealtimeMapPlayersLayer({
      scene,
      gridWidth:  GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
      tileSize:   TILE_SIZE,
      pollingMs:  10000,
      showSpaces: true,
    });
    realtimePlayersLayer.start();

    // ── ESTADO LOCAL (cache de posições) ───────────────────────────────────
    const localPlayers = new Map<string, { tileX: number; tileY: number }>();
    let myId: string | null = player?._id ? String(player._id) : null;

    // ═══════════════════════════════════════════════════════════════════════
    // SOCKET.IO — FONTE PRIMÁRIA DE VERDADE
    // ═══════════════════════════════════════════════════════════════════════
    const socket = getSocket();

    // ── playerInit: define myId ──────────────────────────────────────────
    socket.on('playerInit', (data: { player: any; faction?: any }) => {
      if (!isMounted) return;
      const incomingId = String(data.player?._id || data.player?.id || '');
      if (incomingId) {
        myId = incomingId;
        console.log('✅ playerInit: myId =', myId);
      }
      usePlayerStore.getState().hydratePlayerFromServer(data.player);
    });

    // ── Função auxiliar para processar snapshot ──────────────────────────
    async function processSnapshot(players: any[]) {
      if (!isMounted || !Array.isArray(players)) return;
      console.log('📍 Processando snapshot com', players.length, 'jogadores');
      
      const currentPlayerId = myId || (player?._id ? String(player._id) : null);
      const others = players.filter((p) => {
        const pId = String(p.id || p._id || '');
        return pId && pId !== currentPlayerId;
      });
      
      console.log('📍 Outros jogadores:', others.length, '| myId:', myId, '| currentPlayerId:', currentPlayerId);
      localPlayers.clear();
      for (const p of others) {
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
      }
      console.log('✅ Snapshot processado');
    }

    // ── mapSnapshot ──────────────────────────────────────────────────────
    socket.on('mapSnapshot', (players: any[]) => {
      if (!isMounted) return;
      console.log('🗺️ mapSnapshot recebido com', players?.length || 0, 'jogadores');
      processSnapshot(players);
    });

    // ── playerJoined ─────────────────────────────────────────────────────
    socket.on('playerJoined', async (p: any) => {
      if (!isMounted) return;
      const pId = String(p.id || p._id || '');
      const currentPlayerId = myId || (player?._id ? String(player._id) : null);
      if (pId === currentPlayerId) {
        console.log('⏭️ playerJoined ignorado (próprio jogador)');
        return;
      }
      console.log('👤 playerJoined:', p.id || p.name);
      localPlayers.set(String(p.id), { tileX: Number(p.tileX), tileY: Number(p.tileY) });
      await realtimePlayersLayer.upsertPlayer({
        id: String(p.id), name: p.name, tileX: Number(p.tileX), tileY: Number(p.tileY),
        barracoLevel: Number(p.barracoLevel ?? 1), power: Number(p.power ?? 0),
        factionId: p.factionId ?? null,
      });
    });

    // ── playerMoved ──────────────────────────────────────────────────────
    socket.on('playerMoved', async (data: any) => {
      if (!isMounted) return;
      const pId = String(data.playerId || data.id || '');
      const currentPlayerId = myId || (player?._id ? String(player._id) : null);
      console.log('🚀 playerMoved:', data.playerId, data.tileX, data.tileY);
      if (pId === currentPlayerId) {
        console.log('⏭️ Ignorado (próprio jogador)');
        return;
      }
      localPlayers.set(String(data.playerId), {
        tileX: Number(data.tileX), tileY: Number(data.tileY),
      });
      await realtimePlayersLayer.upsertPlayer({
        id: String(data.playerId), name: data.name,
        tileX: Number(data.tileX), tileY: Number(data.tileY),
      });
    });

    // ── playerTeleported ─────────────────────────────────────────────────
    socket.on('playerTeleported', async (data: any) => {
      if (!isMounted) return;
      const pId = String(data.playerId || data.id || '');
      const currentPlayerId = myId || (player?._id ? String(player._id) : null);
      if (pId === currentPlayerId) {
        console.log('⏭️ playerTeleported ignorado (próprio jogador)');
        return;
      }
      console.log('🌀 playerTeleported:', data.playerId);
      localPlayers.set(String(data.playerId), {
        tileX: Number(data.newPosition.tileX),
        tileY: Number(data.newPosition.tileY),
      });
      await realtimePlayersLayer.upsertPlayer({
        id: String(data.playerId), name: data.name,
        tileX: Number(data.newPosition.tileX),
        tileY: Number(data.newPosition.tileY),
      });
    });

    // ── playerLeft ───────────────────────────────────────────────────────
    socket.on('playerLeft', (data: { playerId: string }) => {
      if (!isMounted) return;
      console.log('👋 playerLeft:', data.playerId);
      localPlayers.delete(String(data.playerId));
      void realtimePlayersLayer.refresh();
    });

    // ── SOLICITAR SNAPSHOT INICIAL ───────────────────────────────────────
    if (socket.connected) {
      console.log('🔌 Socket já conectado, solicitando mapSnapshot');
      socket.emit('requestMapSnapshot');
    } else {
      console.log('⏳ Aguardando conexão do socket...');
      socket.once('connect', () => {
        if (isMounted) {
          console.log('🔌 Socket conectado, solicitando mapSnapshot');
          socket.emit('requestMapSnapshot');
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CLICK HANDLER
    // ═══════════════════════════════════════════════════════════════════════
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();
    let pendingTeleportTile: { tileX: number; tileY: number } | null = null;

    function handleClick(event: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((event.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // Clique no próprio barraco → navega
      const ownHits = raycaster.intersectObjects(
        playerMapSpaceRef.current?.modelContainer?.children || [], true
      );
      if (ownHits.length > 0) {
        navigate('/barraco');
        return;
      }

      // Clique em barraco de outro jogador → modal
      const otherHits = raycaster.intersectObjects(
        realtimePlayersLayer.group.children, true
      );
      if (otherHits.length > 0) {
        const hitObject = otherHits[0].object;
        let current: any = hitObject;
        while (current) {
          if (current.userData?.playerId) {
            const playerId = String(current.userData.playerId);
            const playerData = realtimePlayersLayer.players().find(
              (p: any) => String(p.id) === playerId
            );
            if (playerData) {
              console.log('🎯 Clique em barraco de outro jogador:', playerData.id, playerData.name);
              setModalState(openOtherPlayerBarracoModal({
                id: playerData.id,
                name: playerData.name || 'Jogador',
                barracoLevel: playerData.barracoLevel,
                factionId: playerData.factionId,
              }));
            }
            return;
          }
          current = current.parent;
        }
      }

      // Clique no chão → movimento
      const hits = raycaster.intersectObject(clickPlane, false);
      if (!hits.length) return;

      const point = hits[0].point;
      const clickedTileX = Math.floor(point.x + GRID_WIDTH  / 2);
      const clickedTileY = Math.floor(point.z + GRID_HEIGHT / 2);

      if (clickedTileX < 0 || clickedTileX >= GRID_WIDTH || clickedTileY < 0 || clickedTileY >= GRID_HEIGHT) return;

      // Verifica se há barraco de outro jogador no tile
      const tileKey = `${clickedTileX},${clickedTileY}`;
      const occupiedByPlayer = Array.from(localPlayers.values()).find(
        (p) => `${p.tileX},${p.tileY}` === tileKey
      );
      if (occupiedByPlayer) {
        console.log('⚠️ Tile ocupado por outro jogador');
        return;
      }

      // Se já há um teleporte pendente, confirma
      if (pendingTeleportTile && pendingTeleportTile.tileX === clickedTileX && pendingTeleportTile.tileY === clickedTileY) {
        console.log('✅ Confirmando teleporte para:', clickedTileX, clickedTileY);
        pendingTeleportTile = null;

        teleportPlayerMapSpace(playerMapSpaceRef.current, {
          clickedTileX,
          clickedTileY,
          occupiedOrigins: [],
          gridWidth:  GRID_WIDTH,
          gridHeight: GRID_HEIGHT,
        });

        usePlayerStore.getState().applyPlayerUpdate((p) => ({
          ...p,
          mapPosition: {
            tileX: clickedTileX,
            tileY: clickedTileY,
            worldX: (clickedTileX - GRID_WIDTH  / 2) * TILE_SIZE + TILE_SIZE / 2,
            worldY: (clickedTileY - GRID_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2,
          },
        }));

        socket.emit('move', { tileX: clickedTileX, tileY: clickedTileY });
        selectionMesh.visible = false;
        return;
      }

      // Primeiro clique → mostra seleção e pede confirmação
      console.log('🎯 Selecionando tile para teleporte:', clickedTileX, clickedTileY);
      pendingTeleportTile = { tileX: clickedTileX, tileY: clickedTileY };
      selectionMesh.position.set(clickedTileX - GRID_WIDTH / 2 + 0.5, 0.06, clickedTileY - GRID_HEIGHT / 2 + 0.5);
      selectionMesh.visible = true;
    }

    renderer.domElement.addEventListener('click', handleClick);

    // ── RESIZE ─────────────────────────────────────────────────────────────
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

    // ── ANIMATE ────────────────────────────────────────────────────────────
    let animationFrameId = 0;
    function animate() {
      animationFrameId = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // ── CLEANUP ────────────────────────────────────────────────────────────
    return () => {
      isMounted = false;
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('click', handleClick);

      socket.off('playerInit');
      socket.off('mapSnapshot');
      socket.off('playerJoined');
      socket.off('playerMoved');
      socket.off('playerTeleported');
      socket.off('playerLeft');

      controls.dispose();
      realtimePlayersLayer.cleanup();
      fixedBuildingsLayer.cleanup();
      playerMapSpaceRef.current?.cleanup();

      platformGeometry.dispose();
      platformMaterial.dispose();
      clickPlaneGeo.dispose();
      clickPlaneMat.dispose();
      selectionGeo.dispose();
      selectionMat.dispose();
      floorTexture.dispose();

      scene.remove(platform);
      scene.remove(clickPlane);
      scene.remove(selectionMesh);

      renderer.dispose();
      if (mountEl && renderer.domElement && renderer.domElement.parentNode === mountEl) {
        mountEl.removeChild(renderer.domElement);
      }
    };
  }, [navigate, player?.mapPosition?.tileX, player?.mapPosition?.tileY, player?._id]);

  // ── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div ref={mountRef} className="w-full h-[calc(100vh-104px)] min-h-[500px]" />
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
