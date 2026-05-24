import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { ChevronLeft, CheckCircle2, ExternalLink, Loader2, ShoppingCart, Sparkles, Zap } from 'lucide-react';
import ConvoyShop from '@/components/shop/ConvoyShop';
import ConvoyAcceleratorShop from '@/components/shop/ConvoyAcceleratorShop';
import { createCorrePackageCheckout, getRealMoneyPurchaseStatus } from '@/api/shopApi';
import { usePlayerStore } from '@/store/playerStore';

type ShopTab = 'loja' | 'comboio' | 'aceleradores';

type PaymentNotice = {
  type: 'success' | 'pending' | 'failure' | 'info' | 'error';
  title: string;
  body: string;
};

const SHOP_BADGE_URL = 'https://static.wixstatic.com/media/50f4bf_aee79b79a6ac4c89bbc8bbadfffdb2c6~mv2.png';
const CORRE_PACKAGE_ID = 'corre_10_brl_099';

function formatCurrencyBRL(value: number) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

function normalizeTab(value: string | null): ShopTab | null {
  if (value === 'loja' || value === 'comboio' || value === 'aceleradores') return value;
  return null;
}

function paymentNoticeFromParam(payment: string | null): PaymentNotice | null {
  if (payment === 'success') {
    return {
      type: 'success',
      title: 'Pagamento aprovado',
      body: 'Quando o Mercado Pago confirmar, os Corres entram automaticamente na sua conta.',
    };
  }
  if (payment === 'pending') {
    return {
      type: 'pending',
      title: 'Pagamento pendente',
      body: 'Se for Pix ou boleto, os Corres entram quando o Mercado Pago confirmar.',
    };
  }
  if (payment === 'failure') {
    return {
      type: 'failure',
      title: 'Pagamento não concluído',
      body: 'Nenhum Corre foi cobrado ou entregue. Tente novamente quando quiser.',
    };
  }
  return null;
}

function NoticeCard({ notice }: { notice: PaymentNotice }) {
  const style = {
    success: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100',
    pending: 'border-yellow-400/50 bg-yellow-500/10 text-yellow-100',
    failure: 'border-red-400/50 bg-red-500/10 text-red-100',
    info: 'border-cyan-400/50 bg-cyan-500/10 text-cyan-100',
    error: 'border-red-400/50 bg-red-500/10 text-red-100',
  }[notice.type];

  return (
    <div className={`mb-6 rounded-2xl border px-4 py-3 shadow-[0_0_24px_rgba(0,0,0,0.28)] ${style}`}>
      <p className="text-sm font-black uppercase tracking-[0.14em]">{notice.title}</p>
      <p className="mt-1 text-sm opacity-85">{notice.body}</p>
    </div>
  );
}

