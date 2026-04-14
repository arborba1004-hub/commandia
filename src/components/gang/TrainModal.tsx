import type { GangMemberType, GangUnit } from '@/types/gangWar';

interface TrainModalProps {
  isOpen: boolean;
  member: GangUnit | null;
  onClose: () => void;
  onTrain: () => void;
  isLoading?: boolean;
}

function getMemberLabel(type: GangMemberType) {
  if (type === 'capanga') return 'Capanga';
  if (type === 'frente') return 'Frente';
  if (type === 'executor') return 'Executor';
  if (type === 'assassino') return 'Assassino';
  if (type === 'muralha') return 'Muralha';
  if (type === 'certeiro') return 'Certeiro';
  if (type === 'motorista') return 'Motorista';
  if (type === 'nitro') return 'Nitro';
  if (type === 'armeiro') return 'Armeiro';
  if (type === 'informante') return 'Informante';
  if (type === 'wifi') return 'WiFi';
  if (type === 'medico') return 'Médico';
  if (type === 'lavador') return 'Lavador';
  if (type === 'ladrao') return 'Ladrão';
  return 'Negociador';
}

function getMemberRole(type: GangMemberType) {
  if (type === 'capanga' || type === 'frente' || type === 'executor') {
    return 'Linha de frente';
  }
  if (type === 'muralha') return 'Defesa pesada';
  if (type === 'assassino' || type === 'certeiro') return 'Ofensiva';
  if (type === 'motorista' || type === 'nitro') return 'Mobilidade';
  if (type === 'armeiro' || type === 'informante' || type === 'wifi') {
    return 'Tático';
  }
  if (type === 'medico' || type === 'negociador') return 'Suporte';
  return 'Econômico';
}

function getStatusLabel(status: GangUnit['status']) {
  if (status === 'ativo') return 'Ativo';
  if (status === 'ferido') return 'Ferido';
  if (status === 'morto') return 'Morto';
  return 'Treinando';
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
              {getMemberLabel(member.type)} • {getMemberRole(member.type)} •{' '}
              {getStatusLabel(member.status)}
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
            <div className="text-zinc-500">Nível atual</div>
            <div className="mt-1 text-xl font-black">{member.level}</div>
          </div>

          <div className="rounded-2xl bg-black/40 px-4 py-3">
            <div className="text-zinc-500">Próximo nível</div>
            <div className="mt-1 text-xl font-black">
              {Math.min(member.level + 1, 10)}
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-2xl bg-black/40 px-4 py-4 text-sm text-zinc-400">
          <p>
            Recrutado em:{' '}
            <span className="font-bold text-white">
              {new Date(member.recruitedAt).toLocaleString('pt-BR')}
            </span>
          </p>

          {member.trainingEndsAt && (
            <p className="mt-2">
              Treino atual até:{' '}
              <span className="font-bold text-white">
                {new Date(member.trainingEndsAt).toLocaleString('pt-BR')}
              </span>
            </p>
          )}

          {member.injuryEndsAt && (
            <p className="mt-2">
              Recuperação até:{' '}
              <span className="font-bold text-white">
                {new Date(member.injuryEndsAt).toLocaleString('pt-BR')}
              </span>
            </p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={onTrain}
            disabled={isLoading || member.status !== 'ativo' || member.level >= 10}
            className="w-full rounded-2xl bg-amber-500 px-4 py-4 text-sm font-black text-black disabled:opacity-50"
          >
            {member.level >= 10
              ? 'NÍVEL MÁXIMO ATINGIDO'
              : isLoading
                ? 'TREINANDO...'
                : 'INICIAR TREINO'}
          </button>

          {member.status !== 'ativo' && member.level < 10 && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              Só integrantes ativos podem iniciar treino.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}