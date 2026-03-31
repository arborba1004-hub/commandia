import { motion } from 'framer-motion';

interface LuxuryDialogFrameProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LuxuryDialogFrame({ onConfirm, onCancel }: LuxuryDialogFrameProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    >
      <div className="bg-black/90 border border-yellow-500/30 rounded-xl p-8 max-w-md text-center">
        <h2 className="text-2xl font-bold text-yellow-300 mb-4">Confirmar Compra</h2>
        <p className="text-white mb-6">Deseja prosseguir com essa transação?</p>
        
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 transition"
          >
            Confirmar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
