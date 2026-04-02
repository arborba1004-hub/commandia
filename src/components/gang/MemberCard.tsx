import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Shield, Zap, Heart, Sword, Users, Trophy, Target } from 'lucide-react';

import type { GangMember } from '@/types/gang';

interface Props {
  member: GangMember;
  onTrain: () => void;
  onEquip: () => void;
  onToggleActive: () => void;
  onDismiss: () => void;
  isReserve?: boolean;
}

const rarityConfig = {
  Comum: { color: 'text-gray-400', bg: 'bg-gray-500/10', iconColor: 'text-gray-400' },
  Raro: { color: 'text-blue-400', bg: 'bg-blue-500/10', iconColor: 'text-blue-400' },
  Épico: { color: 'text-purple-400', bg: 'bg-purple-500/10', iconColor: 'text-purple-400' },
  Lendário: { color: 'text-orange-400', bg: 'bg-orange-500/10', iconColor: 'text-orange-400' },
  Mítico: { color: 'text-red-400', bg: 'bg-red-500/10', iconColor: 'text-red-400' },
};

export default function MemberCard({
  member,
  onTrain,
  onEquip,
  onToggleActive,
  onDismiss,
  isReserve = false,
}: Props) {
  const [isHovered, setIsHovered] = useState(false);

  const rarity = rarityConfig[member.rarity] || rarityConfig.Comum;
  const loyaltyColor =
    member.loyalty < 30
      ? 'text-red-400'
      : member.loyalty < 70
      ? 'text-yellow-400'
      : 'text-emerald-400';

  const battlePower = (member.level || 1) * 10 + (member.victories || 0) * 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative bg-zinc-900/90 border border-white/10 rounded-3xl overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-xl"
    >
      {/* Glow de raridade */}
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-${rarity.color.replace('text-', '')} to-transparent opacity-60`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black tracking-tight text-white">{member.name}</h3>
              <div className={`px-3 py-0.5 text-xs font-bold rounded-full ${rarity.bg} ${rarity.color}`}>
                {member.rarity}
              </div>
            </div>
            <p className="text-primary font-medium mt-1">{member.class}</p>
          </div>

          <div className="text-right">
            <div className="text-4xl font-black text-white/90">Lv.{member.level}</div>
            <p className="text-xs text-gray-500 mt-1">
              EXP {member.exp}/{member.expToNext}
            </p>
          </div>
        </div>

        {/* Stats Principais */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <Heart className={`mx-auto mb-1 ${loyaltyColor}`} size={22} />
            <p className="text-xs text-gray-400">Lealdade</p>
            <p className={`font-bold text-lg ${loyaltyColor}`}>{member.loyalty}%</p>
          </div>

          <div>
            <Trophy className="mx-auto mb-1 text-amber-400" size={22} />
            <p className="text-xs text-gray-400">Vitórias</p>
            <p className="font-bold text-lg text-white">{member.victories}</p>
          </div>

          <div>
            <Target className="mx-auto mb-1 text-cyan-400" size={22} />
            <p className="text-xs text-gray-400">Poder</p>
            <p className="font-bold text-lg text-white">{battlePower}</p>
          </div>
        </div>

        {/* Skills */}
        <div className="mt-6">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
            <Zap size={14} /> Habilidades Principais
          </p>
          <div className="space-y-2">
            {member.skills.slice(0, 3).map((skill, index) => (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between bg-black/40 rounded-xl px-4 py-2 text-sm"
              >
                <span className="text-gray-300">{skill.name}</span>
                <span className="text-primary font-mono">Lv.{skill.level}</span>
              </motion.div>
            ))}
            {member.skills.length === 0 && (
              <p className="text-xs text-gray-500 italic">Sem habilidades treinadas ainda...</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={onTrain}
            className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white font-medium py-3 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
          >
            <Zap size={18} />
            Treinar
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={onEquip}
            className="flex-1 bg-emerald-600/80 hover:bg-emerald-600 text-white font-medium py-3 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
          >
            <Shield size={18} />
            Equipar
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={onToggleActive}
            className={`flex-1 font-medium py-3 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 ${
              isReserve
                ? 'bg-cyan-600/80 hover:bg-cyan-600'
                : 'bg-amber-600/80 hover:bg-amber-600'
            }`}
          >
            {isReserve ? (
              <>
                <Users size={18} /> Ativar
              </>
            ) : (
              <>
                <Shield size={18} /> Reservar
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={onDismiss}
            className="flex-1 bg-red-700/70 hover:bg-red-700 text-white font-medium py-3 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
          >
            Demitir
          </motion.button>
        </div>
      </div>

      {/* Efeito de hover sutil */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}