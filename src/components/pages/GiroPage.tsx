// GiroPage.jsx - compatível com Wix (sem dependências externas)
import { useEffect, useRef, useState } from 'react';

// ========== CONFIGURAÇÕES (ajuste conforme seu projeto) ==========
const COMMANDS_ICON = 'https://static.wixstatic.com/media/50f4bf_9bda4af1a12b47679336479a80b16eb8~mv2.png';
const MACHINE_TEXTURE = 'https://static.wixstatic.com/media/50f4bf_f0f13bffd67f4487bbad4fec560e36e5~mv2.png';

const SLOT_ASSETS = {
  money: 'https://cdn-icons-png.flaticon.com/512/3135/3135706.png',
  diamond: 'https://cdn-icons-png.flaticon.com/512/616/494.png',
  gun: 'https://cdn-icons-png.flaticon.com/512/833/833472.png',
  police: 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png',
};

const MULTIPLIERS = [1, 2, 5, 10, 25, 50];
const REEL_STOP_MS = [1050, 1480, 1920];
const DEFAULT_REELS = ['money', 'gun', 'diamond'];
const ANIMATION_SYMBOLS = ['money', 'gun', 'diamond', 'police'];

// Funções auxiliares
function formatNumber(value) {
  return Math.max(0, Math.floor(Number(value) || 0)).toLocaleString('pt-BR');
}
function formatShort(value) {
  const n = Math.max(0, Number(value) || 0);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.floor(n).toLocaleString('pt-BR');
}
function randomAnimationSymbol() {
  return ANIMATION_SYMBOLS[Math.floor(Math.random() * ANIMATION_SYMBOLS.length)];
}
function vibrate(pattern) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
}
function playTone(freq, duration = 0.08, type = 'square') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
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
  } catch (e) {}
}

