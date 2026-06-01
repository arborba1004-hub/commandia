import { useEffect, useMemo, useState } from 'react';
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
  rua: 'Rua',
  pro: 'Pro',
  blindado: 'Blindado',
  elite: 'Elite',
  phantom: 'Phantom',
  lendario: 'Lendário',
};

const FILTER_LABEL: Record<FilterState, string> = {
  all: 'Todos',
  unlocked: 'Disponíveis',
  owned: 'Minha frota',
  locked: 'Bloqueados',
};

function getVehicleStatus(player: any, vehicle: FugaVehicle, cleanMoney: number, barracoLevel: number): VehicleStatus {
  const owned = isFugaVehicleOwned(player, vehicle.id);
  const unlocked = barracoLevel >= vehicle.unlockBarracoLevel;
  const affordable = cleanMoney >= vehicle.priceCleanMoney;
  return { owned, unlocked, affordable, canBuy: !owned && unlocked && affordable };
}

function getStatusLabel(status: VehicleStatus, vehicle: FugaVehicle) {
  if (status.owned) return 'Na frota';
  if (!status.unlocked) return `Libera no Nv. ${vehicle.unlockBarracoLevel}`;
  if (!status.affordable) return 'Saldo insuficiente';
  return 'Comprar';
}

function CompactStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/52 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl md:px-4 md:py-3">
      <div
        className="absolute inset-0 opacity-70"
        style={{ background: accent ? `radial-gradient(circle at 18% 0%, ${accent}33, transparent 56%)` : 'linear-gradient(135deg, rgba(255,255,255,0.08), transparent)' }}
      />
      <p className="relative text-[8px] font-black uppercase tracking-[0.24em] text-white/42 md:text-[9px]">{label}</p>
      <p className="relative mt-0.5 text-lg font-black leading-none text-white md:text-2xl" style={accent ? { textShadow: `0 0 18px ${accent}66` } : undefined}>
        {value}
      </p>
    </div>
  );
}

function VehicleImage({ vehicle, className = '', eager = false }: { vehicle: FugaVehicle; className?: string; eager?: boolean }) {
  return (
    <img
      src={vehicle.image}
      alt={vehicle.name}
      draggable={false}
      loading={eager ? 'eager' : 'lazy'}
      className={`select-none object-contain ${className}`}
    />
  );
}

