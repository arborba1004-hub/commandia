import { usePlayerStore } from '@/store/playerStore';
import { motion } from 'framer-motion';

const BASE_COST = 500;
const MULTIPLIER = 1.1;
const MAX_LEVEL = 100;

function getUpgradeCost(level: number) {
  return Math.floor(BASE_COST * Math.pow(MULTIPLIER, level - 1));
}

function getBarracoName(level: number) {
  if (level >= 100) return 'Mansão Blindada com Heliporto';
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
}

function getNextMilestone(level: number) {
  if (level >= 100) {
    return {
      targetLevel: 100,
      name: 'Nível máximo atingido',
    };
  }

  if (level < 10) return { targetLevel: 10, name: 'Casa de Alvenaria' };
  if (level < 20) return { targetLevel: 20, name: 'Sobrado' };
  if (level < 30) return { targetLevel: 30, name: 'Sobrado com Piscina' };
  if (level < 40) return { targetLevel: 40, name: 'Sobrado de Luxo' };
  if (level < 50) return { targetLevel: 50, name: 'Triplex Alto Padrão' };
  if (level < 60) return { targetLevel: 60, name: 'Triplex com Piscina' };
  if (level < 70) return { targetLevel: 70, name: 'Mansão do Complexo' };
  if (level < 80) return { targetLevel: 80, name: 'Mansão Blindada' };
  if (level < 90) return { targetLevel: 90, name: 'Mansão com Heliporto' };
  return { targetLevel: 100, name: 'Mansão Blindada com Heliporto' };
}

export default function BarracoPage() {
  const { player, setPlayer } = usePlayerStore();

  const level = player.niveis.barracoLevel;
  const cleanMoney = player.balances.cleanMoney;

  const isMaxLevel = level >= MAX_LEVEL;
  const upgradeCost = isMaxLevel ? 0 : getUpgradeCost(level);
  const canUpgrade = !isMaxLevel && cleanMoney >= upgradeCost;
  const missingMoney = Math.max(0, upgradeCost - cleanMoney);
  const nextMilestone = getNextMilestone(level);

  const handleUpgrade = () => {
    if (isMaxLevel || !canUpgrade) return;

    setPlayer({
      niveis: {
        ...player.niveis,
        barracoLevel: level + 1,
      },
      balances: {
        ...player.balances,
        cleanMoney: cleanMoney - upgradeCost,
      },
    });
  };

  return (
    <div
      className="min-h-screen w-full text-white flex flex-col items-center justify-center p-6 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "url('https://static.wixstatic.com/media/50f4bf_83a2805595564007a2ade265972e89c6~mv2.png')",
      }}
    >
      <motion.div
        className="w-full max-w-md bg-black/70 rounded-2xl p-6 shadow-xl border border-white/10 backdrop-blur-sm"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h1 className="text-xl font-bold mb-2 text-center">🏠 Seu Barraco</h1>

        <p className="text-center text-sm opacity-70 mb-4">{getBarracoName(level)}</p>

        <div className="text-center mb-6">
          <span className="text-3xl font-bold">Nível {level}</span>
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-sm opacity-70 mb-1">Saldo disponível</p>
          <p className="text-xl font-bold text-emerald-400">
            R$ {cleanMoney.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-sm opacity-70 mb-1">Próximo marco</p>
          <p className="text-lg font-bold text-primary">
            {nextMilestone.name}
            {!isMaxLevel ? ` · nível ${nextMilestone.targetLevel}` : ''}
          </p>
        </div>

        <div className="mb-6 text-center rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm opacity-70">Custo do upgrade</p>
          <p className="text-lg font-bold text-emerald-400">
            {isMaxLevel ? 'MAX' : `R$ ${upgradeCost.toLocaleString('pt-BR')}`}
          </p>

          {!isMaxLevel && !canUpgrade && (
            <p className="text-sm text-red-400 mt-2">
              Faltam R$ {missingMoney.toLocaleString('pt-BR')}
            </p>
          )}
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
          {isMaxLevel
            ? 'Nível Máximo'
            : canUpgrade
              ? 'Evoluir Barraco'
              : 'Saldo Insuficiente'}
        </button>
      </motion.div>
    </div>
  );
}