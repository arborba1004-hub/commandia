import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock3, Hammer, ShieldCheck, Zap } from 'lucide-react';
import { Model3D } from '@/components/Model3D';
import { usePlayerStore } from '@/store/playerStore';
import {
  formatBarracoDuration,
  getBarracoGangStatsBonusPercent,
  getBarracoUpgradeRemainingMs,
  getBarracoUpgradeRequirements,
  getNextBarracoGangStatsBonusPercent,
  isBarracoUpgradeReady,
  MAX_BARRACO_LEVEL,
} from '@/services/barracoProgressionService';
import {
  getBarracoDescription,
  getBarracoFootprintTiles,
  getBarracoModelUrl,
  getBarracoName,
  getNextBarracoVisualLevel,
} from '@/config/barracoVisualConfig';

type SystemRequirementRow = {
  key: 'arsenal' | 'fuga' | 'bribery' | 'luxury';
  title: string;
  subtitle: string;
  current: number;
  required: number;
};

function formatMoney(value: number) {
  return Math.max(0, Math.floor(Number(value) || 0)).toLocaleString('pt-BR');
}

function RequirementBadge({ ok }: { ok: boolean }) {
  return (
    <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${ok ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/25' : 'bg-red-500/15 text-red-300 border border-red-400/25'}`}>
      {ok ? 'OK' : 'PENDENTE'}
    </span>
  );
}

export default function BarracoPage() {
  const player = usePlayerStore((state) => state.player);
  const upgradeBarracoLocal = usePlayerStore((state) => state.upgradeBarracoLocal);
  const claimBarracoUpgradeLocal = usePlayerStore((state) => state.claimBarracoUpgradeLocal);
  const accelerateBarracoUpgradeLocal = usePlayerStore((state) => state.accelerateBarracoUpgradeLocal);
  const isLoaded = usePlayerStore((state) => state.isLoaded);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [upgradedToLevel, setUpgradedToLevel] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());

  const activeUpgrade = player?.barracoUpgrade?.active === true;

  useEffect(() => {
    if (!activeUpgrade) return;
    const interval = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [activeUpgrade]);

  if (!isLoaded || !player?._id) {
    return (
      <main className="min-h-screen w-full bg-black text-white flex items-center justify-center">
        Carregando barraco...
      </main>
    );
  }

  void nowTick;

  const level = Number(player?.niveis?.barracoLevel || 1);
  const nextLevel = Math.min(MAX_BARRACO_LEVEL, level + 1);
  const isMaxLevel = level >= MAX_BARRACO_LEVEL;
  const cleanMoney = Number(player?.balances?.cleanMoney || 0);
  const requirements = getBarracoUpgradeRequirements(player);
  const currentGangStatsBonus = getBarracoGangStatsBonusPercent(level);
  const nextGangStatsBonus = getNextBarracoGangStatsBonusPercent(level);
  const activeOperation = player.barracoUpgrade;
  const remainingMs = getBarracoUpgradeRemainingMs(activeOperation);
  const isUpgradeReady = isBarracoUpgradeReady(activeOperation);
  const targetLevel = activeOperation?.toLevel || nextLevel;
  const acceleratorSeconds = Math.max(0, Math.floor(Number(player?.barracoAccelerators?.seconds ?? 0)));
  const accelerationToUseSeconds = Math.max(0, Math.min(acceleratorSeconds, Math.ceil(remainingMs / 1000)));
  const canStartUpgrade = requirements.allowed && !activeUpgrade && !isSubmitting;
  const canClaimUpgrade = activeUpgrade && isUpgradeReady && !isSubmitting;
  const canAccelerate = activeUpgrade && !isUpgradeReady && acceleratorSeconds > 0 && !isSubmitting;
  const missingCleanMoney = Math.max(0, requirements.cost - cleanMoney);
  const currentModelUrl = getBarracoModelUrl(level);
  const nextVisualLevel = getNextBarracoVisualLevel(level);

  const levels = requirements.systemLevels || { arsenal: 1, fuga: 1, bribery: 1, luxury: 1 };
  const required = requirements.requiredSystemLevels || {
    arsenal: requirements.sideRequirement || level,
    fuga: requirements.sideRequirement || level,
    bribery: requirements.sideRequirement || level,
    luxury: requirements.sideRequirement || level,
  };

  const systemRows: SystemRequirementRow[] = [
      {
        key: 'arsenal',
        title: 'Arsenal',
        subtitle: 'força ofensiva e equipamentos',
        current: Number(levels.arsenal || 1),
        required: Number(required.arsenal || level),
      },
      {
        key: 'fuga',
        title: 'Fuga',
        subtitle: 'proteção, veículos e redução de perdas',
        current: Number(levels.fuga || 1),
        required: Number(required.fuga || level),
      },
      {
        key: 'bribery',
        title: 'Suborno',
        subtitle: 'blindagem e influência',
        current: Number(levels.bribery || 1),
        required: Number(required.bribery || level),
      },
      {
        key: 'luxury',
        title: 'Artigos de Luxo',
        subtitle: 'status e bônus permanentes',
        current: Number(levels.luxury || 1),
        required: Number(required.luxury || level),
      },
  ];

  const handleStartUpgrade = async () => {
    if (!canStartUpgrade) return;
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      const result = await upgradeBarracoLocal();
      if (!result?.ok) {
        setError(result?.reason || 'Não foi possível iniciar a evolução do barraco.');
        return;
      }
      setNotice(result.message || `Obra iniciada para o nível ${result.targetLevel || nextLevel}.`);
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
      if (!result?.ok) {
        setError(result?.reason || 'Não foi possível finalizar a evolução do barraco.');
        return;
      }
      setUpgradedToLevel(result.currentLevel ?? targetLevel);
      setShowSuccessModal(true);
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
      if (!result?.ok) {
        setError(result?.reason || 'Não foi possível usar o acelerador.');
        return;
      }
      setNotice(result.message || 'Acelerador aplicado na evolução do barraco.');
    } catch (err: any) {
      setError(err?.message || 'Erro ao usar acelerador');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className="min-h-screen w-full text-white px-4 py-8 md:px-8"
      style={{
        background:
          'radial-gradient(circle at top left, rgba(146,88,22,0.40), transparent 32%), radial-gradient(circle at top right, rgba(16,185,129,0.18), transparent 30%), linear-gradient(180deg, #080604 0%, #050505 58%, #000 100%)',
      }}
    >
      <motion.section
        className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.08fr_0.92fr]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="overflow-hidden rounded-[2rem] border border-yellow-500/20 bg-black/55 shadow-2xl backdrop-blur">
          <div className="relative min-h-[420px] border-b border-white/10 bg-gradient-to-b from-zinc-950 to-black">
            <div className="absolute left-5 top-5 z-10 rounded-full border border-yellow-400/30 bg-yellow-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-yellow-200">
              Barraco nível {level}
            </div>

            <div className="absolute right-5 top-5 z-10 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-200">
              {getBarracoFootprintTiles(level)}x{getBarracoFootprintTiles(level)} no mapa
            </div>

            <div className="h-[420px] w-full">
              <Model3D modelUrl={currentModelUrl} />
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="font-heading text-4xl text-yellow-100 md:text-5xl">
                  {getBarracoName(level)}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300">
                  {getBarracoDescription(level)}
                </p>
              </div>

              <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4 text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-orange-200/80">Bônus da gangue</p>
                <p className="mt-1 text-3xl font-black text-orange-200">+{currentGangStatsBonus}%</p>
                {!isMaxLevel && (
                  <p className="text-xs text-orange-100/70">Próximo: +{nextGangStatsBonus}%</p>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-zinc-400">Dinheiro limpo</p>
                <p className="text-xl font-bold text-emerald-300">{formatMoney(cleanMoney)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-zinc-400">Custo da obra</p>
                <p className="text-xl font-bold text-yellow-200">{formatMoney(requirements.cost)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-zinc-400">Tempo base</p>
                <p className="text-xl font-bold text-cyan-200">{formatBarracoDuration(requirements.durationMs)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-zinc-400">Aceleradores</p>
                <p className="text-xl font-bold text-blue-200">{formatBarracoDuration(acceleratorSeconds * 1000)}</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-black/60 p-5 shadow-xl backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-500/15 text-yellow-200">
                <Hammer size={22} />
              </div>
              <div>
                <h2 className="text-xl font-black">Evolução do barraco</h2>
                <p className="text-xs text-zinc-400">Backend autoritativo com tempo, custo e aceleradores.</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Próximo estágio</p>
              <p className="mt-1 text-lg font-bold">
                {isMaxLevel ? 'Topo absoluto do comando' : `Nível ${nextLevel} · ${getBarracoName(nextLevel)}`}
              </p>
              {!isMaxLevel && nextVisualLevel && nextVisualLevel === nextLevel && (
                <p className="mt-1 text-xs text-yellow-200">Novo visual liberado no próximo nível.</p>
              )}
            </div>

            {activeUpgrade && (
              <div className={`mt-4 rounded-2xl border p-4 ${isUpgradeReady ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-yellow-400/30 bg-yellow-500/10'}`}>
                <div className="flex items-center gap-3">
                  <Clock3 size={20} className={isUpgradeReady ? 'text-emerald-300' : 'text-yellow-300'} />
                  <div>
                    <p className="text-sm font-bold">
                      {isUpgradeReady ? 'Obra pronta para finalizar' : 'Obra em andamento'}
                    </p>
                    <p className="text-xs text-zinc-300">
                      Nível {activeOperation?.fromLevel || level} → {targetLevel}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black">
                  {isUpgradeReady ? 'Pronto' : formatBarracoDuration(remainingMs)}
                </p>
              </div>
            )}

            {activeUpgrade ? (
              <button
                onClick={handleClaimUpgrade}
                disabled={!canClaimUpgrade}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-black transition ${canClaimUpgrade ? 'bg-emerald-400 text-black hover:bg-emerald-300' : 'cursor-not-allowed bg-zinc-800 text-zinc-500'}`}
              >
                <ShieldCheck size={18} />
                {isSubmitting ? 'Processando...' : isUpgradeReady ? 'Finalizar Evolução' : `Aguardando ${formatBarracoDuration(remainingMs)}`}
              </button>
            ) : (
              <button
                onClick={handleStartUpgrade}
                disabled={!canStartUpgrade}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-black transition ${canStartUpgrade ? 'bg-yellow-400 text-black hover:bg-yellow-300' : 'cursor-not-allowed bg-zinc-800 text-zinc-500'}`}
              >
                <ArrowUpRight size={18} />
                {isSubmitting ? 'Iniciando...' : isMaxLevel ? 'Nível máximo' : 'Iniciar Evolução'}
              </button>
            )}

            {canAccelerate && (
              <button
                onClick={handleAccelerate}
                disabled={isSubmitting}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 font-black text-black transition hover:bg-cyan-300 disabled:opacity-50"
              >
                <Zap size={18} />
                Acelerar obra
              </button>
            )}

            {notice && <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}
            {error && <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
            {!activeUpgrade && !requirements.allowed && !error && (
              <p className="mt-3 rounded-xl border border-yellow-400/20 bg-yellow-500/10 p-3 text-sm text-yellow-100">
                {missingCleanMoney > 0 ? `Faltam ${formatMoney(missingCleanMoney)} de dinheiro limpo.` : requirements.reason}
              </p>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/60 p-5 shadow-xl backdrop-blur">
            <h2 className="text-xl font-black">Requisitos oficiais</h2>
            <p className="mt-1 text-xs text-zinc-400">
              Para evoluir o barraco, Arsenal, Fuga, Suborno e Artigos de Luxo precisam acompanhar o nível atual do barraco.
            </p>

            <div className="mt-4 space-y-3">
              {systemRows.map((row) => {
                const ok = row.current >= row.required;
                return (
                  <div key={row.key} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold">{row.title}</p>
                        <p className="text-xs text-zinc-500">{row.subtitle}</p>
                      </div>
                      <RequirementBadge ok={ok} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className={ok ? 'text-emerald-300' : 'text-red-300'}>Atual: {row.current}</span>
                      <span className="text-zinc-400">Necessário: {row.required}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </motion.section>

      {showSuccessModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-full max-w-md rounded-[2rem] border border-emerald-400/30 bg-zinc-950 p-6 text-center shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h2 className="text-2xl font-black text-emerald-300">Evolução concluída</h2>
            <p className="mt-3 text-zinc-200">Seu barraco evoluiu para o nível {upgradedToLevel ?? level}.</p>
            <p className="mt-1 text-sm text-yellow-200">{getBarracoName(upgradedToLevel ?? level)}</p>
            <p className="mt-3 text-sm text-orange-200">
              Bônus atualizado para +{getBarracoGangStatsBonusPercent(upgradedToLevel ?? level)}% em Rajada, Blindagem, Fôlego e Quebra.
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setUpgradedToLevel(null);
              }}
              className="mt-6 w-full rounded-2xl bg-emerald-400 px-4 py-3 font-black text-black hover:bg-emerald-300"
            >
              Fechar
            </button>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
