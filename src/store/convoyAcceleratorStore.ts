import { create } from 'zustand';
import {
  getConvoyAccelerators,
  purchaseConvoyAccelerator,
  useConvoyAcceleratorOnBattle,
  type UseConvoyAcceleratorResult,
} from '@/api/convoyApi';
import { usePlayerStore } from '@/store/playerStore';

function hydratePlayerIfPresent(player: unknown) {
  if (player && typeof player === 'object') {
    usePlayerStore.getState().hydratePlayerFromServer(player as any);
  }
}

type ConvoyAcceleratorStore = {
  twoX: number;
  priceDirtyMoney: number;
  isLoading: boolean;
  isBuying: boolean;
  isUsing: boolean;
  error: string | null;

  load: () => Promise<void>;
  buy: (quantity?: number) => Promise<void>;
  useOnBattle: (battleId: string) => Promise<UseConvoyAcceleratorResult>;
  setLocalCount: (twoX: number) => void;
};

export const useConvoyAcceleratorStore = create<ConvoyAcceleratorStore>((set) => ({
  twoX: 0,
  priceDirtyMoney: 1000,
  isLoading: false,
  isBuying: false,
  isUsing: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getConvoyAccelerators();
      hydratePlayerIfPresent(data.player);
      set({
        twoX: data.accelerators.twoX,
        priceDirtyMoney: data.priceDirtyMoney || 1000,
      });
    } catch (error: any) {
      set({ error: error?.message ?? 'Não foi possível carregar aceleradores' });
    } finally {
      set({ isLoading: false });
    }
  },

  buy: async (quantity = 1) => {
    set({ isBuying: true, error: null });
    try {
      const data = await purchaseConvoyAccelerator(quantity);
      hydratePlayerIfPresent(data.player);
      set({
        twoX: data.accelerators.twoX,
        priceDirtyMoney: data.priceDirtyMoney || 1000,
      });
    } catch (error: any) {
      set({ error: error?.message ?? 'Não foi possível comprar acelerador' });
      throw error;
    } finally {
      set({ isBuying: false });
    }
  },

  useOnBattle: async (battleId: string) => {
    set({ isUsing: true, error: null });
    try {
      const data = await useConvoyAcceleratorOnBattle(battleId);
      hydratePlayerIfPresent(data.player);
      set({
        twoX: data.accelerators.twoX,
        priceDirtyMoney: data.priceDirtyMoney || 1000,
      });
      return data;
    } catch (error: any) {
      set({ error: error?.message ?? 'Não foi possível acelerar o comboio' });
      throw error;
    } finally {
      set({ isUsing: false });
    }
  },

  setLocalCount: (twoX: number) => {
    set({ twoX: Math.max(0, Math.floor(Number(twoX) || 0)) });
  },
}));
