import type { GangMember } from '@/types/gang';

interface TrainModalProps {
  isOpen: boolean;
  member: GangMember | null;
  onClose: () => void;
  onTrain: (premium?: boolean) => void;
  isLoading?: boolean;
}

export default function TrainModal({
  isOpen,
  member,
  onClose,
  onTrain,
  isLoading = false,
}: TrainModalProps) {
  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#090909] p-6 text-white shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-[0.08em]">
              Treinar Integrante
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {member.name} • {member.class} • {member.rarity}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white"
          >
            Fechar
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-black/40 px-4 py-3">
            <div className="text-zinc-500">Nível</div>
            <div className="mt-1 text-xl font-black">{member.level}</div>
          </div>
          <div className="rounded-2xl bg-black/40 px-4 py-3">
            <div className="text-zinc-500">Lealdade</div>
            <div className="mt-1 text-xl font-black">{member.loyalty}</div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onTrain(false)}
            disabled={isLoading}
            className="w-full rounded-2xl bg-amber-500 px-4 py-4 text-sm font-black text-black disabled:opacity-50"
          >
            {isLoading ? 'Treinando...' : 'Treino Normal • 2.000 sujo'}
          </button>

          <button
            onClick={() => onTrain(true)}
            disabled={isLoading}
            className="w-full rounded-2xl bg-purple-500 px-4 py-4 text-sm font-black text-white disabled:opacity-50"
          >
            {isLoading ? 'Treinando...' : 'Treino Premium • 5.000 limpo'}
          </button>
        </div>
      </div>
    </div>
  );
}