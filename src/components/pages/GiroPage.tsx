import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { spinSlot, type GiroCardDrop } from '@/api/gameApi';
import { usePlayerStore } from '@/store/playerStore';

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

const ASSETS = {
  background: 'https://static.wixstatic.com/media/50f4bf_3fcc97adac354732b5add82b6dbe0a07~mv2.png',
  prizeFrame: 'https://static.wixstatic.com/media/50f4bf_f3b0fd84358e43afb3707669771a3100~mv2.png',
  slotBody: 'https://static.wixstatic.com/media/50f4bf_a2a2ab159c2e4017a30a3d9cafc34388~mv2.png',
  bulletHoles: 'https://static.wixstatic.com/media/50f4bf_2855085fadd44679adb6ee591fcf3259~mv2.png',
  symbols: {
    money: 'https://static.wixstatic.com/media/50f4bf_9bda4af1a12b47679336479a80b16eb8~mv2.png',
    diamond: 'https://static.wixstatic.com/media/50f4bf_f5c09c68b3b7461890485d35d9a7f71d~mv2.png',
    gun: 'https://static.wixstatic.com/media/50f4bf_e3e229785acd484b98dae44a7e663563~mv2.png',
    police: 'https://static.wixstatic.com/media/50f4bf_12fd702dfbc74682942b6d5116e71b42~mv2.png',
  } satisfies Record<SymbolKey, string>,
};

const MULTIPLIERS = [1, 2, 5, 10, 25, 50];
const DEFAULT_REELS: SymbolKey[] = ['diamond', 'gun', 'money'];
const REEL_SEQUENCE: SymbolKey[] = ['diamond', 'gun', 'police', 'money', 'gun', 'diamond', 'police', 'money'];
const REEL_STOP_MS = [980, 1380, 1820];

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
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Som é bônus: não pode travar a página.
  }
}

function SpinToastCard({ toast }: { toast: SpinToast }) {
  const styles = {
    jackpot: 'border-yellow-300/60 bg-yellow-500/15 shadow-[0_0_38px_rgba(255,191,0,0.34)]',
    prison: 'border-red-400/60 bg-red-500/15 shadow-[0_0_38px_rgba(255,0,0,0.28)]',
    card: 'border-purple-300/60 bg-purple-500/15 shadow-[0_0_32px_rgba(168,85,247,0.24)]',
    info: 'border-yellow-300/45 bg-black/70 shadow-[0_0_26px_rgba(255,191,0,0.18)]',
    error: 'border-red-400/60 bg-red-500/15 shadow-[0_0_30px_rgba(255,0,0,0.22)]',
  }[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      className={`pointer-events-auto w-[min(360px,calc(100vw-24px))] rounded-2xl border px-4 py-3 text-white backdrop-blur-xl ${styles}`}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-yellow-200">{toast.title}</p>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-100">{toast.body}</p>
    </motion.div>
  );
}

function ResourcePill({ icon, value, compact = false }: { icon: ReactNode; value: string; compact?: boolean }) {
  return (
    <div className={`giro-resource-pill ${compact ? 'giro-resource-pill--compact' : ''}`}>
      <div className="giro-resource-icon">{icon}</div>
      <span>{value}</span>
    </div>
  );
}

function SymbolIcon({ symbol, className = '' }: { symbol: SymbolKey; className?: string }) {
  return (
    <Image
      src={ASSETS.symbols[symbol]}
      alt={symbol}
      className={`giro-symbol-img ${className}`}
      draggable={false}
    />
  );
}

function FinalReel({ symbol, index, landing }: { symbol: SymbolKey; index: number; landing: boolean }) {
  const top = REEL_SEQUENCE[(index + 1) % REEL_SEQUENCE.length];
  const bottom = REEL_SEQUENCE[(index + 4) % REEL_SEQUENCE.length];

  return (
    <motion.div
      key={`${symbol}-${landing}`}
      initial={{ y: landing ? -18 : 0, scale: landing ? 0.94 : 1, opacity: 0.9 }}
      animate={{ y: 0, scale: landing ? [0.94, 1.08, 1] : 1, opacity: 1 }}
      transition={{ duration: landing ? 0.36 : 0.16 }}
      className="giro-final-reel"
    >
      <SymbolIcon symbol={top} className="giro-symbol-muted" />
      <SymbolIcon symbol={symbol} className="giro-symbol-main" />
      <SymbolIcon symbol={bottom} className="giro-symbol-muted" />
    </motion.div>
  );
}

