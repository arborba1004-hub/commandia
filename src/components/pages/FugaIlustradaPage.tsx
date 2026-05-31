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

const PAGE_BG = `
  radial-gradient(circle at 15% 10%, rgba(255, 47, 76, 0.22), transparent 26%),
  radial-gradient(circle at 86% 7%, rgba(51, 220, 255, 0.18), transparent 28%),
  radial-gradient(circle at 50% 75%, rgba(255, 194, 72, 0.09), transparent 34%),
  linear-gradient(180deg, #050507 0%, #13080f 42%, #030405 100%)
`;

type MessageState = { type: 'success' | 'error'; text: string } | null;

function getVehicleStatus(player: any, vehicle: FugaVehicle, cleanMoney: number, barracoLevel: number) {
  const owned = isFugaVehicleOwned(player, vehicle.id);
  const unlocked = barracoLevel >= vehicle.unlockBarracoLevel;
  const affordable = cleanMoney >= vehicle.priceCleanMoney;

  return { owned, unlocked, affordable, canBuy: !owned && unlocked && affordable };
}

function getStatusLabel(player: any, vehicle: FugaVehicle, cleanMoney: number, barracoLevel: number) {
  const status = getVehicleStatus(player, vehicle, cleanMoney, barracoLevel);
  if (status.owned) return 'Na frota';
  if (!status.unlocked) return `Libera no barraco ${vehicle.unlockBarracoLevel}`;
  if (!status.affordable) return 'Saldo insuficiente';
  return 'Assinar contrato';
}

