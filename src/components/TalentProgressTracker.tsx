import React from 'react';
import { usePlayerTalentsStore } from '@/store/playerTalentsStore';
import { Card } from '@/components/ui/card';
import { Star, Trophy } from 'lucide-react';

export default function TalentProgressTracker() {
  const { totalTalentsUnlocked, unlockedTalents } = usePlayerTalentsStore();

  // Calculate average talent level
  const avgLevel =
    totalTalentsUnlocked > 0
      ? (
          Object.values(unlockedTalents).reduce((sum, t) => sum + t.currentLevel, 0) /
          totalTalentsUnlocked
        ).toFixed(1)
      : 0;

  // Count maxed talents
  const maxedTalents = Object.values(unlockedTalents).filter((t) => t.currentLevel >= 5).length;

  return (
    <Card className="bg-gray-900 border-primary p-4">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm text-gray-400">Desbloqueados</span>
          </div>
          <div className="text-2xl font-bold text-primary">{totalTalentsUnlocked}/20</div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-400">Nível Médio</span>
          </div>
          <div className="text-2xl font-bold text-yellow-500">{avgLevel}</div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-400">Máximos</span>
          </div>
          <div className="text-2xl font-bold text-green-500">{maxedTalents}</div>
        </div>
      </div>
    </Card>
  );
}
