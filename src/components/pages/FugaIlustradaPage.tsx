import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import FugaSmokeFX from '@/components/effects/FugaSmokeFX';
import { usePlayerStore } from '@/store/playerStore';
import { buyFugaVehicle } from '@/api/fugaApi';
import {
  FUGA_GARAGE_BACKGROUNDS,
  FUGA_MAX_VEHICLES,
  FUGA_VEHICLES,
  type FugaVehicle,
  formatFugaMoney,
  getFugaMemberLabel,
  getFugaProgressPercent,
  getFugaStatLabel,
  getFugaVehicleById,
  getNextLockedFugaVehicle,
  getOwnedFugaVehicles,
  isFugaVehicleOwned,
} from '@/data/fugaGarage';

type MessageState = { type: 'success' | 'error'; text: string } | null;
type FilterState = 'all' | 'unlocked' | 'owned' | 'locked';

type VehicleStatus = {
  owned: boolean;
  unlocked: boolean;
  affordable: boolean;
  canBuy: boolean;
};

const TIER_LABEL: Record<FugaVehicle['tier'], string> = {
  rua: 'RUA',
  pro: 'PRO',
  blindado: 'BLINDADO',
  elite: 'ELITE',
  phantom: 'PHANTOM',
  lendario: 'LENDÁRIO',
};

const FILTER_LABEL: Record<FilterState, string> = {
  all: 'TODOS',
  unlocked: 'DISPONÍVEIS',
  owned: 'MINHA FROTA',
  locked: 'BLOQUEADOS',
};

const STATUS_ICON = {
  clean: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  fleet: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M5 16h14l-1.4-5.3A3 3 0 0 0 14.7 8H9.3a3 3 0 0 0-2.9 2.7L5 16Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M7 16v2M17 16v2M8 12h8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ),
  barraco: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M4 20h16M6 20V9l6-4 6 4v11M9 20v-6h6v6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  bonus: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M12 3v18M17 7.5c-.7-1.5-2.1-2.5-4.2-2.5-2.3 0-4 1.1-4 3 0 4.8 8.6 2.2 8.6 7.7 0 2-1.8 3.3-4.5 3.3-2.3 0-4.1-1-5-2.7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ),
};

function getVehicleStatus(player: any, vehicle: FugaVehicle, cleanMoney: number, barracoLevel: number): VehicleStatus {
  const owned = isFugaVehicleOwned(player, vehicle.id);
  const unlocked = barracoLevel >= vehicle.unlockBarracoLevel;
  const affordable = cleanMoney >= vehicle.priceCleanMoney;
  return { owned, unlocked, affordable, canBuy: !owned && unlocked && affordable };
}

function getStatusLabel(status: VehicleStatus, vehicle: FugaVehicle) {
  if (status.owned) return 'NA FROTA';
  if (!status.unlocked) return `BARRACO NV. ${vehicle.unlockBarracoLevel}`;
  if (!status.affordable) return 'SALDO INSUFICIENTE';
  return 'FECHAR CONTRATO';
}

function VehicleImage({ vehicle, className = '', priority = false }: { vehicle: FugaVehicle; className?: string; priority?: boolean }) {
  return (
    <img
      src={vehicle.image}
      alt={vehicle.name}
      draggable={false}
      loading={priority ? 'eager' : 'lazy'}
      className={`select-none object-contain ${className}`}
    />
  );
}

function LeftMenuStat({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="group relative flex min-h-[72px] items-center gap-4 overflow-hidden rounded-[18px] border border-white/20 bg-gradient-to-b from-[#1c2930]/95 to-[#071014]/95 px-4 py-3 shadow-[0_8px_0_rgba(0,0,0,0.40),inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-xl md:min-h-[82px] md:px-5">
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.16),transparent_42%,rgba(255,255,255,0.04))] opacity-80" />
      <div className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
        style={accent ? { color: accent, boxShadow: `0 0 22px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.18)` } : undefined}
      >
        {icon}
      </div>
      <div className="relative min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.20em] text-white/52">{label}</p>
        <p className="truncate text-2xl font-black uppercase leading-none text-white md:text-3xl">{value}</p>
      </div>
      <div className="absolute right-0 top-0 h-full w-14 bg-gradient-to-l from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

