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

    setShowConfetti(false);
  }, [isVisible, rank, onClose]);

  if (!isVisible || !rank) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2 rounded-full"
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

        <motion.div
          className="relative text-center"
          initial={{ scale: 0, y: -50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        >
          <motion.div
            className="absolute inset-0 rounded-2xl blur-3xl opacity-50"
            style={{ backgroundColor: rank.color }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <div
            className="relative max-w-md rounded-2xl border-2 bg-gradient-to-br from-background to-custom4 p-8 shadow-2xl"
            style={{
              borderColor: rank.color,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
            }}
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-2xl font-bold text-white hover:bg-black/60"
              aria-label="Fechar modal"
              type="button"
            >
              ×
            </button>

            <motion.div
              className="mb-4 text-6xl"
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

            <h2
              className="mb-2 font-heading text-4xl font-bold"
              style={{ color: rank.color }}
            >
              PROMOÇÃO!
            </h2>

            <h3 className="mb-4 font-heading text-3xl font-bold text-foreground">
              {rank.title}
            </h3>

            <p className="mb-6 font-paragraph text-lg italic text-secondary">
              "{rank.slang}"
            </p>

            <div
              className="inline-block rounded-lg px-4 py-2 font-bold"
              style={{
                backgroundColor: rank.color,
                color: '#000',
              }}
            >
              Nível {rank.level}
            </div>

            <div className="mt-6">
              <button
                onClick={onClose}
                className="rounded-xl bg-white/10 px-5 py-2 font-bold text-white hover:bg-white/20"
                type="button"
              >
                Fechar
              </button>
            </div>
          </div>

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
    </AnimatePresence>
  );
}