import type { GangMemberType } from '@/types/gangWar';

interface RecruitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecruit: (type: GangMemberType) => void;
  isLoading?: boolean;
}

const RECRUIT_OPTIONS: Array<{
  type: GangMemberType;
  label: string;
  description: string;
}> = [
  { type: 'capanga', label: 'Capanga', description: 'Base da tropa e volume de combate.' },
  { type: 'frente', label: 'Frente', description: 'Pressão ofensiva na linha de entrada.' },
  { type: 'executor', label: 'Executor', description: 'Ataque pesado e finalização.' },
  { type: 'assassino', label: 'Assassino', description: 'Dano alto e eliminação rápida.' },
  { type: 'muralha', label: 'Muralha', description: 'Linha defensiva e contenção.' },
  { type: 'certeiro', label: 'Certeiro', description: 'Precisão, cobertura e suporte ofensivo.' },
  { type: 'motorista', label: 'Motorista', description: 'Mobilidade e reposicionamento.' },
  { type: 'nitro', label: 'Nitro', description: 'Velocidade e impacto tático.' },
  { type: 'armeiro', label: 'Armeiro', description: 'Suporte de arsenal e poder de fogo.' },
  { type: 'informante', label: 'Informante', description: 'Leitura de campo e inteligência.' },
  { type: 'wifi', label: 'WiFi', description: 'Coordenação e comunicação da operação.' },
  { type: 'medico', label: 'Médico', description: 'Recuperação e preservação da tropa.' },
  { type: 'lavador', label: 'Lavador', description: 'Força econômica e sustentação.' },
  { type: 'ladrao', label: 'Ladrão', description: 'Saque, infiltração e oportunidade.' },
  { type: 'negociador', label: 'Negociador', description: 'Ajuste fino e vantagem estratégica.' },
];

export default function RecruitModal({
  isOpen,
  onClose,
  onRecruit,
  isLoading = false,
}: RecruitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#090909] p-4 text-white shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-[0.08em]">
              Recrutar Integrante
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Escolha qual integrante da gangue você quer recrutar.
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
              className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5 text-left transition-all hover:border-primary disabled:opacity-50"
            >
              <div className="text-lg font-black text-white">{option.label}</div>

              <div className="mt-2 text-sm leading-relaxed text-zinc-400">
                {option.description}
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