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

const CONVOY_INVENTORY_CACHE_MS = 60_000;
let loadMyConvoysPromise: Promise<void> | null = null;
let lastConvoyInventoryLoadAt = 0;

type PlayerConvoyStore = {
  ownedSkinIds: ConvoySkinId[];
  selectedSkinId: ConvoySkinId;
  isLoading: boolean;
  isBuying: boolean;
  error: string | null;
  backendSynced: boolean;

  loadMyConvoys: (force?: boolean) => Promise<void>;
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

  loadMyConvoys: async (force = false) => {
    const now = Date.now();
    const current = get();

    // O modal de ataque pode montar/desmontar várias vezes. Não bata no banco
    // a cada abertura se o inventário já foi carregado há pouco.
    if (
      !force &&
      current.backendSynced &&
      current.ownedSkinIds.length > 0 &&
      now - lastConvoyInventoryLoadAt < CONVOY_INVENTORY_CACHE_MS
    ) {
      return;
    }

    if (loadMyConvoysPromise) return loadMyConvoysPromise;

    loadMyConvoysPromise = (async () => {
      set({ isLoading: true, error: null });
      try {
        const inventory = await getMyConvoys();
        hydratePlayerIfPresent(inventory.player);
        set({
          ownedSkinIds: ensureDefaultOwned(inventory.ownedSkinIds),
          selectedSkinId: inventory.equippedSkinId,
          backendSynced: true,
        });
        lastConvoyInventoryLoadAt = Date.now();
      } catch (err: any) {
        // Não derruba o jogo se Render estiver acordando ou /convoy/me falhar.
        // O comboio padrão precisa continuar disponível visualmente no ataque.
        set({
          ownedSkinIds: ensureDefaultOwned([DEFAULT_CONVOY_SKIN_ID]),
          selectedSkinId: DEFAULT_CONVOY_SKIN_ID,
          backendSynced: true,
          error: err?.message ?? 'Backend de comboio indisponível; usando Comboio Padrão',
        });
        lastConvoyInventoryLoadAt = Date.now();
      } finally {
        set({ isLoading: false });
        loadMyConvoysPromise = null;
      }
    })();

    return loadMyConvoysPromise;
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
          await get().loadMyConvoys(true);
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
      console.error('[playerConvoyStore] buyConvoy falhou', err);
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
