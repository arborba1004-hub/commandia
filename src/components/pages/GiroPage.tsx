import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/store/playerStore';
import { Siren, Zap, Gift, History, Crown } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { claimDailyCorre, spinSlot, type GiroCardDrop, type SlotSymbol } from '@/api/gameApi';

type DisplaySymbol = SlotSymbol | 'dice';

type SpinResult = {
  reels: SlotSymbol[];
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

const BG_URL = 'https://static.wixstatic.com/media/50f4bf_3fcc97adac354732b5add82b6dbe0a07~mv2.png';
const PRIZE_FRAME_URL = 'https://static.wixstatic.com/media/50f4bf_f3b0fd84358e43afb3707669771a3100~mv2.png';
const PISTOL_URL = 'https://static.wixstatic.com/media/50f4bf_e3e229785acd484b98dae44a7e663563~mv2.png';
const DICE_URL = 'https://static.wixstatic.com/media/50f4bf_44d2e2ed6df746eaa3b7243000e90be0~mv2.png';
const POLICE_URL = 'https://static.wixstatic.com/media/50f4bf_12fd702dfbc74682942b6d5116e71b42~mv2.png';
const SLOT_BODY_URL = 'https://static.wixstatic.com/media/50f4bf_a2a2ab159c2e4017a30a3d9cafc34388~mv2.png';
const GOLD_URL = 'https://static.wixstatic.com/media/50f4bf_f5c09c68b3b7461890485d35d9a7f71d~mv2.png';
const MONEY_URL = 'https://static.wixstatic.com/media/50f4bf_9bda4af1a12b47679336479a80b16eb8~mv2.png';
const BULLET_URL = 'https://static.wixstatic.com/media/50f4bf_2855085fadd44679adb6ee591fcf3259~mv2.png';

const DISPLAY_ASSETS: Record<DisplaySymbol, string> = {
  money: MONEY_URL,
  diamond: GOLD_URL,
  gun: PISTOL_URL,
  police: POLICE_URL,
  dice: DICE_URL,
};

const MULTIPLIERS = [1, 2, 5, 10, 25, 50];
const REEL_STOP_MS = [1100, 1560, 2020];
const DEFAULT_REELS: DisplaySymbol[] = ['dice', 'gun', 'diamond'];
const ANIMATION_SYMBOLS: DisplaySymbol[] = ['money', 'gun', 'diamond', 'police', 'dice'];

const RISK_CONFIG: Record<number, { risk: number; label: string; emoji: string; color: string }> = {
  1: { risk: 10, label: 'Seguro', emoji: '🟢', color: 'from-emerald-400 to-lime-400' },
  2: { risk: 20, label: 'Baixo', emoji: '🟡', color: 'from-lime-400 to-yellow-300' },
  5: { risk: 35, label: 'Médio', emoji: '🟡', color: 'from-yellow-300 to-amber-400' },
  10: { risk: 52, label: 'Arriscado', emoji: '🟠', color: 'from-orange-400 to-orange-500' },
  25: { risk: 72, label: 'Perigoso', emoji: '🔴', color: 'from-orange-500 to-red-500' },
  50: { risk: 92, label: 'Tudo ou nada', emoji: '💀', color: 'from-red-500 to-red-700' },
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

function randomAnimationSymbol(): DisplaySymbol {
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
    // Som é bônus; nunca pode quebrar a página.
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

function InfoCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-[22px] border border-[#875719] bg-black/55 p-4 shadow-[0_0_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <div className="mb-3 flex items-center gap-2 text-[#f1bf5e]">
        {icon}
        <p className="text-xs font-black uppercase tracking-[0.18em]">{title}</p>
      </div>
      {children}
    </div>
  );
}

export default function GiroPage() {
  const { player, isLoaded, hydratePlayerFromServer } = usePlayerStore();

  const [displayedReels, setDisplayedReels] = useState<DisplaySymbol[]>(DEFAULT_REELS);
  const [lockedReels, setLockedReels] = useState<boolean[]>([true, true, true]);
  const [landingReels, setLandingReels] = useState<boolean[]>([false, false, false]);
  const [spinning, setSpinning] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [message, setMessage] = useState('Escolhe quantos Corres vai colocar na rua. Não consome Commands Sujo.');
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
    setMessage(`Colocando ${multiplier} Corre(s) na rua... sem gastar Commands Sujo. Risco ${risk.label}.`);

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
            return clone as DisplaySymbol[];
          });
        }, 72 + i * 28);

        reelIntervals.current.push(interval);

        const timer = window.setTimeout(() => {
          window.clearInterval(interval);
          playTone(220 + i * 125, 0.07);
          vibrate(35);

          setDisplayedReels((prev) => {
            const clone = [...prev];
            clone[i] = result.reels[i] as DisplaySymbol;
            return clone as DisplaySymbol[];
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
        addToast({ type: 'card', title: 'Carta do calendário', body: `${response.cardDrop.name} entrou na sua coleção.` });
      }
    } catch (error: any) {
      const text = error instanceof Error ? error.message : 'Erro ao resgatar Corre diário';
      addToast({ type: 'error', title: 'Calendário', body: text });
    } finally {
      setClaimingDaily(false);
    }
  };

  if (!isLoaded || !player?._id) {
    return <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[#07090d] text-white">Carregando...</div>;
  }

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-x-hidden bg-[#050505] text-white">
      <div className="absolute inset-0">
        <Image src={BG_URL} alt="Fundo Giro no Asfalto" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.18)_32%,rgba(0,0,0,0.6)_100%)]" />
      </div>

      <div className="pointer-events-none fixed left-1/2 top-20 z-[90] flex -translate-x-1/2 flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <SpinToastCard key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {policeFlash && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0.18, 0.46, 0.12, 0.38, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.85 }} className="pointer-events-none fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-red-600/35" />
            <div className="absolute inset-0 bg-blue-600/25 mix-blend-screen" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 px-3 pb-14 pt-5 md:px-6 md:pt-8">
        <div className="mx-auto max-w-[1380px]">
          <div className="mb-3 flex flex-wrap items-center gap-2 md:mb-5 md:gap-3">
            <div className="rounded-full border border-[#8a5a1e] bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#f2c360] shadow-[0_0_18px_rgba(0,0,0,0.25)] backdrop-blur-md md:px-4 md:py-2 md:text-[11px]">
              Giro no Asfalto
            </div>
            <div className="rounded-full border border-[#8a5a1e] bg-black/55 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-300 backdrop-blur-md md:px-4 md:py-2 md:text-[11px] md:tracking-[0.18em]">
              Corre = atividade criminosa
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
            <section className="relative flex flex-col items-center">
              <Image src={BULLET_URL} alt="Furo de bala" className="pointer-events-none absolute left-[4%] top-[6%] z-0 w-16 opacity-70 md:w-20" />
              <Image src={BULLET_URL} alt="Furo de bala" className="pointer-events-none absolute right-[12%] top-[10%] z-0 w-16 opacity-70 md:w-20" />
              <Image src={BULLET_URL} alt="Furo de bala" className="pointer-events-none absolute left-[7%] bottom-[18%] z-0 w-16 opacity-55 md:w-20" />

              <div className="relative z-10 mx-auto w-full max-w-[1060px]">
                <div className="relative mx-auto w-full max-w-[1000px]">
                  <div className="pointer-events-none absolute left-1/2 top-[1%] z-20 w-[54%] -translate-x-1/2">
                    <Image src={PRIZE_FRAME_URL} alt="Moldura do prêmio" className="w-full select-none object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]" />
                    <div className="absolute inset-x-[9%] top-[20%] flex h-[56%] flex-col items-center justify-center text-center">
                      <span className="text-[clamp(0.8rem,1.5vw,1.2rem)] font-black uppercase tracking-[0.28em] text-[#f7cf75]">Prêmio</span>
                      <span className="mt-1 text-[clamp(2rem,6vw,4.8rem)] font-black leading-none tracking-wide text-[#ffc43b] drop-shadow-[0_0_18px_rgba(255,196,59,0.35)]">
                        {formatNumber(Math.max(1000, multiplier * 1000))}
                      </span>
                    </div>
                  </div>

                  <div className="relative pt-[13%]">
                    <Image src={SLOT_BODY_URL} alt="Corpo da slot machine" className="relative z-10 w-full select-none object-contain drop-shadow-[0_24px_50px_rgba(0,0,0,0.55)]" />

                    {[
                      { left: '21.4%', top: '35%' },
                      { left: '40.95%', top: '35%' },
                      { left: '60.5%', top: '35%' },
                    ].map((position, idx) => (
                      <div key={idx} className="absolute z-20" style={{ left: position.left, top: position.top, width: '16.7%', height: '28.5%' }}>
                        <div className={`relative flex h-full w-full items-center justify-center overflow-visible rounded-[24px] ${landingReels[idx] ? 'drop-shadow-[0_0_24px_rgba(255,215,116,0.8)]' : ''}`}>
                          <motion.img
                            key={`reel-${idx}-${displayedReels[idx]}-${lockedReels[idx]}-${landingReels[idx]}`}
                            src={DISPLAY_ASSETS[displayedReels[idx]]}
                            alt={displayedReels[idx]}
                            initial={{ y: lockedReels[idx] ? -18 : 0, opacity: 0.82 }}
                            animate={landingReels[idx] ? { y: [-20, 5, -2, 0], opacity: 1, scale: [0.9, 1.15, 0.98, 1] } : spinning && !lockedReels[idx] ? { y: [0, -8, 0], opacity: 0.9, scale: 0.96 } : { y: 0, opacity: 1, scale: 1 }}
                            transition={spinning && !lockedReels[idx] ? { repeat: Infinity, duration: 0.16 } : { duration: 0.32 }}
                            className="h-[78%] w-[78%] object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]"
                          />
                        </div>
                      </div>
                    ))}

                    <div className="absolute right-[3.7%] top-[30%] z-30 w-[11.5%]">
                      <div className="space-y-[clamp(0.16rem,0.7vw,0.5rem)]">
                        {[...MULTIPLIERS].reverse().map((value) => {
                          const active = multiplier === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              disabled={spinning}
                              onClick={() => setMultiplier(value)}
                              aria-label={`Selecionar ${value} Corres`}
                              className={`flex h-[clamp(34px,5.8vw,56px)] w-full items-center justify-center rounded-[clamp(8px,1.4vw,14px)] border text-[clamp(0.78rem,2.45vw,1.5rem)] font-black transition ${active ? 'border-[#ffcb45] bg-[linear-gradient(180deg,#f0c442_0%,#9e6206_100%)] text-black shadow-[0_0_16px_rgba(255,196,0,0.4)]' : 'border-[#6d4f1e] bg-black/78 text-[#f4d488] hover:bg-black/88'} ${spinning ? 'opacity-60' : ''}`}
                            >
                              {value}x
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="absolute bottom-[7.8%] left-[7.5%] z-20 w-[24.5%]">
                      <div className="rounded-[22px] border border-[#6d4f1e] bg-black/88 px-4 py-3 shadow-[0_12px_22px_rgba(0,0,0,0.35)]">
                        <p className="mb-2 text-center text-[clamp(0.7rem,1vw,1rem)] font-black uppercase tracking-[0.18em] text-[#f0d089]">Aposta</p>
                        <div className="flex items-center justify-between gap-2">
                          <button type="button" onClick={() => setMultiplier((prev) => MULTIPLIERS[Math.max(0, MULTIPLIERS.indexOf(prev) - 1)])} disabled={spinning || MULTIPLIERS.indexOf(multiplier) === 0} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#7a5a2b] bg-[#111] text-2xl font-black text-white disabled:opacity-40">−</button>
                          <span className="min-w-[48px] text-center text-[clamp(1.5rem,2vw,2.2rem)] font-black text-white">{multiplier}</span>
                          <button type="button" onClick={() => setMultiplier((prev) => MULTIPLIERS[Math.min(MULTIPLIERS.length - 1, MULTIPLIERS.indexOf(prev) + 1)])} disabled={spinning || MULTIPLIERS.indexOf(multiplier) === MULTIPLIERS.length - 1} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#7a5a2b] bg-[#111] text-2xl font-black text-white disabled:opacity-40">+</button>
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-[5.5%] left-1/2 z-20 w-[28%] -translate-x-1/2">
                      <button
                        type="button"
                        onClick={handleSpin}
                        disabled={!canSpin}
                        className="h-[86px] w-full rounded-[26px] border border-[#8a6120] bg-[linear-gradient(180deg,#4d3a24_0%,#23180f_100%)] px-4 text-[clamp(1.6rem,3vw,3rem)] font-black uppercase tracking-[0.08em] text-[#efe7d2] shadow-[inset_0_2px_0_rgba(255,214,131,0.35),0_18px_35px_rgba(0,0,0,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {spinning ? 'Parar' : 'Girar'}
                      </button>
                    </div>

                    <div className="absolute bottom-[7.8%] right-[7.5%] z-20 w-[24.5%]">
                      <div className="rounded-[22px] border border-[#6d4f1e] bg-black/88 px-4 py-3 shadow-[0_12px_22px_rgba(0,0,0,0.35)]">
                        <p className="mb-2 text-center text-[clamp(0.7rem,1vw,1rem)] font-black uppercase tracking-[0.18em] text-[#f0d089]">Custo</p>
                        <div className="flex items-center justify-center gap-2 text-[#f6d27b]">
                          <Zap className="h-7 w-7 text-yellow-300 drop-shadow-[0_0_10px_rgba(255,210,0,0.55)]" />
                          <span className="text-[clamp(1.1rem,1.7vw,1.9rem)] font-black">{multiplier} Corre{multiplier > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-6 w-full max-w-[960px] rounded-[24px] border border-[#875719] bg-black/62 px-4 py-4 shadow-[0_0_30px_rgba(0,0,0,0.35)] backdrop-blur-md md:px-6">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d7a851]">Status do corre</p>
                    <p className="mt-1 text-sm text-zinc-200 md:text-base">{message}</p>
                  </div>
                  <div className="rounded-full border border-[#7b5418] bg-black/55 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-[#f1bf5e]">
                    {risk.emoji} {risk.label}
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#1d140e]">
                  <motion.div className={`h-full bg-gradient-to-r ${risk.color}`} animate={{ width: `${risk.risk}%` }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} />
                </div>
                {cooldownRemaining > 0 && (
                  <div className="mt-4 rounded-2xl border border-red-500/35 bg-red-500/10 px-3 py-3">
                    <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-[0.18em] text-red-300">
                      <span>🚔 Corre esfriando</span>
                      <span>{Math.ceil(cooldownRemaining / 1000)}s</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-900">
                      <motion.div className="h-full rounded-full bg-red-500" animate={{ width: `${Math.max(8, Math.min(100, (cooldownRemaining / 60000) * 100))}%` }} />
                    </div>
                  </div>
                )}
                {spinError && (
                  <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-center text-sm font-semibold text-red-300">{spinError}</div>
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <InfoCard title="Corre diário" icon={<Gift className="h-4 w-4" />}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">Série atual: {Number(dailyCorre.streak || 0)} dia(s)</p>
                    <p className="mt-1 text-xs text-zinc-500">Mantém o corre em movimento e resgata a recompensa diária.</p>
                  </div>
                  <button
                    onClick={handleDailyClaim}
                    disabled={claimingDaily || alreadyClaimedToday}
                    className="rounded-xl bg-[linear-gradient(180deg,#f0c442_0%,#9e6206_100%)] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-black shadow-[0_0_14px_rgba(255,190,0,0.25)] disabled:opacity-45"
                  >
                    {alreadyClaimedToday ? 'Resgatado' : claimingDaily ? '...' : 'Resgatar'}
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-7 gap-1.5">
                  {DAILY_REWARDS.map((reward) => {
                    const active = reward.day === currentDailyDay && !alreadyClaimedToday;
                    const claimed = alreadyClaimedToday ? reward.day <= currentDailyDay : reward.day < currentDailyDay;
                    return (
                      <div key={reward.day} className={`rounded-xl border px-1 py-2 text-center ${active ? 'border-[#f0c442] bg-[#f0c442]/20 ring-1 ring-[#f0c442]' : claimed ? 'border-[#8a5a1e]/50 bg-[#1a1007]' : 'border-zinc-800 bg-black/40'} ${reward.epic ? 'shadow-[0_0_16px_rgba(255,200,0,0.18)]' : ''}`}>
                        <p className="text-[9px] text-zinc-500">D{reward.day}</p>
                        <p className="text-sm">{claimed ? '✅' : active ? '⭐' : '🔒'}</p>
                        <p className="text-[9px] font-bold text-[#f0c442]">{reward.corre}</p>
                      </div>
                    );
                  })}
                </div>
              </InfoCard>

              <InfoCard title="Economia do Giro" icon={<Crown className="h-4 w-4" />}>
                <ul className="space-y-2 text-sm leading-relaxed text-zinc-200">
                  <li>• cada aposta consome somente <b>Corres</b>, nunca Commands Sujo</li>
                  <li>• Commands Sujo alimenta treino da gangue e lavagem</li>
                  <li>• a prisão agora usa perda menor + cooldown progressivo</li>
                  <li>• o pedido de Corres da facção segue em <b>10 Corres total, 1 por membro</b></li>
                </ul>
              </InfoCard>

              <InfoCard title="Histórico" icon={<History className="h-4 w-4" />}>
                <div className="space-y-2">
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
              </InfoCard>

              <InfoCard title="Risco atual" icon={<Siren className="h-4 w-4" />}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-[#f1bf5e]">{risk.emoji} {risk.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-200">Usar {multiplier} Corre(s) aumenta retorno e exposição. O backend já trata a chance de blitz conforme risco e multiplicador.</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#7b5418] bg-black/55">
                    <Zap className="h-6 w-6 text-yellow-400" />
                  </div>
                </div>
              </InfoCard>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
