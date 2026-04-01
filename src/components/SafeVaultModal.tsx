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
      <DialogContent className="bg-gray-900 border-primary max-w-3xl h-[600px] flex items-center justify-center p-0 overflow-hidden">
        <div className="w-full h-full flex flex-col items-center justify-center relative">
          {/* Vault Container - Full Modal Size */}
          <div 
            className="relative w-full h-full bg-gradient-to-b from-gray-800 to-gray-950 overflow-hidden"
            style={{ perspective: '1200px' }}
          >
            {/* Vault Door - Military Green Hatch */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: doorOpen ? -120 : 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-br from-green-800 via-green-700 to-green-900 origin-left"
              style={{ 
                perspective: '1200px',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Door Rivets */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-8">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="w-4 h-4 rounded-full bg-gray-600 border-2 border-gray-400 shadow-md" />
                  ))}
                </div>
              </div>

              {/* Hatch Lock Wheel */}
              <div className="absolute top-8 left-8 w-20 h-20 rounded-full bg-gray-700 border-4 border-gray-500 flex items-center justify-center shadow-lg">
                <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-gray-400 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                </div>
              </div>

              {/* Door Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-15" />
            </motion.div>

            {/* Vault Interior */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center p-8">
              {hasSufficientFunds ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={doorOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="flex flex-col items-center gap-6"
                >
                  {/* Money Image - Official Complexo Coin */}
                  <div className="w-48 h-48 rounded-lg overflow-hidden border-4 border-primary shadow-2xl">
                    <Image
                      src="https://static.wixstatic.com/media/50f4bf_a8f9513ac27746dbb867c866c456cbe4~mv2.png?originWidth=256&originHeight=256"
                      alt="Moeda Oficial do Complexo"
                      width={192}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-primary font-heading text-2xl text-center">
                    R$ {subornoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={doorOpen ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="flex flex-col items-center justify-center gap-4 h-full"
                >
                  {/* Empty Vault */}
                  <div className="text-center">
                    <p className="font-heading text-4xl text-destructive mb-4">COFRE VAZIO</p>
                    <p className="font-paragraph text-gray-300 text-xl">
                      vc não tem o valor suficiente é melhor denunciar esse corrupto
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Action Buttons - Positioned at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-6 flex gap-4">
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
          <div className="absolute top-4 left-4 right-4">
            <p className="text-gray-300 text-sm text-center">
              Saldo Atual: R$ {playerDirtyMoney.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
