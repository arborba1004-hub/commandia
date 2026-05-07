/**
 * CTMapTrainingModal.tsx
 *
 * Modal de treinamento de gangue aberto ao clicar em um CT do mapa 3D.
 * Usa gangStore → gangApi → backend /gang-war/* (Google Auth + socket).
 * Não depende do sistema legado (TreinamentoGang / localStorage).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGangStore }   from '@/store/gangStore';
import { usePlayerStore } from '@/store/playerStore';
import { ALL_GANG_MEMBER_TYPES, type GangMemberType } from '@/types/gang';
import { GANG_MEMBER_META } from '@/data/gangAtributos';
import { CheckCircle2, Clock3, TrendingUp, Zap } from 'lucide-react';

function CountdownLabel({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return <span className="font-bold">Pronto!</span>;

  const totalSec = Math.ceil(ms / 1000);
  const m   = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return (
    <span>
      {String(m).padStart(2, '0')}:{String(sec).padStart(2, '0')}
    </span>
  );
}

// ─── Cor por papel ───────────────────────────────────────────────────────────

function toneFor(type: GangMemberType) {
  const papel = GANG_MEMBER_META[type]?.papel;
  if (papel === 'tanque')     return 'border-cyan-500/25   bg-cyan-500/5   hover:bg-cyan-500/10';
  if (papel === 'retaguarda') return 'border-purple-500/25 bg-purple-500/5 hover:bg-purple-500/10';
  if (papel === 'ofensivo')   return 'border-red-500/25    bg-red-500/5    hover:bg-red-500/10';
  return                             'border-amber-500/25  bg-amber-500/5  hover:bg-amber-500/10';
}

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  isOpen:  boolean;
  ctKey:   string;
  ctName:  string;
  onClose: () => void;
};

// ─── Componente ──────────────────────────────────────────────────────────────

export default function CTMapTrainingModal({ isOpen, ctKey, ctName, onClose }: Props) {
  const gang                      = useGangStore((s) => s.gang);
  const isLoading                 = useGangStore((s) => s.isLoading);
  const isSubmitting              = useGangStore((s) => s.isSubmitting);
  const error                     = useGangStore((s) => s.error);
  const queueTraining             = useGangStore((s) => s.queueTraining);
  const completeFinishedTrainings = useGangStore((s) => s.completeFinishedTrainings);
  const upgradeCT                 = useGangStore((s) => s.upgradeCT);

  const dirtyMoney = usePlayerStore((s) => s.player.balances.dirtyMoney);

  const [queueing, setQueueing] = useState<GangMemberType | null>(null);

  // Carrega gang ao abrir — acessa loadGang via getState() para não criar
  // subscription nem dep instável que causaria loop de re-render.
  useEffect(() => {
    if (!isOpen) return;
    void useGangStore.getState().loadGang();
  }, [isOpen]);

  // Refresh a cada 5s enquanto aberto para detectar treinos concluídos
  useEffect(() => {
    if (!isOpen) return undefined;
    const id = setInterval(() => {
      void useGangStore.getState().loadGang();
    }, 5000);
    return () => clearInterval(id);
  }, [isOpen]);

  const activeJobs = useMemo(
    () => (gang?.trainingJobs ?? []).filter((j) => !j.completed),
    [gang?.trainingJobs]
  );

  const slotsTotal   = gang?.trainingConfig?.slots    ?? gang?.ct?.trainingSlots ?? 0;
  const slotsFree    = Math.max(0, slotsTotal - activeJobs.length);
  const qtyPerOrder  = gang?.trainingConfig?.quantityPerOrder ?? 10;
  const durationSec  = gang?.trainingConfig?.durationSeconds  ?? 10;
  const activeByType = gang?.troopSummary?.activeByType;
  const ctLevel      = gang?.ct?.level    ?? 1;
  const ctMaxLevel   = gang?.ct?.maxLevel ?? 10;
  const gangLevel    = gang?.gangLevel    ?? 1;
  const totalMembers = gang?.troopSummary?.totalMembers ?? 0;
  const maxMembers   = gang?.maxMembers ?? 0;

  const handleQueue = useCallback(
    async (type: GangMemberType) => {
      setQueueing(type);
      try {
        await queueTraining(type, qtyPerOrder);
      } finally {
        setQueueing(null);
      }
    },
    [queueTraining, qtyPerOrder]
  );

  const handleCollect = useCallback(async () => {
    await completeFinishedTrainings();
  }, [completeFinishedTrainings]);

  const handleUpgradeCT = useCallback(async () => {
    await upgradeCT();
  }, [upgradeCT]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className="max-w-xl max-h-[90vh] overflow-y-auto
          border-[#2a1505] bg-[#080602] text-white
          shadow-[0_0_60px_rgba(255,120,0,0.08)]"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-[0.06em]">
            <Zap className="h-5 w-5 text-amber-400" />
            <span className="text-[#d9b764]">{ctName}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2.5 text-center">
            <div className="text-[9px] uppercase tracking-[0.18em] text-cyan-300">Gang Lv</div>
            <div className="mt-0.5 text-lg font-black">{gangLevel}</div>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-center">
            <div className="text-[9px] uppercase tracking-[0.18em] text-amber-300">Slots</div>
            <div className="mt-0.5 text-lg font-black">{slotsFree}/{slotsTotal}</div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-center">
            <div className="text-[9px] uppercase tracking-[0.18em] text-emerald-300">+Por ord</div>
            <div className="mt-0.5 text-lg font-black">{qtyPerOrder}</div>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-center">
            <div className="text-[9px] uppercase tracking-[0.18em] text-red-300">Tropa</div>
            <div className="mt-0.5 text-lg font-black">{totalMembers}/{maxMembers}</div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Treinos em andamento */}
        {activeJobs.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Em treinamento ({activeJobs.length}/{slotsTotal})
              </span>
              <button
                onClick={handleCollect}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-1.5
                  text-sm font-black text-black
                  hover:bg-amber-400 disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                Coletar prontos
              </button>
            </div>

            {activeJobs.map((job, i) => {
              const isDone = new Date(job.endsAt).getTime() <= Date.now();
              return (
                <div
                  key={job.id}
                  className={`flex items-center justify-between rounded-xl border p-3
                    ${isDone
                      ? 'border-amber-500/30 bg-amber-500/10'
                      : 'border-white/10 bg-white/[0.02]'
                    }`}
                >
                  <div>
                    <div className="font-black text-sm">
                      {GANG_MEMBER_META[job.memberType as GangMemberType]?.nome ?? job.memberType}
                    </div>
                    <div className="text-xs text-zinc-500">+{job.quantity} • Slot {i + 1}</div>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold
                      ${isDone
                        ? 'bg-amber-500 text-black'
                        : 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                      }`}
                  >
                    {isDone
                      ? <CheckCircle2 className="h-3.5 w-3.5" />
                      : <Clock3       className="h-3.5 w-3.5" />
                    }
                    <CountdownLabel endsAt={job.endsAt} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Nenhum treino ativo */}
        {activeJobs.length === 0 && !isLoading && (
          <div className="rounded-xl border border-white/8 bg-white/[0.015] p-3 text-center text-sm text-zinc-600">
            Nenhum treino em andamento.
          </div>
        )}

        {/* Botões de treino */}
        {slotsFree > 0 ? (
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Escolher tipo ({slotsFree} slot{slotsFree !== 1 ? 's' : ''} livre{slotsFree !== 1 ? 's' : ''})
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_GANG_MEMBER_TYPES.map((type) => {
                const meta      = GANG_MEMBER_META[type];
                const cost      = meta.custoTreinamento * qtyPerOrder;
                const canAfford = dirtyMoney >= cost;
                const active    = activeByType?.[type] ?? 0;
                const busy      = queueing !== null;

                return (
                  <button
                    key={type}
                    onClick={() => handleQueue(type)}
                    disabled={isSubmitting || busy || !canAfford}
                    className={`rounded-xl border p-3 text-left transition
                      ${toneFor(type)}
                      disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm">{meta.nome}</span>
                      <span className="text-[10px] text-zinc-500">{active} ativos</span>
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-400">
                      {queueing === type
                        ? 'Enfileirando...'
                        : canAfford
                          ? `-${cost.toLocaleString('pt-BR')} sujo`
                          : 'Saldo insuficiente'
                      }
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : slotsTotal > 0 ? (
          <div className="rounded-xl border border-zinc-700/40 bg-zinc-900/40 p-3 text-center text-sm text-zinc-500">
            Todos os slots ocupados — colete os treinos prontos para liberar.
          </div>
        ) : null}

        {/* CT upgrade */}
        <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-black">Centro de Treinamento</span>
            </div>
            <div className="mt-0.5 text-xs text-zinc-500">
              Lv {ctLevel}/{ctMaxLevel} • {slotsTotal} slot{slotsTotal !== 1 ? 's' : ''} • {durationSec}s/ordem
            </div>
          </div>
          <button
            onClick={handleUpgradeCT}
            disabled={isSubmitting || ctLevel >= ctMaxLevel}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white
              hover:bg-cyan-500 disabled:opacity-40 transition-colors"
          >
            Evoluir
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl border border-white/8 py-2
            text-sm text-zinc-500 hover:bg-white/5 transition-colors"
        >
          Fechar
        </button>
      </DialogContent>
    </Dialog>
  );
}
