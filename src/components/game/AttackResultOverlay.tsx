import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapAttackStore } from '@/store/mapAttackStore';

export default function AttackResultOverlay() {
  const resolution = useMapAttackStore((state) => state.resolution);
  const target = useMapAttackStore((state) => state.target);
  const phase = useMapAttackStore((state) => state.phase);
  const resetAttack = useMapAttackStore((state) => state.resetAttack);

  const isVisible = Boolean(
    resolution && (phase === 'resolving' || phase === 'finished' || phase === 'returning')
  );

  useEffect(() => {
    if (!isVisible) return;

    const timer = window.setTimeout(() => {
      resetAttack();
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [isVisible, resetAttack]);

  if (!resolution) return null;

  const attackerName = target?.playerName || 'Alvo';
  const success = Boolean(resolution.success);
  const loot = Number(resolution.loot || 0);
  const critical = Boolean(resolution.critical);
  const message = String(
    resolution.message ||
      (success ? 'Ataque concluído com sucesso.' : 'O ataque falhou.')
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="pointer-events-none fixed right-4 top-24 z-[90] w-[320px] max-w-[calc(100vw-2rem)]"
          initial={{ opacity: 0, x: 40, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.96 }}
          transition={{ duration: 0.22 }}
        >
          <motion.div
            className={`relative overflow-hidden rounded-2xl border shadow-2xl ${
              success
                ? 'border-red-500/40 bg-[#140909]/95'
                : 'border-amber-500/40 bg-[#161008]/95'
            }`}
            animate={{
              boxShadow: success
                ? [
                    '0 0 0 rgba(239,68,68,0)',
                    '0 0 24px rgba(239,68,68,0.35)',
                    '0 0 0 rgba(239,68,68,0)',
                  ]
                : [
                    '0 0 0 rgba(245,158,11,0)',
                    '0 0 24px rgba(245,158,11,0.28)',
                    '0 0 0 rgba(245,158,11,0)',
                  ],
            }}
            transition={{ duration: 0.9, repeat: Infinity }}
          >
            <div
              className={`absolute inset-y-0 left-0 w-1.5 ${
                success ? 'bg-red-500' : 'bg-amber-400'
              }`}
            />

            <div className="p-4 pl-5">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black ${
                    success
                      ? 'bg-red-500/15 text-red-300'
                      : 'bg-amber-500/15 text-amber-300'
                  }`}
                >
                  {success ? '⚠️' : '🛡️'}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-[11px] font-black uppercase tracking-[0.2em] ${
                        success ? 'text-red-300' : 'text-amber-300'
                      }`}
                    >
                      {success ? 'Ataque sofrido' : 'Ataque repelido'}
                    </p>

                    {critical && (
                      <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-yellow-300">
                        Crítico
                      </span>
                    )}
                  </div>

                  <p className="mt-1 truncate text-sm font-bold text-white">
                    {attackerName}
                  </p>

                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-300">
                    {message}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Impacto</span>
                    <span
                      className={`font-black ${
                        success ? 'text-red-200' : 'text-emerald-300'
                      }`}
                    >
                      {success
                        ? `R$ ${loot.toLocaleString('pt-BR')}`
                        : 'Sem perda confirmada'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              className={`h-1 w-full origin-left ${
                success ? 'bg-red-500' : 'bg-amber-400'
              }`}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 3.5, ease: 'linear' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}