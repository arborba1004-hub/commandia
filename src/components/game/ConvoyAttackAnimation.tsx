/**
 * Convoy Attack Animation
 * Displays the selected convoy animation during attacks
 */

import { motion } from 'framer-motion';
import { useConvoyAnimationStore } from '@/store/convoyAnimationStore';
import { useMapAttackStore } from '@/store/mapAttackStore';

export default function ConvoyAttackAnimation() {
  const selectedAnimation = useConvoyAnimationStore((state) => state.selectedAnimation);
  const phase = useMapAttackStore((state) => state.phase);

  // Only show during attack execution
  const isVisible = phase === 'executing' || phase === 'resolving';

  if (!isVisible) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background overlay */}
      <motion.div
        className="absolute inset-0 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Convoy animation container */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Convoy visual */}
        <ConvoyVisual animationType={selectedAnimation} />

        {/* Status text */}
        <motion.div
          className="text-center"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="font-heading text-2xl font-bold text-[#d9b764] mb-2">
            COMBOIO EM MOVIMENTO
          </p>
          <p className="font-paragraph text-white/60">
            {getAnimationDescription(selectedAnimation)}
          </p>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-[#d9b764]"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

interface ConvoyVisualProps {
  animationType: string;
}

function ConvoyVisual({ animationType }: ConvoyVisualProps) {
  const getColor = () => {
    switch (animationType) {
      case 'armored-van':
        return 'from-red-600 to-red-700';
      case 'motorcycle':
        return 'from-yellow-500 to-orange-500';
      case 'classic-truck':
      default:
        return 'from-[#d9b764] to-[#f0d78c]';
    }
  };

  const getIcon = () => {
    switch (animationType) {
      case 'armored-van':
        return '🛡️';
      case 'motorcycle':
        return '🏍️';
      case 'classic-truck':
      default:
        return '🚚';
    }
  };

  return (
    <motion.div
      className="flex items-center gap-4"
      animate={{ x: [0, 40, 0] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Main vehicle */}
      <motion.div
        className={`w-24 h-16 bg-gradient-to-r ${getColor()} rounded-lg flex items-center justify-center border-2 border-white/20 shadow-lg`}
        animate={{ rotateY: [0, 5, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <span className="text-5xl">{getIcon()}</span>
      </motion.div>

      {/* Wheels */}
      <motion.div
        className="flex gap-2"
        animate={{ rotate: [0, 360] }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div className="w-6 h-6 rounded-full border-2 border-white/40 bg-white/10" />
        <div className="w-6 h-6 rounded-full border-2 border-white/40 bg-white/10" />
      </motion.div>

      {/* Speed lines */}
      <motion.div
        className="flex flex-col gap-1"
        animate={{ x: [0, -20] }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1 bg-gradient-to-r from-[#d9b764] to-transparent rounded-full"
            style={{ width: `${20 - i * 5}px` }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

function getAnimationDescription(animationType: string): string {
  switch (animationType) {
    case 'armored-van':
      return 'Van Blindada em rota segura...';
    case 'motorcycle':
      return 'Motocicleta em alta velocidade...';
    case 'classic-truck':
    default:
      return 'Caminhão em movimento...';
  }
}
