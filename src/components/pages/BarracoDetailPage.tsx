import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';


export default function BarracoDetailPage() {
  const navigate = useNavigate();

  const player = usePlayerStore((state) => state.player);
  const upgradeBarracoLocal = usePlayerStore((state) => state.upgradeBarracoLocal);
  const syncPlayerToBackend = usePlayerStore((state) => state.syncPlayerToBackend);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const loadPlayer = usePlayerStore((state) => state.loadPlayer);

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded) {
    void loadPlayer();

    return (
      <div className="min-h-screen w-full bg-black text-white flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  const level = player?.niveis?.barracoLevel || 1;
  const cleanMoney = Number(player?.balances?.cleanMoney || 0);
  const requirements = getBarracoUpgradeRequirements(player);
  const upgradeCost = requirements.cost;
  const canUpgrade = requirements.allowed && !isUpgrading;

  const handleUpgrade = async () => {
    if (!canUpgrade) return;

    setError(null);
    setIsUpgrading(true);

    try {
      const result = upgradeBarracoLocal();

      if (!result.ok) {
        setError(result.reason || 'Erro ao evoluir barraco');
        return;
      }

      await syncPlayerToBackend();
    } catch (err: any) {
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

  const getBarracoDescription = () => {
    const descriptions: { [key: number]: string } = {
      1: 'Um barraco simples, mas é seu. Aqui tudo começou.',
      10: 'Uma casa de alvenaria. Já está melhorando!',
      20: 'Um sobrado decente. Você está subindo na vida.',
      30: 'Um sobrado com piscina. Luxo básico.',
      40: 'Um sobrado de luxo. Você está ficando rico.',
      50: 'Um triplex alto padrão. Você é alguém importante.',
      60: 'Um triplex com piscina. A vida é boa.',
      70: 'Uma mansão do complexo. Você é um chefe.',
      80: 'Uma mansão blindada. Segurança em primeiro lugar.',
      90: 'Uma mansão com heliporto. Você é praticamente um rei.',
      100: 'Um castelo do comando. Você é o topo da hierarquia.',
    };

    for (let i = 100; i >= 1; i--) {
      if (level >= i && descriptions[i]) {
        return descriptions[i];
      }
    }

    return descriptions[1];
  };

  const getNextLevelName = () => {
    const nextLevel = level + 1;
    if (nextLevel >= 100) return 'Castelo do Comando';
    if (nextLevel >= 90) return 'Mansão com Heliporto';
    if (nextLevel >= 80) return 'Mansão Blindada';
    if (nextLevel >= 70) return 'Mansão do Complexo';
    if (nextLevel >= 60) return 'Triplex com Piscina';
    if (nextLevel >= 50) return 'Triplex Alto Padrão';
    if (nextLevel >= 40) return 'Sobrado de Luxo';
    if (nextLevel >= 30) return 'Sobrado com Piscina';
    if (nextLevel >= 20) return 'Sobrado';
    if (nextLevel >= 10) return 'Casa de Alvenaria';
    return 'Barraco Inicial';
  };

  return (
    <div
      className="min-h-screen w-full text-white flex flex-col items-center justify-center p-6 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('${getBarracoBackground()}')`,
      }}
    >
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => navigate('/barraco')}
          className="flex items-center gap-2 mb-6 text-foreground hover:text-primary transition-colors font-heading uppercase tracking-wider"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="bg-black/80 rounded-2xl p-8 shadow-xl border border-white/10 backdrop-blur-sm">
          <h1 className="text-4xl font-bold mb-2 text-center font-heading uppercase tracking-wider">
            🏠 {getBarracoName()}
          </h1>

          <p className="text-center text-lg opacity-70 mb-6 font-paragraph">
            Nível {level}
          </p>

          <div className="mb-8 p-6 rounded-xl bg-white/5 border border-white/10">
            <p className="text-center text-base leading-relaxed font-paragraph">
              {getBarracoDescription()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-emerald-900/30 border border-emerald-500/20">
              <p className="text-xs opacity-70 font-heading uppercase tracking-wider mb-2">
                Seu Dinheiro Limpo
              </p>
              <p className="text-2xl font-bold text-emerald-400">
                {cleanMoney.toLocaleString('pt-BR')} 💰
              </p>
            </div>

            <div className="p-4 rounded-xl bg-blue-900/30 border border-blue-500/20">
              <p className="text-xs opacity-70 font-heading uppercase tracking-wider mb-2">
                Custo do Upgrade
              </p>
              <p className="text-2xl font-bold text-blue-400">
                {upgradeCost.toLocaleString('pt-BR')} 💰
              </p>
            </div>
          </div>

          <div className="mb-8 p-6 rounded-xl bg-purple-900/30 border border-purple-500/20">
            <p className="text-xs opacity-70 font-heading uppercase tracking-wider mb-2">
              Próximo Nível
            </p>
            <p className="text-xl font-bold text-purple-300">{getNextLevelName()}</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          

          <button
            onClick={handleUpgrade}
            disabled={!canUpgrade}
            className={`w-full py-4 rounded-xl font-bold font-heading uppercase tracking-wider transition text-lg ${
              canUpgrade
                ? 'bg-emerald-500 hover:bg-emerald-600 text-black'
                : 'bg-gray-700 opacity-50 cursor-not-allowed text-white'
            }`}
          >
            {isUpgrading ? 'Evoluindo...' : 'Evoluir Barraco'}
          </button>

          {!requirements.allowed && cleanMoney < upgradeCost && (
            <p className="text-center text-sm text-red-300 mt-4 font-paragraph">
              Você precisa de {(upgradeCost - cleanMoney).toLocaleString('pt-BR')} 💰 a mais
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}