/**
 * hooks/useActiveMapBattles.ts
 *
 * DISABLED: Squad animation system has been removed.
 * This hook is now a no-op placeholder for compatibility.
 */

import { useEffect } from 'react';
import * as THREE from 'three';

export type UseActiveMapBattlesOptions = {
  scene?: THREE.Scene | null;
  camera?: THREE.Camera | null;
  gridWidth?: number;
  gridHeight?: number;
};

/**
 * Hook para recuperar e gerenciar batalhas ativas ao montar GamePage.
 * DISABLED: Squad animations removed.
 */
export function useActiveMapBattles(options: UseActiveMapBattlesOptions) {
  useEffect(() => {
    // Placeholder for compatibility - no animations
  }, []);
}
