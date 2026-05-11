import { useEffect } from 'react';
import { useAchievementStore } from '@/store/achievementStore';
import { ACHIEVEMENTS } from '@/types/achievements';
import { motion, AnimatePresence } from 'framer-motion';

export default function AchievementNotification() {
  const { newlyUnlocked, clearNewlyUnlocked } = useAchievementStore();

  useEffect(() => {
    if (newlyUnlocked) {
      const timer = setTimeout(() => {
        clearNewlyUnlocked();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [newlyUnlocked, clearNewlyUnlocked]);

  if (!newlyUnlocked) return null;

  const achievement = ACHIEVEMENTS[newlyUnlocked];

  return (
    <AnimatePresence>
      {newlyUnlocked && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.4 }}
          className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40"
        >
          <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-6 shadow-lg border-2 border-primary">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{achievement.icon}</div>
              <div>
                <h3 className="text-lg font-heading font-bold text-secondary">
                  Conquista Desbloqueada!
                </h3>
                <p className="text-secondary/90 font-paragraph">
                  {achievement.name}
                </p>
                <div
                  className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: achievement.titleColor }}
                >
                  Título: {achievement.title}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
