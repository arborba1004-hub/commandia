/**
 * components/game/AttackIncomingToast.tsx
 * Notificação visual de ataque recebido — via socket (não polling).
 * Substitui: AttackNotification.tsx (legado — usava polling a cada 3s)
 *
 * Escuta o evento 'attackReceived' do socket.
 * Backend deve emitir: emitToPlayer(defenderId, 'attackReceived', payload)
 * logo após criar o registro de ataque no startBattle().
 *
 * Payload esperado do socket:
 *   { attackerName: string; loot?: number; critical?: boolean; message?: string }
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '@/socket';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═════════════════════════════════════════════════════════════════════════════

type AttackIncomingPayload = {
  attackerName: string;
  loot?:        number;
  critical?:    boolean;
  message?:     string;
};

type ToastEntry = AttackIncomingPayload & { id: string };

const AUTO_DISMISS_MS = 5000;

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═════════════════════════════════════════════════════════════════════════════

export default function AttackIncomingToast() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    let socket: ReturnType<typeof getSocket> | null = null;

    try {
      if (typeof window !== 'undefined') {
        socket = getSocket();
      }
    } catch {
      return;
    }

    if (!socket) return;

    function onAttackReceived(payload: AttackIncomingPayload) {
      const entry: ToastEntry = {
        ...payload,
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      };

      setToasts((prev) => [entry, ...prev].slice(0, 4));

      setTimeout(() => dismiss(entry.id), AUTO_DISMISS_MS);
    }

    socket.on('attackReceived', onAttackReceived);
    return () => { socket?.off('attackReceived', onAttackReceived); };
  }, [dismiss]);

  return (
    <div className="fixed left-1/2 top-6 z-[9000] -translate-x-1/2 flex flex-col gap-3 w-[360px] max-w-[calc(100vw-2rem)] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{    opacity: 0, y: -16,  scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="pointer-events-auto"
          >
            <div className="relative overflow-hidden rounded-2xl border border-red-500/40 bg-[#100404]/95 shadow-[0_0_32px_rgba(239,68,68,0.25)]">

              {/* Barra lateral vermelha */}
              <div className="absolute inset-y-0 left-0 w-1.5 bg-red-500" />

              <div className="flex items-start gap-3 px-5 py-4 pl-6">
                {/* Ícone de ataque animado */}
                <motion.div
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-xl"
                  animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.8 }}
                >
                  ⚔️
                </motion.div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-red-300">
                    {toast.critical ? '⚡ GOLPE CRÍTICO — ATAQUE SOFRIDO' : '🔴 ATAQUE SOFRIDO'}
                  </p>

                  <p className="mt-1 truncate text-sm font-bold text-white">
                    {toast.attackerName} está invadindo seu território
                  </p>

                  {toast.loot != null && toast.loot > 0 && (
                    <p className="mt-1 text-xs text-red-200">
                      Risco de perda: <span className="font-bold">R$ {toast.loot.toLocaleString('pt-BR')}</span>
                    </p>
                  )}

                  {toast.message && (
                    <p className="mt-1 line-clamp-1 text-xs text-zinc-400">
                      {toast.message}
                    </p>
                  )}
                </div>

                {/* Botão fechar */}
                <button
                  onClick={() => dismiss(toast.id)}
                  className="shrink-0 rounded-lg p-1 text-white/40 hover:text-white/80 transition-colors"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              {/* Barra de progresso auto-dismiss */}
              <motion.div
                className="h-0.5 w-full origin-left bg-red-500/60"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
