// src/components/chat/EmojiPicker.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';

const emojis = ['😎', '🔥', '💰', '💎', '🔫', '🚔', '💀', '👑', '💵', '💊', '🔪', '🩸', '🏎️', '🍾', '💍', '💼', '📿', '💣', '🦍', '🐍'];

export default function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-20 left-4 bg-zinc-900 border border-white/20 rounded-2xl p-3 grid grid-cols-5 gap-2 z-50">
      {emojis.map(emoji => (
        <button key={emoji} onClick={() => onSelect(emoji)} className="text-2xl p-2 hover:bg-zinc-800 rounded-xl transition-all">
          {emoji}
        </button>
      ))}
    </motion.div>
  );
}