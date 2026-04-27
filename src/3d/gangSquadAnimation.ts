/**
 * 3d/gangSquadAnimation.ts
 * Animação de deslocamento do squad no mapa.
 * Refatorado de: gangAttackAnimation.ts + animateSquadOnRoute.ts
 *
 * Responsabilidade única: animar um grupo Three.js ao longo de uma rota de tiles.
 * Os efeitos visuais (explosão, shockwave, etc.) são de gangAttackEffects.ts.
 */

import * as THREE from 'three';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═════════════════════════════════════════════════════════════════════════════

export type RouteTile = {
  tileX: number;
  tileY: number;
};

export type SquadMarkerOptions = {
  /** Número de membros exibido no label do squad */
  memberCount: number;
  /** Cor hex do squad (atacante = '#ef4444', etc.) */
  color?: string;
};

export type GangSquadAnimationParams = {
  scene:         THREE.Scene;
  route:         RouteTile[];
  gridWidth:     number;
  gridHeight:    number;
  tileSize?:     number;
  /** nível do barraco determina velocidade de deslocamento */
  barracoLevel?: number;
  memberCount?:  number;
  color?:        string;
  onStep?:       (stepIndex: number, tile: RouteTile) => void;
  onArrived?:    () => void;
};

export type MountedSquadAnimation = {
  group:             THREE.Group;
  routeDistanceTiles: number;
  totalDurationMs:   number;
  start:             () => Promise<void>;
  cancel:            () => void;
  cleanup:           () => void;
};

// ═════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═════════════════════════════════════════════════════════════════════════════

/** Tempo base por tile em ms. Dividido pelo nível do barraco. */
const BASE_MS_PER_TILE = 5000;
const MARKER_HEIGHT    = 1.35;

// ═════════════════════════════════════════════════════════════════════════════
// CONVERSÃO TILE → MUNDO
// ═════════════════════════════════════════════════════════════════════════════

function tileToWorld(
  tileX: number,
  tileY: number,
  gridWidth: number,
  gridHeight: number,
  tileSize: number
): { worldX: number; worldZ: number } {
  return {
    worldX: (tileX - gridWidth  / 2) * tileSize + tileSize / 2,
    worldZ: (tileY - gridHeight / 2) * tileSize + tileSize / 2,
  };
}

