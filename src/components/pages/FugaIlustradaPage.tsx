import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
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

const TIER_LABEL: Record<FugaVehicle['tier'], string> = {
  rua: 'Rua',
  pro: 'Pro',
  blindado: 'Blindado',
  elite: 'Elite',
  phantom: 'Phantom',
  lendario: 'Lendário',
};

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
  if (!status.affordable) return 'Commands Limpo insuficiente';
  return 'Fechar contrato';
}

function StatPill({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/42">{label}</p>
      <p className="mt-1 text-lg font-black text-white" style={accent ? { textShadow: `0 0 18px ${accent}` } : undefined}>{value}</p>
    </div>
  );
}

function VehicleImage({ vehicle, className = '' }: { vehicle: FugaVehicle; className?: string }) {
  return (
    <img
      src={vehicle.image}
      alt={vehicle.name}
      draggable={false}
      className={`select-none object-contain ${className}`}
    />
  );
}

function ContractBadge({ vehicle }: { vehicle: FugaVehicle }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-white/14 bg-black/50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-white/70">
        {TIER_LABEL[vehicle.tier]}
      </span>
      <span className="rounded-full border border-white/14 bg-black/50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-white/70">
        Nv. {vehicle.unlockBarracoLevel}
      </span>
      <span className="rounded-full border border-white/14 bg-black/50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-white/70">
        {vehicle.codename}
      </span>
    </div>
  );
}