// ========== COMPONENTE PRINCIPAL ==========
export default function GiroPage() {
  // Substitua pelo seu store real do Wix (ex: useWixPlayerStore)
  // Por enquanto vou simular com useState e um player fake
  const [player, setPlayer] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Estados da slot
  const [displayedReels, setDisplayedReels] = useState(DEFAULT_REELS);
  const [lockedReels, setLockedReels] = useState([true, true, true]);
  const [landingReels, setLandingReels] = useState([false, false, false]);
  const [spinning, setSpinning] = useState(false);
  const [multiplier, setMultiplier] = useState(25);
  const [message, setMessage] = useState('Escolha quantos Corres entram na rua.');
  const [policeFlash, setPoliceFlash] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const reelTimers = useRef([]);
  const reelIntervals = useRef([]);

  // Simular carregamento do jogador (substitua pela sua lógica do Wix)
  useEffect(() => {
    // Exemplo: buscar dados do backend do Wix via fetch
    const fetchPlayer = async () => {
      try {
        const res = await fetch('/api/player'); // ajuste para sua rota
        const data = await res.json();
        setPlayer(data);
      } catch (error) {
        // Fallback para testes
        setPlayer({
          _id: '123',
          name: 'Jogador',
          headerCustomization: { customName: 'Barraqueiro', customAvatar: '' },
          balances: { corre: 1250, dirtyMoney: 87400, cleanMoney: 32000 },
          niveis: { barracoLevel: 3 },
          prisonHistory: { cooldownUntil: 0 }
        });
      } finally {
        setIsLoaded(true);
      }
    };
    fetchPlayer();
  }, []);

  const corre = player?.balances?.corre ?? 0;
  const dirtyMoney = player?.balances?.dirtyMoney ?? 0;
  const playerCooldownUntil = player?.prisonHistory?.cooldownUntil ?? 0;
  const activeCooldownUntil = Math.max(cooldownUntil, playerCooldownUntil);
  const cooldownRemaining = Math.max(0, activeCooldownUntil - Date.now());
  const canSpin = !spinning && cooldownRemaining <= 0 && corre >= multiplier;

  // Limpeza
  useEffect(() => {
    return () => {
      reelTimers.current.forEach(clearTimeout);
      reelIntervals.current.forEach(clearInterval);
    };
  }, []);

  // Atualiza contagem regressiva do cooldown
  useEffect(() => {
    if (!activeCooldownUntil) return;
    const interval = setInterval(() => {
      if (Date.now() >= activeCooldownUntil) {
        setCooldownUntil(0);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [activeCooldownUntil]);

  const clearAnimations = () => {
    reelTimers.current.forEach(clearTimeout);
    reelIntervals.current.forEach(clearInterval);
    reelTimers.current = [];
    reelIntervals.current = [];
  };

  const flashPolice = () => {
    setPoliceFlash(true);
    setTimeout(() => setPoliceFlash(false), 900);
  };

  const finalizeSpin = (result) => {
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
    if (result.outcome === 'jackpot' || result.reels.every(s => s === 'diamond')) {
      vibrate([80, 40, 80, 40, 160]);
      [440, 550, 660, 880].forEach((freq, idx) => setTimeout(() => playTone(freq, 0.12, 'sine'), idx * 90));
    } else {
      vibrate(35);
    }
    setMessage(result.label);
    setSpinning(false);
  };

  const handleSpin = async () => {
    if (!player?._id) return;
    if (!canSpin) {
      if (cooldownRemaining > 0) {
        setMessage(`Corre esfriando: ${Math.ceil(cooldownRemaining / 1000)}s.`);
      } else if (corre < multiplier) {
        setMessage('Sem Corre suficiente pra bancar esse movimento.');
      }
      return;
    }

    vibrate(30);
    playTone(330, 0.05);
    clearAnimations();
    setDisplayedReels(DEFAULT_REELS);
    setLockedReels([false, false, false]);
    setLandingReels([false, false, false]);
    setSpinning(true);
    setMessage(`Colocando ${multiplier} Corre(s) na rua...`);

    try {
      // Chamada para sua API de spin (substitua pela URL real)
      const response = await fetch('/api/spinSlot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ multiplier })
      });
      const data = await response.json();
      const result = data.result;

      if (data.player) setPlayer(data.player);

      for (let i = 0; i < 3; i++) {
        const interval = setInterval(() => {
          setDisplayedReels(prev => {
            const clone = [...prev];
            clone[i] = randomAnimationSymbol();
            return clone;
          });
        }, 70 + i * 28);
        reelIntervals.current.push(interval);

        const timer = setTimeout(() => {
          clearInterval(interval);
          playTone(220 + i * 125, 0.07);
          vibrate(35);
          setDisplayedReels(prev => {
            const clone = [...prev];
            clone[i] = result.reels[i];
            return clone;
          });
          setLandingReels(prev => {
            const clone = [...prev];
            clone[i] = true;
            return clone;
          });
          setTimeout(() => {
            setLandingReels(prev => {
              const clone = [...prev];
              clone[i] = false;
              return clone;
            });
          }, 420);
          setLockedReels(prev => {
            const clone = [...prev];
            clone[i] = true;
            return clone;
          });
          if (i === 2) {
            setTimeout(() => finalizeSpin(result), 180);
          }
        }, REEL_STOP_MS[i]);
        reelTimers.current.push(timer);
      }
    } catch (error) {
      console.error(error);
      setMessage('Falha ao rodar. Tenta de novo.');
      setDisplayedReels(DEFAULT_REELS);
      setLockedReels([true, true, true]);
      setLandingReels([false, false, false]);
      setSpinning(false);
    }
  };

  if (!isLoaded) {
    return <div className="loading">Carregando Giro no Asfalto...</div>;
  }

  const avatarUrl = player?.headerCustomization?.customAvatar || '';
  const playerName = player?.headerCustomization?.customName || player?.name || 'Jogador';

  // Estilos inline para não depender de CSS externo
  const styles = {
    page: { minHeight: '100vh', background: '#050505', color: 'white', position: 'relative', overflow: 'hidden' },
    texture: { position: 'fixed', inset: 0, opacity: 0.18, objectFit: 'cover', width: '100%', height: '100%', pointerEvents: 'none' },
    gradient: { position: 'fixed', inset: 0, background: 'radial-gradient(circle at 50% 15%, rgba(234,179,8,0.16), transparent 38%), linear-gradient(180deg, rgba(0,0,0,0.72), #050505 42%, #050505)', pointerEvents: 'none' },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '1rem', position: 'relative', zIndex: 10 },
    header: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', borderRadius: '1rem', border: '1px solid #7c561e', background: 'rgba(0,0,0,0.72)', padding: '0.5rem 0.75rem', backdropFilter: 'blur(12px)' },
    slotCard: { borderRadius: '1.5rem', border: '1px solid #7c561e', background: 'linear-gradient(180deg,#1d1308,#050505 45%,#140b03)', padding: '1.5rem', boxShadow: 'inset 0 0 55px rgba(255,176,37,0.14), 0 0 34px rgba(0,0,0,0.65)' },
    prize: { textAlign: 'center', marginBottom: '1.5rem' },
    prizeLabel: { fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.35em', color: '#facc15', textTransform: 'uppercase' },
    prizeValue: { fontFamily: 'monospace', fontSize: '4rem', fontWeight: 'bold', color: '#fde047', textShadow: '0 0 20px rgba(255,190,0,0.5)', marginTop: '0.25rem' },
    reelsContainer: { maxWidth: '28rem', margin: '0 auto' },
    reelsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', borderRadius: '1.75rem', border: '1px solid #b18135', background: 'linear-gradient(90deg,#d8b06a,#4b2a0a 14%,#e6c07d 50%,#4b2a0a 86%,#d8b06a)', padding: '1rem', boxShadow: 'inset 0 0 32px rgba(0,0,0,0.75)' },
    reel: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '0.7', borderRadius: '1rem', border: '1px solid black', background: 'radial-gradient(circle at 50% 40%, #f5d8a8, #8b5b24 58%, #1b0e04)', overflow: 'hidden' },
    reelImg: { width: '60%', height: '60%', objectFit: 'contain', filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.55))', transition: 'transform 0.1s ease' },
    controls: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', marginTop: '2rem', alignItems: 'end' },
    betPanel: { textAlign: 'center', borderRadius: '1rem', border: '1px solid #7c561e', background: 'rgba(0,0,0,0.7)', padding: '1rem' },
    betButtons: { display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' },
    spinButton: { position: 'relative', minWidth: '160px', borderRadius: '1rem', border: '1px solid #fef08a', background: 'linear-gradient(to bottom, #fde047, #eab308, #b45309)', padding: '1.25rem 1rem', fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'black', cursor: 'pointer', transition: 'transform 0.1s' },
    messageBox: { marginTop: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.875rem', color: '#d4d4d8' },
    multipliersBar: { display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' },
  };

  return (
    <div style={styles.page}>
      <img src={MACHINE_TEXTURE} style={styles.texture} alt="" />
      <div style={styles.gradient} />
      {policeFlash && <div style={{ position: 'fixed', inset: 0, background: 'rgba(220,38,38,0.35)', zIndex: 60, pointerEvents: 'none' }} />}
      <div style={styles.container}>
        {/* Header simplificado */}
        <div style={styles.header}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => window.location.href = '/'} style={{ borderRadius: '0.75rem', border: '1px solid #7c561e', background: 'rgba(255,255,255,0.04)', padding: '0.5rem', color: '#fde047' }}>🏠</button>
            <button onClick={() => window.history.back()} style={{ borderRadius: '0.75rem', border: '1px solid #7c561e', background: 'rgba(255,255,255,0.04)', padding: '0.5rem', color: '#67e8f9' }}>←</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.75rem', border: '1px solid #7c561e', background: 'rgba(0,0,0,0.6)', padding: '0.375rem 0.75rem' }}>
              {avatarUrl ? <img src={avatarUrl} style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', objectFit: 'cover' }} /> : <div style={{ width: '2.25rem', height: '2.25rem', background: '#18181b', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fde047' }}>{playerName[0]}</div>}
              <div style={{ display: 'none', '@media (min-width: 640px)': { display: 'block' } }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.16em', color: '#fde047' }}>{playerName}</p>
                <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: '#71717a' }}>Barraco {player?.niveis?.barracoLevel || 1}</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.75rem', border: '1px solid #7c561e', background: 'rgba(0,0,0,0.7)', padding: '0.5rem 0.75rem' }}>
              <span>🪙</span>
              <div><p style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: '#71717a' }}>Sujo</p><p style={{ fontWeight: 'bold', color: '#fde047' }}>{formatShort(dirtyMoney)}</p></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.75rem', border: '1px solid #7c561e', background: 'rgba(0,0,0,0.7)', padding: '0.5rem 0.75rem' }}>
              <span>⚡</span>
              <div><p style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: '#71717a' }}>Corre</p><p style={{ fontWeight: 'bold', color: '#67e8f9' }}>{formatNumber(corre)}</p></div>
            </div>
            <button style={{ borderRadius: '0.75rem', border: '1px solid #7c561e', background: 'rgba(255,255,255,0.04)', padding: '0.5rem' }}>☰</button>
          </div>
        </div>

        {/* Slot principal */}
        <div style={styles.slotCard}>
          <div style={styles.prize}>
            <p style={styles.prizeLabel}>PRÊMIO</p>
            <p style={styles.prizeValue}>{spinning ? '•••••' : formatNumber(Math.max(multiplier * 2000, 50000))}</p>
          </div>

          <div style={styles.reelsContainer}>
            <div style={styles.reelsGrid}>
              {[0, 1, 2].map(idx => (
                <div key={idx} style={styles.reel}>
                  <img src={SLOT_ASSETS[displayedReels[idx]]} style={styles.reelImg} />
                  {landingReels[idx] && <div style={{ position: 'absolute', inset: 0, borderRadius: '1rem', boxShadow: 'inset 0 0 25px rgba(255,210,0,0.55)', border: '2px solid #fde047' }} />}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.controls}>
            <div style={styles.betPanel}>
              <p style={{ fontSize: '0.625rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.22em', color: '#71717a' }}>APOSTA</p>
              <div style={styles.betButtons}>
                <button onClick={() => setMultiplier(MULTIPLIERS[Math.max(0, MULTIPLIERS.indexOf(multiplier)-1)] || 1)} disabled={spinning} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', border: '1px solid #7c561e', background: 'rgba(255,255,255,0.05)', fontSize: '1.25rem', fontWeight: 'bold' }}>−</button>
                <span style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 'bold', color: '#fde047' }}>{multiplier}</span>
                <button onClick={() => setMultiplier(MULTIPLIERS[Math.min(MULTIPLIERS.length-1, MULTIPLIERS.indexOf(multiplier)+1)] || 50)} disabled={spinning} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', border: '1px solid #7c561e', background: 'rgba(255,255,255,0.05)', fontSize: '1.25rem', fontWeight: 'bold' }}>+</button>
              </div>
            </div>

            <button onClick={handleSpin} disabled={!canSpin && !spinning} style={styles.spinButton}>
              {spinning ? 'PARAR' : 'GIRAR'}
            </button>

            <div style={styles.betPanel}>
              <p style={{ fontSize: '0.625rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.22em', color: '#71717a' }}>CUSTO</p>
              <p style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 'bold', color: '#fde047' }}>{multiplier}</p>
              <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: '#71717a' }}>CORRES</p>
            </div>
          </div>

          <div style={styles.messageBox}>{message}</div>

          <div style={styles.multipliersBar}>
            {MULTIPLIERS.map(v => (
              <button key={v} onClick={() => setMultiplier(v)} disabled={spinning} style={{ padding: '0.25rem 0.75rem', borderRadius: '0.75rem', border: multiplier===v ? '1px solid #fde047' : '1px solid #7c561e', background: multiplier===v ? '#eab308' : 'rgba(0,0,0,0.7)', color: multiplier===v ? 'black' : '#fef08a', fontSize: '0.75rem', fontWeight: 'bold' }}>{v}x</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}