function ContractBadge({ vehicle, status }: { vehicle: FugaVehicle; status?: VehicleStatus }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-white/20 bg-black/65 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/78 backdrop-blur-xl">
        {TIER_LABEL[vehicle.tier]}
      </span>
      <span className="rounded-full border border-white/20 bg-black/65 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/78 backdrop-blur-xl">
        Libera Nv. {vehicle.unlockBarracoLevel}
      </span>
      <span className="rounded-full border border-white/20 bg-black/65 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/78 backdrop-blur-xl">
        {vehicle.codename}
      </span>
      {status?.owned && (
        <span className="rounded-full border border-emerald-300/35 bg-emerald-400/20 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-emerald-100 backdrop-blur-xl">
          Na Frota
        </span>
      )}
    </div>
  );
}

function BonusLine({ vehicle, compact = false }: { vehicle: FugaVehicle; compact?: boolean }) {
  return (
    <div className={`rounded-[18px] border border-white/12 bg-black/56 ${compact ? 'px-3 py-2' : 'px-4 py-3'} shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`}>
      <p className="text-[8px] font-black uppercase tracking-[0.30em] text-white/38">Estatística de batalha</p>
      <p className={`${compact ? 'mt-1 text-xs' : 'mt-2 text-sm'} font-black text-white`}>
        <span style={{ color: vehicle.accent }}>+{vehicle.bonusPercent}%</span>{' '}
        {getFugaStatLabel(vehicle.targetStat)} em {getFugaMemberLabel(vehicle.targetType)}
      </p>
    </div>
  );
}

function GarageBackdrop({ selectedVehicle }: { selectedVehicle: FugaVehicle }) {
  return (
    <>
      <div className="fixed inset-0 z-0 bg-cover bg-center opacity-75" style={{ backgroundImage: `url(${FUGA_GARAGE_BACKGROUNDS.hero})` }} />
      <div className="fixed inset-0 z-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.78)_30%,rgba(0,0,0,0.28)_63%,rgba(0,0,0,0.72)_100%)]" />
      <div className="fixed inset-0 z-0 opacity-65 mix-blend-screen" style={{ background: `radial-gradient(circle at 78% 34%, ${selectedVehicle.accent}74, transparent 28%), radial-gradient(circle at 62% 20%, ${selectedVehicle.accent2}48, transparent 34%)` }} />
      <div className="fixed inset-0 z-0 opacity-18 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:100%_4px]" />
      <div className="fixed inset-x-0 bottom-0 z-0 h-[42vh] bg-[linear-gradient(0deg,#000_0%,rgba(0,0,0,0.78)_52%,transparent_100%)]" />
    </>
  );
}

