import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { getBranchRequirement, type BranchKey } from '@/services/gameProgressionService';
import FeatureLevelLock from '@/components/FeatureLevelLock';

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

  const requirement = getBranchRequirement(branch, player);

  if (!requirement.unlocked) {
    return (
      <FeatureLevelLock
        title={requirement.title}
        unlocked={requirement.unlocked}
        reason={requirement.reason}
        currentValue={requirement.currentValue}
        requiredValue={requirement.requiredValue}
        onNavigateToBarraco={() => navigate('/barraco')}
      />
    );
  }

  return <>{children}</>;
}
