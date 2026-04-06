import * as THREE from 'three';

export type EnemyBarracoData = {
  type: 'enemy-barraco';
  playerId: string;
  playerName: string;
  tileX: number;
  tileY: number;
  barracoLevel?: number;
  power?: number;
  dirtyMoney?: number;
};

function isEnemyBarracoData(data: unknown): data is EnemyBarracoData {
  if (!data || typeof data !== 'object') return false;

  const value = data as Record<string, unknown>;

  return (
    value.type === 'enemy-barraco' &&
    typeof value.playerId === 'string' &&
    typeof value.playerName === 'string' &&
    typeof value.tileX === 'number' &&
    typeof value.tileY === 'number'
  );
}

export function attachEnemyBarracoData(
  object: THREE.Object3D,
  data: Omit<EnemyBarracoData, 'type'>
) {
  object.userData = {
    ...object.userData,
    type: 'enemy-barraco',
    ...data,
  };
}

export function findEnemyBarracoDataFromObject(object: THREE.Object3D | null): EnemyBarracoData | null {
  let current: THREE.Object3D | null = object;

  while (current) {
    if (isEnemyBarracoData(current.userData)) {
      return current.userData;
    }
    current = current.parent;
  }

  return null;
}

export function pickEnemyBarracoFromIntersections(
  intersections: THREE.Intersection<THREE.Object3D>[]
): EnemyBarracoData | null {
  for (const hit of intersections) {
    const found = findEnemyBarracoDataFromObject(hit.object);
    if (found) return found;
  }

  return null;
}