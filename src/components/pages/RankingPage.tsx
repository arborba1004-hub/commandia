'use client';

import { useEffect, useState } from 'react';
// ... keep existing code (Header and Footer rendered by Router layout) ...
import { BaseCrudService } from '@/integrations';
import { PlayerProfiles } from '@/entities';
import { usePlayerStore } from '@/store/playerStore';
import { useAchievementStore } from '@/store/achievementStore';
import { ACHIEVEMENTS } from '@/types/achievements';
import { motion } from 'framer-motion';
import { Medal, Trophy, Zap } from 'lucide-react';

interface RankedPlayer extends PlayerProfiles {
  power?: number;
  rank?: number;
}

export default function RankingPage() {
  const [topPlayers, setTopPlayers] = useState<RankedPlayer[]>([]);
  const [topBarracos, setTopBarracos] = useState<RankedPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { player } = usePlayerStore();
  const { unlockedAchievements } = useAchievementStore();

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all players
        const result = await BaseCrudService.getAll<PlayerProfiles>(
          'playerprofiles',
          {},
          { limit: 100 }
        );

        if (!result.items || result.items.length === 0) {
          setTopPlayers([]);
          setTopBarracos([]);
          return;
        }

        // Calculate power for each player (simplified: level * 10 + experience/100)
        const playersWithPower = result.items.map((p) => ({
          ...p,
          power: (p.level || 0) * 10 + (p.experiencePoints || 0) / 100,
        }));

        // Sort by power and get top 10
        const sortedByPower = playersWithPower
          .sort((a, b) => (b.power || 0) - (a.power || 0))
          .slice(0, 10)
          .map((p, idx) => ({ ...p, rank: idx + 1 }));

        // Sort by level (barraco equivalent) and get top 10
        const sortedByLevel = playersWithPower
          .sort((a, b) => (b.level || 0) - (a.level || 0))
          .slice(0, 10)
          .map((p, idx) => ({ ...p, rank: idx + 1 }));

        setTopPlayers(sortedByPower);
        setTopBarracos(sortedByLevel);
      } catch (err) {
        console.error('Error fetching rankings:', err);
        setError('Erro ao carregar rankings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const getRankMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-20">
        {/* Hero Section */}
        <motion.section
          className="text-center mb-20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-primary" />
            <h1 className="text-6xl font-heading font-bold text-primary">
              RANKING
            </h1>
            <Trophy className="w-12 h-12 text-primary" />
          </div>
          <p className="text-xl text-secondary font-paragraph">
            Os maiores poderes do crime organizado
          </p>
        </motion.section>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin">
              <Zap className="w-12 h-12 text-primary" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-destructive">
            <p className="text-lg">{error}</p>
          </div>
        ) : (
          <>
            {/* Top Players by Power */}
            <motion.section
              className="mb-20"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center gap-3 mb-8">
                <Zap className="w-8 h-8 text-primary" />
                <h2 className="text-4xl font-heading font-bold">
                  Top 10 Poder
                </h2>
              </div>

              <div className="space-y-3">
                {topPlayers.map((p, idx) => (
                  <motion.div
                    key={p._id}
                    variants={itemVariants}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      player?._id === p._id
                        ? 'border-primary bg-primary/10'
                        : 'border-secondary/20 bg-custom4/20 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-3xl font-bold w-12 text-center">
                          {getRankMedal(idx + 1)}
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-heading font-bold text-secondary">
                            {p.playerName}
                          </p>
                          <p className="text-sm text-secondary/70">
                            Nível {p.level}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {Math.floor(p.power || 0)}
                        </p>
                        <p className="text-xs text-secondary/70">Poder</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-2 bg-secondary/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-secondary"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(
                            ((p.power || 0) / (topPlayers[0]?.power || 1)) * 100,
                            100
                          )}%`,
                        }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Top Barraco Levels */}
            <motion.section
              className="mb-20"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center gap-3 mb-8">
                <Medal className="w-8 h-8 text-primary" />
                <h2 className="text-4xl font-heading font-bold">
                  Top 10 Níveis
                </h2>
              </div>

              <div className="space-y-3">
                {topBarracos.map((p, idx) => (
                  <motion.div
                    key={p._id}
                    variants={itemVariants}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      player?._id === p._id
                        ? 'border-primary bg-primary/10'
                        : 'border-secondary/20 bg-custom4/20 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-3xl font-bold w-12 text-center">
                          {getRankMedal(idx + 1)}
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-heading font-bold text-secondary">
                            {p.playerName}
                          </p>
                          <p className="text-sm text-secondary/70">
                            {p.experiencePoints?.toLocaleString()} XP
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {p.level}
                        </p>
                        <p className="text-xs text-secondary/70">Nível</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-2 bg-secondary/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-secondary"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(
                            ((p.level || 0) / (topBarracos[0]?.level || 1)) * 100,
                            100
                          )}%`,
                        }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Achievements Section */}
            <motion.section
              className="mb-20"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <h2 className="text-4xl font-heading font-bold mb-8">
                Conquistas Desbloqueadas ({unlockedAchievements.length}/
                {Object.keys(ACHIEVEMENTS).length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(ACHIEVEMENTS).map(([id, achievement]) => {
                  const isUnlocked = unlockedAchievements.includes(id as any);

                  return (
                    <motion.div
                      key={id}
                      variants={itemVariants}
                      className={`p-6 rounded-lg border-2 text-center transition-all ${
                        isUnlocked
                          ? 'border-primary bg-primary/10'
                          : 'border-secondary/20 bg-custom4/20 opacity-50'
                      }`}
                    >
                      <div className="text-5xl mb-3">{achievement.icon}</div>
                      <h3 className="font-heading font-bold text-secondary mb-2">
                        {achievement.name}
                      </h3>
                      <p className="text-xs text-secondary/70 mb-3">
                        {achievement.description}
                      </p>

                      {isUnlocked && (
                        <div
                          className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: achievement.titleColor }}
                        >
                          {achievement.title}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>

            {/* Your Stats */}
            {player && (
              <motion.section
                className="bg-custom4/30 border-2 border-primary/50 rounded-lg p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h2 className="text-2xl font-heading font-bold mb-6">
                  Suas Estatísticas
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-secondary/70 text-sm mb-2">Nível</p>
                    <p className="text-3xl font-bold text-primary">
                      {player.niveis?.playerLevel || player.level || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-secondary/70 text-sm mb-2">Poder</p>
                    <p className="text-3xl font-bold text-primary">
                      {Math.floor(
                        (player.level || 0) * 10 +
                          (player.experiencePoints || 0) / 100
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-secondary/70 text-sm mb-2">
                      Dinheiro Sujo
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {(player.dirtyMoney || 0).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-secondary/70 text-sm mb-2">
                      Dinheiro Limpo
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {(player.cleanMoney || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.section>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
