import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePlayerStore } from '@/store/playerStore';
import { buyFugaVehicle } from '@/api/fugaApi';
import {
  FUGA_VEHICLES,
  type FugaVehicle,
  formatFugaMoney,
  getFugaMemberLabel,
  getFugaStatLabel,
  getFugaVehicleById,
  getOwnedFugaVehicles,
  getUnlockedFugaVehicles,
  isFugaVehicleOwned,
} from '@/data/fugaGarage';

const GARAGE_BG = `
  radial-gradient(circle at 18% 12%, rgba(255, 54, 54, 0.28), transparent 28%),
  radial-gradient(circle at 80% 8%, rgba(80, 180, 255, 0.22), transparent 30%),
  radial-gradient(circle at 50% 65%, rgba(255, 194, 72, 0.10), transparent 34%),
  linear-gradient(180deg, #08070a 0%, #12080d 38%, #050608 100%)
`;

function statPercent(stat: FugaVehicle['targetStat'], value: number) {
  return {
    rajada: stat === 'rajada' ? value : 0,
    blindagem: stat === 'blindagem' ? value : 0,
    folego: stat === 'folego' ? value : 0,
    quebra: stat === 'quebra' ? value : 0,
  };
}

function getFugaItemId(vehicleId: string) {
  return `fuga:${vehicleId}`;
}

