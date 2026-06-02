import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePlayerStore } from '@/store/playerStore';
import { getSocket } from '@/socket';
import {
  formatQGNumber,
  formatQGTimeLeft,
  getQgEventState,
  joinQgEvent,
  settleQgEvent,
  startQgEvent,
  submitQgEventAction,
  type QgEventAction,
  type QgEventFactionScore,
  type QgEventState,
} from '@/api/qgEventApi';
import {
  QG_PHASE_DESCRIPTIONS,
  QG_PHASE_LABELS,
  getQGActionTone,
  getQGPhaseTheme,
} from '@/data/qgEventPresentation';

type ToastState = { type: 'success' | 'error'; text: string } | null;

function timeText(value?: string | null) {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getEventProgress(state: QgEventState | null) {
  const event = state?.event;
  if (!event) return 0;
  const start = new Date(event.startsAt).getTime();
  const end = new Date(event.endsAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.max(0, Math.min(100, ((Date.now() - start) / (end - start)) * 100));
}

function StatusCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/65 px-4 py-3 shadow-2xl backdrop-blur-xl">
      <div className="absolute inset-0 opacity-50" style={{ background: `radial-gradient(circle at 0% 0%, ${accent || '#ef4444'}28, transparent 58%)` }} />
      <div className="relative">
        <p className="text-[10px] font-black uppercase tracking-[3px] text-white/45">{label}</p>
        <p className="mt-1 text-2xl font-black text-white">{value}</p>
        {sub && <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-white/40">{sub}</p>}
      </div>
    </div>
  );
}

function PhaseBadge({ state }: { state: QgEventState | null }) {
  const phase = state?.event?.phase || state?.phase || 'finished';
  const theme = getQGPhaseTheme(phase);
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-4 py-2 text-xs font-black uppercase tracking-[3px] text-white shadow-2xl backdrop-blur-xl"
      style={{ boxShadow: `0 0 34px ${theme.glow}` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: theme.accent, boxShadow: `0 0 18px ${theme.accent}` }} />
      {QG_PHASE_LABELS[phase] || 'Sem evento'}
    </div>
  );
}

function LeaderboardRow({ item }: { item: QgEventFactionScore }) {
  const medal = item.rank === 1 ? '👑' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `${item.rank}`;
  return (
    <div className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/75 text-lg font-black text-white">{medal}</div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black uppercase tracking-wide text-white">[{item.factionTag}] {item.factionName}</p>
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">{item.participants} operadores • calor {formatQGNumber(item.heat)}</p>
      </div>
      <p className="text-right text-xl font-black text-white">{formatQGNumber(item.score)}</p>
    </div>
  );
}

