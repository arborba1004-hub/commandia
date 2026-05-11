import { Activity, Shield, Swords, Users } from 'lucide-react';
import { useGangStore } from '@/store/gangStore';

export default function GangBattleStats() {
  const gang = useGangStore((state) => state.gang);
  const stats = useGangStore((state) => state.getBattleStats());

  const members = gang?.members || [];
  const ct = gang?.ct || {
    level: 1,
    trainingSlots: 1,
    recoveryBonusPercent: 0,
    trainingSpeedBonusPercent: 0,
    gangCapacityBonus: 0,
  };
  const dailyUpkeep = gang?.dailyUpkeep || {
    totalDirtyMoneyCost: 0,
  };
  const maxMembers = gang?.maxMembers || 0;

  const activeCount = members.filter((member) => member.status === 'ativo').length;
  const injuredCount = members.filter((member) => member.status === 'ferido').length;
  const deadCount = members.filter((member) => member.status === 'morto').length;
  const trainingCount = members.filter((member) => member.status === 'treinando').length;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-3xl border border-red-500/20 bg-black/50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Poder total
            </p>
            <p className="mt-2 text-3xl font-black text-red-300">
              {stats.totalPower.toLocaleString('pt-BR')}
            </p>
          </div>
          <Swords className="h-8 w-8 text-red-400" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl bg-black/30 p-3">
            <p className="text-zinc-500">Rajada</p>
            <p className="mt-1 font-black text-white">
              {stats.rajada.toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="rounded-2xl bg-black/30 p-3">
            <p className="text-zinc-500">Quebra</p>
            <p className="mt-1 font-black text-white">
              {stats.quebra.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-black/50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Defesa
            </p>
            <p className="mt-2 text-3xl font-black text-cyan-300">
              {stats.blindagem.toLocaleString('pt-BR')}
            </p>
          </div>
          <Shield className="h-8 w-8 text-cyan-400" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl bg-black/30 p-3">
            <p className="text-zinc-500">Blindagem</p>
            <p className="mt-1 font-black text-white">
              {stats.blindagem.toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="rounded-2xl bg-black/30 p-3">
            <p className="text-zinc-500">Fôlego</p>
            <p className="mt-1 font-black text-white">
              {stats.folego.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-amber-500/20 bg-black/50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Efetivo
            </p>
            <p className="mt-2 text-3xl font-black text-amber-200">
              {activeCount}
              <span className="text-lg text-zinc-500"> / {maxMembers}</span>
            </p>
          </div>
          <Users className="h-8 w-8 text-amber-400" />
        </div>

        <div className="mt-4 space-y-1 text-sm text-zinc-400">
          <p>
            Ativos: <span className="font-bold text-white">{stats.ativos}</span>
          </p>
          <p>
            Feridos: <span className="font-bold text-white">{stats.feridos}</span>
          </p>
          <p>
            Mortos: <span className="font-bold text-white">{stats.mortos}</span>
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-500/20 bg-black/50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              CT e manutenção
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-300">
              Nv. {ct.level}
            </p>
          </div>
          <Activity className="h-8 w-8 text-emerald-400" />
        </div>

        <div className="mt-4 space-y-1 text-sm text-zinc-400">
          <p>
            Slots de treino:{' '}
            <span className="font-bold text-white">{ct.trainingSlots}</span>
          </p>
          <p>
            Recuperação:{" "}
            <span className="font-bold text-white">
              +{ct.recoveryBonusPercent}%
            </span>
          </p>
          <p>
            Velocidade de treino:{' '}
            <span className="font-bold text-white">
              +{ct.trainingSpeedBonusPercent}%
            </span>
          </p>
          <p>
            Manutenção diária:{' '}
            <span className="font-bold text-emerald-300">
              {Number(dailyUpkeep.totalDirtyMoneyCost || 0).toLocaleString('pt-BR')}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}