import { motion, AnimatePresence } from 'framer-motion';
import { useMapAttackStore } from '@/store/mapAttackStore';

export default function AttackPreviewModal() {
  const {
    previewOpen,
    target,
    estimatedLoot,
    estimatedChance,
    closePreview,
    startAttack,
    origin,
  } = useMapAttackStore();

  if (!target || !origin) return null;

  return (
    <AnimatePresence>
      {previewOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md bg-[#0a0a0a] border border-red-500/30 rounded-t-2xl p-5"
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
          >
            {/* HEADER */}
            <div className="mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Alvo
              </p>
              <h2 className="text-xl font-bold text-white">
                {target.playerName}
              </h2>
            </div>

            {/* INFO */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-black/40 p-3 rounded border border-white/10">
                <p className="text-xs text-gray-400">Chance</p>
                <p className="text-lg font-bold text-yellow-400">
                  {(estimatedChance * 100).toFixed(0)}%
                </p>
              </div>

              <div className="bg-black/40 p-3 rounded border border-white/10">
                <p className="text-xs text-gray-400">Possível saque</p>
                <p className="text-lg font-bold text-green-400">
                  ${estimatedLoot.toLocaleString()}
                </p>
              </div>
            </div>

            {/* AÇÕES */}
            <div className="flex gap-3">
              <button
                onClick={closePreview}
                className="flex-1 py-3 rounded bg-gray-700 text-white font-bold"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  startAttack({
                    origin,
                    target,
                    routeToTarget: [], // será preenchido no GamePage
                  });
                }}
                className="flex-1 py-3 rounded bg-red-600 hover:bg-red-500 text-white font-bold"
              >
                ATACAR
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}