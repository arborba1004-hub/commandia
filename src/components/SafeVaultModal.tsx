import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';

interface SafeVaultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subornoValue: number;
  playerDirtyMoney: number;
  onConfirm: () => void;
  isProcessing: boolean;
}

export default function SafeVaultModal({
  open,
  onOpenChange,
  subornoValue,
  playerDirtyMoney,
  onConfirm,
  isProcessing,
}: SafeVaultModalProps) {
  const [doorOpen, setDoorOpen] = useState(false);
  const hasSufficientFunds = playerDirtyMoney >= subornoValue;

  useEffect(() => {
    if (open) {
      // Abre a porta após um pequeno delay
      const timer = setTimeout(() => setDoorOpen(true), 500);
      return () => clearTimeout(timer);
    } else {
      setDoorOpen(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-primary max-w-2xl">
        <div className="flex flex-col items-center justify-center py-12">
          {/* Vault Container */}
          <div className="relative w-full max-w-sm aspect-square bg-gradient-to-b from-gray-800 to-gray-950 rounded-lg border-4 border-yellow-600 shadow-2xl overflow-hidden">
            {/* Vault Door */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: doorOpen ? -90 : 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-br from-yellow-700 via-yellow-600 to-yellow-800 origin-left"
              style={{ perspective: '1000px' }}
            >
              {/* Door Details */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-700 border-4 border-gray-500 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-gray-400" />
                </div>
              </div>

              {/* Door Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20" />
            </motion.div>

            {/* Vault Interior */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center p-8">
              {hasSufficientFunds ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={doorOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="flex flex-col items-center gap-4"
                >
                  {/* Money Image */}
                  <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-primary shadow-lg">
                    <Image
                      src="https://static.wixstatic.com/media/50f4bf_a8f9513ac27746dbb867c866c456cbe4~mv2.png?originWidth=256&originHeight=256"
                      alt="Dinheiro Sujo"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-primary font-heading text-lg text-center">
                    R$ {subornoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={doorOpen ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="flex flex-col items-center justify-center gap-4 h-full"
                >
                  {/* Empty Vault */}
                  <div className="text-center">
                    <p className="font-heading text-2xl text-destructive mb-4">COFRE VAZIO</p>
                    <p className="font-paragraph text-gray-300 text-lg">
                      vc não tem o valor suficiente é melhor denunciar esse corrupto
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8 w-full">
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
                {isProcessing ? 'Processando...' : 'Confirmar Pagamento'}
              </Button>
            )}
          </div>

          {/* Info Text */}
          <p className="text-gray-400 text-sm mt-6 text-center">
            Saldo Atual: R$ {playerDirtyMoney.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
