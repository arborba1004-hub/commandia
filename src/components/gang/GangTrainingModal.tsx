import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Shield,
  Skull,
  Zap,
  Swords,
  Car,
  Target,
  Crown,
  TimerReset,
  Sparkles,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';

import type { GangMemberType } from '@/components/gang/GangMembros';

import GANG_MEMBROS from '@/components/gang/GangMembros';

import type {
  GangTrainingOperation,
  GangTrainingPlayerLike,
  GangTrainingState,
  QGSlotKey,
} from '@/components/gang/TreinamentoGang';

import {
  getGangTrainingCostDirty,
  getGangTrainingDurationMinutes,
  getGangTrainingQuantityPerOperation,
} from '@/components/gang/TreinamentoGang';

type Props = {
  isOpen: boolean;
  slotKey: QGSlotKey | null;
  player: GangTrainingPlayerLike;
  trainingState: GangTrainingState;
  onClose: () => void;
  onStartTraining: (
    slotKey: QGSlotKey,
    memberType: GangMemberType
  ) => void;
  onCollectTraining: (
    slotId: string
  ) => void;
  isSubmitting?: boolean;
};

const TRAINABLE_MEMBER_TYPES: GangMemberType[] = [
  'capanga',
  'frente',
  'executor',
  'assassino',
  'muralha',
  'certeiro',
  'motorista',
  'nitro',
];

const ICONS = {
  capanga: Skull,
  frente: Shield,
  executor: Crown,
  assassino: Swords,
  muralha: Shield,
  certeiro: Target,
  motorista: Car,
  nitro: Zap,
};

const COLORS = {
  capanga:
    'from-red-900/70 to-red-500/20',
  frente:
    'from-orange-900/70 to-orange-500/20',
  executor:
    'from-yellow-900/70 to-yellow-500/20',
  assassino:
    'from-purple-900/70 to-purple-500/20',
  muralha:
    'from-blue-900/70 to-blue-500/20',
  certeiro:
    'from-cyan-900/70 to-cyan-500/20',
  motorista:
    'from-green-900/70 to-green-500/20',
  nitro:
    'from-pink-900/70 to-pink-500/20',
};

function getMemberName(
  type: GangMemberType
) {
  return (
    GANG_MEMBROS[type]?.nome ??
    type
  );
}

function formatSlotLabel(
  slotKey: QGSlotKey
) {
  return slotKey.toUpperCase();
}

function formatRemaining(
  operation: GangTrainingOperation
) {
  const remainingMs = Math.max(
    0,
    operation.endsAt - Date.now()
  );

  const totalSeconds = Math.ceil(
    remainingMs / 1000
  );

  const minutes = Math.floor(
    totalSeconds / 60
  );

  const seconds =
    totalSeconds % 60;

  return `${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(
    2,
    '0'
  )}`;
}

function calculateProgress(
  operation: GangTrainingOperation
) {
  const total =
    operation.endsAt -
    operation.startedAt;

  const elapsed =
    Date.now() -
    operation.startedAt;

  return Math.min(
    100,
    Math.max(
      0,
      (elapsed / total) * 100
    )
  );
}

