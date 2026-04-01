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

  const [showConfirmStep, setShowConfirmStep] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleGoToConfirm = () => {
    setShowConfirmStep(true);
  };

  const handleConfirmDelacao = () => {
    if (!player) return;

    setProcessing(true);

    setTimeout(() => {
      const until = addHours(72);

      const baseSkills = { ...(player.skills || {}) };

      const boostedSkills = { ...baseSkills };
      Object.keys(boostedSkills).forEach((key) => {
        boostedSkills[key] = (boostedSkills[key] || 0) + 100;
      });

      setPlayer({
        ...player,
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
      setFinished(true);
    }, 1800);
  };

  const handleFinish = () => {
    navigate('/game');
  };

  return (
    <div className="w-full min-h-screen bg-black overflow-hidden relative">
      <Header />

      {/* BACKGROUND */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            'url(https://static.wixstatic.com/media/50f4bf_b6f29b55ba6b404bbd2a3c37f122f91f~mv2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* FLASHES SUTIS */}
      {[...Array(7)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute z-10 rounded-full pointer-events-none"
          style={{
            width: '90px',
            height: '90px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.18) 35%, transparent 70%)',
            top: `${18 + (i * 9) % 55}%`,
            left: `${8 + (i * 13) % 84}%`,
            filter: 'blur(2px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.18, 0] }}
          transition={{
            duration: 0.35,
            delay: i * 1.15,
            repeat: Infinity,
            repeatDelay: 4.5,
          }}
        />
      ))}

      {/* CAMADA DE LEITURA */}
      <div className="absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.30)_0%,rgba(0,0,0,0.40)_20%,rgba(0,0,0,0.58)_58%,rgba(0,0,0,0.76)_100%)]" />

      <main className="relative z-20 min-h-screen flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-[1080px]">
          <AnimatePresence mode="wait">
            {!finished && !showConfirmStep && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="rounded-[32px] border border-white/10 bg-black/48 backdrop-blur-md shadow-[0_20px_80px_rgba(0,0,0,0.45)] overflow-hidden"
              >
                <div className="px-6 md:px-10 py-8 md:py-10 border-b border-white/10">
                  <p className="text-[11px] md:text-xs uppercase tracking-[0.35em] text-red-300/80 mb-3">
                    Decisão de Estado
                  </p>

                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05]">
                    Delação Premiada
                  </h1>

                  <div className="mt-4 h-[2px] w-28 bg-gradient-to-r from-red-500 via-red-300 to-transparent" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-0">
                  <div className="px-6 md:px-10 py-8 md:py-10">
                    <p className="text-lg md:text-2xl text-white/92 leading-relaxed">
                      Você chegou ao topo de um império construído no medo, na influência e no silêncio.
                    </p>

                    <p className="mt-6 text-base md:text-xl text-white/78 leading-relaxed">
                      Agora existe uma escolha que não é sobre lucro.
                      <br />
                      Não é sobre poder.
                      <br />
                      E nem sobre sobrevivência.
                    </p>

                    <p className="mt-6 text-base md:text-xl text-white/78 leading-relaxed">
                      É sobre ter coragem de romper com tudo o que te trouxe até aqui.
                      Deixar de proteger o sistema.
                      E aceitar o peso de fazer o que é certo.
                    </p>

                    <div className="mt-8 rounded-[24px] border border-red-400/20 bg-red-950/20 px-5 py-5">
                      <p className="text-sm md:text-base text-red-100/90 leading-relaxed">
                        A delação premiada não é um atalho.
                        <br />
                        É uma ruptura.
                        <br />
                        E toda ruptura exige um preço.
                      </p>
                    </div>
                  </div>

                  <div className="px-6 md:px-8 py-8 md:py-10 bg-white/5 border-t lg:border-t-0 lg:border-l border-white/10">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-5">
                      Consequências imediatas
                    </h2>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
                        <p className="text-sm md:text-base text-white/90 leading-relaxed">
                          Seus bens ficarão <span className="font-bold text-red-300">bloqueados por 72 horas</span>.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
                        <p className="text-sm md:text-base text-white/90 leading-relaxed">
                          Durante esse período, você <span className="font-bold text-red-300">perde os bônus do inventário</span>.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
                        <p className="text-sm md:text-base text-white/90 leading-relaxed">
                          Seu <span className="font-bold text-red-300">dinheiro sujo e limpo ficam bloqueados</span>.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
                        <p className="text-sm md:text-base text-white/90 leading-relaxed">
                          Você <span className="font-bold text-emerald-300">não poderá ser atacado</span>, pois estará sob proteção da Polícia Federal.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
                        <p className="text-sm md:text-base text-white/90 leading-relaxed">
                          Você poderá continuar no corre, <span className="font-bold text-yellow-300">mas sem aplicar progressão de nível</span>.
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 rounded-[24px] border border-emerald-400/20 bg-emerald-950/20 px-5 py-5">
                      <p className="text-sm md:text-base text-emerald-100/90 leading-relaxed">
                        Após as 72 horas, você receberá <span className="font-bold text-emerald-300">+100% em todas as habilidades</span>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 md:px-10 py-6 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <p className="text-sm md:text-base text-white/60">
                    A verdade protege. Mas também cobra.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => navigate('/suborno')}
                      className="px-6 py-3 rounded-2xl border border-white/12 bg-white/5 text-white font-bold tracking-wide hover:bg-white/10 transition"
                    >
                      Voltar
                    </button>

                    <button
                      onClick={handleGoToConfirm}
                      className="px-7 py-3 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white font-bold tracking-wide shadow-[0_0_26px_rgba(255,0,0,0.28)] hover:scale-[1.02] transition"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {!finished && showConfirmStep && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="max-w-[760px] mx-auto rounded-[32px] border border-white/10 bg-black/58 backdrop-blur-md shadow-[0_20px_80px_rgba(0,0,0,0.45)] overflow-hidden"
              >
                <div className="px-6 md:px-10 py-8 md:py-10 text-center">
                  <p className="text-[11px] md:text-xs uppercase tracking-[0.35em] text-red-300/80 mb-3">
                    Confirmação Final
                  </p>

                  <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.05]">
                    Você vai romper com tudo.
                  </h2>

                  <p className="mt-8 text-base md:text-xl text-white/82 leading-relaxed">
                    Ao confirmar a delação premiada, você escolhe o caminho moralmente correto —
                    <br />
                    mas aceita sofrer, por 72 horas, o peso dessa escolha.
                  </p>

                  <div className="mt-8 rounded-[24px] border border-red-400/20 bg-red-950/20 px-5 py-5 text-left">
                    <p className="text-sm md:text-base text-white/90 leading-relaxed">
                      • Bloqueio de bens por 72 horas
                      <br />
                      • Perda temporária dos bônus do inventário
                      <br />
                      • Bloqueio de dirtyMoney e cleanMoney
                      <br />
                      • Sem progressão de nível no corre
                      <br />
                      • Proteção da Polícia Federal contra ataques
                      <br />
                      • Após 72 horas: +100% em todas as habilidades
                    </p>
                  </div>

                  <p className="mt-8 text-sm md:text-base text-white/62">
                    Algumas escolhas não aumentam seu império.
                    <br />
                    Elas revelam quem você é.
                  </p>
                </div>

                <div className="px-6 md:px-10 py-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setShowConfirmStep(false)}
                    disabled={processing}
                    className="px-6 py-3 rounded-2xl border border-white/12 bg-white/5 text-white font-bold tracking-wide hover:bg-white/10 transition disabled:opacity-50"
                  >
                    Ainda não
                  </button>

                  <button
                    onClick={handleConfirmDelacao}
                    disabled={processing}
                    className="px-7 py-3 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white font-bold tracking-wide shadow-[0_0_26px_rgba(255,0,0,0.28)] hover:scale-[1.02] transition disabled:opacity-60"
                  >
                    {processing ? 'Confirmando delação...' : 'Confirmar delação premiada'}
                  </button>
                </div>
              </motion.div>
            )}

            {finished && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="max-w-[760px] mx-auto rounded-[32px] border border-white/10 bg-black/62 backdrop-blur-md shadow-[0_20px_80px_rgba(0,0,0,0.45)] overflow-hidden"
              >
                <div className="px-6 md:px-10 py-10 md:py-12 text-center">
                  <p className="text-[11px] md:text-xs uppercase tracking-[0.35em] text-emerald-300/80 mb-3">
                    Decisão selada
                  </p>

                  <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.05]">
                    Você fez a coisa certa.
                  </h2>

                  <p className="mt-8 text-base md:text-xl text-white/84 leading-relaxed">
                    E fazer a coisa certa, neste mundo, nunca sai barato.
                  </p>

                  <p className="mt-6 text-base md:text-xl text-white/74 leading-relaxed">
                    Seus bens foram bloqueados por 72 horas.
                    <br />
                    Seu inventário perdeu os bônus temporariamente.
                    <br />
                    Seu dinheiro foi congelado.
                  </p>

                  <div className="mt-8 rounded-[24px] border border-emerald-400/20 bg-emerald-950/20 px-5 py-5">
                    <p className="text-sm md:text-base text-emerald-100/90 leading-relaxed">
                      Ao fim desse período, você emergirá mais forte:
                      <br />
                      <span className="font-bold text-emerald-300">+100% em todas as habilidades.</span>
                    </p>
                  </div>

                  <p className="mt-8 text-sm md:text-base text-white/62">
                    A verdade te custou o presente.
                    <br />
                    Mas preparou o seu retorno.
                  </p>
                </div>

                <div className="px-6 md:px-10 py-6 border-t border-white/10 flex justify-center">
                  <button
                    onClick={handleFinish}
                    className="px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 text-white font-bold tracking-wide shadow-[0_0_26px_rgba(16,185,129,0.22)] hover:scale-[1.02] transition"
                  >
                    Voltar ao jogo
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}