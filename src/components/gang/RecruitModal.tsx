import { useState } from 'react';
import { useGangStore } from '@/store/gangStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function RecruitModal({ isOpen, onClose }: Props) {
  const { recruitMember, isLoading } = useGangStore();
  const [method, setMethod] = useState<'mission' | 'market' | 'premium'>('mission');

  const handleRecruit = async () => {
    await recruitMember(method);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-primary/30">
            <h2 className="text-2xl font-bold mb-4">Recrutar Membro</h2>
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
                <input type="radio" name="method" value="mission" checked={method === 'mission'} onChange={() => setMethod('mission')} />
                <div><span className="font-bold">Missão de Recrutamento</span><p className="text-xs text-gray-400">Custo: R$5.000 sujo • Aguardar 1h • Chance: 60% Comum, 25% Raro, 10% Épico, 4% Lendário, 1% Mítico</p></div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
                <input type="radio" name="method" value="market" checked={method === 'market'} onChange={() => setMethod('market')} />
                <div><span className="font-bold">Mercado Negro</span><p className="text-xs text-gray-400">Custo: R$50.000 limpo • Instantâneo • Chance: 40% Comum, 35% Raro, 15% Épico, 8% Lendário, 2% Mítico</p></div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
                <input type="radio" name="method" value="premium" checked={method === 'premium'} onChange={() => setMethod('premium')} />
                <div><span className="font-bold">Recrutamento Premium</span><p className="text-xs text-gray-400">Custo: 10 Coins • Garantido Épico+ • Instantâneo</p></div>
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 bg-gray-700 py-2 rounded">Cancelar</button>
              <button onClick={handleRecruit} disabled={isLoading} className="flex-1 bg-primary text-black font-bold py-2 rounded flex justify-center items-center gap-2">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Recrutar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}