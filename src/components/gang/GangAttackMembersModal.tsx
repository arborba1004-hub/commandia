import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { GangMemberType } from '@/components/gang/GangMembros';
import GANG_MEMBROS from '@/components/gang/GangMembros';

export const ATTACK_MEMBER_TYPES: GangMemberType[] = [
  'capanga',
  'frente',
  'executor',
  'assassino',
  'muralha',
  'certeiro',
  'motorista',
  'nitro',
];

export type GangAttackSelection = Record<GangMemberType, number>;
export type GangAttackAvailableCounts = Partial<Record<GangMemberType, number>>;

export type GangAttackMembersModalProps = {
  isOpen: boolean;
  barracoLevel: number;
  availableCounts: GangAttackAvailableCounts;
  initialSelection?: Partial<GangAttackSelection> | null;
  onClose: () => void;
  onConfirm: (selection: GangAttackSelection) => void;
  isSubmitting?: boolean;
};

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getGangAttackMaxMembers(barracoLevel: number) {
  return Math.max(100, Math.floor(toNumber(barracoLevel, 1)) * 100);
}

export function createEmptyGangAttackSelection(): GangAttackSelection {
  return {
    capanga: 0,
    frente: 0,
    executor: 0,
    assassino: 0,
    muralha: 0,
    certeiro: 0,
    motorista: 0,
    nitro: 0,
  };
}

export function hydrateGangAttackSelection(
  incoming?: Partial<GangAttackSelection> | null
): GangAttackSelection {
  const empty = createEmptyGangAttackSelection();

  return {
    capanga: Math.max(0, Math.floor(toNumber(incoming?.capanga, empty.capanga))),
    frente: Math.max(0, Math.floor(toNumber(incoming?.frente, empty.frente))),
    executor: Math.max(0, Math.floor(toNumber(incoming?.executor, empty.executor))),
    assassino: Math.max(0, Math.floor(toNumber(incoming?.assassino, empty.assassino))),
    muralha: Math.max(0, Math.floor(toNumber(incoming?.muralha, empty.muralha))),
    certeiro: Math.max(0, Math.floor(toNumber(incoming?.certeiro, empty.certeiro))),
    motorista: Math.max(0, Math.floor(toNumber(incoming?.motorista, empty.motorista))),
    nitro: Math.max(0, Math.floor(toNumber(incoming?.nitro, empty.nitro))),
  };
}

export function getGangAttackAvailableCount(
  availableCounts: GangAttackAvailableCounts,
  type: GangMemberType
) {
  return Math.max(0, Math.floor(toNumber(availableCounts?.[type], 0)));
}

export function getGangAttackTotalSelected(selection: GangAttackSelection) {
  return ATTACK_MEMBER_TYPES.reduce((sum, type) => {
    return sum + Math.max(0, Math.floor(toNumber(selection[type], 0)));
  }, 0);
}

function getMemberName(type: GangMemberType) {
  return GANG_MEMBROS[type]?.nome ?? type;
}

function getMemberDescription(type: GangMemberType) {
  return GANG_MEMBROS[type]?.descricao ?? '';
}

function buildSafeSelection(
  nextSelection: GangAttackSelection,
  availableCounts: GangAttackAvailableCounts,
  maxMembers: number
) {
  const normalized = createEmptyGangAttackSelection();

  let remaining = maxMembers;

  for (const type of ATTACK_MEMBER_TYPES) {
    const requested = Math.max(0, Math.floor(toNumber(nextSelection[type], 0)));
    const available = getGangAttackAvailableCount(availableCounts, type);
    const safeValue = clamp(requested, 0, Math.min(available, remaining));

    normalized[type] = safeValue;
    remaining -= safeValue;
  }

  return normalized;
}

