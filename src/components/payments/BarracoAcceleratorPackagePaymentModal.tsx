import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Copy, Loader2, X } from 'lucide-react';
import {
  createMercadoPagoBrickBarracoAcceleratorPackagePayment,
  formatBRL,
  getMercadoPagoBrickConfig,
  type BarracoAcceleratorPackage,
} from '@/api/shopApi';
import { usePlayerStore } from '@/store/playerStore';
import { Image } from '@/components/ui/image';

type PaymentState = 'loading' | 'ready' | 'processing' | 'approved' | 'pending' | 'error';

type Props = {
  pack: BarracoAcceleratorPackage | null;
  open: boolean;
  onClose: () => void;
};

declare global {
  interface Window {
    MercadoPago?: any;
    __commandiaBarracoAcceleratorPaymentBrickController?: any;
  }
}

const SDK_SRC = 'https://sdk.mercadopago.com/js/v2';

function loadMercadoPagoSdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Pagamento indisponível fora do navegador.'));
  if (window.MercadoPago) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar SDK Mercado Pago.')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SDK_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar SDK Mercado Pago.'));
    document.head.appendChild(script);
  });
}

function copyText(value?: string) {
  if (!value) return;
  void navigator.clipboard?.writeText(value);
}

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds || 0)));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  if (hours && minutes) return `${hours}h ${minutes}min`;
  if (hours) return `${hours}h`;
  return `${minutes}min`;
}

