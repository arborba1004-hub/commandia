/**
 * GamePage.tsx — Mapa multiplayer em tempo real
 *
 * MUDANÇAS vs. versão anterior:
 *   - Remove require('socket.io-client') — usava ESM incorretamente
 *   - Usa getSocket() com JWT auth automático
 *   - Trata mapSnapshot → popula todos os barracos ao conectar
 *   - Trata playerJoined / playerMoved / playerLeft em tempo real
 *   - Movimento no mapa:
 *       1. teleportPlayerMapSpace() — move o visual imediatamente (otimista)
 *       2. applyPlayerUpdate() — atualiza o store local (sem sync)
 *       3. socket.emit('move') — backend salva + broadcast para todos
 *   - Mantém todos os sistemas existentes intactos (fixedBuildings, playerMapSpace, etc.)
 */

import { useEffect, useRef } from 'react';
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
  const navigate = useNavigate();
  const player   = usePlayerStore((state) => state.player);

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    let isMounted = true;

    // ── Scene ─────────────────────────────────────────────────────────────────
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

    // ── Luzes ─────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.25));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.35);
    dirLight.position.set(40, 90, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width  = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near   = 1;
    dirLight.shadow.camera.far    = 300;
    dirLight.shadow.camera.left   = -90; dirLight.shadow.camera.right  = 90;
    dirLight.shadow.camera.top    = 90;  dirLight.shadow.camera.bottom = -90;
    scene.add(dirLight);

    // ── Plataforma ────────────────────────────────────────────────────────────
    const textureLoader = new THREE.TextureLoader();
    const floorTexture  = textureLoader.load(FLOOR_TEXTURE);
    floorTexture.wrapS  = THREE.ClampToEdgeWrapping;
    floorTexture.wrapT  = THREE.ClampToEdgeWrapping;
    floorTexture.repeat.set(1, 1);
    floorTexture.anisotropy  = renderer.capabilities.getMaxAnisotropy();
    floorTexture.magFilter   = THREE.LinearFilter;
    floorTexture.minFilter   = THREE.LinearMipmapLinearFilter;

    const platformGeometry = new THREE.BoxGeometry(GRID_WIDTH * TILE_SIZE, PLATFORM_HEIGHT, GRID_HEIGHT * TILE_SIZE);
    const platformMaterial = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 1, metalness: 0 });
    const platform         = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, -PLATFORM_HEIGHT / 2, 0);
    platform.receiveShadow = true;
    scene.add(platform);

    // ── Loader ────────────────────────────────────────────────────────────────
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    // ── Prédios fixos ─────────────────────────────────────────────────────────
    const fixedBuildingsLayer = mountFixedMapBuildings({
      scene,
      loader,
      camera,
      container: mountEl,
      onNavigate: (path) => navigate(path),
      onMessage:  () => {},
    });

    // ── Espaço do próprio jogador ─────────────────────────────────────────────
    const playerMapSpace = mountPlayerMapSpace({
      scene,
      tileX:        Number(player?.mapPosition?.tileX ?? 0),
      tileY:        Number(player?.mapPosition?.tileY ?? 0),
      barracoLevel: Number(player?.niveis?.barracoLevel ?? 1),
      gridWidth:    GRID_WIDTH,
      gridHeight:   GRID_HEIGHT,
      tileSize:     TILE_SIZE,
    });

    // Centraliza câmera no barraco do jogador
    controls.target.set(playerMapSpace.worldX, 0, playerMapSpace.worldZ);
    camera.position.set(playerMapSpace.worldX + 12, 10, playerMapSpace.worldZ + 12);
    controls.update();

    // ── Plano de clique ───────────────────────────────────────────────────────
    const clickPlaneGeo = new THREE.PlaneGeometry(GRID_WIDTH * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);
    const clickPlaneMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const clickPlane    = new THREE.Mesh(clickPlaneGeo, clickPlaneMat);
    clickPlane.rotation.x = -Math.PI / 2;
    clickPlane.position.y = 0.05;
    scene.add(clickPlane);

    // ── Seleção visual ────────────────────────────────────────────────────────
    const selectionGeo = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
    const selectionMat = new THREE.MeshBasicMaterial({ color: 0xd9b764, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false });
    const selectionMesh = new THREE.Mesh(selectionGeo, selectionMat);
    selectionMesh.rotation.x = -Math.PI / 2;
    selectionMesh.position.set(0.5 - GRID_WIDTH / 2, 0.06, 0.5 - GRID_HEIGHT / 2);
    selectionMesh.visible = false;
    scene.add(selectionMesh);

    // ══════════════════════════════════════════════════════════════════════════
    // ── CAMADA MULTIPLAYER EM TEMPO REAL ─────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * realtimePlayersLayer: renderiza barracos 3D de TODOS os outros jogadores.
     * pollingMs: 10000 — fallback REST, caso socket perca eventos.
     * showSpaces: true — mostra área do lote de cada jogador.
     */
    const realtimePlayersLayer = mountRealtimeMapPlayersLayer({
      scene,
      gridWidth:  GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
      tileSize:   TILE_SIZE,
      pollingMs:  10000,
      showSpaces: true,
    });

    /**
     * localPlayers: posições atuais de todos os outros jogadores.
     * Usado para verificar tiles ocupados sem depender do layer interno.
     */
    const localPlayers = new Map<string, { tileX: number; tileY: number }>();
    const myId = player?._id ? String(player._id) : null;
    const isMe = (id: string) => !!myId && String(id) === myId;

    // ── Socket.io ─────────────────────────────────────────────────────────────
    const socket = getSocket();

    // Snapshot completo → popula todos os barracos ao conectar
    socket.on('mapSnapshot', async (players: any[]) => {
      if (!isMounted) return;
      const others = players.filter((p) => !isMe(p.id));
      others.forEach((p) => localPlayers.set(String(p.id), { tileX: Number(p.tileX), tileY: Number(p.tileY) }));
      for (const p of others) {
        if (!isMounted) break;
        await realtimePlayersLayer.upsertPlayer({
          id:           String(p.id),
          name:         p.name,
          tileX:        Number(p.tileX),
          tileY:        Number(p.tileY),
          barracoLevel: Number(p.barracoLevel ?? 1),
          power:        Number(p.power ?? 0),
          factionId:    p.factionId ?? null,
        });
      }
    });

    // Novo jogador entrou
    socket.on('playerJoined', async (p: any) => {
      if (!isMounted || isMe(p.id)) return;
      localPlayers.set(String(p.id), { tileX: Number(p.tileX), tileY: Number(p.tileY) });
      await realtimePlayersLayer.upsertPlayer({
        id: String(p.id), name: p.name,
        tileX: Number(p.tileX), tileY: Number(p.tileY),
        barracoLevel: Number(p.barracoLevel ?? 1),
        power: Number(p.power ?? 0), factionId: p.factionId ?? null,
      });
    });

    // Jogador se moveu → atualiza visual imediatamente (~10-50ms)
    socket.on('playerMoved', async (data: { playerId: string; name?: string; tileX: number; tileY: number }) => {
      if (!isMounted || isMe(data.playerId)) return;
      localPlayers.set(String(data.playerId), { tileX: Number(data.tileX), tileY: Number(data.tileY) });
      await realtimePlayersLayer.upsertPlayer({
        id: String(data.playerId), name: data.name,
        tileX: Number(data.tileX), tileY: Number(data.tileY),
      });
    });

    // Jogador saiu → remove do mapa
    socket.on('playerLeft', (data: { playerId: string }) => {
      if (!isMounted) return;
      localPlayers.delete(String(data.playerId));
      void realtimePlayersLayer.refresh();
    });

    // Inicia polling REST como fallback
    realtimePlayersLayer.start();

    // ── Click handler ─────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();

    function handleClick(event: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((event.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // Clique no próprio barraco → navega para /barraco
      const ownHits = raycaster.intersectObjects(playerMapSpace.modelContainer.children, true);
      if (ownHits.length > 0) { navigate('/barraco'); return; }

      // Clique no chão
      const hits = raycaster.intersectObject(clickPlane, false);
      if (!hits.length) return;

      const point = hits[0].point;
      const tileX = Math.floor(point.x + GRID_WIDTH  / 2);
      const tileY = Math.floor(point.z + GRID_HEIGHT / 2);

      if (tileX < 0 || tileX >= GRID_WIDTH || tileY < 0 || tileY >= GRID_HEIGHT) return;

      // Verifica se tile está ocupado (sem confirm — movimento fluido como Mafia City)
      const tileKey = `${tileX},${tileY}`;
      const occupied = Array.from(localPlayers.values()).some(
        (p) => `${p.tileX},${p.tileY}` === tileKey
      );

      if (occupied) {
        // Tile ocupado → poderia abrir modal de ataque/invasão
        // TODO: useMapAttackStore.getState().openPreview(...)
        return;
      }

      // ── Move o jogador ────────────────────────────────────────────────────
      // 1. Atualiza visual do próprio barraco imediatamente (otimista)
      selectionMesh.position.set(tileX - GRID_WIDTH / 2 + 0.5, 0.06, tileY - GRID_HEIGHT / 2 + 0.5);
      selectionMesh.visible = true;

      teleportPlayerMapSpace(playerMapSpace, {
        clickedTileX: tileX,
        clickedTileY: tileY,
        occupiedOrigins: [],
        gridWidth:  GRID_WIDTH,
        gridHeight: GRID_HEIGHT,
      });

      // 2. Atualiza store local (sem sync — socket traz o estado de volta)
      usePlayerStore.getState().applyPlayerUpdate((p) => ({
        ...p,
        mapPosition: {
          tileX,
          tileY,
          worldX: (tileX - GRID_WIDTH  / 2) * TILE_SIZE + TILE_SIZE / 2,
          worldY: (tileY - GRID_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2,
        },
      }));

      // 3. Broadcast via socket → backend salva no DB + emite playerMoved para todos
      socket.emit('move', { tileX, tileY });
    }

    renderer.domElement.addEventListener('click', handleClick);

    // ── Resize ────────────────────────────────────────────────────────────────
    function handleResize() {
      const w = mountEl.clientWidth;
      const h = Math.max(mountEl.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mountEl);

    // ── Animate ───────────────────────────────────────────────────────────────
    let animationFrameId = 0;

    function animate() {
      animationFrameId = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      isMounted = false;
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('click', handleClick);

      // Remove listeners do socket (NÃO desconecta — singleton)
      socket.off('mapSnapshot');
      socket.off('playerJoined');
      socket.off('playerMoved');
      socket.off('playerLeft');

      controls.dispose();
      realtimePlayersLayer.cleanup();
      fixedBuildingsLayer.cleanup();
      playerMapSpace.cleanup();

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

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div ref={mountRef} className="w-full h-[calc(100vh-104px)] min-h-[500px]" />
    </div>
  );
}
