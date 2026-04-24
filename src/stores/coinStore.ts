import { create } from 'zustand';

interface CoinStoreState {
  coins: number;
  addCoins: (amount: number) => void;
  removeCoins: (amount: number) => void;
  setCoins: (amount: number) => void;
}

export const useCoinStore = create<CoinStoreState>((set) => ({
  coins: 0,
  addCoins: (amount) =>
    set((state) => ({
      coins: state.coins + amount,
    })),
  removeCoins: (amount) =>
    set((state) => ({
      coins: Math.max(0, state.coins - amount),
    })),
  setCoins: (amount) =>
    set({
      coins: Math.max(0, amount),
    }),
}));
