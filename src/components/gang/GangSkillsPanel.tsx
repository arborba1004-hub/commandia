import { useMemo } from 'react';
import { useGangStore } from '@/store/gangStore';
import {
  GANG_DOCTRINE_DEFINITIONS,
  type GangSkillKey,
} from '@/types/gang';

function getUpgradeCost(level: number) {
  return Math.floor(2500 * Math.pow(1.18, Math.max(0, level - 1)));
}

export default function GangSkillsPanel() {
  const gang = useGangStore((state) => state.myGang);
  const upgradeGangSkill = useGangStore((state) => state.upgradeGangSkill);
  const isLoading = useGangStore((state) => state.isLoading);

  const dirtyTreasury = Number(gang?.treasury?.dirtyMoney || 0);
  const doctrine = gang?.doctrine;

  const entries = useMemo(() => {
    return GANG_DOCTRINE_DEFINITIONS.map((item) => {
      const level = doctrine?.[item.key] || 1;
      const cost = getUpgradeCost(level);
      const canUpgrade = dirtyTreasury >= cost;

      return {
        ...item,
        level,
        cost,
        canUpgrade,
      };
    });
  }, [doctrine, dirtyTreasury]);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/50 p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">
          Doutrina da Gangue
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Evolua a doutrina para melhorar ataque, defesa, fuga, saque e disciplina
          tática da composição.
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-zinc-300">
        Tesouro sujo disponível:{' '}
        <span className="font-black text-emerald-300">
          {dirtyTreasury.toLocaleString('pt-BR')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map((entry) => (
          <div
            key={entry.key}
            className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">{entry.name}</h3>
                <p className="mt-1 text-sm text-zinc-400">{entry.description}</p>
              </div>
              <div className="rounded-2xl bg-primary/10 px-3 py-2 text-sm font-black text-primary">
                Lv. {entry.level}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-black/40 px-3 py-2">
                <div className="text-zinc-500">Custo</div>
                <div className="font-bold text-amber-300">
                  {entry.cost.toLocaleString('pt-BR')}
                </div>
              </div>
              <div className="rounded-xl bg-black/40 px-3 py-2">
                <div className="text-zinc-500">Chave</div>
                <div className="font-bold text-cyan-300 capitalize">{entry.key}</div>
              </div>
            </div>

            <button
              onClick={() => void upgradeGangSkill(entry.key as GangSkillKey)}
              disabled={isLoading || !entry.canUpgrade}
              className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-black transition-all ${
                entry.canUpgrade
                  ? 'bg-primary text-black hover:opacity-90'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {entry.canUpgrade ? 'Evoluir Doutrina' : 'Tesouro insuficiente'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}