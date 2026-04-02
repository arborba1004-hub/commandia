import { useState } from 'react';
import { useGangStore } from '@/store/gangStore';
import { GangMember } from '@/types/gang';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  member: GangMember;
  onClose: () => void;
}

export default function TrainModal({ isOpen, member, onClose }: Props) {
  const { trainMember } = useGangStore();
  const [usePremium, setUsePremium] = useState(false);

  const handleTrain = () => {
    trainMember(member.id, usePremium);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div className="bg-gray-900 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-2">Treinar {member.name}</h2>
            <p className="text-gray-400 mb-4">Nível atual: {member.level} | EXP: {member.exp}/{member.expToNext}</p>
            <div className="bg-gray-800 p-3 rounded-lg mb-4">
              <p>Treino normal: +100 EXP (custa R$2.000 sujo)</p>
              <p>Treino premium: +500 EXP + chance de dobrar (custa 5 Coins)</p>
            </div>
            <label className="flex items-center gap-2 mb-6">
              <input type="checkbox" checked={usePremium} onChange={(e) => setUsePremium(e.target.checked)} />
              Usar treino premium (5 Coins)
            </label>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 bg-gray-700 py-2 rounded">Cancelar</button>
              <button onClick={handleTrain} className="flex-1 bg-primary text-black font-bold py-2 rounded">Treinar</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}