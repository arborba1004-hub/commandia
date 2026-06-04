import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  Shield, Skull, Zap, Swords, Car, Target, Crown, TimerReset, Sparkles, Lock,
} from 'lucide-react';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import type { GangMemberType } from '@/components/gang/GangMembros';
import GANG_MEMBROS from '@/components/gang/GangMembros';
import { fetchTrainingPreview, type TrainingPreview } from '@/api/training';

type TrainingSlot = {
  id: string;
  ctKey: string;
  troopType: GangMemberType;
  troopLevel: number;
  quantity: number;
  startedAt: number;
  endsAt: number;
  status: 'training' | 'completed';
  cost: number;
};

type GangTrainingPlayerLike = {
  niveis?: { barracoLevel?: number };
  balances?: { dirtyMoney?: number };
};

type Props = {
  isOpen: boolean;
  slotKey: string | null;
  player: GangTrainingPlayerLike;
  trainingState: { trainingSlots?: TrainingSlot[] };
  onClose: () => void;
  onStartTraining: (
    slotKey: string,
    memberType: GangMemberType,
    troopLevel: number
  ) => void;
  onCollectTraining: (slotId: string) => void;
  isSubmitting?: boolean;
};

const TRAINABLE_MEMBER_TYPES: GangMemberType[] = [
  'capanga', 'frente', 'executor', 'assassino',
  'muralha', 'certeiro', 'motorista', 'nitro',
];

const ICONS: Record<GangMemberType, typeof Skull> = {
  capanga: Skull, frente: Shield, executor: Crown, assassino: Swords,
  muralha: Shield, certeiro: Target, motorista: Car, nitro: Zap,
};

const COLORS: Record<GangMemberType, string> = {
  capanga: 'from-red-900/70 to-red-500/20',
  frente: 'from-orange-900/70 to-orange-500/20',
  executor: 'from-yellow-900/70 to-yellow-500/20',
  assassino: 'from-purple-900/70 to-purple-500/20',
  muralha: 'from-blue-900/70 to-blue-500/20',
  certeiro: 'from-cyan-900/70 to-cyan-500/20',
  motorista: 'from-green-900/70 to-green-500/20',
  nitro: 'from-pink-900/70 to-pink-500/20',
};

function getMemberName(type: GangMemberType) {
  return GANG_MEMBROS[type]?.nome ?? type;
}

function getMaxTroopLevel(barracoLevel: number) {
  return Math.max(1, Math.min(10, Math.floor(barracoLevel / 10) + 1));
}

