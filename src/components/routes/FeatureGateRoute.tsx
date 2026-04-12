import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import {
  getBranchRequirement,
  type BranchKey,
} from '@/services/gameProgressionService';
import FeatureLevelLock from '@/components/FeatureLevelLock';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface FeatureGateRouteProps {
  branch: BranchKey;
  children: ReactNode;
}

export default function FeatureGateRoute({
  branch,
  children,
}: FeatureGateRouteProps) {
  const navigate = useNavigate();
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

  const requirement = getBranchRequirement(branch, player);

  if (!requirement.unlocked) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-black text-white flex items-center justify-center px-4 pt-[140px] md:pt-[160px]">
          <FeatureLevelLock
            title={requirement.title}
            unlocked={requirement.unlocked}
            reason={requirement.reason}
            currentValue={requirement.currentValue}
            requiredValue={requirement.requiredValue}
            onNavigateToBarraco={() => navigate('/barraco')}
          />
        </main>
        <Footer />
      </>
    );
  }

  return <>{children}</>;
}