import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Coins, Zap, Menu } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { usePlayerStore } from '@/store/playerStore';
import { spinSlot, type GiroCardDrop } from '@/api/gameApi';

type SymbolKey = 'money' | 'diamond' | 'gun' | 'police';

type SpinResult = {
  reels: SymbolKey[];
  outcome?: 'jackpot' | 'big' | 'medium' | 'small' | 'common' | 'prison';
  dirtyGain: number;
  prison: boolean;
  label: string;
  riskPercent?: number;
  riskLabel?: string;
  correCost?: number;
  prisonPenalty?: {
    loss: number;
    lossPct: number;
    cooldownMs: number;
    cooldownUntil: number;
  } | null;
  cooldownUntil?: number;
  cardDrop?: GiroCardDrop | null;
};

const LOGO_WORDMARK = 'GIRO\nNO ASFALTO';
const COMMANDS_ICON = 'https://static.wixstatic.com/media/50f4bf_9bda4af1a12b47679336479a80b16eb8~mv2.png';
const MACHINE_TEXTURE = 'https://static.wixstatic.com/media/50f4bf_f0f13bffd67f4487bbad4fec560e36e5~mv2.png?originWidth=1024&originHeight=1920';

const SLOT_ASSETS: Record<SymbolKey, string> = {
  money: 'https://cdn-icons-png.flaticon.com/512/3135/3135706.png',
  diamond: 'https://cdn-icons-png.flaticon.com/512/616/494.png',
  gun: 'https://cdn-icons-png.flaticon.com/512/833/833472.png',
  police: 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png',
};

const SYMBOL_LABEL: Record<SymbolKey, string> = {
  money: 'Commands',
  diamond: 'Jackpot',
  gun: 'Arsenal',
  police: 'Blitz',
};

const MULTIPLIERS = [1, 2, 5, 10, 25, 50];
const REEL_STOP_MS = [1050, 1480, 1920];
const DEFAULT_REELS: SymbolKey[] = ['money', 'gun', 'diamond'];
const ANIMATION_SYMBOLS: SymbolKey[] = ['money', 'gun', 'diamond', 'police'];

function randomAnimationSymbol(): SymbolKey {
  return ANIMATION_SYMBOLS[Math.floor(Math.random() * ANIMATION_SYMBOLS.length)];
}

function formatNumber(value: number) {
  return Math.max(0, Math.floor(Number(value) || 0)).toLocaleString('pt-BR');
}

function formatShort(value: number) {
  const n = Math.max(0, Number(value) || 0);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.floor(n).toLocaleString('pt-BR');
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
    // feedback opcional
  }
}

function getPlayerName(player: any) {
  return player?.headerCustomization?.customName || player?.name || 'Jogador';
}

function getAvatar(player: any) {
  return player?.headerCustomization?.customAvatar || player?.avatar || '';
}

