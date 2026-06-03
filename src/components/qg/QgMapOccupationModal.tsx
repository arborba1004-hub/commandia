import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/store/playerStore';
import {
  QG_MEMBER_LABELS,
  QG_MEMBER_TYPES,
  formatQGDuration,
  formatQGNumber,
  getQgEventState,
  sendQgMarch,
  withdrawQgGarrison,
  type QgEventState,
  type QgLocationKey,
  type QgLocationState,
  type QgMemberType,
  type QgSelection,
} from '@/api/qgEventApi';
import { describeQgOutcome, getQGLocationTone } from '@/data/qgEventPresentation';

type ToastState = { type: 'success' | 'error'; text: string } | null;

type Props = {
  isOpen: boolean;
  locationKey: QgLocationKey | null;
  initialState?: QgEventState | null;
  onClose: () => void;
  onStateChange?: (state: QgEventState) => void;
};

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

function getActiveGangByType(player: any): Record<QgMemberType, number> {
  const out: Record<QgMemberType, number> = { ...DEFAULT_SELECTION };
  const members = player?.gang?.members || player?.gangMembers || [];
  for (const member of members as any[]) {
    if (member?.status !== 'ativo') continue;
    const type = QG_MEMBER_TYPES.includes(member.type) ? (member.type as QgMemberType) : 'capanga';
    out[type] += 1;
  }
  return out;
}

function totalSelection(selection: Record<QgMemberType, number>) {
  return Object.values(selection).reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0);
}

function getLocation(state: QgEventState | null, key: QgLocationKey | null): QgLocationState | undefined {
  if (!state?.event || !key) return undefined;
  return state.event.locations?.find((item) => item.key === key) || (key === 'qg' ? state.event.qg : undefined);
}

function getActionLabel(location?: QgLocationState, myFactionId?: string | null) {
  if (!location?.occupantFactionId) return 'Ocupar posição';
  if (String(location.occupantFactionId) === String(myFactionId || '')) return 'Reforçar posição';
  return 'Atacar ocupante';
}

