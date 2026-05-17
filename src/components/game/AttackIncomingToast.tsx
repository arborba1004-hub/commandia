/**
 * components/game/AttackIncomingToast.tsx
 * Notificação visual de ataques — via socket (sem polling).
 *
 * Escuta DOIS eventos do socket:
 *   - 'attackIncoming'  → backend emitiu no startBattle (marcha começou, AINDA não resolveu)
 *                          Mostra: "X está marchando. Chega em Y min"
 *   - 'attackReceived'  → backend emitiu no resolveBattle (resultado final)
 *                          Mostra: "X invadiu! Perda: Y"
 *
 * Cada evento gera um toast separado, com cor diferente.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '@/socket';

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═════════════════════════════════════════════════════════════════════════════

type AttackIncomingPayload = {
  attackerName:     string;
  attackerFaction?: string | null;
  memberCount?:     number;
  arriveAtIso?:     string;
  totalDurationMs?: number;
  message?:         string;
};

type AttackReceivedPayload = {
  attackerName: string;
  loot?:        number;
  critical?:    boolean;
  message?:     string;
};

type ToastKind = 'incoming' | 'received';

type ToastEntry = {
  id:           string;
  kind:         ToastKind;
  attackerName: string;
  message:      string;
  arriveAtIso?: string;
  memberCount?: number;
  loot?:        number;
  critical?:    boolean;
};

const AUTO_DISMISS_MS = 6000;
const MAX_TOASTS      = 4;

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
      socket = getSocket();
    } catch {
      return;
    }
    if (!socket) return;

    function onAttackIncoming(payload: AttackIncomingPayload) {
      const entry: ToastEntry = {
        id:           `inc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        kind:         'incoming',
        attackerName: String(payload.attackerName || 'Desconhecido'),
        message:      payload.message || `${payload.attackerName} está marchando para o seu território`,
        arriveAtIso:  payload.arriveAtIso,
        memberCount:  payload.memberCount,
      };
      setToasts((prev) => [entry, ...prev].slice(0, MAX_TOASTS));
      setTimeout(() => dismiss(entry.id), AUTO_DISMISS_MS);
    }

    function onAttackReceived(payload: AttackReceivedPayload) {
      const entry: ToastEntry = {
        id:           `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        kind:         'received',
        attackerName: String(payload.attackerName || 'Desconhecido'),
        message:      payload.message || `${payload.attackerName} atacou seu território`,
        loot:         payload.loot,
        critical:     payload.critical,
      };
      setToasts((prev) => [entry, ...prev].slice(0, MAX_TOASTS));
      setTimeout(() => dismiss(entry.id), AUTO_DISMISS_MS);
    }

    socket.on('attackIncoming', onAttackIncoming);
    socket.on('attackReceived', onAttackReceived);
    return () => {
      socket?.off('attackIncoming', onAttackIncoming);
      socket?.off('attackReceived', onAttackReceived);
    };
  }, [dismiss]);

  function formatRelativeETA(iso?: string): string {
    if (!iso) return '';
    const ms = new Date(iso).getTime() - Date.now();
    if (ms <= 0) return 'agora';
    const sec = Math.ceil(ms / 1000);
    const min = Math.floor(sec / 60);
    const remSec = sec % 60;
    if (min === 0) return `em ${sec}s`;
    return `em ${min}m ${remSec.toString().padStart(2, '0')}s`;
  }

  return (
    <div className="fixed left-1/2 top-6 z-[9000] -translate-x-1/2 flex flex-col gap-3 w-[360px] max-w-[calc(100vw-2rem)] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isIncoming = toast.kind === 'incoming';
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -28, scale: 0.94 }}
              animate={{ opacity: 1, y: 0,   scale: 1    }}
              exit={{    opacity: 0, y: -16,  scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="pointer-events-auto"
            >
              <div className={`relative overflow-hidden rounded-2xl border ${
                isIncoming
                  ? 'border-amber-500/40 bg-[#100804]/95 shadow-[0_0_32px_rgba(245,158,11,0.25)]'
                  : 'border-red-500/40 bg-[#100404]/95 shadow-[0_0_32px_rgba(239,68,68,0.25)]'
              }`}>
                {/* Barra lateral */}
                <div className={`absolute inset-y-0 left-0 w-1.5 ${
                  isIncoming ? 'bg-amber-500' : 'bg-red-500'
                }`} />

                <div className="flex items-start gap-3 px-5 py-4 pl-6">
                  {/* Ícone animado */}
                  <motion.div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${
                      isIncoming ? 'bg-amber-500/15' : 'bg-red-500/15'
                    }`}
                    animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.8 }}
                  >
                    {isIncoming ? '🚨' : '⚔️'}
                  </motion.div>

                  <div className="min-w-0 flex-1">
                    <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${
                      isIncoming ? 'text-amber-300' : 'text-red-300'
                    }`}>
                      {isIncoming ? 'Marcha detectada' : 'Ataque recebido'}
                    </p>
                    <p className="mt-1 text-sm font-bold text-white truncate">
                      {toast.attackerName}
                    </p>
                    <p className="mt-1 text-xs text-zinc-300">
                      {toast.message}
                    </p>
                    {isIncoming && toast.arriveAtIso && (
                      <p className="mt-1 text-xs font-bold text-amber-200">
                        Chega {formatRelativeETA(toast.arriveAtIso)}
                        {typeof toast.memberCount === 'number' && (
                          <> · {toast.memberCount} membros</>
                        )}
                      </p>
                    )}
                    {!isIncoming && typeof toast.loot === 'number' && toast.loot > 0 && (
                      <p className="mt-1 text-xs font-bold text-red-200">
                        Perda: ${toast.loot.toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => dismiss(toast.id)}
                    className="text-zinc-500 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
