import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Zap, Coins, Flame, Trophy, Target } from 'lucide-react';
import { useGangStore } from '@/store/gangStore';
import type { GangMember } from '@/types/gang';

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

  const expGain = usePremium ? 500 : 100;
  const cost = usePremium ? '5 Coins' : 'R$ 2.000 sujo';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay escuro com blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50"
            onClick={onClose}
          />

          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', bounce: 0.1, duration: 0.5 }}
              className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              {/* Header com energia */}
              <div className="relative h-32 bg-gradient-to-br from-orange-950 via-red-950 to-black flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#ffffff10_0%,transparent_70%)]" />
                
                <div className="text-center relative z-10">
                  <div className="flex justify-center mb-3">
                    <div className="p-4 bg-orange-500/10 rounded-full border border-orange-500/30">
                      <Dumbbell size={42} className="text-orange-400" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter">TREINAMENTO</h2>
                  <p className="text-orange-400 font-medium mt-1">{member.name}</p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Status atual do membro */}
                <div className="bg-zinc-900/70 rounded-2xl p-5 border border-white/5">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 text-sm">Nível atual</p>
                      <p className="text-4xl font-black text-white">Lv. {member.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Progresso</p>
                      <p className="font-mono text-lg">
                        {member.exp} / {member.expToNext}
                      </p>
                    </div>
                  </div>

                  {/* Barra de EXP */}
                  <div className="mt-4 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${Math.min((member.exp / member.expToNext) * 100, 100)}%` 
                      }}
                      className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                    />
                  </div>
                </div>

                {/* Opções de treino */}
                <div className="space-y-3">
                  {/* Treino Normal */}
                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setUsePremium(false)}
                    className={`block p-5 rounded-2xl border cursor-pointer transition-all ${
                      !usePremium 
                        ? 'border-orange-500 bg-orange-950/40 shadow-lg shadow-orange-500/20' 
                        : 'border-white/10 bg-zinc-900/60 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-zinc-800 rounded-xl">
                        <Target size={28} className="text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-bold text-lg">Treino de Rua</p>
                          <p className="text-emerald-400 font-medium">+100 EXP</p>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">Custo: R$ 2.000 sujo</p>
                        <p className="text-xs text-gray-500">Treino básico nas ruas da cidade</p>
                      </div>
                    </div>
                  </motion.label>

                  {/* Treino Premium */}
                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setUsePremium(true)}
                    className={`block p-5 rounded-2xl border cursor-pointer transition-all ${
                      usePremium 
                        ? 'border-purple-500 bg-purple-950/40 shadow-lg shadow-purple-500/20' 
                        : 'border-white/10 bg-zinc-900/60 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-xl">
                        <Flame size={28} className="text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-lg flex items-center gap-2">
                              Treino Intensivo 
                              <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">PREMIUM</span>
                            </p>
                            <p className="text-sm text-gray-400">+500 EXP + chance de bônus</p>
                          </div>
                          <p className="text-purple-400 font-medium text-right">5 Coins</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Treinamento hardcore com especialistas</p>
                      </div>
                    </div>
                  </motion.label>
                </div>

                {/* Resumo */}
                <div className="bg-black/50 rounded-2xl p-4 text-sm border border-white/5">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400">Ganho de EXP:</span>
                    <span className="font-bold text-emerald-400">+{expGain}</span>
                  </div>
                  <div className="flex justify-between py-1 border-t border-white/10">
                    <span className="text-gray-400">Custo:</span>
                    <span className="font-medium">{cost}</span>
                  </div>
                </div>
              </div>

              {/* Botões */}
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
                  onClick={handleTrain}
                  className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 
                             text-black font-bold rounded-2xl flex items-center justify-center gap-3 transition-all"
                >
                  <Zap size={22} />
                  CONFIRMAR TREINO
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}