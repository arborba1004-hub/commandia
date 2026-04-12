import { Shield, Swords, Ghost } from 'lucide-react';
import { useGangBattleStore, type FormationType } from '@/stores/gangBattleStore';

const FORMATIONS: Array<{
  id: FormationType;
  title: string;
  description: string;
  attack: string;
  defense: string;
  loot: string;
  Icon: typeof Swords;
}> = [
  {
    id: 'offensive',
    title: 'Formação Ofensiva',
    description: 'Mais pressão de dano e entrada agressiva.',
    attack: '+20%',
    defense: '-10%',
    loot: '+0%',
    Icon: Swords,
  },
  {
    id: 'defensive',
    title: 'Formação Defensiva',
    description: 'Mais sustentação e resistência da linha.',
    attack: '-8%',
    defense: '+25%',
    loot: '+0%',
    Icon: Shield,
  },
  {
    id: 'stealth',
    title: 'Formação Furtiva',
    description: 'Entrada silenciosa focada em saque e infiltração.',
    attack: '+0%',
    defense: '+0%',
    loot: '+30%',
    Icon: Ghost,
  },
];

export default function GangFormationSelector() {
  const formation = useGangBattleStore((state) => state.formation);
  const setFormation = useGangBattleStore((state) => state.setFormation);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/50 p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">
          Formação da Gangue
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          A formação influencia ataque, defesa e espólio da composição ativa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FORMATIONS.map((item) => {
          const selected = formation === item.id;
          const Icon = item.Icon;

          return (
            <button
              key={item.id}
              onClick={() => setFormation(item.id)}
              className={`rounded-3xl border p-5 text-left transition-all ${
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
                    {selected ? 'Ativa' : 'Selecionar'}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                {item.description}
              </p>

              <div className="mt-5 space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                  <span className="text-zinc-400">Ataque</span>
                  <span className="font-bold text-red-300">{item.attack}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                  <span className="text-zinc-400">Defesa</span>
                  <span className="font-bold text-cyan-300">{item.defense}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
                  <span className="text-zinc-400">Saque</span>
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