import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { usePlayerStore } from '@/store/playerStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Zap, Siren, ShieldAlert, Coins } from 'lucide-react';

type SymbolType = '💎' | '💵' | '🔫' | '🚔';

const SYMBOLS: SymbolType[] = ['💎', '💵', '🔫', '🚔'];
const MULTIPLIERS = [1, 2, 5, 10, 25, 50];

const SLOT_BACKGROUND =
  'https://static.wixstatic.com/media/50f4bf_f0f13bffd67f4487bbad4fec560e36e5~mv2.png?originWidth=1024&originHeight=1920';

const GALLERY_IMAGES = [
  'https://static.wixstatic.com/media/50f4bf_1e9f8c8b124e420eaa037f646b4b8b94~mv2.png?originWidth=256&originHeight=256',
  'https://static.wixstatic.com/media/50f4bf_c68cec853fba4cb7876e5b468cc192ba~mv2.png?originWidth=256&originHeight=256',
  'https://static.wixstatic.com/media/50f4bf_c5d8ef227002464f8a17cfd8053b0cb1~mv2.png?originWidth=256&originHeight=256',
];

const randomSymbol = (): SymbolType =>
  SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

const rollingReels = (): SymbolType[] => [randomSymbol(), randomSymbol(), randomSymbol()];

function generateOutcome(): SymbolType[] {
  const r = Math.random();

  if (r < 0.03) return ['💎', '💎', '💎']; // jackpot
  if (r < 0.09) return ['🚔', '🚔', '🚔']; // prisão
  if (r < 0.20) return ['💵', '💵', '💵']; // dinheiro alto
  if (r < 0.34) return ['🔫', '🔫', '🔫']; // dinheiro médio
  if (r < 0.50) return ['💵', '💵', '🔫']; // dinheiro baixo

  return rollingReels();
}

