import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeatureLevelLockProps {
  title: string;
  unlocked: boolean;
  reason: string;
  currentValue?: number;
  requiredValue?: number;
  onNavigateToBarraco?: () => void;
}

export default function FeatureLevelLock({
  title,
  unlocked,
  reason,
  currentValue = 0,
  requiredValue = 0,
  onNavigateToBarraco,
}: FeatureLevelLockProps) {
  const progress =
    requiredValue > 0 ? Math.min(100, (currentValue / requiredValue) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full h-full flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full text-center">
        {/* Lock Icon */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-6 flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
            <Lock className="w-24 h-24 text-primary relative z-10" />
          </div>
        </motion.div>

        {/* Title */}
        <h2 className="text-3xl font-bold font-heading text-white mb-2">
          {title}
        </h2>

        {/* Description */}
        <p className="text-gray-400 font-paragraph mb-6">
          {reason}
        </p>

        {/* Level Info */}
        <div className="bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-800">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-300 font-paragraph">Valor Atual</span>
            <span className="text-primary font-bold text-lg">{currentValue}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-300 font-paragraph">Valor Necessário</span>
            <span className="text-red-500 font-bold text-lg">{requiredValue}</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary to-pink-600"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {Math.max(0, requiredValue - currentValue)} para desbloquear
          </p>
        </div>

        {/* Action Button */}
        {onNavigateToBarraco && (
          <Button
            onClick={onNavigateToBarraco}
            className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3 rounded-lg transition-all"
          >
            Ir para Barraco e Evoluir
          </Button>
        )}

        {/* Info Text */}
        <p className="text-xs text-gray-500 mt-4 font-paragraph">
          Evolua seu barraco para desbloquear novas funcionalidades e expandir seu império criminal.
        </p>
      </div>
    </motion.div>
  );
}