function HeroVehicleShowcase({ vehicle, status, onContract, loading }: { vehicle: FugaVehicle; status: VehicleStatus; onContract: () => void; loading: boolean }) {
  return (
    <motion.section
      key={vehicle.id}
      initial={{ opacity: 0, scale: 0.975, x: 28 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.46 }}
      className="pointer-events-auto relative min-h-[360px] overflow-hidden rounded-[34px] border border-white/10 bg-black/20 p-3 md:min-h-[560px] md:p-5"
    >
      <div className="absolute inset-0 opacity-55" style={{ background: `radial-gradient(ellipse at 68% 50%, ${vehicle.accent}42, transparent 45%), radial-gradient(ellipse at 46% 74%, ${vehicle.accent2}30, transparent 42%)` }} />
      <div className="absolute left-[18%] top-4 h-28 w-1/2 rotate-[-11deg] bg-gradient-to-b from-white/40 to-transparent blur-2xl" />
      <div className="absolute bottom-[10%] left-[20%] h-14 w-[72%] rounded-full blur-2xl" style={{ background: `radial-gradient(ellipse, ${vehicle.accent}58, transparent 70%)` }} />
      <div className="absolute bottom-[13%] left-[16%] h-px w-[76%] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

      <div className="relative z-10 flex h-full min-h-[340px] flex-col justify-end md:min-h-[540px]">
        <div className="ml-auto w-full max-w-[980px]">
          <VehicleImage vehicle={vehicle} priority className="ml-auto max-h-[300px] w-full drop-shadow-[0_60px_90px_rgba(0,0,0,0.98)] md:max-h-[520px]" />
        </div>

        <div className="absolute right-3 top-3 max-w-[360px] rounded-[24px] border border-white/12 bg-black/50 p-4 backdrop-blur-2xl md:right-6 md:top-6">
          <ContractBadge vehicle={vehicle} status={status} />
          <h2 className="mt-3 text-2xl font-black uppercase tracking-[0.08em] text-white md:text-4xl">{vehicle.name}</h2>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: vehicle.accent }}>{vehicle.classLabel} · {vehicle.role}</p>
          <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/66 md:text-sm">{vehicle.headline}</p>
          <div className="mt-3"><BonusLine vehicle={vehicle} compact /></div>
          <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.28em] text-white/40">Contrato</p>
              <p className="text-lg font-black text-white">{formatFugaMoney(vehicle.priceCleanMoney)} Limpo</p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={onContract}
              className={`rounded-2xl px-4 py-3 text-[9px] font-black uppercase tracking-[0.24em] transition disabled:opacity-50 ${status.canBuy ? 'bg-white text-black hover:brightness-110' : status.owned ? 'border border-emerald-300/35 bg-emerald-400/18 text-emerald-100' : 'bg-white/[0.08] text-white/64'}`}
            >
              {loading ? 'Processando' : getStatusLabel(status, vehicle)}
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function VehicleStripCard({
  vehicle,
  selected,
  status,
  onSelect,
  onContract,
}: {
  vehicle: FugaVehicle;
  selected: boolean;
  status: VehicleStatus;
  onSelect: () => void;
  onContract: () => void;
}) {
  const locked = !status.unlocked;
  const baseColor = status.owned ? '#123425' : locked ? '#172238' : '#5a0b16';

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={`group relative h-[164px] w-[210px] shrink-0 overflow-hidden rounded-[18px] border p-2 text-left shadow-[0_10px_0_rgba(0,0,0,0.38)] transition md:h-[184px] md:w-[244px] ${selected ? 'border-white shadow-[0_0_32px_rgba(255,255,255,0.24),0_10px_0_rgba(0,0,0,0.45)]' : 'border-white/22 hover:border-white/55'}`}
      style={{ background: `linear-gradient(135deg, ${baseColor}, #050608 80%)` }}
    >
      <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 54% 35%, ${vehicle.accent}32, transparent 48%)` }} />
      <div className="absolute inset-x-2 top-2 flex items-center justify-between">
        <span className={`grid h-8 w-8 place-items-center rounded-lg border border-white/25 bg-black/70 text-sm font-black ${locked ? 'text-white' : status.owned ? 'text-emerald-200' : 'text-white'}`}>
          {locked ? '🔒' : status.owned ? '✓' : '↗'}
        </span>
        <span className="rounded-full border border-white/18 bg-black/65 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.22em] text-white/70">
          Nv. {vehicle.unlockBarracoLevel}
        </span>
      </div>
      <VehicleImage vehicle={vehicle} className={`absolute inset-x-1 top-8 mx-auto h-[92px] w-[96%] drop-shadow-[0_18px_24px_rgba(0,0,0,0.82)] transition duration-500 group-hover:scale-110 md:h-[108px] ${locked ? 'opacity-70 grayscale-[0.35]' : ''}`} />
      <div className="absolute inset-x-2 bottom-2 rounded-[14px] border border-white/12 bg-black/70 px-3 py-2 backdrop-blur-lg">
        <p className="truncate text-[10px] font-black uppercase tracking-[0.20em] text-white/50">{TIER_LABEL[vehicle.tier]} · {vehicle.codename}</p>
        <p className="truncate text-sm font-black uppercase tracking-[0.08em] text-white">{vehicle.name}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-[10px] font-black text-white/58">+{vehicle.bonusPercent}% {getFugaStatLabel(vehicle.targetStat)}</span>
          <span className="text-[10px] font-black text-white">{formatFugaMoney(vehicle.priceCleanMoney)}</span>
        </div>
      </div>
      {status.canBuy && (
        <span
          onClick={(event) => { event.stopPropagation(); onContract(); }}
          className="absolute bottom-[76px] right-3 hidden rounded-full bg-white px-3 py-1 text-[8px] font-black uppercase tracking-[0.20em] text-black shadow-lg md:inline-flex"
        >
          Comprar
        </span>
      )}
    </motion.button>
  );
}

function FilterButton({ item, active, onClick }: { item: FilterState; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-[14px] border px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] shadow-[0_5px_0_rgba(0,0,0,0.38)] transition ${
        active
          ? 'border-white bg-white text-black'
          : 'border-white/18 bg-black/64 text-white/64 hover:border-white/45 hover:text-white'
      }`}
    >
      {FILTER_LABEL[item]}
    </button>
  );
}

