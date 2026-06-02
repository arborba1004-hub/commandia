import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePlayerStore } from '@/store/playerStore';
import { getSocket } from '@/socket';
import {
  QG_MEMBER_LABELS,
  QG_MEMBER_TYPES,
  appointQgRole,
  formatQGClock,
  formatQGDuration,
  formatQGNumber,
  formatQGTimeLeft,
  getQgEventState,
  sendQgMarch,
  type QgEventState,
  type QgLocationKey,
  type QgLocationState,
  type QgMemberType,
  type QgSelection,
} from '@/api/qgEventApi';
import {
  QG_STATUS_DESCRIPTIONS,
  QG_STATUS_LABELS,
  describeQgOutcome,
  getQGLocationTone,
  getQGStatusTheme,
} from '@/data/qgEventPresentation';

type ToastState = { type: 'success' | 'error'; text: string } | null;

const DEFAULT_SELECTION: Record<QgMemberType, number> = {
  capanga: 0,
  frente: 0,
  executor: 0,
  assassino: 0,
  muralha: 0,
  certeiro: 0,
  motorista: 0,
  nitro: 0,
};

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/65 px-4 py-3 backdrop-blur-xl">
      <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 0% 0%, ${accent || '#ef4444'}26, transparent 55%)` }} />
      <div className="relative">
        <p className="text-[10px] font-black uppercase tracking-[3px] text-white/42">{label}</p>
        <p className="mt-1 text-xl font-black text-white md:text-2xl">{value}</p>
        {sub && <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-white/42">{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const theme = getQGStatusTheme(status);
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-4 py-2 text-[11px] font-black uppercase tracking-[3px] text-white backdrop-blur-xl"
      style={{ boxShadow: `0 0 32px ${theme.glow}` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: theme.accent, boxShadow: `0 0 16px ${theme.accent}` }} />
      {QG_STATUS_LABELS[status || 'closed'] || 'Tomada do QG'}
    </div>
  );
}

function LocationNode({
  location,
  selected,
  mine,
  onClick,
}: {
  location: QgLocationState;
  selected: boolean;
  mine: boolean;
  onClick: () => void;
}) {
  const tone = getQGLocationTone(location.key);
  const filled = location.capacity > 0 ? Math.min(100, (location.garrisonCount / location.capacity) * 100) : 0;
  const hostile = location.hostileToQG;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-3xl border p-4 text-left transition-all ${selected ? 'border-white/70 bg-white/10' : 'border-white/12 bg-black/70 hover:border-white/35'} ${hostile ? 'ring-1 ring-red-400/40' : ''}`}
      style={{ boxShadow: selected ? `0 0 50px ${tone.accent}45` : `0 20px 60px rgba(0,0,0,.35)` }}
    >
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 20% 0%, ${tone.accent}2b, transparent 56%)` }} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl" style={{ color: tone.accent }}>{tone.icon}</span>
            <p className="text-xs font-black uppercase tracking-[3px] text-white/45">{tone.label}</p>
          </div>
          <h3 className="mt-2 text-lg font-black uppercase tracking-tight text-white">{location.shortName || location.name}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${mine ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300' : location.occupantFactionId ? 'border-red-400/40 bg-red-500/10 text-red-200' : 'border-white/15 bg-white/5 text-white/55'}`}>
          {mine ? 'Sua facção' : location.occupantFactionId ? 'Ocupado' : 'Livre'}
        </span>
      </div>

      <div className="relative mt-4 rounded-2xl border border-white/10 bg-black/45 p-3">
        <p className="truncate text-sm font-black text-white">
          {location.occupantFactionId ? `[${location.occupantFactionTag}] ${location.occupantFactionName}` : 'Sem ocupante'}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold uppercase tracking-widest text-white/45">
          <span>Gangue {formatQGNumber(location.garrisonCount)}</span>
          <span className="text-right">Poder {formatQGNumber(location.garrisonPower)}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${filled}%`, background: `linear-gradient(90deg, ${tone.accent}, #fff)` }} />
        </div>
        {location.key === 'qg' && location.occupantFactionId && (
          <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-yellow-200/80">
            Segurando há {formatQGDuration(location.currentHoldMs)}
          </p>
        )}
        {hostile && (
          <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-red-200">
            CT inimigo causando desgaste no QG a cada 30s
          </p>
        )}
      </div>
    </motion.button>
  );
}