function formatDuration(ms: number) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${seconds}s`;
}

function calculateProgress(operation: TrainingSlot, now: number) {
  const total = operation.endsAt - operation.startedAt;
  if (total <= 0) return 100;
  const elapsed = now - operation.startedAt;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export default function GangTrainingModal({
  isOpen, slotKey, player, trainingState,
  onClose, onStartTraining, onCollectTraining,
  isSubmitting = false,
}: Props) {
  const barracoLevel = Math.max(1, Number(player?.niveis?.barracoLevel || 1));
  const maxLevel = getMaxTroopLevel(barracoLevel);
  const dirtyMoney = Number(player?.balances?.dirtyMoney || 0);

  const [selectedType, setSelectedType] = useState<GangMemberType | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [preview, setPreview] = useState<TrainingPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  // ── Tick de 1s para o countdown
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isOpen]);

  // ── Carrega preview quando o jogador escolhe tipo/nível
  useEffect(() => {
    if (!selectedType) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    fetchTrainingPreview(selectedType, selectedLevel)
      .then((p) => { if (!cancelled) setPreview(p); })
      .catch(() => { if (!cancelled) setPreview(null); })
      .finally(() => { if (!cancelled) setPreviewLoading(false); });
    return () => { cancelled = true; };
  }, [selectedType, selectedLevel]);

  // ── Reset selection ao trocar de CT
  useEffect(() => {
    setSelectedType(null);
    setSelectedLevel(1);
    setPreview(null);
  }, [slotKey]);

  const trainingSlots = trainingState.trainingSlots ?? [];
  const slotForThisCt = useMemo(
    () => trainingSlots.find((s) => s.ctKey === slotKey) ?? null,
    [trainingSlots, slotKey]
  );

  if (!slotKey) return null;

  const canAfford = preview?.unlocked ? dirtyMoney >= preview.cost : false;
  const canStart =
    !slotForThisCt && selectedType !== null && preview?.unlocked === true && canAfford && !isSubmitting;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
          <DialogContent className="max-h-[92dvh] overflow-y-auto border-white/10 bg-[#050505] p-0 text-white sm:max-w-5xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 30 }}
              transition={{ duration: 0.25 }}
              className="relative"
            >
              {/* Header */}
              <div className="relative border-b border-white/10 px-4 py-4 sm:px-8 sm:py-6">
                <DialogHeader>
                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div>
                      <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-[0.08em] sm:text-3xl sm:tracking-[0.12em]">
                        <Sparkles className="h-7 w-7 text-red-400" />
                        Centro de Recrutamento
                      </DialogTitle>
                      <div className="mt-2 text-xs uppercase tracking-[0.25em] text-zinc-500">
                        {slotKey.toUpperCase()} • Barraco lvl {barracoLevel} • Liberado até tropa nível {maxLevel}
                      </div>
                    </div>
                    <div className="w-full rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 sm:w-auto sm:px-5">
                      <div className="text-xs uppercase text-emerald-300">Dinheiro sujo</div>
                      <div className="mt-1 text-2xl font-black">
                        {dirtyMoney.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <div className="relative p-4 sm:p-8">
                {/* Slot ativo */}
                {slotForThisCt && (
                  <ActiveTrainingCard
                    slot={slotForThisCt}
                    now={now}
                    onCollect={() => onCollectTraining(slotForThisCt.id)}
                    isSubmitting={isSubmitting}
                  />
                )}

                {/* Seleção de tipo */}
                {!slotForThisCt && (
                  <>
                    <div className="mb-4 text-sm font-black uppercase tracking-[0.22em] text-zinc-500">
                      1 — Escolha o tipo
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                      {TRAINABLE_MEMBER_TYPES.map((memberType) => {
                        const Icon = ICONS[memberType];
                        const isSelected = selectedType === memberType;

                        return (
                          <button
                            key={memberType}
                            onClick={() => setSelectedType(memberType)}
                            className={`group relative min-h-[72px] overflow-hidden rounded-2xl border p-3 text-left transition-all sm:p-4 ${
                              isSelected
                                ? 'border-red-500 bg-red-500/10'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                            }`}
                          >
                            <div className={`absolute inset-0 bg-gradient-to-br ${COLORS[memberType]} opacity-30`} />
                            <div className="relative flex items-center gap-3">
                              <Icon className="h-7 w-7 text-white" />
                              <div className="text-base font-black uppercase">
                                {getMemberName(memberType)}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Seleção de nível */}
                    {selectedType && (
                      <>
                        <div className="mt-8 mb-4 text-sm font-black uppercase tracking-[0.22em] text-zinc-500">
                          2 — Escolha o nível (até {maxLevel})
                        </div>
                        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => {
                            const locked = lvl > maxLevel;
                            const active = selectedLevel === lvl;

                            return (
                              <button
                                key={lvl}
                                disabled={locked}
                                onClick={() => setSelectedLevel(lvl)}
                                className={`relative aspect-square rounded-xl border text-lg font-black transition-all ${
                                  active
                                    ? 'border-red-500 bg-red-500/20 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                                    : locked
                                      ? 'cursor-not-allowed border-white/5 bg-white/[0.02] text-zinc-700'
                                      : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/30'
                                }`}
                              >
                                {locked && <Lock className="absolute right-1 top-1 h-3 w-3" />}
                                {lvl}
                              </button>
                            );
                          })}
                        </div>

                        {/* Preview */}
                        <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:grid-cols-3">
                          {previewLoading || !preview ? (
                            <div className="col-span-3 text-center text-sm text-zinc-500">
                              Calculando…
                            </div>
                          ) : !preview.unlocked ? (
                            <div className="col-span-3 text-center text-sm text-amber-400">
                              {preview.message}
                            </div>
                          ) : (
                            <>
                              <PreviewStat label="Quantidade" value={preview.quantity.toString()} />
                              <PreviewStat
                                label="Custo"
                                value={preview.cost.toLocaleString('pt-BR')}
                                warning={!canAfford}
                              />
                              <PreviewStat
                                label="Duração"
                                value={formatDuration(preview.durationMs)}
                              />
                            </>
                          )}
                        </div>

                        {/* Botão de iniciar */}
                        <div className="sticky bottom-0 -mx-4 mt-6 flex flex-col gap-3 border-t border-white/10 bg-[#050505]/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:justify-end sm:bg-transparent sm:p-0 sm:pt-6">
                          <Button
                            variant="outline"
                            onClick={onClose}
                            className="h-12 w-full rounded-2xl border-white/10 bg-white/5 px-6 text-sm font-black uppercase sm:w-auto"
                          >
                            Fechar
                          </Button>
                          <Button
                            onClick={() => {
                              if (canStart && selectedType) {
                                onStartTraining(slotKey, selectedType, selectedLevel);
                              }
                            }}
                            disabled={!canStart}
                            className="h-12 w-full rounded-2xl bg-gradient-to-r from-red-500 to-red-600 px-8 text-sm font-black uppercase tracking-[0.12em] text-white disabled:opacity-40 sm:w-auto"
                          >
                            {!canAfford && preview?.unlocked
                              ? 'Dinheiro insuficiente'
                              : 'Iniciar treinamento'}
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

function PreviewStat({
  label, value, warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="rounded-xl bg-black/30 p-4 text-center">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className={`mt-2 text-2xl font-black ${warning ? 'text-red-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

function ActiveTrainingCard({
  slot, now, onCollect, isSubmitting,
}: {
  slot: TrainingSlot;
  now: number;
  onCollect: () => void;
  isSubmitting: boolean;
}) {
  const Icon = ICONS[slot.troopType];
  const isDone = slot.status === 'completed' || now >= slot.endsAt;
  const remainingMs = Math.max(0, slot.endsAt - now);
  const progress = calculateProgress(slot, now);

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-3">
        <TimerReset className="h-5 w-5 text-cyan-400" />
        <div className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">
          Treinamento em andamento
        </div>
      </div>

      <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${COLORS[slot.troopType]} p-5`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
              <Icon className="h-10 w-10 text-white" />
            </div>
            <div>
              <div className="text-xl font-black uppercase sm:text-2xl">
                {getMemberName(slot.troopType)} <span className="text-zinc-400">nível {slot.troopLevel}</span>
              </div>
              <div className="mt-1 text-sm text-zinc-300">
                {slot.quantity} soldados em treino
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden sm:w-72 rounded-full bg-black/40">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-200"
                />
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
            <div className="rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-center">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                {isDone ? 'Status' : 'Tempo restante'}
              </div>
              <div className="mt-1 text-xl font-black">
                {isDone ? 'PRONTO' : formatDuration(remainingMs)}
              </div>
            </div>

            {isDone && (
              <Button
                onClick={onCollect}
                disabled={isSubmitting}
                className="h-12 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 px-6 text-sm font-black uppercase tracking-[0.14em] text-black hover:scale-105 disabled:opacity-50"
              >
                Coletar tropas
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}