function ActionButton({
  action,
  state,
  joined,
  disabled,
  onClick,
}: {
  action: QgEventAction;
  state: QgEventState | null;
  joined: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const tone = getQGActionTone(action.id);
  const phase = state?.event?.phase;
  const myCooldown = state?.event?.myParticipant?.cooldowns?.[action.id];
  const cooldownMs = myCooldown ? new Date(myCooldown).getTime() - Date.now() : 0;
  const onCooldown = cooldownMs > 0;
  const lockedByPhase = Boolean(action.finalOnly && phase !== 'final');
  const isDisabled = disabled || !joined || onCooldown || lockedByPhase;

  return (
    <motion.button
      whileTap={{ scale: isDisabled ? 1 : 0.97 }}
      disabled={isDisabled}
      onClick={onClick}
      className={`relative min-h-[132px] overflow-hidden rounded-3xl border p-4 text-left transition-all ${isDisabled ? 'border-white/8 bg-white/[0.035] opacity-55' : 'border-white/15 bg-black/70 hover:border-white/35'}`}
      style={!isDisabled ? { boxShadow: `0 0 36px ${tone.color}22` } : undefined}
    >
      <div className="absolute inset-0 opacity-60" style={{ background: `radial-gradient(circle at 15% 15%, ${tone.color}2b, transparent 60%)` }} />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/70 text-2xl" style={{ color: tone.color }}>
            {action.icon || tone.icon}
          </div>
          <div className="rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/55">
            +{action.points} pts
          </div>
        </div>
        <h3 className="mt-3 text-base font-black uppercase tracking-wide text-white">{action.label}</h3>
        <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-white/55">{action.description}</p>
        <p className="mt-auto pt-3 text-[10px] font-black uppercase tracking-[2px] text-white/40">
          {lockedByPhase ? 'Libera na reta final' : onCooldown ? `Cooldown ${Math.ceil(cooldownMs / 1000)}s` : joined ? 'Executar ação' : 'Entre no evento'}
        </p>
      </div>
    </motion.button>
  );
}

function QgSchematic({ state }: { state: QgEventState | null }) {
  const phase = state?.event?.phase || 'war';
  const theme = getQGPhaseTheme(phase);
  const progress = getEventProgress(state);

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/80 shadow-2xl">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:34px_34px] opacity-50" />
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${theme.accent}35, transparent 45%), radial-gradient(circle at 70% 20%, ${theme.accent2}22, transparent 35%)` }} />
      <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/70 shadow-[0_0_80px_rgba(0,0,0,0.95)]" />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}
        className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/20"
      />
      <motion.div
        animate={{ scale: [1, 1.04, 1], opacity: [0.75, 1, 0.75] }}
        transition={{ repeat: Infinity, duration: 3.2 }}
        className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl border border-white/20 bg-black text-center"
        style={{ boxShadow: `0 0 90px ${theme.glow}` }}
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-[4px] text-white/40">QG</p>
          <p className="mt-1 text-4xl font-black text-white">{Math.round(progress)}%</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[2px] text-white/45">controle</p>
        </div>
      </motion.div>

      {[0, 1, 2, 3].map((index) => {
        const angle = index * 90 + 45;
        return (
          <div
            key={index}
            className="absolute h-3 w-3 rounded-full"
            style={{
              left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * 138}px)`,
              top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * 138}px)`,
              background: theme.accent,
              boxShadow: `0 0 22px ${theme.accent}`,
            }}
          />
        );
      })}

      <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/70 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[3px] text-white/40">Janela da operação</p>
            <p className="mt-1 text-sm font-bold text-white/75">{timeText(state?.event?.startsAt)} → {timeText(state?.event?.endsAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[3px] text-white/40">Restante</p>
            <p className="mt-1 text-xl font-black text-white">{state?.event?.status === 'active' ? formatQGTimeLeft(state.event.endsAt) : 'encerrado'}</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})` }} />
        </div>
      </div>
    </div>
  );
}