function AnimatedReel({ index }: { index: number }) {
  const symbols = Array.from({ length: 20 }, (_, i) => REEL_SEQUENCE[(i + index * 2) % REEL_SEQUENCE.length]);

  return (
    <div className="giro-reel-strip" style={{ animationDuration: `${0.34 + index * 0.05}s` }}>
      {symbols.map((symbol, itemIndex) => (
        <div key={`${index}-${itemIndex}-${symbol}`} className="giro-reel-symbol-cell">
          <SymbolIcon symbol={symbol} />
        </div>
      ))}
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
  const [lastPrize, setLastPrize] = useState(50000);
  const [policeFlash, setPoliceFlash] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [toasts, setToasts] = useState<SpinToast[]>([]);

  const reelTimers = useRef<number[]>([]);
  const toastTimers = useRef<number[]>([]);

  const corre = Math.max(0, Number(player?.balances?.corre || 0));
  const dirtyMoney = Math.max(0, Number(player?.balances?.dirtyMoney || 0));
  const cleanMoney = Math.max(0, Number(player?.balances?.cleanMoney || 0));
  const playerCooldownUntil = Number(player?.prisonHistory?.cooldownUntil || 0);
  const activeCooldownUntil = Math.max(cooldownUntil, playerCooldownUntil);
  const cooldownRemaining = Math.max(0, activeCooldownUntil - Date.now());
  const canSpin = !spinning && cooldownRemaining <= 0 && corre >= multiplier;
  const selectedCost = multiplier * 1000;
  const multiplierIndex = MULTIPLIERS.indexOf(multiplier);
  const avatarUrl =
    player?.headerCustomization?.customAvatar ||
    player?.customAvatar ||
    player?.avatar ||
    player?.photoURL ||
    '';

  useEffect(() => {
    return () => {
      reelTimers.current.forEach((timer) => window.clearTimeout(timer));
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
    }, 3100);
    toastTimers.current.push(timer);
  };

  const clearReelTimers = () => {
    reelTimers.current.forEach((timer) => window.clearTimeout(timer));
    reelTimers.current = [];
  };

  const flashPolice = () => {
    setPoliceFlash(true);
    window.setTimeout(() => setPoliceFlash(false), 850);
  };

  const finalizeSpin = (result: SpinResult) => {
    const prize = Number(result.dirtyGain || 0);
    if (prize > 0) setLastPrize(prize);

    if (result.prison) {
      const loss = result.prisonPenalty?.loss || 0;
      const cooldownMs = result.prisonPenalty?.cooldownMs || 0;
      setCooldownUntil(result.prisonPenalty?.cooldownUntil || result.cooldownUntil || 0);
      flashPolice();
      vibrate([160, 80, 160]);
      playTone(110, 0.26, 'sawtooth');
      addToast({
        type: 'prison',
        title: 'Blitz no asfalto',
        body: `Perdeu ${formatNumber(loss)} Commands Sujo${cooldownMs ? ` e esfriou por ${Math.round(cooldownMs / 1000)}s.` : '.'}`,
      });
      setSpinning(false);
      return;
    }

    if (result.outcome === 'jackpot' || result.reels.every((symbol) => symbol === 'diamond')) {
      vibrate([80, 40, 80, 40, 160]);
      [440, 550, 660, 880].forEach((freq, idx) => window.setTimeout(() => playTone(freq, 0.12, 'sine'), idx * 90));
      addToast({ type: 'jackpot', title: 'Prêmio liberado', body: `+${formatNumber(prize)} Commands Sujo.` });
    } else if (prize > 0) {
      vibrate(35);
      addToast({ type: 'info', title: 'Corre pago', body: `+${formatNumber(prize)} Commands Sujo.` });
    } else {
      vibrate(25);
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

    if (spinning) return;

    if (cooldownRemaining > 0) {
      addToast({ type: 'prison', title: 'Corre esfriando', body: `Aguarde ${Math.ceil(cooldownRemaining / 1000)}s.` });
      return;
    }

    if (corre < multiplier) {
      addToast({ type: 'error', title: 'Sem Corre', body: `Você precisa de ${multiplier} Corre(s) para essa aposta.` });
      return;
    }

    clearReelTimers();
    vibrate(30);
    playTone(330, 0.05);
    setLockedReels([false, false, false]);
    setLandingReels([false, false, false]);
    setSpinning(true);

    try {
      const response = await spinSlot(multiplier);
      const result: SpinResult = response.result;

      if (response.player) {
        hydratePlayerFromServer(response.player);
      }

      for (let i = 0; i < 3; i += 1) {
        const timer = window.setTimeout(() => {
          playTone(220 + i * 125, 0.07);
          vibrate(28);

          setDisplayedReels((prev) => {
            const clone = [...prev];
            clone[i] = result.reels[i] || DEFAULT_REELS[i];
            return clone as SymbolKey[];
          });

          setLockedReels((prev) => {
            const clone = [...prev];
            clone[i] = true;
            return clone;
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
          }, 450);

          if (i === 2) {
            window.setTimeout(() => finalizeSpin(result), 210);
          }
        }, REEL_STOP_MS[i]);

        reelTimers.current.push(timer);
      }
    } catch (error: any) {
      console.error('Erro ao girar slot:', error);
      const retryAfter = Number(error?.retryAfter || 0);
      if (retryAfter > 0) setCooldownUntil(Date.now() + retryAfter);
      const text = error instanceof Error ? error.message : 'Erro ao rodar o Giro';
      addToast({ type: 'error', title: 'Giro negado', body: text });
      setLockedReels([true, true, true]);
      setLandingReels([false, false, false]);
      setSpinning(false);
    }
  };

  const changeMultiplier = (direction: -1 | 1) => {
    if (spinning) return;
    const nextIndex = Math.min(MULTIPLIERS.length - 1, Math.max(0, multiplierIndex + direction));
    setMultiplier(MULTIPLIERS[nextIndex] || 1);
  };

  if (!isLoaded || !player?._id) {
    return (
      <main className="giro-page giro-page--loading">
        <Image src={ASSETS.background} alt="Giro no Asfalto" className="giro-bg" draggable={false} />
        <div className="giro-darken" />
        <div className="giro-loading-card">Carregando Giro...</div>
        <GiroStyles />
      </main>
    );
  }

  return (
    <main className="giro-page">
      <Image src={ASSETS.background} alt="Giro no Asfalto" className="giro-bg" draggable={false} />
      <div className="giro-darken" />

      <div className="giro-toast-stack">
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
            animate={{ opacity: [0, 0.42, 0.16, 0.34, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85 }}
            className="giro-police-flash"
          />
        )}
      </AnimatePresence>

      <section className="giro-hud" aria-label="Recursos do jogador">
        <button className="giro-avatar" type="button" onClick={() => navigate('/game')} aria-label="Voltar para o mapa">
          {avatarUrl ? <Image src={avatarUrl} alt="Avatar" className="giro-avatar-img" draggable={false} /> : <span>DC</span>}
        </button>

        <div className="giro-hud-resources">
          <ResourcePill icon={<span className="giro-coin-icon">$</span>} value={formatNumber(dirtyMoney)} />
          <ResourcePill icon={<SymbolIcon symbol="money" />} value={formatNumber(cleanMoney)} />
          <ResourcePill icon={<span className="giro-energy-icon">⚡</span>} value={`${formatNumber(corre)}/50`} compact />
        </div>
      </section>

      <section className="giro-stage" aria-label="Máquina Giro no Asfalto">
        <div className="giro-machine-wrap">
          <div className="giro-machine">
            <div className="giro-prize">
              <Image src={ASSETS.prizeFrame} alt="Moldura do prêmio" className="giro-prize-frame" draggable={false} />
              <div className="giro-prize-text">
                <span>PRÊMIO</span>
                <strong>{formatNumber(lastPrize)}</strong>
              </div>
            </div>

            <div className="giro-reels-window">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className={`giro-reel giro-reel-${idx + 1} ${landingReels[idx] ? 'is-landing' : ''}`}>
                  {lockedReels[idx] ? (
                    <FinalReel symbol={displayedReels[idx]} index={idx} landing={landingReels[idx]} />
                  ) : (
                    <AnimatedReel index={idx} />
                  )}
                </div>
              ))}
            </div>

            <Image src={ASSETS.slotBody} alt="Corpo da slot machine" className="giro-slot-body" draggable={false} />

            <Image src={ASSETS.bulletHoles} alt="Furos de bala" className="giro-bullets giro-bullets-left" draggable={false} />
            <Image src={ASSETS.bulletHoles} alt="Furos de bala" className="giro-bullets giro-bullets-right" draggable={false} />

            <div className="giro-bottom-ui">
              <div className="giro-bet-panel">
                <span>APOSTA</span>
                <div>
                  <button type="button" onClick={() => changeMultiplier(-1)} disabled={spinning || multiplierIndex <= 0}>−</button>
                  <strong>{multiplier}</strong>
                  <button type="button" onClick={() => changeMultiplier(1)} disabled={spinning || multiplierIndex >= MULTIPLIERS.length - 1}>+</button>
                </div>
              </div>

              <button type="button" className="giro-main-button" onClick={handleSpin} disabled={!canSpin && !spinning}>
                {spinning ? 'PARAR' : 'GIRAR'}
              </button>

              <div className="giro-cost-panel">
                <span>CUSTO</span>
                <strong><i>$</i>{formatNumber(selectedCost)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="giro-multipliers" aria-label="Multiplicador">
          {MULTIPLIERS.slice().reverse().map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => !spinning && setMultiplier(value)}
              className={multiplier === value ? 'is-active' : ''}
              disabled={spinning}
            >
              {value}x
            </button>
          ))}
        </div>
      </section>

      <GiroStyles />
    </main>
  );
}

