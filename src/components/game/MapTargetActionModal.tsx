import { useEffect, useMemo } from 'react';
import { useMapAttackStore } from '@/store/mapAttackStore';
import { useMapFactionInvite } from '@/components/game/useMapFactionInvite';
import { useGangStore } from '@/store/gangStore';
import type { GangMemberType } from '@/types/gangWar';

interface MapTargetActionModalProps {
  isStartingBattle: boolean;
  onAttack: () => void;
}

const TROOP_ORDER: Array<{ type: GangMemberType; label: string }> = [
  { type: 'muralha', label: 'Muralha' },
  { type: 'frente', label: 'Frente' },
  { type: 'executor', label: 'Executor' },
  { type: 'capanga', label: 'Capanga' },
  { type: 'nitro', label: 'Nitro' },
  { type: 'certeiro', label: 'Certeiro' },
  { type: 'motorista', label: 'Motorista' },
  { type: 'armeiro', label: 'Armeiro' },
  { type: 'informante', label: 'Informante' },
  { type: 'wifi', label: 'Wifi' },
  { type: 'medico', label: 'Médico' },
  { type: 'lavador', label: 'Lavador' },
  { type: 'negociador', label: 'Negociador' },
];

export default function MapTargetActionModal({
  isStartingBattle,
  onAttack,
}: MapTargetActionModalProps) {
  const previewOpen = useMapAttackStore((state) => state.previewOpen);
  const closePreview = useMapAttackStore((state) => state.closePreview);
  const selectedTroops = useMapAttackStore((state) => state.selectedTroops);
  const updateTroopSelection = useMapAttackStore((state) => state.updateTroopSelection);
  const clearSelectedTroops = useMapAttackStore((state) => state.clearSelectedTroops);

  const availableByType = useGangStore((state) => state.getAvailableByType());
  const loadGang = useGangStore((state) => state.loadGang);

  const {
    previewTarget,
    canInviteToFaction,
    previewTargetHasNoFaction,
    isSubmittingInvite,
    handleInviteFromPreview,
  } = useMapFactionInvite();

  useEffect(() => {
    if (previewOpen) {
      void loadGang();
    }
  }, [previewOpen, loadGang]);

  const selectedTotal = useMemo(
    () => selectedTroops.reduce((sum, troop) => sum + troop.quantity, 0),
    [selectedTroops]
  );

  const selectedMap = useMemo(
    () => Object.fromEntries(selectedTroops.map((troop) => [troop.type, troop.quantity])),
    [selectedTroops]
  );

  if (!previewOpen || !previewTarget) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60">
      <div className="w-full max-w-xl rounded-t-3xl border border-red-500/30 bg-[#090909] p-5 text-white">
        <h2 className="mb-2 text-2xl font-black">Invadir barraco</h2>

        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-sm text-zinc-400">Alvo</div>
          <div className="mt-1 text-lg font-bold">{previewTarget.playerName}</div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-black/30 p-3">
              <div className="text-zinc-500">Poder</div>
              <div className="mt-1 font-bold">
                {previewTarget.power?.toLocaleString?.('pt-BR') ??
                  previewTarget.power ??
                  0}
              </div>
            </div>

            <div className="rounded-xl bg-black/30 p-3">
              <div className="text-zinc-500">Barraco</div>
              <div className="mt-1 font-bold">{previewTarget.barracoLevel ?? 1}</div>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-300">
            Montar marcha
          </div>

          <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
            {TROOP_ORDER.map(({ type, label }) => {
              const available = availableByType[type] || 0;
              const selected = Number(selectedMap[type] || 0);

              return (
                <div
                  key={type}
                  className="rounded-xl border border-white/10 bg-black/30 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="font-bold">{label}</div>
                    <div className="text-xs text-zinc-400">
                      Disponível: <span className="font-bold text-white">{available}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateTroopSelection(type, Math.max(0, selected - 1))}
                      className="rounded-lg bg-zinc-800 px-3 py-2 font-black"
                    >
                      -
                    </button>

                    <input
                      value={selected}
                      onChange={(e) => {
                        const next = Math.max(
                          0,
                          Math.min(available, Number(e.target.value || 0))
                        );
                        updateTroopSelection(type, next);
                      }}
                      className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-center font-black"
                      inputMode="numeric"
                    />

                    <button
                      onClick={() => updateTroopSelection(type, Math.min(available, selected + 1))}
                      className="rounded-lg bg-zinc-800 px-3 py-2 font-black"
                    >
                      +
                    </button>

                    <button
                      onClick={() => updateTroopSelection(type, available)}
                      className="rounded-lg bg-red-700 px-3 py-2 text-xs font-black"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <div className="text-zinc-400">
              Tropas selecionadas:{' '}
              <span className="font-black text-white">{selectedTotal}</span>
            </div>

            <button
              onClick={clearSelectedTroops}
              className="rounded-xl bg-zinc-800 px-3 py-2 text-xs font-black"
            >
              LIMPAR
            </button>
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-black/30 p-3 text-sm">
          {previewTargetHasNoFaction
            ? 'Jogador sem facção.'
            : 'Jogador já pertence a uma facção.'}
        </div>

        <div className="flex flex-col gap-3">
          {canInviteToFaction && previewTargetHasNoFaction && (
            <button
              onClick={() => {
                void handleInviteFromPreview();
              }}
              disabled={isSubmittingInvite}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-4 font-black text-white disabled:opacity-50"
            >
              {isSubmittingInvite ? 'CONVIDANDO...' : 'CONVIDAR PARA FACÇÃO'}
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                clearSelectedTroops();
                closePreview();
              }}
              className="flex-1 rounded-2xl bg-zinc-700 px-4 py-4 font-bold text-white"
            >
              Cancelar
            </button>

            <button
              onClick={onAttack}
              disabled={isStartingBattle || selectedTotal <= 0}
              className="flex-1 rounded-2xl bg-red-600 px-4 py-4 font-black text-white disabled:opacity-50"
            >
              {isStartingBattle ? 'INVADINDO...' : 'INVADIR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
