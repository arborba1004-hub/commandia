import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Model3D } from '@/components/Model3D';
import {
  formatBarracoDuration,
  getBarracoGangStatsBonusPercent,
  getBarracoUpgradeRemainingMs,
  getBarracoUpgradeRequirements,
  getNextBarracoGangStatsBonusPercent,
  isBarracoUpgradeReady,
} from '@/services/barracoProgressionService';

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
  const claimBarracoUpgradeLocal = usePlayerStore((state) => state.claimBarracoUpgradeLocal);
  const accelerateBarracoUpgradeLocal = usePlayerStore((state) => state.accelerateBarracoUpgradeLocal);
  const isLoaded = usePlayerStore((state) => state.isLoaded);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());

  const activeUpgrade = player?.barracoUpgrade?.active === true;

  useEffect(() => {
    if (!activeUpgrade) return;
    const interval = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [activeUpgrade]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen w-full bg-black text-white flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  void nowTick;

  const level = Number(player?.niveis?.barracoLevel || 1);
  const cleanMoney = Number(player?.balances?.cleanMoney || 0);
  const requirements = getBarracoUpgradeRequirements(player);
  const upgradeCost = requirements.cost;
  const modelUrl = getBarracoModelUrl(level);
  const currentGangStatsBonus = getBarracoGangStatsBonusPercent(level);
  const nextGangStatsBonus = getNextBarracoGangStatsBonusPercent(level);
  const activeOperation = player.barracoUpgrade;
  const remainingMs = getBarracoUpgradeRemainingMs(activeOperation);
  const isUpgradeReady = isBarracoUpgradeReady(activeOperation);
  const targetLevel = activeOperation?.toLevel || level + 1;
  const acceleratorSeconds = Math.max(0, Math.floor(Number(player?.barracoAccelerators?.seconds ?? 0)));
  const canStartUpgrade = requirements.allowed && !activeUpgrade && !isSubmitting;
  const canClaimUpgrade = activeUpgrade && isUpgradeReady && !isSubmitting;
  const canAccelerate = activeUpgrade && !isUpgradeReady && acceleratorSeconds > 0 && !isSubmitting;
  const accelerationToUseSeconds = Math.max(0, Math.min(acceleratorSeconds, Math.ceil(remainingMs / 1000)));

  const handleStartUpgrade = async () => {
    if (!canStartUpgrade) return;

    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      const result = await upgradeBarracoLocal();

      if (!result.ok) {
        setError(result.reason || 'Erro ao iniciar evolução do barraco');
        return;
      }

      setNotice(result.message || `Obra iniciada para o nível ${result.targetLevel || level + 1}.`);
    } catch (err: any) {
      setError(err?.message || 'Erro ao iniciar evolução do barraco');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimUpgrade = async () => {
    if (!canClaimUpgrade) return;

    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      const result = await claimBarracoUpgradeLocal();

      if (!result.ok) {
        setError(result.reason || 'Erro ao finalizar evolução do barraco');
        return;
      }

      setNotice(result.message || `Barraco evoluído para o nível ${result.currentLevel || targetLevel}.`);
    } catch (err: any) {
      setError(err?.message || 'Erro ao finalizar evolução do barraco');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccelerate = async () => {
    if (!canAccelerate || accelerationToUseSeconds <= 0) return;

    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      const result = await accelerateBarracoUpgradeLocal(accelerationToUseSeconds);

      if (!result.ok) {
        setError(result.reason || 'Erro ao usar acelerador do barraco');
        return;
      }

      setNotice(result.message || 'Acelerador aplicado na evolução do barraco.');
    } catch (err: any) {
      setError(err?.message || 'Erro ao usar acelerador do barraco');
    } finally {
      setIsSubmitting(false);
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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

            <div className="mb-4 p-6 rounded-xl bg-purple-900/30 border border-purple-500/20">
              <p className="text-xs opacity-70 font-heading uppercase tracking-wider mb-2">
                Próximo Nível
              </p>
              <p className="text-xl font-bold text-purple-300">
                {getNextLevelName(level)}
              </p>
              {!activeUpgrade && (
                <p className="text-sm opacity-70 mt-2 font-paragraph">
                  Tempo de obra: {formatBarracoDuration(requirements.durationMs)}
                </p>
              )}
            </div>

            {activeUpgrade && (
              <div className={`mb-4 p-6 rounded-xl border ${isUpgradeReady ? 'bg-emerald-950/30 border-emerald-500/20' : 'bg-yellow-950/30 border-yellow-500/20'}`}>
                <p className="text-xs opacity-70 font-heading uppercase tracking-wider mb-2">
                  {isUpgradeReady ? 'Evolução pronta' : 'Obra em andamento'}
                </p>
                <p className="text-xl font-bold">
                  Nível {activeOperation?.fromLevel || level} → {targetLevel}
                </p>
                <p className={`text-sm mt-2 font-paragraph ${isUpgradeReady ? 'text-emerald-300' : 'text-yellow-300'}`}>
                  {isUpgradeReady ? 'Finalize para aplicar o nível, visual e bônus.' : `Tempo restante: ${formatBarracoDuration(remainingMs)}`}
                </p>
              </div>
            )}

            <div className="mb-6 p-6 rounded-xl bg-orange-950/40 border border-orange-500/20">
              <p className="text-xs opacity-70 font-heading uppercase tracking-wider mb-2">
                Estatísticas da Gangue
              </p>
              <p className="text-xl font-bold text-orange-300">
                +{currentGangStatsBonus}% em Rajada, Blindagem, Fôlego e Quebra
              </p>
              <p className="text-sm opacity-70 mt-2 font-paragraph">
                Cada novo nível do barraco adiciona +1% para os 8 membros da gangue.
                Próximo upgrade: +{nextGangStatsBonus}% total.
              </p>
            </div>

            {activeUpgrade && (
              <div className="mb-4 p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
                <p className="text-xs opacity-70 font-heading uppercase tracking-wider mb-2">
                  Aceleradores do Barraco
                </p>
                <p className="text-lg font-bold text-cyan-300">
                  {formatBarracoDuration(acceleratorSeconds * 1000)} disponível
                </p>
                {canAccelerate ? (
                  <button
                    onClick={handleAccelerate}
                    disabled={isSubmitting}
                    className="mt-3 w-full rounded-lg bg-cyan-500 px-3 py-2 text-sm font-bold text-black hover:bg-cyan-400 disabled:opacity-50"
                  >
                    Usar acelerador disponível
                  </button>
                ) : !isUpgradeReady ? (
                  <p className="text-xs opacity-60 mt-2 font-paragraph">
                    Sistema pronto para loja/eventos concederem aceleradores de tempo.
                  </p>
                ) : null}
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {notice && (
              <div className="mb-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-200">
                {notice}
              </div>
            )}

            {activeUpgrade ? (
              <button
                onClick={handleClaimUpgrade}
                disabled={!canClaimUpgrade}
                className={`w-full py-4 rounded-xl font-bold font-heading uppercase tracking-wider transition text-lg ${
                  canClaimUpgrade
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-black'
                    : 'bg-gray-700 opacity-50 cursor-not-allowed text-white'
                }`}
              >
                {isSubmitting ? 'Processando...' : isUpgradeReady ? 'Finalizar Evolução' : `Aguardando · ${formatBarracoDuration(remainingMs)}`}
              </button>
            ) : (
              <button
                onClick={handleStartUpgrade}
                disabled={!canStartUpgrade}
                className={`w-full py-4 rounded-xl font-bold font-heading uppercase tracking-wider transition text-lg ${
                  canStartUpgrade
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-black'
                    : 'bg-gray-700 opacity-50 cursor-not-allowed text-white'
                }`}
              >
                {isSubmitting ? 'Iniciando...' : 'Iniciar Evolução'}
              </button>
            )}

            {!activeUpgrade && !requirements.allowed && (
              <p className="text-center text-sm text-red-300 mt-4 font-paragraph">
                {cleanMoney < upgradeCost
                  ? `Você precisa de ${(upgradeCost - cleanMoney).toLocaleString('pt-BR')} 💰 a mais`
                  : requirements.reason}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