function GiroStyles() {
  return (
    <style>{`
      .giro-page {
        position: relative;
        width: 100vw;
        min-height: 100vh;
        overflow: hidden;
        color: #fff;
        background: #030405;
        isolation: isolate;
        touch-action: manipulation;
      }

      .giro-bg,
      .giro-bg > img {
        position: absolute !important;
        inset: 0;
        width: 100% !important;
        height: 100% !important;
        object-fit: cover;
        z-index: -3;
        user-select: none;
      }

      .giro-darken {
        position: absolute;
        inset: 0;
        z-index: -2;
        background:
          radial-gradient(circle at 52% 40%, rgba(255, 178, 45, 0.12), transparent 34%),
          radial-gradient(circle at 50% 54%, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.82) 78%),
          linear-gradient(180deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.58));
      }

      .giro-toast-stack {
        pointer-events: none;
        position: fixed;
        top: 76px;
        left: 50%;
        z-index: 90;
        display: flex;
        width: min(390px, calc(100vw - 20px));
        transform: translateX(-50%);
        flex-direction: column;
        gap: 8px;
      }

      .giro-police-flash {
        pointer-events: none;
        position: fixed;
        inset: 0;
        z-index: 70;
        background:
          linear-gradient(90deg, rgba(255, 0, 0, 0.32), transparent 42%, rgba(0, 85, 255, 0.28)),
          radial-gradient(circle at 50% 50%, transparent, rgba(0, 0, 0, 0.55));
        mix-blend-mode: screen;
      }

      .giro-hud {
        position: absolute;
        top: clamp(10px, 1.4vw, 18px);
        left: clamp(10px, 2vw, 30px);
        right: clamp(10px, 2vw, 30px);
        z-index: 30;
        display: flex;
        align-items: center;
        gap: clamp(8px, 1vw, 14px);
      }

      .giro-avatar {
        width: clamp(48px, 6vw, 76px);
        height: clamp(48px, 6vw, 76px);
        flex: 0 0 auto;
        overflow: hidden;
        border: 2px solid rgba(255, 198, 92, 0.8);
        border-radius: 18px;
        background: linear-gradient(145deg, #111, #363026 48%, #080808);
        box-shadow: inset 0 0 0 2px rgba(0,0,0,.85), 0 0 24px rgba(255, 176, 40, .24);
        color: #f6d27c;
        font-weight: 1000;
        letter-spacing: .08em;
      }

      .giro-avatar-img,
      .giro-avatar-img > img {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover;
      }

      .giro-hud-resources {
        display: flex;
        min-width: 0;
        align-items: center;
        gap: clamp(7px, 1vw, 14px);
      }

      .giro-resource-pill {
        display: flex;
        height: clamp(40px, 4.8vw, 58px);
        min-width: clamp(118px, 16vw, 230px);
        align-items: center;
        gap: clamp(7px, 1vw, 12px);
        border: 1px solid rgba(255, 189, 73, .34);
        border-radius: 16px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, .08), transparent 35%),
          linear-gradient(90deg, rgba(8, 8, 8, .94), rgba(23, 20, 16, .92));
        box-shadow: inset 0 0 0 2px rgba(0, 0, 0, .65), 0 9px 20px rgba(0,0,0,.45);
        padding: 0 clamp(10px, 1.3vw, 16px);
        font-size: clamp(15px, 2.2vw, 25px);
        font-weight: 1000;
        color: #f8f1dc;
        text-shadow: 0 2px 5px #000;
      }

      .giro-resource-pill--compact {
        min-width: clamp(105px, 13vw, 180px);
      }

      .giro-resource-icon {
        position: relative;
        width: clamp(24px, 3vw, 38px);
        height: clamp(24px, 3vw, 38px);
        flex: 0 0 auto;
        display: grid;
        place-items: center;
      }

      .giro-coin-icon {
        display: grid;
        width: 100%;
        height: 100%;
        place-items: center;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #fff1a8, #ffb92d 42%, #8d5206 78%);
        color: #392302;
        font-size: .78em;
        font-weight: 1000;
        box-shadow: inset 0 0 0 2px rgba(82, 41, 0, .65), 0 0 16px rgba(255, 187, 42, .42);
      }

      .giro-energy-icon {
        color: #ffc83c;
        font-size: clamp(22px, 2.7vw, 34px);
        filter: drop-shadow(0 0 8px rgba(255, 192, 44, .55));
      }

      .giro-stage {
        position: relative;
        z-index: 10;
        display: grid;
        min-height: 100vh;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: clamp(6px, 1.1vw, 16px);
        padding: clamp(82px, 8vw, 106px) clamp(14px, 3vw, 44px) clamp(16px, 2vw, 28px);
      }

      .giro-machine-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
      }

      .giro-machine {
        position: relative;
        width: min(82vw, 1080px);
        aspect-ratio: 1.43 / 1;
        transform: translateY(clamp(10px, 1.5vw, 20px));
        filter: drop-shadow(0 24px 34px rgba(0,0,0,.68));
      }

      .giro-slot-body,
      .giro-slot-body > img {
        position: absolute !important;
        inset: 13.5% 2.5% 9.2% 2.5%;
        width: 95% !important;
        height: 77.3% !important;
        object-fit: contain;
        z-index: 12;
        user-select: none;
        pointer-events: none;
      }

      .giro-prize {
        position: absolute;
        left: 50%;
        top: 0;
        z-index: 25;
        width: 58%;
        height: 25.5%;
        transform: translateX(-50%);
        pointer-events: none;
      }

      .giro-prize-frame,
      .giro-prize-frame > img {
        width: 100% !important;
        height: 100% !important;
        object-fit: contain;
        user-select: none;
      }

      .giro-prize-text {
        position: absolute;
        inset: 19% 12% 13%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        text-align: center;
      }

      .giro-prize-text span {
        margin-bottom: -.04em;
        color: #ffe08e;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: clamp(17px, 2.35vw, 36px);
        font-weight: 900;
        letter-spacing: .08em;
        text-shadow: 0 2px 0 #3f2300, 0 0 16px rgba(255, 201, 66, .46);
      }

      .giro-prize-text strong {
        color: #ffc33b;
        font-family: Impact, 'Arial Black', sans-serif;
        font-size: clamp(42px, 7.4vw, 112px);
        font-weight: 1000;
        line-height: .92;
        letter-spacing: .03em;
        text-shadow:
          0 3px 0 #5d3100,
          0 0 12px rgba(255, 211, 66, .72),
          0 0 34px rgba(255, 138, 0, .52);
      }

      .giro-reels-window {
        position: absolute;
        left: 18.7%;
        right: 18.2%;
        top: 33.4%;
        height: 32.8%;
        z-index: 8;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1.1%;
        overflow: hidden;
        border-radius: 16px;
        background: linear-gradient(180deg, #efe0c5, #bea885 48%, #55402a);
        box-shadow: inset 0 25px 42px rgba(0,0,0,.34), inset 0 -32px 42px rgba(0,0,0,.45);
      }

      .giro-reels-window::before,
      .giro-reels-window::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        z-index: 9;
        height: 28%;
        pointer-events: none;
      }

      .giro-reels-window::before {
        top: 0;
        background: linear-gradient(180deg, rgba(0,0,0,.38), transparent);
      }

      .giro-reels-window::after {
        bottom: 0;
        background: linear-gradient(0deg, rgba(0,0,0,.42), transparent);
      }

      .giro-reel {
        position: relative;
        overflow: hidden;
        border-left: 2px solid rgba(61, 32, 0, .65);
        border-right: 2px solid rgba(255, 213, 118, .32);
        background:
          radial-gradient(ellipse at 50% 50%, rgba(255,255,255,.28), transparent 54%),
          linear-gradient(180deg, rgba(255,255,255,.3), rgba(255,255,255,0) 18%, rgba(0,0,0,.18) 100%);
      }

      .giro-reel.is-landing {
        box-shadow: inset 0 0 24px rgba(255, 207, 75, .42), 0 0 24px rgba(255, 207, 75, .22);
      }

      .giro-final-reel {
        position: absolute;
        inset: -14% 7%;
        display: grid;
        grid-template-rows: 1fr 1.22fr 1fr;
        align-items: center;
        justify-items: center;
      }

      .giro-reel-strip {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        animation-name: giro-reel-spin;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
        will-change: transform;
        filter: blur(.8px);
      }

      .giro-reel-symbol-cell {
        height: clamp(76px, 10.8vw, 154px);
        display: grid;
        place-items: center;
      }

      .giro-symbol-img,
      .giro-symbol-img > img {
        width: clamp(58px, 8.2vw, 128px) !important;
        height: clamp(58px, 8.2vw, 128px) !important;
        object-fit: contain;
        filter: drop-shadow(0 10px 9px rgba(0,0,0,.52));
        user-select: none;
        pointer-events: none;
      }

      .giro-symbol-main,
      .giro-symbol-main > img {
        width: clamp(68px, 9.4vw, 145px) !important;
        height: clamp(68px, 9.4vw, 145px) !important;
        filter: drop-shadow(0 12px 10px rgba(0,0,0,.58)) drop-shadow(0 0 11px rgba(255,218,118,.18));
      }

      .giro-symbol-muted {
        opacity: .86;
        transform: scale(.84);
      }

      .giro-bullets,
      .giro-bullets > img {
        position: absolute !important;
        z-index: 28;
        width: 24% !important;
        height: auto !important;
        object-fit: contain;
        pointer-events: none;
        user-select: none;
        opacity: .74;
        mix-blend-mode: screen;
      }

      .giro-bullets-left {
        left: -2%;
        top: 19%;
        transform: rotate(-5deg) scale(.8);
      }

      .giro-bullets-right {
        right: -6%;
        top: 18%;
        transform: rotate(6deg) scale(.58);
      }

      .giro-bottom-ui {
        position: absolute;
        left: 2.5%;
        right: 2.5%;
        bottom: 0;
        z-index: 35;
        display: grid;
        grid-template-columns: 1fr 1.34fr 1fr;
        align-items: end;
        gap: clamp(10px, 2vw, 38px);
      }

      .giro-bet-panel,
      .giro-cost-panel {
        min-height: clamp(74px, 9.2vw, 122px);
        border: 1px solid rgba(255, 190, 80, .52);
        border-radius: clamp(14px, 1.6vw, 24px);
        background:
          linear-gradient(180deg, rgba(255,255,255,.07), transparent 24%),
          linear-gradient(180deg, rgba(16,15,13,.96), rgba(3,3,4,.96));
        box-shadow: inset 0 0 0 2px rgba(0,0,0,.72), 0 12px 24px rgba(0,0,0,.62);
        padding: clamp(10px, 1.35vw, 16px) clamp(12px, 1.6vw, 20px);
      }

      .giro-bet-panel > span,
      .giro-cost-panel > span {
        display: block;
        color: #f1dba3;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: clamp(15px, 1.8vw, 25px);
        font-weight: 900;
        letter-spacing: .08em;
        text-align: center;
        text-shadow: 0 2px 0 #000;
      }

      .giro-bet-panel > div {
        display: grid;
        grid-template-columns: clamp(42px, 5vw, 64px) 1fr clamp(42px, 5vw, 64px);
        align-items: center;
        gap: clamp(8px, 1vw, 12px);
        margin-top: clamp(8px, 1vw, 12px);
      }

      .giro-bet-panel button {
        height: clamp(38px, 4.8vw, 58px);
        border: 1px solid rgba(255, 203, 98, .65);
        border-radius: 10px;
        background: linear-gradient(180deg, #3d3428, #0b0a09);
        color: #ffd36b;
        font-size: clamp(24px, 3vw, 36px);
        font-weight: 1000;
        line-height: 1;
        box-shadow: inset 0 0 0 2px rgba(0,0,0,.55), 0 0 14px rgba(255,180,50,.14);
      }

      .giro-bet-panel button:disabled {
        opacity: .35;
      }

      .giro-bet-panel strong {
        color: #fff7df;
        font-size: clamp(22px, 3.2vw, 42px);
        font-weight: 1000;
        text-align: center;
        text-shadow: 0 3px 6px #000;
      }

      .giro-main-button {
        min-height: clamp(80px, 10vw, 135px);
        border: 2px solid rgba(255, 218, 123, .76);
        border-radius: clamp(18px, 2vw, 30px);
        background:
          radial-gradient(circle at 50% 0%, rgba(255,255,255,.22), transparent 38%),
          linear-gradient(180deg, #f3bd50 0%, #8b5517 52%, #1a1209 100%);
        box-shadow:
          inset 0 0 0 4px rgba(58, 29, 1, .62),
          inset 0 18px 22px rgba(255,255,255,.16),
          0 0 28px rgba(255, 169, 37, .36),
          0 16px 28px rgba(0,0,0,.68);
        color: #fff1c0;
        font-family: Impact, 'Arial Black', sans-serif;
        font-size: clamp(42px, 6.2vw, 86px);
        font-weight: 1000;
        letter-spacing: .04em;
        line-height: .9;
        text-shadow: 0 4px 0 #3b2102, 0 0 18px rgba(255, 229, 135, .28);
        transition: transform .12s ease, filter .12s ease, opacity .12s ease;
      }

      .giro-main-button:active {
        transform: translateY(2px) scale(.99);
      }

      .giro-main-button:disabled {
        opacity: .55;
        filter: grayscale(.35);
      }

      .giro-cost-panel strong {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: clamp(8px, 1vw, 12px);
        margin-top: clamp(9px, 1vw, 14px);
        color: #fff7df;
        font-size: clamp(22px, 3vw, 42px);
        font-weight: 1000;
        text-shadow: 0 3px 6px #000;
      }

      .giro-cost-panel i {
        display: grid;
        width: clamp(30px, 3.8vw, 48px);
        height: clamp(30px, 3.8vw, 48px);
        place-items: center;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #fff1a8, #ffb92d 42%, #8d5206 78%);
        color: #392302;
        font-size: .78em;
        font-style: normal;
        font-weight: 1000;
        box-shadow: inset 0 0 0 2px rgba(82, 41, 0, .65), 0 0 16px rgba(255, 187, 42, .42);
      }

      .giro-multipliers {
        z-index: 36;
        display: flex;
        width: clamp(66px, 7.4vw, 104px);
        flex-direction: column;
        gap: clamp(5px, .7vw, 9px);
        border: 1px solid rgba(255, 198, 92, .36);
        border-radius: clamp(14px, 1.5vw, 22px);
        background: rgba(7, 6, 5, .72);
        box-shadow: inset 0 0 0 2px rgba(0,0,0,.7), 0 16px 28px rgba(0,0,0,.6);
        padding: clamp(7px, .8vw, 10px);
      }

      .giro-multipliers button {
        position: relative;
        height: clamp(50px, 6.5vw, 78px);
        border: 1px solid rgba(255, 190, 70, .28);
        border-radius: clamp(9px, 1vw, 14px);
        background: linear-gradient(180deg, rgba(30,27,22,.96), rgba(6,6,6,.98));
        color: rgba(246, 221, 166, .66);
        font-family: Georgia, 'Times New Roman', serif;
        font-size: clamp(20px, 2.8vw, 36px);
        font-weight: 900;
        text-shadow: 0 2px 3px #000;
        box-shadow: inset 0 0 0 2px rgba(0,0,0,.42);
        transition: transform .12s ease, filter .12s ease, color .12s ease;
      }

      .giro-multipliers button.is-active {
        border-color: rgba(255, 207, 84, .95);
        background:
          radial-gradient(circle at 50% 10%, rgba(255,255,255,.22), transparent 38%),
          linear-gradient(180deg, #8a5416, #31200c 58%, #0b0907);
        color: #fff1bd;
        filter: drop-shadow(0 0 14px rgba(255, 174, 29, .58));
        box-shadow: inset 0 0 0 2px rgba(255, 213, 100, .26), 0 0 20px rgba(255, 174, 29, .34);
      }

      .giro-multipliers button.is-active::before {
        content: '';
        position: absolute;
        left: -18px;
        top: 50%;
        width: 0;
        height: 0;
        transform: translateY(-50%);
        border-top: 12px solid transparent;
        border-bottom: 12px solid transparent;
        border-right: 15px solid #ffd15b;
        filter: drop-shadow(0 0 8px rgba(255, 197, 69, .7));
      }

      .giro-loading-card {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        border: 1px solid rgba(255, 198, 92, .44);
        border-radius: 24px;
        background: rgba(0,0,0,.62);
        padding: 18px 24px;
        color: #ffe39a;
        font-weight: 900;
        letter-spacing: .1em;
        text-transform: uppercase;
        backdrop-filter: blur(12px);
      }

      @keyframes giro-reel-spin {
        from { transform: translateY(-62%); }
        to { transform: translateY(0); }
      }

      @media (max-width: 820px) {
        .giro-stage {
          grid-template-columns: 1fr;
          justify-items: center;
          padding-top: 78px;
        }

        .giro-machine {
          width: min(105vw, 790px);
        }

        .giro-multipliers {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-35%);
          width: 58px;
          padding: 6px;
          gap: 5px;
        }

        .giro-multipliers button {
          height: 46px;
          font-size: 19px;
        }

        .giro-hud {
          top: 8px;
        }

        .giro-resource-pill {
          min-width: auto;
          width: clamp(94px, 25vw, 140px);
          padding: 0 8px;
          font-size: clamp(13px, 3.4vw, 18px);
        }

        .giro-resource-icon {
          width: 24px;
          height: 24px;
        }

        .giro-bottom-ui {
          gap: 7px;
        }
      }

      @media (max-width: 560px) {
        .giro-page {
          min-height: 100svh;
        }

        .giro-hud-resources {
          gap: 5px;
        }

        .giro-avatar {
          width: 44px;
          height: 44px;
          border-radius: 13px;
        }

        .giro-resource-pill {
          height: 36px;
          width: auto;
          min-width: 70px;
          gap: 5px;
          border-radius: 11px;
          font-size: 12px;
        }

        .giro-resource-pill:nth-child(1) {
          min-width: 104px;
        }

        .giro-resource-pill:nth-child(2) {
          min-width: 78px;
        }

        .giro-resource-pill:nth-child(3) {
          min-width: 75px;
        }

        .giro-stage {
          padding-inline: 5px;
        }

        .giro-machine {
          width: 118vw;
          transform: translateX(-2vw) translateY(8px);
        }

        .giro-multipliers {
          right: 3px;
          width: 47px;
          transform: translateY(-32%);
        }

        .giro-multipliers button {
          height: 38px;
          font-size: 15px;
        }

        .giro-multipliers button.is-active::before {
          left: -12px;
          border-top-width: 8px;
          border-bottom-width: 8px;
          border-right-width: 10px;
        }

        .giro-bet-panel,
        .giro-cost-panel {
          min-height: 62px;
          padding: 8px;
        }

        .giro-bet-panel > div {
          grid-template-columns: 32px 1fr 32px;
          gap: 4px;
        }

        .giro-bet-panel button {
          height: 32px;
          border-radius: 8px;
        }
      }
    `}</style>
  );
}