function VehicleAsset({ vehicle, className = '' }: { vehicle: FugaVehicle; className?: string }) {
  return (
    <img
      src={vehicle.image}
      alt={vehicle.name}
      draggable={false}
      className={`select-none object-contain drop-shadow-[0_24px_46px_rgba(0,0,0,0.72)] ${className}`}
    />
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 backdrop-blur-md">
      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/42">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function TierBadge({ tier }: { tier: FugaVehicle['tier'] }) {
  const label: Record<FugaVehicle['tier'], string> = {
    rua: 'Rua',
    blindado: 'Blindado',
    elite: 'Elite',
    phantom: 'Phantom',
  };

  return (
    <span className="rounded-full border border-white/12 bg-black/42 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/70">
      {label[tier]}
    </span>
  );
}

export default function FugaIlustradaPage() {
  const player = usePlayerStore((state) => state.player);
  const isLoaded = usePlayerStore((state) => state.isLoaded);
  const loadPlayer = usePlayerStore((state) => state.loadPlayer);
  const hydratePlayerFromServer = usePlayerStore((state) => state.hydratePlayerFromServer);

  const cleanMoney = Number(player?.balances?.cleanMoney || 0);
  const barracoLevel = Math.max(1, Math.floor(Number(player?.niveis?.barracoLevel || 1)));
  const ownedVehicles = useMemo(() => getOwnedFugaVehicles(player), [player]);

  const firstAvailableId = useMemo(() => {
    const notOwnedUnlocked = FUGA_VEHICLES.find((vehicle) => {
      const status = getVehicleStatus(player, vehicle, cleanMoney, barracoLevel);
      return status.unlocked && !status.owned;
    });

    return notOwnedUnlocked?.id || ownedVehicles[0]?.id || FUGA_VEHICLES[0].id;
  }, [player, cleanMoney, barracoLevel, ownedVehicles]);

  const [selectedVehicleId, setSelectedVehicleId] = useState(firstAvailableId);
  const [purchaseVehicle, setPurchaseVehicle] = useState<FugaVehicle | null>(null);
  const [loadingVehicleId, setLoadingVehicleId] = useState<string | null>(null);
  const [message, setMessage] = useState<MessageState>(null);

  useEffect(() => {
    if (!isLoaded) void loadPlayer();
  }, [isLoaded, loadPlayer]);

  useEffect(() => {
    setSelectedVehicleId((current) => getFugaVehicleById(current)?.id || firstAvailableId);
  }, [firstAvailableId]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 3800);
    return () => window.clearTimeout(timer);
  }, [message]);

  const selectedVehicle = getFugaVehicleById(selectedVehicleId) || FUGA_VEHICLES[0];
  const selectedStatus = getVehicleStatus(player, selectedVehicle, cleanMoney, barracoLevel);
  const nextLockedVehicle = FUGA_VEHICLES.find((vehicle) => barracoLevel < vehicle.unlockBarracoLevel);

  async function handleBuy(vehicle: FugaVehicle) {
    const status = getVehicleStatus(player, vehicle, cleanMoney, barracoLevel);

    if (status.owned) {
      setMessage({ type: 'error', text: `${vehicle.name} já está na sua frota.` });
      return;
    }

    if (!status.unlocked) {
      setMessage({ type: 'error', text: `${vehicle.name} libera no barraco nível ${vehicle.unlockBarracoLevel}.` });
      return;
    }

    if (!status.affordable) {
      setMessage({ type: 'error', text: 'Commands Limpo insuficiente para fechar o contrato.' });
      return;
    }

    try {
      setLoadingVehicleId(vehicle.id);
      const response = await buyFugaVehicle({ vehicleId: vehicle.id });
      if (response?.player) hydratePlayerFromServer(response.player);
      setPurchaseVehicle(null);
      setMessage({
        type: 'success',
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
        <main className="min-h-screen pt-[140px] md:pt-[160px] flex items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: PAGE_BG }}>
      <Header />

      <main className="relative mx-auto max-w-[1500px] px-4 pb-20 pt-[125px] md:px-8 md:pt-[150px]">
        <div className="pointer-events-none fixed inset-0 opacity-45 mix-blend-screen" style={{ background: `radial-gradient(circle at 20% 0%, ${selectedVehicle.accent}55, transparent 32%), radial-gradient(circle at 80% 20%, ${selectedVehicle.accent2}38, transparent 30%)` }} />

        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-black/45 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.60)] backdrop-blur-xl md:p-8">
          <div className="absolute inset-0 opacity-50" style={{ background: `radial-gradient(circle at 72% 30%, ${selectedVehicle.accent}33, transparent 38%), linear-gradient(135deg, rgba(255,255,255,0.08), transparent 46%)` }} />

          <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div
              key={selectedVehicle.id}
              initial={{ opacity: 0, x: -30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.55 }}
              className="min-w-0"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.42em] text-white/52">Garagem clandestina</p>
              <h1 className="mt-3 text-5xl font-black uppercase leading-[0.92] tracking-[0.10em] text-white md:text-7xl">
                Fuga<br />Ilustrada
              </h1>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-white/68 md:text-base">
                Contratos de máquinas especiais para rotas de escape. Cada veículo comprado com Commands Limpo vira fonte permanente de estatística para um membro da gangue.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
                <MiniStat label="Limpo" value={formatFugaMoney(cleanMoney)} />
                <MiniStat label="Frota" value={`${ownedVehicles.length}/${FUGA_VEHICLES.length}`} />
                <MiniStat label="Barraco" value={`Nv. ${barracoLevel}`} />
                <MiniStat label="Bônus" value={`+${ownedVehicles.length}%`} />
              </div>

              {nextLockedVehicle && (
                <div className="mt-4 rounded-2xl border border-white/14 bg-black/35 px-4 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/62">
                  Próxima liberação: <span className="text-white">{nextLockedVehicle.name}</span> no barraco Nv. {nextLockedVehicle.unlockBarracoLevel}
                </div>
              )}
            </motion.div>

            <motion.div
              key={`${selectedVehicle.id}-hero`}
              initial={{ opacity: 0, scale: 0.94, y: 18, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="relative min-h-[340px] overflow-hidden rounded-[30px] border border-white/10 bg-black/48"
              style={{ boxShadow: `0 0 55px ${selectedVehicle.accent}22` }}
            >
              <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 55% 40%, ${selectedVehicle.accent}33, transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.72))` }} />
              <div className="absolute left-5 top-5 flex items-center gap-3">
                <TierBadge tier={selectedVehicle.tier} />
                <span className="rounded-full bg-black/45 px-3 py-1 text-[9px] font-black uppercase tracking-[0.26em] text-white/58">{selectedVehicle.codename}</span>
              </div>
              <VehicleAsset vehicle={selectedVehicle} className="relative z-10 h-[340px] w-full p-2" />
            </motion.div>
          </div>
        </section>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`relative z-20 mt-5 rounded-2xl border px-5 py-4 text-sm font-bold ${
                message.type === 'success'
                  ? 'border-emerald-400/25 bg-emerald-500/12 text-emerald-100'
                  : 'border-red-400/25 bg-red-500/12 text-red-100'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <section className="relative mt-8 grid grid-cols-1 gap-7 xl:grid-cols-[1fr_420px]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {FUGA_VEHICLES.map((vehicle, index) => {
              const status = getVehicleStatus(player, vehicle, cleanMoney, barracoLevel);
              const selected = selectedVehicle.id === vehicle.id;
              const isLoading = loadingVehicleId === vehicle.id;

              return (
                <motion.article
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: index * 0.04 }}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                  className={`group relative cursor-pointer overflow-hidden rounded-[30px] border p-4 backdrop-blur-xl transition-all duration-300 ${
                    selected ? 'border-white/35 bg-white/[0.085]' : 'border-white/10 bg-white/[0.045] hover:border-white/24 hover:bg-white/[0.07]'
                  }`}
                  style={{ boxShadow: selected ? `0 0 38px ${vehicle.accent}26` : undefined }}
                >
                  <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 24% 8%, ${vehicle.accent}40, transparent 34%), radial-gradient(circle at 88% 20%, ${vehicle.accent2}20, transparent 34%)` }} />

                  <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-black/48">
                    <div className="absolute left-4 top-4 z-20 rounded-full bg-black/48 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/64">{vehicle.codename}</div>
                    <div className="absolute right-4 top-4 z-20 rounded-full bg-black/48 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/64">Nv. {vehicle.unlockBarracoLevel}</div>
                    <VehicleAsset vehicle={vehicle} className="relative z-10 h-[230px] w-full transition-transform duration-500 group-hover:scale-[1.04]" />
                  </div>

                  <div className="relative mt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.36em] text-white/38">Veículo de fuga</p>
                        <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-white">{vehicle.name}</h2>
                      </div>
                      <TierBadge tier={vehicle.tier} />
                    </div>

                    <p className="mt-4 text-sm leading-6 text-white/62">{vehicle.headline}</p>

                    <div className="mt-5 grid grid-cols-1 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-black/28 p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/38">Bônus permanente</p>
                        <p className="mt-2 text-base font-black" style={{ color: vehicle.danger }}>
                          +{vehicle.bonusPercent}% {getFugaStatLabel(vehicle.targetStat)} em {getFugaMemberLabel(vehicle.targetType)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/28 p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/38">Valor</p>
                        <p className="mt-2 text-lg font-black text-white">{formatFugaMoney(vehicle.priceCleanMoney)} Commands Limpo</p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          if (status.canBuy) setPurchaseVehicle(vehicle);
                          else setMessage({ type: 'error', text: getStatusLabel(player, vehicle, cleanMoney, barracoLevel) });
                        }}
                        disabled={isLoading || status.owned || !status.unlocked || !status.affordable}
                        className={`rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-[0.26em] transition-all ${
                          status.canBuy
                            ? 'bg-yellow-300 text-black hover:bg-white active:scale-[0.98]'
                            : 'bg-white/10 text-white/35 cursor-not-allowed'
                        }`}
                      >
                        {isLoading ? 'Processando...' : getStatusLabel(player, vehicle, cleanMoney, barracoLevel)}
                      </button>

                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedVehicleId(vehicle.id);
                        }}
                        className="rounded-2xl border border-white/18 bg-black/35 px-5 py-4 text-[11px] font-black uppercase tracking-[0.26em] text-white transition hover:bg-white/10"
                      >
                        Dossiê
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <aside className="xl:sticky xl:top-[150px] xl:self-start">
            <motion.div
              key={`${selectedVehicle.id}-panel`}
              initial={{ opacity: 0, x: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.45 }}
              className="overflow-hidden rounded-[32px] border border-white/12 bg-black/58 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
            >
              <div className="rounded-[26px] border border-white/10 bg-white/[0.045] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/62">Dossiê</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.24em]" style={{ color: selectedVehicle.danger }}>{selectedVehicle.codename}</span>
                </div>

                <h3 className="mt-4 text-3xl font-black uppercase tracking-[0.12em] text-white">{selectedVehicle.name}</h3>
                <p className="mt-3 text-sm leading-7 text-white/64">{selectedVehicle.lore}</p>

                <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/45">
                  <VehicleAsset vehicle={selectedVehicle} className="h-[230px] w-full p-2" />
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-black/28 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/38">Nota do mecânico</p>
                    <p className="mt-2 text-sm leading-6 text-white/65">{selectedVehicle.mechanicNote}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/28 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/38">Contrato</p>
                    <p className="mt-2 text-xl font-black text-white">{formatFugaMoney(selectedVehicle.priceCleanMoney)} Commands Limpo</p>
                    <p className="mt-2 text-sm font-bold" style={{ color: selectedVehicle.danger }}>
                      +{selectedVehicle.bonusPercent}% {getFugaStatLabel(selectedVehicle.targetStat)} em {getFugaMemberLabel(selectedVehicle.targetType)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => selectedStatus.canBuy ? setPurchaseVehicle(selectedVehicle) : setMessage({ type: 'error', text: getStatusLabel(player, selectedVehicle, cleanMoney, barracoLevel) })}
                  disabled={loadingVehicleId === selectedVehicle.id || selectedStatus.owned || !selectedStatus.unlocked || !selectedStatus.affordable}
                  className={`mt-5 w-full rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-[0.28em] transition-all ${
                    selectedStatus.canBuy
                      ? 'bg-yellow-300 text-black hover:bg-white active:scale-[0.98]'
                      : 'bg-white/10 text-white/35 cursor-not-allowed'
                  }`}
                >
                  {loadingVehicleId === selectedVehicle.id ? 'Processando...' : getStatusLabel(player, selectedVehicle, cleanMoney, barracoLevel)}
                </button>
              </div>
            </motion.div>
          </aside>
        </section>
      </main>

      <AnimatePresence>
        {purchaseVehicle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/82 px-4 backdrop-blur-sm"
            onClick={() => setPurchaseVehicle(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.94, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 20, scale: 0.96, filter: 'blur(8px)' }}
              transition={{ duration: 0.35 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-[980px] overflow-hidden rounded-[34px] border border-white/12 bg-[#09090d] shadow-[0_30px_110px_rgba(0,0,0,0.75)]"
            >
              <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative min-h-[330px] overflow-hidden bg-black">
                  <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 48% 40%, ${purchaseVehicle.accent}44, transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.07), rgba(0,0,0,0.76))` }} />
                  <VehicleAsset vehicle={purchaseVehicle} className="relative z-10 h-[360px] w-full p-3" />
                </div>

                <div className="p-6 md:p-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.34em] text-white/42">Contrato de fuga</p>
                  <h2 className="mt-3 text-3xl font-black uppercase tracking-[0.12em] text-white md:text-4xl">{purchaseVehicle.name}</h2>
                  <p className="mt-4 text-sm leading-7 text-white/64">{purchaseVehicle.lore}</p>

                  <div className="mt-6 grid grid-cols-1 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/38">Valor</p>
                      <p className="mt-2 text-2xl font-black text-white">{formatFugaMoney(purchaseVehicle.priceCleanMoney)} Commands Limpo</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/38">Ganho permanente</p>
                      <p className="mt-2 text-lg font-black" style={{ color: purchaseVehicle.danger }}>
                        +{purchaseVehicle.bonusPercent}% {getFugaStatLabel(purchaseVehicle.targetStat)} em {getFugaMemberLabel(purchaseVehicle.targetType)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => void handleBuy(purchaseVehicle)}
                      disabled={loadingVehicleId === purchaseVehicle.id}
                      className="rounded-2xl bg-yellow-300 px-5 py-4 text-[11px] font-black uppercase tracking-[0.28em] text-black transition hover:bg-white active:scale-[0.98] disabled:opacity-55"
                    >
                      {loadingVehicleId === purchaseVehicle.id ? 'Processando...' : 'Fechar contrato'}
                    </button>
                    <button
                      onClick={() => setPurchaseVehicle(null)}
                      className="rounded-2xl border border-white/16 bg-white/[0.035] px-5 py-4 text-[11px] font-black uppercase tracking-[0.28em] text-white transition hover:bg-white/10"
                    >
                      Cancelar
                    </button>
                  </div>
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
