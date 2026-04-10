import { useEffect } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { motion } from 'framer-motion';

export default function BarracoPage() {
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
      className="min-h-screen w-full text-white flex flex-col items-center justify-center p-6 bg-cover bg-center bg-no-repeat"
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
    </div>
  );
}
