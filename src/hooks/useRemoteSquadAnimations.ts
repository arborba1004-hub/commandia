/**
 * hooks/useRemoteSquadAnimations.ts
 *
 * DISABLED: Squad animation system has been removed.
 * This hook is now a no-op placeholder for compatibility.
 */

import { useEffect } from 'react';
import * as THREE from 'three';

export type UseRemoteSquadAnimationsOptions = {
  scene?: THREE.Scene | null;
  camera?: THREE.Camera | null;
  gridWidth?: number;
  gridHeight?: number;
};

export type MountedSquadAnimation = {
  start: () => Promise<void>;
  cancel: () => void;
  cleanup: () => void;
};

export function useRemoteSquadAnimations(options: UseRemoteSquadAnimationsOptions) {
  // No-op: Squad animations disabled
  useEffect(() => {
    // Placeholder for compatibility
  }, []);
}
