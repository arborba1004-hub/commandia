
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE            from 'three';
import { OrbitControls }     from 'three/examples/jsm/controls/OrbitControls';
import { useNavigate }       from 'react-router-dom';
import { GLTFLoader }        from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader }       from 'three/examples/jsm/loaders/DRACOLoader';

import { mountFixedMapBuildings }                      from '@/components/game/fixedMapBuildings';
import { mountPlayerMapSpace, isPlayerSpaceAvailable } from '@/components/game/playerMapSpace';
import { mountRealtimeMapPlayersLayer }                from '@/components/game/realtimeMapPlayersLayer';
import { teleportPlayerMapSpace }                      from '@/components/game/playerTeleport';

import { usePlayerStore }        from '@/store/playerStore';
import { getSocket }             from '@/socket';
import type { AttackTarget }     from '@/store/mapAttackStore';
import { invitePlayerToFaction } from '@/services/factionInviteService';

import Header from '@/components/Header';
import OtherPlayerBarracoModal, {
  type OtherPlayerBarracoTarget,
  createOtherPlayerBarracoModalState,
  openOtherPlayerBarracoModal,
  closeOtherPlayerBarracoModal,
} from '@/components/game/OtherPlayerBarracoModal';
import MapAttackWithGangModal from '@/components/game/MapAttackWithGangModal';

const GRID_WIDTH      = 120;
const GRID_HEIGHT     = 120;
const TILE_SIZE       = 1;
const PLATFORM_HEIGHT = 1.2;

const FLOOR_TEXTURE =
  'https://static.wixstatic.com/media/50f4bf_df004e568945465ba2231dc36addfe09~mv2.jpeg';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