function TacticalMap({
  state,
  selectedKey,
  onSelect,
}: {
  state: QgEventState | null;
  selectedKey: QgLocationKey;
  onSelect: (key: QgLocationKey) => void;
}) {
  const event = state?.event;
  const locations = event?.locations || [];
  const qg = locations.find((item) => item.key === 'qg');
  const cts = locations.filter((item) => item.kind === 'ct');
  const myFactionId = state?.eligibility?.factionId;

  if (!qg) return null;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/75 p-4 shadow-2xl backdrop-blur-2xl md:p-6">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:34px_34px] opacity-45" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(250,204,21,0.16),transparent_36%),radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_82%_82%,rgba(239,68,68,0.12),transparent_30%)]" />
      <div className="relative grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid grid-cols-2 gap-3">
          {cts.map((location) => (
            <LocationNode
              key={location.key}
              location={location}
              selected={selectedKey === location.key}
              mine={Boolean(myFactionId && location.occupantFactionId === myFactionId)}
              onClick={() => onSelect(location.key)}
            />
          ))}
        </div>

        <button
          onClick={() => onSelect('qg')}
          className={`relative min-h-[360px] overflow-hidden rounded-[2rem] border p-5 text-left transition-all ${selectedKey === 'qg' ? 'border-yellow-200/70 bg-yellow-500/10' : 'border-white/12 bg-black/70 hover:border-yellow-200/40'}`}
          style={{ boxShadow: selectedKey === 'qg' ? '0 0 80px rgba(250,204,21,.30)' : undefined }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.25),transparent_48%)]" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
            className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-yellow-200/20"
          />
          <div className="relative z-10 flex h-full min-h-[320px] flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[4px] text-yellow-200/60">Prédio central</p>
                <h2 className="mt-2 text-4xl font-black uppercase tracking-tight text-white md:text-6xl">QG</h2>
                <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-white/60">
                  Segure este prédio por 8 horas seguidas. Os CTs inimigos drenam a guarnição do QG a cada 30 segundos.
                </p>
              </div>
              <span className="rounded-full border border-yellow-200/25 bg-yellow-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[3px] text-yellow-100">
                objetivo principal
              </span>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/55 p-4 backdrop-blur-xl">
              <p className="truncate text-xl font-black text-white">
                {qg.occupantFactionId ? `[${qg.occupantFactionTag}] ${qg.occupantFactionName}` : 'QG vazio'}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Guarnição" value={formatQGNumber(qg.garrisonCount)} />
                <StatCard label="Capacidade" value={formatQGNumber(qg.capacity)} />
                <StatCard label="Poder" value={formatQGNumber(qg.garrisonPower)} />
                <StatCard label="Ocupação" value={formatQGDuration(qg.currentHoldMs)} accent="#facc15" />
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

