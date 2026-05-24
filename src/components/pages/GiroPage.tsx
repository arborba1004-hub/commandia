import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Home,
  Coins,
  Siren,
  Bell,
  CalendarDays,
  Gift,
  Shield,
  Star,
  Trophy,
  Users,
  Zap,
  Box,
  Menu,
  BarChart3,
  Sparkles,
  Crosshair,
} from 'lucide-react';
import { Image } from '@/components/ui/image';
import { usePlayerStore } from '@/store/playerStore';
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
  type: 'jackpot' | 'prison' | 'card' | 'daily' | 'info' | 'error' | 'attack';
  title: string;
  body: string;
};

type CardSummary = {
  setId: string;
  setName: string;
  owned: number;
  total: number;
  cards: Array<{ cardId: string; name?: string; rarity?: string; quantity?: number; isGolden?: boolean }>;
  completed: boolean;
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

const RISK_CONFIG: Record<number, { risk: number; label: string; emoji: string; bar: string; text: string }> = {
  1: { risk: 10, label: 'Seguro', emoji: '🟢', bar: 'bg-emerald-500', text: 'text-emerald-300' },
  2: { risk: 20, label: 'Baixo', emoji: '🟡', bar: 'bg-lime-400', text: 'text-lime-300' },
  5: { risk: 35, label: 'Médio', emoji: '🟡', bar: 'bg-yellow-400', text: 'text-yellow-300' },
  10: { risk: 52, label: 'Arriscado', emoji: '🟠', bar: 'bg-orange-500', text: 'text-orange-300' },
  25: { risk: 72, label: 'Alto', emoji: '🔴', bar: 'bg-red-500', text: 'text-red-300' },
  50: { risk: 92, label: 'Extremo', emoji: '💀', bar: 'bg-red-700', text: 'text-red-200' },
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

const NAV_ITEMS = [
  { label: 'Barraco', icon: Home, path: '/barraco' },
  { label: 'Arsenal', icon: Crosshair, path: '/arsenal' },
  { label: 'Giro', icon: Sparkles, path: '/giro' },
  { label: 'Mapa', icon: Star, path: '/game' },
  { label: 'Facção', icon: Shield, path: '/faccao' },
  { label: 'Loja', icon: Gift, path: '/shop' },
];

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
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // feedback sonoro é opcional e nunca pode quebrar o giro.
  }
}

function getPlayerName(player: any) {
  return player?.headerCustomization?.customName || player?.name || 'Jogador';
}

function getAvatar(player: any) {
  return player?.headerCustomization?.customAvatar || player?.avatar || '';
}

