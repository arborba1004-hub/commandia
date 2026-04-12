import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function addHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export default function DelacaoPremiadaPage() {
  const navigate = useNavigate();

  const player = usePlayerStore((state) => state.player);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const loadPlayer = usePlayerStore((state) => state.loadPlayer);
  const applyPlayerUpdate = usePlayerStore((state) => state.applyPlayerUpdate);

  const [step, setStep] = useState<'intro' | 'confirm' | 'done'>('intro');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      void loadPlayer();
    }
  }, [isLoaded, loadPlayer]);

  if (!isLoaded || !player?._id) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black text-white flex items-center justify-center pt-[140px] md:pt-[160px]">
          Carregando delação premiada...
        </div>
        <Footer />
      </>
    );
  }

  const barracoLevel = player?.niveis?.barracoLevel || 1;
  const canAccessDelacao = barracoLevel >= 100;

  const handleConfirm = () => {
    if (!player || !canAccessDelacao || processing) return;

    setProcessing(true);

    window.setTimeout(() => {
      const until = addHours(72);

      applyPlayerUpdate((currentPlayer) => ({
        ...currentPlayer,
        punishments: {
          ...currentPlayer.punishments,
          inventoryBlocked: true,
          dirtyMoneyBlocked: true,
          cleanMoneyBlocked: true,
          levelProgressionBlocked: true,
          inventoryBonusReductionPercent: 100,
          pvpProtectionUntil: until,
          delacaoRewardPending: true,
          delacaoRewardUnlockAt: until,
          pendingSkillBoost: 100,
        },
      }));

      setProcessing(false);
      setStep('done');
    }, 1600);
  };

  if (!canAccessDelacao) {
    return (
      <div className="w-full min-h-screen bg-black overflow-hidden relative">
        <Header />

        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage:
              'url(https://static.wixstatic.com/media/50f4bf_b6f29b55ba6b404bbd2a3c37f122f91f~mv2.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.9)_100%)]" />

        <main className="relative z-20 min-h-screen flex items-center justify-center px-4 pt-[140px] md:pt-[160px] pb-20">
          <div className="w-full max-w-2xl rounded-3xl border border-red-500/30 bg-black/85 p-8 md:p-12 text-center">
            <div className="inline-flex items-center gap-3 bg-red-950/80 text-red-400 text-sm font-bold tracking-widest px-8 py-3 rounded-3xl border border-red-400/40 shadow-inner mb-6">
              ⚠️ ACESSO NEGADO
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
              DELAÇÃO PREMIADA
            </h1>

            <p className="mt-6 text-xl text-white/85 leading-relaxed">
              Essa decisão só pode ser tomada por quem já alcançou o topo.
            </p>

            <p className="mt-4 text-lg text-red-300">
              Seu barraco atual está no nível <span className="font-black">{barracoLevel}</span>.
            </p>

            <p className="mt-2 text-lg text-white/70">
              Você precisa alcançar o <span className="font-black text-white">nível 100</span>.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => navigate('/suborno-ilustrado')}
                className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition-all"
              >
                ← Voltar
              </button>

              <button
                onClick={() => navigate('/barraco')}
                className="px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black transition-all"
              >
                Ir para o Barraco
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-black overflow-hidden relative">
      <Header />

      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            'url(https://static.wixstatic.com/media/50f4bf_b6f29b55ba6b404bbd2a3c37f122f91f~mv2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.85)_100%)]" />
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(180,20,20,0.15)_0%,transparent_50%)]" />
      <div className="absolute inset-0 z-10 mix-blend-overlay opacity-20 bg-[repeating-linear-gradient(45deg,#111_0px,#111_2px,transparent_2px,transparent_8px)]" />

      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none z-10"
          style={{
            width: `${80 + Math.random() * 180}px`,
            height: `${80 + Math.random() * 180}px`,
            background:
              'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,180,180,0.6) 30%, transparent 70%)',
            top: `${5 + Math.random() * 90}%`,
            left: `${5 + Math.random() * 90}%`,
            filter: 'blur(4px)',
            boxShadow: '0 0 80px 30px rgba(255, 80, 80, 0.4)',
          }}
          animate={{
            opacity: [0, 0.35, 0],
            scale: [0.8, 1.15, 0.8],
          }}
          transition={{
            duration: 0.45 + Math.random() * 0.3,
            delay: i * 0.9,
            repeat: Infinity,
            repeatDelay: 2.8 + Math.random() * 2,
          }}
        />
      ))}

      <main className="relative z-20 flex items-center justify-center min-h-screen px-4 pt-[140px] md:pt-[160px] pb-20">
        <div className="w-full max-w-[1100px]">
          <AnimatePresence mode="wait">
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 60, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -40, scale: 0.95 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="relative rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/10 overflow-hidden"
              >
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.12) 0%, rgba(180,40,40,0.08) 40%, transparent 70%)',
                  }}
                />

                <div className="absolute -top-6 -right-6 rotate-12 bg-gradient-to-r from-red-600 to-red-700 text-white text-[13px] font-black tracking-[0.35em] px-10 py-2 border-4 border-white/90 shadow-2xl z-30 flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  CONFIDENCIAL
                  <span className="text-2xl">🔥</span>
                </div>

                <div className="p-10 md:p-16">
                  <p className="text-xs tracking-[0.5em] text-red-400 font-medium mb-4 flex items-center gap-3">
                    <span className="flex-1 h-px bg-gradient-to-r from-transparent via-red-400 to-transparent"></span>
                    DECISÃO DE ESTADO
                    <span className="flex-1 h-px bg-gradient-to-r from-transparent via-red-400 to-transparent"></span>
                  </p>

                  <h1 className="text-6xl md:text-8xl font-black text-white leading-none tracking-[-0.04em] drop-shadow-[0_8px_40px_rgba(255,60,60,0.5)]">
                    DELAÇÃO
                    <br />
                    PREMIADA
                  </h1>

                  <p className="mt-10 text-2xl md:text