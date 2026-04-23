import * as THREE from 'three';
import { tileToWorldCenter } from '@/components/game/playerMapSpace';

export type GangBattleEffectsParams = {
  scene: THREE.Scene;
  tileX: number;
  tileY: number;
  gridWidth: number;
  gridHeight: number;
  tileSize?: number;
  color?: string;
  durationMs?: number;
};

export type MountedGangBattleEffects = {
  group: THREE.Group;
  play: () => Promise<void>;
  cancel: () => void;
  cleanup: () => void;
};

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function lerp(start: number, end: number, alpha: number) {
  return start + (end - start) * alpha;
}

export function mountGangBattleEffects({
  scene,
  tileX,
  tileY,
  gridWidth,
  gridHeight,
  tileSize = 1,
  color = '#ff3b30',
  durationMs = 1400,
}: GangBattleEffectsParams): MountedGangBattleEffects {
  const root = new THREE.Group();
  root.name = 'gang-battle-effects';

  const { worldX, worldZ } = tileToWorldCenter(tileX, tileY, gridWidth, gridHeight);
  root.position.set(worldX * tileSize, 0, worldZ * tileSize);

  const explosionGeometry = new THREE.SphereGeometry(0.4, 20, 20);
  const explosionMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.85,
  });
  const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
  explosion.position.y = 1.2;
  root.add(explosion);

  const flashGeometry = new THREE.RingGeometry(0.2, 0.8, 24);
  const flashMaterial = new THREE.MeshBasicMaterial({
    color: '#ffd166',
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const flash = new THREE.Mesh(flashGeometry, flashMaterial);
  flash.rotation.x = -Math.PI / 2;
  flash.position.y = 0.08;
  root.add(flash);

  const shotsGroup = new THREE.Group();
  root.add(shotsGroup);

  const shotLines: THREE.Line[] = [];
  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8;
    const start = new THREE.Vector3(0, 1.1, 0);
    const end = new THREE.Vector3(Math.cos(angle) * 0.8, 1.1, Math.sin(angle) * 0.8);

    const shotGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const shotMaterial = new THREE.LineBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0,
    });

    const line = new THREE.Line(shotGeometry, shotMaterial);
    shotsGroup.add(line);
    shotLines.push(line);
  }

  scene.add(root);

  let frameId = 0;
  let cancelled = false;

  function cleanup() {
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }

    scene.remove(root);

    explosionGeometry.dispose();
    explosionMaterial.dispose();
    flashGeometry.dispose();
    flashMaterial.dispose();

    for (const line of shotLines) {
      (line.geometry as THREE.BufferGeometry).dispose();
      (line.material as THREE.LineBasicMaterial).dispose();
    }
  }

  function cancel() {
    cancelled = true;
    cleanup();
  }

  async function play() {
    await new Promise<void>((resolve) => {
      const startedAt = performance.now();

      function animate(now: number) {
        if (cancelled) {
          resolve();
          return;
        }

        const elapsedMs = now - startedAt;
        const progress = Math.min(1, elapsedMs / Math.max(1, toNumber(durationMs, 1400)));

        const explosionScale = lerp(0.35, 3.2, progress);
        explosion.scale.setScalar(explosionScale);
        explosion.position.y = 1.1 + Math.sin(progress * Math.PI) * 0.25;
        explosionMaterial.opacity = 0.95 * (1 - progress);

        const flashScale = lerp(0.5, 5, progress);
        flash.scale.setScalar(flashScale);
        flashMaterial.opacity = 0.85 * (1 - progress);

        for (let index = 0; index < shotLines.length; index += 1) {
          const shot = shotLines[index];
          const phase = (progress * 4 + index * 0.11) % 1;
          const visible = phase < 0.22 || (progress > 0.18 && progress < 0.72 && phase < 0.36);
          (shot.material as THREE.LineBasicMaterial).opacity = visible ? 0.95 * (1 - progress * 0.5) : 0;
          shot.rotation.y += 0.08;
        }

        if (progress >= 1) {
          resolve();
          return;
        }

        frameId = requestAnimationFrame(animate);
      }

      frameId = requestAnimationFrame(animate);
    });
  }

  return {
    group: root,
    play,
    cancel,
    cleanup,
  };
}