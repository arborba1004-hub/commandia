import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { realtime } from 'wix-realtime-frontend';
import { usePlayerStore } from '@/store/playerStore';

interface NotificationState {
  visible: boolean;
  attackerName: string;
  loot: number;
  success: boolean;
}

export default function AttackNotification() {
  const [notification, setNotification] = useState<NotificationState>({
    visible: false,
    attackerName: '',
    loot: 0,
    success: false,
  });

  useEffect(() => {
    const playerState = usePlayerStore.getState().player;
    const currentPlayerId = playerState?.playerId || playerState?._id;

    if (!currentPlayerId) {
      console.warn('⚠️ Sem ID do jogador para se inscrever no canal de ataques');
      return;
    }

    const attackChannel = `attack_${currentPlayerId}`;
    let isMounted = true;

    try {
      const subscription = realtime.subscribe(attackChannel, (message: any) => {
        if (!isMounted) return;

        const {
          type,
          attackerId,
          attackerName,
          success,
          loot,
        } = message.data || message;

        if (type === 'attack' || type === 'ATTACK_RECEIVED') {
          // Mostrar notificação
          setNotification({
            visible: true,
            attackerName: attackerName || 'Atacante Desconhecido',
            loot: loot || 0,
            success: success || false,
          });

          // Auto-fechar após 3 segundos
          const timer = setTimeout(() => {
            if (isMounted) {
              setNotification((prev) => ({
                ...prev,
                visible: false,
              }));
            }
          }, 3000);

          return () => clearTimeout(timer);
        }
      });

      console.log(`📡 Inscrito no canal de ataques: ${attackChannel}`);
      return () => {
        isMounted = false;
        try {
          subscription.unsubscribe();
          console.log('📡 Desinscrito do canal de ataques');
        } catch (error) {
          console.warn('⚠️ Erro ao desinscrever do canal de ataques:', error);
        }
      };
    } catch (error) {
      console.warn('⚠️ Erro ao se inscrever no canal de ataques:', error);
    }
  }, []);

  return (
    <AnimatePresence>
      {notification.visible && (
        <motion.div
          className="fixed top-6 right-6 z-50"
          initial={{ opacity: 0, x: 400, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 400, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Card de notificação */}
          <div
            className={`rounded-lg border-2 p-4 shadow-2xl backdrop-blur-sm ${
              notification.success
                ? 'bg-red-950/95 border-red-500'
                : 'bg-yellow-950/95 border-yellow-500'
            }`}
          >
            {/* Conteúdo */}
            <div className="flex items-start gap-3">
              {/* Ícone de ataque */}
              <motion.div
                className="text-3xl flex-shrink-0"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                ⚔️
              </motion.div>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-1">
                  {notification.success ? '🔥 VOCÊ FOI ATACADO!' : '⚠️ TENTATIVA DE ATAQUE'}
                </h3>
                <p className="text-sm text-gray-200 mb-2">
                  Por: <span className="font-bold text-red-300">{notification.attackerName}</span>
                </p>

                {notification.success && notification.loot > 0 && (
                  <motion.p
                    className="text-sm font-bold text-red-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    💰 Roubou: ${notification.loot.toLocaleString()}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Barra de progresso de fechamento automático */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-b-lg"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
