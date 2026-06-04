import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  playerName?: string;
  collectionName?: string;
  onClose: () => void;
  onViewCollection: () => void;
}

export default function LuxuryNPCDialog({
  isOpen,
  playerName,
  collectionName,
  onClose,
  onViewCollection,
}: Props) {
  const message = `Bem-vindo, ${playerName || 'COMANDANTE'}. A coleção ${collectionName || 'Luxury'} já está separada pra você. Aqui não se compra só peça. Aqui se compra presença.`;
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 120, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="max-h-[80dvh] w-full max-w-[700px] overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0a0a0a] p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] sm:p-6"
          >
            <h2 className="text-lg font-black uppercase tracking-widest text-white">
              Atendimento Privado
            </h2>

            <p className="mt-3 text-sm text-white/80 leading-relaxed">
              {message}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onViewCollection}
                className="flex-1 rounded-xl bg-white text-black py-3 font-black uppercase tracking-widest"
              >
                Ver coleção
              </button>

              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/20 text-white py-3 font-black uppercase tracking-widest"
              >
                Depois
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
