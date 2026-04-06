import { motion, AnimatePresence } from 'framer-motion';
import { useMapAttackStore } from '@/store/mapAttackStore';

export default function AttackResultOverlay() {
  const { resolution, phase, target, origin, resetAttack } = useMapAttackStore();

  if (!resolution || phase !== 'finished') return null;

  const isWin = resolution.success;
  const isCritical = resolution.critical;
  const spoils = resolution.spoils;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${
            isWin
              ? 'border-green-500/40 bg-green-950/30'
              : 'border-red-500/40 bg-red-950/30'
          }`}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
        >
          <h2
            className={`mb-2 text-3xl font-black ${
              isWin ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isWin ? 'VOCÊ VENCEU' : 'VOCÊ PERDEU'}
          </h2>

          {isCritical && (
            <p className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-yellow-400">
              Ataque crítico
            </p>
          )}

          <p className="mb-5 text-sm text-gray-200">{resolution.message}</p>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <p className="mb-1 text-[11px] uppercase tracking-wider text-gray-400">
                Atacante
              </p>
              <p className="font-black text-white">{origin?.playerName || 'Você'}</p>
              <p className="mt-2 text-xs text-gray-400">Poder</p>
              <p className="text-xl font-black text-white">{resolution.attackerPower}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <p className="mb-1 text-[11px] uppercase tracking-wider text-gray-400">
                Defensor
              </p>
              <p className="font-black text-white">{target?.playerName || 'Alvo'}</p>
              <p className="mt-2 text-xs text-gray-400">Defesa</p>
              <p className="text-xl font-black text-white">{resolution.defenderPower}</p>
            </div>
          </div>

          <div className="mb-5 rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="mb-3 text-[11px] uppercase tracking-wider text-gray-400">
              Espólios
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-xs text-gray-400">Dinheiro sujo</p>
                <p className="text-xl font-black text-green-400">
                  +{spoils.dirtyMoneyLoot.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-xs text-gray-400">Corre</p>
                <p className="text-xl font-black text-cyan-300">
                  +{spoils.correLoot.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-xs text-gray-400">Prestígio</p>
                <p className="text-xl font-black text-yellow-300">
                  +{spoils.prestigeLoot.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-xs text-gray-400">Total ganho</p>
                <p className="text-xl font-black text-white">
                  +{resolution.loot.toLocaleString()}
                </p>
              </div>
            </div>

            {spoils.brokenLuxuryItemId && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-950/20 p-3">
                <p className="text-xs font-black uppercase tracking-wider text-red-300">
                  Item de luxo quebrado
                </p>
                <p className="mt-1 font-bold text-white">
                  {spoils.brokenLuxuryItemName}
                </p>
                <p className="mt-2 text-sm text-gray-300">
                  Valor convertido em dinheiro sujo:
                  <span className="ml-2 font-black text-green-400">
                    +{spoils.luxuryConvertedDirtyMoney.toLocaleString()}
                  </span>
                </p>
              </div>
            )}
          </div>

          <button
            onClick={resetAttack}
            className="w-full rounded-2xl bg-white px-4 py-4 font-black text-black"
          >
            CONTINUAR
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}