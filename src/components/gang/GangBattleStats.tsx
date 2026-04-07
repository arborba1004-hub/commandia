// components/gang/GangBattleStats.tsx
import { useGangStore } from '@/store/gangStore';
import { useGangBattleStore } from '@/stores/gangBattleStore';
import { useMemo } from 'react';

export default function GangBattleStats() {
  const { myGang } = useGangStore();
  const { formation, getFormationBonus } = useGangBattleStore();
  const bonus = getFormationBonus(formation);

  const totalPower = useMemo(() => {
    if (!myGang) return 0;
    const activeMembers = myGang.members.filter(m => myGang.activeMemberIds.includes(m.id));
    return activeMembers.reduce((acc, m) => acc + (m.level * 10) + (m.rarity === 'Lendário' ? 50 : m.rarity === 'Mítico' ? 100 : 0), 0);
  }, [myGang]);

  const attackBonus = bonus.attackPercent;
  const defenseBonus = bonus.defensePercent;
  const lootBonus = bonus.lootPercent;

  return (
    <div className="bg-black/60 border border-white/10 rounded-2xl p-4 my-4">
      <h3 className="text-lg font-bold">⚔️ PODER DE BATALHA DA GANGUE</h3>
      <div className="text-3xl font-black text-primary">{totalPower.toLocaleString()}</div>
      <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
        <div>⚔️ Ataque: {attackBonus > 0 ? `+${attackBonus}%` : `${attackBonus}%`}</div>
        <div>🛡️ Defesa: {defenseBonus > 0 ? `+${defenseBonus}%` : `${defenseBonus}%`}</div>
        <div>💰 Saque: {lootBonus > 0 ? `+${lootBonus}%` : `+${lootBonus}%`}</div>
      </div>
    </div>
  );
}