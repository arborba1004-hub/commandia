import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HierarchyRank } from '@/utils/hierarchySystem';

interface RankPromotionNotificationProps {
  rank: HierarchyRank | null;
  isVisible: boolean;
  onClose: () => void;
}

export default function RankPromotionNotification({
  rank,
  isVisible,
  onClose,
}: RankPromotionNotificationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible && rank) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, rank, onClose]);

  if (!rank) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Confetti Background */}
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: rank.color,
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                  }}
                  animate={{
                    y: window.innerHeight + 20,
                    opacity: [1, 0],
                    rotate: Math.random() * 360,
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    ease: 'easeIn',
                  }}
                />
              ))}
            </div>
          )}

          {/* Main Notification */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative text-center"
              initial={{ scale: 0, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            >
              {/* Glow Effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl blur-3xl opacity-50"
                style={{ backgroundColor: rank.color }}
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />

              {/* Card */}
              <div
                className="relative bg-gradient-to-br from-background to-custom4 border-2 rounded-2xl p-8 max-w-md shadow-2xl"
                style={{
                  borderColor: rank.color,
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                }}
              >
                {/* Icon */}
                <motion.div
                  className="text-6xl mb-4"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                >
                  {rank.icon}
                </motion.div>

                {/* Title */}
                <h2
                  className="text-4xl font-bold mb-2 font-heading"
                  style={{ color: rank.color }}
                >
                  PROMOÇÃO!
                </h2>

                {/* Rank Title */}
                <h3 className="text-3xl font-bold mb-4 text-foreground font-heading">
                  {rank.title}
                </h3>

                {/* Slang Message */}
                <p className="text-lg text-secondary mb-6 font-paragraph italic">
                  "{rank.slang}"
                </p>

                {/* Level Info */}
                <div
                  className="inline-block px-4 py-2 rounded-lg font-bold"
                  style={{
                    backgroundColor: rank.color,
                    color: '#000',
                  }}
                >
                  Nível {rank.level}
                </div>
              </div>

              {/* Animated Stars */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  className="absolute text-2xl"
                  style={{
                    left: `${50 + Math.cos((i / 6) * Math.PI * 2) * 120}%`,
                    top: `${50 + Math.sin((i / 6) * Math.PI * 2) * 120}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    repeat: Infinity,
                  }}
                >
                  ⭐
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
