import { useEffect, useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { motion } from 'framer-motion';

export default function BarracoPage() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const player = usePlayerStore((state) => state.player);
  const setPlayer = usePlayerStore((state) => state.setPlayer);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const loadPlayer = usePlayerStore((state) => state.loadPlayer);

  useEffect(() => {
    if (!isLoaded) {
      loadPlayer();
    }
  }, [isLoaded, loadPlayer]);

  if (!isLoaded || !player?._id) {
    return (
      <div className="min-h-screen w-full bg-black text-white flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  // ÚNICA FONTE: playerStore
  const level = player.niveis.barracoLevel;
  const cleanMoney = player.balances.cleanMoney;

  const BASE_COST = 500;
  const MULTIPLIER = 1.115;

  const getUpgradeCost = () => {
    return Math.floor(BASE_COST * Math.pow(MULTIPLIER, level - 1));
  };

  const upgradeCost = getUpgradeCost();

  const canUpgrade = cleanMoney >= upgradeCost;

  const handleUpgrade = () => {
    if (!canUpgrade || !player) return;

    const updatedPlayer = {
      ...player,
      niveis: {
        ...player.niveis,
        barracoLevel: level + 1,
      },
      balances: {
        ...player.balances,
        cleanMoney: cleanMoney - upgradeCost,
      },
    };

    setPlayer(updatedPlayer);
    setShowSuccessModal(true);
  };

  const getBarracoName = () => {
    if (level >= 90) return 'Mansão com Heliporto';
    if (level >= 80) return 'Mansão Blindada';
    if (level >= 70) return 'Mansão do Complexo';
    if (level >= 60) return 'Triplex com Piscina';
    if (level >= 50) return 'Triplex Alto Padrão';
    if (level >= 40) return 'Sobrado de Luxo';
    if (level >= 30) return 'Sobrado com Piscina';
    if (level >= 20) return 'Sobrado';
    if (level >= 10) return 'Casa de Alvenaria';
    return 'Barraco Inicial';
  };

  return (
    <div 
      className="min-h-screen w-full text-white flex flex-col items-center justify-center p-6 bg-cover bg-center bg-no-repeat pt-[140px] md:pt-[160px]"
      style={{
        backgroundImage: `url('https://static.wixstatic.com/media/50f4bf_83a2805595564007a2ade265972e89c6~mv2.png')`,
      }}
    >
      <motion.div
        className="w-full max-w-md bg-black/70 rounded-2xl p-6 shadow-xl border border-white/10 backdrop-blur-sm"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h1 className="text-xl font-bold mb-2 text-center">
          🏠 Seu Barraco
        </h1>

        <p className="text-center text-sm opacity-70 mb-4">
          {getBarracoName()}
        </p>

        <div className="text-center mb-6">
          <span className="text-3xl font-bold">
            Nível {level}
          </span>
        </div>

        <div className="mb-6 text-center">
          <p className="text-sm opacity-70">
            Custo do upgrade
          </p>
          <p className="text-lg font-bold text-emerald-400">
            {upgradeCost.toLocaleString('pt-BR')} 💰
          </p>
        </div>

        <button
          onClick={handleUpgrade}
          disabled={!canUpgrade}
          className={`w-full py-3 rounded-xl font-bold transition ${
            canUpgrade
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'bg-gray-700 opacity-50 cursor-not-allowed'
          }`}
        >
          Evoluir Barraco
        </button>
      </motion.div>

      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-md rounded-2xl bg-zinc-900 p-6 shadow-2xl border border-emerald-500/30"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white text-xl font-bold flex items-center justify-center"
              aria-label="Fechar modal"
            >
              ×
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4 text-emerald-400">
                🎉 Parabéns!
              </h2>
              <p className="text-white mb-2">
                Seu barraco evoluiu para o nível {level + 1}!
              </p>
              <p className="text-sm opacity-70 mb-6">
                {getBarracoName()}
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-bold transition"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