function Leaderboard({ state }: { state: QgEventState | null }) {
  const rows = state?.event?.leaderboard || [];
  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/70 p-4 shadow-2xl backdrop-blur-2xl md:p-5">
      <h3 className="text-lg font-black uppercase tracking-tight text-white">Ranking da tomada</h3>
      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/40">Prioridade: maior ocupação contínua do QG</p>
      <div className="mt-4 space-y-3">
        {rows.length === 0 && <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/55">Nenhuma facção pontuou ainda.</p>}
        {rows.slice(0, 8).map((item) => (
          <div key={item.factionId} className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/70 text-lg font-black text-white">
              {item.rank === 1 ? '👑' : item.rank}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black uppercase text-white">[{item.factionTag}] {item.factionName}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                QG {formatQGDuration(item.qgMaxContinuousHoldMs)} • CTs {item.ctCaptures} • dano {formatQGNumber(item.ctDamageDealt)}
              </p>
            </div>
            <p className="text-right text-xl font-black text-white">{formatQGNumber(item.contribution)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectionPanel({
  state,
  selectedLocation,
  selection,
  setSelection,
  submitting,
  onSend,
}: {
  state: QgEventState | null;
  selectedLocation?: QgLocationState;
  selection: Record<QgMemberType, number>;
  setSelection: (next: Record<QgMemberType, number>) => void;
  submitting: boolean;
  onSend: () => void;
}) {
  const player = usePlayerStore((s) => s.player);
  const available = useMemo(() => {
    const out: Record<QgMemberType, number> = { ...DEFAULT_SELECTION };
    const members = player?.gang?.members || player?.gangMembers || [];
    for (const member of members as any[]) {
      if (member?.status !== 'ativo') continue;
      const type = QG_MEMBER_TYPES.includes(member.type) ? member.type as QgMemberType : 'capanga';
      out[type] += 1;
    }
    return out;
  }, [player]);

  const selectedTotal = Object.values(selection).reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0);
  const canMarch = Boolean(state?.eligibility?.canMarch && selectedLocation && selectedTotal > 0 && !submitting);

  const quickFill = (ratio: number) => {
    const next: Record<QgMemberType, number> = { ...DEFAULT_SELECTION };
    const cap = selectedLocation?.capacity && selectedLocation.occupantFactionId === state?.eligibility.factionId
      ? Math.max(0, selectedLocation.capacity - selectedLocation.garrisonCount)
      : state?.eligibility?.marchCapacity || 0;
    let remaining = Math.max(1, Math.floor(cap * ratio));
    for (const type of QG_MEMBER_TYPES) {
      const take = Math.min(available[type], Math.ceil(remaining / (QG_MEMBER_TYPES.length - QG_MEMBER_TYPES.indexOf(type))));
      next[type] = take;
      remaining -= take;
      if (remaining <= 0) break;
    }
    setSelection(next);
  };

  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/75 p-4 shadow-2xl backdrop-blur-2xl md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[3px] text-white/40">Enviar gangue para</p>
          <h3 className="mt-1 text-2xl font-black uppercase tracking-tight text-white">{selectedLocation?.shortName || selectedLocation?.name || 'QG'}</h3>
        </div>
        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/55">
          {selectedTotal}/{formatQGNumber(state?.eligibility?.marchCapacity || 0)}
        </span>
      </div>

      {state?.eligibility?.reason && (
        <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-bold text-red-100">{state.eligibility.reason}</p>
      )}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => quickFill(0.15)} className="shrink-0 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-white/70">15%</button>
        <button onClick={() => quickFill(0.35)} className="shrink-0 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-white/70">35%</button>
        <button onClick={() => quickFill(0.65)} className="shrink-0 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-white/70">65%</button>
        <button onClick={() => setSelection({ ...DEFAULT_SELECTION })} className="shrink-0 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-white/70">Limpar</button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {QG_MEMBER_TYPES.map((type) => {
          const max = available[type] || 0;
          return (
            <label key={type} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black uppercase text-white">{QG_MEMBER_LABELS[type]}</span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">ativos {formatQGNumber(max)}</span>
              </div>
              <input
                type="number"
                min={0}
                max={max}
                value={selection[type] || 0}
                onChange={(e) => setSelection({ ...selection, [type]: Math.max(0, Math.min(max, Math.floor(Number(e.target.value || 0)))) })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-right text-base font-black text-white outline-none focus:border-white/40"
              />
            </label>
          );
        })}
      </div>

      <button
        onClick={onSend}
        disabled={!canMarch}
        className="mt-5 w-full rounded-2xl bg-white px-5 py-4 text-sm font-black uppercase tracking-[3px] text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? 'Enviando...' : selectedLocation?.occupantFactionId && selectedLocation.occupantFactionId !== state?.eligibility.factionId ? 'Atacar ocupante' : selectedLocation?.occupantFactionId ? 'Reforçar posição' : 'Ocupar posição'}
      </button>
    </div>
  );
}

export default function TomadaQGPage() {
  const hydratePlayerFromServer = usePlayerStore((s) => s.hydratePlayerFromServer);
  const [state, setState] = useState<QgEventState | null>(null);
  const [selectedKey, setSelectedKey] = useState<QgLocationKey>('qg');
  const [selection, setSelection] = useState<Record<QgMemberType, number>>({ ...DEFAULT_SELECTION });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [, forceTick] = useState(0);

  const status = state?.event?.status || 'scheduled';
  const theme = getQGStatusTheme(status);
  const selectedLocation = state?.event?.locations?.find((item) => item.key === selectedKey) || state?.event?.qg;
  const qg = state?.event?.qg;
  const myRank = state?.event?.myParticipant?.rank;
  const leader = state?.event?.leaderboard?.[0];

  const load = useCallback(async () => {
    const payload = await getQgEventState();
    setState(payload);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    load()
      .catch((error) => setToast({ type: 'error', text: error?.message || 'Erro ao carregar Tomada do QG' }))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [load]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleUpdate = (payload: any) => {
      setState((current) => ({
        ...(current || payload),
        config: payload?.config || current?.config,
        event: payload?.event || current?.event,
      } as QgEventState));
    };
    const handlePlayerUpdate = (payload: any) => {
      if (payload?.player) hydratePlayerFromServer(payload.player);
    };
    socket.on('qg:eventUpdated', handleUpdate);
    socket.on('playerUpdate', handlePlayerUpdate);
    return () => {
      socket.off('qg:eventUpdated', handleUpdate);
      socket.off('playerUpdate', handlePlayerUpdate);
    };
  }, [hydratePlayerFromServer]);

  useEffect(() => {
    const interval = window.setInterval(() => forceTick((x) => x + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!selectedLocation || submitting) return;
    setSubmitting(true);
    try {
      const payload = await sendQgMarch(selectedLocation.key, selection as QgSelection);
      setState(payload);
      setSelection({ ...DEFAULT_SELECTION });
      setToast({ type: 'success', text: describeQgOutcome(payload.marchResult?.outcome) });
    } catch (error: any) {
      setToast({ type: 'error', text: error?.message || 'Erro ao enviar gangue' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoAppoint = async () => {
    const role = state?.config?.mandateRoles?.[0];
    const candidate = state?.event?.topParticipants?.find((p) => p.factionId === state?.event?.winnerFactionId);
    if (!role || !candidate) return;
    try {
      const payload = await appointQgRole(role.id, candidate.playerId);
      setState(payload);
      setToast({ type: 'success', text: 'Cargo atualizado.' });
    } catch (error: any) {
      setToast({ type: 'error', text: error?.message || 'Erro ao nomear cargo' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="flex min-h-screen items-center justify-center pt-[120px]"><LoadingSpinner size="lg" /></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
      <Header />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,.16),transparent_38%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,.12),transparent_30%),linear-gradient(180deg,#050505_0%,#0b0710_48%,#030303_100%)]" />
      <div className="fixed inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            className={`fixed left-1/2 top-24 z-[90] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border px-5 py-4 text-center text-sm font-bold shadow-2xl backdrop-blur-2xl ${toast.type === 'success' ? 'border-emerald-400/30 bg-emerald-900/80 text-emerald-50' : 'border-red-400/30 bg-red-950/80 text-red-50'}`}
            onClick={() => setToast(null)}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative mx-auto max-w-[1700px] px-4 pb-20 pt-[120px] sm:px-6 md:pt-[150px]">
        <section className="rounded-[2rem] border border-white/10 bg-black/70 p-5 shadow-2xl backdrop-blur-2xl md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <StatusBadge status={status} />
              <h1 className="mt-5 text-4xl font-black uppercase leading-none tracking-[-0.05em] text-white sm:text-5xl md:text-7xl">
                Tomada do <span className={`bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>QG</span>
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-relaxed text-white/62 md:text-base">
                O QG central é a Prefeitura do Commandia. A facção precisa segurar o prédio por 8 horas seguidas. Os 4 CTs reais do mapa funcionam como fortalezas: se forem inimigos do dono do QG, drenam a guarnição a cada 30 segundos.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:min-w-[680px]">
              <StatCard label="Começa" value={formatQGClock(state?.event?.startsAt)} accent={theme.accent} />
              <StatCard label="Restante" value={status === 'scheduled' ? formatQGTimeLeft(state?.event?.startsAt) : status === 'active' ? formatQGTimeLeft(state?.event?.endsAt) : status === 'appointment' ? formatQGTimeLeft(state?.event?.appointmentEndsAt) : formatQGTimeLeft(state?.event?.mandateEndsAt)} accent={theme.accent2} />
              <StatCard label="QG atual" value={qg?.occupantFactionTag ? `[${qg.occupantFactionTag}]` : 'Livre'} sub={qg?.occupantFactionName || ''} />
              <StatCard label="Minha posição" value={myRank ? `#${myRank}` : '--'} sub={state?.eligibility?.factionTag || 'sem facção'} />
            </div>
          </div>
          <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-semibold text-white/55">
            {QG_STATUS_DESCRIPTIONS[status] || 'Dispute o QG e os CTs para conquistar o mandato.'}
          </p>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <TacticalMap state={state} selectedKey={selectedKey} onSelect={setSelectedKey} />
            <div className="grid gap-6 lg:grid-cols-2">
              <Leaderboard state={state} />
              <div className="rounded-[2rem] border border-white/10 bg-black/70 p-4 shadow-2xl backdrop-blur-2xl md:p-5">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">Mandato e cargos</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/40">Líder do Complexo, Sub Líder, Segurança e Tesoureiro</p>
                <div className="mt-4 space-y-3">
                  {(state?.event?.mandate?.roles || state?.config?.mandateRoles || []).map((role: any) => (
                    <div key={role.roleId || role.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black uppercase text-white">{role.title}</p>
                          <p className="mt-1 text-xs text-white/50">{role.playerName || role.description || 'A definir'}</p>
                        </div>
                        {role.percent && <span className="rounded-full border border-white/15 px-2 py-1 text-[10px] font-black text-white/50">bônus</span>}
                      </div>
                    </div>
                  ))}
                </div>
                {state?.eligibility?.canAppoint && (
                  <button onClick={handleAutoAppoint} className="mt-4 w-full rounded-2xl border border-yellow-300/30 bg-yellow-400/10 px-4 py-3 text-xs font-black uppercase tracking-widest text-yellow-100">
                    Nomeação rápida do Líder do Complexo
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <SelectionPanel
              state={state}
              selectedLocation={selectedLocation}
              selection={selection}
              setSelection={setSelection}
              submitting={submitting}
              onSend={handleSend}
            />
            <div className="rounded-[2rem] border border-white/10 bg-black/70 p-4 shadow-2xl backdrop-blur-2xl md:p-5">
              <h3 className="text-lg font-black uppercase tracking-tight text-white">Regras essenciais</h3>
              <ul className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-white/58">
                <li><b className="text-white">1.</b> Evento automático às 22h a cada 72 horas.</li>
                <li><b className="text-white">2.</b> O QG precisa ser ocupado por 8 horas seguidas.</li>
                <li><b className="text-white">3.</b> CT inimigo do dono do QG causa desgaste a cada 30 segundos.</li>
                <li><b className="text-white">4.</b> Vencedor recebe janela de nomeação e mandato até a próxima Tomada.</li>
                <li><b className="text-white">5.</b> Bônus do mandato entram em <b className="text-white">gang.statSources</b> e valem na batalha real.</li>
              </ul>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-black/70 p-4 shadow-2xl backdrop-blur-2xl md:p-5">
              <h3 className="text-lg font-black uppercase tracking-tight text-white">Top operadores</h3>
              <div className="mt-4 space-y-2">
                {(state?.event?.topParticipants || []).slice(0, 8).map((p) => (
                  <div key={p.playerId} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">#{p.rank} {p.playerName}</p>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">[{p.factionTag}] perdas {p.troopsLost}</p>
                    </div>
                    <p className="text-sm font-black text-white">{formatQGNumber(p.contribution)}</p>
                  </div>
                ))}
                {(!state?.event?.topParticipants || state.event.topParticipants.length === 0) && <p className="text-sm text-white/50">Nenhum operador entrou ainda.</p>}
              </div>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
}
