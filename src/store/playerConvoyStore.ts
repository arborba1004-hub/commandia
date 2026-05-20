import { create } from 'zustand';
import { DEFAULT_CONVOY_SKIN_ID, ensureDefaultOwned, getConvoySkin, isConvoyOwned, normalizeConvoySkinId } from '@/data/convoyCatalog';
import { createRealMoneyConvoyCheckout, equipConvoy, getMyConvoys, purchaseConvoy } from '@/api/convoyApi';
import { usePlayerStore } from '@/store/playerStore';
import type { ConvoySkinId } from '@/types/convoy';

function hydratePlayerIfPresent(player: unknown) {
  if (player && typeof player === 'object') {
    usePlayerStore.getState().hydratePlayerFromServer(player as any);
  }
}

type PlayerConvoyStore = {
  ownedSkinIds: ConvoySkinId[];
  selectedSkinId: ConvoySkinId;
  isLoading: boolean;
  isBuying: boolean;
  error: string | null;
  backendSynced: boolean;

  loadMyConvoys: () => Promise<void>;
  buyConvoy: (skinId: ConvoySkinId) => Promise<void>;
  selectConvoy: (skinId: ConvoySkinId) => Promise<void>;
  forceLocalSelection: (skinId: ConvoySkinId) => void;
  owns: (skinId: ConvoySkinId) => boolean;
};

export const usePlayerConvoyStore = create<PlayerConvoyStore>((set, get) => ({
  ownedSkinIds: [DEFAULT_CONVOY_SKIN_ID],
  selectedSkinId: DEFAULT_CONVOY_SKIN_ID,
  isLoading: false,
  isBuying: false,
  error: null,
  backendSynced: false,

  loadMyConvoys: async () => {
    set({ isLoading: true, error: null });
    try {
      const inventory = await getMyConvoys();
      hydratePlayerIfPresent(inventory.player);
      set({
        ownedSkinIds: ensureDefaultOwned(inventory.ownedSkinIds),
        selectedSkinId: inventory.equippedSkinId,
        backendSynced: true,
      });
    } catch (err: any) {
      // Não derruba o jogo se o backend ainda não tiver as rotas novas.
      // Mantém apenas o comboio padrão liberado.
      set({
        ownedSkinIds: [DEFAULT_CONVOY_SKIN_ID],
        selectedSkinId: DEFAULT_CONVOY_SKIN_ID,
        backendSynced: false,
        error: err?.message ?? 'Backend de comboio indisponível',
      });
    } finally {
      set({ isLoading: false });
    }
  },

  buyConvoy: async (skinId) => {
    const normalized = normalizeConvoySkinId(skinId);
    if (get().owns(normalized)) {
      await get().selectConvoy(normalized);
      return;
    }

    set({ isBuying: true, error: null });
    try {
      const skin = getConvoySkin(normalized);

      if (skin.currency === 'realMoney' || skin.purchaseType === 'realMoney') {
        const checkout = await createRealMoneyConvoyCheckout(normalized);

        hydratePlayerIfPresent(checkout.player);

        if (checkout.alreadyOwned || checkout.owned) {
          await get().loadMyConvoys();
          return;
        }

        const checkoutUrl = checkout.checkoutUrl || checkout.sandboxInitPoint || checkout.initPoint;
        if (!checkoutUrl) throw new Error('Mercado Pago não retornou link de pagamento.');

        window.location.assign(checkoutUrl);
        return;
      }

      const inventory = await purchaseConvoy(normalized);
      hydratePlayerIfPresent(inventory.player);
      set({
        ownedSkinIds: ensureDefaultOwned(inventory.ownedSkinIds),
        selectedSkinId: inventory.equippedSkinId,
        backendSynced: true,
      });
    } catch (err: any) {
      set({ error: err?.message ?? 'Não foi possível comprar o comboio' });
      throw err;
    } finally {
      set({ isBuying: false });
    }
  },

  selectConvoy: async (skinId) => {
    const normalized = normalizeConvoySkinId(skinId);
    if (!get().owns(normalized)) {
      set({ error: 'Você precisa comprar esse comboio antes de usar no ataque.' });
      return;
    }

    // Seleção otimista para o modal de ataque responder na hora.
    set({ selectedSkinId: normalized, error: null });

    try {
      const inventory = await equipConvoy(normalized);
      hydratePlayerIfPresent(inventory.player);
      set({
        ownedSkinIds: ensureDefaultOwned(inventory.ownedSkinIds),
        selectedSkinId: inventory.equippedSkinId,
        backendSynced: true,
      });
    } catch (err: any) {
      // Se equip falhar, volta para padrão seguro.
      set({
        selectedSkinId: DEFAULT_CONVOY_SKIN_ID,
        backendSynced: false,
        error: err?.message ?? 'Não foi possível equipar o comboio',
      });
    }
  },

  forceLocalSelection: (skinId) => {
    const normalized = normalizeConvoySkinId(skinId);
    if (get().owns(normalized)) set({ selectedSkinId: normalized });
  },

  owns: (skinId) => isConvoyOwned(normalizeConvoySkinId(skinId), get().ownedSkinIds),
}));
