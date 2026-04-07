import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePlayerStore } from '@/store/playerStore';
import { useGangBonus } from '@/hooks/useGangBonus';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Siren, ShieldAlert, Coins, Skull, BadgeAlert } from 'lucide-react';
import { Image } from '@/components/ui/image';

type SymbolKey = 'money' | 'diamond' | 'gun' | 'police';

type SpinResult = {
  reels: SymbolKey[];
  dirtyGain: number;
  prison: boolean;
  doublePolice: boolean;
  label: string;
};

const MACHINE_BG =
  'https://static.wixstatic.com/media/50f4bf_f0f13bffd67f4487bbad4fec560e36e5~mv2.png?originWidth=1024&originHeight=1920';

const SLOT_ASSETS: Record<SymbolKey, string> = {
  money: 'https://cdn-icons-png.flaticon.com/512/3135/3135706.png',
  diamond: 'https://cdn-icons-png.flaticon.com/512/616/494.png',
  gun: 'https://cdn-icons-png.flaticon.com/512/833/833472.png',
  police: 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png',
};

const REEL_POOL: SymbolKey[] = [
  'money', 'money', 'money', 'gun', 'gun', 'diamond', 'police',
];

const MULTIPLIERS = [1, 2, 5, 10, 25, 50];
const REEL_STOP_MS = [1400, 1900, 2500];

function randomSymbol(): SymbolKey {
  return REEL_POOL[Math.floor(Math.random() * REEL_POOL.length)];
}

function randomReels(): SymbolKey[] {
  return [randomSymbol(), randomSymbol(), randomSymbol()];
}

function countOf(arr: SymbolKey[], key: SymbolKey) {
  return arr.filter((item) => item === key).length;
}

function generateSpinResult(multiplier: number): SpinResult {
  const reels = randomReels();

  const policeCount = countOf(reels, 'police');
  const moneyCount = countOf(reels, 'money');
  const diamondCount = countOf(reels, 'diamond');
  const gunCount = countOf(reels, 'gun');

  if (policeCount === 3) {
    return { reels, dirtyGain: 0, prison: true, doublePolice: false, label: '🚔 A casa caiu. Tu rodou pesado.' };
  }
  if (diamondCount === 3) {
    return { reels, dirtyGain: 10000 * multiplier, prison: false, doublePolice: false, label: `💎 JACKPOT! +${(10000 * multiplier).toLocaleString('pt-BR')} Commands Sujo` };
  }
  if (moneyCount === 3) {
    return { reels, dirtyGain: 2500 * multiplier, prison: false, doublePolice: false, label: `💵 Trinca pesada! +${(2500 * multiplier).toLocaleString('pt-BR')} Commands Sujo` };
  }
  if (gunCount === 3) {
    return { reels, dirtyGain: 1600 * multiplier, prison: false, doublePolice: false, label: `🔫 Corre bruto! +${(1600 * multiplier).toLocaleString('pt-BR')} Commands Sujo` };
  }
  if (policeCount === 2) {
    return { reels, dirtyGain: 0, prison: false, doublePolice: true, label: '👀 Olha ozomi... os homens quase te pegaram.' };
  }
  if (moneyCount === 2) {
    return { reels, dirtyGain: 700 * multiplier, prison: false, doublePolice: false, label: `💵 Caiu bem. +${(700 * multiplier).toLocaleString('pt-BR')} Commands Sujo` };
  }
  if (diamondCount === 2) {
    return { reels, dirtyGain: 1200 * multiplier, prison: false, doublePolice: false, label: `💎 Quase monstro. +${(1200 * multiplier).toLocaleString('pt-BR')} Commands Sujo` };
  }
  return { reels, dirtyGain: 120 * multiplier, prison: false, doublePolice: false, label: `⚡ Corre comum. +${(120 * multiplier).toLocaleString('pt-BR')} Commands Sujo` };
}

