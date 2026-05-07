/**
 * CTMapTrainingModal.tsx
 *
 * Modal de treinamento de gangue aberto ao clicar em um CT do mapa 3D.
 * Usa gangStore → gangApi → backend /gang-war/* (Google Auth + socket).
 * Não depende do sistema legado (TreinamentoGang / localStorage).
 *
 * Fluxo:
 *   clicar CT no mapa
 *     → abre modal
 *     → gangStore.loadGang() busca estado real do backend
 *     → jogador escolhe tipo → gangStore.queueTraining()
 *     → backend persiste, socket emite gangUpdate → gangStore atualiza
 *     → countdown live mostra progresso
 *     → "Coletar" → gangStore.completeFinishedTrainings()
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

// ─── Countdown live para cada job ────────────────────────────────────────────

function useJobsWithCountdown(
  jobs: Array<{ id: string; endsAt: string; memberType: string; quantity: number }>
) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return useMemo(
    () =>
      jobs.map((job) => {
        const ms   = new Date(job.endsAt).getTime() - Date.now();
        const done = ms <= 0;
        if (done) return { ...job, done: true, label: 'Pronto!' };
        const s   = Math.ceil(ms / 1000);
        const m   = Math.floor(s / 60);
        const sec = s % 60;
        return {
          ...job,
          done:  false,
          label: `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jobs, Math.floor(Date.now() / 1000)] // recalc a cada tick do setInterval
  );
}

// ─── Cor por papel do tipo ────────────────────────────────────────────────────

function toneFor(type: GangMemberType) {
  const papel = GANG_MEMBER_META[type]?.papel;
  if (papel === 'tanque')          return 'border-cyan-500/25   bg-cyan-500/5   hover:bg-cyan-500/10';
  if (papel === 'retaguarda')      return 'border-purple-500/25 bg-purple-500/5 hover:bg-purple-500/10';
  if (papel === 'ofensivo')        return 'border-red-500/25    bg-red-500/5    hover:bg-red-500/10';
  return                                  'border-amber-500/25  bg-amber-500/5  hover:bg-amber-500/10';
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
  // ── Store ────────────────────────────────────────────────────────────────
  const gang                      = useGangStore((s) => s.gang);
  const isLoading                 = useGangStore((s) => s.isLoading);
  const isSubmitting              = useGangStore((s) => s.isSubmitting);
  const error                     = useGangStore((s) => s.error);
  const loadGang                  = useGangStore((s) => s.loadGang);
  const queueTraining             = useGangStore((s) => s.queueTraining);
  const completeFinishedTrainings = useGangStore((s) => s.completeFinishedTrainings);
  const upgradeCT                 = useGangStore((s) => s.upgradeCT);

  const dirtyMoney = usePlayerStore((s) => s.player.balances.dirtyMoney);

  // ── Estado local ─────────────────────────────────────────────────────────
  const [queueing, setQueueing] = useState<GangMemberType | null>(null);

  // ── Carregar gang ao abrir ────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      void loadGang();
    }
  }, [isOpen, loadGang]);

  // ── Refresh automático a cada 5s (para countdown + coleta automática) ─────
  useEffect(() => {
    if (!isOpen) return undefined;
    const id = setInterval(() => { void loadGang(); }, 5000);
    return () => clearInterval(id);
  }, [isOpen, loadGang]);

  // ── Dados derivados ───────────────────────────────────────────────────────
  const activeJobs = useMemo(
    () => (gang?.trainingJobs ?? []).filter((j) => !j.completed),
    [gang?.trainingJobs]
  );

  const jobsWithCountdown = useJobsWithCountdown(activeJobs);
  const hasReadyJobs      = jobsWithCountdown.some((j) => j.done);

  const slotsTotal   = gang?.trainingConfig?.slots ?? gang?.ct?.trainingSlots ?? 0;
  const slotsFree    = Math.max(0, slotsTotal - activeJobs.length);
  const qtyPerOrder  = gang?.trainingConfig?.quantityPerOrder ?? 10;
  const durationSec  = gang?.trainingConfig?.durationSeconds  ?? 10;
  const activeByType = gang?.troopSummary?.activeByType;
  const ctLevel      = gang?.ct?.level    ?? 1;
  const ctMaxLevel   = gang?.ct?.maxLevel ?? 10;
  const gangLevel    = gang?.gangLevel    ?? 1;
  const totalMembers = gang?.troopSummary?.totalMembers ?? 0;
  const maxMembers   = gang?.maxMembers ?? 0;

  // ── Handlers ─────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────

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

        {/* ── Stats row ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Gang Lv', value: gangLevel,                 color: 'cyan'    },
            { label: 'Slots',   value: `${slotsFree}/${slotsTotal}`, color: 'amber' },
            { label: '+Por ord',value: qtyPerOrder,                color: 'emerald' },
            { label: 'Tropa',   value: `${totalMembers}/${maxMembers}`, color: 'red' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className={`rounded-xl border border-${color}-500/20
                bg-${color}-500/10 p-2.5 text-center`}
            >
              <div className={`text-[9px] uppercase tracking-[0.18em] text-${color}-300`}>
                {label}
              </div>
              <div className="mt-0.5 text-lg font-black">{value}</div>
            </div>
          ))}
        </div>

        {/* ── Erro ────────────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ── Treinos em andamento ─────────────────────────────────────────── */}
        {activeJobs.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Em treinamento ({activeJobs.length}/{slotsTotal})
              </span>
              {hasReadyJobs && (
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
              )}
            </div>

            {jobsWithCountdown.map((job, i) => (
              <div
                key={job.id}
                className={`flex items-center justify-between rounded-xl border p-3 transition-colors
                  ${job.done
                    ? 'border-amber-500/30 bg-amber-500/10'
                    : 'border-white/10 bg-white/[0.02]'
                  }`}
              >
                <div>
                  <div className="font-black text-sm">
                    {GANG_MEMBER_META[job.memberType as GangMemberType]?.nome ?? job.memberType}
                  </div>
                  <div className="text-xs text-zinc-500">
                    +{job.quantity} • Slot {i + 1}
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold
                    ${job.done
                      ? 'bg-amber-500 text-black'
                      : 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                    }`}
                >
                  {job.done
                    ? <CheckCircle2 className="h-3.5 w-3.5" />
                    : <Clock3       className="h-3.5 w-3.5" />
                  }
                  {job.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Nenhum treino ativo ───────────────────────────────────────────── */}
        {activeJobs.length === 0 && !isLoading && (
          <div className="rounded-xl border border-white/8 bg-white/[0.015] p-3 text-center text-sm text-zinc-600">
            Nenhum treino em andamento.
          </div>
        )}

        {/* ── Botões de treino ─────────────────────────────────────────────── */}
        {slotsFree > 0 ? (
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Escolher tipo ({slotsFree} slot{slotsFree !== 1 ? 's' : ''} livre{slotsFree !== 1 ? 's' : ''})
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_GANG_MEMBER_TYPES.map((type) => {
                const meta     = GANG_MEMBER_META[type];
                const cost     = meta.custoTreinamento * qtyPerOrder;
                const canAfford = dirtyMoney >= cost;
                const active   = activeByType?.[type] ?? 0;
                const busy     = queueing !== null;

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

        {/* ── CT upgrade ───────────────────────────────────────────────────── */}
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

        {/* ── Fechar ───────────────────────────────────────────────────────── */}
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
