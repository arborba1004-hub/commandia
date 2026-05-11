import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AttackNotificationOverlayProps {
  isVisible: boolean;
  attackerName: string;
  success: boolean;
  loot: number;
  critical: boolean;
  message: string;
  onClose: () => void;
}

export default function AttackNotificationOverlay({
  isVisible,
  attackerName,
  success,
  loot,
  critical,
  message,
  onClose,
}: AttackNotificationOverlayProps) {
  const [autoClose, setAutoClose] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setAutoClose(false);
      const timer = setTimeout(() => {
        setAutoClose(true);
        setTimeout(onClose, 500);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
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
            onClick={onClose}
          />

          {/* Card de notificação */}
          <motion.div
            className={`relative w-full max-w-md mx-4 p-8 rounded-lg border-2 ${
              success
                ? 'bg-red-950/90 border-red-500'
                : 'bg-yellow-950/90 border-yellow-500'
            } shadow-2xl`}
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
              {success ? '🔥 VOCÊ FOI ATACADO! 🔥' : '⚠️ TENTATIVA DE ATAQUE'}
            </h2>

            {/* Informações do atacante */}
            <div className="text-center mb-6">
              <p className="text-lg text-gray-200 mb-2">
                Atacante: <span className="font-bold text-red-300">{attackerName}</span>
              </p>
              <p className="text-base text-gray-300">{message}</p>
            </div>

            {/* Resultado do ataque */}
            {success && (
              <motion.div
                className="bg-black/40 rounded p-4 mb-6 border border-red-500/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-center">
                  {critical && (
                    <p className="text-2xl font-bold text-yellow-300 mb-2">
                      ⚡ GOLPE CRÍTICO! ⚡
                    </p>
                  )}
                  <p className="text-xl text-red-300">
                    Dinheiro Sujo Roubado: <span className="font-bold">${loot.toLocaleString()}</span>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Botão de fechar */}
            <motion.button
              onClick={onClose}
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
              animate={{ width: autoClose ? '0%' : '100%' }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
