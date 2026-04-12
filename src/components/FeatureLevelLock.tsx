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
      className="w-full max-w-md text-center"
    >
      <div className="mb-6 flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
          <Lock className="relative z-10 h-24 w-24 text-primary" />
        </div>
      </div>

      <h2 className="mb-2 text-3xl font-bold font-heading text-white">
        {title}
      </h2>

      <p className="mb-6 text-gray-400 font-paragraph">
        {reason}
      </p>

      <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-paragraph text-gray-300">Valor Atual</span>
          <span className="text-lg font-bold text-primary">{currentValue}</span>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <span className="font-paragraph text-gray-300">Valor Necessário</span>
          <span className="text-lg font-bold text-red-500">{requiredValue}</span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary to-pink-600"
          />
        </div>

        <p className="mt-2 text-xs text-gray-500">
          {Math.max(0, requiredValue - currentValue)} para desbloquear
        </p>
      </div>

      {onNavigateToBarraco && (
        <Button
          onClick={onNavigateToBarraco}
          className="w-full rounded-lg bg-primary py-3 font-bold text-black transition-all hover:bg-primary/90"
        >
          Ir para Barraco e Evoluir
        </Button>
      )}

      <p className="mt-4 text-xs font-paragraph text-gray-500">
        Evolua seu barraco para desbloquear novas funcionalidades e expandir seu
        império criminal.
      </p>
    </motion.div>
  );
}