function getCardSummaries(player: any): CardSummary[] {
  const collection = player?.cardCollection;
  const rawCards = Array.isArray(collection?.cards) ? collection.cards : [];
  const completedSets = Array.isArray(collection?.completedSets) ? collection.completedSets : [];
  const bySet = new Map<string, CardSummary>();

  rawCards.forEach((card: any) => {
    const setId = String(card?.setId || 'contrabando');
    const setName = String(card?.setName || setId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    const current = bySet.get(setId) || {
      setId,
      setName,
      owned: 0,
      total: 9,
      cards: [],
      completed: completedSets.includes(setId),
    };
    if (Number(card?.quantity || 0) > 0) current.owned += 1;
    current.cards.push(card);
    bySet.set(setId, current);
  });

  if (bySet.size === 0) {
    return [
      { setId: 'familia_asfalto', setName: 'Família Asfalto', owned: 0, total: 9, cards: [], completed: false },
      { setId: 'mafia_rival', setName: 'Máfia Rival', owned: 0, total: 9, cards: [], completed: false },
      { setId: 'contrabando', setName: 'Contrabando', owned: 0, total: 9, cards: [], completed: false },
    ];
  }

  return Array.from(bySet.values())
    .map((set) => ({ ...set, total: Math.max(9, set.cards.length || 9) }))
    .sort((a, b) => Number(b.completed) - Number(a.completed) || b.owned - a.owned)
    .slice(0, 3);
}

function SpinToastCard({ toast }: { toast: SpinToast }) {
  const styles = {
    jackpot: 'border-yellow-400/60 bg-yellow-500/15 shadow-[0_0_38px_rgba(255,200,0,0.34)]',
    prison: 'border-red-400/60 bg-red-500/15 shadow-[0_0_38px_rgba(255,0,0,0.28)]',
    card: 'border-purple-400/60 bg-purple-500/15 shadow-[0_0_38px_rgba(168,85,247,0.24)]',
    daily: 'border-emerald-400/60 bg-emerald-500/15 shadow-[0_0_38px_rgba(16,185,129,0.22)]',
    info: 'border-cyan-400/60 bg-cyan-500/15 shadow-[0_0_38px_rgba(34,211,238,0.20)]',
    error: 'border-red-400/60 bg-red-500/15 shadow-[0_0_38px_rgba(255,0,0,0.20)]',
    attack: 'border-cyan-400/60 bg-cyan-500/15 shadow-[0_0_38px_rgba(34,211,238,0.20)]',
  }[toast.type];

  const icon = {
    jackpot: '💰',
    prison: '🚔',
    card: '🃏',
    daily: '🎁',
    info: '⚡',
    error: '⚠️',
    attack: '🛡️',
  }[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 32, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.94 }}
      className={`pointer-events-auto rounded-2xl border px-4 py-3 backdrop-blur-xl ${styles}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-xl">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white">{toast.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-200">{toast.body}</p>
        </div>
      </div>
    </motion.div>
  );
}

function BoardPanel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-[#7c561e]/70 bg-black/72 shadow-[inset_0_0_22px_rgba(255,183,58,0.04)] ${className}`}>
      <div className="border-b border-[#7c561e]/45 px-4 py-3">
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-yellow-400 sm:text-base">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function StatPill({ icon, label, value, tone = 'yellow' }: { icon: ReactNode; label: string; value: string; tone?: 'yellow' | 'green' | 'blue' }) {
  const toneClass = tone === 'green' ? 'text-emerald-300' : tone === 'blue' ? 'text-cyan-300' : 'text-yellow-300';
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#7c561e]/55 bg-black/70 px-3 py-2 shadow-[0_0_16px_rgba(0,0,0,0.4)]">
      <span className={toneClass}>{icon}</span>
      <div className="leading-none">
        <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
        <p className={`mt-1 text-sm font-black ${toneClass}`}>{value}</p>
      </div>
    </div>
  );
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
  const [history, setHistory] = useState<string[]>([]);
  const [spinError, setSpinError] = useState('');
  const [policeFlash, setPoliceFlash] = useState(false);
  const [toasts, setToasts] = useState<SpinToast[]>([
    { id: 'demo-jackpot', type: 'jackpot', title: 'Jackpot!', body: 'Use Corres para puxar Commands Sujo, cartas e baús.' },
    { id: 'demo-prison', type: 'prison', title: 'Blitz no radar', body: 'Risco alto aumenta retorno, mas também esquenta a rua.' },
    { id: 'demo-attack', type: 'attack', title: 'Ataque recebido', body: 'Notificações aparecem aqui sem travar sua jogada.' },
  ]);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const reelTimers = useRef<number[]>([]);
  const reelIntervals = useRef<number[]>([]);
  const toastTimers = useRef<number[]>([]);

  const safePlayer = player as any;
  const corre = Math.max(0, Number(safePlayer?.balances?.corre || 0));
  const dirtyMoney = Math.max(0, Number(safePlayer?.balances?.dirtyMoney || 0));
  const cleanMoney = Math.max(0, Number(safePlayer?.balances?.cleanMoney || 0));
  const dailyCorre = safePlayer?.dailyCorre || { streak: 0, lastClaimDate: '', totalClaims: 0 };
  const alreadyClaimedToday = dailyCorre.lastClaimDate === todayKey();
  const currentDailyDay = ((Math.max(1, Number(dailyCorre.streak || 0) + (alreadyClaimedToday ? 0 : 1)) - 1) % 7) + 1;
  const risk = RISK_CONFIG[multiplier] || RISK_CONFIG[1];
  const playerCooldownUntil = Number(safePlayer?.prisonHistory?.cooldownUntil || 0);
  const activeCooldownUntil = Math.max(cooldownUntil, playerCooldownUntil);
  const cooldownRemaining = Math.max(0, activeCooldownUntil - Date.now());
  const canSpin = !spinning && cooldownRemaining <= 0 && corre >= multiplier;
  const cardSummaries = useMemo(() => getCardSummaries(safePlayer), [safePlayer?.cardCollection]);
  const chests = safePlayer?.cardCollection?.chests || {};

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
    setToasts((prev) => [{ ...toast, id }, ...prev.filter((item) => !String(item.id).startsWith('demo-'))].slice(0, 4));
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
    toastTimers.current.push(timer);
  };

  const addHistory = (entry: string) => {
    setHistory((prev) => [entry, ...prev].slice(0, 6));
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

  if (!isLoaded || !safePlayer?._id) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-[#050505] text-white flex items-center justify-center">
        Carregando Giro no Asfalto...
      </div>
    );
  }

  const avatarUrl = getAvatar(safePlayer);
  const playerName = getPlayerName(safePlayer);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <Image src={MACHINE_TEXTURE} alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-[0.18] blur-[1px]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(234,179,8,0.16),transparent_38%),linear-gradient(180deg,rgba(0,0,0,0.72),#050505_42%,#050505)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(255,180,35,0.06)_1px,transparent_1px),linear-gradient(rgba(255,180,35,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35" />

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

      <div className="relative z-10 mx-auto max-w-[1580px] px-3 py-4 sm:px-4 lg:px-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#7c561e]/70 bg-black/72 px-3 py-2 shadow-[0_0_28px_rgba(0,0,0,0.45)] backdrop-blur-xl">
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

          <div className="grid flex-1 grid-cols-3 gap-2 sm:flex sm:flex-none">
            <StatPill icon={<Coins className="h-4 w-4" />} label="Sujo" value={formatShort(dirtyMoney)} tone="yellow" />
            <StatPill icon={<Image src={COMMANDS_ICON} alt="" className="h-4 w-4 object-contain" />} label="Limpo" value={formatShort(cleanMoney)} tone="green" />
            <StatPill icon={<Zap className="h-4 w-4" />} label="Corre" value={`${formatNumber(corre)}`} tone="blue" />
          </div>

          <button className="hidden rounded-xl border border-[#7c561e]/60 bg-white/[0.04] p-2 text-zinc-300 lg:block">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 xl:grid-cols-[230px_minmax(520px,1fr)_680px]">
          <BoardPanel title="Sistema de Giro Premium" className="min-h-[445px]">
            <div className="whitespace-pre-line text-[42px] font-black uppercase italic leading-[0.82] tracking-[-0.08em] text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.75)] sm:text-[50px]">
              <span>{LOGO_WORDMARK.split('\n')[0]}</span>
              <br />
              <span className="text-red-600 drop-shadow-[0_3px_0_rgba(0,0,0,0.9)]">{LOGO_WORDMARK.split('\n')[1]}</span>
            </div>
            <p className="mt-5 text-lg font-black uppercase leading-tight text-white">
              Sistema de corre premium inspirado no <span className="text-yellow-400">Coin Master</span>
            </p>
            <p className="mt-3 border-b border-[#7c561e]/50 pb-4 text-sm leading-relaxed text-zinc-400">
              O Corre é a atividade criminosa: tráfico, assalto, golpe, transporte, venda e risco de blitz.
            </p>
            <div className="mt-4 space-y-2 text-sm text-zinc-300">
              {[
                ['🎯', 'Slot Machine como North Star'],
                ['🎲', 'Sistema de aposta dinâmico'],
                ['⏰', 'Loop de sessão inteligente'],
                ['🛡️', 'Risco, cooldown e proteção'],
                ['🃏', 'Cartas e coleções'],
                ['🔥', 'Eventos temporários'],
                ['👥', 'Facção, trocas e ajuda'],
                ['⭐', 'Monetização estratégica'],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-2">
                  <span className="text-yellow-400">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </BoardPanel>

          <BoardPanel title="Prêmio" className="min-h-[445px] overflow-hidden">
            <div className="relative rounded-[28px] border border-[#7c561e]/80 bg-[linear-gradient(180deg,#1d1308,#050505_45%,#140b03)] p-4 shadow-[inset_0_0_55px_rgba(255,176,37,0.14),0_0_34px_rgba(0,0,0,0.65)]">
              <div className="absolute -left-8 top-10 h-24 w-24 rounded-full bg-yellow-500/10 blur-2xl" />
              <div className="absolute -right-8 bottom-10 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl" />

              <div className="mb-3 rounded-2xl border border-[#7c561e]/80 bg-black/75 px-4 py-2 text-center shadow-[inset_0_0_20px_rgba(255,196,0,0.12)]">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-yellow-400">Prêmio</p>
                <p className="font-mono text-4xl font-black tracking-[0.08em] text-yellow-300 drop-shadow-[0_0_16px_rgba(255,190,0,0.5)] sm:text-5xl">
                  {spinning ? '•••••' : formatNumber(Math.max(multiplier * 2000, 50000))}
                </p>
              </div>

              <div className="relative grid grid-cols-3 gap-2 rounded-[24px] border border-[#b18135]/55 bg-[linear-gradient(90deg,#d8b06a,#4b2a0a_14%,#e6c07d_50%,#4b2a0a_86%,#d8b06a)] p-3 shadow-[inset_0_0_32px_rgba(0,0,0,0.75)]">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="relative flex aspect-[0.78] items-center justify-center overflow-hidden rounded-[20px] border border-black/70 bg-[radial-gradient(circle_at_50%_40%,#f5d8a8,#8b5b24_58%,#1b0e04)] shadow-[inset_0_0_18px_rgba(255,255,255,0.18)]">
                    <div className="absolute inset-y-0 left-0 w-px bg-white/30" />
                    <div className="absolute inset-y-0 right-0 w-px bg-black/40" />
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
                      className={`h-[58%] w-[58%] object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.55)] ${landingReels[idx] ? 'brightness-125' : ''}`}
                    />
                    {landingReels[idx] && <div className="absolute inset-0 rounded-[20px] ring-2 ring-yellow-300 shadow-[inset_0_0_25px_rgba(255,210,0,0.55)]" />}
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                <div className="rounded-2xl border border-[#7c561e]/70 bg-black/70 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Aposta</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <button disabled={spinning} onClick={() => setMultiplier((value) => MULTIPLIERS[Math.max(0, MULTIPLIERS.indexOf(value) - 1)] || 1)} className="h-8 w-8 rounded-lg border border-[#7c561e]/70 bg-white/[0.05] font-black text-white disabled:opacity-40">−</button>
                    <span className="font-mono text-2xl font-black text-yellow-300">{multiplier}</span>
                    <button disabled={spinning} onClick={() => setMultiplier((value) => MULTIPLIERS[Math.min(MULTIPLIERS.length - 1, MULTIPLIERS.indexOf(value) + 1)] || 50)} className="h-8 w-8 rounded-lg border border-[#7c561e]/70 bg-white/[0.05] font-black text-white disabled:opacity-40">+</button>
                  </div>
                </div>

                <button
                  onClick={handleSpin}
                  disabled={!canSpin}
                  className="relative min-w-[150px] overflow-hidden rounded-[22px] border border-yellow-200/50 bg-gradient-to-b from-yellow-300 via-yellow-500 to-orange-700 px-8 py-4 text-lg font-black uppercase tracking-[0.12em] text-black shadow-[0_0_26px_rgba(255,193,7,0.42),inset_0_2px_0_rgba(255,255,255,0.45)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:grayscale"
                >
                  <span className="relative z-10">{spinning ? 'Parar' : 'Girar'}</span>
                  <span className="block text-[9px] tracking-[0.08em]">{spinning ? 'Corre em andamento' : 'Segure para auto'}</span>
                </button>

                <div className="rounded-2xl border border-[#7c561e]/70 bg-black/70 p-3 text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Custo</p>
                  <p className="mt-2 font-mono text-2xl font-black text-yellow-300">{multiplier}</p>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Corres</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-6 gap-1.5">
                {MULTIPLIERS.map((value) => (
                  <button
                    key={value}
                    onClick={() => setMultiplier(value)}
                    disabled={spinning}
                    className={`rounded-xl border px-2 py-2 text-xs font-black transition ${
                      multiplier === value
                        ? 'border-yellow-300 bg-yellow-500 text-black shadow-[0_0_18px_rgba(255,200,0,0.45)]'
                        : 'border-[#7c561e]/60 bg-black/70 text-yellow-100 hover:bg-yellow-500/10'
                    } ${spinning ? 'opacity-50' : ''}`}
                  >
                    {value}x
                  </button>
                ))}
              </div>
            </div>
          </BoardPanel>

          <BoardPanel title="Melhorias Implementadas" className="min-h-[445px]">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="mb-2 flex items-center gap-2 text-yellow-300"><BarChart3 className="h-4 w-4" /><b className="text-xs uppercase tracking-[0.18em]">Multiplicadores dinâmicos</b></div>
                <p className="text-xs leading-relaxed text-zinc-300">Indicador visual de risco vs. recompensa. Maior aposta, maior retorno e maior exposição.</p>
                <div className="mt-4 flex items-center gap-1">
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <span key={idx} className={`h-4 flex-1 rounded-sm ${idx < Math.ceil(risk.risk / 8.4) ? risk.bar : 'bg-zinc-800'}`} />
                  ))}
                  <span className="ml-2 text-[10px] font-black uppercase text-red-300">Risco<br />{risk.label}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="mb-2 flex items-center gap-2 text-yellow-300"><CalendarDays className="h-4 w-4" /><b className="text-xs uppercase tracking-[0.18em]">Bônus diário</b></div>
                <p className="text-xs leading-relaxed text-zinc-300">Calendário de login com Corres e recompensas cumulativas.</p>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[1, 2, 3, 7].map((day) => {
                    const reward = DAILY_REWARDS.find((item) => item.day === day)!;
                    return (
                      <div key={day} className="rounded-xl border border-[#7c561e]/60 bg-black/60 p-2 text-center">
                        <p className="text-[9px] uppercase text-zinc-500">Dia {day}</p>
                        <p className="mt-1 text-lg font-black text-yellow-300">⚡ {reward.corre}</p>
                        {reward.epic && <p className="text-[9px] text-purple-300">Baú</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="mb-2 flex items-center gap-2 text-yellow-300"><Sparkles className="h-4 w-4" /><b className="text-xs uppercase tracking-[0.18em]">Feedback visual intensificado</b></div>
                <p className="text-xs leading-relaxed text-zinc-300">Animações individuais por símbolo, vibração e efeitos sonoros curtos.</p>
                <div className="mt-4 flex gap-3">
                  {ANIMATION_SYMBOLS.map((symbol) => (
                    <div key={symbol} className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#7c561e]/55 bg-black/60">
                      <img src={SLOT_ASSETS[symbol]} alt={symbol} className="h-8 w-8 object-contain" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="mb-2 flex items-center gap-2 text-yellow-300"><Bell className="h-4 w-4" /><b className="text-xs uppercase tracking-[0.18em]">Sem modais bloqueantes</b></div>
                <p className="text-xs leading-relaxed text-zinc-300">Notificações inteligentes aparecem sem interromper a jogada.</p>
                <div className="mt-4 grid gap-2">
                  <div className="rounded-xl border border-yellow-400/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">💰 Jackpot! +Commands Sujo</div>
                  <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">🚔 Preso! Cooldown progressivo</div>
                </div>
              </div>
            </div>
          </BoardPanel>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[1.03fr_0.68fr_0.78fr_0.82fr]">
          <BoardPanel title="Tela principal — Giro aprimorado">
            <div className="rounded-2xl border border-[#7c561e]/70 bg-black/55 p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex gap-2">
                  <StatPill icon={<Coins className="h-4 w-4" />} label="Sujo" value={formatShort(dirtyMoney)} />
                  <StatPill icon={<Zap className="h-4 w-4" />} label="Corre" value={`${formatNumber(corre)}`} tone="blue" />
                </div>
                <button className="rounded-xl border border-[#7c561e]/60 bg-white/[0.04] p-2 text-zinc-300"><Menu className="h-4 w-4" /></button>
              </div>

              <div className="relative rounded-2xl border border-[#7c561e]/70 bg-[linear-gradient(180deg,#1b1006,#050505)] p-4">
                <p className="text-center text-[10px] font-black uppercase tracking-[0.28em] text-yellow-400">Prêmio</p>
                <p className="text-center font-mono text-4xl font-black text-yellow-300">50.000</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {displayedReels.map((symbol, idx) => (
                    <div key={`${symbol}-${idx}`} className="flex aspect-square items-center justify-center rounded-xl border border-[#7c561e]/55 bg-[#b98542]/25">
                      <img src={SLOT_ASSETS[symbol]} alt={symbol} className="h-12 w-12 object-contain" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-[1fr_1.4fr_1fr] items-center gap-2">
                  <div className="rounded-xl border border-[#7c561e]/60 bg-black/70 p-2 text-center text-xs"><b>{multiplier}</b><br />Aposta</div>
                  <button onClick={handleSpin} disabled={!canSpin} className="rounded-xl bg-yellow-500 py-3 text-sm font-black uppercase text-black disabled:opacity-50">Girar</button>
                  <div className="rounded-xl border border-[#7c561e]/60 bg-black/70 p-2 text-center text-xs"><b>{multiplier}</b><br />Custo</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-6 gap-1.5 text-[10px]">
                {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
                  <button key={label} onClick={() => navigate(path)} className={`rounded-xl border px-1 py-2 ${path === '/giro' ? 'border-yellow-400 bg-yellow-500/20 text-yellow-300' : 'border-[#7c561e]/45 bg-black/50 text-zinc-400'}`}>
                    <Icon className="mx-auto mb-1 h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </BoardPanel>

          <BoardPanel title="Notificações inteligentes">
            <div className="relative min-h-[315px] overflow-hidden rounded-2xl border border-white/10 bg-black/45 p-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,196,0,0.09),transparent_42%)] blur-sm" />
              <div className="relative space-y-3">
                <AnimatePresence initial={false}>
                  {toasts.slice(0, 3).map((toast) => <SpinToastCard key={toast.id} toast={toast} />)}
                </AnimatePresence>
              </div>
              <div className="relative mt-4 rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-xs text-zinc-300">
                {message}
              </div>
            </div>
          </BoardPanel>

          <BoardPanel title="Sistema de coleções">
            <div className="mb-3 flex items-center justify-between rounded-xl border border-[#7c561e]/60 bg-black/60 px-3 py-2">
              <div className="flex items-center gap-2">
                {avatarUrl ? <Image src={avatarUrl} alt="" className="h-8 w-8 rounded-lg object-cover" /> : <div className="h-8 w-8 rounded-lg bg-zinc-900" />}
                <span className="text-xs font-black uppercase text-zinc-300">Coleções</span>
              </div>
              <div className="flex gap-2 text-[10px] text-yellow-300"><Box className="h-4 w-4" /> {Number(chests.common || 0) + Number(chests.rare || 0) + Number(chests.epic || 0)} baús</div>
            </div>
            <div className="space-y-3">
              {cardSummaries.map((set, index) => {
                const progress = Math.min(100, (set.owned / set.total) * 100);
                return (
                  <div key={set.setId} className={`rounded-2xl border p-3 ${set.completed ? 'border-emerald-400/50 bg-emerald-500/10' : 'border-[#7c561e]/55 bg-black/50'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-1.5">
                        {Array.from({ length: 4 }).map((_, cardIdx) => (
                          <div key={cardIdx} className={`h-12 w-9 rounded-lg border ${cardIdx < set.owned ? 'border-yellow-400/60 bg-[linear-gradient(145deg,#31200b,#7a3e15)]' : 'border-zinc-800 bg-zinc-950'}`}>
                            <span className="flex h-full items-center justify-center text-xs">{cardIdx < set.owned ? ['🕶️','🚔','💼','🏍️'][cardIdx % 4] : ''}</span>
                          </div>
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-black uppercase text-zinc-200">{set.completed ? 'Completo!' : set.setName}</p>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-900">
                          <div className="h-full rounded-full bg-yellow-400" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="mt-1 text-[10px] text-zinc-500">{set.owned}/{set.total} cartas</p>
                      </div>
                      {index === 0 && set.completed && <button className="rounded-lg bg-yellow-500 px-2 py-1 text-[10px] font-black text-black">Coletar</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </BoardPanel>

          <BoardPanel title="Calendário diário">
            <div className="rounded-2xl border border-[#7c561e]/70 bg-[linear-gradient(180deg,rgba(255,183,58,0.08),rgba(0,0,0,0.65))] p-4">
              <p className="text-center text-xl font-black uppercase tracking-[0.18em] text-yellow-200">Recompensa diária</p>
              <p className="mt-1 text-center text-xs text-zinc-400">Volte todos os dias e ganhe Corres!</p>
              <p className="mt-1 text-center text-[11px] uppercase tracking-[0.18em] text-purple-300">Série: {Number(dailyCorre.streak || 0)} dia(s)</p>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
                {DAILY_REWARDS.map((reward) => {
                  const active = reward.day === currentDailyDay && !alreadyClaimedToday;
                  const claimed = alreadyClaimedToday ? reward.day <= currentDailyDay : reward.day < currentDailyDay;
                  return (
                    <div key={reward.day} className={`rounded-2xl border p-3 text-center ${
                      active
                        ? 'border-yellow-300 bg-yellow-500/12 ring-1 ring-yellow-300/60'
                        : claimed
                          ? 'border-emerald-500/35 bg-emerald-500/8'
                          : 'border-[#7c561e]/55 bg-black/45'
                    } ${reward.epic ? 'shadow-[0_0_18px_rgba(168,85,247,0.24)]' : ''}`}>
                      <p className="text-[10px] font-black uppercase text-zinc-400">Dia {reward.day}</p>
                      <p className="mt-1 text-2xl font-black text-yellow-300">⚡ {reward.corre}</p>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Corres</p>
                      <p className="mt-1 text-sm">{claimed ? '✅' : active ? '⭐' : reward.epic ? '🎁' : '🔒'}</p>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleDailyClaim}
                disabled={claimingDaily || alreadyClaimedToday}
                className="mt-4 w-full rounded-2xl border border-emerald-300/40 bg-gradient-to-b from-emerald-500 to-emerald-800 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_0_20px_rgba(34,197,94,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {alreadyClaimedToday ? 'Recompensa coletada' : claimingDaily ? 'Coletando...' : 'Coletar recompensa'}
              </button>
            </div>
          </BoardPanel>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[1.2fr_0.35fr_0.65fr]">
          <BoardPanel title="Benefícios das melhorias">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ['+ Retenção', 'Sessões mais longas e retorno garantido', Trophy],
                ['+ Engajamento', 'Eventos e coleções mantêm o jogador ativo', CalendarDays],
                ['+ Social', 'Facção ajuda com Corres e cartas', Users],
                ['+ Monetização', 'Ofertas estratégicas sem quebrar economia', Gift],
                ['+ Satisfação', 'Feedback visual premium sem travar a tela', Star],
              ].map(([title, text, Icon]: any) => (
                <div key={title} className="rounded-2xl border border-[#7c561e]/55 bg-black/45 p-3">
                  <Icon className="mb-2 h-5 w-5 text-yellow-400" />
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-white">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{text}</p>
                </div>
              ))}
            </div>
          </BoardPanel>

          <BoardPanel title="Implementação técnica">
            <div className="space-y-2 text-xs text-zinc-300">
              <p>Backend: Node.js + MongoDB</p>
              <p>Frontend: React + Framer Motion</p>
              <p>Tempo real: Socket</p>
              <p>Corre: energia oficial do jogo</p>
            </div>
          </BoardPanel>

          <BoardPanel title="Métricas esperadas">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ['DAU', '+40–60%'],
                ['Retenção D1', '+25–35%'],
                ['Sessão média', '+30–50%'],
                ['ARPPU', '+20–40%'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[#7c561e]/55 bg-black/45 px-3 py-2">
                  <p className="text-xs text-zinc-500">{label}</p>
                  <p className="font-black text-yellow-300">{value}</p>
                </div>
              ))}
            </div>
          </BoardPanel>
        </div>
      </div>
    </div>
  );
}
