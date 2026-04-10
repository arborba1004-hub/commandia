import { useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { motion } from 'framer-motion';
import { syncPlayerUpdate } from '@/api/playerApi';

export default function BarracoPage() {
  const player = usePlayerStore((state) => state.player);
  const setPlayer = usePlayerStore((state) => state.setPlayer);

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!player) {
    return (
      <div className="min-h-screen w-full bg-black text-white flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  const level = player.niveis?.barracoLevel || 1;
  const cleanMoney = player.balances?.cleanMoney || 0;

  const BASE_COST = 500;
  const MULTIPLIER = 1.1;

  const getUpgradeCost = () => {
    return Math.floor(BASE_COST * Math.pow(MULTIPLIER, level - 1));
  };

  const upgradeCost = getUpgradeCost();
  const canUpgrade = cleanMoney >= upgradeCost && !isUpgrading;

  const handleUpgrade = async () => {
    if (!canUpgrade) return;

    setError(null);
    setIsUpgrading(true);

    const optimisticPlayer = {
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

    // atualiza imediatamente na UI
    setPlayer(optimisticPlayer);

    try {
      const response = await syncPlayerUpdate({
        niveis: {
          ...player.niveis,
          barracoLevel: level + 1,
        },
        balances: {
          ...player.balances,
          cleanMoney: cleanMoney - upgradeCost,
        },
      });

      // garante que o store fique com o que o backend devolveu
      setPlayer(response.player);
    } catch (err: any) {
      // rollback
      setPlayer(player);
      setError(err?.message || 'Erro ao evoluir barraco');
    } finally {
      setIsUpgrading(false);
    }
  };

  const getBarracoName = () => {
    if (level >= 100) return 'Castelo do Comando';
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

  const getBarracoBackground = () => {
    if (level >= 50) return 'https://static.wixstatic.com/media/50f4bf_3c9e1deb59cf452082208ca73e67f5e3~mv2.png';
    if (level >= 40) return 'https://static.wixstatic.com/media/50f4bf_3c9e1deb59cf452082208ca73e67f5e3~mv2.png';
    if (level >= 30) return 'https://static.wixstatic.com/media/50f4bf_075716a4a53c4e6485d5bd6908c747d2~mv2.png';
    if (level >= 20) return 'https://static.wixstatic.com/media/50f4bf_8c577469a4574d2cbb5629916dedfa1f~mv2.png';
    if (level >= 10) return 'https://static.wixstatic.com/media/50f4bf_ca65335e8bd6441aa02cbe33d80b8e7f~mv2.png';
    return 'https://static.wixstatic.com/media/50f4bf_60eb2c207ac34e87aeb995a339f40eda~mv2.png';
  };

  const getBarracoModel = () => {
    if (level >= 50) return 'https://static.wixstatic.com/3d/50f4bf_815f96c9cc12483791282cc3b64ce96f.glb';
    if (level >= 40) return 'https://static.wixstatic.com/3d/50f4bf_676c492cb62e4eb0baf04e16492966cc.glb';
    if (level >= 30) return 'https://static.wixstatic.com/3d/50f4bf_f78d5d13df3d4a9e9b62061425cc4f30.glb';
    if (level >= 20) return 'https://static.wixstatic.com/3d/50f4bf_a089f0d52f38465f8db77877509f12d6.glb';
    if (level >= 10) return 'https://static.wixstatic.com/3d/50f4bf_e10d19cfeff147ce95eee1d04a31b04a.glb';
    return 'https://static.wixstatic.com/3d/50f4bf_0a763db5131547a588ce702d6de0a388.glb';
  };

  return (
    <div
      className="min-h-screen w-full text-white flex flex-col items-center justify-center p-6 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('${getBarracoBackground()}')`,
      }}
    >
      <motion.div
        className="w-full max-w-md bg-black/70 rounded-2xl p-6 shadow-xl border border-white/10 backdrop-blur-sm"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h1 className="text-xl font-bold mb-2 text-center">🏠 Seu Barraco</h1>

        <p className="text-center text-sm opacity-70 mb-4">{getBarracoName()}</p>

        <div className="text-center mb-6">
          <span className="text-3xl font-bold">Nível {level}</span>
        </div>

        <div className="mb-6 text-center">
          <p className="text-sm opacity-70">Custo do upgrade</p>
          <p className="text-lg font-bold text-emerald-400">
            {upgradeCost.toLocaleString('pt-BR')} 💰
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <button
          onClick={handleUpgrade}
          disabled={!canUpgrade}
          className={`w-full py-3 rounded-xl font-bold transition ${
            canUpgrade
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'bg-gray-700 opacity-50 cursor-not-allowed'
          }`}
        >
          {isUpgrading ? 'Evoluindo...' : 'Evoluir Barraco'}
        </button>
      </motion.div>
    </div>
  );
}