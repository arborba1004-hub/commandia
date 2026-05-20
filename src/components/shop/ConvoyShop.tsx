import { useEffect } from 'react';
import { Check, Cuboid, Lock, RefreshCcw, ShoppingCart } from 'lucide-react';
import { CONVOY_CATALOG } from '@/data/convoyCatalog';
import { usePlayerConvoyStore } from '@/store/playerConvoyStore';
import type { ConvoySkin } from '@/types/convoy';

function formatCurrency(price: number, currency: ConvoySkin['currency']) {
  if (price <= 0) return 'GRÁTIS';
  const value = price.toLocaleString('pt-BR');
  if (currency === 'cleanMoney') return `${value} Commands Limpo`;
  if (currency === 'dirtyMoney') return `${value} Commands Sujo`;
  if (currency === 'corre') return `${value} Corre`;
  if (currency === 'realMoney') {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
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

function actionLabel(owned: boolean, equipped: boolean, canBuy: boolean) {
  if (equipped) return 'EQUIPADO';
  if (owned) return 'USAR NO ATAQUE';
  if (canBuy) return 'COMPRAR';
  return 'BLOQUEADO';
}

function paymentStatusMessage() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const status = params.get('payment');
  if (status === 'success') return 'Pagamento aprovado ou em processamento. Se o comboio ainda não aparecer, toque em Recarregar posse em alguns segundos.';
  if (status === 'pending') return 'Pagamento pendente. O comboio será liberado automaticamente quando o Mercado Pago aprovar.';
  if (status === 'failure') return 'Pagamento não aprovado. Nenhum comboio foi liberado.';
  return null;
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
  const paymentMessage = paymentStatusMessage();

  useEffect(() => {
    void loadMyConvoys();
  }, [loadMyConvoys]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-heading text-3xl font-black text-[#d9b764]">COMBOIOS DE ATAQUE</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-white/60">
          Compre o comboio aqui. Na seleção de gangue do ataque só aparecem os comboios comprados/liberados.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
        <div>
          Selecionado para ataque:{' '}
          <span className="font-black text-[#d9b764]">
            {CONVOY_CATALOG.find((item) => item.id === selectedSkinId)?.name || 'Comboio Padrão'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => { void loadMyConvoys(); }}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-bold text-white hover:bg-white/10"
        >
          <RefreshCcw className="h-4 w-4" />
          Recarregar posse
        </button>
      </div>

      {!backendSynced && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          Backend de comboio ainda não respondeu. Compra/equipamento reais dependem das rotas /convoys.
        </div>
      )}

      {paymentMessage && (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
          {paymentMessage}
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
          const hasModel = Boolean(skin.modelUrl);

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
                <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-black/70 text-6xl" style={{ boxShadow: `0 0 30px ${skin.accentColor}44` }}>
                  {skin.icon}
                  {hasModel && (
                    <span className="absolute -bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-1 text-[10px] font-black text-emerald-200">
                      <Cuboid className="h-3 w-3" /> GLB
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-heading text-xl font-black text-white">{skin.name}</h3>
                <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-black text-white/80">
                  {rarityLabel(skin.rarity)}
                </span>
              </div>

              <p className="min-h-[56px] text-sm text-white/55">{skin.description}</p>

              {skin.modelUrl && (
                <div className="mt-3 break-all rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2 text-[10px] text-emerald-100/80">
                  Modelo 3D ativo no ataque
                </div>
              )}

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
                {isBuying && canBuy ? (skin.currency === 'realMoney' ? 'ABRINDO CHECKOUT...' : 'COMPRANDO...') : actionLabel(owned, equipped, canBuy)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