export default function GiroPage() {
  const navigate = useNavigate();

  const {
    player,
    isLoaded,
    loadPlayer,
    addDirtyMoney,
    removeDirtyMoneyPercent,
    removeCorre,
  } = usePlayerStore();

  const [reels, setReels] = useState<SymbolType[]>(['💎', '💵', '🔫']);
  const [spinning, setSpinning] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [prisonOpen, setPrisonOpen] = useState(false);
  const [policeFlash, setPoliceFlash] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      loadPlayer();
    }
  }, [isLoaded, loadPlayer]);

  const dirtyMoney = player?.balances?.dirtyMoney ?? 0;
  const cleanMoney = player?.balances?.cleanMoney ?? 0;
  const corre = player?.balances?.corre ?? 0;

  const canSpin = useMemo(() => corre >= multiplier && !spinning, [corre, multiplier, spinning]);

  const pushHistory = (entry: string) => {
    setHistory((prev) => [entry, ...prev].slice(0, 8));
  };

  const triggerPoliceAlert = () => {
    setPrisonOpen(true);
    setPoliceFlash(true);

    const stopFlash = window.setTimeout(() => {
      setPoliceFlash(false);
    }, 2400);

    const closeModal = window.setTimeout(() => {
      setPrisonOpen(false);
    }, 3200);

    return () => {
      window.clearTimeout(stopFlash);
      window.clearTimeout(closeModal);
    };
  };

  const handleSpin = () => {
    if (!canSpin) {
      if (corre < multiplier) {
        setMessage('Sem corre suficiente pra bancar esse corre.');
      }
      return;
    }

    setSpinning(true);
    setMessage('');

    removeCorre(multiplier);

    const interval = window.setInterval(() => {
      setReels(rollingReels());
    }, 120);

    window.setTimeout(() => {
      window.clearInterval(interval);

      const outcome = generateOutcome();
      setReels(outcome);

      const [a, b, c] = outcome;

      if (a === '🚔' && b === '🚔' && c === '🚔') {
        removeDirtyMoneyPercent(30);
        setMessage('🚔 A casa caiu. Perdeu 30% do Commands Sujo.');
        pushHistory('🚔 Prisão: -30% do Commands Sujo');
        triggerPoliceAlert();
      } else if (a === '💎' && b === '💎' && c === '💎') {
        const gain = 10000 * multiplier;
        addDirtyMoney(gain);
        setMessage(`💎 JACKPOT! +${gain.toLocaleString('pt-BR')} Commands Sujo`);
        pushHistory(`💎 Jackpot: +${gain.toLocaleString('pt-BR')}`);
      } else if (a === '💵' && b === '💵' && c === '💵') {
        const gain = 2000 * multiplier;
        addDirtyMoney(gain);
        setMessage(`💵 Bateu forte! +${gain.toLocaleString('pt-BR')} Commands Sujo`);
        pushHistory(`💵 Triplo dinheiro: +${gain.toLocaleString('pt-BR')}`);
      } else if (a === '🔫' && b === '🔫' && c === '🔫') {
        const gain = 1200 * multiplier;
        addDirtyMoney(gain);
        setMessage(`🔫 Corre pesado! +${gain.toLocaleString('pt-BR')} Commands Sujo`);
        pushHistory(`🔫 Triplo arma: +${gain.toLocaleString('pt-BR')}`);
      } else if (
        (a === '💵' && b === '💵') ||
        (a === '💵' && c === '💵') ||
        (b === '💵' && c === '💵')
      ) {
        const gain = 600 * multiplier;
        addDirtyMoney(gain);
        setMessage(`💵 Caiu bem. +${gain.toLocaleString('pt-BR')} Commands Sujo`);
        pushHistory(`💵 Dupla dinheiro: +${gain.toLocaleString('pt-BR')}`);
      } else {
        const gain = 100 * multiplier;
        addDirtyMoney(gain);
        setMessage(`⚡ Corre pequeno. +${gain.toLocaleString('pt-BR')} Commands Sujo`);
        pushHistory(`⚡ Giro comum: +${gain.toLocaleString('pt-BR')}`);
      }

      setSpinning(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-[#0a0d14] text-white overflow-x-hidden">
      <Header />

      {policeFlash && (
        <div className="pointer-events-none fixed inset-0 z-[60] animate-pulse">
          <div className="absolute inset-0 bg-red-600/30" />
          <div className="absolute inset-0 bg-blue-600/25 mix-blend-screen animate-pulse" />
        </div>
      )}

      {prisonOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-6">
          <div className="w-full max-w-2xl rounded-[28px] border border-red-500/30 bg-[#0f1118] p-8 shadow-[0_0_50px_rgba(255,0,0,0.25)]">
            <div className="flex items-center justify-center gap-4 text-red-400">
              <Siren className="h-10 w-10 animate-pulse" />
              <ShieldAlert className="h-10 w-10 animate-pulse" />
              <Siren className="h-10 w-10 animate-pulse" />
            </div>

            <h2 className="mt-6 text-center text-4xl font-black uppercase tracking-[0.16em] text-red-300">
              RODOU
            </h2>

            <p className="mt-6 text-center text-lg leading-relaxed text-zinc-200">
              A casa caiu, parceiro. O giroflex cantou na tua porta e os homem levaram
              <span className="font-bold text-red-300"> 30% do teu Commands Sujo</span>.
            </p>

            <p className="mt-4 text-center text-sm uppercase tracking-[0.24em] text-zinc-500">
              Melhor voltar mais ligeiro no próximo corre.
            </p>
          </div>
        </div>
      )}

      <div className="absolute top-24 left-6 z-20 flex gap-3">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-xl border border-[#FF4500] bg-[#FF4500]/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-[#FF4500]/35"
        >
          <Home className="h-4 w-4" />
          Home
        </button>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-[#00eaff] bg-[#00eaff]/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00eaff]/35"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </div>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <Image
          src={SLOT_BACKGROUND}
          alt="Giro no Asfalto"
          width={1024}
          height={1920}
          className="fixed inset-0 h-full w-full object-cover brightness-110 contrast-110"
        />

        <div className="absolute inset-0 bg-black/35" />

        <div className="relative z-10 w-full max-w-6xl px-6 pt-36 pb-20">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
            <div className="flex flex-col items-center justify-center">
              <div className="w-full max-w-md rounded-[32px] border border-yellow-500/40 bg-black/70 p-6 shadow-[0_0_40px_rgba(255,215,0,0.20)] backdrop-blur-md">
                <div className="mb-4 text-center">
                  <p className="text-xs uppercase tracking-[0.28em] text-zinc-400">
                    Giro no Asfalto
                  </p>
                  <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.14em] text-yellow-300">
                    Corre premiado
                  </h1>
                </div>

                <div className="mb-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-red-500/20 bg-red-900/25 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                      Sujo
                    </p>
                    <p className="mt-2 text-lg font-bold text-red-200">
                      {dirtyMoney.toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-900/25 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                      Limpo
                    </p>
                    <p className="mt-2 text-lg font-bold text-emerald-200">
                      {cleanMoney.toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-900/25 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                      Corre
                    </p>
                    <p className="mt-2 text-lg font-bold text-cyan-200">
                      {corre.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="mb-6 flex justify-center gap-3">
                  {reels.map((symbol, index) => (
                    <motion.div
                      key={`${symbol}-${index}-${spinning}`}
                      animate={{ y: spinning ? [0, -24, 24, 0] : 0 }}
                      transition={{ repeat: spinning ? Infinity : 0, duration: 0.18 }}
                      className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-yellow-400 bg-zinc-950 text-5xl shadow-[0_0_14px_rgba(255,215,0,0.35)]"
                    >
                      {symbol}
                    </motion.div>
                  ))}
                </div>

                <div className="mb-5">
                  <p className="mb-3 text-center text-xs uppercase tracking-[0.24em] text-zinc-400">
                    Multiplicador de corre
                  </p>

                  <div className="flex flex-wrap justify-center gap-2">
                    {MULTIPLIERS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMultiplier(m)}
                        disabled={spinning}
                        className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                          multiplier === m
                            ? 'bg-yellow-500 text-black'
                            : 'border border-yellow-700 bg-zinc-900 text-white'
                        } ${spinning ? 'opacity-50' : 'hover:scale-[1.03]'}`}
                      >
                        x{m}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSpin}
                  disabled={!canSpin}
                  className="w-full rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 px-6 py-4 text-base font-black uppercase tracking-[0.24em] text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {spinning ? 'GIRANDO...' : `GIRAR x${multiplier}`}
                </button>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-center">
                  <div className="inline-flex items-center gap-2 text-yellow-300">
                    <Coins className="h-4 w-4" />
                    <span className="text-sm font-semibold">{message || 'Escolhe teu corre e gira a máquina.'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-cyan-500/20 bg-black/60 p-6 backdrop-blur-md shadow-[0_0_40px_rgba(0,234,255,0.10)]">
              <h2 className="text-2xl font-black uppercase tracking-[0.14em] text-cyan-300">
                Central do Corre
              </h2>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    Regras rápidas
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-200">
                    <li>• cada giro consome corre</li>
                    <li>• todo prêmio entra no Commands Sujo</li>
                    <li>• prisão leva 30% do Commands Sujo</li>
                    <li>• o Header atualiza pelo mesmo cofre da playerStore</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    Histórico
                  </p>

                  <div className="mt-3 space-y-2">
                    {history.length === 0 ? (
                      <p className="text-sm text-zinc-500">Nenhum corre rodado ainda.</p>
                    ) : (
                      history.map((entry, index) => (
                        <div
                          key={`${entry}-${index}`}
                          className="rounded-xl border border-white/8 bg-black/30 px-3 py-2 text-sm text-zinc-200"
                        >
                          {entry}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-amber-300">
                    Observação
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                    Essa página está ligada no teu cofre central. Tudo que cair aqui já conversa
                    com a playerStore e segue o fluxo de salvamento automático.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-gradient-to-b from-[#0f1419] to-[#0a0d14] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-heading text-center mb-12 text-white">
            Galeria do Giro
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {GALLERY_IMAGES.map((src, index) => (
              <div key={src} className="flex justify-center">
                <div className="rounded-lg overflow-hidden border border-[#00eaff]/30 hover:border-[#00eaff] transition-all">
                  <Image
                    src={src}
                    alt={`Giro no Asfalto - Galeria ${index + 1}`}
                    width={300}
                    height={300}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}