function CorrePackageCard({
  currentCorre,
  isBuying,
  onBuy,
}: {
  currentCorre: number;
  isBuying: boolean;
  onBuy: () => void;
}) {
  const price = 0.99;
  const correAmount = 10;

  return (
    <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] border border-[#f5c45b]/60 bg-[radial-gradient(circle_at_20%_0%,rgba(255,208,78,0.22)_0%,transparent_32%),linear-gradient(135deg,rgba(22,10,2,0.96)_0%,rgba(7,7,10,0.98)_52%,rgba(48,14,5,0.96)_100%)] p-1 shadow-[0_0_45px_rgba(245,196,91,0.22)]">
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-yellow-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-12 h-52 w-52 rounded-full bg-red-500/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.12)_45%,transparent_58%)] animate-pulse" />

      <div className="relative rounded-[28px] border border-white/10 bg-black/60 p-5 backdrop-blur-md md:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/50 bg-yellow-400/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-yellow-200 shadow-[0_0_18px_rgba(255,220,80,0.18)]">
            <Sparkles className="h-4 w-4" />
            Oferta com destaque
          </div>
          <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200">
            Entrega automática
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-[28px] border border-[#f5c45b]/45 bg-[linear-gradient(180deg,#f7c94e_0%,#9d5c05_100%)] shadow-[0_0_38px_rgba(245,196,91,0.35)]">
              <span className="absolute inline-flex h-32 w-32 animate-ping rounded-[28px] bg-yellow-300/20" />
              <Zap className="relative z-10 h-20 w-20 text-black drop-shadow-[0_3px_0_rgba(255,255,255,0.25)]" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[#f5c45b]">Pacote Relâmpago</p>
              <h2 className="mt-2 font-heading text-4xl font-black uppercase leading-none text-white md:text-6xl">
                10 Corres
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/68">
                Corre é a energia do crime no Commandia: você usa no Giro no Asfalto, sem gastar Commands Sujo para rodar.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/75">Giro no Asfalto</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/75">Sem custo em dinheiro do jogo</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/75">Pacote de teste</span>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-[#f5c45b]/35 bg-black/55 p-5 shadow-[inset_0_0_18px_rgba(245,196,91,0.08)]">
            <p className="text-center text-xs font-black uppercase tracking-[0.22em] text-white/45">Preço</p>
            <p className="mt-2 text-center text-5xl font-black text-[#f5c45b] drop-shadow-[0_0_18px_rgba(245,196,91,0.26)]">
              {formatCurrencyBRL(price)}
            </p>
            <p className="mt-2 text-center text-xs font-semibold uppercase tracking-[0.15em] text-white/45">
              {correAmount} Corres na conta
            </p>

            <button
              type="button"
              onClick={onBuy}
              disabled={isBuying}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-200/30 bg-[linear-gradient(180deg,#ffd45b_0%,#b87006_100%)] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-black shadow-[0_0_24px_rgba(245,196,91,0.24)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBuying ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
              {isBuying ? 'Abrindo pagamento...' : 'Comprar agora'}
              {!isBuying && <ExternalLink className="h-4 w-4" />}
            </button>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Seus Corres agora</p>
              <p className="mt-1 text-2xl font-black text-white">{currentCorre.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { player, hydratePlayerFromServer } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<ShopTab>('loja');
  const [isBuyingCorre, setIsBuyingCorre] = useState(false);
  const [notice, setNotice] = useState<PaymentNotice | null>(null);

  const currentCorre = Math.max(0, Number(player?.balances?.corre || 0));
  const purchaseId = searchParams.get('purchaseId');
  const payment = searchParams.get('payment');

  useEffect(() => {
    const tab = normalizeTab(searchParams.get('tab'));
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    const initialNotice = paymentNoticeFromParam(payment);
    if (initialNotice) setNotice(initialNotice);

    if (!purchaseId) return;

    let cancelled = false;

    async function checkStatus() {
      try {
        const status = await getRealMoneyPurchaseStatus(purchaseId);
        if (cancelled) return;

        if (status.status === 'paid' && status.productType === 'correPackage') {
          if (status.player) hydratePlayerFromServer(status.player as any);
          setNotice({
            type: 'success',
            title: 'Corres entregues',
            body: `Pacote confirmado: +${Number(status.correAmount || 10)} Corres adicionados à sua conta.`,
          });
          return;
        }

        if (['pending', 'in_process', 'authorized'].includes(String(status.status))) {
          setNotice({
            type: 'pending',
            title: 'Pagamento aguardando confirmação',
            body: 'Assim que o Mercado Pago aprovar, o backend entrega os Corres automaticamente.',
          });
          return;
        }

        if (['rejected', 'cancelled', 'failed', 'refunded'].includes(String(status.status))) {
          setNotice({
            type: 'failure',
            title: 'Pagamento não aprovado',
            body: 'Nenhum Corre foi entregue. Você pode tentar comprar novamente.',
          });
        }
      } catch (error: any) {
        if (!cancelled) {
          setNotice({
            type: 'error',
            title: 'Não consegui consultar a compra',
            body: error?.message || 'Tente atualizar a página em alguns segundos.',
          });
        }
      }
    }

    checkStatus();
    return () => { cancelled = true; };
  }, [payment, purchaseId, hydratePlayerFromServer]);

  const tabs = useMemo(() => ([
    { key: 'loja' as const, label: 'LOJA' },
    { key: 'comboio' as const, label: 'COMBOIO' },
    { key: 'aceleradores' as const, label: 'ACELERADORES' },
  ]), []);

  const handleBuyCorre = async () => {
    if (isBuyingCorre) return;
    setIsBuyingCorre(true);
    setNotice(null);

    try {
      const checkout = await createCorrePackageCheckout(CORRE_PACKAGE_ID);
      if (!checkout.checkoutUrl) throw new Error('Mercado Pago não retornou link de pagamento.');
      window.location.href = checkout.checkoutUrl;
    } catch (error: any) {
      setNotice({
        type: 'error',
        title: 'Erro ao abrir pagamento',
        body: error?.message || 'Não foi possível iniciar a compra de Corres.',
      });
      setIsBuyingCorre(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('/game')}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/70 transition-colors hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-bold">Voltar</span>
          </button>

          <div className="flex items-center gap-3">
            <Image
              src={SHOP_BADGE_URL}
              alt="Loja"
              className="h-12 w-12 object-contain drop-shadow-[0_0_16px_rgba(217,183,100,0.25)]"
            />
            <div>
              <h1 className="font-heading text-3xl font-black text-[#d9b764]">LOJA</h1>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">Pacotes e itens do Commandia</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 font-heading text-lg font-bold transition-all ${
                activeTab === tab.key
                  ? 'text-[#d9b764] border-b-2 border-[#d9b764]'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {notice && <NoticeCard notice={notice} />}

        {activeTab === 'loja' && (
          <section className="space-y-10">
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[#d9b764]">Primeira oferta da aba Loja</p>
              <h2 className="mt-3 font-heading text-4xl font-black uppercase md:text-5xl">Pacotes de Corres</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
                A GiroPage só consome Corre. Este pacote aumenta seu combustível de atividade sem mexer em Commands Sujo ou Commands Limpo.
              </p>
            </div>

            <CorrePackageCard currentCorre={currentCorre} isBuying={isBuyingCorre} onBuy={handleBuyCorre} />

            <div className="mx-auto flex max-w-5xl items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-relaxed text-white/55">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <p>
                Entrega automática via webhook do Mercado Pago. O jogador paga {formatCurrencyBRL(0.99)} e recebe exatamente <b className="text-white">10 Corres</b> quando o pagamento for aprovado.
              </p>
            </div>
          </section>
        )}

        {activeTab === 'comboio' && <ConvoyShop />}

        {activeTab === 'aceleradores' && <ConvoyAcceleratorShop />}
      </div>
    </div>
  );
}
