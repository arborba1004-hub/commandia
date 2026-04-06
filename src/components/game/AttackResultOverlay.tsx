import { motion, AnimatePresence } from 'framer-motion';
import { useMapAttackStore } from '@/store/mapAttackStore';

export default function AttackResultOverlay() {
  const { resolution, phase, resetAttack } = useMapAttackStore();

  if (!resolution || phase !== 'finished') return null;

  const isWin = resolution.success;
  const isCritical = resolution.critical;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={`w-[90%] max-w-md p-6 rounded-2xl border ${
            isWin
              ? 'bg-green-900/20 border-green-500/40'
              : 'bg-red-900/20 border-red-500/40'
          }`}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
        >
          {/* TÍTULO */}
          <h2
            className={`text-2xl font-bold mb-2 ${
              isWin ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isWin ? 'DOMINOU O ALVO' : 'ATAQUE FALHOU'}
          </h2>

          {/* CRÍTICO */}
          {isCritical && (
            <p className="text-yellow-400 font-bold mb-2">
              ATAQUE CRÍTICO
            </p>
          )}

          {/* MENSAGEM */}
          <p className="text-sm text-gray-300 mb-4">
            {resolution.message}
          </p>

          {/* RESULTADO NUMÉRICO */}
          <div className="bg-black/40 border border-white/10 rounded p-4 mb-4">
            <p className="text-xs text-gray-400 mb-1">Resultado</p>
            <p
              className={`text-xl font-bold ${
                isWin ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {resolution.loot >= 0
                ? `+${resolution.loot.toLocaleString()}`
                : resolution.loot.toLocaleString()}
            </p>
          </div>

          {/* PODERES */}
          <div className="flex justify-between text-xs text-gray-400 mb-4">
            <span>Seu poder: {resolution.attackerPower}</span>
            <span>Defesa: {resolution.defenderPower}</span>
          </div>

          {/* BOTÃO */}
          <button
            onClick={resetAttack}
            className="w-full py-3 rounded bg-white text-black font-bold"
          >
            CONTINUAR
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}