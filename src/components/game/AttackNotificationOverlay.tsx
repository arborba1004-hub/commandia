import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '@/socket';

interface AttackNotification {
  id: string;
  attackerName: string;
  success: boolean;
  loot: number;
  critical: boolean;
  message: string;
}

export default function AttackNotificationOverlay() {
  const [notifications, setNotifications] = useState<AttackNotification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    let socket: ReturnType<typeof getSocket> | null = null;

    try {
      if (typeof window !== 'undefined') {
        socket = getSocket();
      }
    } catch (err) {
      console.error('❌ AttackNotificationOverlay: Erro ao obter socket:', err);
    }

    const handleAttackReceived = (data: any) => {
      const notification: AttackNotification = {
        id: `attack-${Date.now()}-${Math.random()}`,
        attackerName: data.attackerName || 'Desconhecido',
        success: data.success !== false,
        loot: data.loot || 0,
        critical: data.critical || false,
        message: data.message || 'Você foi atacado!',
      };

      setNotifications((prev) => [...prev, notification]);

      // Auto-remove após 5 segundos
      setTimeout(() => {
        removeNotification(notification.id);
      }, 5000);
    };

    if (socket) {
      socket.on('attackReceived', handleAttackReceived);
    }

    return () => {
      if (socket) {
        socket.off('attackReceived', handleAttackReceived);
      }
    };
  }, [removeNotification]);

  return (
    <AnimatePresence>
      {notifications.map((notification) => (
        <motion.div
          key={notification.id}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Fundo escuro */}
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => removeNotification(notification.id)}
          />

          {/* Card de notificação */}
          <motion.div
            className={`relative w-full max-w-md mx-4 p-8 rounded-lg border-2 ${
              notification.success
                ? 'bg-red-950/90 border-red-500'
                : 'bg-yellow-950/90 border-yellow-500'
            } shadow-2xl pointer-events-auto`}
            initial={{ scale: 0.5, opacity: 0, y: -50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Ícone de ataque */}
            <motion.div
              className="absolute -top-8 left-1/2 transform -translate-x-1/2"
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              <div className="text-5xl">⚔️</div>
            </motion.div>

            {/* Título */}
            <h2 className="text-center text-3xl font-bold text-white mt-4 mb-4">
              {notification.success ? '🔥 VOCÊ FOI ATACADO! 🔥' : '⚠️ TENTATIVA DE ATAQUE'}
            </h2>

            {/* Informações do atacante */}
            <div className="text-center mb-6">
              <p className="text-lg text-gray-200 mb-2">
                Atacante: <span className="font-bold text-red-300">{notification.attackerName}</span>
              </p>
              <p className="text-base text-gray-300">{notification.message}</p>
            </div>

            {/* Resultado do ataque */}
            {notification.success && (
              <motion.div
                className="bg-black/40 rounded p-4 mb-6 border border-red-500/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-center">
                  {notification.critical && (
                    <p className="text-2xl font-bold text-yellow-300 mb-2">
                      ⚡ GOLPE CRÍTICO! ⚡
                    </p>
                  )}
                  <p className="text-xl text-red-300">
                    Dinheiro Sujo Roubado: <span className="font-bold">${notification.loot.toLocaleString()}</span>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Botão de fechar */}
            <motion.button
              onClick={() => removeNotification(notification.id)}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Entendido
            </motion.button>

            {/* Barra de progresso de fechamento automático */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-red-500"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5 }}
            />
          </motion.div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
