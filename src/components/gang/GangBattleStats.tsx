import { useMemo } from 'react';
import { Shield, Sword, Coins, Users } from 'lucide-react';
import { useGangStore } from '@/store/gangStore';
import { useGangBattleStore } from '@/stores/gangBattleStore';

export default function GangBattleStats() {
  const myGang = useGangStore((state) => state.myGang);
  const getBattleSnapshot = useGangStore((state) => state.getBattleSnapshot);
  const formation = useGangBattleStore((state) => state.formation);
  const getFormationBonus = useGangBattleStore((state) => state.getFormationBonus);

  const snapshot = useMemo(() => getBattleSnapshot(), [getBattleSnapshot, myGang]);
  const bonus = getFormationBonus(formation);

  return (
    <div className="bg-black/60 border border-white/10 rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">⚔️ PODER TÁTICO DA GANGUE</h3>
          <p className="text-sm text-zinc-400 mt-1">
            Formação atual: <span className="text-white font-bold uppercase">{formation}</span>
          </p>
        </div>

        <div className="rounded-full bg-primary/10 border border-primary/30 px-4 py-2">
          <span className="text-sm text-zinc-400">Poder total</span>
          <div className="text-2xl font-black text-primary">
            {snapshot.totalPower.toLocaleString('pt-BR')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="flex items-center gap-2 text-zinc-300 text-sm">
            <Users size={16} />
            Ativos
          </div>
          <div className="mt-1 text-xl font-black">{snapshot.activeMembers.length}</div>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="flex items-center gap-2 text-zinc-300 text-sm">
            <Sword size={16} />
            Ataque
          </div>
          <div className="mt-1 text-xl font-black">{snapshot.attackPower.toLocaleString('pt-BR')}</div>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="flex items-center gap-2 text-zinc-300 text-sm">
            <Shield size={16} />
            Defesa
          </div>
          <div className="mt-1 text-xl font-black">{snapshot.defensePower.toLocaleString('pt-BR')}</div>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="flex items-center gap-2 text-zinc-300 text-sm">
            <Coins size={16} />
            Saque
          </div>
          <div className="mt-1 text-xl font-black">{snapshot.lootPower.toLocaleString('pt-BR')}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-sm text-zinc-300">
        <div>⚔️ Ataque: {bonus.attackPercent > 0 ? `+${bonus.attackPercent}` : bonus.attackPercent}%</div>
        <div>🛡️ Defesa: {bonus.defensePercent > 0 ? `+${bonus.defensePercent}` : bonus.defensePercent}%</div>
        <div>💰 Saque: {bonus.lootPercent > 0 ? `+${bonus.lootPercent}` : bonus.lootPercent}%</div>
      </div>
    </div>
  );
}