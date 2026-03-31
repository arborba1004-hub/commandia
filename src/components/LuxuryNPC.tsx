import { motion } from 'framer-motion';

export default function LuxuryNPC() {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="text-6xl"
    >
      💎
    </motion.div>
  );
}
