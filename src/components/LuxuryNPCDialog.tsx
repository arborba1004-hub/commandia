import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onViewCollection: () => void;
  title: string;
  message: string;
}

export default function LuxuryNPCDialog({
  isOpen,
  onClose,
  onViewCollection,
  title,
  message,
}: Props) {
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
            className="w-full max-w-[700px] rounded-t-[28px] bg-[#0a0a0a] border border-white/10 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.6)]"
          >
            <h2 className="text-lg font-black uppercase tracking-widest text-white">
              {title}
            </h2>

            <p className="mt-3 text-sm text-white/80 leading-relaxed">
              {message}
            </p>

            <div className="mt-6 flex gap-3">
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
