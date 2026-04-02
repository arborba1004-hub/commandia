import { useState, useEffect } from 'react';
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
  imageUrl = 'https://static.wixstatic.com/media/50f4bf_5868d04681cb49d1a58d89dc4493574f\~mv2.png',
}: DirtyMoneyVaultModalProps) {
  const [doorOpen, setDoorOpen] = useState(false);
  const hasSufficientFunds = playerDirtyMoney >= amount;

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setDoorOpen(true), 500);
      return () => clearTimeout(timer);
    }

    setDoorOpen(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-8 border-green-800 max-w-3xl h-[600px] flex items-center justify-center p-0 overflow-hidden">
        <div className="w-full h-full flex flex-col items-center justify-center relative [perspective:1500px]">
          <div className="relative w-full h-full bg-gradient-to-b from-gray-800 to-gray-950 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black z-0">
              {hasSufficientFunds ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={doorOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={imageUrl}
                    alt="Dinheiro sujo"
                    width={500}
                    height={500}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center z-10">
                    <p className="font-heading text-2xl text-green-400">{title}</p>
                  </div>

                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center z-10">
                    <p className="text-green-400 font-heading text-2xl">
                      R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={doorOpen ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="flex flex-col items-center justify-center gap-4 h-full w-full p-8"
                >
                  <div className="text-center">
                    <p className="font-heading text-4xl text-destructive mb-4">{insufficientTitle}</p>
                    <p className="font-paragraph text-gray-300 text-xl">
                      {insufficientMessage}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: doorOpen ? -110 : 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-br from-green-700 via-green-800 to-green-900 z-10"
              style={{
                transformStyle: 'preserve-3d',
                transformOrigin: 'left center',
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-8">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="w-4 h-4 rounded-full bg-gray-600 border-2 border-gray-400" />
                  ))}
                </div>
              </div>

              <div className="absolute top-8 left-8 w-20 h-20 rounded-full bg-gray-700 border-4 border-gray-500 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-gray-400 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20" />
            </motion.div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-6 flex gap-4 z-20">
            <Button
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-heading"
              disabled={isProcessing}
            >
              Cancelar
            </Button>

            {hasSufficientFunds && (
              <Button
                onClick={onConfirm}
                className="flex-1 bg-primary hover:bg-primary/80 text-black font-heading"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processando...' : confirmLabel}
              </Button>
            )}
          </div>

          <div className="absolute top-4 left-4 right-4 z-20">
            <p className="text-gray-300 text-sm text-center">
              Saldo Atual: R$ {playerDirtyMoney.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}