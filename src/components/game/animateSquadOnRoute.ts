import * as THREE from 'three';

export type RouteTile = {
  tileX: number;
  tileY: number;
};

export type SquadWorldPosition = {
  x: number;
  y: number;
  z: number;
};

type AnimateSquadOnRouteParams = {
  squad: THREE.Object3D;
  route: RouteTile[];
  tileSize: number;
  gridWidth: number;
  gridHeight: number;
  y?: number;
  stepDuration?: number;
  onStepChange?: (stepIndex: number, tile: RouteTile) => void;
  onComplete?: () => void;
};

function tileToWorldPosition(
  tileX: number,
  tileY: number,
  tileSize: number,
  gridWidth: number,
  gridHeight: number,
  y: number
): SquadWorldPosition {
  return {
    x: (tileX - gridWidth / 2) * tileSize,
    y,
    z: (tileY - gridHeight / 2) * tileSize,
  };
}

function rotateSquadTowards(from: THREE.Vector3, to: THREE.Vector3, squad: THREE.Object3D) {
  const direction = new THREE.Vector3().subVectors(to, from);
  if (direction.lengthSq() === 0) return;

  const angle = Math.atan2(direction.x, direction.z);
  squad.rotation.y = angle;
}

export function animateSquadOnRoute({
  squad,
  route,
  tileSize,
  gridWidth,
  gridHeight,
  y = 0,
  stepDuration = 260,
  onStepChange,
  onComplete,
}: AnimateSquadOnRouteParams) {
  if (!route.length) {
    onComplete?.();
    return {
      stop: () => {},
      isRunning: () => false,
    };
  }

  let stopped = false;
  let currentStep = 0;
  let animationFrameId = 0;

  const getY = () => squad.position.y;

  const firstWorld = tileToWorldPosition(
    route[0].tileX,
    route[0].tileY,
    tileSize,
    gridWidth,
    gridHeight,
    getY()
  );

  squad.position.set(firstWorld.x, getY(), firstWorld.z);
  onStepChange?.(0, route[0]);

  const runStep = () => {
    if (stopped) return;

    const currentTile = route[currentStep];
    const nextTile = route[currentStep + 1];

    if (!nextTile) {
      onComplete?.();
      return;
    }

    const start = tileToWorldPosition(
      currentTile.tileX,
      currentTile.tileY,
      tileSize,
      gridWidth,
      gridHeight,
      getY()
    );

    const end = tileToWorldPosition(
      nextTile.tileX,
      nextTile.tileY,
      tileSize,
      gridWidth,
      gridHeight,
      getY()
    );

    const startVec = new THREE.Vector3(start.x, start.y, start.z);
    const endVec = new THREE.Vector3(end.x, end.y, end.z);

    rotateSquadTowards(startVec, endVec, squad);

    const startedAt = performance.now();

    const tick = (now: number) => {
      if (stopped) return;

      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / stepDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      squad.position.x = THREE.MathUtils.lerp(start.x, end.x, eased);
      squad.position.z = THREE.MathUtils.lerp(start.z, end.z, eased);

      // FIX: nunca mexe no Y
      squad.position.y = getY();

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      squad.position.set(end.x, getY(), end.z);
      currentStep += 1;
      onStepChange?.(currentStep, nextTile);
      runStep();
    };

    animationFrameId = requestAnimationFrame(tick);
  };

  runStep();

  return {
    stop: () => {
      stopped = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    },
    isRunning: () => !stopped,
  };
}