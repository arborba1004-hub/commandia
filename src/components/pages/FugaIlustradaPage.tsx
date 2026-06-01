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

function StatPill({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/55 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: accent ? `linear-gradient(135deg, ${accent}22, transparent 62%)` : 'linear-gradient(135deg, rgba(255,255,255,0.10), transparent 62%)' }} />
      <p className="relative text-[9px] font-black uppercase tracking-[0.30em] text-white/42">{label}</p>
      <p
        className="relative mt-1 text-xl font-black tracking-tight text-white md:text-2xl"
        style={accent ? { textShadow: `0 0 20px ${accent}70` } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function VehicleImage({ vehicle, className = '' }: { vehicle: FugaVehicle; className?: string }) {
  return (
    <img
      src={vehicle.image}
      alt={vehicle.name}
      draggable={false}
      loading="lazy"
      className={`select-none object-contain ${className}`}
    />
  );
}

function ContractBadge({ vehicle, status }: { vehicle: FugaVehicle; status?: VehicleStatus }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/74 backdrop-blur-xl">
        {TIER_LABEL[vehicle.tier]}
      </span>
      <span className="rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/74 backdrop-blur-xl">
        LIBERA NV. {vehicle.unlockBarracoLevel}
      </span>
      <span className="rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/74 backdrop-blur-xl">
        {vehicle.codename}
      </span>
      {status?.owned && (
        <span className="rounded-full border border-emerald-300/25 bg-emerald-400/15 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-emerald-100 backdrop-blur-xl">
          NA FROTA
        </span>
      )}
    </div>
  );
}

function BonusLine({ vehicle, compact = false }: { vehicle: FugaVehicle; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-black/45 ${compact ? 'px-3 py-2' : 'px-4 py-3'} shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`}>
      <p className="text-[8px] font-black uppercase tracking-[0.30em] text-white/38">Estatística de batalha</p>
      <p className={`${compact ? 'mt-1 text-xs' : 'mt-2 text-sm'} font-black text-white`}>
        <span style={{ color: vehicle.accent }}>+{vehicle.bonusPercent}%</span>{' '}
        {getFugaStatLabel(vehicle.targetStat)} em {getFugaMemberLabel(vehicle.targetType)}
      </p>
    </div>
  );
}

function TacticalInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/8 py-3 last:border-b-0">
      <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/40">{label}</span>
      <span className="text-right text-xs font-black uppercase tracking-[0.14em] text-white/84">{value}</span>
    </div>
  );
}

function FilterButton({ item, active, onClick }: { item: FilterState; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.24em] transition md:px-5 ${
        active
          ? 'border-white bg-white text-black shadow-[0_0_32px_rgba(255,255,255,0.28)]'
          : 'border-white/14 bg-white/[0.055] text-white/64 hover:border-white/35 hover:bg-white/[0.09]'
      }`}
    >
      {FILTER_LABEL[item]}
    </button>
  );
}

function VehicleStage({ vehicle }: { vehicle: FugaVehicle }) {
  return (
    <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black/45 md:min-h-[420px]">
      <div className="absolute inset-0 opacity-65" style={{ background: `radial-gradient(circle at 50% 70%, ${vehicle.accent}45, transparent 48%), radial-gradient(circle at 48% 20%, ${vehicle.accent2}24, transparent 40%)` }} />
      <div className="absolute bottom-7 left-1/2 h-[46px] w-[78%] -translate-x-1/2 rounded-full blur-2xl" style={{ background: `radial-gradient(ellipse, ${vehicle.accent}40, transparent 70%)` }} />
      <div className="absolute bottom-8 h-px w-[76%] bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <VehicleImage
        vehicle={vehicle}
        className="relative z-10 max-h-[285px] w-full px-2 drop-shadow-[0_40px_72px_rgba(0,0,0,0.96)] transition-transform duration-1000 hover:scale-[1.035] md:max-h-[390px]"
      />
    </div>
  );
}

