// src/components/game/AttackNotification.tsx
import { useEffect, useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { fetchAttackNotifications, markNotificationAsRead } from '@/api/notificationApi';

const POLLING_INTERVAL = 3000; // 3 segundos

export default function AttackNotification() {
  const [visible, setVisible] = useState(false);
  const [attacker, setAttacker] = useState('');
  const [loot, setLoot] = useState(0);
  const [lastSeenNotificationId, setLastSeenNotificationId] = useState<string | null>(null);
  const markNotificationAsReadLocal = usePlayerStore((state) => state.markNotificationAsRead);

  useEffect(() => {
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    let autoHideTimeout: ReturnType<typeof setTimeout> | null = null;

    const pollNotifications = async () => {
      try {
        const notifications = await fetchAttackNotifications();

        // Procura por notificações não lidas de ataque
        const unreadAttackNotification = notifications.find(
          (notif) =>
            notif.type === 'attack_received' &&
            !notif.read &&
            notif.id !== lastSeenNotificationId
        );

        if (unreadAttackNotification) {
          setLastSeenNotificationId(unreadAttackNotification.id);
          setAttacker(unreadAttackNotification.attackerName || 'Desconhecido');
          setLoot(unreadAttackNotification.loot || 0);
          setVisible(true);

          // Auto-hide após 3 segundos
          if (autoHideTimeout) clearTimeout(autoHideTimeout);
          autoHideTimeout = setTimeout(() => {
            setVisible(false);
          }, 3000);

          // Marca como lida no backend
          await markNotificationAsRead(unreadAttackNotification.id);

          // Atualiza no store local
          markNotificationAsReadLocal(unreadAttackNotification.id);
        }
      } catch (error) {
        console.error('Erro ao fazer polling de notificações:', error);
      }
    };

    pollingInterval = setInterval(pollNotifications, POLLING_INTERVAL);
    pollNotifications(); // Executa imediatamente na montagem

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
      if (autoHideTimeout) clearTimeout(autoHideTimeout);
    };
  }, [lastSeenNotificationId, markNotificationAsReadLocal]);

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
