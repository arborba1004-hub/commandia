import { useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  getBarracoGangStatsBonusPercent,
  getBarracoName,
  getBarracoUpgradeRequirements,
  getNextBarracoGangStatsBonusPercent,
  MAX_BARRACO_LEVEL,
} from '@/services/barracoProgressionService';

export default function BarracoPage() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradedToLevel, setUpgradedToLevel] = useState<number | null>(null);
  const player = usePlayerStore((state) => state.player);
  const upgradeBarracoLocal = usePlayerStore((state) => state.upgradeBarracoLocal);
  const isLoaded = usePlayerStore((state) => state.isLoaded);

  if (!isLoaded || !player?._id) {
    return (
      <>
        <Header />
        <div className="min-h-screen w-full bg-black text-white flex items-center justify-center pt-[140px] md:pt-[160px]">
          Carregando...
        </div>
        <Footer />
      </>
    );
  }

  // ÚNICA FONTE: playerStore
  const level = player.niveis.barracoLevel;

  const requirements = getBarracoUpgradeRequirements(player);
  const upgradeCost = requirements.cost;
  const canUpgrade = requirements.allowed;
  const cleanMoney = Number(player?.balances?.cleanMoney ?? 0);
  const nextLevel = Math.min(MAX_BARRACO_LEVEL, level + 1);
  const isMaxLevel = level >= MAX_BARRACO_LEVEL;
  const missingCleanMoney = Math.max(0, upgradeCost - cleanMoney);
  const currentGangStatsBonus = getBarracoGangStatsBonusPercent(level);
  const nextGangStatsBonus = getNextBarracoGangStatsBonusPercent(level);

  const handleUpgrade = async () => {
    if (isUpgrading) return;

    setIsUpgrading(true);
    setUpgradeError('');

    try {
      const currentLevel = level;
      const result = await upgradeBarracoLocal();

      if (!result?.ok) {
        setUpgradeError(result?.reason || 'Não foi possível evoluir o barraco.');
        return;
      }

      setUpgradedToLevel(result.currentLevel ?? currentLevel + 1);
      setShowSuccessModal(true);
    } catch (error) {
      setUpgradeError(error instanceof Error ? error.message : 'Erro ao evoluir barraco');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <>
      <Header />
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
            {getBarracoName(level)}
          </p>

          <div className="text-center mb-6">
            <span className="text-3xl font-bold">
              Nível {level}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/20 p-3 text-center">
              <p className="text-xs opacity-70">Seu dinheiro limpo</p>
              <p className="text-lg font-bold text-emerald-400">
                {cleanMoney.toLocaleString('pt-BR')} 💰
              </p>
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-900/20 p-3 text-center">
              <p className="text-xs opacity-70">Custo do upgrade</p>
              <p className="text-lg font-bold text-blue-400">
                {upgradeCost.toLocaleString('pt-BR')} 💰
              </p>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-xs opacity-60">Próximo estágio</p>
            <p className="font-bold">
              {isMaxLevel ? 'Topo absoluto do comando' : `Nível ${nextLevel} · ${getBarracoName(nextLevel)}`}
            </p>
          </div>

          <div className="mb-6 rounded-xl border border-orange-500/20 bg-orange-950/30 p-3 text-center">
            <p className="text-xs opacity-70">Bônus do barraco na gangue</p>
            <p className="text-lg font-bold text-orange-300">
              +{currentGangStatsBonus}% em Rajada, Blindagem, Fôlego e Quebra
            </p>
            {!isMaxLevel && (
              <p className="text-xs opacity-70 mt-1">
                Próximo nível: +{nextGangStatsBonus}% para os 8 membros da gangue
              </p>
            )}
          </div>

          <button
            onClick={handleUpgrade}
            disabled={!canUpgrade || isUpgrading}
            className={`w-full py-3 rounded-xl font-bold transition ${
              canUpgrade && !isUpgrading
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-gray-700 opacity-50 cursor-not-allowed'
            }`}
          >
            {isUpgrading ? 'Evoluindo...' : isMaxLevel ? 'Nível máximo atingido' : 'Evoluir Barraco'}
          </button>

          {upgradeError && (
            <p className="mt-3 text-center text-sm text-red-400">
              {upgradeError}
            </p>
          )}

          {!canUpgrade && !upgradeError && (
            <p className="mt-3 text-center text-sm text-yellow-400">
              {missingCleanMoney > 0
                ? `Faltam ${missingCleanMoney.toLocaleString('pt-BR')} 💰 de dinheiro limpo.`
                : requirements.reason}
            </p>
          )}
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
                onClick={() => {
                  setShowSuccessModal(false);
                  setUpgradedToLevel(null);
                }}
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
                  Seu barraco evoluiu para o nível {upgradedToLevel ?? level}!
                </p>
                <p className="text-sm opacity-70 mb-2">
                  {getBarracoName(upgradedToLevel ?? level)}
                </p>
                <p className="text-sm text-orange-300 mb-6">
                  Bônus da gangue atualizado para +{getBarracoGangStatsBonusPercent(upgradedToLevel ?? level)}% em Rajada, Blindagem, Fôlego e Quebra.
                </p>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setUpgradedToLevel(null);
                  }}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-bold transition"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
      <Footer />
    </>
  );
}
