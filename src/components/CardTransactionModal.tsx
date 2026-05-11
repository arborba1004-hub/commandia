import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/store/playerStore';
import { useEffect, useState, useCallback } from 'react';

type TransactionStatus = 'idle' | 'processing' | 'success' | 'error';

interface CardTransactionModalProps {
  isOpen: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function CardTransactionModal({
  isOpen,
  isProcessing,
  onClose,
  onConfirm,
}: CardTransactionModalProps) {
  const player = usePlayerStore((state) => state.player);
  const [showSuccess, setShowSuccess] = useState(false);

  const getStatus = (): TransactionStatus => {
    if (showSuccess) return 'success';
    if (isProcessing) return 'processing';
    return 'idle';
  };

  const status = getStatus();

  // Fechar modal automaticamente após sucesso
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, onClose]);

  // Resetar estado quando modal fecha
  useEffect(() => {
    if (!isOpen) {
      setShowSuccess(false);
    }
  }, [isOpen]);

  const handleCardTap = useCallback(() => {
    if (status === 'idle' && !isProcessing) {
      onConfirm();

      // Mostrar sucesso após um tempo (simulando processamento)
      setTimeout(() => {
        setShowSuccess(true);
      }, 2500);
    }
  }, [status, isProcessing, onConfirm]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* MAQUININHA */}
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="relative w-[320px] h-[420px] bg-[#111] rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-start pt-6"
          >
            {/* TELA */}
            <div className="w-[85%] h-[140px] bg-black rounded-xl border border-white/10 flex items-center justify-center text-center px-4">
              <p className="text-white text-sm tracking-widest">
                {status === 'idle' && 'APROXIME O CARTÃO'}
                {status === 'processing' && 'PROCESSANDO...'}
                {status === 'success' && 'TRANSAÇÃO APROVADA'}
                {status === 'error' && 'SALDO INSUFICIENTE'}
              </p>
            </div>

            {/* SLOT DO CARTÃO */}
            <div className="mt-8 w-[70%] h-[10px] bg-black rounded-full border border-white/10" />

            {/* CARTÃO */}
            <motion.div
              initial={{ y: -120, opacity: 0, rotate: -8 }}
              animate={
                status === 'processing' || status === 'success' || status === 'error'
                  ? { y: 40, opacity: 1, rotate: 0 }
                  : { y: -120, opacity: 0 }
              }
              transition={{ duration: 0.5, ease: 'easeOut' }}
              onClick={handleCardTap}
              className="absolute top-[90px] w-[240px] h-[140px] rounded-2xl bg-gradient-to-br from-neutral-800 via-neutral-700 to-black shadow-[0_0_25px_rgba(255,255,255,0.15)] flex flex-col justify-between p-4 cursor-pointer hover:shadow-[0_0_35px_rgba(255,0,127,0.3)] transition-shadow active:scale-[0.97]"
            >
              {/* CHIP */}
              <div className="w-10 h-7 bg-yellow-500 rounded-sm" />

              {/* NOME PLAYER */}
              <div className="text-white text-sm tracking-widest uppercase">
                {player?.name || 'PLAYER'}
              </div>
            </motion.div>

            {/* LUZ DE FEEDBACK */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={
                status === 'success'
                  ? { opacity: 1, scale: 1 }
                  : status === 'error'
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0 }
              }
              transition={{ duration: 0.3 }}
              className={`absolute bottom-6 w-6 h-6 rounded-full ${
                status === 'success'
                  ? 'bg-green-500 shadow-[0_0_15px_rgba(0,255,120,0.8)]'
                  : status === 'error'
                  ? 'bg-red-500 shadow-[0_0_15px_rgba(255,0,0,0.8)]'
                  : ''
              }`}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}