export default function GiroPage() {
  const navigate = useNavigate();
  const { player, isLoaded, hydratePlayerFromServer } = usePlayerStore();

  const [displayedReels, setDisplayedReels] = useState<SymbolKey[]>(DEFAULT_REELS);
  const [lockedReels, setLockedReels] = useState<boolean[]>([true, true, true]);
  const [landingReels, setLandingReels] = useState<boolean[]>([false, false, false]);
  const [spinning, setSpinning] = useState(false);
  const [multiplier, setMultiplier] = useState(25);
  const [message, setMessage] = useState('Escolha quantos Corres entram na rua.');
  const [spinError, setSpinError] = useState('');
  const [policeFlash, setPoliceFlash] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const reelTimers = useRef<number[]>([]);
  const reelIntervals = useRef<number[]>([]);

  const safePlayer = player as any;
  const corre = Math.max(0, Number(safePlayer?.balances?.corre || 0));
  const dirtyMoney = Math.max(0, Number(safePlayer?.balances?.dirtyMoney || 0));
  const playerCooldownUntil = Number(safePlayer?.prisonHistory?.cooldownUntil || 0);
  const activeCooldownUntil = Math.max(cooldownUntil, playerCooldownUntil);
  const cooldownRemaining = Math.max(0, activeCooldownUntil - Date.now());
  const canSpin = !spinning && cooldownRemaining <= 0 && corre >= multiplier;

  useEffect(() => {
    return () => {
      reelTimers.current.forEach((timer) => window.clearTimeout(timer));
      reelIntervals.current.forEach((timer) => window.clearInterval(timer));
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
      setMessage(result.label);
      setCooldownUntil(result.prisonPenalty?.cooldownUntil || result.cooldownUntil || 0);
      flashPolice();
      vibrate([160, 80, 160]);
      playTone(110, 0.28, 'sawtooth');
      setSpinning(false);
      return;
    }

    if (result.outcome === 'jackpot' || result.reels.every((symbol) => symbol === 'diamond')) {
      vibrate([80, 40, 80, 40, 160]);
      [440, 550, 660, 880].forEach((freq, idx) => window.setTimeout(() => playTone(freq, 0.12, 'sine'), idx * 90));
    } else {
      vibrate(35);
    }
setMessage(result.label);
    setSpinning(false);
  };

  const handleSpin = async () => {
    if (!safePlayer?._id) return;

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
    setMessage(`Colocando ${multiplier} Corre(s) na rua...`);

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
        }, 70 + i * 28);
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
      setDisplayedReels(DEFAULT_REELS);
      setLockedReels([true, true, true]);
      setLandingReels([false, false, false]);
      setSpinning(false);
    }
  };

  if (!isLoaded || !safePlayer?._id) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[#050505] text-white">
        Carregando Giro no Asfalto...
      </div>
    );
  }

  const avatarUrl = getAvatar(safePlayer);
  const playerName = getPlayerName(safePlayer);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      {/* Fundo texturizado */}
      <Image src={MACHINE_TEXTURE} alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-[0.18] blur-[1px]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(234,179,8,0.16),transparent_38%),linear-gradient(180deg,rgba(0,0,0,0.72),#050505_42%,#050505)]" />

      {/* Flash policial */}
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

      <div className="relative z-10 mx-auto max-w-[1200px] px-3 py-4 sm:px-4">
        {/* Header minimalista */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#7c561e]/70 bg-black/72 px-3 py-2 shadow-[0_0_28px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="rounded-xl border border-[#7c561e]/60 bg-white/[0.04] p-2 text-yellow-300 hover:bg-yellow-500/10">
              <Home className="h-4 w-4" />
            </button>
            <button onClick={() => navigate(-1)} className="rounded-xl border border-[#7c561e]/60 bg-white/[0.04] p-2 text-cyan-300 hover:bg-cyan-500/10">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="ml-1 flex items-center gap-2 rounded-xl border border-[#7c561e]/60 bg-black/60 px-2 py-1.5">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={playerName} className="h-9 w-9 rounded-lg object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 font-black text-yellow-300">{playerName[0] || '?'}</div>
              )}
              <div className="hidden sm:block">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-yellow-300">{playerName}</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Barraco {Number(safePlayer?.niveis?.barracoLevel || 1)}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-[#7c561e]/55 bg-black/70 px-3 py-2 shadow-[0_0_16px_rgba(0,0,0,0.4)]">
              <Coins className="h-4 w-4 text-yellow-300" />
              <div className="leading-none">
                <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">Sujo</p>
                <p className="text-sm font-black text-yellow-300">{formatShort(dirtyMoney)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[#7c561e]/55 bg-black/70 px-3 py-2 shadow-[0_0_16px_rgba(0,0,0,0.4)]">
              <Zap className="h-4 w-4 text-cyan-300" />
              <div className="leading-none">
                <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">Corre</p>
                <p className="text-sm font-black text-cyan-300">{formatNumber(corre)}</p>
              </div>
            </div>
            <button className="rounded-xl border border-[#7c561e]/60 bg-white/[0.04] p-2 text-zinc-300">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
{/* Slot Machine principal - layout puro da imagem */}
        <div className="relative rounded-3xl border border-[#7c561e]/80 bg-[linear-gradient(180deg,#1d1308,#050505_45%,#140b03)] p-6 shadow-[inset_0_0_55px_rgba(255,176,37,0.14),0_0_34px_rgba(0,0,0,0.65)]">
          {/* PRÊMIO */}
          <div className="mb-6 text-center">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-400">PRÊMIO</p>
            <p className="font-mono text-6xl font-black tracking-[0.08em] text-yellow-300 drop-shadow-[0_0_20px_rgba(255,190,0,0.5)] sm:text-7xl">
              {spinning ? '•••••' : formatNumber(Math.max(multiplier * 2000, 50000))}
            </p>
          </div>

          {/* Rolos */}
          <div className="relative mx-auto max-w-md">
            <div className="grid grid-cols-3 gap-3 rounded-[28px] border border-[#b18135]/55 bg-[linear-gradient(90deg,#d8b06a,#4b2a0a_14%,#e6c07d_50%,#4b2a0a_86%,#d8b06a)] p-4 shadow-[inset_0_0_32px_rgba(0,0,0,0.75)]">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="relative flex aspect-[0.7] items-center justify-center overflow-hidden rounded-2xl border border-black/70 bg-[radial-gradient(circle_at_50%_40%,#f5d8a8,#8b5b24_58%,#1b0e04)] shadow-[inset_0_0_18px_rgba(255,255,255,0.18)]">
                  <motion.img
                    key={`reel-${idx}-${displayedReels[idx]}-${lockedReels[idx]}-${landingReels[idx]}`}
                    src={SLOT_ASSETS[displayedReels[idx]]}
                    alt={SYMBOL_LABEL[displayedReels[idx]]}
                    initial={{ y: lockedReels[idx] ? -18 : 0, opacity: 0.85 }}
                    animate={
                      landingReels[idx]
                        ? { y: [-22, 6, -3, 0], opacity: 1, scale: [0.86, 1.18, 0.98, 1] }
                        : spinning && !lockedReels[idx]
                          ? { y: [0, -12, 0], opacity: 0.9, scale: 0.96 }
                          : { y: 0, opacity: 1, scale: 1 }
                    }
                    transition={spinning && !lockedReels[idx] ? { repeat: Infinity, duration: 0.14 } : { duration: 0.32 }}
                    className="h-[60%] w-[60%] object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.55)]"
                  />
                  {landingReels[idx] && <div className="absolute inset-0 rounded-2xl ring-2 ring-yellow-300 shadow-[inset_0_0_25px_rgba(255,210,0,0.55)]" />}
                </div>
              ))}
            </div>
          </div>

          {/* Controles: Aposta, Botão Girar/Parar, Custo */}
          <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-end gap-4">
            {/* APOSTA */}
            <div className="rounded-2xl border border-[#7c561e]/70 bg-black/70 p-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">APOSTA</p>
              <div className="mt-2 flex items-center justify-center gap-4">
                <button
                  disabled={spinning}
                  onClick={() => setMultiplier((value) => MULTIPLIERS[Math.max(0, MULTIPLIERS.indexOf(value) - 1)] || 1)}
                  className="h-10 w-10 rounded-xl border border-[#7c561e]/70 bg-white/[0.05] text-xl font-black text-white disabled:opacity-40"
                >
                  −
                </button>
                <span className="font-mono text-4xl font-black text-yellow-300">{multiplier}</span>
                <button
                  disabled={spinning}
                  onClick={() => setMultiplier((value) => MULTIPLIERS[Math.min(MULTIPLIERS.length - 1, MULTIPLIERS.indexOf(value) + 1)] || 50)}
                  className="h-10 w-10 rounded-xl border border-[#7c561e]/70 bg-white/[0.05] text-xl font-black text-white disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            {/* BOTÃO GIRAR / PARAR */}
            <button
              onClick={handleSpin}
              disabled={!canSpin && !spinning}
              className="relative min-w-[160px] overflow-hidden rounded-2xl border border-yellow-200/50 bg-gradient-to-b from-yellow-300 via-yellow-500 to-orange-700 px-8 py-5 text-xl font-black uppercase tracking-[0.12em] text-black shadow-[0_0_26px_rgba(255,193,7,0.42),inset_0_2px_0_rgba(255,255,255,0.45)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:grayscale"
            >
              <span className="relative z-10">{spinning ? 'PARAR' : 'GIRAR'}</span>
            </button>

            {/* CUSTO */}
            <div className="rounded-2xl border border-[#7c561e]/70 bg-black/70 p-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">CUSTO</p>
              <p className="mt-2 font-mono text-4xl font-black text-yellow-300">{multiplier}</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">CORRES</p>
            </div>
          </div>

          {/* Mensagem de status */}
          <div className="mt-6 rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-center text-sm text-zinc-300">
            {message}
          </div>

          {/* Atalho para alterar multiplicador rapidamente */}
          <div className="mt-4 flex justify-center gap-2">
            {MULTIPLIERS.map((value) => (
              <button
                key={value}
                onClick={() => setMultiplier(value)}
                disabled={spinning}
                className={`rounded-xl border px-3 py-1.5 text-xs font-black transition ${
                  multiplier === value
                    ? 'border-yellow-300 bg-yellow-500 text-black shadow-[0_0_12px_rgba(255,200,0,0.45)]'
                    : 'border-[#7c561e]/60 bg-black/70 text-yellow-100 hover:bg-yellow-500/10'
                } ${spinning ? 'opacity-50' : ''}`}
              >
                {value}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```