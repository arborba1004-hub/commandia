import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { usePlayerStore } from '@/store/playerStore';
import { spinSlot, type GiroCardDrop } from '@/api/gameApi';

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
  type: 'jackpot' | 'prison' | 'card' | 'info' | 'error';
  title: string;
  body: string;
};

const SLOT_ASSETS: Record<SymbolKey, string> = {
  money: 'https://cdn-icons-png.flaticon.com/512/3135/3135706.png',
  diamond: 'https://cdn-icons-png.flaticon.com/512/616/494.png',
  gun: 'https://cdn-icons-png.flaticon.com/512/833/833472.png',
  police: 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png',
};

const MULTIPLIERS = [1, 2, 5, 10, 25, 50];
const MULTIPLIERS_DESC = [...MULTIPLIERS].reverse();
const REEL_STOP_MS = [920, 1320, 1720];
const DEFAULT_REELS: SymbolKey[] = ['money', 'gun', 'diamond'];
const REEL_STRIP: SymbolKey[] = ['diamond', 'gun', 'money', 'police'];

function randomAnimationSymbol(): SymbolKey {
  return REEL_STRIP[Math.floor(Math.random() * REEL_STRIP.length)];
}

function formatNumber(value: number) {
  return Math.max(0, Math.floor(Number(value) || 0)).toLocaleString('pt-BR');
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
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Som é bônus visual/sensorial; nunca pode quebrar a página.
  }
}

function getReelSymbol(center: SymbolKey, offset: number, reelIndex: number): SymbolKey {
  const index = Math.max(0, REEL_STRIP.indexOf(center));
  return REEL_STRIP[(index + offset + reelIndex + REEL_STRIP.length) % REEL_STRIP.length];
}

function SpinToastCard({ toast }: { toast: SpinToast }) {
  const styles = {
    jackpot: 'border-yellow-400/60 bg-yellow-500/20 shadow-[0_0_34px_rgba(255,200,0,0.36)]',
    prison: 'border-red-400/60 bg-red-500/20 shadow-[0_0_34px_rgba(255,0,0,0.30)]',
    card: 'border-purple-400/60 bg-purple-500/20 shadow-[0_0_34px_rgba(168,85,247,0.24)]',
    info: 'border-cyan-400/60 bg-cyan-500/20 shadow-[0_0_34px_rgba(34,211,238,0.20)]',
    error: 'border-red-400/60 bg-red-500/20 shadow-[0_0_34px_rgba(255,0,0,0.20)]',
  }[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.94 }}
      className={`pointer-events-auto w-[315px] max-w-[calc(100vw-2rem)] rounded-2xl border px-4 py-3 text-left backdrop-blur-xl ${styles}`}
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white">{toast.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-200">{toast.body}</p>
    </motion.div>
  );
}

function BulletHole({ className }: { className: string }) {
  return (
    <div
      className={`pointer-events-none absolute h-14 w-14 rounded-full opacity-70 ${className}`}
      style={{
        background:
          'radial-gradient(circle, rgba(0,0,0,0.98) 0 16%, rgba(255,220,150,0.65) 17% 19%, rgba(0,0,0,0.76) 20% 27%, transparent 28%), conic-gradient(from 10deg, transparent 0 20deg, rgba(255,220,160,0.45) 22deg 24deg, transparent 26deg 76deg, rgba(255,220,160,0.38) 78deg 80deg, transparent 82deg 152deg, rgba(255,220,160,0.35) 154deg 156deg, transparent 158deg 236deg, rgba(255,220,160,0.34) 238deg 240deg, transparent 242deg 360deg)',
      }}
    />
  );
}

function ResourcePill({ icon, value, tone = 'gold' }: { icon: string; value: string; tone?: 'gold' | 'green' | 'energy' }) {
  const toneClass = {
    gold: 'from-yellow-950/80 via-black/85 to-black/80 border-yellow-500/25 text-yellow-100',
    green: 'from-emerald-950/75 via-black/85 to-black/80 border-emerald-500/25 text-emerald-100',
    energy: 'from-amber-950/80 via-black/85 to-black/80 border-amber-500/25 text-amber-100',
  }[tone];

  return (
    <div className={`flex h-12 min-w-[132px] items-center gap-2 rounded-xl border bg-gradient-to-b px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_8px_24px_rgba(0,0,0,0.45)] ${toneClass}`}>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-black/40 text-xl shadow-[0_0_14px_rgba(255,192,64,0.25)]">{icon}</span>
      <span className="text-lg font-black leading-none tracking-wide drop-shadow-[0_1px_0_rgba(0,0,0,0.8)]">{value}</span>
    </div>
  );
}

