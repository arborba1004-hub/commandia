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

      {/* 🔥 BACKGROUND CINEMÁTICO AAA */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            'url(https://static.wixstatic.com/media/50f4bf_b6f29b55ba6b404bbd2a3c37f122f91f\~mv2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* LAYERS DE PROFUNDIDADE AAA */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.85)_100%)]" />
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(180,20,20,0.15)_0%,transparent_50%)]" />
      <div className="absolute inset-0 z-10 mix-blend-overlay opacity-20 bg-[repeating-linear-gradient(45deg,#111_0px,#111_2px,transparent_2px,transparent_8px)]" />

      {/* 🔥 FLASHES CINEMATOGRÁFICOS PREMIUM */}
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
            scale: [0.8, 1.15, 0.8]
          }}
          transition={{
            duration: 0.45 + Math.random() * 0.3,
            delay: i * 0.9,
            repeat: Infinity,
            repeatDelay: 2.8 + Math.random() * 2,
          }}
        />
      ))}

      <main className="relative z-20 flex items-center justify-center min-h-screen px-4 py-20">
        <div className="w-full max-w-[1100px]">

          <AnimatePresence mode="wait">

            {/* ================= INTRO ================= */}
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 60, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -40, scale: 0.95 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="relative rounded-3xl bg-black/80 backdrop-blur-2xl border border-white/10 shadow-[0_0_120px_-20px_rgba(255,60,60,0.6),0_40px_160px_rgba(0,0,0,0.9)] overflow-hidden"
              >
                {/* GLOW INTERNO PREMIUM */}
                <div 
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.12) 0%, rgba(180,40,40,0.08) 40%, transparent 70%)'
                  }}
                />

                {/* STAMP CONFIDENCIAL AAA */}
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
                    DELAÇÃO<br />PREMIADA
                  </h1>

                  <p className="mt-10 text-2xl md:text-3xl text-white/95 leading-tight max-w-2xl">
                    Você chegou ao topo de um império construído no medo, na influência e no silêncio.
                  </p>

                  <p className="mt-6 text-xl text-white/80 leading-relaxed max-w-xl">
                    Agora existe uma escolha que não é sobre dinheiro.<br />
                    Não é sobre poder.<br />
                    <span className="text-red-400 font-semibold">É sobre quem você decide ser.</span>
                  </p>

                  {/* QUOTE BOX PREMIUM */}
                  <div className="mt-12 relative bg-black/70 border border-red-500/30 rounded-3xl p-8 shadow-[inset_0_0_60px_rgba(255,60,60,0.15),0_0_40px_rgba(255,60,60,0.3)]">
                    <div className="absolute -left-2 -top-2 text-6xl text-red-500/30">❝</div>
                    <p className="text-white/90 text-lg md:text-xl leading-relaxed pl-8">
                      A delação não é um atalho.<br />
                      É uma ruptura.<br />
                      <span className="text-red-300">E toda ruptura cobra um preço.</span>
                    </p>
                    <div className="absolute -right-2 -bottom-2 text-6xl text-red-500/30 rotate-180">❞</div>
                  </div>

                  <div className="mt-14 flex flex-wrap gap-4">
                    <button
                      onClick={() => navigate('/suborno')}
                      className="group px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition-all duration-300 flex-1 md:flex-none hover:ring-2 hover:ring-white/30 active:scale-95"
                    >
                      ← Voltar
                    </button>

                    <button
                      onClick={() => setStep('confirm')}
                      className="group relative px-12 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white font-black text-xl shadow-[0_0_60px_rgba(255,80,80,0.7)] hover:shadow-[0_0_90px_rgba(255,80,80,0.9)] transition-all duration-300 flex-1 md:flex-none hover:scale-105 active:scale-95 overflow-hidden"
                    >
                      <span className="relative z-10">CONTINUAR PARA A DELAÇÃO</span>
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700" />
                    </button>
                  </div>

                </div>
              </motion.div>
            )}

            {/* ================= CONFIRM ================= */}
            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.6 }}
                className="bg-black/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-12 md:p-16 text-center shadow-[0_0_140px_rgba(255,60,60,0.4)] relative"
              >
                {/* WARNING HEADER */}
                <div className="flex justify-center mb-6">
                  <div className="inline-flex items-center gap-3 bg-red-950/80 text-red-400 text-sm font-bold tracking-widest px-8 py-3 rounded-3xl border border-red-400/40 shadow-inner">
                    ⚠️ ÚLTIMA CHANCE
                  </div>
                </div>

                <h2 className="text-5xl md:text-7xl font-black text-white tracking-[-0.02em] drop-shadow-lg">
                  Última chance.
                </h2>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5 text-left">

                  {/* ITEM 1 */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="group bg-black/60 hover:bg-black/80 border border-red-400/30 hover:border-red-400/60 p-6 rounded-3xl flex items-start gap-5 transition-all duration-300"
                  >
                    <span className="text-4xl mt-1">🔒</span>
                    <div>
                      <p className="font-semibold text-white text-xl">Bens bloqueados por 72h</p>
                      <p className="text-white/70 text-sm mt-1">Todos os ativos ficam inacessíveis</p>
                    </div>
                  </motion.div>

                  {/* ITEM 2 */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="group bg-black/60 hover:bg-black/80 border border-red-400/30 hover:border-red-400/60 p-6 rounded-3xl flex items-start gap-5 transition-all duration-300"
                  >
                    <span className="text-4xl mt-1">📉</span>
                    <div>
                      <p className="font-semibold text-white text-xl">Perda total dos bônus do inventário por 72 horas</p>
                      <p className="text-white/70 text-sm mt-1">Redução de 100% em bônus por 72 horas</p>
                    </div>
                  </motion.div>

                  {/* ITEM 3 */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="group bg-black/60 hover:bg-black/80 border border-red-400/30 hover:border-red-400/60 p-6 rounded-3xl flex items-start gap-5 transition-all duration-300"
                  >
                    <span className="text-4xl mt-1">🚫</span>
                    <div>
                      <p className="font-semibold text-white text-xl">Dinheiro sujo e limpo bloqueado</p>
                      <p className="text-white/70 text-sm mt-1">Nenhuma transação possível</p>
                    </div>
                  </motion.div>

                  {/* ITEM 4 */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="group bg-black/60 hover:bg-black/80 border border-red-400/30 hover:border-red-400/60 p-6 rounded-3xl flex items-start gap-5 transition-all duration-300"
                  >
                    <span className="text-4xl mt-1">🛡️</span>
                    <div>
                      <p className="font-semibold text-white text-xl">Proteção da Polícia Federal</p>
                      <p className="text-white/70 text-sm mt-1">Invulnerável durante 72h</p>
                    </div>
                  </motion.div>

                  {/* REWARD ITEM - DESTAQUE AAA */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="md:col-span-2 bg-emerald-900/30 border border-emerald-400/50 p-8 rounded-3xl flex items-center gap-6 shadow-[0_0_60px_rgba(16,185,129,0.4)]"
                  >
                    <span className="text-6xl">⚡</span>
                    <div className="flex-1">
                      <p className="text-emerald-300 font-bold text-3xl">+100% em TODAS as habilidades</p>
                      <p className="text-white/80 mt-2">Liberado automaticamente após 72 horas</p>
                    </div>
                  </motion.div>

                </div>

                <div className="mt-16 flex justify-center gap-6">
                  <button
                    onClick={() => setStep('intro')}
                    className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-medium transition-all duration-300 hover:ring-2 hover:ring-white/30"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleConfirm}
                    disabled={processing}
                    className="relative px-14 py-4 bg-gradient-to-r from-red-600 to-red-700 disabled:from-red-800 disabled:to-red-900 text-white rounded-2xl font-black text-xl shadow-[0_0_70px_rgba(255,80,80,0.8)] hover:shadow-[0_0_100px_rgba(255,80,80,1)] transition-all duration-300 disabled:scale-100 active:scale-95 overflow-hidden flex items-center justify-center gap-3 min-w-[260px]"
                  >
                    {processing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                        <span>Confirmando delação...</span>
                      </>
                    ) : (
                      <span>CONFIRMAR DELAÇÃO</span>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ================= RESULT ================= */}
            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-black/90 backdrop-blur-2xl rounded-3xl border border-emerald-400/30 p-12 md:p-16 text-center shadow-[0_0_160px_rgba(16,185,129,0.5)]"
              >
                {/* CHECK ICON PULSING */}
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mx-auto w-24 h-24 bg-emerald-400/10 rounded-full flex items-center justify-center text-7xl mb-8 border border-emerald-400/40"
                >
                  ✅
                </motion.div>

                <h2 className="text-6xl font-black text-white tracking-tighter">
                  Você fez o certo.
                </h2>

                <p className="mt-6 text-2xl text-white/90 max-w-md mx-auto">
                  Mas o certo… nunca vem sem custo.
                </p>

                {/* REWARD BOX PREMIUM */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-12 mx-auto max-w-xs bg-emerald-900/40 border border-emerald-400/60 rounded-3xl p-8 shadow-[0_0_80px_rgba(16,185,129,0.5)]"
                >
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-5xl">⚡</span>
                    <div>
                      <p className="text-emerald-300 text-3xl font-bold">+100% em todas as habilidades</p>
                      <p className="text-white/70 text-sm mt-1">Liberado em 72 horas</p>
                    </div>
                  </div>
                </motion.div>

                <button
                  onClick={() => navigate('/game')}
                  className="mt-14 px-14 py-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xl font-black rounded-3xl shadow-[0_0_60px_rgba(16,185,129,0.7)] hover:shadow-[0_0_90px_rgba(16,185,129,1)] transition-all duration-300 active:scale-95"
                >
                  VOLTAR AO JOGO
                </button>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}