import type { GangMemberType } from '@/types/gangWar';

interface RecruitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecruit: (type: GangMemberType) => void;
  isLoading?: boolean;
  recruitingType?: GangMemberType | null;
}

const RECRUIT_OPTIONS: Array<{
  type: GangMemberType;
  label: string;
  role: string;
  description: string;
}> = [
  {
    type: 'capanga',
    label: 'Capanga',
    role: 'Base da tropa',
    description: 'Sustenta volume de confronto e forma o corpo principal da gangue.',
  },
  {
    type: 'frente',
    label: 'Frente',
    role: 'Linha de entrada',
    description: 'Abre o ataque e segura a pressão inicial.',
  },
  {
    type: 'executor',
    label: 'Executor',
    role: 'Finalização pesada',
    description: 'Unidade forte em quebra e encerramento do confronto.',
  },
  {
    type: 'assassino',
    label: 'Assassino',
    role: 'Ofensiva letal',
    description: 'Alta rajada e alta quebra para investidas decisivas.',
  },
  {
    type: 'muralha',
    label: 'Muralha',
    role: 'Defesa pesada',
    description: 'Especialista em blindagem e fôlego.',
  },
  {
    type: 'certeiro',
    label: 'Certeiro',
    role: 'Precisão ofensiva',
    description: 'Melhora ataques limpos e aumenta eficiência de dano.',
  },
  {
    type: 'motorista',
    label: 'Motorista',
    role: 'Mobilidade',
    description: 'Ajuda em deslocamento, manobra e ataque rápido.',
  },
  {
    type: 'nitro',
    label: 'Nitro',
    role: 'Aceleração ofensiva',
    description: 'Explosão inicial e avanço agressivo.',
  },
  {
    type: 'armeiro',
    label: 'Armeiro',
    role: 'Suporte bélico',
    description: 'Fortalece o peso ofensivo da composição.',
  },
  {
    type: 'informante',
    label: 'Informante',
    role: 'Leitura tática',
    description: 'Melhora visão, antecipação e inteligência de combate.',
  },
  {
    type: 'wifi',
    label: 'WiFi',
    role: 'Coordenação',
    description: 'Aumenta sinergia e organização da gangue.',
  },
  {
    type: 'medico',
    label: 'Médico',
    role: 'Recuperação',
    description: 'Reduz mortes e aumenta chance de feridos recuperáveis.',
  },
  {
    type: 'lavador',
    label: 'Lavador',
    role: 'Sustentação econômica',
    description: 'Ajuda na manutenção financeira da máquina de guerra.',
  },
  {
    type: 'ladrao',
    label: 'Ladrão',
    role: 'Saque e oportunidade',
    description: 'Melhora retorno econômico e pilhagem.',
  },
  {
    type: 'negociador',
    label: 'Negociador',
    role: 'Vantagem estrutural',
    description: 'Reduz custos e melhora acordos da operação.',
  },
];

function getCardClasses(type: GangMemberType) {
  if (type === 'assassino' || type === 'executor' || type === 'frente') {
    return 'border-red-500/20 hover:border-red-400';
  }
  if (type === 'muralha' || type === 'medico') {
    return 'border-cyan-500/20 hover:border-cyan-400';
  }
  if (type === 'motorista' || type === 'nitro') {
    return 'border-amber-500/20 hover:border-amber-400';
  }
  if (type === 'lavador' || type === 'ladrao' || type === 'negociador') {
    return 'border-emerald-500/20 hover:border-emerald-400';
  }
  return 'border-white/10 hover:border-white/20';
}

export default function RecruitModal({
  isOpen,
  onClose,
  onRecruit,
  isLoading = false,
  recruitingType = null,
}: RecruitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-white/10 bg-[#090909] p-6 text-white shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-[0.08em]">
              Recrutar Integrante
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Escolha o tipo de operador que vai entrar para sua gangue.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white"
          >
            Fechar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {RECRUIT_OPTIONS.map((option) => (
            <button
              key={option.type}
              onClick={() => onRecruit(option.type)}
              disabled={isLoading}
              className={`rounded-3xl border bg-zinc-950/80 p-5 text-left transition-all disabled:opacity-50 ${getCardClasses(
                option.type
              )}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-black text-white">{option.label}</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-300">
                    {option.role}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                {option.description}
              </p>

              <div className="mt-4 text-xs uppercase tracking-[0.18em] text-zinc-500">
                {recruitingType === option.type ? 'Recrutando...' : 'Selecionar'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}