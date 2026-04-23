import type { ReactNode } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import {
  getBranchRequirement,
  type BranchKey,
} from '@/services/gameProgressionService';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeatureGateRouteProps {
  branch: BranchKey;
  children: ReactNode;
}

export default function FeatureGateRoute({
  branch,
  children,
}: FeatureGateRouteProps) {
  const player = usePlayerStore((state) => state.player);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const loadPlayer = usePlayerStore((state) => state.loadPlayer);

  if (!isLoaded) {
    void loadPlayer();

    return (
      <>
        <Header />
        <div className="min-h-screen bg-black text-white flex items-center justify-center pt-[140px] md:pt-[160px]">
          Carregando...
        </div>
        <Footer />
      </>
    );
  }

  // Validate player is an object
  if (!player || typeof player !== 'object') {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black text-white flex items-center justify-center pt-[140px] md:pt-[160px]">
          Erro ao carregar dados do jogador
        </div>
        <Footer />
      </>
    );
  }

  const requirement = getBranchRequirement(branch, player);

  if (!requirement.unlocked) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-black text-white flex items-center justify-center px-4 pt-[140px] md:pt-[160px]">
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
              {requirement.title}
            </h2>

            <p className="mb-6 text-gray-400 font-paragraph">
              {requirement.reason}
            </p>

            <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-paragraph text-gray-300">Valor Atual</span>
                <span className="text-lg font-bold text-primary">{requirement.currentValue}</span>
              </div>

              <div className="mb-3 flex items-center justify-between">
                <span className="font-paragraph text-gray-300">Valor Necessário</span>
                <span className="text-lg font-bold text-red-500">{requirement.requiredValue}</span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${requirement.requiredValue && requirement.currentValue ? Math.min(100, (requirement.currentValue / requirement.requiredValue) * 100) : 0}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-primary to-pink-600"
                />
              </div>

              <p className="mt-2 text-xs text-gray-500">
                {Math.max(0, (requirement.requiredValue || 0) - (requirement.currentValue || 0))} para desbloquear
              </p>
            </div>

            <Button
              onClick={() => window.location.href = '/barraco'}
              className="w-full rounded-lg bg-primary py-3 font-bold text-black transition-all hover:bg-primary/90"
            >
              Ir para Barraco e Evoluir
            </Button>

            <p className="mt-4 text-xs font-paragraph text-gray-500">
              Evolua seu barraco para desbloquear novas funcionalidades e expandir seu
              império criminal.
            </p>
          </motion.div>
        </main>
        <Footer />
      </>
    );
  }

  return <>{children}</>;
}