export default function BarracoAcceleratorPackagePaymentModal({ pack, open, onClose }: Props) {
  const containerId = useMemo(() => `mp-payment-brick-barraco-accelerator-${pack?.id || 'package'}`, [pack?.id]);
  const hydratePlayerFromServer = usePlayerStore((s) => s.hydratePlayerFromServer);
  const [state, setState] = useState<PaymentState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!open || !pack) return;
    mountedRef.current = true;
    setState('loading');
    setError(null);
    setResult(null);

    async function mountBrick() {
      try {
        if (window.__commandiaBarracoAcceleratorPaymentBrickController?.unmount) {
          window.__commandiaBarracoAcceleratorPaymentBrickController.unmount();
          window.__commandiaBarracoAcceleratorPaymentBrickController = null;
        }

        const config = await getMercadoPagoBrickConfig();
        if (!config.publicKey) throw new Error('MP_PUBLIC_KEY ausente no backend.');

        await loadMercadoPagoSdk();
        if (!window.MercadoPago) throw new Error('SDK Mercado Pago não inicializou.');

        const mp = new window.MercadoPago(config.publicKey, { locale: 'pt-BR' });
        const bricksBuilder = mp.bricks();

        const settings = {
          initialization: {
            amount: Number(Number(pack.price).toFixed(2)),
          },
          customization: {
            paymentMethods: {
              creditCard: 'all',
              debitCard: 'all',
              prepaidCard: 'all',
              bankTransfer: 'all',
              ticket: 'all',
            },
            visual: {
              style: { theme: 'dark' },
            },
          },
          callbacks: {
            onReady: () => {
              if (!mountedRef.current) return;
              setState('ready');
            },
            onSubmit: ({ selectedPaymentMethod, formData }: any) => {
              setState('processing');
              setError(null);

              return new Promise<void>(async (resolve, reject) => {
                try {
                  const response = await createMercadoPagoBrickBarracoAcceleratorPackagePayment(pack.id, {
                    ...formData,
                    selectedPaymentMethod,
                  });

                  setResult(response);

                  if (response.player) {
                    hydratePlayerFromServer(response.player as any);
                  }

                  if (response.status === 'approved' || response.status === 'paid') {
                    setState('approved');
                  } else {
                    setState('pending');
                  }

                  resolve();
                } catch (err: any) {
                  const message = err?.message || 'Pagamento recusado ou não processado.';
                  setError(message);
                  setState('error');
                  reject(err);
                }
              });
            },
            onError: (brickError: any) => {
              console.error('[MercadoPago Barraco Accelerator Brick]', brickError);
              if (!mountedRef.current) return;
              setError(brickError?.message || 'Erro no componente de pagamento Mercado Pago.');
              setState('error');
            },
          },
        };

        window.__commandiaBarracoAcceleratorPaymentBrickController = await bricksBuilder.create('payment', containerId, settings);
      } catch (err: any) {
        console.error('[BarracoAcceleratorPackagePaymentModal]', err);
        if (!mountedRef.current) return;
        setError(err?.message || 'Não foi possível abrir o pagamento.');
        setState('error');
      }
    }

    const timer = setTimeout(() => void mountBrick(), 80);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      if (window.__commandiaBarracoAcceleratorPaymentBrickController?.unmount) {
        window.__commandiaBarracoAcceleratorPaymentBrickController.unmount();
        window.__commandiaBarracoAcceleratorPaymentBrickController = null;
      }
    };
  }, [open, pack, containerId, hydratePlayerFromServer]);

  if (!open || !pack) return null;

  const hasQr = Boolean(result?.qrCode || result?.qrCodeBase64);
  const totalDuration = formatDuration(pack.totalSeconds);
  const unitDuration = formatDuration(pack.secondsPerAccelerator);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-yellow-400/30 bg-zinc-950 text-white shadow-[0_0_40px_rgba(250,204,21,0.18)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-zinc-950/95 p-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.28em] text-[#d9b764]">Pagamento sem redirecionar</div>
            <h2 className="font-heading text-2xl font-black">{pack.name}</h2>
            <p className="text-sm text-white/60">
              {pack.acceleratorCount} aceleradores de {unitDuration} · {totalDuration} total · {formatBRL(pack.price)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-yellow-400/25 bg-yellow-400/10 p-4 text-sm text-yellow-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black">
              <Clock className="h-7 w-7" />
            </div>
            <div>
              <div className="font-black uppercase tracking-[0.12em]">Entrega automática</div>
              <div>
                Quando o pagamento aprovar, entram {pack.acceleratorCount} aceleradores de {unitDuration} no saldo do barraco.
              </div>
            </div>
          </div>

          {state === 'loading' && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <Loader2 className="h-5 w-5 animate-spin" /> Carregando opções de pagamento...
            </div>
          )}

          {state === 'processing' && (
            <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
              <Loader2 className="h-5 w-5 animate-spin" /> Processando pagamento...
            </div>
          )}

          {state === 'approved' && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <CheckCircle2 className="mt-0.5 h-5 w-5" />
              <div>
                <div className="font-black">Pagamento aprovado.</div>
                <div>{pack.acceleratorCount} aceleradores de evolução do barraco foram adicionados na sua conta.</div>
              </div>
            </div>
          )}

          {state === 'pending' && (
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
              <div className="font-black">Pagamento pendente.</div>
              <div>Se for Pix ou boleto, os aceleradores entram automaticamente quando o Mercado Pago confirmar.</div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              <AlertTriangle className="mt-0.5 h-5 w-5" />
              <div>{error}</div>
            </div>
          )}

          {hasQr && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 font-black text-white">Pix gerado</div>
              {result.qrCodeBase64 && (
                <Image src={`data:image/png;base64,${result.qrCodeBase64}`} alt="QR Code Pix" className="mx-auto mb-3 h-56 w-56 rounded-2xl bg-white p-2" />
              )}
              {result.qrCode && (
                <button
                  type="button"
                  onClick={() => copyText(result.qrCode)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d9b764] px-4 py-3 font-black text-black"
                >
                  <Copy className="h-4 w-4" /> Copiar código Pix
                </button>
              )}
            </div>
          )}

          {result?.ticketUrl && (
            <a href={result.ticketUrl} target="_blank" rel="noreferrer" className="block rounded-2xl bg-[#d9b764] px-4 py-3 text-center font-black text-black">
              Abrir boleto / comprovante
            </a>
          )}

          {state !== 'approved' && (
            <div className="rounded-2xl border border-white/10 bg-white p-3 text-black">
              <div id={containerId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
