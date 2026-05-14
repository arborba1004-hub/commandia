import { useMemo, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  getGangTrainingOperationStatus,
  getGangTrainingQuantityPerOperation,
} from '@/components/gang/TreinamentoGang';

type Props = {
  isOpen: boolean;
  slotKey: QGSlotKey | null;
  player: GangTrainingPlayerLike;
  trainingState: GangTrainingState;
  onClose: () => void;
  onStartTraining: (slotKey: QGSlotKey, memberType: GangMemberType) => void;
  onCollectTraining: (slotKey: QGSlotKey) => void;
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

function getMemberName(type: GangMemberType) {
  return GANG_MEMBROS[type]?.nome ?? type;
}

function formatSlotLabel(slotKey: QGSlotKey) {
  return slotKey.toUpperCase();
}

function formatRemaining(operation: GangTrainingOperation) {
  const remainingMs = Math.max(0, operation.endsAt - Date.now());
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
  const [trainingSlots, setTrainingSlots] = useState(trainingState.trainingSlots || []);

  useEffect(() => {
    setTrainingSlots(trainingState.trainingSlots || []);
  }, [trainingState.trainingSlots]);

  // Atualiza slots completados a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setTrainingSlots((prev) =>
        prev.map((slot) => {
          if (slot.status === 'training' && Date.now() >= slot.endsAt) {
            return { ...slot, status: 'completed' as const };
          }
          return slot;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const operation = useMemo(() => {
    if (!slotKey) return null;
    return trainingState.slots?.[slotKey] ?? null;
  }, [slotKey, trainingState]);

  const quantityPerOperation = getGangTrainingQuantityPerOperation(player);
  const durationMinutes = getGangTrainingDurationMinutes(player);
  const dirtyCost = getGangTrainingCostDirty(player);

  if (!slotKey) return null;

  const isReady = operation
    ? getGangTrainingOperationStatus(operation) === 'ready'
    : false;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-3xl border-white/10 bg-[#090909] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-[0.08em]">
            Treinamento {formatSlotLabel(slotKey)}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="text-xs uppercase text-amber-300">Quantidade</div>
            <div className="mt-1 text-2xl font-black">
              +{quantityPerOperation}
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <div className="text-xs uppercase text-cyan-300">Duração</div>
            <div className="mt-1 text-2xl font-black">
              {durationMinutes} min
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="text-xs uppercase text-emerald-300">Custo</div>
            <div className="mt-1 text-2xl font-black">
              {dirtyCost.toLocaleString('pt-BR')} sujo
            </div>
          </div>
        </div>

        {/* Exibir slots de treinamento */}
        {trainingSlots.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
            <div className="mb-4 text-sm uppercase tracking-[0.2em] text-zinc-500">
              Slots em treinamento
            </div>
            <div className="space-y-3">
              {trainingSlots.map((slot) => (
                <div key={slot.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-black">{getMemberName(slot.troopType)}</div>
                      <div className="mt-1 text-sm text-zinc-400">
                        {slot.quantity} membros
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`rounded-lg px-3 py-1 text-xs font-bold ${
                        slot.status === 'completed'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                      }`}>
                        {slot.status === 'completed' ? 'PRONTO' : `FALTA ${formatRemaining(slot)}`}
                      </div>
                      {slot.status === 'completed' && (
                        <Button
                          onClick={() => onCollectTraining(slotKey)}
                          disabled={isSubmitting}
                          className="bg-amber-500 px-3 py-1 text-xs font-black text-black hover:bg-amber-400 disabled:opacity-50"
                        >
                          Coletar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {operation ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Em andamento
                </div>
                <div className="mt-1 text-2xl font-black">
                  {getMemberName(operation.memberType)}
                </div>
                <div className="mt-2 text-sm text-zinc-400">
                  {operation.quantity} membros • iniciado em{' '}
                  {new Date(operation.startedAt).toLocaleString('pt-BR')}
                </div>
                <div className="mt-1 text-sm text-zinc-400">
                  termina em {new Date(operation.endsAt).toLocaleString('pt-BR')}
                </div>
                <div className="mt-1 text-sm text-zinc-400">
                  barraco no início: nível {operation.barracoLevelAtStart}
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 md:items-end">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-200">
                  {isReady ? 'PRONTO PARA COLETAR' : `FALTA ${formatRemaining(operation)}`}
                </div>

                <Button
                  onClick={() => onCollectTraining(slotKey)}
                  disabled={isSubmitting || !isReady}
                  className="bg-amber-500 font-black text-black hover:bg-amber-400 disabled:opacity-50"
                >
                  Coletar membros
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-400">
              Escolha o tipo de membro para treinar neste QG. Cada operação usa esse slot
              apenas para este jogador e não bloqueia o QG de outros jogadores.
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {TRAINABLE_MEMBER_TYPES.map((memberType) => (
                <button
                  key={memberType}
                  onClick={() => onStartTraining(slotKey, memberType)}
                  disabled={isSubmitting}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-red-500/30 hover:bg-red-500/5 disabled:opacity-50"
                >
                  <div className="text-lg font-black">{getMemberName(memberType)}</div>
                  <div className="mt-1 text-sm text-zinc-400">
                    {GANG_MEMBROS[memberType]?.descricao}
                  </div>
                  <div className="mt-3 text-xs uppercase tracking-[0.16em] text-red-300">
                    Treinar neste {formatSlotLabel(slotKey)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}