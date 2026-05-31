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
  isFugaVehicleOwned,
} from '@/data/fugaGarage';

const GARAGE_BG = `
  radial-gradient(circle at 16% 8%, rgba(255, 41, 82, 0.34), transparent 30%),
  radial-gradient(circle at 84% 7%, rgba(34, 180, 255, 0.25), transparent 28%),
  radial-gradient(circle at 48% 42%, rgba(255, 205, 92, 0.10), transparent 30%),
  linear-gradient(180deg, #050509 0%, #13080e 34%, #050509 100%)
`;

const MEMBER_TONE: Record<string, string> = {
  frente: '#ff4646',
  muralha: '#58ffd6',
  assassino: '#ff4fd8',
  certeiro: '#4fd6ff',
  capanga: '#ffb84d',
  executor: '#c8d2ff',
  motorista: '#8dffcb',
  nitro: '#ffe66d',
};

function getFugaItemId(vehicleId: string) {
  return `fuga:${vehicleId}`;
}

function memberTone(vehicle: FugaVehicle) {
  return MEMBER_TONE[vehicle.targetType] || vehicle.paint.neon;
}

function getVehicleStatus(player: any, vehicle: FugaVehicle, cleanMoney: number, barracoLevel: number) {
  const owned = isFugaVehicleOwned(player, vehicle.id);
  const unlocked = barracoLevel >= vehicle.unlockBarracoLevel;
  const affordable = cleanMoney >= vehicle.priceCleanMoney;
  return { owned, unlocked, affordable, locked: !unlocked };
}