function BonusLine({ vehicle }: { vehicle: FugaVehicle }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/38">Estatística permanente</p>
      <p className="mt-1 text-sm font-black text-white">
        <span style={{ color: vehicle.accent }}>+{vehicle.bonusPercent}%</span>{' '}
        {getFugaStatLabel(vehicle.targetStat)} em {getFugaMemberLabel(vehicle.targetType)}
      </p>
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
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      className={`group relative cursor-pointer overflow-hidden rounded-[28px] border bg-black/45 p-3 transition-all duration-300 ${selected ? 'border-white/42' : 'border-white/10 hover:border-white/28'}`}
      style={{ boxShadow: selected ? `0 0 42px ${vehicle.glow}` : '0 20px 55px rgba(0,0,0,0.38)' }}
    >
      <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 45% 12%, ${vehicle.accent}26, transparent 38%), linear-gradient(180deg, rgba(255,255,255,0.055), rgba(0,0,0,0.66))` }} />
      {!status.unlocked && <div className="absolute inset-0 z-20 bg-black/56 backdrop-blur-[1px]" />}

      <div className="relative z-30 flex min-h-[360px] flex-col">
        <div className="flex items-start justify-between gap-3 px-2 pt-2">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.32em] text-white/45">Contrato de fuga</p>
            <h3 className="mt-2 text-xl font-black uppercase tracking-[0.12em] text-white">{vehicle.name}</h3>
          </div>
          <span className="rounded-full border border-white/12 bg-black/45 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.22em] text-white/60">
            {vehicle.codename}
          </span>
        </div>

        <div className="relative mt-2 h-[150px] overflow-hidden rounded-3xl border border-white/8 bg-black/30">
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 65%, ${vehicle.accent}33, transparent 48%)` }} />
          <VehicleImage vehicle={vehicle} className="absolute inset-0 h-full w-full p-1 drop-shadow-[0_22px_30px_rgba(0,0,0,0.80)] transition-transform duration-500 group-hover:scale-[1.04]" />
          {!status.unlocked && (
            <div className="absolute inset-x-4 bottom-4 rounded-full border border-white/15 bg-black/70 px-3 py-2 text-center text-[9px] font-black uppercase tracking-[0.22em] text-white">
              Barraco Nv. {vehicle.unlockBarracoLevel}
            </div>
          )}
        </div>

        <p className="mt-4 line-clamp-2 px-2 text-xs leading-5 text-white/62">{vehicle.headline}</p>
        <div className="mt-4 px-2"><BonusLine vehicle={vehicle} /></div>

        <div className="mt-auto grid grid-cols-1 gap-2 px-2 pt-3">
          <div className="rounded-2xl border border-white/10 bg-black/38 px-4 py-3">
            <p className="text-[8px] font-black uppercase tracking-[0.28em] text-white/34">Valor</p>
            <p className="mt-1 text-base font-black text-white">{formatFugaMoney(vehicle.priceCleanMoney)} Commands Limpo</p>
          </div>
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); status.canBuy ? onContract() : onSelect(); }}
            className={`rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.32em] transition ${status.canBuy ? 'bg-white text-black hover:brightness-110' : status.owned ? 'bg-emerald-400/18 text-emerald-100' : 'bg-white/10 text-white/55'}`}
          >
            {status.owned ? 'Na frota' : status.canBuy ? 'Contratar' : status.unlocked ? 'Inspecionar' : 'Bloqueado'}
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
    const timer = window.setTimeout(() => setMessage(null), 4200);
    return () => window.clearTimeout(timer);
  }, [message]);

  const selectedVehicle = getFugaVehicleById(selectedVehicleId) || FUGA_VEHICLES[0];
  const selectedStatus = getVehicleStatus(player, selectedVehicle, cleanMoney, barracoLevel);

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
        text: `${vehicle.name} entrou para a frota. +${vehicle.bonusPercent}% ${getFugaStatLabel(vehicle.targetStat)} em ${getFugaMemberLabel(vehicle.targetType)} já está ativo para batalha.`,
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

      <main className="relative mx-auto max-w-[1600px] px-3 pb-24 pt-[118px] sm:px-5 md:px-8 md:pt-[146px]">
        <div className="fixed inset-0 bg-cover bg-center opacity-54" style={{ backgroundImage: `url(${FUGA_GARAGE_BACKGROUNDS.hero})` }} />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.50),#030303_78%)]" />
        <div className="fixed inset-0 opacity-45 mix-blend-screen" style={{ background: `radial-gradient(circle at 18% 8%, ${selectedVehicle.accent}55, transparent 30%), radial-gradient(circle at 86% 2%, ${selectedVehicle.accent2}4a, transparent 34%)` }} />

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className={`fixed left-4 right-4 top-[92px] z-[70] mx-auto max-w-2xl rounded-2xl border px-5 py-4 text-sm font-bold shadow-2xl backdrop-blur-xl ${message.type === 'success' ? 'border-emerald-300/25 bg-emerald-500/16 text-emerald-50' : 'border-red-300/25 bg-red-500/16 text-red-50'}`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-black/42 p-4 shadow-[0_35px_120px_rgba(0,0,0,0.70)] backdrop-blur-xl md:p-7">
          <div className="absolute inset-0 opacity-75" style={{ background: `linear-gradient(135deg, ${selectedVehicle.accent}1d, transparent 42%), radial-gradient(circle at 70% 30%, ${selectedVehicle.accent2}22, transparent 40%)` }} />

          <div className="relative grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
            <div className="rounded-[30px] border border-white/10 bg-black/42 p-5 backdrop-blur-xl md:p-7">
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-white/48">Garagem clandestina</p>
              <h1 className="mt-3 text-5xl font-black uppercase leading-[0.90] tracking-[0.08em] text-white md:text-7xl">
                Fuga<br />GTA
              </h1>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-white/68 md:text-base">
                Uma garagem de contratos táticos. Cada máquina é comprada com Commands Limpo, entra na frota e aplica +1% permanente em estatística real da gangue usada no motor de batalha.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatPill label="Limpo" value={formatFugaMoney(cleanMoney)} accent={selectedVehicle.accent} />
                <StatPill label="Frota" value={`${ownedVehicles.length}/${FUGA_MAX_VEHICLES}`} />
                <StatPill label="Barraco" value={`Nv. ${barracoLevel}`} />
                <StatPill label="Bônus ativos" value={`+${ownedVehicles.length}%`} accent={selectedVehicle.accent2} />
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/45">Progresso da frota</p>
                  <p className="text-sm font-black text-white">{progress}%</p>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    style={{ background: `linear-gradient(90deg, ${selectedVehicle.accent}, ${selectedVehicle.accent2})` }}
                  />
                </div>
                {nextLocked && (
                  <p className="mt-3 text-[10px] font-black uppercase tracking-[0.20em] text-white/50">
                    Próxima liberação: <span className="text-white">{nextLocked.name}</span> no barraco Nv. {nextLocked.unlockBarracoLevel}
                  </p>
                )}
              </div>
            </div>

            <motion.div
              key={selectedVehicle.id}
              initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.45 }}
              className="relative overflow-hidden rounded-[30px] border border-white/10 bg-black/55 p-4 md:p-6"
              style={{ boxShadow: `0 0 80px ${selectedVehicle.glow}` }}
            >
              <div className="absolute inset-0 bg-cover bg-center opacity-42" style={{ backgroundImage: `url(${FUGA_GARAGE_BACKGROUNDS.contract})` }} />
              <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 52% 48%, ${selectedVehicle.accent}33, transparent 42%), linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.78))` }} />

              <div className="relative z-10 flex min-h-[540px] flex-col">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <ContractBadge vehicle={selectedVehicle} />
                    <h2 className="mt-4 text-4xl font-black uppercase tracking-[0.10em] text-white md:text-6xl">{selectedVehicle.name}</h2>
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.28em]" style={{ color: selectedVehicle.accent }}>{selectedVehicle.classLabel} · {selectedVehicle.role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectedStatus.canBuy ? setContractVehicle(selectedVehicle) : setMessage({ type: 'error', text: getStatusLabel(player, selectedVehicle, cleanMoney, barracoLevel) })}
                    className={`rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-[0.32em] transition ${selectedStatus.canBuy ? 'bg-white text-black hover:brightness-110' : selectedStatus.owned ? 'bg-emerald-400/20 text-emerald-100' : 'bg-white/10 text-white/55'}`}
                  >
                    {loadingVehicleId === selectedVehicle.id ? 'Processando...' : getStatusLabel(player, selectedVehicle, cleanMoney, barracoLevel)}
                  </button>
                </div>

                <div className="relative mt-5 flex flex-1 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black/38">
                  <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 52% 70%, ${selectedVehicle.accent}33, transparent 50%)` }} />
                  <VehicleImage vehicle={selectedVehicle} className="relative z-10 max-h-[360px] w-full drop-shadow-[0_35px_60px_rgba(0,0,0,0.88)]" />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-[1fr_0.8fr]">
                  <div className="rounded-3xl border border-white/10 bg-black/45 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/38">Dossiê da máquina</p>
                    <p className="mt-2 text-sm leading-6 text-white/70">{selectedVehicle.lore}</p>
                    <p className="mt-3 text-xs leading-5 text-white/45">{selectedVehicle.mechanicNote}</p>
                  </div>
                  <div className="grid gap-3">
                    <BonusLine vehicle={selectedVehicle} />
                    <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/38">Contrato</p>
                      <p className="mt-1 text-lg font-black text-white">{formatFugaMoney(selectedVehicle.priceCleanMoney)} Commands Limpo</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative mt-6 rounded-[34px] border border-white/10 bg-black/42 p-4 shadow-[0_35px_110px_rgba(0,0,0,0.60)] backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.42em] text-white/42">20 contratos · liberação a cada 5 níveis</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.10em] md:text-4xl">Pátio da Fuga</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'unlocked', 'owned', 'locked'] as FilterState[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-full border px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] transition ${filter === item ? 'border-white/45 bg-white text-black' : 'border-white/12 bg-white/7 text-white/62 hover:bg-white/12'}`}
                >
                  {item === 'all' ? 'Todos' : item === 'unlocked' ? 'Liberados' : item === 'owned' ? 'Frota' : 'Bloqueados'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            className="fixed inset-0 z-[90] flex items-end justify-center bg-black/78 p-3 backdrop-blur-md md:items-center md:p-6"
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
              className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/12 bg-black shadow-[0_35px_120px_rgba(0,0,0,0.75)]"
            >
              <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${FUGA_GARAGE_BACKGROUNDS.contract})` }} />
              <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 68% 34%, ${contractVehicle.accent}33, transparent 42%), linear-gradient(90deg, rgba(0,0,0,0.92), rgba(0,0,0,0.55))` }} />

              <div className="relative grid gap-5 p-5 md:grid-cols-[1fr_0.9fr] md:p-7">
                <div>
                  <ContractBadge vehicle={contractVehicle} />
                  <h3 className="mt-4 text-4xl font-black uppercase tracking-[0.10em] text-white md:text-5xl">{contractVehicle.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/66">{contractVehicle.lore}</p>
                  <div className="mt-5"><VehicleImage vehicle={contractVehicle} className="max-h-[260px] w-full drop-shadow-[0_30px_70px_rgba(0,0,0,0.90)]" /></div>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-black/55 p-5 backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/42">Contrato tático</p>
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
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setContractVehicle(null)}
                      className="flex-1 rounded-2xl border border-white/12 bg-white/8 px-4 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-white/70"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={loadingVehicleId === contractVehicle.id}
                      onClick={() => handleBuy(contractVehicle)}
                      className="flex-[1.35] rounded-2xl bg-white px-4 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-black disabled:opacity-50"
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
