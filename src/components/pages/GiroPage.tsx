import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePlayerStore } from '@/store/playerStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Coins, Siren } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { claimDailyCorre, spinSlot, type GiroCardDrop } from '@/api/gameApi';

type SymbolKey = 'money' | 'diamond' | 'gun' | 'police';

type SpinResult = {
  reels: SymbolKey[];
  outcome?: 'jackpot' | 'big' | 'medium' | 'small' | 'common' | 'prison';
  dirtyGain: number;
  baseDirtyGain?: number;
  prison: boolean;
  doublePolice: boolean;
  label: string;
  riskPercent?: number;
  riskLabel?: string;
  correCost?: number;
  prisonPenalty?: {
    loss: number;
    lossPct: number;
    cooldownMs: number;
    cooldownUntil: number;
    prisonCountInWindow: number;
  } | null;
  cooldownUntil?: number;
  cardDrop?: GiroCardDrop | null;
};

type SpinToast = {
  id: string;
  type: 'jackpot' | 'prison' | 'card' | 'daily' | 'info' | 'error';
  title: string;
  body: string;
};

const MACHINE_BG =
  'https://static.wixstatic.com/media/50f4bf_f0f13bffd67f4487bbad4fec560e36e5~mv2.png?originWidth=1024&originHeight=1920';

const SLOT_ASSETS: Record<SymbolKey, string> = {
  money: 'https://cdn-icons-png.flaticon.com/512/3135/3135706.png',
  diamond: 'https://cdn-icons-png.flaticon.com/512/616/494.png',
  gun: 'https://cdn-icons-png.flaticon.com/512/833/833472.png',
  police: 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png',
};

const MULTIPLIERS = [1, 2, 5, 10, 25, 50];
const REEL_STOP_MS = [1050, 1480, 1920];
const DEFAULT_REELS: SymbolKey[] = ['money', 'gun', 'diamond'];
const ANIMATION_SYMBOLS: SymbolKey[] = ['money', 'gun', 'diamond', 'police'];

const RISK_CONFIG: Record<number, { risk: number; label: string; emoji: string; color: string }> = {
  1: { risk: 10, label: 'Seguro', emoji: '🟢', color: 'bg-emerald-500' },
  2: { risk: 20, label: 'Baixo', emoji: '🟡', color: 'bg-lime-400' },
  5: { risk: 35, label: 'Médio', emoji: '🟡', color: 'bg-yellow-400' },
  10: { risk: 52, label: 'Arriscado', emoji: '🟠', color: 'bg-orange-500' },
  25: { risk: 72, label: 'Perigoso', emoji: '🔴', color: 'bg-red-500' },
  50: { risk: 92, label: 'Tudo ou nada', emoji: '💀', color: 'bg-red-700' },
};

const DAILY_REWARDS = [
  { day: 1, corre: 20, label: '+20 Corres' },
  { day: 2, corre: 25, label: '+25 Corres' },
  { day: 3, corre: 30, label: '+30 + Sujo' },
  { day: 4, corre: 35, label: '+35 Corres' },
  { day: 5, corre: 40, label: '+40 Corres' },
  { day: 6, corre: 50, label: '+50 + Carta' },
  { day: 7, corre: 70, label: '+70 + Baú', epic: true },
];

function randomAnimationSymbol(): SymbolKey {
  return ANIMATION_SYMBOLS[Math.floor(Math.random() * ANIMATION_SYMBOLS.length)];
}

