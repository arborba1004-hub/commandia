import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Trophy, X } from 'lucide-react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementPopupProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const rarityColors = {
  common: 'border-gray-400 bg-gray-400/10',
  rare: 'border-blue-400 bg-blue-400/10',
  epic: 'border-purple-400 bg-purple-400/10',
  legendary: 'border-yellow-400 bg-yellow-400/10',
};

const rarityTextColors = {
  common: 'text-gray-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
};

export default function AchievementPopup({ achievement, onClose }: AchievementPopupProps) {
  const [isVisible, setIsVisible] = useState(!!achievement);

  useEffect(() => {
    setIsVisible(!!achievement);
    if (achievement) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {isVisible && achievement && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 right-4 z-50"
        >
          <Card
            className={`p-6 border-2 max-w-sm ${rarityColors[achievement.rarity]}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-3 rounded-lg ${rarityTextColors[achievement.rarity]}`}>
                  <Trophy className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-lg mb-1">Achievement Unlocked!</h3>
                  <p className={`font-bold mb-1 ${rarityTextColors[achievement.rarity]}`}>
                    {achievement.title}
                  </p>
                  <p className="text-sm text-secondary-foreground/70">
                    {achievement.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsVisible(false);
                  onClose();
                }}
                className="hover:bg-secondary/10 p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
