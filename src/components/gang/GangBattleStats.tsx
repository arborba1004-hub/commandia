import { Shield, Swords, Users, Wallet } from 'lucide-react';
import { useGangStore } from '@/store/gangStore';
import { useGangBattleStore } from '@/stores/gangBattleStore';

export default function GangBattleStats() {
  const stats = useGangStore((state) => state.getBattleStats());
  const formation = useGangBattleStore((state) => state.formation);
  const gang = useGangStore((state) => state.myGang);

  const treasury = gang?.treasury || {
    dirtyMoney: 0,
    cleanMoney: 0,
    corre: 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <div className="rounded-3xl border border-red-500/20 bg-black/50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Poder da composição
            </p>
            <p className="mt-2 text-3xl font-black text-red-300">
              {stats.totalPower.toLocaleString('pt-BR')}
            </p>
          </div>
          <Swords className="h-8 w-8 text-red-400" />
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          Bônus de ataque: +{stats.attackBonusPercent}%
        </p>
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-black/50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Resistência
            </p>
            <p className="mt-2 text-3xl font-black text-cyan-300">
              +{stats.defenseBonusPercent}%
            </p>
          </div>
          <Shield className="h-8 w-8 text-cyan-400" />
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          Formação atual: <span className="capitalize">{formation}</span>
        </p>
      </div>

      <div className="rounded-3xl border border-amber-500/20 bg-black/50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Tropa ativa
            </p>
            <p className="mt-2 text-3xl font-black text-amber-200">
              {stats.activeCount}
              <span className="text-lg text-zinc-500"> / {stats.activeCount + stats.reserveCount}</span>
            </p>
          </div>
          <Users className="h-8 w-8 text-amber-400" />
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          Nível médio dos ativos: {stats.avgLevel}
        </p>
      </div>

      <div className="rounded-3xl border border-emerald-500/20 bg-black/50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Saque e tesouro
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-300">
              +{stats.lootBonusPercent}%
            </p>
          </div>
          <Wallet className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="mt-3 space-y-1 text-sm text-zinc-400">
          <p>Sujo: {Number(treasury.dirtyMoney || 0).toLocaleString('pt-BR')}</p>
          <p>Limpo: {Number(treasury.cleanMoney || 0).toLocaleString('pt-BR')}</p>
          <p>Corre: {Number(treasury.corre || 0).toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
}