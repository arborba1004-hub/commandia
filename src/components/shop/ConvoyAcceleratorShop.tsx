import { useEffect } from 'react';
import { Gauge, RefreshCcw, ShoppingCart, Zap } from 'lucide-react';
import { useConvoyAcceleratorStore } from '@/store/convoyAcceleratorStore';
import { usePlayerStore } from '@/store/playerStore';

function fmt(value: number) {
  if (!Number.isFinite(value)) return '0';
  return Math.floor(value).toLocaleString('pt-BR');
}

export default function ConvoyAcceleratorShop() {
  const dirtyMoney = usePlayerStore((s) => s.player?.balances?.dirtyMoney ?? 0);
  const twoX = useConvoyAcceleratorStore((s) => s.twoX);
  const priceDirtyMoney = useConvoyAcceleratorStore((s) => s.priceDirtyMoney);
  const isLoading = useConvoyAcceleratorStore((s) => s.isLoading);
  const isBuying = useConvoyAcceleratorStore((s) => s.isBuying);
  const error = useConvoyAcceleratorStore((s) => s.error);
  const load = useConvoyAcceleratorStore((s) => s.load);
  const buy = useConvoyAcceleratorStore((s) => s.buy);

  useEffect(() => {
    void load();
  }, [load]);

  const canBuy = dirtyMoney >= priceDirtyMoney && !isBuying;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-heading text-3xl font-black text-[#d9b764]">ACELERADORES</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-white/60">
          Compre aceleradores 2x para reduzir pela metade o tempo restante da ida do comboio durante um ataque.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
        <div>
          Disponíveis:{' '}
          <span className="font-black text-[#d9b764]">{fmt(twoX)} acelerador(es) 2x</span>
        </div>
        <button
          type="button"
          onClick={() => { void load(); }}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-bold text-white hover:bg-white/10"
        >
          <RefreshCcw className="h-4 w-4" />
          Recarregar
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="relative overflow-hidden rounded-3xl border border-yellow-400/30 bg-black/50 p-6 shadow-[0_0_30px_rgba(250,204,21,0.12)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-yellow-400" />

          <div className="mb-5 flex h-40 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-yellow-400/40 bg-black/80 text-yellow-300 shadow-[0_0_35px_rgba(250,204,21,0.35)]">
              <Zap className="h-14 w-14" />
            </div>
          </div>

          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className="font-heading text-2xl font-black text-white">Acelerador 2x de Comboio</h3>
            <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-[10px] font-black text-yellow-100">
              2X
            </span>
          </div>

          <p className="text-sm text-white/55">
            Use durante a marcha de ataque para cortar pela metade o tempo restante até o alvo. Cada uso consome 1 acelerador.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white/40">Preço</div>
              <div className="mt-1 font-black text-[#d9b764]">{fmt(priceDirtyMoney)} Sujo</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white/40">Seu saldo</div>
              <div className="mt-1 font-black text-white">{fmt(dirtyMoney)} Sujo</div>
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading || isBuying || !canBuy}
            onClick={() => { void buy(1); }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-4 py-3 font-black text-black transition hover:bg-yellow-300 disabled:opacity-50"
          >
            {isBuying ? <Gauge className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
            {isBuying ? 'COMPRANDO...' : 'COMPRAR 1 ACELERADOR'}
          </button>

          {!canBuy && !isBuying && (
            <p className="mt-3 text-center text-xs text-red-200/80">
              Saldo insuficiente em dinheiro sujo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
