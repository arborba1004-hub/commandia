import type { RecruitOptions } from '@/types/gang';

interface RecruitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecruit: (method: RecruitOptions['method']) => void;
  isLoading?: boolean;
}

const RECRUIT_OPTIONS: RecruitOptions[] = [
  {
    method: 'mission',
    cost: 5000,
    costType: 'dirty',
    waitTimeSeconds: 0,
  },
  {
    method: 'market',
    cost: 50000,
    costType: 'clean',
    waitTimeSeconds: 0,
  },
  {
    method: 'premium',
    cost: 150000,
    costType: 'clean',
    waitTimeSeconds: 0,
  },
];

function labelForMethod(method: RecruitOptions['method']) {
  switch (method) {
    case 'mission':
      return 'Rua / Missão';
    case 'market':
      return 'Mercado Negro';
    case 'premium':
      return 'Recrutamento Premium';
    default:
      return method;
  }
}

function costLabel(option: RecruitOptions) {
  if (option.costType === 'dirty') return `${option.cost?.toLocaleString('pt-BR')} sujo`;
  if (option.costType === 'clean') return `${option.cost?.toLocaleString('pt-BR')} limpo`;
  return `${option.cost}`;
}

export default function RecruitModal({
  isOpen,
  onClose,
  onRecruit,
  isLoading = false,
}: RecruitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#090909] p-6 text-white shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-[0.08em]">
              Recrutar Integrante
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Cada método altera custo e raridade média do integrante recrutado.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white"
          >
            Fechar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RECRUIT_OPTIONS.map((option) => (
            <button
              key={option.method}
              onClick={() => onRecruit(option.method)}
              disabled={isLoading}
              className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5 text-left transition-all hover:border-primary disabled:opacity-50"
            >
              <div className="text-lg font-black text-white">
                {labelForMethod(option.method)}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                Custo: <span className="font-bold text-amber-300">{costLabel(option)}</span>
              </div>
              <div className="mt-4 text-xs uppercase tracking-[0.18em] text-zinc-500">
                {isLoading ? 'Recrutando...' : 'Selecionar'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}