export default function GamePage() {
  const mountRef    = useRef<HTMLDivElement | null>(null);
  const navigate    = useNavigate();
  const player      = usePlayerStore((s) => s.player);
  const myFactionId = usePlayerStore((s) => s.player.factionId) ?? null;

  const playerMapSpaceRef = useRef<any>(null);

  // ── Modal: barraco de outro jogador
  const [modalState,       setModalState]       = useState(createOtherPlayerBarracoModalState());
  const [isInviting,       setIsInviting]       = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // ── Modal: atacar com gang
  const [attackModalOpen, setAttackModalOpen] = useState(false);
  const [attackTarget,    setAttackTarget]    = useState<AttackTarget | null>(null);

  // ── Handler: mensagem privada
  const handleSendPrivateMessage = useCallback(
    (_target: OtherPlayerBarracoTarget) => {
      setModalState(closeOtherPlayerBarracoModal());
      navigate('/chat');
    },
    [navigate]
  );

  // ── Handler: convidar para facção
  const handleInviteToFaction = useCallback(
    async (target: OtherPlayerBarracoTarget) => {
      if (!target?.id) return;
      setIsInviting(true);
      try {
        await invitePlayerToFaction(target.id);
        console.log('✅ Convite enviado para:', target.name);
        setModalState(closeOtherPlayerBarracoModal());
      } catch (error) {
        console.error('❌ Erro ao convidar:', error);
      } finally {
        setIsInviting(false);
      }
    },
    []
  );

  // ── Handler: atacar
  const handleAttack = useCallback(
    (_target: OtherPlayerBarracoTarget) => {
      setModalState(closeOtherPlayerBarracoModal());
      setAttackModalOpen(true);
    },
    []
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // EFEITO THREE.JS
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    let isMounted = true;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050505');

    const camera = new THREE.PerspectiveCamera(
      50,
      mountEl.clientWidth / Math.max(mountEl.clientHeight, 1),
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    mountEl.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping  = true;
    controls.dampingFactor  = 0.06;
    controls.minDistance    = 10;
    controls.maxDistance    = 70;
    controls.maxPolarAngle  = Math.PI / 2.05;

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

    const textureLoader = new THREE.TextureLoader();
    const floorTexture  = textureLoader.load(FLOOR_TEXTURE);
    floorTexture.wrapS     = THREE.ClampToEdgeWrapping;
    floorTexture.wrapT     = THREE.ClampToEdgeWrapping;
    floorTexture.repeat.set(1, 1);
    floorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    floorTexture.magFilter  = THREE.LinearFilter;
    floorTexture.minFilter  = THREE.LinearMipmapLinearFilter;

    const platformGeometry = new THREE.BoxGeometry(
      GRID_WIDTH * TILE_SIZE, PLATFORM_HEIGHT, GRID_HEIGHT * TILE_SIZE
    );
    const platformMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture, roughness: 1, metalness: 0,
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, -PLATFORM_HEIGHT / 2, 0);
    platform.receiveShadow = true;
    scene.add(platform);

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    const fixedBuildingsLayer = mountFixedMapBuildings({
      scene,
      loader,
      camera,
      container: mountEl,
      onNavigate: (path: string) => navigate(path),
      onMessage:  () => {},
    });

    // Cache de posições dos outros jogadores
    const localPlayers = new Map<string, { tileX: number; tileY: number }>();

    // myId inicializado do store; playerInit o atualiza via closure
    let myId: string | null = player?._id ? String(player._id) : null;

    // ── Camada de jogadores em tempo real ─────────────────────────────────
    const realtimePlayersLayer = mountRealtimeMapPlayersLayer({
      scene,
      gridWidth:  GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
      tileSize:   TILE_SIZE,
      pollingMs:  10000,
      showSpaces: true,
      getMyId:    () => myId,   // closure lê myId em tempo real
    });
    realtimePlayersLayer.start();

    const occupiedOrigins = Array.from(localPlayers.values()).map((p) => ({
      tileX: p.tileX, tileY: p.tileY,
    }));

    const playerMapSpace = mountPlayerMapSpace({
      scene,
      tileX:        Number(player?.mapPosition?.tileX ?? 0),
      tileY:        Number(player?.mapPosition?.tileY ?? 0),
      barracoLevel: Number(player?.niveis?.barracoLevel ?? 1),
      gridWidth:    GRID_WIDTH,
      gridHeight:   GRID_HEIGHT,
      tileSize:     TILE_SIZE,
      occupiedOrigins,
    });
    playerMapSpaceRef.current = playerMapSpace;

    controls.target.set(playerMapSpace.worldX, 0, playerMapSpace.worldZ);
    camera.position.set(playerMapSpace.worldX + 12, 10, playerMapSpace.worldZ + 12);
    controls.update();

    const clickPlaneGeo = new THREE.PlaneGeometry(
      GRID_WIDTH * TILE_SIZE, GRID_HEIGHT * TILE_SIZE
    );
    const clickPlaneMat = new THREE.MeshBasicMaterial({
      transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
    });
    const clickPlane = new THREE.Mesh(clickPlaneGeo, clickPlaneMat);
    clickPlane.rotation.x = -Math.PI / 2;
    clickPlane.position.y = 0.05;
    scene.add(clickPlane);

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

    // ═════════════════════════════════════════════════════════════════════════
    // SOCKET.IO
    // ═════════════════════════════════════════════════════════════════════════
    const socket = getSocket();

    const onPlayerInit = (data: { player: any; faction?: any }) => {
      if (!isMounted) return;
      const incomingId = String(data.player?._id || data.player?.id || '');
      if (incomingId) {
        myId = incomingId;
        console.log('✅ playerInit: myId =', myId);
      }
      usePlayerStore.getState().hydratePlayerFromServer(data.player);
    };
    socket.on('playerInit', onPlayerInit);

    async function processSnapshot(players: any[]) {
      if (!isMounted || !Array.isArray(players)) return;
      const currentId = myId || (player?._id ? String(player._id) : null);
      const others = players.filter((p) => {
        const pId = String(p.id || p._id || '');
        return pId && pId !== currentId;
      });
      localPlayers.clear();
      for (const p of others) {
        localPlayers.set(String(p.id), { tileX: Number(p.tileX), tileY: Number(p.tileY) });
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
    }

    function handleMapSnapshot(players: any[]) {
      if (!isMounted) return;
      void processSnapshot(players);
    }

    async function handlePlayerJoined(p: any) {
      if (!isMounted) return;
      const pId = String(p.id || p._id || '');
      if (pId === (myId || String(player?._id || ''))) return;
      localPlayers.set(pId, { tileX: Number(p.tileX), tileY: Number(p.tileY) });
      await realtimePlayersLayer.upsertPlayer({
        id:           pId,
        name:         p.name || 'Jogador',
        tileX:        Number(p.tileX),
        tileY:        Number(p.tileY),
        barracoLevel: Number(p.barracoLevel ?? 1),
        power:        Number(p.power ?? 0),
        factionId:    p.factionId ?? null,
      });
    }

    async function handlePlayerMoved(data: any) {
      if (!isMounted) return;
      const pId = String(data.playerId || data.id || '');
      if (pId === (myId || String(player?._id || ''))) {
        console.log('⏭️ playerMoved ignorado (próprio jogador)');
        return;
      }
      localPlayers.set(pId, { tileX: Number(data.tileX), tileY: Number(data.tileY) });
      await realtimePlayersLayer.upsertPlayer({
        id:    pId,
        name:  data.name,
        tileX: Number(data.tileX),
        tileY: Number(data.tileY),
      });
    }

    async function handlePlayerTeleported(data: any) {
      if (!isMounted) return;
      const pId = String(data.playerId || data.id || '');
      if (pId === (myId || String(player?._id || ''))) {
        console.log('⏭️ playerTeleported ignorado (próprio jogador)');
        return;
      }
      localPlayers.set(pId, {
        tileX: Number(data.newPosition.tileX),
        tileY: Number(data.newPosition.tileY),
      });
      await realtimePlayersLayer.upsertPlayer({
        id:    pId,
        name:  data.name,
        tileX: Number(data.newPosition.tileX),
        tileY: Number(data.newPosition.tileY),
      });
    }

    function handlePlayerLeft(data: { playerId: string }) {
      if (!isMounted) return;
      localPlayers.delete(String(data.playerId));
      void realtimePlayersLayer.refresh();
    }

    socket.on('mapSnapshot', handleMapSnapshot);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('playerMoved', handlePlayerMoved);
    socket.on('playerTeleported', handlePlayerTeleported);
    socket.on('playerLeft', handlePlayerLeft);

    // ── barracoInfo: enriquece modal + prepara AttackTarget ───────────────
    const onBarracoInfo = (data: any) => {
      if (!isMounted) return;
      console.log('🏠 barracoInfo:', data.playerName, '| power:', data.power);

      // Atualiza modal com dados completos (avatar, factionName, etc.)
      setModalState(
        openOtherPlayerBarracoModal({
          id:           String(data.playerId),
          name:         data.playerName  || 'Jogador',
          avatarUrl:    data.avatarUrl   ?? null,
          factionId:    data.factionId   ?? null,
          factionName:  data.factionName ?? null,
          barracoLevel: Number(data.barracoLevel ?? 1),
        })
      );

      // Prepara AttackTarget para o MapAttackWithGangModal
      setAttackTarget({
        playerId:     String(data.playerId),
        playerName:   data.playerName || 'Jogador',
        tileX:        Number(data.tileX ?? 0),
        tileY:        Number(data.tileY ?? 0),
        barracoLevel: Number(data.barracoLevel ?? 1),
        power:        Number(data.power ?? 0),
        factionId:    data.factionId ?? null,
      });
    };
    socket.on('barracoInfo', onBarracoInfo);

    if (socket.connected) {
      socket.emit('requestMapSnapshot');
    } else {
      socket.once('connect', () => {
        if (isMounted) socket.emit('requestMapSnapshot');
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // CLICK HANDLER
    // ═════════════════════════════════════════════════════════════════════════
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();
    let pendingTeleportTile: { tileX: number; tileY: number } | null = null;

    function handleClick(event: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((event.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // Próprio barraco → /barraco
      const ownHits = raycaster.intersectObjects(
        playerMapSpaceRef.current?.modelContainer?.children || [], true
      );
      if (ownHits.length > 0) {
        navigate('/barraco');
        return;
      }

      // Barraco de outro jogador → modal
      const otherHits = raycaster.intersectObjects(
        realtimePlayersLayer.group.children, true
      );
      if (otherHits.length > 0) {
        let current: any = otherHits[0].object;
        while (current) {
          if (current.userData?.playerId) {
            const playerId   = String(current.userData.playerId);
            const playerData = realtimePlayersLayer.players()
              .find((p: any) => String(p.id) === playerId);

            if (playerData) {
              // 1) Abre imediatamente com dados básicos (UX otimista)
              setModalState(openOtherPlayerBarracoModal({
                id:           playerData.id,
                name:         playerData.name || 'Jogador',
                barracoLevel: playerData.barracoLevel,
                factionId:    playerData.factionId,
              }));
              // 2) Solicita dados ricos → barracoInfo event atualizará modal + attackTarget
              socket.emit('requestBarracoInfo', { targetPlayerId: playerId });
            }
            return;
          }
          current = current.parent;
        }
      }

      // Chão → teleporte (dois cliques para confirmar)
      const hits = raycaster.intersectObject(clickPlane, false);
      if (!hits.length) return;

      const point       = hits[0].point;
      const clickedTileX = Math.floor(point.x + GRID_WIDTH  / 2);
      const clickedTileY = Math.floor(point.z + GRID_HEIGHT / 2);

      if (
        clickedTileX < 0 || clickedTileX >= GRID_WIDTH ||
        clickedTileY < 0 || clickedTileY >= GRID_HEIGHT
      ) return;

      // Bloqueia tile de outro jogador
      if (
        Array.from(localPlayers.values()).find(
          (p) => `${p.tileX},${p.tileY}` === `${clickedTileX},${clickedTileY}`
        )
      ) {
        console.log('⚠️ Tile ocupado por outro jogador');
        return;
      }

      const currentOccupied = Array.from(localPlayers.values()).map((p) => ({
        tileX: p.tileX, tileY: p.tileY,
      }));

      if (!isPlayerSpaceAvailable(clickedTileX, clickedTileY, currentOccupied, GRID_WIDTH, GRID_HEIGHT)) {
        console.log('⚠️ Tile não está livre');
        return;
      }

      // Segundo clique no mesmo tile → confirma teleporte
      if (
        pendingTeleportTile &&
        pendingTeleportTile.tileX === clickedTileX &&
        pendingTeleportTile.tileY === clickedTileY
      ) {
        console.log('✅ Confirmando teleporte:', clickedTileX, clickedTileY);
        pendingTeleportTile   = null;
        selectionMesh.visible = false;

        // ── teleportPlayerMapSpace: resolve colisão + atualiza posição 3D ──
        const result = teleportPlayerMapSpace(playerMapSpaceRef.current, {
          clickedTileX,
          clickedTileY,
          occupiedOrigins: currentOccupied,
          gridWidth:  GRID_WIDTH,
          gridHeight: GRID_HEIGHT,
        });

        // Atualiza store de forma otimista
        usePlayerStore.getState().applyPlayerUpdate((p) => ({
          ...p,
          mapPosition: {
            tileX:  result.tileX,
            tileY:  result.tileY,
            worldX: result.worldX,
            worldY: result.worldZ,
          },
        }));

        // 'teleport' tem cooldown de 30s no backend (diferente de 'move' que é 1s)
        socket.emit('teleport', {
          tileX:        result.tileX,
          tileY:        result.tileY,
          teleportType: 'manual',
        });

        return;
      }

      // Primeiro clique → mostra seletor, aguarda confirmação
      console.log('🎯 Selecionando tile:', clickedTileX, clickedTileY);
      pendingTeleportTile = { tileX: clickedTileX, tileY: clickedTileY };
      selectionMesh.position.set(
        clickedTileX - GRID_WIDTH  / 2 + 0.5,
        0.06,
        clickedTileY - GRID_HEIGHT / 2 + 0.5
      );
      selectionMesh.visible = true;
    }

    renderer.domElement.addEventListener('click', handleClick);

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

    let animationFrameId = 0;
    function animate() {
      animationFrameId = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('click', handleClick);

      socket.off('playerInit', onPlayerInit);
      socket.off('mapSnapshot', handleMapSnapshot);
      socket.off('playerJoined', handlePlayerJoined);
      socket.off('playerMoved', handlePlayerMoved);
      socket.off('playerTeleported', handlePlayerTeleported);
      socket.off('playerLeft', handlePlayerLeft);
      socket.off('barracoInfo', onBarracoInfo);

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
      if (mountEl && renderer.domElement?.parentNode === mountEl) {
        mountEl.removeChild(renderer.domElement);
      }
    };
  }, [navigate, player?.mapPosition?.tileX, player?.mapPosition?.tileY, player?._id]);

  return (
    <div className="min-h-screen bg-black">
      <Header />

      {/* Canvas 3D */}
      <div ref={mountRef} className="w-full h-[calc(100vh-104px)] min-h-[500px]" />

      {/* Modal: barraco de outro jogador */}
      <OtherPlayerBarracoModal
        state={modalState}
        myFactionId={myFactionId}
        isInviting={isInviting}
        isSendingMessage={isSendingMessage}
        onClose={() => setModalState(closeOtherPlayerBarracoModal())}
        onSendPrivateMessage={handleSendPrivateMessage}
        onInviteToFaction={handleInviteToFaction}
        onAttack={handleAttack}
      />

      {/* Modal: atacar com gang */}
      <MapAttackWithGangModal
        isOpen={attackModalOpen}
        onClose={() => {
          setAttackModalOpen(false);
          setAttackTarget(null);
        }}
        target={attackTarget}
        onAttackConfirmed={(result) => {
          console.log('⚔️ Ataque concluído:', result);
          setAttackModalOpen(false);
          setAttackTarget(null);
        }}
      />
    </div>
  );
}