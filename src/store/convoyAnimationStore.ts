/**
 * Convoy Animation Store
 * Manages the selected convoy animation for attacks
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ConvoyAnimationType = 'classic-truck' | 'armored-van' | 'motorcycle';

export interface ConvoyAnimationState {
  selectedAnimation: ConvoyAnimationType;
  setSelectedAnimation: (animation: ConvoyAnimationType) => void;
}

export const useConvoyAnimationStore = create<ConvoyAnimationState>()(
  persist(
    (set) => ({
      selectedAnimation: 'classic-truck',
      setSelectedAnimation: (animation: ConvoyAnimationType) => {
        set({ selectedAnimation: animation });
      },
    }),
    {
      name: 'convoy-animation-store',
    }
  )
);