export default function GiroPage() {
  const navigate = useNavigate();
  const { player, isLoaded, loadPlayer, addDirtyMoney, removeDirtyMoneyPercent, removeCorre } = usePlayerStore();
  const { getGiroBonus } = useGangBonus();

  const [displayedReels, setDisplayedReels] = useState<SymbolKey[]>(['money', 'gun', 'diamond']);
  const [lockedReels, setLockedReels] = useState<boolean[]>([true, true, true]);
  const [spinning, setSpinning] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [message, setMessage] = useState('Escolhe teu corre e gira a máquina.');
  const [history, setHistory] = useState<string[]>([]);
  const [prisonOpen, setPrisonOpen] = useState(false);
  const [policeFlash, setPoliceFlash] = useState(false);
  const [doublePoliceOpen, setDoublePoliceOpen] = useState(false);
  const [jackpotOpen, setJackpotOpen] = useState(false);

  const reelTimers = useRef<number[]>([]);
  const reelIntervals = useRef<number[]>([]);

  useEffect(() => {
    if (!isLoaded) loadPlayer();
    return () => {
      reelTimers.current.forEach((timer) => window.clearTimeout(timer));
      reelIntervals.current.forEach((timer) => window.clearInterval(timer));
    };
  }, [isLoaded, loadPlayer]);

  // ÚNICA FONTE: playerStore
  const dirtyMoney = player.balances.dirtyMoney;
  const cleanMoney = player.balances.cleanMoney;
  const corre = player.balances.corre;
  const canSpin = useMemo(() => !spinning && corre >= multiplier, [spinning, corre, multiplier]);

  const addHistory = (entry: string) => setHistory((prev) => [entry, ...prev].slice(0, 8));
  const clearAnimations = () => {
    reelTimers.current.forEach((timer) => window.clearTimeout(timer));
    reelIntervals.current.forEach((timer) => window.clearInterval(timer));
    reelTimers.current = [];
    reelIntervals.current = [];
  };

  const flashPolice = () => {
    setPoliceFlash(true);
    window.setTimeout(() => setPoliceFlash(false), 2600);
  };
  const triggerPrison = () => {
    flashPolice();
    setPrisonOpen(true);
    window.setTimeout(() => setPrisonOpen(false), 3200);
  };
  const triggerDoublePolice = () => {
    setDoublePoliceOpen(true);
    window.setTimeout(() => setDoublePoliceOpen(false), 1400);
  };
  const triggerJackpot = () => {
    setJackpotOpen(true);
    window.setTimeout(() => setJackpotOpen(false), 2200);
  };

  const finalizeSpin = (result: SpinResult) => {
    const prisonLossBase = player?.balances?.dirtyMoney ?? 0;
    const giroBonus = getGiroBonus();

    if (result.prison) {
      removeDirtyMoneyPercent(30);
      setMessage(result.label);
      addHistory(`🚔 Prisão: -30% do Commands Sujo sobre ${prisonLossBase.toLocaleString('pt-BR')}`);
      triggerPrison();
      setSpinning(false);
      return;
    }
    if (result.doublePolice) triggerDoublePolice();
    if (result.dirtyGain > 0) {
      const bonusGain = result.dirtyGain * (1 + giroBonus.percent / 100);
      addDirtyMoney(bonusGain);
    }
    if (countOf(result.reels, 'diamond') === 3) triggerJackpot();
    setMessage(result.label);
    addHistory(`${result.label}`);
    setSpinning(false);
  };

  const handleSpin = () => {
    if (!canSpin) {
      if (corre < multiplier) setMessage('Sem corre suficiente pra bancar esse corre.');
      return;
    }
    const giroBonus = getGiroBonus();
    clearAnimations();
    setSpinning(true);
    setLockedReels([false, false, false]);
    setMessage(`Rodando x${multiplier}... segura o coração.`);
    if (Math.random() * 100 < giroBonus.noCostChance) {
      // não consome corre
    } else {
      removeCorre(multiplier);
    }
    const result = generateSpinResult(multiplier);
    for (let i = 0; i < 3; i++) {
      const interval = window.setInterval(() => {
        setDisplayedReels((prev) => {
          const clone = [...prev];
          clone[i] = randomSymbol();
          return clone as SymbolKey[];
        });
      }, 90 + i * 40);
      reelIntervals.current.push(interval);
      const timer = window.setTimeout(() => {
        window.clearInterval(interval);
        setDisplayedReels((prev) => {
          const clone = [...prev];
          clone[i] = result.reels[i];
          return clone as SymbolKey[];
        });
        setLockedReels((prev) => {
          const clone = [...prev];
          clone[i] = true;
          return clone;
        });
        if (i === 2) window.setTimeout(() => finalizeSpin(result), 250);
      }, REEL_STOP_MS[i]);
      reelTimers.current.push(timer);
    }
  };

  const machineScaleClass = 'w-[360px] sm:w-[420px] md:w-[520px] lg:w-[620px] xl:w-[680px]';
  const reelBase = 'absolute top-[42%] -translate-y-1/2 h-[12%] w-[14%] rounded-[18px] overflow-hidden';

  return (
    <div className="min-h-screen bg-[#07090d] text-white relative overflow-x-hidden">
      <Header />
      <AnimatePresence>
        {policeFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.15, 0.5, 0.15, 0.55, 0.15] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.4 }}
            className="pointer-events-none fixed inset-0 z-[60]"
          >
            <div className="absolute inset-0 bg-red-600/40" />
            <div className="absolute inset-0 bg-blue-600/35 mix-blend-screen" />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {doublePoliceOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[65] flex items-center justify-center bg-black/55 px-6"
          >
            <div className="rounded-[26px] border border-yellow-400/30 bg-[#11141a] px-8 py-6 shadow-[0_0_50px_rgba(255,220,0,0.22)]">
              <h2 className="text-center text-3xl md:text-5xl font-black uppercase tracking-[0.16em] text-yellow-300">OLHA OZOMI</h2>
              <p className="mt-3 text-center text-sm md:text-base uppercase tracking-[0.18em] text-zinc-200">Os homens tão rondando o corre</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {prisonOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -1.5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/78 px-4"
          >
            <div className="w-full max-w-2xl rounded-[30px] border border-red-500/40 bg-[#0b0d12] p-8 md:p-10 shadow-[0_0_80px_rgba(255,0,0,0.38)]">
              <div className="flex items-center justify-center gap-4 text-red-400">
                <Siren className="h-10 w-10 animate-pulse" />
                <ShieldAlert className="h-10 w-10 animate-pulse" />
                <BadgeAlert className="h-10 w-10 animate-pulse" />
              </div>
              <h2 className="mt-6 text-center text-4xl md:text-6xl font-black uppercase tracking-[0.16em] text-red-300">RODOU</h2>
              <p className="mt-5 text-center text-base md:text-xl leading-relaxed text-zinc-100">Os homem te enquadraram no meio do corre.</p>
              <p className="mt-3 text-center text-lg md:text-2xl font-bold text-red-300">30% do Commands Sujo foi pro ralo.</p>
              <div className="mt-6 flex items-center justify-center gap-3 text-zinc-400">
                <Skull className="h-5 w-5" />
                <span className="text-xs md:text-sm uppercase tracking-[0.24em]">Respira e volta mais ligeiro</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {jackpotOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: [0.92, 1.08, 1] }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.55 }}
            className="pointer-events-none fixed inset-0 z-[68] flex items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-yellow-400/12" />
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="absolute h-[260px] w-[260px] md:h-[420px] md:w-[420px] rounded-full bg-yellow-300/20 blur-3xl"
            />
            <div className="relative text-center">
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-[0.18em] text-yellow-300 drop-shadow-[0_0_18px_rgba(255,230,120,0.7)]">JACKPOT</h2>
              <p className="mt-4 text-xl md:text-3xl font-bold text-white">💎 O asfalto sorriu pra tu</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute top-24 left-4 md:left-6 z-20 flex gap-3">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 rounded-xl border border-[#FF4500] bg-[#FF4500]/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-[#FF4500]/35"><Home className="h-4 w-4" />Home</button>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-400/30"><ArrowLeft className="h-4 w-4" />Voltar</button>
      </div>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-28 pb-14 px-4 md:px-6">
        <Image src={MACHINE_BG} alt="Máquina Giro no Asfalto" className="absolute inset-0 h-full w-full object-cover brightness-105 contrast-110" />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 w-full max-w-7xl grid grid-cols-1 xl:grid-cols-[1fr_390px] gap-8 items-center">
          <div className="flex flex-col items-center">
            <div className={`relative ${machineScaleClass}`}>
              <Image src={MACHINE_BG} alt="Estrutura da máquina" className="w-full h-auto object-contain select-none pointer-events-none opacity-0" />
              <div className={`${reelBase} left-[28%]`}>
                <div className="relative flex h-full w-full items-center justify-center rounded-[12px] bg-black/80 border border-yellow-400/40 shadow-[inset_0_0_20px_rgba(255,200,0,0.3)] overflow-hidden">
                  <motion.img key={`reel-0-${displayedReels[0]}-${lockedReels[0]}`} src={SLOT_ASSETS[displayedReels[0]]} alt={displayedReels[0]} initial={{ y: lockedReels[0] ? -18 : 0, opacity: 0.75 }} animate={{ y: 0, opacity: 1, scale: lockedReels[0] ? 1 : 0.96 }} transition={{ duration: 0.18 }} className="h-[75%] w-[75%] object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                </div>
              </div>
              <div className={`${reelBase} left-[43%]`}>
                <div className="relative flex h-full w-full items-center justify-center rounded-[12px] bg-black/80 border border-yellow-400/40 shadow-[inset_0_0_20px_rgba(255,200,0,0.3)] overflow-hidden">
                  <motion.img key={`reel-1-${displayedReels[1]}-${lockedReels[1]}`} src={SLOT_ASSETS[displayedReels[1]]} alt={displayedReels[1]} initial={{ y: lockedReels[1] ? -18 : 0, opacity: 0.75 }} animate={{ y: 0, opacity: 1, scale: lockedReels[1] ? 1 : 0.96 }} transition={{ duration: 0.2 }} className="h-[75%] w-[75%] object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                </div>
              </div>
              <div className={`${reelBase} left-[58%]`}>
                <div className="relative flex h-full w-full items-center justify-center rounded-[12px] bg-black/80 border border-yellow-400/40 shadow-[inset_0_0_20px_rgba(255,200,0,0.3)] overflow-hidden">
                  <motion.img key={`reel-2-${displayedReels[2]}-${lockedReels[2]}`} src={SLOT_ASSETS[displayedReels[2]]} alt={displayedReels[2]} initial={{ y: lockedReels[2] ? -18 : 0, opacity: 0.75 }} animate={{ y: 0, opacity: 1, scale: lockedReels[2] ? 1 : 0.96 }} transition={{ duration: 0.22 }} className="h-[75%] w-[75%] object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                </div>
              </div>
              <div className="absolute left-1/2 top-[71.5%] w-[72%] -translate-x-1/2">
                <div className="rounded-[28px] border border-yellow-500/35 bg-black/72 p-4 shadow-[0_0_35px_rgba(255,200,0,0.15)] backdrop-blur-md">
                  {/* REMOVIDO: o bloco grid-cols-3 que exibia SUJO, LIMPO e CORRE (causava duplicação) */}
                  <div className="mb-3 flex flex-wrap justify-center gap-2">
                    {MULTIPLIERS.map((value) => (
                      <button
                        key={value}
                        onClick={() => setMultiplier(value)}
                        disabled={spinning}
                        className={`rounded-xl px-3 py-2 text-xs md:text-sm font-bold transition ${
                          multiplier === value ? 'bg-yellow-500 text-black' : 'border border-yellow-700/60 bg-zinc-950/90 text-white'
                        } ${spinning ? 'opacity-50' : 'hover:scale-[1.03]'}`}
                      >
                        x{value}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleSpin} disabled={!canSpin} className="w-full rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 px-4 py-3 text-sm md:text-base font-black uppercase tracking-[0.24em] text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45">
                    {spinning ? `RODANDO x${multiplier}` : `GIRAR x${multiplier}`}
                  </button>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/35 px-3 py-3 text-center">
                    <div className="inline-flex items-center gap-2 text-yellow-300">
                      <Coins className="h-4 w-4" />
                      <span className="text-[11px] md:text-sm font-semibold leading-relaxed">{message}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-[28px] border border-cyan-500/20 bg-black/62 p-6 backdrop-blur-md shadow-[0_0_40px_rgba(0,234,255,0.10)]">
            <h2 className="text-2xl font-black uppercase tracking-[0.14em] text-cyan-300">Central do Corre</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Regras</p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-200">
                  <li>• cada giro consome corre conforme multiplicador</li>
                  <li>• prêmio entra no Commands Sujo da playerStore</li>
                  <li>• prisão leva 30% do Commands Sujo</li>
                  <li>• 2 viaturas ativam “olha ozomi”</li>
                  <li>• o Header acompanha o mesmo cofre em tempo real</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Histórico</p>
                <div className="mt-3 space-y-2">
                  {history.length === 0 ? (
                    <p className="text-sm text-zinc-500">Nenhum corre rodado ainda.</p>
                  ) : (
                    history.map((entry, index) => (
                      <div key={`${entry}-${index}`} className="rounded-xl border border-white/8 bg-black/30 px-3 py-2 text-sm text-zinc-200">{entry}</div>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-amber-300">Ligação com o sistema</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-200">Essa página só manda o corre. O cofre central da playerStore cuida do salvamento local, agenda o sync e empurra tudo pro backend.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
