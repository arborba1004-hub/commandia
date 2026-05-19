/**
 * Convoy store
 * Manages active convoys and their movement state
 */

import { create } from 'zustand';
import { TileCoord } from '@/services/convoyPathfinding';

export interface ConvoyMovement {
  id: string;
  attackerId: string;
  defenderId: string;
  startBarracLevel: number;
  path: TileCoord[];
  startTime: number;
  totalDuration: number;
  timePerTile: number;
  status: 'moving' | 'arrived' | 'cancelled';
  currentProgress: number; // 0 to 1
  currentTileIndex: number;
}

export interface ConvoyStore {
  convoys: Map<string, ConvoyMovement>;
  
  // Actions
  addConvoy: (convoy: ConvoyMovement) => void;
  updateConvoy: (id: string, updates: Partial<ConvoyMovement>) => void;
  removeConvoy: (id: string) => void;
  getConvoy: (id: string) => ConvoyMovement | undefined;
  getAllConvoys: () => ConvoyMovement[];
  getConvoysByDefender: (defenderId: string) => ConvoyMovement[];
  getConvoysByAttacker: (attackerId: string) => ConvoyMovement[];
  clearAllConvoys: () => void;
}

export const useConvoyStore = create<ConvoyStore>((set, get) => ({
  convoys: new Map(),

  addConvoy: (convoy: ConvoyMovement) => {
    set((state) => {
      const newConvoys = new Map(state.convoys);
      newConvoys.set(convoy.id, convoy);
      return { convoys: newConvoys };
    });
  },

  updateConvoy: (id: string, updates: Partial<ConvoyMovement>) => {
    set((state) => {
      const convoy = state.convoys.get(id);
      if (!convoy) return state;

      const newConvoys = new Map(state.convoys);
      newConvoys.set(id, { ...convoy, ...updates });
      return { convoys: newConvoys };
    });
  },

  removeConvoy: (id: string) => {
    set((state) => {
      const newConvoys = new Map(state.convoys);
      newConvoys.delete(id);
      return { convoys: newConvoys };
    });
  },

  getConvoy: (id: string) => {
    return get().convoys.get(id);
  },

  getAllConvoys: () => {
    return Array.from(get().convoys.values());
  },

  getConvoysByDefender: (defenderId: string) => {
    return Array.from(get().convoys.values()).filter(
      (convoy) => convoy.defenderId === defenderId && convoy.status === 'moving'
    );
  },

  getConvoysByAttacker: (attackerId: string) => {
    return Array.from(get().convoys.values()).filter(
      (convoy) => convoy.attackerId === attackerId && convoy.status === 'moving'
    );
  },

  clearAllConvoys: () => {
    set({ convoys: new Map() });
  },
}));