function VehicleIllustration({ vehicle, active = false }: { vehicle: FugaVehicle; active?: boolean }) {
  const gid = `fuga-${vehicle.id}`;
  const neon = vehicle.paint.neon;
  const body = vehicle.paint.body;
  const body2 = vehicle.paint.body2;
  const glass = vehicle.paint.glass;
  const rim = vehicle.paint.rim;

  const wheel = (cx: number, cy = 164, r = 22) => (
    <g>
      <circle cx={cx} cy={cy} r={r + 7} fill="rgba(0,0,0,0.55)" />
      <circle cx={cx} cy={cy} r={r} fill="#050505" stroke={neon} strokeWidth="3" />
      <circle cx={cx} cy={cy} r={r - 9} fill={rim} opacity="0.95" />
      <circle cx={cx} cy={cy} r="4" fill="#111" />
    </g>
  );

  const headlights = (
    <>
      <ellipse cx="294" cy="138" rx="19" ry="6" fill="#fff3b0" opacity="0.92" />
      <path d="M306 135 L386 114 L386 160 L306 143 Z" fill="#ffe66d" opacity="0.12" />
      <ellipse cx="76" cy="140" rx="12" ry="5" fill="#ff4b4b" opacity="0.70" />
    </>
  );

  const bodyShadow = (
    <ellipse cx="200" cy="184" rx="150" ry="18" fill="rgba(0,0,0,0.50)" />
  );

  const carByKind = () => {
    switch (vehicle.kind) {
      case 'moto':
        return (
          <>
            {bodyShadow}
            <path d="M100 150 C125 120 160 108 202 118 C236 126 262 145 284 158" fill="none" stroke={`url(#${gid}-body)`} strokeWidth="18" strokeLinecap="round" />
            <path d="M166 119 L206 88 L230 116" fill="none" stroke={body2} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M222 101 L257 80" stroke={neon} strokeWidth="7" strokeLinecap="round" />
            <path d="M137 140 L100 166 M244 140 L295 166" stroke={rim} strokeWidth="6" strokeLinecap="round" />
            {wheel(92, 166, 25)}
            {wheel(304, 166, 25)}
            <ellipse cx="240" cy="86" rx="18" ry="13" fill={glass} opacity="0.82" />
            <path d="M305 157 L368 141 L368 178 L305 169 Z" fill={neon} opacity="0.13" />
          </>
        );
      case 'suv':
        return (
          <>
            {bodyShadow}
            <path d="M48 134 L76 88 L238 78 L302 112 L335 138 L324 164 L68 164 Z" fill={`url(#${gid}-body)`} stroke={neon} strokeWidth="2.5" />
            <path d="M91 96 L134 88 L132 126 L70 127 Z" fill={glass} opacity="0.76" />
            <path d="M144 87 L210 86 L231 124 L140 125 Z" fill={glass} opacity="0.62" />
            <path d="M232 90 L294 118 L259 125 Z" fill={glass} opacity="0.56" />
            <path d="M54 137 L330 137" stroke="rgba(255,255,255,0.28)" strokeWidth="3" />
            {headlights}
            {wheel(112)}
            {wheel(278)}
          </>
        );
      case 'pickup':
        return (
          <>
            {bodyShadow}
            <path d="M44 142 L66 111 L140 105 L178 134 L333 137 L330 164 L58 164 Z" fill={`url(#${gid}-body)`} stroke={neon} strokeWidth="2.5" />
            <path d="M143 106 L214 108 L232 135 L178 134 Z" fill={body2} opacity="0.68" />
            <path d="M76 113 L137 108 L158 134 L57 135 Z" fill={glass} opacity="0.70" />
            <path d="M235 121 L321 133" stroke="rgba(255,255,255,0.22)" strokeWidth="4" strokeLinecap="round" />
            {headlights}
            {wheel(108)}
            {wheel(278)}
          </>
        );
      case 'armored':
        return (
          <>
            {bodyShadow}
            <path d="M50 134 L82 94 L267 88 L335 128 L346 164 L58 164 Z" fill={`url(#${gid}-body)`} stroke={neon} strokeWidth="3" />
            <path d="M87 101 L144 97 L137 124 L68 126 Z" fill={glass} opacity="0.65" />
            <path d="M155 97 L226 95 L244 125 L146 126 Z" fill={glass} opacity="0.52" />
            <path d="M73 140 H320 M95 116 H296" stroke="rgba(255,255,255,0.22)" strokeWidth="3" />
            <path d="M286 101 L334 128 L326 146 L274 124 Z" fill={body2} opacity="0.70" />
            {headlights}
            {wheel(118, 164, 24)}
            {wheel(282, 164, 24)}
          </>
        );
      case 'sedan':
        return (
          <>
            {bodyShadow}
            <path d="M45 147 C74 121 112 110 155 108 L230 108 C274 110 314 125 344 146 L330 164 L62 164 Z" fill={`url(#${gid}-body)`} stroke={neon} strokeWidth="2" />
            <path d="M132 110 C156 82 212 82 242 111 L224 127 L111 127 Z" fill={glass} opacity="0.74" />
            <path d="M171 88 L170 127 M226 106 L205 127" stroke="rgba(255,255,255,0.28)" strokeWidth="2" />
            {headlights}
            {wheel(108)}
            {wheel(285)}
          </>
        );
      case 'super':
        return (
          <>
            {bodyShadow}
            <path d="M43 153 C80 125 120 124 167 121 L220 96 C252 104 290 124 351 145 L338 165 L56 165 Z" fill={`url(#${gid}-body)`} stroke={neon} strokeWidth="2.5" />
            <path d="M174 118 L219 96 L262 122 L161 130 Z" fill={glass} opacity="0.74" />
            <path d="M55 153 C99 137 277 135 342 148" stroke="rgba(255,255,255,0.28)" strokeWidth="3" fill="none" />
            <path d="M315 142 L384 118 L384 170 L315 154 Z" fill={neon} opacity="0.18" />
            {wheel(112, 165, 23)}
            {wheel(292, 165, 23)}
          </>
        );
      case 'coupe':
      case 'muscle':
      default:
        return (
          <>
            {bodyShadow}
            <path d="M45 146 C72 118 111 116 152 114 L190 90 C226 92 255 111 286 127 C312 132 335 138 351 150 L335 165 L60 165 Z" fill={`url(#${gid}-body)`} stroke={neon} strokeWidth="2.5" />
            <path d="M154 113 L191 91 C219 93 242 106 262 126 L141 127 Z" fill={glass} opacity="0.75" />
            <path d="M66 144 C120 132 263 132 340 147" stroke="rgba(255,255,255,0.30)" strokeWidth="3" fill="none" />
            {headlights}
            {wheel(112)}
            {wheel(288)}
          </>
        );
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[30px] border border-white/10 bg-black/20">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(circle at 38% 28%, ${neon}55, transparent 34%), linear-gradient(135deg, ${body}99, ${body2}66 48%, #020306 100%)`,
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,.72))]" />
      <div
        className="absolute left-1/2 top-1/2 h-[210px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: neon }}
      />
      <svg viewBox="0 0 400 220" className="absolute inset-0 h-full w-full drop-shadow-[0_24px_38px_rgba(0,0,0,.58)]">
        <defs>
          <linearGradient id={`${gid}-body`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={body2} />
            <stop offset="50%" stopColor={body} />
            <stop offset="100%" stopColor={neon} stopOpacity="0.84" />
          </linearGradient>
        </defs>
        <g transform={active ? 'translate(0 -2)' : 'translate(0 0)'}>{carByKind()}</g>
      </svg>
      <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/42 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/70">
        {vehicle.codename}
      </div>
      <div className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/42 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/70">
        {vehicle.role}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl">
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/42">{label}</p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function getVehicleStatus(player: any, vehicle: FugaVehicle, cleanMoney: number, barracoLevel: number) {
  const owned = isFugaVehicleOwned(player, vehicle.id);
  const unlocked = barracoLevel >= vehicle.unlockBarracoLevel;
  const affordable = cleanMoney >= vehicle.priceCleanMoney;
  return { owned, unlocked, affordable, locked: !unlocked };
}

