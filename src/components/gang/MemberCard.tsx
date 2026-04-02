import { GangMember } from '@/types/gang';
import { motion } from 'framer-motion';
import { Star, Shield, Zap, Heart, Sword, Users } from 'lucide-react';

interface Props {
  member: GangMember;
  onTrain: () => void;
  onEquip: () => void;
  onToggleActive: () => void;
  onDismiss: () => void;
  isReserve?: boolean;
}

const rarityColors = {
  Comum: 'gray',
  Raro: 'blue',
  Épico: 'purple',
  Lendário: 'orange',
  Mítico: 'red',
};

export default function MemberCard({ member, onTrain, onEquip, onToggleActive, onDismiss, isReserve }: Props) {
  const loyaltyColor = member.loyalty < 30 ? 'text-red-400' : member.loyalty < 70 ? 'text-yellow-400' : 'text-green-400';

  return (
    <motion.div className="bg-gray-900/70 rounded-2xl border border-white/10 p-5 hover:border-primary/50 transition-all">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold">{member.name}</h3>
          <p className="text-sm text-primary">{member.class}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star size={14} className={`text-${rarityColors[member.rarity]}-400`} />
            <span className="text-xs text-gray-400">{member.rarity}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">Lv.{member.level}</p>
          <p className="text-xs text-gray-400">EXP: {member.exp}/{member.expToNext}</p>
        </div>
      </div>

      <div className="flex gap-4 my-3 text-sm">
        <div className="flex items-center gap-1">
          <Heart size={14} className={loyaltyColor} />
          <span className={loyaltyColor}>Lealdade {member.loyalty}</span>
        </div>
        <div className="flex items-center gap-1">
          <Sword size={14} className="text-red-400" />
          <span>Vitórias {member.victories}</span>
        </div>
      </div>

      <div className="text-xs text-gray-300 mb-3">
        {member.skills.slice(0, 2).map(skill => (
          <div key={skill.id}>• {skill.name} Lv.{skill.level}</div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={onTrain} className="bg-blue-600/70 hover:bg-blue-600 px-3 py-1 rounded text-xs">Treinar</button>
        <button onClick={onEquip} className="bg-green-600/70 hover:bg-green-600 px-3 py-1 rounded text-xs">Equipar</button>
        {!isReserve ? (
          <button onClick={onToggleActive} className="bg-yellow-600/70 hover:bg-yellow-600 px-3 py-1 rounded text-xs">Reservar</button>
        ) : (
          <button onClick={onToggleActive} className="bg-cyan-600/70 hover:bg-cyan-600 px-3 py-1 rounded text-xs">Ativar</button>
        )}
        <button onClick={onDismiss} className="bg-red-700/50 hover:bg-red-700 px-3 py-1 rounded text-xs">Demitir</button>
      </div>
    </motion.div>
  );
}