function getMsPerTile(barracoLevel: number): number {
  const safe = Math.max(1, Math.floor(barracoLevel));
  return Math.max(400, BASE_MS_PER_TILE / safe);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ═════════════════════════════════════════════════════════════════════════════
// MARCADOR VISUAL DO SQUAD (esfera + halo + label de quantidade)
// ═════════════════════════════════════════════════════════════════════════════

function buildSquadMarker(options: SquadMarkerOptions): {
  group: THREE.Group;
  animatePulse: (elapsedMs: number) => void;
  dispose: () => void;
} {
  const color     = new THREE.Color(options.color ?? '#ef4444');
  const group     = new THREE.Group();
  const toDispose: THREE.BufferGeometry[]  = [];
  const toDisposeM: THREE.Material[]       = [];

  // Núcleo
  const coreGeo = new THREE.SphereGeometry(0.32, 20, 20);
  const coreMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color.clone().multiplyScalar(0.35),
    emissiveIntensity: 1.2,
    roughness:  0.3,
    metalness:  0.1,
    transparent: true,
    opacity:     0.95,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.castShadow = true;
  group.add(core);
  toDispose.push(coreGeo);
  toDisposeM.push(coreMat);

  // Halo orbital
  const haloGeo = new THREE.RingGeometry(0.50, 0.76, 32);
  const haloMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity:     0.38,
    side:        THREE.DoubleSide,
    depthWrite:  false,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = -0.30;
  group.add(halo);
  toDispose.push(haloGeo);
  toDisposeM.push(haloMat);

  // Label de quantidade via canvas
  const canvas  = document.createElement('canvas');
  canvas.width  = 512;
  canvas.height = 128;
  const ctx     = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(0, 0, 512, 128, 18);
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, 512, 128);
  }

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = 'bold 48px Oswald, Arial';
  ctx.fillStyle    = '#ffffff';
  ctx.fillText(`${options.memberCount.toLocaleString('pt-BR')} membros`, 256, 64);

  const texture      = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const spriteMat = new THREE.SpriteMaterial({
    map:         texture,
    transparent: true,
    depthWrite:  false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(5.2, 1.3, 1);
  sprite.position.set(0, 1.30, 0);
  group.add(sprite);

  function animatePulse(elapsedMs: number) {
    const t = elapsedMs / 1000;
    // Núcleo flutua levemente
    core.position.y = Math.sin(t * 4.2) * 0.07;
    // Halo pulsa
    halo.scale.setScalar(1 + Math.sin(t * 5.5) * 0.07);
    haloMat.opacity = 0.28 + (Math.sin(t * 5.2) + 1) * 0.08;
    // Label acompanha flutuação
    sprite.position.y = 1.30 + Math.sin(t * 3.6) * 0.04;
  }

  function dispose() {
    toDispose.forEach((g)  => g.dispose());
    toDisposeM.forEach((m) => m.dispose());
    texture.dispose();
    spriteMat.dispose();
  }

  return { group, animatePulse, dispose };
}

// ═════════════════════════════════════════════════════════════════════════════
// ANIMAÇÃO PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════

export function mountGangSquadAnimation({
  scene,
  route,
  gridWidth,
  gridHeight,
  tileSize     = 1,
  barracoLevel = 1,
  memberCount  = 100,
  color        = '#ef4444',
  onStep,
  onArrived,
}: GangSquadAnimationParams): MountedSquadAnimation {

  const msPerTile           = getMsPerTile(barracoLevel);
  const routeDistanceTiles  = Math.max(0, route.length - 1);
  const totalDurationMs     = routeDistanceTiles * msPerTile;

  // Root group na cena
  const root = new THREE.Group();
  root.name  = 'gang-squad-animation';

  // Trilha
  const trailPoints = route.map((step) => {
    const { worldX, worldZ } = tileToWorld(step.tileX, step.tileY, gridWidth, gridHeight, tileSize);
    return new THREE.Vector3(worldX, MARKER_HEIGHT - 0.7, worldZ);
  });
  const trailGeo  = new THREE.BufferGeometry().setFromPoints(trailPoints);
  const trailMat  = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 });
  const trailLine = new THREE.Line(trailGeo, trailMat);
  root.add(trailLine);

  // Marcador do squad
  const marker = buildSquadMarker({ memberCount, color });
  root.add(marker.group);
  scene.add(root);

  // Posição inicial
  if (route.length > 0) {
    const { worldX, worldZ } = tileToWorld(
      route[0].tileX, route[0].tileY, gridWidth, gridHeight, tileSize
    );
    marker.group.position.set(worldX, MARKER_HEIGHT, worldZ);
  }

  let isCancelled = false;
  let isRunning   = false;
  let frameId     = 0;

  function cleanup() {
    cancelAnimationFrame(frameId);
    scene.remove(root);
    trailGeo.dispose();
    trailMat.dispose();
    marker.dispose();
  }

  function cancel() {
    isCancelled = true;
    cleanup();
  }

  async function start(): Promise<void> {
    if (isRunning || isCancelled) return;
    isRunning = true;

    if (routeDistanceTiles === 0) {
      onArrived?.();
      return;
    }

    return new Promise<void>((resolve) => {
      const startedAt = performance.now();
      let lastStep    = -1;

      function tick(now: number) {
        if (isCancelled) { resolve(); return; }

        const elapsed      = now - startedAt;
        const capped       = Math.min(elapsed, totalDurationMs);
        const progressTiles = capped / msPerTile;
        const segIdx       = Math.min(routeDistanceTiles - 1, Math.floor(progressTiles));
        const segAlpha     = Math.min(1, Math.max(0, progressTiles - segIdx));

        const from = route[segIdx];
        const to   = route[Math.min(route.length - 1, segIdx + 1)];

        const fw = tileToWorld(from.tileX, from.tileY, gridWidth, gridHeight, tileSize);
        const tw = tileToWorld(to.tileX,   to.tileY,   gridWidth, gridHeight, tileSize);

        marker.group.position.set(
          lerp(fw.worldX, tw.worldX, segAlpha),
          MARKER_HEIGHT,
          lerp(fw.worldZ, tw.worldZ, segAlpha),
        );

        marker.animatePulse(elapsed);

        // Notifica mudança de tile
        if (segIdx !== lastStep) {
          lastStep = segIdx;
          onStep?.(segIdx, route[segIdx]);
        }

        if (capped >= totalDurationMs) {
          const last = route[route.length - 1];
          const lw   = tileToWorld(last.tileX, last.tileY, gridWidth, gridHeight, tileSize);
          marker.group.position.set(lw.worldX, MARKER_HEIGHT, lw.worldZ);
          onArrived?.();
          resolve();
          return;
        }

        frameId = requestAnimationFrame(tick);
      }

      frameId = requestAnimationFrame(tick);
    });
  }

  return {
    group: root,
    routeDistanceTiles,
    totalDurationMs,
    start,
    cancel,
    cleanup,
  };
}