export default function FugaIlustradaPage() {
  const player = usePlayerStore((s) => s.player);
  const isLoaded = usePlayerStore((s) => s.isLoaded);
  const hydratePlayerFromServer = usePlayerStore((s) => s.hydratePlayerFromServer);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('touro_negro');
  const [purchaseVehicle, setPurchaseVehicle] = useState<FugaVehicle | null>(null);
  const [loadingVehicleId, setLoadingVehicleId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const barracoLevel = Number(player?.niveis?.barracoLevel || 1);
  const cleanMoney = Number(player?.balances?.cleanMoney || 0);
  const ownedVehicles = useMemo(() => getOwnedFugaVehicles(player), [player]);
  const unlockedVehicles = useMemo(() => getUnlockedFugaVehicles(barracoLevel), [barracoLevel]);
  const selectedVehicle = getFugaVehicleById(selectedVehicleId) || FUGA_VEHICLES[0];

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4200);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const firstTarget = FUGA_VEHICLES.find((vehicle) => {
      const status = getVehicleStatus(player, vehicle, cleanMoney, barracoLevel);
      return status.unlocked && !status.owned;
    });

    if (firstTarget) {
      setSelectedVehicleId(firstTarget.id);
      return;
    }

    const lastOwned = ownedVehicles[ownedVehicles.length - 1];
    if (lastOwned) setSelectedVehicleId(lastOwned.id);
  }, [barracoLevel, cleanMoney, ownedVehicles.length, player]);

  async function handleBuy(vehicle: FugaVehicle) {
    const status = getVehicleStatus(player, vehicle, cleanMoney, barracoLevel);

    if (status.owned) {
      setMessage({ type: 'error', text: 'Esse veículo já está na sua frota.' });
      return;
    }

    if (status.locked) {
      setMessage({ type: 'error', text: `Libera no barraco nível ${vehicle.unlockBarracoLevel}.` });
      return;
    }

    if (!status.affordable) {
      setMessage({ type: 'error', text: 'Dinheiro limpo insuficiente para essa máquina.' });
      return;
    }

    try {
      setLoadingVehicleId(vehicle.id);
      const response = await buyFugaVehicle({ vehicleId: vehicle.id });
      hydratePlayerFromServer(response.player);
      setPurchaseVehicle(null);
      setMessage({
        type: 'ok',
        text: `${vehicle.name} entrou para a frota. +${vehicle.bonusPercent}% ${getFugaStatLabel(vehicle.targetStat)} em ${getFugaMemberLabel(vehicle.targetType)}.`,
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erro ao comprar veículo de fuga.' });
    } finally {
      setLoadingVehicleId(null);
    }
  }

  if (!isLoaded || !player?._id) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="min-h-screen flex items-center justify-center pt-[140px] md:pt-[160px]">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  const selectedStatus = getVehicleStatus(player, selectedVehicle, cleanMoney, barracoLevel);
  const totalBonus = ownedVehicles.length;
  const nextLockedVehicle = FUGA_VEHICLES.find((vehicle) => barracoLevel < vehicle.unlockBarracoLevel);

  return (
    <div className="min-h-screen overflow-hidden text-white" style={{ background: GARAGE_BG }}>
      <Header />

      <main className="relative mx-auto max-w-[118rem] px-4 pb-20 pt-[130px] md:px-7 md:pt-[155px]">
        <div className="pointer-events-none absolute left-[-10%] top-[90px] h-[380px] w-[380px] rounded-full bg-red-600/20 blur-[90px]" />
        <div className="pointer-events-none absolute right-[-12%] top-[180px] h-[460px] w-[460px] rounded-full bg-sky-400/14 blur-[110px]" />
        <div className="pointer-events-none absolute inset-x-0 top-[260px] h-px bg-[linear-gradient(90deg,transparent,rgba(255,221,123,.55),transparent)]" />

        <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-black/42 p-5 shadow-[0_24px_90px_rgba(0,0,0,.55)] backdrop-blur-xl md:p-8">
          <div
            className="absolute inset-0 opacity-45"
            style={{
              background: `radial-gradient(circle at 18% 28%, ${selectedVehicle.paint.neon}30, transparent 34%), radial-gradient(circle at 82% 18%, ${selectedVehicle.paint.body2}40, transparent 30%)`,
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.05),transparent_42%,rgba(0,0,0,.42))]" />

          <div className="relative grid grid-cols-1 gap-7 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.65 }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.42em] text-yellow-200/68">Garagem clandestina</p>
              <h1 className="mt-4 text-4xl font-black uppercase leading-[0.94] tracking-[0.08em] text-white md:text-7xl">
                Garagem da Fuga
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/68 md:text-base">
                Monte uma frota ilustrada de escape. Cada máquina comprada com Commands Limpo vira uma fonte permanente de estatística para um membro da gangue.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
                <MiniStat label="Limpo" value={formatFugaMoney(cleanMoney)} />
                <MiniStat label="Frota" value={`${ownedVehicles.length}/8`} />
                <MiniStat label="Barraco" value={`Nv. ${barracoLevel}`} />
                <MiniStat label="Bônus" value={`+${totalBonus}%`} />
              </div>

              {nextLockedVehicle && (
                <div className="mt-5 rounded-2xl border border-yellow-200/14 bg-yellow-200/[0.06] px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-yellow-100/76">
                  Próxima liberação: {nextLockedVehicle.name} no barraco nv. {nextLockedVehicle.unlockBarracoLevel}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.98, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.75, delay: 0.08 }}
              className="min-h-[360px]"
            >
              <VehicleIllustration vehicle={selectedVehicle} active />
            </motion.div>
          </div>
        </section>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`relative z-10 mx-auto mt-5 max-w-4xl rounded-2xl border px-5 py-4 text-center text-sm font-black uppercase tracking-[0.16em] shadow-[0_18px_50px_rgba(0,0,0,.35)] ${
                message.type === 'ok'
                  ? 'border-emerald-300/30 bg-emerald-500/14 text-emerald-100'
                  : 'border-red-300/30 bg-red-500/14 text-red-100'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <section className="relative mt-8 grid grid-cols-1 gap-7 xl:grid-cols-[1fr_420px]">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {FUGA_VEHICLES.map((vehicle, index) => {
              const status = getVehicleStatus(player, vehicle, cleanMoney, barracoLevel);
              const isLoading = loadingVehicleId === vehicle.id;

              return (
                <motion.article
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.5, delay: index * 0.045 }}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                  className={`group relative overflow-hidden rounded-[32px] border p-4 shadow-[0_22px_70px_rgba(0,0,0,.45)] backdrop-blur-xl transition duration-300 ${
                    selectedVehicle.id === vehicle.id ? 'border-yellow-200/45 bg-white/[0.07]' : 'border-white/10 bg-white/[0.045] hover:border-white/25'
                  } ${status.locked ? 'opacity-60 grayscale-[.35]' : ''}`}
                  style={{ boxShadow: selectedVehicle.id === vehicle.id ? `0 0 38px ${vehicle.paint.neon}34` : undefined }}
                >
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{ background: `radial-gradient(circle at 20% 20%, ${vehicle.paint.neon}33, transparent 35%)` }}
                  />
                  <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                    <div className="h-[230px] lg:h-full min-h-[210px]">
                      <VehicleIllustration vehicle={vehicle} active={selectedVehicle.id === vehicle.id} />
                    </div>

                    <div className="flex min-h-[250px] flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.32em] text-white/42">Veículo de fuga</p>
                          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-white">{vehicle.name}</h2>
                        </div>
                        <div className="rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-white/65">
                          Nv. {vehicle.unlockBarracoLevel}
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-white/62">{vehicle.headline}</p>

                      <div className="mt-4 grid grid-cols-1 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/40">Bônus permanente</p>
                          <p className="mt-2 text-base font-black text-yellow-100">
                            +{vehicle.bonusPercent}% {getFugaStatLabel(vehicle.targetStat)} em {getFugaMemberLabel(vehicle.targetType)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/40">Valor</p>
                          <p className="mt-2 text-lg font-black text-white">{formatFugaMoney(vehicle.priceCleanMoney)} Commands Limpo</p>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedVehicleId(vehicle.id);
                            setPurchaseVehicle(vehicle);
                          }}
                          disabled={status.owned || status.locked || !status.affordable || isLoading}
                          className="rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-black transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45"
                          style={{ background: status.owned ? '#2b2b2b' : `linear-gradient(135deg, #ffe66d, ${vehicle.paint.neon})` }}
                        >
                          {isLoading ? 'Comprando...' : status.owned ? 'Na frota' : status.locked ? 'Bloqueado' : status.affordable ? 'Comprar' : 'Sem limpo'}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedVehicleId(vehicle.id);
                          }}
                          className="rounded-2xl border border-white/12 bg-white/[0.055] px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-white/82 transition hover:bg-white/[0.09] active:scale-[.98]"
                        >
                          Inspecionar
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <aside className="xl:sticky xl:top-[130px] h-fit rounded-[34px] border border-white/10 bg-black/46 p-5 shadow-[0_24px_80px_rgba(0,0,0,.46)] backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-yellow-100/60">Ficha da máquina</p>
            <h3 className="mt-3 text-3xl font-black uppercase tracking-[0.12em] text-white">{selectedVehicle.name}</h3>
            <p className="mt-3 text-sm leading-7 text-white/64">{selectedVehicle.lore}</p>

            <div className="mt-5 h-[250px]">
              <VehicleIllustration vehicle={selectedVehicle} active />
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/40">Oficina</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{selectedVehicle.mechanicNote}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Preço" value={formatFugaMoney(selectedVehicle.priceCleanMoney)} />
                <MiniStat label="Libera" value={`Nv. ${selectedVehicle.unlockBarracoLevel}`} />
              </div>
              <div className="rounded-2xl border border-yellow-200/14 bg-yellow-200/[0.06] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-yellow-100/50">Ganho</p>
                <p className="mt-2 text-lg font-black text-yellow-100">
                  +{selectedVehicle.bonusPercent}% {getFugaStatLabel(selectedVehicle.targetStat)} em {getFugaMemberLabel(selectedVehicle.targetType)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPurchaseVehicle(selectedVehicle)}
              disabled={selectedStatus.owned || selectedStatus.locked || !selectedStatus.affordable || loadingVehicleId === selectedVehicle.id}
              className="mt-5 w-full rounded-2xl px-5 py-4 text-sm font-black uppercase tracking-[0.24em] text-black shadow-[0_16px_42px_rgba(0,0,0,.35)] transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45"
              style={{ background: selectedStatus.owned ? '#363636' : `linear-gradient(135deg, #ffe66d, ${selectedVehicle.paint.neon})` }}
            >
              {selectedStatus.owned
                ? 'Veículo na frota'
                : selectedStatus.locked
                ? `Libera no nv. ${selectedVehicle.unlockBarracoLevel}`
                : selectedStatus.affordable
                ? 'Comprar máquina'
                : 'Limpo insuficiente'}
            </button>
          </aside>
        </section>

        <section className="relative mt-8 rounded-[34px] border border-white/10 bg-black/38 p-5 backdrop-blur-xl md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-white/42">Frota ativa</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.12em] text-white">Máquinas adquiridas</h2>
            </div>
            <p className="text-sm text-white/58">Cada veículo comprado mantém uma fonte permanente em gang.statSources.</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {FUGA_VEHICLES.map((vehicle) => {
              const owned = isFugaVehicleOwned(player, vehicle.id);
              return (
                <div key={vehicle.id} className={`rounded-2xl border p-3 ${owned ? 'border-emerald-300/25 bg-emerald-400/[0.08]' : 'border-white/10 bg-white/[0.035]'}`}>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-white">{vehicle.name}</p>
                  <p className={`mt-1 text-[10px] font-black uppercase tracking-[0.22em] ${owned ? 'text-emerald-200' : 'text-white/35'}`}>
                    {owned ? 'Na frota' : `Nv. ${vehicle.unlockBarracoLevel}`}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {purchaseVehicle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/82 px-4 backdrop-blur-sm"
            onClick={() => setPurchaseVehicle(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 18, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.92, y: 18, filter: 'blur(8px)' }}
              transition={{ duration: 0.32 }}
              onClick={(event) => event.stopPropagation()}
              className="grid w-full max-w-[1040px] grid-cols-1 gap-6 overflow-hidden rounded-[36px] border border-white/12 bg-[#07080c] p-5 shadow-[0_24px_100px_rgba(0,0,0,.72)] md:grid-cols-[1.08fr_.92fr] md:p-7"
            >
              <div className="min-h-[340px]">
                <VehicleIllustration vehicle={purchaseVehicle} active />
              </div>

              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-yellow-100/55">Contrato da garagem</p>
                <h2 className="mt-3 text-4xl font-black uppercase tracking-[0.12em] text-white">{purchaseVehicle.name}</h2>
                <p className="mt-4 text-sm leading-7 text-white/62">{purchaseVehicle.lore}</p>

                <div className="mt-5 grid grid-cols-1 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/40">Pagamento</p>
                    <p className="mt-2 text-2xl font-black text-white">{formatFugaMoney(purchaseVehicle.priceCleanMoney)} Commands Limpo</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/40">Fonte permanente</p>
                    <p className="mt-2 text-lg font-black text-yellow-100">
                      +{purchaseVehicle.bonusPercent}% {getFugaStatLabel(purchaseVehicle.targetStat)} em {getFugaMemberLabel(purchaseVehicle.targetType)}
                    </p>
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-1 gap-3 pt-5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void handleBuy(purchaseVehicle)}
                    disabled={loadingVehicleId === purchaseVehicle.id}
                    className="rounded-2xl px-5 py-4 text-sm font-black uppercase tracking-[0.22em] text-black transition active:scale-[.98] disabled:opacity-55"
                    style={{ background: `linear-gradient(135deg, #ffe66d, ${purchaseVehicle.paint.neon})` }}
                  >
                    {loadingVehicleId === purchaseVehicle.id ? 'Fechando contrato...' : 'Confirmar compra'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchaseVehicle(null)}
                    className="rounded-2xl border border-white/12 bg-white/[0.055] px-5 py-4 text-sm font-black uppercase tracking-[0.22em] text-white transition hover:bg-white/[0.09] active:scale-[.98]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
