import { useNavigate } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { ChevronLeft, ShieldCheck, ShoppingCart, Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';
import ConvoyShop from '@/components/shop/ConvoyShop';
import ConvoyAcceleratorShop from '@/components/shop/ConvoyAcceleratorShop';
import CorrePackagePaymentModal from '@/components/payments/CorrePackagePaymentModal';
import { CORRE_STARTER_PACKAGE, formatBRL } from '@/api/shopApi';

export default function ShopPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'loja' | 'comboio' | 'aceleradores'>('loja');
  const [correPaymentOpen, setCorrePaymentOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <button
            onClick={() => navigate('/game')}
            className="flex items-center gap-2 text-white/70 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <h1 className="font-heading text-3xl font-bold text-[#d9b764]">LOJA</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex gap-4 border-b border-white/10">
          <button
            onClick={() => setActiveTab('loja')}
            className={`px-6 py-3 font-heading text-lg font-bold transition-all ${
              activeTab === 'loja'
                ? 'border-b-2 border-[#d9b764] text-[#d9b764]'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            LOJA
          </button>
          <button
            onClick={() => setActiveTab('comboio')}
            className={`px-6 py-3 font-heading text-lg font-bold transition-all ${
              activeTab === 'comboio'
                ? 'border-b-2 border-[#d9b764] text-[#d9b764]'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            COMBOIO
          </button>
          <button
            onClick={() => setActiveTab('aceleradores')}
            className={`px-6 py-3 font-heading text-lg font-bold transition-all ${
              activeTab === 'aceleradores'
                ? 'border-b-2 border-[#d9b764] text-[#d9b764]'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            ACELERADORES
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        {activeTab === 'loja' && (
          <div className="space-y-10">
            <div className="text-center">
              <h2 className="font-heading text-3xl font-black text-[#d9b764]">PACOTES DO COMANDO</h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-white/60">
                Corres são o combustível do Giro no Asfalto. Esta compra usa o mesmo pagamento embutido do comboio, sem mandar o jogador para login externo.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <div className="group relative overflow-hidden rounded-[2rem] border border-yellow-400/40 bg-[radial-gradient(circle_at_20%_0%,rgba(250,204,21,0.30),transparent_34%),linear-gradient(135deg,rgba(28,18,5,0.96),rgba(5,5,5,0.98))] p-6 shadow-[0_0_38px_rgba(250,204,21,0.18)]">
                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-yellow-300/20 blur-2xl transition group-hover:bg-yellow-300/30" />
                <div className="pointer-events-none absolute left-5 top-5 h-20 w-20 rounded-full border border-yellow-300/30 opacity-40 animate-ping" />

                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-100">
                    <Sparkles className="h-3.5 w-3.5" />
                    {CORRE_STARTER_PACKAGE.badge}
                  </div>
                  <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
                    Primeira aba
                  </div>
                </div>

                <div className="relative z-10 mt-8 flex items-center justify-center">
                  <div className="relative flex h-36 w-36 items-center justify-center rounded-[2rem] border border-yellow-300/30 bg-black/65 shadow-[inset_0_0_24px_rgba(250,204,21,0.10),0_0_32px_rgba(250,204,21,0.20)]">
                    <Zap className="h-20 w-20 fill-yellow-300 text-yellow-300 drop-shadow-[0_0_18px_rgba(250,204,21,0.55)]" />
                    <div className="absolute -bottom-3 rounded-full border border-yellow-300/40 bg-black px-4 py-1 text-xl font-black text-yellow-300">
                      +{CORRE_STARTER_PACKAGE.correAmount}
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-8">
                  <h3 className="font-heading text-2xl font-black text-white">{CORRE_STARTER_PACKAGE.name}</h3>
                  <p className="mt-2 min-h-[44px] text-sm leading-relaxed text-white/60">
                    {CORRE_STARTER_PACKAGE.description}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Entrega</div>
                      <div className="mt-1 text-lg font-black text-yellow-300">{CORRE_STARTER_PACKAGE.correAmount} Corres</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Preço</div>
                      <div className="mt-1 text-lg font-black text-[#d9b764]">{formatBRL(CORRE_STARTER_PACKAGE.price)}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-xs leading-relaxed text-cyan-100">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    Mesmo processo do comboio: Payment Brick dentro do jogo, com Pix/cartão/boleto e entrega automática por webhook.
                  </div>

                  <button
                    type="button"
                    onClick={() => setCorrePaymentOpen(true)}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(180deg,#facc15_0%,#b77905_100%)] px-4 py-4 font-black uppercase tracking-[0.14em] text-black shadow-[0_0_26px_rgba(250,204,21,0.28)] transition hover:brightness-110 active:scale-[0.98]"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Comprar {CORRE_STARTER_PACKAGE.correAmount} Corres
                  </button>
                </div>
              </div>
            </div>

            <CorrePackagePaymentModal
              pack={CORRE_STARTER_PACKAGE}
              open={correPaymentOpen}
              onClose={() => setCorrePaymentOpen(false)}
            />
          </div>
        )}

        {activeTab === 'comboio' && <ConvoyShop />}

        {activeTab === 'aceleradores' && <ConvoyAcceleratorShop />}
      </div>
    </div>
  );
}
