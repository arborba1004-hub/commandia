import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard } from 'lucide-react';

interface CardTransactionModalProps {
  isOpen: boolean;
  isProcessing: boolean;
  onClose: () => void;
}

export default function CardTransactionModal({
  isOpen,
  isProcessing,
  onClose,
}: CardTransactionModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <motion.div
            className="relative w-full max-w-md mx-4 bg-gradient-to-br from-white/10 to-white/5 border border-primary/30 rounded-lg p-8 shadow-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-heading text-primary mb-2">
                Transação de Cartão
              </h2>
              <p className="text-white/70 font-paragraph">
                Aproxime seu cartão para continuar
              </p>
            </div>

            {/* Card Animation */}
            <div className="flex justify-center mb-12">
              <motion.div
                className="relative w-64 h-40 bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary rounded-xl flex items-center justify-center"
                animate={{
                  y: isProcessing ? [0, -10, 0] : 0,
                }}
                transition={{
                  duration: 1.5,
                  repeat: isProcessing ? Infinity : 0,
                }}
              >
                <motion.div
                  animate={{
                    scale: isProcessing ? [1, 1.1, 1] : 1,
                    opacity: isProcessing ? [0.5, 1, 0.5] : 1,
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: isProcessing ? Infinity : 0,
                  }}
                >
                  <CreditCard size={64} className="text-primary" />
                </motion.div>
              </motion.div>
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex justify-center mb-8">
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-primary rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{
                        duration: 0.8,
                        delay: i * 0.2,
                        repeat: Infinity,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Status Text */}
            <div className="text-center">
              <p className="text-white/80 font-paragraph">
                {isProcessing ? 'Processando transação...' : 'Aguardando cartão...'}
              </p>
            </div>

            {/* Cancel Button */}
            {!isProcessing && (
              <motion.button
                onClick={onClose}
                className="mt-8 w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-heading transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancelar
              </motion.button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
