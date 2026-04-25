import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Model3D } from '@/components/Model3D';
import { getBarracoUpgradeRequirements } from '@/services/barracoProgressionService';

const BARRACO_MODELS = [
  {
    min: 1,
    max: 9,
    url: 'https://static.wixstatic.com/3d/50f4bf_0a763db5131547a588ce702d6de0a388.glb',
  },
  {
    min: 10,
    max: 19,
    url: 'https://static.wixstatic.com/3d/50f4bf_134ce80560954ebb890dd74baed878e0.glb',
  },
  {
    min: 20,
    max: 29,
    url: 'https://static.wixstatic.com/3d/50f4bf_a089f0d52f38465f8db77877509f12d6.glb',
  },
  {
    min: 30,
    max: 39,
    url: 'https://static.wixstatic.com/3d/50f4bf_f78d5d13df3d4a9e9b62061425cc4f30.glb',
  },
  {
    min: 40,
    max: 49,
    url: 'https://static.wixstatic.com/3d/50f4bf_fcfd85e45b61474eab924ba144e1b256.glb',
  },
  {
    min: 50,
    max: 59,
    url: 'https://static.wixstatic.com/3d/50f4bf_8ddf8382a1d24e1d8003a7d851132a11.glb',
  },
  {
    min: 60,
    max: 69,
    url: 'https://static.wixstatic.com/3d/50f4bf_97904fbc3ca74bb094a29e7052c79fb4.glb',
  },
  {
    min: 70,
    max: 79,
    url: 'https://static.wixstatic.com/3d/50f4bf_5e9f2aa54cf041b29f49258cc63eb746.glb',
  },
  {
    min: 80,
    max: 89,
    url: 'https://static.wixstatic.com/3d/50f4bf_ac1c5e207bbc425f80619a581e2e2cba.glb',
  },
  {
    min: 90,
    max: 100,
    url: 'https://static.wixstatic.com/3d/50f4bf_a8dd587eba644115b376b9a0b0dc67d5.glb',
  },
];

function getBarracoModelUrl(level: number) {
  return (
    BARRACO_MODELS.find((item) => level >= item.min && level <= item.max)?.url ??
    BARRACO_MODELS[0].url
  );
}

function getBarracoName(level: number) {
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
}

function getBarracoDescription(level: number) {
  const descriptions: Record<number, string> = {
    1: 'Um barraco simples, mas é seu. Aqui tudo começou.',
    10: 'Uma casa de alvenaria. Já está melhorando.',
    20: 'Um sobrado decente. Você está subindo na vida.',
    30: 'Um sobrado com piscina. Luxo básico.',
    40: 'Um sobrado de luxo. Você está ficando rico.',
    50: 'Um triplex alto padrão. Você virou referência no morro.',
    60: 'Um triplex com piscina. A ostentação já é realidade.',
    70: 'Uma mansão do complexo. Você já impõe respeito.',
    80: 'Uma mansão blindada. Segurança e poder em outro nível.',
    90: 'Uma mansão com heliporto. Você domina tudo ao redor.',
    100: 'Um castelo do comando. Você é o topo absoluto da hierarquia.',
  };

  for (let i = 100; i >= 1; i -= 1) {
    if (level >= i && descriptions[i]) {
      return descriptions[i];
    }
  }

  return descriptions[1];
}

function getNextLevelName(level: number) {
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
}

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
    return (
      <div className="min-h-screen w-full bg-black text-white flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  const level = Number(player?.niveis?.barracoLevel || 1);
  const cleanMoney = Number(player?.balances?.cleanMoney || 0);
  const requirements = getBarracoUpgradeRequirements(player);
  const upgradeCost = requirements.cost;
  const canUpgrade = requirements.allowed && !isUpgrading;
  const modelUrl = getBarracoModelUrl(level);

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

  return (
    <div
      className="min-h-screen w-full text-white p-6"
      style={{
        background:
          'radial-gradient(circle at top, rgba(54,29,5,0.55) 0%, rgba(12,12,12,0.98) 45%, rgba(0,0,0,1) 100%)',
      }}
    >
      <motion.div
        className="w-full max-w-6xl mx-auto"
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

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="bg-black/80 rounded-2xl p-4 shadow-xl border border-white/10 backdrop-blur-sm min-h-[520px]">
            <div className="h-[460px] rounded-2xl overflow-hidden border border-white/10 bg-neutral-950">
              <Model3D modelUrl={modelUrl} />
            </div>

            <div className="mt-4 text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 font-heading uppercase tracking-wider">
                🏠 {getBarracoName(level)}
              </h1>
              <p className="text-lg opacity-70 font-paragraph">Nível {level}</p>
            </div>
          </div>

          <div className="bg-black/80 rounded-2xl p-8 shadow-xl border border-white/10 backdrop-blur-sm">
            <div className="mb-8 p-6 rounded-xl bg-white/5 border border-white/10">
              <p className="text-center text-base leading-relaxed font-paragraph">
                {getBarracoDescription(level)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
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
              <p className="text-xl font-bold text-purple-300">
                {getNextLevelName(level)}
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
        </div>
      </motion.div>
    </div>
  );
}