function LocationOwnership({ location }: { location?: QgLocationState }) {
  if (!location) return null;
  const tone = getQGLocationTone(location.key);
  const dominated = Boolean(location.occupantFactionId);
  return (
    <div className="rounded-2xl border border-white/10 bg-black/55 p-4">
      <p className="text-[10px] font-black uppercase tracking-[3px] text-white/40">Status do ponto</p>
      <div className="mt-2 flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-xl font-black"
          style={{ color: dominated ? tone.accent : '#94a3b8', boxShadow: dominated ? `0 0 22px ${tone.accent}55` : undefined }}
        >
          {tone.icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xl font-black uppercase text-white">
            {dominated ? `Dominado por [${location.occupantFactionTag || 'FAC'}]` : 'Livre para ocupação'}
          </p>
          <p className="truncate text-xs font-bold uppercase tracking-widest text-white/45">
            {dominated ? location.occupantFactionName : 'Nenhuma facção controla agora'}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/35">Guarnição</p>
          <p className="mt-1 text-base font-black text-white">{formatQGNumber(location.garrisonCount || 0)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/35">Poder</p>
          <p className="mt-1 text-base font-black text-white">{formatQGNumber(location.garrisonPower || 0)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/35">Tempo</p>
          <p className="mt-1 text-base font-black text-white">{formatQGDuration(location.currentHoldMs || 0)}</p>
        </div>
      </div>
    </div>
  );
}

export default function QgMapOccupationModal({ isOpen, locationKey, initialState, onClose, onStateChange }: Props) {
  const player = usePlayerStore((s) => s.player);
  const [state, setState] = useState<QgEventState | null>(initialState || null);
  const [selection, setSelection] = useState<Record<QgMemberType, number>>({ ...DEFAULT_SELECTION });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    setState(initialState || null);
  }, [initialState]);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    setLoading(true);
    getQgEventState()
      .then((payload) => {
        if (!alive) return;
        setState(payload);
        onStateChange?.(payload);
      })
      .catch((error) => setToast({ type: 'error', text: error?.message || 'Erro ao carregar ponto do QG' }))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [isOpen, locationKey, onStateChange]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const location = useMemo(() => getLocation(state, locationKey), [state, locationKey]);
  const available = useMemo(() => getActiveGangByType(player), [player]);
  const selectedTotal = totalSelection(selection);
  const myFactionId = state?.eligibility?.factionId || null;
  const status = String(state?.event?.status || 'scheduled');
  const isWarOpen = status === 'active';
  const tone = getQGLocationTone(locationKey || 'qg');

  const capacityRemaining = useMemo(() => {
    if (!state?.eligibility) return 0;
    if (location?.capacity && location.occupantFactionId && String(location.occupantFactionId) === String(state.eligibility.factionId || '')) {
      return Math.max(0, Number(location.capacity || 0) - Number(location.garrisonCount || 0));
    }
    return Number(state.eligibility.marchCapacity || 0);
  }, [state, location]);

  const canMarch = Boolean(isWarOpen && state?.eligibility?.canMarch && location && selectedTotal > 0 && !submitting);
  const canWithdraw = Boolean(state?.eligibility?.canWithdraw && location && !submitting);

  const updateSelection = (type: QgMemberType, value: number) => {
    const max = available[type] || 0;
    setSelection((old) => ({ ...old, [type]: Math.max(0, Math.min(max, Math.floor(Number(value || 0)))) }));
  };

  const quickFill = (ratio: number) => {
    const next: Record<QgMemberType, number> = { ...DEFAULT_SELECTION };
    let remaining = Math.max(1, Math.floor(Math.max(0, capacityRemaining) * ratio));
    for (const type of QG_MEMBER_TYPES) {
      const index = QG_MEMBER_TYPES.indexOf(type);
      const take = Math.min(available[type] || 0, Math.ceil(remaining / Math.max(1, QG_MEMBER_TYPES.length - index)));
      next[type] = take;
      remaining -= take;
      if (remaining <= 0) break;
    }
    setSelection(next);
  };

  const handleSend = async () => {
    if (!locationKey || !canMarch) return;
    setSubmitting(true);
    setToast(null);
    try {
      const payload = await sendQgMarch(locationKey, selection as QgSelection);
      setState(payload);
      onStateChange?.(payload);
      setSelection({ ...DEFAULT_SELECTION });
      setToast({ type: 'success', text: describeQgOutcome(payload.marchResult?.outcome) });
    } catch (error: any) {
      setToast({ type: 'error', text: error?.message || 'Erro ao enviar gangue' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!locationKey || submitting) return;
    setSubmitting(true);
    setToast(null);
    try {
      const payload = await withdrawQgGarrison(locationKey);
      setState(payload);
      onStateChange?.(payload);
      setToast({ type: 'success', text: `${payload.withdrawResult?.membersReturned || 0} membros voltaram da guarnição.` });
    } catch (error: any) {
      setToast({ type: 'error', text: error?.message || 'Erro ao retirar guarnição' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-end justify-center bg-black/78 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#050507]/95 p-4 text-white shadow-2xl sm:rounded-[2rem] sm:p-6"
            style={{ boxShadow: `0 0 90px ${tone.accent}35` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[4px] text-white/42">Tomada do QG • ponto real do mapa</p>
                <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] text-white sm:text-5xl">
                  {location?.name || tone.label}
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-white/55">
                  {location?.key === 'qg'
                    ? 'Envie gangue para ocupar, reforçar ou expulsar o dono atual do QG central.'
                    : 'Este CT funciona como fortaleza da Tomada. Se dominar um CT inimigo do QG, ele drena a guarnição do QG a cada 30 segundos.'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl font-black text-white/70 transition hover:bg-white hover:text-black"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            {toast && (
              <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${toast.type === 'success' ? 'border-emerald-400/30 bg-emerald-900/40 text-emerald-50' : 'border-red-400/30 bg-red-950/55 text-red-50'}`}>
                {toast.text}
              </div>
            )}

            {loading ? (
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-sm font-black uppercase tracking-widest text-white/50">
                Carregando ponto...
              </div>
            ) : (
              <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-4">
                  <LocationOwnership location={location} />
                  <div className="rounded-2xl border border-white/10 bg-black/55 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[3px] text-white/40">Minha operação</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/35">Capacidade</p>
                        <p className="mt-1 text-xl font-black text-white">{formatQGNumber(state?.eligibility?.marchCapacity || 0)}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/35">Selecionado</p>
                        <p className="mt-1 text-xl font-black text-white">{formatQGNumber(selectedTotal)}</p>
                      </div>
                    </div>
                    {state?.eligibility?.reason && (
                      <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-bold text-red-100">{state.eligibility.reason}</p>
                    )}
                    {!isWarOpen && (
                      <p className="mt-3 rounded-xl border border-yellow-300/20 bg-yellow-400/10 p-3 text-sm font-bold text-yellow-50">
                        A guarnição só pode ser enviada durante a guerra ativa, das 18h à 00h.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/55 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[3px] text-white/40">Selecionar tropas</p>
                      <p className="mt-1 text-sm font-semibold text-white/55">Escolha apenas a gangue que vai para este ponto.</p>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      <button onClick={() => quickFill(0.15)} className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/70">15%</button>
                      <button onClick={() => quickFill(0.35)} className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/70">35%</button>
                      <button onClick={() => quickFill(0.65)} className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/70">65%</button>
                      <button onClick={() => setSelection({ ...DEFAULT_SELECTION })} className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/70">Limpar</button>
                    </div>
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
                            onChange={(event) => updateSelection(type, Number(event.target.value || 0))}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/70 px-3 py-3 text-right text-base font-black text-white outline-none focus:border-white/40"
                          />
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                    <button
                      onClick={handleSend}
                      disabled={!canMarch}
                      className="w-full rounded-2xl bg-white px-5 py-4 text-sm font-black uppercase tracking-[3px] text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {submitting ? 'Enviando...' : getActionLabel(location, myFactionId)}
                    </button>
                    <button
                      onClick={handleWithdraw}
                      disabled={!canWithdraw}
                      className="rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-4 text-xs font-black uppercase tracking-[3px] text-white transition hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      Retirar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
