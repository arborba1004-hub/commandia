import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';

interface DirtyMoneyVaultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  playerDirtyMoney: number;
  onConfirm: () => void;
  isProcessing: boolean;
  title?: string;
  confirmLabel?: string;
  insufficientTitle?: string;
  insufficientMessage?: string;
  imageUrl?: string;
}

export default function DirtyMoneyVaultModal({
  open,
  onOpenChange,
  amount,
  playerDirtyMoney,
  onConfirm,
  isProcessing,
  title = 'Pagamento em Dinheiro Sujo',
  confirmLabel = 'Confirmar Pagamento',
  insufficientTitle = 'COFRE VAZIO',
  insufficientMessage = 'Você não tem dinheiro sujo suficiente para concluir esta operação.',
  imageUrl = 'https://static.wixstatic.com/media/50f4bf_5868d04681cb49d1a58d89dc4493574f~mv2.png',
}: DirtyMoneyVaultModalProps) {
  const [doorOpen, setDoorOpen] = useState(false);

  const dirtyMoney = Number(playerDirtyMoney || 0);
  const requiredMoney = Number(amount || 0);
  const hasSufficientFunds = dirtyMoney >= requiredMoney;

  useEffect(() => {
    if (open) {
      setDoorOpen(false);
      const timer = setTimeout(() => setDoorOpen(true), 350);
      return () => clearTimeout(timer);
    }

    setDoorOpen(false);
  }, [open]);

  const handleConfirm = useCallback(() => {
    if (!isProcessing && hasSufficientFunds) {
      onConfirm();
    }
  }, [isProcessing, hasSufficientFunds, onConfirm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-transparent border-none shadow-none max-w-3xl h-[600px] p-0 overflow-hidden">
        <div className="w-full h-full flex flex-col items-center justify-center relative [perspective:1500px]">
          <div className="relative w-full h-full bg-gradient-to-b from-gray-800 to-gray-950 overflow-hidden rounded-3xl border-8 border-green-900 shadow-[0_0_80px_rgba(0,0,0,0.7)]">
            {/* FUNDO INTERNO DO COFRE */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black z-0">
              {hasSufficientFunds ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={doorOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
                  transition={{ delay: 0.55, duration: 0.6 }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={imageUrl}
                    alt="Dinheiro sujo"
                    width={900}
                    height={900}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.35)_65%,rgba(0,0,0,0.65)_100%)]" />

                  <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center z-10">
                    <p className="font-heading text-2xl text-green-400 drop-shadow-[0_0_20px_rgba(0,255,80,0.5)]">
                      {title}
                    </p>
                  </div>

                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center z-10 bg-black/50 px-6 py-3 rounded-2xl border border-green-500/30">
                    <p className="text-green-400 font-heading text-3xl">
                      R$ {requiredMoney.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={doorOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                  transition={{ delay: 0.55, duration: 0.6 }}
                  className="flex flex-col items-center justify-center gap-4 h-full w-full p-8"
                >
                  <div className="text-center max-w-lg">
                    <p className="font-heading text-5xl text-destructive mb-4">
                      {insufficientTitle}
                    </p>
                    <p className="font-paragraph text-gray-300 text-xl leading-relaxed">
                      {insufficientMessage}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* PORTA DO COFRE */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: doorOpen ? -110 : 0 }}
              transition={{ duration: 1.15, ease: 'easeInOut' }}
              className="absolute inset-0 z-10"
              style={{
                transformStyle: 'preserve-3d',
                transformOrigin: 'left center',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-green-800 to-green-950 rounded-[18px] overflow-hidden border-r-4 border-black/30">
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(135deg,rgba(255,255,255,0.35)_0%,transparent_30%,transparent_70%,rgba(0,0,0,0.35)_100%)]" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-8">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full bg-gray-600 border-2 border-gray-400 shadow-inner"
                      />
                    ))}
                  </div>
                </div>

                <div className="absolute top-8 left-8 w-24 h-24 rounded-full bg-gray-700 border-4 border-gray-500 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.45)]">
                  <div className="w-14 h-14 rounded-full bg-gray-600 border-2 border-gray-400 flex items-center justify-center">
                    <div className="w-3 h-3 bg-gray-300 rounded-full" />
                  </div>
                </div>

                <div className="absolute inset-y-0 right-8 my-auto h-40 w-3 rounded-full bg-black/25" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            </motion.div>
          </div>

          {/* BOTÕES */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-950 via-gray-950/90 to-transparent p-6 flex gap-4 z-20 rounded-b-3xl">
            <Button
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-heading"
              disabled={isProcessing}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleConfirm}
              className="flex-1 bg-primary hover:bg-primary/80 text-black font-heading disabled:opacity-50"
              disabled={!hasSufficientFunds || isProcessing}
            >
              {isProcessing ? 'Processando...' : confirmLabel}
            </Button>
          </div>

          {/* SALDO */}
          <div className="absolute top-4 left-4 right-4 z-20">
            <p className="text-gray-300 text-sm text-center bg-black/40 rounded-xl px-3 py-2 border border-white/10">
              Saldo Atual: R$ {dirtyMoney.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}