function CompactFleetSummary({ stats }: { stats: { owned: number; unlocked: number; locked: number } }) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-[20px] border border-white/10 bg-black/58 p-2 backdrop-blur-xl">
      <div className="rounded-[14px] bg-white/[0.06] px-3 py-2 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.24em] text-white/40">Liberados</p>
        <p className="text-xl font-black text-white">{stats.unlocked}</p>
      </div>
      <div className="rounded-[14px] bg-emerald-400/10 px-3 py-2 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.24em] text-emerald-100/45">Na frota</p>
        <p className="text-xl font-black text-emerald-100">{stats.owned}</p>
      </div>
      <div className="rounded-[14px] bg-white/[0.06] px-3 py-2 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.24em] text-white/40">Bloqueados</p>
        <p className="text-xl font-black text-white">{stats.locked}</p>
      </div>
    </div>
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
  const nextLocked = useMemo(() => getNextLockedFugaVehicle(barracoLevel), [barracoLevel]);
  const progress = useMemo(() => getFugaProgressPercent(player), [player]);

  const firstVisibleVehicle = useMemo(() => {
    const available = FUGA_VEHICLES.find((vehicle) => {
      const status = getVehicleStatus(player, vehicle, cleanMoney, barracoLevel);
      return status.unlocked && !status.owned;
    });
    return available?.id || ownedVehicles[0]?.id || FUGA_VEHICLES[0].id;
  }, [player, cleanMoney, barracoLevel, ownedVehicles]);

  const [selectedVehicleId, setSelectedVehicleId] = useState(firstVisibleVehicle);
  const [contractVehicle, setContractVehicle] = useState<FugaVehicle | null>(null);
  const [loadingVehicleId, setLoadingVehicleId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterState>('all');
  const [message, setMessage] = useState<MessageState>(null);

  useEffect(() => { if (!isLoaded) void loadPlayer(); }, [isLoaded, loadPlayer]);
  useEffect(() => { setSelectedVehicleId((current) => getFugaVehicleById(current)?.id || firstVisibleVehicle); }, [firstVisibleVehicle]);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4600);
    return () => window.clearTimeout(timer);
  }, [message]);

  const selectedVehicle = getFugaVehicleById(selectedVehicleId) || FUGA_VEHICLES[0];
  const selectedStatus = getVehicleStatus(player, selectedVehicle, cleanMoney, barracoLevel);

  const stats = useMemo(() => {
    const statusList = FUGA_VEHICLES.map((vehicle) => ({ vehicle, status: getVehicleStatus(player, vehicle, cleanMoney, barracoLevel) }));
    return {
      owned: statusList.filter((entry) => entry.status.owned).length,
      unlocked: statusList.filter((entry) => entry.status.unlocked && !entry.status.owned).length,
      locked: statusList.filter((entry) => !entry.status.unlocked).length,
    };
  }, [player, cleanMoney, barracoLevel]);

  const filteredVehicles = useMemo(() => {
    return FUGA_VEHICLES.filter((vehicle) => {
      const status = getVehicleStatus(player, vehicle, cleanMoney, barracoLevel);
      if (filter === 'owned') return status.owned;
      if (filter === 'unlocked') return status.unlocked && !status.owned;
      if (filter === 'locked') return !status.unlocked;
      return true;
    });
  }, [filter, player, cleanMoney, barracoLevel]);

  async function handleBuy(vehicle: FugaVehicle) {
    const status = getVehicleStatus(player, vehicle, cleanMoney, barracoLevel);
    if (status.owned) return setMessage({ type: 'error', text: `${vehicle.name} já está na frota.` });
    if (!status.unlocked) return setMessage({ type: 'error', text: `${vehicle.name} libera no barraco nível ${vehicle.unlockBarracoLevel}.` });
    if (!status.affordable) return setMessage({ type: 'error', text: 'Commands Limpo insuficiente para fechar esse contrato.' });

    try {
      setLoadingVehicleId(vehicle.id);
      const response = await buyFugaVehicle({ vehicleId: vehicle.id });
      if (response?.player) hydratePlayerFromServer(response.player);
      setContractVehicle(null);
      setSelectedVehicleId(vehicle.id);
      setMessage({
        type: 'success',
        text: `${vehicle.name} entrou para a frota. +${vehicle.bonusPercent}% ${getFugaStatLabel(vehicle.targetStat)} em ${getFugaMemberLabel(vehicle.targetType)} já está ativo no motor de batalha.`,
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
        <main className="flex min-h-screen items-center justify-center pt-[140px]"><LoadingSpinner /></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      <Header />
      <FugaSmokeFX />
      <GarageBackdrop selectedVehicle={selectedVehicle} />

      <main className="relative z-20 mx-auto flex min-h-screen max-w-[1920px] flex-col px-3 pb-24 pt-[104px] sm:px-5 md:px-8 md:pt-[132px]">
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className={`fixed left-4 right-4 top-[92px] z-[80] mx-auto max-w-2xl rounded-2xl border px-5 py-4 text-sm font-bold shadow-2xl backdrop-blur-2xl ${message.type === 'success' ? 'border-emerald-300/25 bg-emerald-500/18 text-emerald-50' : 'border-red-300/25 bg-red-500/18 text-red-50'}`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <section className="relative grid flex-1 gap-4 lg:grid-cols-[410px_minmax(0,1fr)] lg:items-start xl:grid-cols-[460px_minmax(0,1fr)]">
          <aside className="pointer-events-auto relative z-30 rounded-[30px] border border-white/10 bg-black/35 p-4 backdrop-blur-[2px] lg:bg-transparent lg:p-0 lg:backdrop-blur-0">
            <p className="text-[10px] font-black uppercase tracking-[0.50em] text-white/55">Garagem clandestina</p>
            <h1 className="mt-2 text-5xl font-black uppercase leading-[0.86] tracking-[0.03em] text-white sm:text-6xl md:text-7xl lg:text-[78px]" style={{ textShadow: '0 0 14px rgba(255,62,74,0.80), 0 5px 0 rgba(0,0,0,0.70)' }}>
              Garagem<br />da Fuga
            </h1>
            <p className="mt-4 max-w-[410px] text-xs font-bold leading-6 text-white/62 md:text-sm">
              Frota tática comprada com Commands Limpo. Cada contrato entra no inventário e adiciona +1% permanente em estatística real da gangue usada na batalha.
            </p>

            <div className="mt-5 grid gap-3">
              <LeftMenuStat icon={STATUS_ICON.clean} label="Commands Limpo" value={formatFugaMoney(cleanMoney)} accent={selectedVehicle.accent} />
              <LeftMenuStat icon={STATUS_ICON.fleet} label="Frota" value={`${ownedVehicles.length}/${FUGA_MAX_VEHICLES}`} accent={selectedVehicle.accent2} />
              <LeftMenuStat icon={STATUS_ICON.barraco} label="Barraco" value={`Nv. ${barracoLevel}`} />
              <LeftMenuStat icon={STATUS_ICON.bonus} label="Bônus" value={`+${ownedVehicles.length}%`} accent="#ffd84a" />
            </div>

            <div className="mt-4 rounded-[22px] border border-white/14 bg-black/58 p-4 shadow-[0_8px_0_rgba(0,0,0,0.38)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.30em] text-white/42">Progresso</p>
                <p className="text-sm font-black text-white">{progress}%</p>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/[0.10]">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  style={{ background: `linear-gradient(90deg, ${selectedVehicle.accent}, ${selectedVehicle.accent2})` }}
                />
              </div>
              {nextLocked && (
                <p className="mt-3 text-[10px] font-black uppercase leading-5 tracking-[0.18em] text-white/52">
                  Próxima liberação: <span className="text-white">{nextLocked.name}</span> no barraco Nv. {nextLocked.unlockBarracoLevel}
                </p>
              )}
            </div>

            <div className="mt-4"><CompactFleetSummary stats={stats} /></div>
          </aside>

          <HeroVehicleShowcase
            vehicle={selectedVehicle}
            status={selectedStatus}
            loading={loadingVehicleId === selectedVehicle.id}
            onContract={() => selectedStatus.canBuy ? setContractVehicle(selectedVehicle) : setMessage({ type: selectedStatus.owned ? 'success' : 'error', text: getStatusLabel(selectedStatus, selectedVehicle) })}
          />
        </section>

        <section className="pointer-events-auto relative z-40 mt-5 overflow-hidden rounded-[26px] border border-white/12 bg-black/72 p-3 shadow-[0_18px_70px_rgba(0,0,0,0.70)] backdrop-blur-2xl md:p-4">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.36em] text-white/38">20 contratos · liberação a cada 5 níveis · estatísticas reais</p>
              <h2 className="mt-1 text-xl font-black uppercase tracking-[0.12em] text-white md:text-2xl">Pátio da Fuga</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:overflow-visible">
              {(['all', 'unlocked', 'owned', 'locked'] as FilterState[]).map((item) => (
                <FilterButton key={item} item={item} active={filter === item} onClick={() => setFilter(item)} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
            {filteredVehicles.map((vehicle) => {
              const status = getVehicleStatus(player, vehicle, cleanMoney, barracoLevel);
              return (
                <VehicleStripCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  selected={selectedVehicle.id === vehicle.id}
                  status={status}
                  onSelect={() => setSelectedVehicleId(vehicle.id)}
                  onContract={() => { setSelectedVehicleId(vehicle.id); setContractVehicle(vehicle); }}
                />
              );
            })}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {contractVehicle && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-end justify-center bg-black/86 p-3 backdrop-blur-md md:items-center md:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setContractVehicle(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-6xl overflow-hidden rounded-[34px] border border-white/12 bg-black shadow-[0_38px_140px_rgba(0,0,0,0.82)]"
            >
              <div className="absolute inset-0 bg-cover bg-center opacity-42" style={{ backgroundImage: `url(${FUGA_GARAGE_BACKGROUNDS.contract})` }} />
              <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 70% 35%, ${contractVehicle.accent}36, transparent 44%), linear-gradient(90deg, rgba(0,0,0,0.94), rgba(0,0,0,0.58))` }} />

              <div className="relative grid gap-5 p-5 md:grid-cols-[1.1fr_0.9fr] md:p-7">
                <div>
                  <ContractBadge vehicle={contractVehicle} status={getVehicleStatus(player, contractVehicle, cleanMoney, barracoLevel)} />
                  <h3 className="mt-4 text-4xl font-black uppercase tracking-[0.08em] text-white md:text-5xl">{contractVehicle.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/68">{contractVehicle.lore}</p>
                  <div className="relative mt-5 flex min-h-[300px] items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black/52 md:min-h-[390px]">
                    <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 52% 68%, ${contractVehicle.accent}45, transparent 48%)` }} />
                    <VehicleImage vehicle={contractVehicle} priority className="relative z-10 max-h-[280px] w-full drop-shadow-[0_45px_80px_rgba(0,0,0,0.95)] md:max-h-[360px]" />
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/62 p-5 backdrop-blur-2xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.34em] text-white/42">Contrato tático</p>
                  <div className="mt-4 grid gap-3">
                    <BonusLine vehicle={contractVehicle} />
                    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/38">Valor</p>
                      <p className="mt-1 text-2xl font-black text-white">{formatFugaMoney(contractVehicle.priceCleanMoney)}</p>
                      <p className="text-xs font-bold text-white/42">Commands Limpo</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/38">Liberação</p>
                      <p className="mt-1 text-lg font-black text-white">Barraco Nv. {contractVehicle.unlockBarracoLevel}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/38">Batalha</p>
                      <p className="mt-1 text-xs leading-5 text-white/58">A compra é salva em <span className="text-white">gang.statSources</span>; o motor de ataque usa o snapshot efetivo da gangue na resolução.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/38">Nota do mecânico</p>
                      <p className="mt-1 text-xs leading-5 text-white/58">{contractVehicle.mechanicNote}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setContractVehicle(null)}
                      className="flex-1 rounded-2xl border border-white/12 bg-white/[0.08] px-4 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-white/72"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={loadingVehicleId === contractVehicle.id}
                      onClick={() => handleBuy(contractVehicle)}
                      className="flex-[1.35] rounded-2xl bg-white px-4 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-black transition hover:brightness-110 disabled:opacity-50"
                    >
                      {loadingVehicleId === contractVehicle.id ? 'Processando...' : 'Confirmar compra'}
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
