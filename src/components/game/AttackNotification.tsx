// src/components/game/AttackNotification.tsx
import { useEffect, useState } from 'react';
import { realtime } from 'wix-realtime-frontend';
import { usePlayerStore } from '@/store/playerStore';

export default function AttackNotification() {
  const [visible, setVisible] = useState(false);
  const [attacker, setAttacker] = useState('');
  const [loot, setLoot] = useState(0);

  useEffect(() => {
    let unsubscribe: any = null;
    const playerId = usePlayerStore.getState().player?._id;
    if (!playerId) return;

    realtime.subscribe(`attack_${playerId}`, (msg: any) => {
      if (msg.type === 'attack') {
        setAttacker(msg.attackerName);
        setLoot(msg.loot || 0);
        setVisible(true);
        setTimeout(() => setVisible(false), 3000);
      }
    }).then(sub => { unsubscribe = sub.unsubscribe; });
    return () => unsubscribe?.();
  }, []);

  if (!visible) return null;
  return (
    <div className="fixed top-5 right-5 bg-red-600 text-white px-5 py-3 rounded-xl shadow-2xl z-[1000] flex items-center gap-3">
      <span>⚔️</span>
      <div>
        <p className="font-bold">ATAQUE RECEBIDO!</p>
        <p>{attacker} te atacou! Perdeu R$ {loot}</p>
      </div>
    </div>
  );
}
