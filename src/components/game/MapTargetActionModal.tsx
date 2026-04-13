import { useMapAttackStore } from '@/store/mapAttackStore';
import { useMapFactionInvite } from '@/components/game/useMapFactionInvite';

interface MapTargetActionModalProps {
  isStartingBattle: boolean;
  onAttack: () => void;
}

export default function MapTargetActionModal({
  isStartingBattle,
  onAttack,
}: MapTargetActionModalProps) {
  const previewOpen = useMapAttackStore((state) => state.previewOpen);
  const closePreview = useMapAttackStore((state) => state.closePreview);

  const {
    previewTarget,
    canInviteToFaction,
    previewTargetHasNoFaction,
    isSubmittingInvite,
    handleInviteFromPreview,
  } = useMapFactionInvite();

  if (!previewOpen || !previewTarget) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60">
      <div className="w-full max-w-md rounded-t-3xl border border-red-500/30 bg-[#090909] p-5">
        <h2 className="mb-2 text-2xl font-black text-white">Invadir barraco</h2>

        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white">
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
              <div className="mt-1 font-bold">
                {previewTarget.barracoLevel ?? 1}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-black/30 p-3 text-sm">
            {previewTargetHasNoFaction
              ? 'Jogador sem facção.'
              : 'Jogador já pertence a uma facção.'}
          </div>
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
              onClick={closePreview}
              className="flex-1 rounded-2xl bg-zinc-700 px-4 py-4 font-bold text-white"
            >
              Cancelar
            </button>

            <button
              onClick={onAttack}
              disabled={isStartingBattle}
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