import { useEffect, useState } from 'react';
import { Image } from '@/components/ui/image';
import { claimAzideiaRewards, getAzideiaRewardStatus } from '@/api/azideiaApi';
import { AZIDEIA_CORRERIA_ICON_URL, AZIDEIA_ICON_URL } from '@/data/azideiaCatalog';
import type { AzideiaRewardStatus } from '@/types/azideia';
import { usePlayerStore } from '@/store/playerStore';

export default function AzideiaRewardsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<AzideiaRewardStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimedMessage, setClaimedMessage] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      setStatus(await getAzideiaRewardStatus());
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao carregar recompensas Azidéia');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (open) void load();
  }, [open]);

  if (!open) return null;

  const availableTwoX = Math.max(0, Number(status?.available?.convoy_2x ?? 0));
  const availableCorre = Math.max(0, Number(status?.available?.corre ?? 0));
  const totalAvailable = availableTwoX + availableCorre;

  const handleClaim = async () => {
    if (isClaiming || totalAvailable <= 0) return;
    setIsClaiming(true);
    setError(null);
    setClaimedMessage(null);
    try {
      const result = await claimAzideiaRewards();
      if (result.player) usePlayerStore.getState().hydratePlayerFromServer(result.player as any);
      setStatus(result);
      const claimedTwoX = Math.max(0, Number(result.claimed?.convoy_2x ?? 0));
      const claimedCorre = Math.max(0, Number(result.claimed?.corre ?? 0));
      const parts: string[] = [];
      if (claimedTwoX > 0) parts.push(`${claimedTwoX} acelerador(es)`);
      if (claimedCorre > 0) parts.push(`${claimedCorre} Corre(s)`);
      setClaimedMessage(parts.length ? `Você coletou ${parts.join(' e ')}.` : 'Nada para coletar agora.');
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao coletar recompensas');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-red-500/40 bg-zinc-950 p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image src={AZIDEIA_ICON_URL} alt="Azidéia" className="h-16 w-16 object-contain" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">Chat da facção</p>
              <h2 className="font-heading text-2xl font-black uppercase text-white">Coleta Azidéia</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-black text-zinc-300">
            Fechar
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
          {isLoading ? (
            <p className="text-sm text-zinc-400">Carregando...</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <div className="flex items-center gap-3 rounded-2xl bg-zinc-900 p-4">
                  <Image src={AZIDEIA_ICON_URL} alt="X9" className="h-11 w-11 object-contain" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-500">Acelerador de comboio 2x</p>
                    <p className="text-3xl font-black text-emerald-300">{availableTwoX}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-zinc-900 p-4">
                  <Image src={AZIDEIA_CORRERIA_ICON_URL} alt="Correria" className="h-11 w-11 object-contain" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-500">Corres da facção</p>
                    <p className="text-3xl font-black text-emerald-300">{availableCorre}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={totalAvailable <= 0 || isClaiming}
                  className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black uppercase text-white disabled:opacity-40"
                >
                  {isClaiming ? 'Coletando...' : 'Coletar'}
                </button>
              </div>

              <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-400">
                <p>
                  X9: coleta limitada a {status?.x9FactionDailyLimit ?? 100} aceleradores por dia. Hoje você já coletou {status?.x9FactionReceivedToday ?? 0}.
                </p>
                <p>
                  Correria: coleta limitada a {status?.correriaFactionDailyLimit ?? 100} Corres por dia. Hoje você já coletou {status?.correriaFactionReceivedToday ?? 0}.
                </p>
              </div>

              <div className="mt-3 max-h-48 overflow-y-auto rounded-2xl bg-zinc-900/60 p-3">
                {!status?.batches?.length ? (
                  <p className="text-sm text-zinc-500">Nenhuma recompensa pendente.</p>
                ) : (
                  <div className="space-y-2">
                    {status.batches.map((batch) => (
                      <div key={batch.id} className="rounded-xl bg-black/30 px-3 py-2 text-xs text-zinc-300">
                        <span className="font-black text-white">{batch.killerName}</span>{' '}
                        {batch.rewardType === 'corre' ? 'negociou Correria' : 'eliminou X9'} • +{batch.quantity}{' '}
                        {batch.rewardType === 'corre' ? 'Corre' : 'acelerador'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {claimedMessage && <p className="mt-3 rounded-2xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{claimedMessage}</p>}
        {error && <p className="mt-3 rounded-2xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      </div>
    </div>
  );
}
