import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import Header from '@/components/Header';

function addHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export default function DelacaoPremiadaPage() {
  const navigate = useNavigate();
  const { player, setPlayer } = usePlayerStore();

  const [step, setStep] = useState<'intro' | 'confirm' | 'done'>('intro');
  const [processing, setProcessing] = useState(false);

  const handleConfirm = () => {
    if (!player) return;

    setProcessing(true);

    setTimeout(() => {
      const until = addHours(72);

      const skills = { ...(player.skills || {}) };

      Object.keys(skills).forEach((key) => {
        skills[key] = (skills[key] || 0) + 100;
      });

      setPlayer({
        ...player,
        skills,
        punishments: {
          ...player.punishments,
          delacaoPremiadaUntil: until,
          assetLockdownActive: true,
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
      });

      setProcessing(false);
      setStep('done');
    }, 1600);
  };

  return (
    <div className="w-full min-h-screen bg-black overflow-hidden relative">
      <Header />

      {/* 🔥 BACKGROUND */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            'url(https://static.wixstatic.com/media/50f4bf_b6f29b55ba6b404bbd2a3c37f122f91f~mv2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* 🔥 FLASHES CINEMATOGRÁFICOS */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none z-10"
          style={{
            width: '120px',
            height: '120px',
            background:
              'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 40%, transparent 70%)',
            top: `${10 + Math.random() * 70}%`,
            left: `${10 + Math.random() * 80}%`,
            filter: 'blur(3px)',
          }}
          animate={{ opacity: [0, 0.25, 0] }}
          transition={{
            duration: 0.4,
            delay: i * 1.2,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        />
      ))}

      {/* 🔥 VINHETA + CONTRASTE */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.7)_100%)]" />

      <main className="relative z-20 flex items-center justify-center min-h-screen px-4 py-20">
        <div className="w-full max-w-[1100px]">

          <AnimatePresence mode="wait">

            {/* ================= INTRO ================= */}
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="relative rounded-[32px] bg-black/75 backdrop-blur-xl border border-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.8)] overflow-hidden"
              >

                {/* Glow interno */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.08), transparent 60%)'
                  }}
                />

                <div className="p-8 md:p-12">

                  <p className="text-xs tracking-[0.4em] text-red-300 mb-3">
                    DECISÃO DE ESTADO
                  </p>

                  <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
                    Delação Premiada
                  </h1>

                  <p className="mt-8 text-xl md:text-2xl text-white leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                    Você chegou ao topo de um império construído no medo, na influência e no silêncio.
                  </p>

                  <p className="mt-6 text-lg md:text-xl text-white/90 leading-relaxed">
                    Agora existe uma escolha que não é sobre dinheiro.
                    <br />Não é sobre poder.
                    <br />É sobre quem você decide ser.
                  </p>

                  <div className="mt-8 bg-black/60 border border-red-500/20 rounded-2xl p-5 shadow-[0_0_20px_rgba(255,0,0,0.2)]">
                    <p className="text-white">
                      A delação não é um atalho.
                      <br />É uma ruptura.
                      <br />E toda ruptura cobra um preço.
                    </p>
                  </div>

                  <div className="mt-10 flex gap-4">
                    <button
                      onClick={() => navigate('/suborno')}
                      className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
                    >
                      Voltar
                    </button>

                    <button
                      onClick={() => setStep('confirm')}
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-[0_0_40px_rgba(255,0,0,0.6)] hover:scale-105 transition"
                    >
                      Continuar
                    </button>
                  </div>

                </div>
              </motion.div>
            )}

            {/* ================= CONFIRM ================= */}
            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-black/80 backdrop-blur-xl rounded-[32px] border border-white/10 p-10 text-center"
              >
                <h2 className="text-4xl md:text-6xl font-black text-white">
                  Última chance.
                </h2>

                <div className="mt-8 text-left space-y-4">

                  <div className="bg-black/60 p-4 rounded-xl border border-white/10">
                    🔒 Bens bloqueados por 72h
                  </div>

                  <div className="bg-black/60 p-4 rounded-xl border border-white/10">
                    📉 Perda dos bônus do inventário
                  </div>

                  <div className="bg-black/60 p-4 rounded-xl border border-white/10">
                    🚫 Dinheiro bloqueado
                  </div>

                  <div className="bg-black/60 p-4 rounded-xl border border-white/10">
                    🛡️ Proteção da Polícia Federal (invulnerável)
                  </div>

                  <div className="bg-black/60 p-4 rounded-xl border border-white/10">
                    ⚡ Após 72h: +100% em TODAS habilidades
                  </div>

                </div>

                <div className="mt-10 flex justify-center gap-4">
                  <button
                    onClick={() => setStep('intro')}
                    className="px-6 py-3 bg-white/10 text-white rounded-xl"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleConfirm}
                    disabled={processing}
                    className="px-10 py-3 bg-red-600 text-white rounded-xl font-bold shadow-[0_0_40px_rgba(255,0,0,0.6)]"
                  >
                    {processing ? 'Confirmando...' : 'Confirmar Delação'}
                  </button>
                </div>

              </motion.div>
            )}

            {/* ================= RESULT ================= */}
            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-black/80 rounded-[32px] p-10 text-center border border-white/10"
              >
                <h2 className="text-5xl font-black text-white">
                  Você fez o certo.
                </h2>

                <p className="mt-6 text-xl text-white/90">
                  Mas o certo... nunca vem sem custo.
                </p>

                <div className="mt-8 bg-emerald-900/40 p-5 rounded-xl border border-emerald-400/30">
                  +100% em todas as habilidades após 72h
                </div>

                <button
                  onClick={() => navigate('/game')}
                  className="mt-8 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold"
                >
                  Voltar ao jogo
                </button>

              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}