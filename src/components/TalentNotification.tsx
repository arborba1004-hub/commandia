import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TalentNotificationProps {
  message: string;
  duration?: number;
  onClose?: () => void;
}

const SLANG_MESSAGES = [
  'Desbloqueou a braba: {talent}, menor!',
  'Ó o talento aí! {talent} tá na conta!',
  'Bora lá! Conseguiu {talent}!',
  'Que parada maneira! {talent} liberado!',
  'Tá vendo só! {talent} é seu agora!',
];

export default function TalentNotification({
  message,
  duration = 3000,
  onClose,
}: TalentNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-gradient-to-r from-primary to-pink-600 text-black px-6 py-3 rounded-lg font-bold text-center shadow-lg">
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function getRandomSlangMessage(talentName: string): string {
  const randomSlang = SLANG_MESSAGES[Math.floor(Math.random() * SLANG_MESSAGES.length)];
  return randomSlang.replace('{talent}', talentName);
}