export default function GangAttackMembersModal({
  isOpen,
  barracoLevel,
  availableCounts,
  initialSelection = null,
  onClose,
  onConfirm,
  isSubmitting = false,
}: GangAttackMembersModalProps) {
  const maxMembers = useMemo(
    () => getGangAttackMaxMembers(barracoLevel),
    [barracoLevel]
  );

  const [selection, setSelection] = useState<GangAttackSelection>(
    createEmptyGangAttackSelection()
  );

  useEffect(() => {
    if (!isOpen) return;

    const hydrated = hydrateGangAttackSelection(initialSelection);
    const safeSelection = buildSafeSelection(hydrated, availableCounts, maxMembers);
    setSelection(safeSelection);
  }, [isOpen, initialSelection, availableCounts, maxMembers]);

  const totalSelected = useMemo(
    () => getGangAttackTotalSelected(selection),
    [selection]
  );

  const remaining = Math.max(0, maxMembers - totalSelected);

  function updateMemberCount(type: GangMemberType, requestedValue: number) {
    setSelection((current) => {
      const currentValue = Math.max(0, Math.floor(toNumber(current[type], 0)));
      const available = getGangAttackAvailableCount(availableCounts, type);
      const safeRequested = clamp(Math.floor(requestedValue), 0, available);

      const withoutCurrent = totalSelected - currentValue;
      const maxAllowedForThisType = Math.max(0, maxMembers - withoutCurrent);
      const nextValue = Math.min(safeRequested, available, maxAllowedForThisType);

      return {
        ...current,
        [type]: nextValue,
      };
    });
  }

  function handleStepChange(type: GangMemberType, delta: number) {
    updateMemberCount(type, selection[type] + delta);
  }

  function handleInputChange(type: GangMemberType, rawValue: string) {
    const numeric = rawValue.trim() === '' ? 0 : Number(rawValue);
    updateMemberCount(type, Number.isFinite(numeric) ? numeric : 0);
  }

  function handleFillRemaining(type: GangMemberType) {
    const available = getGangAttackAvailableCount(availableCounts, type);
    const currentValue = selection[type];
    const withoutCurrent = totalSelected - currentValue;
    const maxAllowedForThisType = Math.max(0, maxMembers - withoutCurrent);
    const nextValue = Math.min(available, maxAllowedForThisType);

    updateMemberCount(type, nextValue);
  }

  function handleClearAll() {
    setSelection(createEmptyGangAttackSelection());
  }

  function handleConfirm() {
    onConfirm(selection);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-4xl border-white/10 bg-[#090909] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-[0.08em]">
            Selecionar membros para o ataque
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <div className="text-xs uppercase text-red-300">Capacidade máxima</div>
            <div className="mt-1 text-2xl font-black">
              {maxMembers.toLocaleString('pt-BR')}
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              barraco nível {barracoLevel} × 100
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="text-xs uppercase text-amber-300">Selecionados</div>
            <div className="mt-1 text-2xl font-black">
              {totalSelected.toLocaleString('pt-BR')}
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              membros enviados nesse ataque
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="text-xs uppercase text-emerald-300">Restantes</div>
            <div className="mt-1 text-2xl font-black">
              {remaining.toLocaleString('pt-BR')}
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              vagas ainda disponíveis
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-400">
          Escolha quantos membros de cada tipo vão participar do ataque. O total não pode
          passar de <span className="font-bold text-white">{maxMembers}</span> membros.
        </div>

        <div className="grid grid-cols-1 gap-3">
          {ATTACK_MEMBER_TYPES.map((type) => {
            const available = getGangAttackAvailableCount(availableCounts, type);
            const selected = selection[type];
            const withoutCurrent = totalSelected - selected;
            const maxAllowedForThisType = Math.max(0, maxMembers - withoutCurrent);
            const canIncrease = selected < available && selected < maxAllowedForThisType;

            return (
              <div
                key={type}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-black">{getMemberName(type)}</div>
                    <div className="mt-1 text-sm text-zinc-400">
                      {getMemberDescription(type)}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
                      <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-300">
                        Disponíveis: {available.toLocaleString('pt-BR')}
                      </span>
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-300">
                        Selecionados: {selected.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleStepChange(type, -10)}
                        disabled={isSubmitting || selected <= 0}
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                      >
                        -10
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleStepChange(type, -1)}
                        disabled={isSubmitting || selected <= 0}
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                      >
                        -1
                      </Button>

                      <input
                        type="number"
                        min={0}
                        max={Math.min(available, maxAllowedForThisType)}
                        step={1}
                        value={selected}
                        onChange={(event) => handleInputChange(type, event.target.value)}
                        disabled={isSubmitting}
                        className="h-11 w-28 rounded-xl border border-white/10 bg-black/40 px-3 text-center text-lg font-black text-white outline-none transition focus:border-red-500/40"
                      />

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleStepChange(type, 1)}
                        disabled={isSubmitting || !canIncrease}
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                      >
                        +1
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleStepChange(type, 10)}
                        disabled={isSubmitting || !canIncrease}
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                      >
                        +10
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleFillRemaining(type)}
                      disabled={isSubmitting || selected >= Math.min(available, maxAllowedForThisType)}
                      className="border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                    >
                      Usar o máximo desse tipo
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 pt-2 md:flex-row md:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleClearAll}
            disabled={isSubmitting || totalSelected === 0}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Limpar seleção
          </Button>

          <div className="flex flex-col gap-3 md:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Fechar
            </Button>

            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || totalSelected <= 0}
              className="bg-red-600 font-black text-white hover:bg-red-500 disabled:opacity-50"
            >
              Confirmar ataque com {totalSelected.toLocaleString('pt-BR')} membros
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}