export default function GiroPage() {
  const { player, isLoaded, hydratePlayerFromServer } = usePlayerStore();

  const [displayedReels, setDisplayedReels] = useState<SymbolKey[]>(DEFAULT_REELS);
  const [lockedReels, setLockedReels] = useState<boolean[]>([true, true, true]);
  const [landingReels, setLandingReels] = useState<boolean[]>([false, false, false]);
  const [spinning, setSpinning] = useState(false);
  const [multiplier, setMultiplier] = useState(25);
  const [message, setMessage] = useState('Pronta pra rodar.');
  const [spinError, setSpinError] = useState('');
  const [policeFlash, setPoliceFlash] = useState(false);
  const [toasts, setToasts] = useState<SpinToast[]>([]);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [lastSpinGain, setLastSpinGain] = useState<number | null>(null);

  const reelTimers = useRef<number[]>([]);
  const reelIntervals = useRef<number[]>([]);
  const toastTimers = useRef<number[]>([]);

  const corre = Math.max(0, Number(player?.balances?.corre || 0));
  const dirtyMoney = Math.max(0, Number(player?.balances?.dirtyMoney || 0));
  const cleanMoney = Math.max(0, Number(player?.balances?.cleanMoney || 0));
  const avatarUrl = (player as any)?.headerCustomization?.customAvatar || (player as any)?.avatar || '';
  const playerName = (player as any)?.headerCustomization?.customName || player?.name || 'Jogador';
  const correCap = Math.max(50, Math.ceil(Math.max(corre, 1) / 50) * 50);
  const playerCooldownUntil = Number(player?.prisonHistory?.cooldownUntil || 0);
  const activeCooldownUntil = Math.max(cooldownUntil, playerCooldownUntil);
  const cooldownRemaining = Math.max(0, activeCooldownUntil - Date.now());
  const canSpin = !spinning && cooldownRemaining <= 0 && corre >= multiplier;
  const displayedPrize = lastSpinGain !== null && !spinning ? lastSpinGain : multiplier * 2000;

  const statusText = useMemo(() => {
    if (cooldownRemaining > 0) return `Corre esfriando: ${Math.ceil(cooldownRemaining / 1000)}s`;
    if (spinError) return spinError;
    if (corre < multiplier) return 'Sem Corre suficiente.';
    return message;
  }, [cooldownRemaining, corre, message, multiplier, spinError]);

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
    setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, 3));
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3000);
    toastTimers.current.push(timer);
  };

  const clearAnimations = () => {
    reelTimers.current.forEach((timer) => window.clearTimeout(timer));
    reelIntervals.current.forEach((timer) => window.clearInterval(timer));
    reelTimers.current = [];
    reelIntervals.current = [];
  };

  const flashPolice = () => {
    setPoliceFlash(true);
    window.setTimeout(() => setPoliceFlash(false), 850);
  };

  const finalizeSpin = (result: SpinResult) => {
    if (result.prison) {
      const loss = result.prisonPenalty?.loss || 0;
      const cooldownMs = result.prisonPenalty?.cooldownMs || 0;
      setLastSpinGain(0);
      setMessage(result.label);
      setCooldownUntil(result.prisonPenalty?.cooldownUntil || result.cooldownUntil || 0);
      flashPolice();
      vibrate([160, 80, 160]);
      playTone(110, 0.28, 'sawtooth');
      addToast({
        type: 'prison',
        title: 'Rodou na blitz',
        body: `Perdeu ${formatNumber(loss)} Commands Sujo${cooldownMs ? ` e precisa esperar ${Math.round(cooldownMs / 1000)}s.` : '.'}`,
      });
      setSpinning(false);
      return;
    }

    setLastSpinGain(result.dirtyGain || 0);
    setMessage(result.label);
    vibrate(result.outcome === 'jackpot' ? [80, 40, 80, 40, 160] : 35);

    if (result.outcome === 'jackpot' || result.reels.every((symbol) => symbol === 'diamond')) {
      [440, 550, 660, 880].forEach((freq, idx) => window.setTimeout(() => playTone(freq, 0.12, 'sine'), idx * 90));
      addToast({
        type: 'jackpot',
        title: 'Prêmio pesado',
        body: `+${formatNumber(result.dirtyGain)} Commands Sujo.`,
      });
    } else {
      addToast({
        type: 'info',
        title: result.label,
        body: `+${formatNumber(result.dirtyGain)} Commands Sujo.`,
      });
    }

    if (result.cardDrop) {
      addToast({
        type: 'card',
        title: `Carta ${result.cardDrop.rarity.toUpperCase()}`,
        body: `${result.cardDrop.name} entrou na coleção.`,
      });
    }

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
        setMessage('Sem Corre suficiente pra bancar essa aposta.');
      }
      return;
    }

    vibrate(30);
    playTone(330, 0.05);
    setSpinError('');
    setLastSpinGain(null);
    clearAnimations();
    setDisplayedReels(DEFAULT_REELS);
    setLockedReels([false, false, false]);
    setLandingReels([false, false, false]);
    setSpinning(true);
    setMessage(`Rodando ${multiplier}x...`);

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
        }, 64 + i * 26);

        reelIntervals.current.push(interval);

        const timer = window.setTimeout(() => {
          window.clearInterval(interval);
          playTone(220 + i * 130, 0.07);
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
          }, 380);

          setLockedReels((prev) => {
            const clone = [...prev];
            clone[i] = true;
            return clone;
          });

          if (i === 2) {
            window.setTimeout(() => finalizeSpin(result), 160);
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
      const text = error instanceof Error ? error.message : 'Erro ao rodar o Giro';
      setSpinError(text);
      setMessage('Falha ao rodar.');
      addToast({ type: 'error', title: 'Giro negado', body: text });
      setDisplayedReels(DEFAULT_REELS);
      setLockedReels([true, true, true]);
      setLandingReels([false, false, false]);
      setSpinning(false);
    }
  };

  const changeMultiplier = (direction: -1 | 1) => {
    if (spinning) return;
    const currentIndex = MULTIPLIERS.indexOf(multiplier);
    const nextIndex = Math.min(MULTIPLIERS.length - 1, Math.max(0, currentIndex + direction));
    setMultiplier(MULTIPLIERS[nextIndex]);
    setLastSpinGain(null);
  };

  if (!isLoaded || !player?._id) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#050507] text-sm font-black uppercase tracking-[0.22em] text-yellow-200">
        Carregando Giro...
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,181,65,0.20),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(120,72,25,0.35),transparent_46%),linear-gradient(90deg,rgba(6,8,11,1),rgba(22,24,27,1)_45%,rgba(5,6,8,1))]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:62px_62px]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black via-black/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black via-black/70 to-transparent" />

      <BulletHole className="left-[6%] top-[24%] hidden md:block" />
      <BulletHole className="left-[24%] top-[13%] scale-75" />
      <BulletHole className="right-[21%] top-[13%] scale-90" />
      <BulletHole className="right-[8%] top-[18%] hidden md:block" />
      <BulletHole className="left-[9%] bottom-[25%] scale-90 hidden lg:block" />

      <AnimatePresence>
        {policeFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.12, 0.42, 0.08, 0.35, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85 }}
            className="pointer-events-none fixed inset-0 z-[70]"
          >
            <div className="absolute inset-0 bg-red-600/35" />
            <div className="absolute inset-0 bg-blue-600/25 mix-blend-screen" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none fixed left-1/2 top-20 z-[90] flex -translate-x-1/2 flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <SpinToastCard key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1360px] flex-col px-3 py-4 sm:px-5 lg:px-8">
        <div className="flex w-full items-center justify-center md:justify-start">
          <div className="flex max-w-full items-center gap-2 rounded-2xl border border-[#8a6a35]/45 bg-black/62 p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_18px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#9b7844]/70 bg-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" title={playerName}>
              {avatarUrl ? (
                <Image src={avatarUrl} alt={playerName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-black text-yellow-200">{playerName[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
            <ResourcePill icon="🪙" value={formatNumber(dirtyMoney)} />
            <ResourcePill icon="💵" value={formatNumber(cleanMoney)} tone="green" />
            <ResourcePill icon="⚡" value={`${formatNumber(corre)}/${formatNumber(correCap)}`} tone="energy" />
            <button
              type="button"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#9b7844]/70 bg-gradient-to-b from-zinc-700 to-zinc-950 text-3xl font-black text-yellow-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_18px_rgba(0,0,0,0.45)]"
              aria-label="Adicionar Corres"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center pb-5 pt-4 md:pt-2">
          <div className="relative w-full max-w-[1080px]">
            <div className="relative mx-auto w-[min(86vw,850px)]">
              <div className="absolute -right-[76px] top-[28%] z-20 hidden w-[74px] overflow-hidden rounded-[18px] border border-[#7b5c31]/75 bg-black/80 p-1 shadow-[0_16px_34px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.08)] md:block">
                {MULTIPLIERS_DESC.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      if (!spinning) {
                        setMultiplier(value);
                        setLastSpinGain(null);
                      }
                    }}
                    disabled={spinning}
                    className={`mb-1 grid h-12 w-full place-items-center rounded-xl text-2xl font-black transition last:mb-0 ${
                      multiplier === value
                        ? 'border border-yellow-300 bg-gradient-to-b from-yellow-400 to-amber-700 text-white shadow-[0_0_18px_rgba(255,190,0,0.65),inset_0_1px_0_rgba(255,255,255,0.45)]'
                        : 'border border-transparent bg-black/35 text-zinc-200 hover:border-yellow-500/40 hover:bg-yellow-500/10'
                    } ${spinning ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    {value}x
                  </button>
                ))}
              </div>

              <div className="relative rounded-[34px] border border-[#8a673d]/80 bg-gradient-to-b from-[#15110d] via-[#070707] to-[#1c1209] p-3 shadow-[0_32px_80px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12)] sm:rounded-[42px] sm:p-5">
                <div className="pointer-events-none absolute -left-5 top-[18%] h-40 w-9 rounded-l-full bg-gradient-to-r from-[#37200f] to-[#d69d52] shadow-[inset_0_0_16px_rgba(255,255,255,0.18)]" />
                <div className="pointer-events-none absolute -right-5 top-[18%] h-40 w-9 rounded-r-full bg-gradient-to-l from-[#37200f] to-[#d69d52] shadow-[inset_0_0_16px_rgba(255,255,255,0.18)]" />
                <div className="pointer-events-none absolute -right-16 top-[22%] hidden h-28 w-7 rounded-full bg-gradient-to-b from-yellow-600 via-[#4b2c12] to-black shadow-[0_0_20px_rgba(255,166,60,0.45)] md:block" />
                <div className="pointer-events-none absolute -right-[86px] top-[16%] hidden h-16 w-16 rounded-full border border-[#9b7844]/80 bg-gradient-to-br from-[#f2b45b] via-[#6b3b14] to-black shadow-[0_0_26px_rgba(255,160,55,0.44)] md:block" />

                <div className="relative mb-[-8px] px-[10%] sm:px-[13%]">
                  <div className="relative rounded-t-[28px] border border-[#8a673d]/85 bg-gradient-to-b from-black via-[#20170e] to-black px-3 pb-4 pt-2 text-center shadow-[inset_0_2px_0_rgba(255,255,255,0.11),0_8px_24px_rgba(0,0,0,0.6)]">
                    <div className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-black shadow-[0_0_0_2px_rgba(180,130,70,0.55)]" />
                    <div className="absolute right-6 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-black shadow-[0_0_0_2px_rgba(180,130,70,0.55)]" />
                    <div className="absolute left-1/2 top-[-18px] -translate-x-1/2 rounded-b-xl rounded-t-2xl border border-[#8a673d]/85 bg-black px-7 py-2 text-xl font-black uppercase tracking-[0.12em] text-yellow-300 shadow-[0_0_18px_rgba(255,190,0,0.28)] sm:text-2xl">
                      Prêmio
                    </div>
                    <motion.div
                      key={displayedPrize}
                      initial={{ scale: 0.94, opacity: 0.86 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="pt-7 font-black leading-none tracking-[0.04em] text-yellow-300 drop-shadow-[0_0_16px_rgba(255,184,0,0.75)] [font-size:clamp(3rem,9vw,6.5rem)]"
                    >
                      {formatNumber(displayedPrize)}
                    </motion.div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[28px] border border-[#6f4b25]/90 bg-gradient-to-b from-[#20150c] via-[#090807] to-[#20130b] p-3 shadow-[inset_0_0_34px_rgba(0,0,0,0.82)] sm:rounded-[34px] sm:p-5">
                  <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/13 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />

                  <div className="relative grid h-[260px] grid-cols-3 gap-2 overflow-hidden rounded-[22px] border border-[#a8783f]/35 bg-gradient-to-b from-[#ead6b7] via-[#b18b62] to-[#342116] p-2 shadow-[inset_0_0_34px_rgba(0,0,0,0.50)] sm:h-[330px] sm:gap-3 sm:p-3 lg:h-[380px]">
                    {[0, 1, 2].map((idx) => {
                      const center = displayedReels[idx];
                      const top = getReelSymbol(center, -1, idx);
                      const bottom = getReelSymbol(center, 1, idx);

                      return (
                        <div key={idx} className="relative overflow-hidden rounded-[18px] border-x border-black/35 bg-gradient-to-b from-[#f4dfc0] via-[#bd9169] to-[#26150c] shadow-[inset_0_0_38px_rgba(0,0,0,0.55)]">
                          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/35 to-transparent" />
                          <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-black/35 to-transparent" />
                          <motion.div
                            key={`strip-${idx}-${center}-${lockedReels[idx]}-${landingReels[idx]}`}
                            animate={
                              landingReels[idx]
                                ? { y: [-18, 6, -2, 0], scale: [0.98, 1.05, 0.99, 1] }
                                : spinning && !lockedReels[idx]
                                  ? { y: [0, -24, 0] }
                                  : { y: 0 }
                            }
                            transition={spinning && !lockedReels[idx] ? { repeat: Infinity, duration: 0.18 } : { duration: 0.34 }}
                            className="relative z-10 flex h-full flex-col items-center justify-around py-3"
                          >
                            {[top, center, bottom].map((symbol, symbolIndex) => (
                              <div
                                key={`${symbol}-${symbolIndex}`}
                                className={`${symbolIndex === 1 ? 'h-[42%] w-[74%]' : 'h-[28%] w-[58%] opacity-86'} grid place-items-center rounded-2xl bg-black/0`}
                              >
                                <img
                                  src={SLOT_ASSETS[symbol]}
                                  alt={symbol}
                                  className="h-full w-full object-contain drop-shadow-[0_10px_14px_rgba(0,0,0,0.55)]"
                                  draggable={false}
                                />
                              </div>
                            ))}
                          </motion.div>
                          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-[2px] -translate-y-1/2 bg-white/18 shadow-[0_0_16px_rgba(255,255,255,0.30)]" />
                          {landingReels[idx] && <div className="pointer-events-none absolute inset-0 z-30 rounded-[18px] border-2 border-yellow-300 shadow-[inset_0_0_24px_rgba(255,220,0,0.42),0_0_24px_rgba(255,220,0,0.46)]" />}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pointer-events-none absolute inset-x-3 bottom-2 h-10 rounded-b-[24px] border-b border-yellow-600/25 bg-gradient-to-t from-black/80 to-transparent" />
                </div>

                <div className="mt-3 grid grid-cols-[1fr_minmax(150px,240px)_1fr] items-end gap-2 sm:mt-5 sm:gap-4">
                  <div className="rounded-2xl border border-[#7b5c31]/70 bg-black/76 p-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.09)] sm:p-3">
                    <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-200">Aposta</p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => changeMultiplier(-1)}
                        disabled={spinning || multiplier === MULTIPLIERS[0]}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-zinc-900 text-3xl font-black text-zinc-100 disabled:opacity-35"
                      >
                        −
                      </button>
                      <div className="min-w-12 text-3xl font-black text-yellow-100">{multiplier}</div>
                      <button
                        type="button"
                        onClick={() => changeMultiplier(1)}
                        disabled={spinning || multiplier === MULTIPLIERS[MULTIPLIERS.length - 1]}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-zinc-900 text-3xl font-black text-zinc-100 disabled:opacity-35"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSpin}
                    disabled={!canSpin}
                    className="h-[74px] rounded-[22px] border border-[#9b7844]/80 bg-gradient-to-b from-[#857162] via-[#2e2a27] to-[#111] px-4 text-3xl font-black uppercase tracking-[0.08em] text-zinc-100 shadow-[inset_0_2px_0_rgba(255,255,255,0.18),0_10px_25px_rgba(0,0,0,0.55)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-55 sm:text-4xl"
                  >
                    {spinning ? 'Parar' : 'Rodar'}
                  </button>

                  <div className="rounded-2xl border border-[#7b5c31]/70 bg-black/76 p-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.09)] sm:p-3">
                    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-200">Custo</p>
                    <div className="flex h-10 items-center justify-center gap-2 rounded-xl bg-black/40 px-2">
                      <span className="text-2xl">⚡</span>
                      <span className="text-2xl font-black text-yellow-100">{formatNumber(multiplier)}</span>
                    </div>
                  </div>
                </div>

                <div className="mx-auto mt-3 min-h-8 max-w-[640px] rounded-full border border-white/8 bg-black/44 px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  {statusText}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-6 gap-1.5 md:hidden">
                {MULTIPLIERS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      if (!spinning) {
                        setMultiplier(value);
                        setLastSpinGain(null);
                      }
                    }}
                    disabled={spinning}
                    className={`rounded-xl py-2 text-sm font-black ${multiplier === value ? 'bg-yellow-400 text-black' : 'border border-yellow-700/40 bg-black/60 text-zinc-200'}`}
                  >
                    {value}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