function formatNumber(value: number) {
  return Math.max(0, Math.floor(Number(value) || 0)).toLocaleString('pt-BR');
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

function playTone(freq: number, duration = 0.08, type: OscillatorType = 'square') {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(0.13, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Som é bônus: não pode quebrar o Giro.
  }
}

function SpinToastCard({ toast }: { toast: SpinToast }) {
  const styles = {
    jackpot: 'border-yellow-400/50 bg-yellow-500/15 shadow-[0_0_35px_rgba(255,200,0,0.32)]',
    prison: 'border-red-400/50 bg-red-500/15 shadow-[0_0_35px_rgba(255,0,0,0.28)]',
    card: 'border-purple-400/50 bg-purple-500/15 shadow-[0_0_35px_rgba(168,85,247,0.22)]',
    daily: 'border-emerald-400/50 bg-emerald-500/15 shadow-[0_0_35px_rgba(16,185,129,0.22)]',
    info: 'border-cyan-400/50 bg-cyan-500/15 shadow-[0_0_35px_rgba(34,211,238,0.18)]',
    error: 'border-red-400/50 bg-red-500/15 shadow-[0_0_35px_rgba(255,0,0,0.18)]',
  }[toast.type];

  const icon = {
    jackpot: '💎',
    prison: '🚔',
    card: '🃏',
    daily: '🎁',
    info: '⚡',
    error: '⚠️',
  }[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -22, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -14, scale: 0.94 }}
      className={`pointer-events-auto w-[330px] max-w-[calc(100vw-2rem)] rounded-2xl border px-4 py-3 backdrop-blur-md ${styles}`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-white">{toast.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-200">{toast.body}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function GiroPage() {
  const navigate = useNavigate();
  const { player, isLoaded, hydratePlayerFromServer } = usePlayerStore();

  const [displayedReels, setDisplayedReels] = useState<SymbolKey[]>(DEFAULT_REELS);
  const [lockedReels, setLockedReels] = useState<boolean[]>([true, true, true]);
  const [landingReels, setLandingReels] = useState<boolean[]>([false, false, false]);
  const [spinning, setSpinning] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [message, setMessage] = useState('Escolhe quantos Corres vai colocar na rua.');
  const [history, setHistory] = useState<string[]>([]);
  const [spinError, setSpinError] = useState('');
  const [policeFlash, setPoliceFlash] = useState(false);
  const [toasts, setToasts] = useState<SpinToast[]>([]);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const reelTimers = useRef<number[]>([]);
  const reelIntervals = useRef<number[]>([]);
  const toastTimers = useRef<number[]>([]);

  const corre = Math.max(0, Number(player?.balances?.corre || 0));
  const dirtyMoney = Math.max(0, Number(player?.balances?.dirtyMoney || 0));
  const dailyCorre = player?.dailyCorre || { streak: 0, lastClaimDate: '', totalClaims: 0 };
  const alreadyClaimedToday = dailyCorre.lastClaimDate === todayKey();
  const currentDailyDay = ((Math.max(1, Number(dailyCorre.streak || 0) + (alreadyClaimedToday ? 0 : 1)) - 1) % 7) + 1;
  const risk = RISK_CONFIG[multiplier] || RISK_CONFIG[1];
  const playerCooldownUntil = Number(player?.prisonHistory?.cooldownUntil || 0);
  const activeCooldownUntil = Math.max(cooldownUntil, playerCooldownUntil);
  const cooldownRemaining = Math.max(0, activeCooldownUntil - Date.now());
  const canSpin = !spinning && cooldownRemaining <= 0 && corre >= multiplier;

  useEffect(() => {
    return () => {
      reelTimers.current.forEach((timer) => window.clearTimeout(timer));
      reelIntervals.current.forEach((timer) => window.clearInterval(timer));
      toastTimers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (!activeCooldownUntil) return;
    let frame = 0;
    const tick = () => {
      if (Date.now() >= activeCooldownUntil) {
        setCooldownUntil(0);
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [activeCooldownUntil]);

  const addToast = (toast: Omit<SpinToast, 'id'>) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, 4));
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3600);
    toastTimers.current.push(timer);
  };

  const addHistory = (entry: string) => {
    setHistory((prev) => [entry, ...prev].slice(0, 8));
  };

  const clearAnimations = () => {
    reelTimers.current.forEach((timer) => window.clearTimeout(timer));
    reelIntervals.current.forEach((timer) => window.clearInterval(timer));
    reelTimers.current = [];
    reelIntervals.current = [];
  };

  const flashPolice = () => {
    setPoliceFlash(true);
    window.setTimeout(() => setPoliceFlash(false), 900);
  };

  const finalizeSpin = (result: SpinResult) => {
    if (result.prison) {
      const loss = result.prisonPenalty?.loss || 0;
      const cooldownMs = result.prisonPenalty?.cooldownMs || 0;
      const lossPct = Math.round((result.prisonPenalty?.lossPct || 0) * 100);
      setMessage(result.label);
      addHistory(`🚔 ${result.label} | -${formatNumber(loss)} Sujo${cooldownMs ? ` | ${Math.round(cooldownMs / 1000)}s` : ''}`);
      setCooldownUntil(result.prisonPenalty?.cooldownUntil || result.cooldownUntil || 0);
      flashPolice();
      vibrate([160, 80, 160]);
      playTone(110, 0.28, 'sawtooth');
      addToast({
        type: 'prison',
        title: 'Rodou na blitz',
        body: `Perdeu ${lossPct}% (${formatNumber(loss)}) de Commands Sujo${cooldownMs ? ` e vai esfriar por ${Math.round(cooldownMs / 1000)}s.` : '.'}`,
      });
      setSpinning(false);
      return;
    }

    if (result.outcome === 'jackpot' || result.reels.every((symbol) => symbol === 'diamond')) {
      vibrate([80, 40, 80, 40, 160]);
      [440, 550, 660, 880].forEach((freq, idx) => window.setTimeout(() => playTone(freq, 0.12, 'sine'), idx * 90));
      addToast({
        type: 'jackpot',
        title: 'Jackpot do Asfalto',
        body: `Ganhou +${formatNumber(result.dirtyGain)} Commands Sujo nesse corre.`,
      });
    } else {
      vibrate(35);
    }

    if (result.cardDrop) {
      addToast({
        type: 'card',
        title: `Carta ${result.cardDrop.rarity.toUpperCase()}`,
        body: `${result.cardDrop.name} entrou na coleção ${result.cardDrop.setName || result.cardDrop.setId}.`,
      });
    }

    setMessage(result.label);
    addHistory(`${result.label}: +${formatNumber(result.dirtyGain)} Sujo${result.cardDrop ? ` | 🃏 ${result.cardDrop.name}` : ''}`);
    setSpinning(false);
  };

  const handleSpin = async () => {
    if (!player?._id) return;

    if (!canSpin) {
      if (cooldownRemaining > 0) {
        setMessage(`Corre esfriando: ${Math.ceil(cooldownRemaining / 1000)}s.`);
        return;
      }
      if (corre < multiplier) {
        setMessage('Sem Corre suficiente pra bancar esse movimento.');
      }
      return;
    }

    vibrate(30);
    playTone(330, 0.05);
    setSpinError('');
    clearAnimations();
    setDisplayedReels(DEFAULT_REELS);
    setLockedReels([false, false, false]);
    setLandingReels([false, false, false]);
    setSpinning(true);
    setMessage(`Colocando ${multiplier} Corre(s) na rua... risco ${risk.label}.`);

    try {
      const response = await spinSlot(multiplier);
      const result: SpinResult = response.result;

      if (response.player) {
        hydratePlayerFromServer(response.player);
      }

      for (let i = 0; i < 3; i += 1) {
        const interval = window.setInterval(() => {
          setDisplayedReels((prev) => {
            const clone = [...prev];
            clone[i] = randomAnimationSymbol();
            return clone as SymbolKey[];
          });
        }, 72 + i * 28);

        reelIntervals.current.push(interval);

        const timer = window.setTimeout(() => {
          window.clearInterval(interval);
          playTone(220 + i * 125, 0.07);
          vibrate(35);

          setDisplayedReels((prev) => {
            const clone = [...prev];
            clone[i] = result.reels[i];
            return clone as SymbolKey[];
          });

          setLandingReels((prev) => {
            const clone = [...prev];
            clone[i] = true;
            return clone;
          });

          window.setTimeout(() => {
            setLandingReels((prev) => {
              const clone = [...prev];
              clone[i] = false;
              return clone;
            });
          }, 420);

          setLockedReels((prev) => {
            const clone = [...prev];
            clone[i] = true;
            return clone;
          });

          if (i === 2) {
            window.setTimeout(() => finalizeSpin(result), 180);
          }
        }, REEL_STOP_MS[i]);

        reelTimers.current.push(timer);
      }
    } catch (error: any) {
      console.error('Erro ao girar slot:', error);
      const retryAfter = Number(error?.retryAfter || 0);
      if (retryAfter > 0) {
        setCooldownUntil(Date.now() + retryAfter);
      }
      const text = error instanceof Error ? error.message : 'Erro ao rodar o corre';
      setSpinError(text);
      setMessage('Falha ao rodar. Tenta de novo.');
      addToast({ type: 'error', title: 'Corre negado', body: text });
      setDisplayedReels(DEFAULT_REELS);
      setLockedReels([true, true, true]);
      setLandingReels([false, false, false]);
      setSpinning(false);
    }
  };

  const handleDailyClaim = async () => {
    if (claimingDaily || alreadyClaimedToday) return;
    setClaimingDaily(true);
    try {
      const response = await claimDailyCorre();
      if (response.player) hydratePlayerFromServer(response.player);
      vibrate([60, 40, 100]);
      addToast({
        type: 'daily',
        title: `Corre diário — dia ${((response.streak - 1) % 7) + 1}`,
        body: `Recebeu +${response.reward.corre} Corres${response.reward.dirtyMoney ? ` e +${formatNumber(response.reward.dirtyMoney)} Sujo` : ''}.`,
      });
      if (response.cardDrop) {
        addToast({
          type: 'card',
          title: 'Carta do calendário',
          body: `${response.cardDrop.name} entrou na sua coleção.`,
        });
      }
    } catch (error: any) {
      const text = error instanceof Error ? error.message : 'Erro ao resgatar Corre diário';
      addToast({ type: 'error', title: 'Calendário', body: text });
    } finally {
      setClaimingDaily(false);
    }
  };

  const machineScaleClass = 'w-[360px] sm:w-[420px] md:w-[520px] lg:w-[620px] xl:w-[690px]';
  const reelBase = 'absolute top-[42%] -translate-y-1/2 h-[12%] w-[14%] rounded-[18px] overflow-hidden';

  if (!isLoaded || !player?._id) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-[#07090d] text-white flex items-center justify-center pt-[140px] md:pt-[160px]">
          Carregando...
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white relative overflow-x-hidden pt-[140px] md:pt-[160px]">
      <Header />

      <div className="pointer-events-none fixed left-1/2 top-20 z-[90] flex -translate-x-1/2 flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <SpinToastCard key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {policeFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.18, 0.46, 0.12, 0.38, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85 }}
            className="pointer-events-none fixed inset-0 z-[60]"
          >
            <div className="absolute inset-0 bg-red-600/35" />
            <div className="absolute inset-0 bg-blue-600/25 mix-blend-screen" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-24 left-4 md:left-6 z-20 flex gap-3">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-xl border border-[#FF4500] bg-[#FF4500]/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-[#FF4500]/35"
        >
          <Home className="h-4 w-4" />
          Home
        </button>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-400/30"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </div>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-28 pb-14 px-4 md:px-6">
        <Image src={MACHINE_BG} alt="Máquina Giro no Asfalto" className="absolute inset-0 h-full w-full object-cover brightness-105 contrast-110" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/80" />

        <div className="relative z-10 w-full max-w-7xl grid grid-cols-1 xl:grid-cols-[1fr_410px] gap-8 items-center">
          <div className="flex flex-col items-center">
            <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs md:hidden w-full max-w-sm">
              <div className="rounded-xl border border-yellow-500/25 bg-black/55 p-2">
                <p className="text-zinc-500">Corres</p>
                <p className="font-black text-yellow-300">{formatNumber(corre)}</p>
              </div>
              <div className="rounded-xl border border-green-500/25 bg-black/55 p-2">
                <p className="text-zinc-500">Sujo</p>
                <p className="font-black text-green-300">{formatNumber(dirtyMoney)}</p>
              </div>
              <div className="rounded-xl border border-red-500/25 bg-black/55 p-2">
                <p className="text-zinc-500">Risco</p>
                <p className="font-black text-red-300">{risk.label}</p>
              </div>
            </div>

            <div className={`relative ${machineScaleClass}`}>
              <Image src={MACHINE_BG} alt="Estrutura da máquina" className="w-full h-auto object-contain select-none pointer-events-none opacity-0" />

              {[0, 1, 2].map((idx) => (
                <div key={idx} className={`${reelBase} ${idx === 0 ? 'left-[28%]' : idx === 1 ? 'left-[43%]' : 'left-[58%]'}`}>
                  <div className={`relative flex h-full w-full items-center justify-center rounded-[12px] bg-black/82 border ${landingReels[idx] ? 'border-yellow-300 shadow-[0_0_26px_rgba(255,210,0,0.65)]' : 'border-yellow-400/40 shadow-[inset_0_0_20px_rgba(255,200,0,0.3)]'} overflow-hidden`}>
                    <motion.img
                      key={`reel-${idx}-${displayedReels[idx]}-${lockedReels[idx]}-${landingReels[idx]}`}
                      src={SLOT_ASSETS[displayedReels[idx]]}
                      alt={displayedReels[idx]}
                      initial={{ y: lockedReels[idx] ? -18 : 0, opacity: 0.8 }}
                      animate={
                        landingReels[idx]
                          ? { y: [-20, 5, -2, 0], opacity: 1, scale: [0.9, 1.16, 0.98, 1] }
                          : spinning && !lockedReels[idx]
                            ? { y: [0, -8, 0], opacity: 0.9, scale: 0.96 }
                            : { y: 0, opacity: 1, scale: 1 }
                      }
                      transition={spinning && !lockedReels[idx] ? { repeat: Infinity, duration: 0.16 } : { duration: 0.32 }}
                      className="h-[75%] w-[75%] object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                    />
                  </div>
                </div>
              ))}

              <div className="absolute left-1/2 top-[71.5%] w-[76%] -translate-x-1/2">
                <div className="rounded-[28px] border border-yellow-500/35 bg-black/78 p-4 shadow-[0_0_35px_rgba(255,200,0,0.15)] backdrop-blur-md">
                  <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                    <span>Aposta: {multiplier} Corre(s)</span>
                    <span>{risk.emoji} {risk.label}</span>
                  </div>
                  <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <motion.div
                      className={`h-full rounded-full ${risk.color}`}
                      animate={{ width: `${risk.risk}%` }}
                      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    />
                  </div>

                  <div className="mb-3 grid grid-cols-6 gap-1.5">
                    {MULTIPLIERS.map((value) => (
                      <button
                        key={value}
                        onClick={() => setMultiplier(value)}
                        disabled={spinning}
                        className={`rounded-xl px-2 py-2 text-[10px] md:text-xs font-black transition ${
                          multiplier === value
                            ? 'bg-yellow-500 text-black shadow-[0_0_18px_rgba(255,200,0,0.45)]'
                            : 'border border-yellow-700/60 bg-zinc-950/90 text-white'
                        } ${spinning ? 'opacity-50' : 'hover:scale-[1.03]'}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>

                  {cooldownRemaining > 0 && (
                    <div className="mb-3 rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2">
                      <div className="mb-1 flex justify-between text-[10px] font-black uppercase tracking-[0.18em] text-red-300">
                        <span>🚔 Corre esfriando</span>
                        <span>{Math.ceil(cooldownRemaining / 1000)}s</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-900">
                        <motion.div className="h-full rounded-full bg-red-500" animate={{ width: `${Math.max(8, Math.min(100, (cooldownRemaining / 60000) * 100))}%` }} />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSpin}
                    disabled={!canSpin}
                    className="w-full rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 px-4 py-3 text-sm md:text-base font-black uppercase tracking-[0.24em] text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {spinning ? `NA RUA: ${multiplier}` : `RODAR ${multiplier} CORRE${multiplier > 1 ? 'S' : ''}`}
                  </button>

                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/35 px-3 py-3 text-center">
                    <div className="inline-flex items-center gap-2 text-yellow-300">
                      <Coins className="h-4 w-4" />
                      <span className="text-[11px] md:text-sm font-semibold leading-relaxed">{message}</span>
                    </div>
                  </div>

                  {spinError && (
                    <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-center">
                      <span className="text-[11px] md:text-sm font-semibold text-red-300">{spinError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-[28px] border border-cyan-500/20 bg-black/70 p-5 backdrop-blur-md shadow-[0_0_40px_rgba(0,234,255,0.10)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-[0.14em] text-cyan-300">Central do Corre</h2>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">Corre = atividade criminosa</p>
              </div>
              <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 px-3 py-2 text-right">
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">Corres</p>
                <p className="text-xl font-black text-yellow-300">{formatNumber(corre)}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-purple-500/25 bg-purple-500/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-300">Calendário do Corre</p>
                  <p className="mt-1 text-xs text-zinc-400">Série atual: {Number(dailyCorre.streak || 0)} dia(s)</p>
                </div>
                <button
                  onClick={handleDailyClaim}
                  disabled={claimingDaily || alreadyClaimedToday}
                  className="rounded-xl bg-purple-500 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white disabled:opacity-45"
                >
                  {alreadyClaimedToday ? 'Resgatado' : claimingDaily ? '...' : 'Resgatar'}
                </button>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1">
                {DAILY_REWARDS.map((reward) => {
                  const active = reward.day === currentDailyDay && !alreadyClaimedToday;
                  const claimed = alreadyClaimedToday ? reward.day <= currentDailyDay : reward.day < currentDailyDay;
                  return (
                    <div
                      key={reward.day}
                      className={`rounded-xl border px-1 py-2 text-center ${
                        active
                          ? 'border-purple-300 bg-purple-400/20 ring-1 ring-purple-300'
                          : claimed
                            ? 'border-purple-700/40 bg-purple-950/40 opacity-70'
                            : 'border-zinc-800 bg-black/40'
                      } ${reward.epic ? 'shadow-[0_0_16px_rgba(255,200,0,0.18)]' : ''}`}
                    >
                      <p className="text-[9px] text-zinc-500">D{reward.day}</p>
                      <p className="text-sm">{claimed ? '✅' : active ? '⭐' : '🔒'}</p>
                      <p className="text-[9px] font-bold text-yellow-300">{reward.corre}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Economia</p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-200">
                <li>• cada aposta consome a quantidade escolhida de <b>Corres</b></li>
                <li>• Commands Sujo alimenta treino e lavagem</li>
                <li>• prisão agora usa perda menor + cooldown progressivo</li>
                <li>• chance de blitz cresce conforme risco da aposta</li>
                <li>• cartas podem cair no Giro e futuramente entrar na troca da facção</li>
                <li>• pedido de Corres da facção permanece 10 Corres, 1 por membro</li>
              </ul>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Histórico</p>
              <div className="mt-3 space-y-2">
                {history.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nenhum corre rodado ainda.</p>
                ) : (
                  history.map((entry, index) => (
                    <div key={`${entry}-${index}`} className="rounded-xl border border-white/8 bg-black/30 px-3 py-2 text-sm text-zinc-200">
                      {entry}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-center gap-2 text-red-300">
                <Siren className="h-4 w-4" />
                <p className="text-xs font-black uppercase tracking-[0.22em]">Risco atual</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                {risk.emoji} {risk.label}: usar {multiplier} Corre(s) aumenta retorno e exposição. Quanto maior o risco, maior a chance da blitz pesar no backend.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </div>
  );
}