function BonusLine({ vehicle, compact = false }: { vehicle: FugaVehicle; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-black/48 ${compact ? 'px-3 py-2' : 'px-4 py-3'} shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`}>
      <p className="text-[8px] font-black uppercase tracking-[0.28em] text-white/38">Bônus de batalha</p>
      <p className={`${compact ? 'mt-1 text-xs' : 'mt-2 text-sm'} font-black text-white`}>
        <span style={{ color: vehicle.accent }}>+{vehicle.bonusPercent}%</span>{' '}
        {getFugaStatLabel(vehicle.targetStat)} em {getFugaMemberLabel(vehicle.targetType)}
      </p>
    </div>
  );
}

function ContractBadge({ vehicle, status }: { vehicle: FugaVehicle; status?: VehicleStatus }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
      <span className="rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.22em] text-white/72 backdrop-blur-xl md:text-[9px]">
        {TIER_LABEL[vehicle.tier]}
      </span>
      <span className="rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.22em] text-white/72 backdrop-blur-xl md:text-[9px]">
        Nv. {vehicle.unlockBarracoLevel}
      </span>
      <span className="rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.22em] text-white/72 backdrop-blur-xl md:text-[9px]">
        {vehicle.codename}
      </span>
      {status?.owned && (
        <span className="rounded-full border border-emerald-300/25 bg-emerald-400/16 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.22em] text-emerald-100 backdrop-blur-xl md:text-[9px]">
          Na frota
        </span>
      )}
    </div>
  );
}

function VehicleStage({ vehicle, eager = false }: { vehicle: FugaVehicle; eager?: boolean }) {
  return (
    <div className="relative flex h-[42svh] min-h-[286px] max-h-[430px] items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black/46 md:h-[520px] md:max-h-none">
      <div
        className="absolute inset-0 opacity-85"
        style={{ background: `radial-gradient(circle at 50% 73%, ${vehicle.accent}44, transparent 46%), radial-gradient(circle at 42% 10%, ${vehicle.accent2}2e, transparent 42%)` }}
      />
      <div className="absolute bottom-[18%] left-1/2 h-[42px] w-[78%] -translate-x-1/2 rounded-full blur-2xl" style={{ background: `radial-gradient(ellipse, ${vehicle.accent}45, transparent 70%)` }} />
      <div className="absolute bottom-[20%] h-px w-[78%] bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <VehicleImage
        vehicle={vehicle}
        eager={eager}
        className="relative z-10 max-h-[92%] w-full px-1 drop-shadow-[0_34px_58px_rgba(0,0,0,0.98)] transition-transform duration-1000 md:px-4 md:hover:scale-[1.035]"
      />
    </div>
  );
}

function VehicleThumb({
  vehicle,
  selected,
  status,
  onSelect,
}: {
  vehicle: FugaVehicle;
  selected: boolean;
  status: VehicleStatus;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative h-[94px] w-[132px] shrink-0 overflow-hidden rounded-2xl border bg-black/62 text-left transition md:h-[124px] md:w-[174px] ${selected ? 'border-white shadow-[0_0_34px_rgba(255,255,255,0.22)]' : 'border-white/12 hover:border-white/32'}`}
    >
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 52% 70%, ${vehicle.accent}36, transparent 58%)` }} />
      {!status.unlocked && <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-[1px]" />}
      <VehicleImage vehicle={vehicle} className="absolute inset-x-0 bottom-2 z-10 h-[68px] w-full px-1 md:h-[94px]" />
      <div className="absolute left-2 top-2 z-30 rounded-full border border-white/15 bg-black/65 px-2 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-white/78">
        {status.owned ? '✓' : status.unlocked ? `Nv. ${vehicle.unlockBarracoLevel}` : '🔒'}
      </div>
      <div className="absolute bottom-1.5 left-2 right-2 z-30 truncate text-[9px] font-black uppercase tracking-[0.12em] text-white md:text-[10px]">
        {vehicle.name}
      </div>
    </button>
  );
}

function FilterButton({ item, active, onClick }: { item: FilterState; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.20em] transition md:px-5 ${
        active
          ? 'border-white bg-white text-black shadow-[0_0_28px_rgba(255,255,255,0.24)]'
          : 'border-white/14 bg-white/[0.055] text-white/64 hover:border-white/35 hover:bg-white/[0.09]'
      }`}
    >
      {FILTER_LABEL[item]}
    </button>
  );
}