export default function TomadaQGPage() {
  const player = usePlayerStore((state) => state.player);
  const hydratePlayerFromServer = usePlayerStore((state) => state.hydratePlayerFromServer);
  const [state, setState] = useState<QgEventState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [, forceTick] = useState(0);

  const phase = state?.event?.phase || state?.phase || null;
  const theme = getQGPhaseTheme(phase);
  const joined = Boolean(state?.event?.myParticipant);
  const hasActiveEvent = state?.event?.status === 'active';
  const myFactionId = state?.eligibility?.factionId;
  const myFactionScore = state?.event?.leaderboard?.find((item) => item.factionId === myFactionId) || null;
  const leadingFaction = state?.event?.leaderboard?.[0] || null;

  const load = useCallback(async () => {
    const payload = await getQgEventState();
    setState(payload);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        setLoading(true);
        const payload = await getQgEventState();
        if (!cancelled) setState(payload);
      } catch (error: any) {
        if (!cancelled) setToast({ type: 'error', text: error?.message || 'Erro ao carregar QG' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void boot();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => forceTick((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const onUpdate = (payload: any) => {
      if (payload?.event) void load();
    };
    const onMandato = () => {
      setToast({ type: 'success', text: 'Sua facção recebeu o Mandato do QG. Bônus ativo na batalha.' });
      void load();
    };
    socket?.on?.('qg:eventUpdated', onUpdate);
    socket?.on?.('qg:mandatoWon', onMandato);
    return () => {
      socket?.off?.('qg:eventUpdated', onUpdate);
      socket?.off?.('qg:mandatoWon', onMandato);
    };
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const stats = useMemo(() => {
    const myScore = state?.event?.myParticipant?.score || 0;
    return [
      { label: 'Minha facção', value: myFactionScore ? formatQGNumber(myFactionScore.score) : '0', sub: state?.eligibility?.factionTag ? `[${state.eligibility.factionTag}]` : 'sem facção', accent: theme.accent },
      { label: 'Minha operação', value: formatQGNumber(myScore), sub: joined ? 'participando' : 'fora da operação', accent: theme.accent2 },
      { label: 'Líder atual', value: leadingFaction ? `[${leadingFaction.factionTag}]` : '-', sub: leadingFaction?.factionName || 'sem disputa', accent: '#facc15' },
      { label: 'Mandato', value: '+3/+3/+2/+2', sub: 'raj/blind/fol/queb', accent: '#22c55e' },
    ];
  }, [state, myFactionScore, leadingFaction, joined, theme]);

  async function runAction<T>(key: string, fn: () => Promise<T>, success?: string) {
    try {
      setSubmitting(key);
      const result: any = await fn();
      setState(result);
      if (result?.player) hydratePlayerFromServer(result.player);
      if (success) setToast({ type: 'success', text: success });
      if (result?.actionResult) {
        setToast({ type: 'success', text: `+${result.actionResult.points} influência no QG.` });
      }
    } catch (error: any) {
      setToast({ type: 'error', text: error?.message || 'Erro na operação' });
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <LoadingSpinner />
      </div>
    );
  }

  const eventDescription = QG_PHASE_DESCRIPTIONS[String(phase || '')] || 'Inicie a operação de tomada do prédio central e dispute o mandato do mapa.';

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      <Header />
      <main className="relative mx-auto max-w-[1500px] px-3 pb-24 pt-[108px] sm:px-5 lg:pt-[136px]">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(239,68,68,0.22),transparent_36%),radial-gradient(circle_at_15%_70%,rgba(14,165,233,0.18),transparent_42%),linear-gradient(135deg,#050505,#120808_55%,#030303)]" />
        <div className="fixed inset-0 opacity-[0.18] bg-[linear-gradient(0deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:100%_5px]" />
        <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 42%, ${theme.glow}, transparent 42%)` }} />

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className={`fixed left-1/2 top-24 z-[200] w-[92vw] max-w-md -translate-x-1/2 rounded-2xl border px-5 py-4 text-center text-sm font-black shadow-2xl backdrop-blur-2xl ${toast.type === 'success' ? 'border-emerald-400/35 bg-emerald-950/85 text-emerald-100' : 'border-red-400/35 bg-red-950/85 text-red-100'}`}
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/65 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.75)] backdrop-blur-2xl sm:p-6 lg:p-8">
          <div className="absolute inset-0 opacity-55" style={{ background: `radial-gradient(circle at 76% 12%, ${theme.accent}24, transparent 42%), radial-gradient(circle at 6% 88%, ${theme.accent2}22, transparent 38%)` }} />
          <div className="relative grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
            <div className="flex flex-col justify-between gap-5">
              <div>
                <PhaseBadge state={state} />
                <p className="mt-5 text-[11px] font-black uppercase tracking-[5px] text-white/42">Evento de Facção • QG Central</p>
                <h1 className="mt-3 text-5xl font-black uppercase leading-[0.88] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
                  Tomada<br />do QG
                </h1>
                <p className="mt-5 max-w-xl text-sm font-semibold leading-relaxed text-white/70 sm:text-base">
                  Disputa em tempo real pelo prédio central. A facção vencedora recebe mandato, tesouraria, prestígio e bônus real de batalha via estatísticas da gangue.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {stats.map((item) => <StatusCard key={item.label} {...item} />)}
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[3px] text-white/45">Fase atual</p>
                    <p className="mt-1 text-xl font-black text-white">{QG_PHASE_LABELS[String(phase || '')] || 'Sem evento'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[3px] text-white/45">Tempo</p>
                    <p className="mt-1 text-xl font-black text-white">{hasActiveEvent ? formatQGTimeLeft(state?.event?.endsAt) : '--:--'}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold leading-relaxed text-white/55">{eventDescription}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {!hasActiveEvent && (
                  <button
                    disabled={!state?.eligibility?.canStart || submitting === 'start'}
                    onClick={() => runAction('start', startQgEvent, 'Tomada do QG iniciada. Sua facção entrou na disputa.')}
                    className="rounded-2xl bg-white px-5 py-4 text-sm font-black uppercase tracking-[3px] text-black transition hover:scale-[1.01] disabled:opacity-45"
                  >
                    {submitting === 'start' ? 'Iniciando...' : 'Iniciar tomada'}
                  </button>
                )}
                {hasActiveEvent && !joined && (
                  <button
                    disabled={!state?.eligibility?.canJoin || submitting === 'join'}
                    onClick={() => runAction('join', joinQgEvent, 'Você entrou na operação do QG.')}
                    className="rounded-2xl bg-white px-5 py-4 text-sm font-black uppercase tracking-[3px] text-black transition hover:scale-[1.01] disabled:opacity-45"
                  >
                    {submitting === 'join' ? 'Entrando...' : 'Entrar na operação'}
                  </button>
                )}
                {hasActiveEvent && state?.eligibility?.canStart && (
                  <button
                    disabled={submitting === 'settle'}
                    onClick={() => runAction('settle', () => settleQgEvent(false), 'Estado do QG atualizado.')}
                    className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm font-black uppercase tracking-[3px] text-white transition hover:bg-white/15 disabled:opacity-45"
                  >
                    Atualizar QG
                  </button>
                )}
              </div>
              {state?.eligibility?.reason && <p className="text-xs font-bold text-amber-200">{state.eligibility.reason}</p>}
            </div>

            <QgSchematic state={state} />
          </div>
        </section>

        <section className="relative mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-white/10 bg-black/70 p-4 shadow-2xl backdrop-blur-2xl sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[4px] text-white/40">Ações interativas</p>
                <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white">Sala de Operações</h2>
              </div>
              <p className="hidden max-w-xs text-right text-xs font-semibold text-white/45 sm:block">Cada ação soma influência para a facção. O avanço final libera apenas nos últimos minutos.</p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {(state?.config?.actions || []).map((action) => (
                <ActionButton
                  key={action.id}
                  action={action}
                  state={state}
                  joined={joined}
                  disabled={Boolean(submitting)}
                  onClick={() => runAction(action.id, () => submitQgEventAction(action.id))}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/70 p-4 shadow-2xl backdrop-blur-2xl sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[4px] text-white/40">Placar da ocupação</p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white">Facções no QG</h2>
            <div className="mt-5 space-y-3">
              {(state?.event?.leaderboard || []).length > 0 ? (
                state!.event!.leaderboard.slice(0, 8).map((item) => <LeaderboardRow key={item.factionId} item={item} />)
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm font-semibold text-white/55">
                  Nenhuma facção pontuou ainda. Inicie a tomada e seja a primeira a dominar o painel.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="relative mt-5 grid gap-5 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-black/70 p-5 shadow-2xl backdrop-blur-2xl lg:col-span-2">
            <p className="text-[10px] font-black uppercase tracking-[4px] text-white/40">Recompensas e cargos</p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white">Mandato do QG</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(state?.config?.officeTitles || []).map((office) => (
                <div key={office.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-base font-black uppercase text-white">{office.title}</p>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-white/55">{office.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-950/20 p-4">
              <p className="text-sm font-black uppercase tracking-widest text-emerald-100">Bônus de batalha da facção vencedora</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-emerald-100/70">
                +3% Rajada, +3% Blindagem, +2% Fôlego e +2% Quebra para todos os membros da facção vencedora por 24h. O bônus é salvo como <strong>gang.statSources</strong> com origem evento, então entra no cálculo real da batalha.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/70 p-5 shadow-2xl backdrop-blur-2xl">
            <p className="text-[10px] font-black uppercase tracking-[4px] text-white/40">Linha quente</p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white">Rádio QG</h2>
            <div className="mt-5 max-h-[340px] space-y-3 overflow-y-auto pr-1">
              {(state?.event?.activityLog || []).length > 0 ? (
                state!.event!.activityLog!.slice(0, 10).map((item: any) => (
                  <div key={item.id || `${item.createdAt}_${item.type}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                    <p className="text-xs font-black uppercase tracking-widest text-white/70">{String(item.type || '').replaceAll('_', ' ')}</p>
                    <p className="mt-1 text-[11px] font-semibold text-white/45">{item.actorPlayerName || 'Sistema'} • {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm font-semibold text-white/50">Nenhuma transmissão ainda.</p>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
