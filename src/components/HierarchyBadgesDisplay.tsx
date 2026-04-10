import { HIERARCHY_RANKS, getUnlockedRanks } from '@/utils/hierarchySystem';
import { motion } from 'framer-motion';

interface HierarchyBadgesDisplayProps {
  playerLevel: number;
  currentRank?: string;
}

export default function HierarchyBadgesDisplay({
  playerLevel,
  currentRank,
}: HierarchyBadgesDisplayProps) {
  const unlockedRanks = getUnlockedRanks(playerLevel);
  const currentRankData = HIERARCHY_RANKS.find((r) => r.title === currentRank);

  return (
    <div className="w-full">
      {/* Current Rank Display */}
      {currentRankData && (
        <motion.div
          className="mb-8 p-6 rounded-xl border-2 bg-gradient-to-r from-background to-custom4"
          style={{
            borderColor: currentRankData.color,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <div className="text-5xl">{currentRankData.icon}</div>
            <div>
              <h3 className="text-sm text-secondary mb-1 font-paragraph">Cargo Atual</h3>
              <h2
                className="text-3xl font-bold font-heading"
                style={{ color: currentRankData.color }}
              >
                {currentRankData.title}
              </h2>
              <p className="text-sm text-secondary mt-2 italic font-paragraph">
                "{currentRankData.slang}"
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Badges Grid */}
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4 text-foreground font-heading">
          Distintivos Desbloqueados ({unlockedRanks.length}/{HIERARCHY_RANKS.length})
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {HIERARCHY_RANKS.map((rank, index) => {
            const isUnlocked = unlockedRanks.some((r) => r.level === rank.level);
            const isCurrent = rank.title === currentRank;

            return (
              <motion.div
                key={rank.level}
                className="relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className={`
                    p-4 rounded-lg border-2 text-center transition-all
                    ${
                      isUnlocked
                        ? 'bg-opacity-20 cursor-pointer hover:scale-105'
                        : 'bg-opacity-5 opacity-50'
                    }
                    ${isCurrent ? 'ring-2 ring-offset-2' : ''}
                  `}
                  style={{
                    borderColor: rank.color,
                    backgroundColor: isUnlocked ? rank.color : '#666',
                    ringColor: rank.color,
                  }}
                >
                  <div className="text-3xl mb-2">{rank.icon}</div>
                  <p className="text-xs font-bold text-foreground font-heading mb-1">
                    {rank.title}
                  </p>
                  <p className="text-xs text-secondary font-paragraph">Nível {rank.level}</p>

                  {isCurrent && (
                    <motion.div
                      className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ✓
                    </motion.div>
                  )}

                  {!isUnlocked && (
                    <p className="text-xs text-secondary mt-2 font-paragraph">
                      +{rank.level - playerLevel} níveis
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-8 p-4 rounded-lg bg-custom4 border border-secondary border-opacity-20">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-paragraph text-secondary">Progresso Hierárquico</p>
          <p className="text-sm font-bold font-heading text-foreground">
            {unlockedRanks.length}/{HIERARCHY_RANKS.length}
          </p>
        </div>
        <div className="w-full bg-background rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary"
            style={{
              width: `${(unlockedRanks.length / HIERARCHY_RANKS.length) * 100}%`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedRanks.length / HIERARCHY_RANKS.length) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>
    </div>
  );
}