function GarageVehicleCard({
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
      whileHover={{ scale: 1.012, y: -2 }}
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      className={`group relative cursor-pointer overflow-hidden rounded-[30px] border bg-black/62 p-3 transition-all duration-500 ${selected ? 'border-white/55' : 'border-white/10 hover:border-white/30'}`}
      style={{ boxShadow: selected ? `0 0 62px ${vehicle.glow}, inset 0 0 42px rgba(255,255,255,0.05)` : '0 22px 70px rgba(0,0,0,0.55)' }}
    >
      <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 42% 12%, ${vehicle.accent}2f, transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.065), rgba(0,0,0,0.78))` }} />
      {!status.unlocked && (
        <div className="absolute inset-0 z-20 bg-black/68 backdrop-blur-[2px]" />
      )}

      <div className="relative z-30 flex min-h-[380px] flex-col">
        <div className="flex items-start justify-between gap-3 px-2 pt-2">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.34em] text-white/44">Contrato de fuga</p>
            <h3 className="mt-2 text-xl font-black uppercase tracking-[0.10em] text-white">{vehicle.name}</h3>
          </div>
          <span className="rounded-full border border-white/14 bg-black/55 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.24em] text-white/66">
            {vehicle.codename}
          </span>
        </div>

        <div className="relative mt-3 h-[156px] overflow-hidden rounded-[24px] border border-white/10 bg-black/40">
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 68%, ${vehicle.accent}3d, transparent 52%)` }} />
          <VehicleImage vehicle={vehicle} className="absolute inset-0 h-full w-full p-2 drop-shadow-[0_24px_34px_rgba(0,0,0,0.86)] transition-transform duration-700 group-hover:scale-[1.06]" />
          {!status.unlocked && (
            <div className="absolute inset-0 flex items-end justify-center p-4">
              <div className="rounded-full border border-white/15 bg-black/75 px-4 py-2 text-center text-[9px] font-black uppercase tracking-[0.24em] text-white">
                Libera no Barraco Nv. {vehicle.unlockBarracoLevel}
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 line-clamp-2 px-2 text-xs leading-5 text-white/62">{vehicle.headline}</p>
        <div className="mt-4 px-2"><BonusLine vehicle={vehicle} compact /></div>

        <div className="mt-auto grid gap-2 px-2 pt-4">
          <div className="rounded-2xl border border-white/10 bg-black/45 px-4 py-3">
            <p className="text-[8px] font-black uppercase tracking-[0.28em] text-white/34">Valor do contrato</p>
            <p className="mt-1 text-base font-black text-white">{formatFugaMoney(vehicle.priceCleanMoney)} Limpo</p>
          </div>
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); status.canBuy ? onContract() : onSelect(); }}
            className={`rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.30em] transition ${
              status.canBuy
                ? 'bg-white text-black hover:tracking-[0.36em] hover:brightness-110'
                : status.owned
                ? 'border border-emerald-300/25 bg-emerald-400/15 text-emerald-100'
                : 'bg-white/[0.08] text-white/58'
            }`}
          >
            {status.owned ? 'Na frota' : status.canBuy ? 'Fechar contrato' : status.unlocked ? 'Inspecionar' : 'Bloqueado'}
          </button>
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
      <FugaSmokeFX />

      <main className="relative z-20 mx-auto max-w-[1680px] px-3 pb-24 pt-[116px] sm:px-5 md:px-8 md:pt-[146px]">
        <div className="fixed inset-0 z-0 bg-cover bg-center opacity-58" style={{ backgroundImage: `url(${FUGA_GARAGE_BACKGROUNDS.hero})` }} />
        <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.16),transparent_30%),linear-gradient(180deg,rgba(0,0,0,0.48),#020202_78%)]" />
        <div className="fixed inset-0 z-0 opacity-55 mix-blend-screen" style={{ background: `radial-gradient(circle at 18% 10%, ${selectedVehicle.accent}5a, transparent 34%), radial-gradient(circle at 86% 4%, ${selectedVehicle.accent2}48, transparent 36%)` }} />
        <div className="fixed inset-x-0 bottom-0 z-0 h-[45vh] bg-[linear-gradient(0deg,#000_0%,rgba(0,0,0,0.64)_55%,transparent_100%)]" />

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

        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-black/52 p-4 shadow-[0_38px_140px_rgba(0,0,0,0.78)] backdrop-blur-2xl md:p-7">
          <div className="absolute inset-0 opacity-85" style={{ background: `linear-gradient(135deg, ${selectedVehicle.accent}20, transparent 44%), radial-gradient(circle at 74% 30%, ${selectedVehicle.accent2}26, transparent 42%)` }} />
          <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-white/35 to-transparent" />

          <div className="relative grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-stretch">
            <div className="rounded-[32px] border border-white/10 bg-black/46 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl md:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.46em] text-white/48">Garagem clandestina · Pátio privado</p>
              <h1 className="mt-4 text-5xl font-black uppercase leading-[0.88] tracking-[0.055em] text-white sm:text-6xl md:text-7xl">
                Garagem<br />da Fuga
              </h1>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
                Contratos táticos de frota para fuga, perseguição e guerra de rua. Cada compra usa Commands Limpo, entra no inventário e aplica +1% permanente em estatística real da gangue usada na batalha.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatPill label="Commands limpo" value={formatFugaMoney(cleanMoney)} accent={selectedVehicle.accent} />
                <StatPill label="Frota atual" value={`${ownedVehicles.length}/${FUGA_MAX_VEHICLES}`} />
                <StatPill label="Barraco" value={`Nv. ${barracoLevel}`} />
                <StatPill label="Bônus ativos" value={`+${ownedVehicles.length}%`} accent={selectedVehicle.accent2} />
              </div>

              <div className="mt-6 rounded-[28px] border border-white/10 bg-black/46 p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/45">Progresso da frota</p>
                  <p className="text-sm font-black text-white">{progress}%</p>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/[0.08]">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    style={{ background: `linear-gradient(90deg, ${selectedVehicle.accent}, ${selectedVehicle.accent2})` }}
                  />
                </div>
                {nextLocked && (
                  <p className="mt-3 text-[10px] font-black uppercase tracking-[0.20em] text-white/52">
                    Próxima liberação: <span className="text-white">{nextLocked.name}</span> no barraco Nv. {nextLocked.unlockBarracoLevel}
                  </p>
                )}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <StatPill label="Liberados" value={String(stats.unlocked)} accent={selectedVehicle.accent} />
                <StatPill label="Na frota" value={String(stats.owned)} accent="#34d399" />
                <StatPill label="Bloqueados" value={String(stats.locked)} />
              </div>
            </div>

            <motion.div
              key={selectedVehicle.id}
              initial={{ opacity: 0, scale: 0.965, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.46 }}
              className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:p-6"
              style={{ boxShadow: `0 0 96px ${selectedVehicle.glow}` }}
            >
              <div className="absolute inset-0 bg-cover bg-center opacity-44" style={{ backgroundImage: `url(${FUGA_GARAGE_BACKGROUNDS.contract})` }} />
              <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 52% 48%, ${selectedVehicle.accent}38, transparent 45%), linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.82))` }} />

              <div className="relative z-10 flex min-h-[610px] flex-col">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <ContractBadge vehicle={selectedVehicle} status={selectedStatus} />
                    <h2 className="mt-4 text-4xl font-black uppercase tracking-[0.08em] text-white md:text-6xl">{selectedVehicle.name}</h2>
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.28em]" style={{ color: selectedVehicle.accent }}>{selectedVehicle.classLabel} · {selectedVehicle.role}</p>
                  </div>
                  <button
                    type="button"
                    disabled={loadingVehicleId === selectedVehicle.id}
                    onClick={() => selectedStatus.canBuy ? setContractVehicle(selectedVehicle) : setMessage({ type: selectedStatus.owned ? 'success' : 'error', text: getStatusLabel(selectedStatus, selectedVehicle) })}
                    className={`rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-[0.30em] transition disabled:opacity-50 ${selectedStatus.canBuy ? 'bg-white text-black hover:brightness-110' : selectedStatus.owned ? 'border border-emerald-300/25 bg-emerald-400/16 text-emerald-100' : 'bg-white/[0.09] text-white/60'}`}
                  >
                    {loadingVehicleId === selectedVehicle.id ? 'Processando...' : getStatusLabel(selectedStatus, selectedVehicle)}
                  </button>
                </div>

                <div className="mt-5 flex-1"><VehicleStage vehicle={selectedVehicle} /></div>

                <div className="mt-5 grid gap-3 md:grid-cols-[1fr_0.78fr]">
                  <div className="rounded-[26px] border border-white/10 bg-black/50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/38">Dossiê da máquina</p>
                    <p className="mt-2 text-sm leading-6 text-white/72">{selectedVehicle.lore}</p>
                    <p className="mt-3 text-xs leading-5 text-white/45">{selectedVehicle.mechanicNote}</p>
                  </div>
                  <div className="grid gap-3">
                    <BonusLine vehicle={selectedVehicle} />
                    <div className="rounded-2xl border border-white/10 bg-black/45 px-4 py-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/38">Contrato</p>
                      <p className="mt-1 text-lg font-black text-white">{formatFugaMoney(selectedVehicle.priceCleanMoney)} Commands Limpo</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative mt-6 rounded-[36px] border border-white/10 bg-black/52 p-4 shadow-[0_35px_118px_rgba(0,0,0,0.68)] backdrop-blur-2xl md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.42em] text-white/42">20 contratos · liberação a cada 5 níveis · estatísticas reais</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.08em] md:text-4xl">Pátio da Fuga</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:overflow-visible">
              {(['all', 'unlocked', 'owned', 'locked'] as FilterState[]).map((item) => (
                <FilterButton key={item} item={item} active={filter === item} onClick={() => setFilter(item)} />
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredVehicles.map((vehicle) => (
              <GarageVehicleCard
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
            className="fixed inset-0 z-[90] flex items-end justify-center bg-black/82 p-3 backdrop-blur-md md:items-center md:p-6"
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
                  <div className="mt-5"><VehicleStage vehicle={contractVehicle} /></div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/60 p-5 backdrop-blur-2xl">
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
                      <p className="mt-1 text-xs leading-5 text-white/58">O backend salva esta compra em <span className="text-white">gang.statSources</span>; o motor de ataque usa o snapshot efetivo da gangue na resolução.</p>
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
