import { useEffect } from 'react';
import { Check, Lock, ShoppingCart } from 'lucide-react';
import { CONVOY_CATALOG } from '@/data/convoyCatalog';
import { usePlayerConvoyStore } from '@/store/playerConvoyStore';
import type { ConvoySkin } from '@/types/convoy';

function formatCurrency(price: number, currency: ConvoySkin['currency']) {
  if (price <= 0) return 'GRÁTIS';
  const value = price.toLocaleString('pt-BR');
  if (currency === 'cleanMoney') return `${value} Commands Limpo`;
  if (currency === 'dirtyMoney') return `${value} Commands Sujo`;
  if (currency === 'corre') return `${value} Corre`;
  return 'Pacote real';
}

function rarityLabel(rarity: ConvoySkin['rarity']) {
  const labels: Record<ConvoySkin['rarity'], string> = {
    gratis: 'GRÁTIS',
    comum: 'COMUM',
    raro: 'RARO',
    epico: 'ÉPICO',
    lendario: 'LENDÁRIO',
  };
  return labels[rarity];
}

export default function ConvoyShop() {
  const ownedSkinIds = usePlayerConvoyStore((s) => s.ownedSkinIds);
  const selectedSkinId = usePlayerConvoyStore((s) => s.selectedSkinId);
  const isLoading = usePlayerConvoyStore((s) => s.isLoading);
  const isBuying = usePlayerConvoyStore((s) => s.isBuying);
  const error = usePlayerConvoyStore((s) => s.error);
  const backendSynced = usePlayerConvoyStore((s) => s.backendSynced);
  const loadMyConvoys = usePlayerConvoyStore((s) => s.loadMyConvoys);
  const buyConvoy = usePlayerConvoyStore((s) => s.buyConvoy);
  const selectConvoy = usePlayerConvoyStore((s) => s.selectConvoy);

  useEffect(() => {
    void loadMyConvoys();
  }, [loadMyConvoys]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-heading text-3xl font-black text-[#d9b764]">COMBOIOS DE ATAQUE</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-white/60">
          Compre comboios aqui. Na hora de montar a marcha do ataque, o jogador só poderá escolher os comboios comprados.
        </p>
      </div>

      {!backendSynced && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          As rotas do backend de comboio ainda não responderam. A loja mostra o catálogo, mas compra/equipamento real precisam do backend.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {CONVOY_CATALOG.map((skin) => {
          const owned = ownedSkinIds.includes(skin.id);
          const equipped = selectedSkinId === skin.id;
          const canBuy = !owned && skin.price > 0;

          return (
            <div
              key={skin.id}
              className={`relative overflow-hidden rounded-3xl border bg-black/40 p-5 transition ${
                equipped
                  ? 'border-[#d9b764] shadow-[0_0_30px_rgba(217,183,100,0.20)]'
                  : 'border-white/10 hover:border-white/25'
              }`}
            >
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: skin.accentColor }}
              />

              <div className="mb-5 flex h-40 items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/80">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-black/70 text-6xl"
                  style={{ boxShadow: `0 0 30px ${skin.accentColor}44` }}
                >
                  {skin.icon}
                </div>
              </div>

              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-heading text-xl font-black text-white">{skin.name}</h3>
                <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-black text-white/80">
                  {rarityLabel(skin.rarity)}
                </span>
              </div>

              <p className="min-h-[56px] text-sm text-white/55">{skin.description}</p>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                <div className="text-white/40">Preço</div>
                <div className="mt-1 font-black text-[#d9b764]">{formatCurrency(skin.price, skin.currency)}</div>
              </div>

              <button
                type="button"
                disabled={isLoading || isBuying || equipped || (!owned && skin.price <= 0)}
                onClick={() => {
                  if (owned) void selectConvoy(skin.id);
                  else if (canBuy) void buyConvoy(skin.id);
                }}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-black transition disabled:opacity-50 ${
                  equipped
                    ? 'bg-[#d9b764] text-black'
                    : owned
                      ? 'bg-cyan-500 text-black hover:bg-cyan-300'
                      : 'bg-red-600 text-white hover:bg-red-500'
                }`}
              >
                {equipped ? <Check className="h-4 w-4" /> : owned ? <Check className="h-4 w-4" /> : canBuy ? <ShoppingCart className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {equipped ? 'EQUIPADO' : owned ? 'USAR NO ATAQUE' : canBuy ? 'COMPRAR' : 'BLOQUEADO'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
