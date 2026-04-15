import { Shield, Swords, Target, Radar, Coins } from 'lucide-react';
import { useGangStore } from '@/store/gangStore';
import type { GangFormationType } from '@/types/gangWar';

type FormationType = GangFormationType;

const FORMATIONS: Array<{
  id: FormationType;
  title: string;
  description: string;
  rajada: string;
  blindagem: string;
  folego: string;
  quebra: string;
  loot: string;
  Icon: typeof Swords;
}> = [
  {
    id: 'pressao_total',
    title: 'Pressão Total',
    description: 'Entrada pesada, mais rajada e quebra, com mais exposição da tropa.',
    rajada: '+18%',
    blindagem: '-8%',
    folego: '-4%',
    quebra: '+14%',
    loot: '+0%',
    Icon: Swords,
  },
  {
    id: 'linha_fechada',
    title: 'Linha Fechada',
    description:
      'Formação de sustentação, melhor para resistir, preservar a tropa e segurar confronto longo.',
    rajada: '-6%',
    blindagem: '+20%',
    folego: '+10%',
    quebra: '-4%',
    loot: '+0%',
    Icon: Shield,
  },
  {
    id: 'bote_certo',
    title: 'Bote Certo',
    description: 'Ataque coordenado com boa mobilidade e pressão precisa.',
    rajada: '+10%',
    blindagem: '+0%',
    folego: '+0%',
    quebra: '+10%',
    loot: '+8%',
    Icon: Target,
  },
  {
    id: 'cerco',
    title: 'Cerco',
    description: 'Formação equilibrada para sufocar o alvo e manter a linha organizada.',
    rajada: '+6%',
    blindagem: '+8%',
    folego: '+6%',
    quebra: '+6%',
    loot: '+0%',
    Icon: Radar,
  },
  {
    id: 'saque_rapido',
    title: 'Saque Rápido',
    description: 'Menos sustentação, mais mobilidade e foco em espólio.',
    rajada: '+0%',
    blindagem: '-6%',
    folego: '-2%',
    quebra: '+4%',
    loot: '+22%',
    Icon: Coins,
  },
];

export default function GangFormationSelector() {
  const gang = useGangStore((state) => state.gang);
  const isSubmitting = useGangStore((state) => state.isSubmitting);
  const setFormation = useGangStore((state) => state.setFormation);

  const formation = gang?.formation || 'pressao_total';

  return (
    <div className="rounded-3xl border border-white/10 bg-black/50 p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">
          Formação da Gangue
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          A formação influencia Rajada, Blindagem, Fôlego, Quebra e o rendimento do espólio.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {FORMATIONS.map((item) => {
          const selected = formation === item.id;
          const Icon = item.Icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                void setFormation(item.id);
              }}
              disabled={isSubmitting}
              className={`rounded-3xl border p-5 text-left transition-all disabled:opacity-50 ${
                selected
                  ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(255,0,127,0.18)]'
                  : 'border-white/10 bg-zinc-950/70 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-2xl p-3 ${
                    selected ? 'bg-primary/20 text-primary' : 'bg-white/5 text-zinc-300'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {selected ? 'Ativa' : isSubmitting ? 'Salvando...' : 'Selecionar'}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                {item.description}
              </p>

              <div className="mt-5 space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                  <span className="text-zinc-400">Rajada</span>
                  <span className="font-bold text-red-300">{item.rajada}</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                  <span className="text-zinc-400">Blindagem</span>
                  <span className="font-bold text-cyan-300">{item.blindagem}</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                  <span className="text-zinc-400">Fôlego</span>
                  <span className="font-bold text-amber-300">{item.folego}</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                  <span className="text-zinc-400">Quebra</span>
                  <span className="font-bold text-orange-300">{item.quebra}</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                  <span className="text-zinc-400">Espólio</span>
                  <span className="font-bold text-emerald-300">{item.loot}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}