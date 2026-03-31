import { useEffect, useState } from 'react';
import { Image } from '@/components/ui/image';
import { motion } from 'framer-motion';

export type NPCState = 'IDLE' | 'TALKING' | 'SUCCESS' | 'ERROR';

interface Props {
  state?: NPCState;
  onNPCLoaded?: () => void;
}

export default function LuxuryNPC({ state = 'IDLE', onNPCLoaded }: Props) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);
      onNPCLoaded?.();
    }, 800);
  }, [onNPCLoaded]);

  const getStateAnimation = () => {
    switch (state) {
      case 'TALKING':
        return {
          scale: [1, 1.02, 1],
          y: [0, -4, 0],
        };
      case 'SUCCESS':
        return {
          scale: [1, 1.05, 1],
          rotate: [0, 2, -2, 0],
        };
      case 'ERROR':
        return {
          x: [-8, 8, -8, 0],
          scale: [1, 0.98, 1],
        };
      default:
        return { scale: 1 };
    }
  };

  return (
    <motion.div
      className="w-full h-full flex items-center justify-center"
      animate={getStateAnimation()}
      transition={{
        duration: state === 'IDLE' ? 0 : 0.6,
        repeat: state === 'TALKING' ? Infinity : 0,
        repeatType: 'reverse',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.75 }}
        transition={{ duration: 0.7 }}
      >
        <Image
          src="https://static.wixstatic.com/media/50f4bf_6a18b3ab08d24e0094b813673baa88e0~mv2.png"
          alt="Luxury NPC Character"
          width={300}
          className="object-contain"
        />
      </motion.div>
    </motion.div>
  );
}