function VehicleRender({ vehicle, mode = 'stage' }: { vehicle: FugaVehicle; mode?: 'stage' | 'card' | 'badge' }) {
  const gid = `garage-${vehicle.id}-${mode}`;
  const tone = memberTone(vehicle);
  const neon = vehicle.paint.neon;
  const body = vehicle.paint.body;
  const body2 = vehicle.paint.body2;
  const glass = vehicle.paint.glass;
  const isBike = vehicle.kind === 'moto';
  const scale = mode === 'badge' ? 0.78 : 1;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-[#05060a]">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 50% 42%, ${neon}4f, transparent 31%),
            radial-gradient(circle at 18% 18%, ${tone}45, transparent 28%),
            linear-gradient(150deg, ${body2}70 0%, #070910 43%, #020204 100%)
          `,
        }}
      />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:26px_26px]" />
      <div className="absolute inset-x-0 bottom-0 h-[40%] bg-[linear-gradient(180deg,transparent,rgba(0,0,0,.88))]" />
      <div
        className="absolute bottom-[-10%] left-1/2 h-[42%] w-[86%] -translate-x-1/2 rounded-[50%] opacity-70 blur-2xl"
        style={{ background: `radial-gradient(circle, ${neon}6f, transparent 62%)` }}
      />

      <svg viewBox="0 0 860 470" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={`${gid}-body`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={body2} />
            <stop offset="48%" stopColor={body} />
            <stop offset="100%" stopColor={neon} stopOpacity="0.72" />
          </linearGradient>
          <linearGradient id={`${gid}-glass`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.86" />
            <stop offset="100%" stopColor={glass} stopOpacity="0.72" />
          </linearGradient>
          <filter id={`${gid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .72 0" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g opacity="0.78">
          <path d="M80 372 C230 318 610 318 790 372" stroke={neon} strokeOpacity="0.34" strokeWidth="4" fill="none" />
          <path d="M120 410 C275 356 600 354 750 410" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="2" fill="none" />
          <ellipse cx="430" cy="380" rx="300" ry="42" fill="rgba(0,0,0,.54)" />
        </g>

        <g transform={`translate(0 ${isBike ? 18 : 0}) scale(${scale})`} filter={`url(#${gid}-glow)`}>
          {isBike ? (
            <>
              <path d="M228 286 C285 208 378 190 472 229 C535 255 590 306 655 327" fill="none" stroke={`url(#${gid}-body)`} strokeWidth="34" strokeLinecap="round" />
              <path d="M340 230 L423 150 L491 224" fill="none" stroke={body2} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M476 170 L598 126" stroke={neon} strokeWidth="14" strokeLinecap="round" />
              <path d="M276 300 L190 360 M560 302 L690 360" stroke={tone} strokeWidth="13" strokeLinecap="round" />
              <circle cx="185" cy="360" r="54" fill="#050505" stroke={neon} strokeWidth="8" />
              <circle cx="692" cy="360" r="54" fill="#050505" stroke={neon} strokeWidth="8" />
              <circle cx="185" cy="360" r="25" fill={vehicle.paint.rim} />
              <circle cx="692" cy="360" r="25" fill={vehicle.paint.rim} />
              <ellipse cx="536" cy="128" rx="35" ry="27" fill={`url(#${gid}-glass)`} />
              <path d="M692 340 L830 300 L830 390 L692 368 Z" fill={neon} opacity="0.18" />
            </>
          ) : (
            <>
              <path d="M118 315 C170 246 245 235 332 232 L425 160 C505 166 575 210 650 262 C722 273 777 291 815 322 L775 360 L139 360 Z" fill={`url(#${gid}-body)`} stroke={neon} strokeWidth="6" />
              <path d="M330 229 L425 162 C488 166 545 198 596 260 L298 265 Z" fill={`url(#${gid}-glass)`} opacity="0.86" />
              <path d="M425 162 L415 265 M546 206 L492 265" stroke="rgba(0,0,0,.48)" strokeWidth="6" />
              <path d="M148 318 C270 284 620 286 796 321" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="8" fill="none" />
              <path d="M690 302 L842 250 L842 366 L690 334 Z" fill={neon} opacity="0.16" />
              <ellipse cx="790" cy="300" rx="38" ry="12" fill="#fff3b0" opacity="0.92" />
              <ellipse cx="148" cy="304" rx="32" ry="11" fill="#ff4444" opacity="0.68" />
              <circle cx="260" cy="360" r="59" fill="#050505" stroke={neon} strokeWidth="8" />
              <circle cx="666" cy="360" r="59" fill="#050505" stroke={neon} strokeWidth="8" />
              <circle cx="260" cy="360" r="28" fill={vehicle.paint.rim} />
              <circle cx="666" cy="360" r="28" fill={vehicle.paint.rim} />
              <circle cx="260" cy="360" r="9" fill="#111" />
              <circle cx="666" cy="360" r="9" fill="#111" />
            </>
          )}
        </g>

        <g opacity="0.42">
          <path d="M-60 168 H190" stroke={neon} strokeWidth="3" />
          <path d="M670 132 H930" stroke={tone} strokeWidth="3" />
          <path d="M-30 218 H116" stroke="#fff" strokeOpacity="0.28" strokeWidth="2" />
        </g>
      </svg>

      <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/42 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/70">
        {vehicle.codename}
      </div>
      <div className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.20em] text-white/72">
        {vehicle.role}
      </div>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-2xl">
      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/42">{label}</p>
      <p className="mt-2 text-lg font-black text-white" style={{ color: accent || undefined }}>{value}</p>
    </div>
  );
}

function ProgressRail({ ownedCount }: { ownedCount: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {FUGA_VEHICLES.map((vehicle, index) => (
        <div
          key={vehicle.id}
          className={`h-2 flex-1 rounded-full ${index < ownedCount ? 'bg-yellow-200' : 'bg-white/12'}`}
          style={{ boxShadow: index < ownedCount ? '0 0 14px rgba(255,232,125,.5)' : undefined }}
        />
      ))}
    </div>
  );
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
  const selectedVehicle = getFugaVehicleById(selectedVehicleId) || FUGA_VEHICLES[0];
  const selectedStatus = getVehicleStatus(player, selectedVehicle, cleanMoney, barracoLevel);
  const nextLockedVehicle = FUGA_VEHICLES.find((vehicle) => barracoLevel < vehicle.unlockBarracoLevel);
  const selectedTone = memberTone(selectedVehicle);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4200);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const firstAvailable = FUGA_VEHICLES.find((vehicle) => {
      const status = getVehicleStatus(player, vehicle, cleanMoney, barracoLevel);
      return status.unlocked && !status.owned;
    });
    const fallback = ownedVehicles[ownedVehicles.length - 1] || FUGA_VEHICLES[0];
    setSelectedVehicleId((firstAvailable || fallback).id);
  }, [barracoLevel, cleanMoney, ownedVehicles.length, player]);

  async function handleBuy(vehicle: FugaVehicle) {
    const status = getVehicleStatus(player, vehicle, cleanMoney, barracoLevel);

    if (status.owned) return setMessage({ type: 'error', text: 'Esse veículo já está na sua frota.' });
    if (status.locked) return setMessage({ type: 'error', text: `Libera no barraco nível ${vehicle.unlockBarracoLevel}.` });
    if (!status.affordable) return setMessage({ type: 'error', text: 'Dinheiro limpo insuficiente para fechar esse contrato.' });

    try {
      setLoadingVehicleId(vehicle.id);
      const response = await buyFugaVehicle({ vehicleId: vehicle.id });
      hydratePlayerFromServer(response.player);
      setPurchaseVehicle(null);
      setMessage({
        type: 'ok',
        text: `${vehicle.name} entrou na frota. +${vehicle.bonusPercent}% ${getFugaStatLabel(vehicle.targetStat)} em ${getFugaMemberLabel(vehicle.targetType)}.`,
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

  return (
    <div className="min-h-screen overflow-hidden text-white" style={{ background: GARAGE_BG }}>
      <Header />

      <main className="relative mx-auto max-w-[122rem] px-3 pb-24 pt-[118px] sm:px-5 md:px-8 md:pt-[145px]">
        <div className="pointer-events-none fixed inset-0 opacity-50">
          <div className="absolute left-[-18%] top-[14%] h-[520px] w-[520px] rounded-full bg-red-600/20 blur-[120px]" />
          <div className="absolute right-[-20%] top-[18%] h-[560px] w-[560px] rounded-full bg-cyan-400/16 blur-[130px]" />
          <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[linear-gradient(180deg,transparent,rgba(0,0,0,.72))]" />
        </div>

        <section className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-black/42 shadow-[0_28px_110px_rgba(0,0,0,.72)] backdrop-blur-2xl">
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background: `
                radial-gradient(circle at 72% 34%, ${selectedVehicle.paint.neon}33, transparent 31%),
                radial-gradient(circle at 22% 22%, ${selectedTone}2e, transparent 28%),
                linear-gradient(180deg, rgba(255,255,255,.075), transparent 44%, rgba(0,0,0,.74))
              `,
            }}
          />
          <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:100%_9px]" />

          <div className="relative grid grid-cols-1 gap-0 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
            <div className="p-5 md:p-8 xl:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-200/18 bg-yellow-200/[0.07] px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-yellow-100/78">
                <span className="h-2 w-2 rounded-full bg-yellow-200 shadow-[0_0_14px_rgba(255,232,125,.8)]" />
                Garagem clandestina
              </div>

              <h1 className="mt-5 text-[2.85rem] font-black uppercase leading-[0.88] tracking-[0.07em] text-white sm:text-6xl lg:text-7xl">
                Fuga
                <span className="block text-white/55">em Alto Risco</span>
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-white/67 md:text-base">
                Escolha máquinas de escape com identidade própria. Cada contrato usa Commands Limpo e vira uma estatística permanente para um tipo da gangue.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
                <StatTile label="Limpo" value={formatFugaMoney(cleanMoney)} />
                <StatTile label="Frota" value={`${ownedVehicles.length}/8`} />
                <StatTile label="Barraco" value={`Nv. ${barracoLevel}`} />
                <StatTile label="Bônus" value={`+${ownedVehicles.length}%`} accent="#ffe66d" />
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/26 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/42">Progresso da frota</p>
                  <p className="text-xs font-black text-yellow-100">{ownedVehicles.length}/8</p>
                </div>
                <div className="mt-3"><ProgressRail ownedCount={ownedVehicles.length} /></div>
                {nextLockedVehicle && (
                  <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/52">
                    Próxima liberação: <span className="text-yellow-100">{nextLockedVehicle.name}</span> no barraco nv. {nextLockedVehicle.unlockBarracoLevel}
                  </p>
                )}
              </div>
            </div>

            <div className="relative min-h-[430px] p-4 md:p-7 xl:min-h-[620px]">
              <div className="absolute left-8 top-8 z-10 rounded-full border border-white/10 bg-black/42 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/70">
                Contrato selecionado
              </div>
              <VehicleRender vehicle={selectedVehicle} mode="stage" />
              <div className="absolute inset-x-6 bottom-6 rounded-[2rem] border border-white/10 bg-black/58 p-4 backdrop-blur-xl md:inset-x-8 md:bottom-8 md:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.30em] text-white/42">{selectedVehicle.codename}</p>
                    <h2 className="mt-1 text-3xl font-black uppercase tracking-[0.11em] text-white md:text-4xl">{selectedVehicle.name}</h2>
                    <p className="mt-2 max-w-2xl text-sm text-white/62">{selectedVehicle.headline}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPurchaseVehicle(selectedVehicle)}
                    disabled={selectedStatus.owned || selectedStatus.locked || !selectedStatus.affordable || loadingVehicleId === selectedVehicle.id}
                    className="rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-[0.22em] text-black shadow-[0_18px_46px_rgba(0,0,0,.45)] transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45"
                    style={{ background: selectedStatus.owned ? '#323232' : `linear-gradient(135deg, #fff2a8, ${selectedVehicle.paint.neon})` }}
                  >
                    {selectedStatus.owned
                      ? 'Na frota'
                      : selectedStatus.locked
                      ? `Libera nv. ${selectedVehicle.unlockBarracoLevel}`
                      : selectedStatus.affordable
                      ? 'Fechar contrato'
                      : 'Sem limpo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`relative z-10 mx-auto mt-5 max-w-5xl rounded-2xl border px-5 py-4 text-center text-xs font-black uppercase tracking-[0.16em] shadow-[0_18px_50px_rgba(0,0,0,.45)] ${
                message.type === 'ok'
                  ? 'border-emerald-300/30 bg-emerald-500/14 text-emerald-100'
                  : 'border-red-300/30 bg-red-500/14 text-red-100'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <section className="relative mt-7 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_410px]">
          <div className="rounded-[2.1rem] border border-white/10 bg-black/34 p-4 shadow-[0_24px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl md:p-5">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-white/40">Seleção de máquinas</p>
                <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.11em] text-white">Contratos disponíveis</h2>
              </div>
              <p className="max-w-lg text-sm text-white/52">A arte principal muda conforme o contrato selecionado. A lista abaixo é o painel tático da garagem.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
              {FUGA_VEHICLES.map((vehicle, index) => {
                const status = getVehicleStatus(player, vehicle, cleanMoney, barracoLevel);
                const selected = selectedVehicle.id === vehicle.id;
                const tone = memberTone(vehicle);
                const isLoading = loadingVehicleId === vehicle.id;

                return (
                  <motion.article
                    key={vehicle.id}
                    initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.45, delay: index * 0.035 }}
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                    className={`group grid cursor-pointer grid-cols-1 gap-4 overflow-hidden rounded-[1.8rem] border p-3 transition duration-300 sm:grid-cols-[190px_minmax(0,1fr)] ${
                      selected ? 'border-yellow-200/42 bg-white/[0.075]' : 'border-white/10 bg-white/[0.04] hover:border-white/24 hover:bg-white/[0.065]'
                    } ${status.locked ? 'opacity-55' : ''}`}
                    style={{ boxShadow: selected ? `0 0 34px ${tone}24` : undefined }}
                  >
                    <div className="h-[170px] sm:h-full sm:min-h-[190px]">
                      <VehicleRender vehicle={vehicle} mode="card" />
                    </div>

                    <div className="flex min-h-[210px] flex-col p-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.26em] text-white/38">{vehicle.codename} · {vehicle.role}</p>
                          <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.11em] text-white">{vehicle.name}</h3>
                        </div>
                        <span className="rounded-full border border-white/10 bg-black/42 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/65">
                          Nv. {vehicle.unlockBarracoLevel}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-white/60">{vehicle.headline}</p>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/38">Bônus</p>
                          <p className="mt-2 text-sm font-black text-yellow-100">
                            +{vehicle.bonusPercent}% {getFugaStatLabel(vehicle.targetStat)} em {getFugaMemberLabel(vehicle.targetType)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/38">Valor</p>
                          <p className="mt-2 text-base font-black text-white">{formatFugaMoney(vehicle.priceCleanMoney)}</p>
                        </div>
                      </div>

                      <div className="mt-auto grid grid-cols-1 gap-2 pt-4 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedVehicleId(vehicle.id);
                            setPurchaseVehicle(vehicle);
                          }}
                          disabled={status.owned || status.locked || !status.affordable || isLoading}
                          className="rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-black transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45"
                          style={{ background: status.owned ? '#2e2e2e' : `linear-gradient(135deg, #fff0a1, ${tone})` }}
                        >
                          {isLoading ? 'Comprando...' : status.owned ? 'Na frota' : status.locked ? 'Bloqueado' : status.affordable ? 'Comprar' : 'Sem limpo'}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedVehicleId(vehicle.id);
                          }}
                          className="rounded-2xl border border-white/12 bg-white/[0.055] px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white/82 transition hover:bg-white/[0.09] active:scale-[.98]"
                        >
                          Inspecionar
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>

          <aside className="h-fit rounded-[2.1rem] border border-white/10 bg-black/46 p-5 shadow-[0_24px_80px_rgba(0,0,0,.52)] backdrop-blur-2xl xl:sticky xl:top-[130px]">
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-yellow-100/58">Dossiê da fuga</p>
            <h3 className="mt-3 text-3xl font-black uppercase tracking-[0.11em] text-white">{selectedVehicle.name}</h3>
            <p className="mt-3 text-sm leading-7 text-white/64">{selectedVehicle.lore}</p>

            <div className="mt-5 h-[260px]">
              <VehicleRender vehicle={selectedVehicle} mode="badge" />
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/40">Nota da oficina</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{selectedVehicle.mechanicNote}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatTile label="Preço" value={formatFugaMoney(selectedVehicle.priceCleanMoney)} />
                <StatTile label="Libera" value={`Nv. ${selectedVehicle.unlockBarracoLevel}`} />
              </div>
              <div className="rounded-2xl border border-yellow-200/14 bg-yellow-200/[0.06] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-yellow-100/50">Fonte permanente</p>
                <p className="mt-2 text-base font-black text-yellow-100">
                  +{selectedVehicle.bonusPercent}% {getFugaStatLabel(selectedVehicle.targetStat)} em {getFugaMemberLabel(selectedVehicle.targetType)}
                </p>
                <p className="mt-2 text-xs text-white/48">Salvo como item da frota e fonte em gang.statSources.</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="relative mt-7 rounded-[2.1rem] border border-white/10 bg-black/36 p-5 backdrop-blur-2xl md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-white/40">Frota ativa</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.11em] text-white">Máquinas adquiridas</h2>
            </div>
            <p className="max-w-xl text-sm text-white/55">A frota aqui não é acessório visual: cada aquisição alimenta uma estatística de combate.</p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FUGA_VEHICLES.map((vehicle) => {
              const owned = isFugaVehicleOwned(player, vehicle.id);
              const tone = memberTone(vehicle);
              return (
                <button
                  type="button"
                  key={vehicle.id}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                  className={`rounded-2xl border p-4 text-left transition active:scale-[.99] ${owned ? 'border-emerald-300/25 bg-emerald-400/[0.08]' : 'border-white/10 bg-white/[0.035] hover:bg-white/[0.055]'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-white">{vehicle.name}</p>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: owned ? '#7dffb2' : tone, opacity: owned ? 1 : 0.5 }} />
                  </div>
                  <p className={`mt-2 text-[10px] font-black uppercase tracking-[0.20em] ${owned ? 'text-emerald-200' : 'text-white/35'}`}>
                    {owned ? 'Na frota' : `Libera nv. ${vehicle.unlockBarracoLevel}`}
                  </p>
                </button>
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
            className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/86 px-4 backdrop-blur-sm"
            onClick={() => setPurchaseVehicle(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 18, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.92, y: 18, filter: 'blur(8px)' }}
              transition={{ duration: 0.32 }}
              onClick={(event) => event.stopPropagation()}
              className="grid w-full max-w-[1080px] grid-cols-1 gap-6 overflow-hidden rounded-[2.2rem] border border-white/12 bg-[#06070b] p-5 shadow-[0_26px_120px_rgba(0,0,0,.78)] md:grid-cols-[1.08fr_.92fr] md:p-7"
            >
              <div className="min-h-[360px]">
                <VehicleRender vehicle={purchaseVehicle} mode="stage" />
              </div>

              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-yellow-100/55">Contrato clandestino</p>
                <h2 className="mt-3 text-4xl font-black uppercase tracking-[0.11em] text-white">{purchaseVehicle.name}</h2>
                <p className="mt-4 text-sm leading-7 text-white/62">{purchaseVehicle.lore}</p>

                <div className="mt-5 grid grid-cols-1 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/40">Pagamento</p>
                    <p className="mt-2 text-2xl font-black text-white">{formatFugaMoney(purchaseVehicle.priceCleanMoney)} Commands Limpo</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/40">Estatística permanente</p>
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
                    style={{ background: `linear-gradient(135deg, #fff0a1, ${memberTone(purchaseVehicle)})` }}
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