function VehicleGridCard({
  vehicle,
  selected,
  player,
  cleanMoney,
  barracoLevel,
  onSelect,
  onContract,
}: {
  vehicle: FugaVehicle;
  selected: boolean;
  player: any;
  cleanMoney: number;
  barracoLevel: number;
  onSelect: () => void;
  onContract: () => void;
}) {
  const status = getVehicleStatus(player, vehicle, cleanMoney, barracoLevel);

  return (
    <motion.article
      layout
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      className={`group relative cursor-pointer overflow-hidden rounded-[26px] border bg-black/62 p-3 transition-all duration-300 ${selected ? 'border-white/55' : 'border-white/10 hover:border-white/30'}`}
      style={{ boxShadow: selected ? `0 0 50px ${vehicle.glow}` : '0 18px 56px rgba(0,0,0,0.52)' }}
    >
      <div className="absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle at 45% 18%, ${vehicle.accent}2d, transparent 44%), linear-gradient(180deg, rgba(255,255,255,0.055), rgba(0,0,0,0.82))` }} />
      {!status.unlocked && <div className="absolute inset-0 z-20 bg-black/68 backdrop-blur-[2px]" />}

      <div className="relative z-30 grid grid-cols-[112px_1fr] gap-3 md:block">
        <div className="relative h-[104px] overflow-hidden rounded-2xl border border-white/10 bg-black/42 md:h-[150px]">
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 68%, ${vehicle.accent}40, transparent 55%)` }} />
          <VehicleImage vehicle={vehicle} className="absolute inset-0 h-full w-full p-1.5 drop-shadow-[0_22px_30px_rgba(0,0,0,0.86)] transition-transform duration-700 group-hover:scale-[1.06]" />
          {!status.unlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full border border-white/15 bg-black/78 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.20em] text-white">
                Nv. {vehicle.unlockBarracoLevel}
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 md:mt-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.24em] text-white/42">Contrato</p>
              <h3 className="mt-1 truncate text-lg font-black uppercase tracking-[0.08em] text-white md:text-xl">{vehicle.name}</h3>
            </div>
            <span className="rounded-full border border-white/14 bg-black/55 px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-white/66">
              {vehicle.codename}
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-white/58 md:text-xs md:leading-5">{vehicle.headline}</p>
          <div className="mt-2 hidden md:block"><BonusLine vehicle={vehicle} compact /></div>

          <div className="mt-3 flex items-center justify-between gap-2 md:mt-4">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.24em] text-white/35">Valor</p>
              <p className="text-sm font-black text-white md:text-base">{formatFugaMoney(vehicle.priceCleanMoney)}</p>
            </div>
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); status.canBuy ? onContract() : onSelect(); }}
              className={`rounded-2xl px-3 py-2.5 text-[8px] font-black uppercase tracking-[0.18em] transition md:px-4 md:py-3 md:text-[9px] ${
                status.canBuy
                  ? 'bg-white text-black hover:brightness-110'
                  : status.owned
                  ? 'border border-emerald-300/25 bg-emerald-400/15 text-emerald-100'
                  : 'bg-white/[0.08] text-white/58'
              }`}
            >
              {status.owned ? 'Na frota' : status.canBuy ? 'Comprar' : status.unlocked ? 'Ver' : 'Bloq.'}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
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
    <div className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
      <Header />
      <div className="hidden md:block"><FugaSmokeFX /></div>

      <main className="relative z-20 mx-auto max-w-[1680px] px-3 pb-24 pt-[98px] sm:px-5 md:px-8 md:pt-[140px]">
        <div className="fixed inset-0 z-0 bg-cover bg-center opacity-54" style={{ backgroundImage: `url(${FUGA_GARAGE_BACKGROUNDS.hero})` }} />
        <div className="fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.50),#020202_82%)]" />
        <div className="fixed inset-0 z-0 opacity-48 mix-blend-screen" style={{ background: `radial-gradient(circle at 16% 8%, ${selectedVehicle.accent}54, transparent 30%), radial-gradient(circle at 88% 12%, ${selectedVehicle.accent2}42, transparent 34%)` }} />
        <div className="fixed inset-x-0 bottom-0 z-0 h-[42vh] bg-[linear-gradient(0deg,#000_0%,rgba(0,0,0,0.62)_58%,transparent_100%)]" />

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className={`fixed left-3 right-3 top-[84px] z-[80] mx-auto max-w-2xl rounded-2xl border px-4 py-3 text-xs font-bold shadow-2xl backdrop-blur-2xl md:top-[110px] md:px-5 md:py-4 md:text-sm ${message.type === 'success' ? 'border-emerald-300/25 bg-emerald-500/18 text-emerald-50' : 'border-red-300/25 bg-red-500/18 text-red-50'}`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/54 p-3 shadow-[0_32px_115px_rgba(0,0,0,0.78)] backdrop-blur-2xl md:rounded-[38px] md:p-7">
          <div className="absolute inset-0 opacity-90" style={{ background: `linear-gradient(135deg, ${selectedVehicle.accent}1f, transparent 42%), radial-gradient(circle at 76% 28%, ${selectedVehicle.accent2}22, transparent 38%)` }} />
          <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-white/35 to-transparent" />

          <div className="relative grid gap-4 lg:grid-cols-[0.80fr_1.20fr] lg:items-stretch">
            <div className="order-2 rounded-[26px] border border-white/10 bg-black/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl lg:order-1 md:p-7">
              <div className="hidden lg:block">
                <p className="text-[10px] font-black uppercase tracking-[0.46em] text-white/48">Garagem clandestina · Pátio privado</p>
                <h1 className="mt-4 text-6xl font-black uppercase leading-[0.88] tracking-[0.055em] text-white xl:text-7xl">
                  Garagem<br />da Fuga
                </h1>
                <p className="mt-6 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
                  Contratos táticos de frota comprados com Commands Limpo. Cada veículo entra no inventário e aplica +1% permanente em estatística real da gangue usada na batalha.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 lg:mt-7 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                <CompactStat label="Limpo" value={formatFugaMoney(cleanMoney)} accent={selectedVehicle.accent} />
                <CompactStat label="Frota" value={`${ownedVehicles.length}/${FUGA_MAX_VEHICLES}`} />
                <CompactStat label="Barraco" value={`Nv. ${barracoLevel}`} />
                <CompactStat label="Bônus" value={`+${ownedVehicles.length}%`} accent={selectedVehicle.accent2} />
              </div>

              <div className="mt-4 rounded-[24px] border border-white/10 bg-black/42 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/45">Progresso da frota</p>
                  <p className="text-xs font-black text-white">{progress}%</p>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    style={{ background: `linear-gradient(90deg, ${selectedVehicle.accent}, ${selectedVehicle.accent2})` }}
                  />
                </div>
                {nextLocked && (
                  <p className="mt-3 text-[9px] font-black uppercase tracking-[0.16em] text-white/52">
                    Próxima: <span className="text-white">{nextLocked.name}</span> · Barraco Nv. {nextLocked.unlockBarracoLevel}
                  </p>
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <CompactStat label="Liberados" value={String(stats.unlocked)} accent={selectedVehicle.accent} />
                <CompactStat label="Na frota" value={String(stats.owned)} accent="#34d399" />
                <CompactStat label="Bloq." value={String(stats.locked)} />
              </div>
            </div>

            <motion.div
              key={selectedVehicle.id}
              initial={{ opacity: 0, scale: 0.965, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.42 }}
              className="order-1 relative overflow-hidden rounded-[28px] border border-white/10 bg-black/58 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] lg:order-2 md:rounded-[32px] md:p-6"
              style={{ boxShadow: `0 0 88px ${selectedVehicle.glow}` }}
            >
              <div className="absolute inset-0 bg-cover bg-center opacity-42" style={{ backgroundImage: `url(${FUGA_GARAGE_BACKGROUNDS.contract})` }} />
              <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 70% 35%, ${selectedVehicle.accent}36, transparent 44%), linear-gradient(180deg, rgba(0,0,0,0.24), rgba(0,0,0,0.84))` }} />

              <div className="relative z-10 flex min-h-[calc(100svh-136px)] flex-col md:min-h-[650px]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.36em] text-white/45 md:hidden">Garagem da Fuga</p>
                    <ContractBadge vehicle={selectedVehicle} status={selectedStatus} />
                    <h1 className="mt-2 text-[34px] font-black uppercase leading-[0.92] tracking-[0.04em] text-white md:hidden">
                      {selectedVehicle.name}
                    </h1>
                    <h2 className="mt-4 hidden text-5xl font-black uppercase tracking-[0.08em] text-white md:block lg:text-6xl">{selectedVehicle.name}</h2>
                    <p className="mt-2 hidden text-sm font-black uppercase tracking-[0.28em] text-white/58 md:block" style={{ color: selectedVehicle.accent }}>
                      {selectedVehicle.classLabel} · {selectedVehicle.role}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!selectedStatus.canBuy || loadingVehicleId === selectedVehicle.id}
                    onClick={() => selectedStatus.canBuy && setContractVehicle(selectedVehicle)}
                    className={`shrink-0 rounded-2xl px-4 py-3 text-[9px] font-black uppercase tracking-[0.20em] transition md:px-6 md:py-4 md:text-[10px] ${
                      selectedStatus.canBuy
                        ? 'bg-white text-black hover:brightness-110'
                        : selectedStatus.owned
                        ? 'border border-emerald-300/25 bg-emerald-400/16 text-emerald-100'
                        : 'bg-white/[0.08] text-white/62'
                    }`}
                  >
                    {loadingVehicleId === selectedVehicle.id ? '...' : getStatusLabel(selectedStatus, selectedVehicle)}
                  </button>
                </div>

                <div className="mt-3 md:mt-5"><VehicleStage vehicle={selectedVehicle} eager /></div>

                <div className="mt-3 grid gap-2 md:mt-5 md:grid-cols-[1fr_0.78fr] md:gap-3">
                  <div className="rounded-[22px] border border-white/10 bg-black/52 p-3 md:rounded-[26px] md:p-4">
                    <p className="text-[8px] font-black uppercase tracking-[0.28em] text-white/38 md:text-[10px]">Dossiê da máquina</p>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/68 md:line-clamp-none md:text-sm md:leading-6">{selectedVehicle.lore}</p>
                    <p className="mt-2 hidden text-xs leading-5 text-white/45 md:block">{selectedVehicle.mechanicNote}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-1 md:gap-3">
                    <BonusLine vehicle={selectedVehicle} compact />
                    <div className="rounded-2xl border border-white/10 bg-black/48 px-3 py-2 md:px-4 md:py-3">
                      <p className="text-[8px] font-black uppercase tracking-[0.26em] text-white/38">Contrato</p>
                      <p className="mt-1 text-sm font-black text-white md:text-lg">{formatFugaMoney(selectedVehicle.priceCleanMoney)}</p>
                      <p className="text-[10px] font-bold text-white/42">Commands Limpo</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 md:mt-5">
                  <p className="mb-2 text-[9px] font-black uppercase tracking-[0.28em] text-white/42">Trocar veículo</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {FUGA_VEHICLES.map((vehicle) => (
                      <VehicleThumb
                        key={vehicle.id}
                        vehicle={vehicle}
                        selected={selectedVehicle.id === vehicle.id}
                        status={getVehicleStatus(player, vehicle, cleanMoney, barracoLevel)}
                        onSelect={() => setSelectedVehicleId(vehicle.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative mt-5 rounded-[30px] border border-white/10 bg-black/52 p-3 shadow-[0_26px_88px_rgba(0,0,0,0.62)] backdrop-blur-2xl md:mt-7 md:rounded-[36px] md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.34em] text-white/42 md:text-[10px]">20 contratos · liberação a cada 5 níveis · estatísticas reais</p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em] md:text-4xl">Pátio da Fuga</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:overflow-visible">
              {(['all', 'unlocked', 'owned', 'locked'] as FilterState[]).map((item) => (
                <FilterButton key={item} item={item} active={filter === item} onClick={() => setFilter(item)} />
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:mt-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredVehicles.map((vehicle) => (
              <VehicleGridCard
                key={vehicle.id}
                vehicle={vehicle}
                selected={selectedVehicle.id === vehicle.id}
                player={player}
                cleanMoney={cleanMoney}
                barracoLevel={barracoLevel}
                onSelect={() => setSelectedVehicleId(vehicle.id)}
                onContract={() => { setSelectedVehicleId(vehicle.id); setContractVehicle(vehicle); }}
              />
            ))}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {contractVehicle && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-end justify-center bg-black/82 p-2 backdrop-blur-md md:items-center md:p-6"
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
              className="relative max-h-[92svh] w-full max-w-6xl overflow-y-auto rounded-t-[30px] border border-white/12 bg-black shadow-[0_38px_140px_rgba(0,0,0,0.82)] md:rounded-[34px]"
            >
              <div className="absolute inset-0 bg-cover bg-center opacity-38" style={{ backgroundImage: `url(${FUGA_GARAGE_BACKGROUNDS.contract})` }} />
              <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 70% 35%, ${contractVehicle.accent}36, transparent 44%), linear-gradient(90deg, rgba(0,0,0,0.94), rgba(0,0,0,0.58))` }} />

              <div className="relative grid gap-4 p-4 md:grid-cols-[1.1fr_0.9fr] md:p-7">
                <div>
                  <ContractBadge vehicle={contractVehicle} status={getVehicleStatus(player, contractVehicle, cleanMoney, barracoLevel)} />
                  <h3 className="mt-3 text-3xl font-black uppercase tracking-[0.08em] text-white md:mt-4 md:text-5xl">{contractVehicle.name}</h3>
                  <p className="mt-2 text-xs leading-6 text-white/68 md:mt-3 md:text-sm md:leading-7">{contractVehicle.lore}</p>
                  <div className="mt-4"><VehicleStage vehicle={contractVehicle} /></div>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-black/60 p-4 backdrop-blur-2xl md:rounded-[28px] md:p-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.30em] text-white/42 md:text-[10px]">Contrato tático</p>
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
                      <p className="mt-1 text-xs leading-5 text-white/58">A compra entra em <span className="text-white">gang.statSources</span>; o motor de ataque usa essa estatística no snapshot efetivo da gangue.</p>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setContractVehicle(null)}
                      className="flex-1 rounded-2xl border border-white/12 bg-white/[0.08] px-4 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-white/72"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={loadingVehicleId === contractVehicle.id || !getVehicleStatus(player, contractVehicle, cleanMoney, barracoLevel).canBuy}
                      onClick={() => handleBuy(contractVehicle)}
                      className="flex-[1.35] rounded-2xl bg-white px-4 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-black transition hover:brightness-110 disabled:opacity-50"
                    >
                      {loadingVehicleId === contractVehicle.id ? 'Processando...' : getStatusLabel(getVehicleStatus(player, contractVehicle, cleanMoney, barracoLevel), contractVehicle)}
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
