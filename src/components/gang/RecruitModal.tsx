import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Clock, Zap, Crown, Skull, Target } from 'lucide-react';
import { useGangStore } from '@/store/gangStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const recruitOptions = [
  {
    id: 'mission' as const,
    title: 'Missão de Recrutamento',
    icon: Target,
    cost: 'R$ 5.000 sujo',
    time: 'Aguarda 1 hora',
    description: 'Recrutamento clássico nas ruas. Risco e recompensa equilibrados.',
    chances: [
      { rarity: 'Comum', percent: 60, color: 'text-gray-400' },
      { rarity: 'Raro', percent: 25, color: 'text-blue-400' },
      { rarity: 'Épico', percent: 10, color: 'text-purple-400' },
      { rarity: 'Lendário', percent: 4, color: 'text-orange-400' },
      { rarity: 'Mítico', percent: 1, color: 'text-red-400' },
    ],
    bg: 'from-amber-950/80 to-gray-900',
    border: 'border-amber-500/30',
  },
  {
    id: 'market' as const,
    title: 'Mercado Negro',
    icon: Skull,
    cost: 'R$ 50.000 limpo',
    time: 'Instantâneo',
    description: 'Contatos duvidosos entregam membros mais qualificados.',
    chances: [
      { rarity: 'Comum', percent: 40, color: 'text-gray-400' },
      { rarity: 'Raro', percent: 35, color: 'text-blue-400' },
      { rarity: 'Épico', percent: 15, color: 'text-purple-400' },
      { rarity: 'Lendário', percent: 8, color: 'text-orange-400' },
      { rarity: 'Mítico', percent: 2, color: 'text-red-400' },
    ],
    bg: 'from-red-950/80 to-gray-900',
    border: 'border-red-500/30',
  },
  {
    id: 'premium' as const,
    title: 'Recrutamento Premium',
    icon: Crown,
    cost: '10 Coins',
    time: 'Instantâneo',
    description: 'O melhor que o dinheiro pode comprar. Garantia de qualidade.',
    chances: [
      { rarity: 'Épico', percent: 60, color: 'text-purple-400' },
      { rarity: 'Lendário', percent: 30, color: 'text-orange-400' },
      { rarity: 'Mítico', percent: 10, color: 'text-red-400' },
    ],
    bg: 'from-purple-950/80 to-gray-900',
    border: 'border-purple-500/40',
    highlight: true,
  },
];

export default function RecruitModal({ isOpen, onClose }: Props) {
  const { recruitMember, isLoading } = useGangStore();
  const [selectedMethod, setSelectedMethod] = useState<'mission' | 'market' | 'premium'>('mission');

  const handleRecruit = async () => {
    await recruitMember(selectedMethod);
    onClose();
  };

  const selectedOption = recruitOptions.find((opt) => opt.id === selectedMethod)!;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 40 }}
              transition={{ type: 'spring', bounce: 0.05, duration: 0.6 }}
              className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              {/* Header com glow */}
              <div className="relative h-28 bg-gradient-to-br from-zinc-900 to-black flex items-end justify-center pb-6 border-b border-white/10">
                <div className="absolute inset-0 bg-[radial-gradient(at_center,#ffffff08_0%,transparent_70%)]" />
                <div className="text-center">
                  <h2 className="text-3xl font-black tracking-tighter">RECRUTAR MEMBRO</h2>
                  <p className="text-gray-400 text-sm mt-1">Escolha seu método de recrutamento</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {recruitOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedMethod === option.id;

                  return (
                    <motion.label
                      key={option.id}
                      whileHover={{ scale: isSelected ? 1 : 1.02 }}
                      onClick={() => setSelectedMethod(option.id)}
                      className={`
                        block p-5 rounded-2xl cursor-pointer border transition-all duration-300
                        ${isSelected 
                          ? `border-primary shadow-lg shadow-primary/20 ${option.border}` 
                          : `border-white/10 hover:border-white/30 bg-zinc-900/70`
                        }
                        ${option.highlight ? 'ring-1 ring-purple-500/50' : ''}
                      `}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${option.highlight ? 'bg-purple-500/10' : 'bg-zinc-800'}`}>
                          <Icon size={28} className={option.highlight ? 'text-purple-400' : 'text-gray-300'} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-lg">{option.title}</h3>
                            <span className="text-xs font-mono bg-black/60 px-3 py-1 rounded-full text-gray-400">
                              {option.time}
                            </span>
                          </div>

                          <p className="text-sm text-gray-400 mt-1 mb-3">{option.description}</p>

                          <div className="text-xs text-gray-400 mb-1">Custo:</div>
                          <p className="font-medium text-white">{option.cost}</p>

                          {/* Chances */}
                          <div className="mt-4">
                            <div className="text-xs text-gray-500 mb-2">CHANCES DE RARIDADE</div>
                            <div className="flex flex-wrap gap-2">
                              {option.chances.map((chance) => (
                                <div key={chance.rarity} className="text-[10px] px-3 py-1 bg-black/50 rounded-lg">
                                  <span className={chance.color}>{chance.rarity}</span>
                                  <span className="text-gray-500 ml-1">({chance.percent}%)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.label>
                  );
                })}
              </div>

              {/* Footer Actions */}
              <div className="border-t border-white/10 p-6 flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 font-medium rounded-2xl transition-colors"
                >
                  Cancelar
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRecruit}
                  disabled={isLoading}
                  className="flex-1 py-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-700 
                             disabled:from-zinc-700 disabled:to-zinc-700 text-black font-bold rounded-2xl 
                             flex items-center justify-center gap-3 transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={22} />
                      Recrutando...
                    </>
                  ) : (
                    <>
                      <Zap size={22} />
                      CONFIRMAR RECRUTAMENTO
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}