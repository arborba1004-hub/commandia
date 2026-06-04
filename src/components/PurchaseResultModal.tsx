import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface PurchaseResultModalProps {
  isOpen: boolean;
  error: 'insufficient' | 'duplicate' | null;
  itemName?: string;
  skillBonus?: number;
  skillType?: string;
  skillBonusPercent?: number;
  onClose: () => void;
}

export default function PurchaseResultModal({
  isOpen,
  error,
  itemName,
  skillBonus,
  skillType,
  skillBonusPercent,
  onClose,
}: PurchaseResultModalProps) {
  const success = error === null;
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <motion.div
            className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-primary/30 bg-gradient-to-br from-white/10 to-white/5 p-5 text-center shadow-2xl sm:mx-4 sm:rounded-lg sm:p-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            {/* Icon */}
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              {success ? (
                <CheckCircle size={80} className="text-green-500" />
              ) : (
                <AlertCircle size={80} className="text-red-500" />
              )}
            </motion.div>

            {/* Title */}
            <h2 className="text-3xl font-heading mb-4">
              {success ? (
                <span className="text-green-500">Compra Concluída!</span>
              ) : error === 'insufficient' ? (
                <span className="text-red-500">Saldo Insuficiente</span>
              ) : (
                <span className="text-red-500">Item Já Comprado</span>
              )}
            </h2>

            {/* Success Message */}
            {success && (
              <motion.div
                className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-white/80 font-paragraph mb-3">
                  Você adquiriu <span className="text-primary font-heading">{itemName}</span>
                </p>
                <p className="text-white/70 font-paragraph text-sm">
                  Bônus: <span className="text-green-400">+{skillBonusPercent || skillBonus}% {skillType}</span>
                </p>
              </motion.div>
            )}

            {/* Error Message */}
            {!success && (
              <motion.div
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {error === 'insufficient' ? (
                  <p className="text-white/80 font-paragraph">
                    Você não possui Clean Money suficiente para esta compra.
                  </p>
                ) : (
                  <p className="text-white/80 font-paragraph">
                    Você já possui este item neste nível. Não é possível comprar duplicatas.
                  </p>
                )}
              </motion.div>
            )}

            {/* Close Button */}
            <motion.button
              onClick={onClose}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-black font-heading rounded-lg transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Fechar
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