export default function GangTrainingModal({
  isOpen,
  slotKey,
  player,
  trainingState,
  onClose,
  onStartTraining,
  onCollectTraining,
  isSubmitting = false,
}: Props) {
  const [trainingSlots, setTrainingSlots] =
    useState(
      trainingState.trainingSlots ||
        []
    );

  useEffect(() => {
    setTrainingSlots(
      trainingState.trainingSlots ||
        []
    );
  }, [trainingState.trainingSlots]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrainingSlots(prev =>
        prev.map(slot => {
          if (
            slot.status ===
              'training' &&
            Date.now() >=
              slot.endsAt
          ) {
            return {
              ...slot,
              status:
                'completed' as const,
            };
          }

          return slot;
        })
      );
    }, 1000);

    return () =>
      clearInterval(interval);
  }, []);

  const quantityPerOperation =
    getGangTrainingQuantityPerOperation(
      player
    );

  const durationMinutes =
    getGangTrainingDurationMinutes(
      player
    );

  const dirtyCost =
    getGangTrainingCostDirty(
      player
    );

  if (!slotKey) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          open={isOpen}
          onOpenChange={open =>
            !open
              ? onClose()
              : undefined
          }
        >
          <DialogContent className="overflow-hidden border-white/10 bg-[#050505] p-0 text-white shadow-[0_0_80px_rgba(255,0,0,0.15)] sm:max-w-6xl">
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
                y: 30,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 30,
              }}
              transition={{
                duration: 0.25,
              }}
              className="relative"
            >
              {/* BACKGROUND */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,0,0,0.18),transparent_55%)]" />

                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent)]" />

                <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />

                <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
              </div>

              {/* HEADER */}
              <div className="relative border-b border-white/10 px-8 py-6">
                <DialogHeader>
                  <div className="flex items-center justify-between gap-6">
                    <div>
                      <DialogTitle className="flex items-center gap-3 text-4xl font-black uppercase tracking-[0.12em]">
                        <Sparkles className="h-8 w-8 text-red-400" />

                        Centro de Recrutamento
                      </DialogTitle>

                      <div className="mt-2 text-sm uppercase tracking-[0.25em] text-zinc-500">
                        {formatSlotLabel(
                          slotKey
                        )}{' '}
                        • Operações clandestinas
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3">
                        <div className="text-xs uppercase text-red-300">
                          Poder
                        </div>

                        <div className="mt-1 text-2xl font-black">
                          +
                          {quantityPerOperation *
                            16}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-3">
                        <div className="text-xs uppercase text-amber-300">
                          Custo
                        </div>

                        <div className="mt-1 text-2xl font-black">
                          {dirtyCost.toLocaleString(
                            'pt-BR'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              {/* BODY */}
              <div className="relative p-8">
                {/* ACTIVE TRAININGS */}
                {trainingSlots.length >
                  0 && (
                  <div className="mb-8">
                    <div className="mb-4 flex items-center gap-3">
                      <TimerReset className="h-5 w-5 text-cyan-400" />

                      <div className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">
                        Operações em andamento
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {trainingSlots.map(
                        slot => {
                          const Icon =
                            ICONS[
                              slot.troopType
                            ];

                          const progress =
                            calculateProgress(
                              slot
                            );

                          return (
                            <motion.div
                              key={slot.id}
                              initial={{
                                opacity: 0,
                                y: 20,
                              }}
                              animate={{
                                opacity: 1,
                                y: 0,
                              }}
                              className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${COLORS[slot.troopType]} p-5`}
                            >
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                              <div className="relative flex items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                                    <Icon className="h-10 w-10 text-white" />
                                  </div>

                                  <div>
                                    <div className="text-2xl font-black uppercase">
                                      {getMemberName(
                                        slot.troopType
                                      )}
                                    </div>

                                    <div className="mt-1 text-sm text-zinc-300">
                                      {
                                        slot.quantity
                                      }{' '}
                                      soldados recrutados
                                    </div>

                                    <div className="mt-4 h-2 w-72 overflow-hidden rounded-full bg-black/40">
                                      <motion.div
                                        initial={{
                                          width: 0,
                                        }}
                                        animate={{
                                          width: `${progress}%`,
                                        }}
                                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-200"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-3">
                                  <div className="rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-center">
                                    <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                                      Status
                                    </div>

                                    <div className="mt-1 text-xl font-black">
                                      {slot.status ===
                                      'completed'
                                        ? 'PRONTO'
                                        : formatRemaining(
                                            slot
                                          )}
                                    </div>
                                  </div>

                                  {slot.status ===
                                    'completed' && (
                                    <Button
                                      onClick={() =>
                                        onCollectTraining(
                                          slot.id
                                        )
                                      }
                                      disabled={
                                        isSubmitting
                                      }
                                      className="h-12 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 px-6 text-sm font-black uppercase tracking-[0.14em] text-black transition-all hover:scale-105 hover:from-amber-300 hover:to-yellow-200"
                                    >
                                      Coletar tropas
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
<div>
  <div className="mb-5 flex items-center justify-between">
    <div>
      <div className="text-sm font-black uppercase tracking-[0.22em] text-zinc-500">
        Escolha uma unidade
      </div>

      <div className="mt-1 text-3xl font-black uppercase">
        Recrutar tropas
      </div>
    </div>

    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3">
      <div className="text-xs uppercase text-cyan-300">
        Duração
      </div>

      <div className="mt-1 text-2xl font-black">
        {durationMinutes} min
      </div>
    </div>
  </div>

  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
    {TRAINABLE_MEMBER_TYPES.map((memberType) => {
      const Icon = ICONS[memberType];

      return (
        <motion.button
          key={memberType}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onStartTraining(slotKey, memberType)}
          disabled={isSubmitting}
          className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${COLORS[memberType]} p-6 text-left transition-all disabled:opacity-50`}
        >
          <div className="absolute inset-0 bg-black/50 transition-all group-hover:bg-black/35" />

          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-3xl font-black uppercase">
                {getMemberName(memberType)}
              </div>

              <div className="mt-2 max-w-sm text-sm text-zinc-300">
                {GANG_MEMBROS[memberType]?.descricao}
              </div>

              <div className="mt-6 flex items-center gap-5 text-sm">
                <div>
                  <div className="text-zinc-500">
                    Quantidade
                  </div>

                  <div className="font-black text-white">
                    +{quantityPerOperation}
                  </div>
                </div>

                <div>
                  <div className="text-zinc-500">
                    Poder
                  </div>

                  <div className="font-black text-red-300">
                    +{quantityPerOperation * 16}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-black/30">
              <Icon className="h-10 w-10 text-white" />
            </div>
          </div>
        </motion.button>
      );
    })}
  </div>
</div>

                {/* FOOTER */}
                <div className="mt-10 flex justify-end border-t border-white/10 pt-6">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="h-12 rounded-2xl border-white/10 bg-white/5 px-6 text-sm font-black uppercase tracking-[0.12em] text-white transition-all hover:bg-white/10"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
