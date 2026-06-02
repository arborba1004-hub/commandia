import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePlayerStore } from '@/store/playerStore';
import { useFactionStore } from '@/store/factionStore';
import { getSocket } from '@/socket';
import {
  QG_MEMBER_LABELS,
  QG_MEMBER_TYPES,
  appointQgRole,
  assignQgServant,
  sendQgMandatePack,
  setQgResourceDecree,
  useQgMandateAbility,
  formatQGClock,
  formatQGDuration,
  formatQGNumber,
  formatQGTimeLeft,
  getQgEventState,
  sendQgMarch,
  withdrawQgGarrison,
  type QgEventState,
  type QgLocationKey,
  type QgLocationState,
  type QgMandateCost,
  type QgMandateReward,
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


function formatMandateCost(cost?: QgMandateCost | null): string {
  const parts: string[] = [];
  if (cost?.dirtyMoney) parts.push(`${formatQGNumber(cost.dirtyMoney)} Sujo`);
  if (cost?.cleanMoney) parts.push(`${formatQGNumber(cost.cleanMoney)} Limpo`);
  if (cost?.corre) parts.push(`${formatQGNumber(cost.corre)} Corre`);
  return parts.length ? parts.join(' • ') : 'Sem custo';
}

function formatMandateReward(reward?: QgMandateReward | null): string {
  const parts: string[] = [];
  if (reward?.dirtyMoney) parts.push(`${formatQGNumber(reward.dirtyMoney)} Sujo`);
  if (reward?.cleanMoney) parts.push(`${formatQGNumber(reward.cleanMoney)} Limpo`);
  if (reward?.corre) parts.push(`${formatQGNumber(reward.corre)} Corre`);
  if (reward?.barracoAcceleratorSeconds) parts.push(`${Math.floor(reward.barracoAcceleratorSeconds / 60)}min obra`);
  if (reward?.convoyAcceleratorTwoX) parts.push(`${reward.convoyAcceleratorTwoX} acelerador comboio`);
  return parts.length ? parts.join(' • ') : 'Recompensa especial';
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
                  Ocupe este prédio pelo maior tempo possível entre 18h e 00h. Os CTs inimigos drenam a guarnição do QG a cada 30 segundos.
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
      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/40">Prioridade: maior tempo acumulado no QG</p>
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
                QG {formatQGDuration(item.qgHoldMs)} • maior sequência {formatQGDuration(item.qgMaxContinuousHoldMs)} • CTs {item.ctCaptures}
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
  onWithdraw,
}: {
  state: QgEventState | null;
  selectedLocation?: QgLocationState;
  selection: Record<QgMemberType, number>;
  setSelection: (next: Record<QgMemberType, number>) => void;
  submitting: boolean;
  onSend: () => void;
  onWithdraw: () => void;
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
  const canWithdraw = Boolean(state?.eligibility?.canWithdraw && selectedLocation && !submitting);

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

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <button
          onClick={onSend}
          disabled={!canMarch}
          className="w-full rounded-2xl bg-white px-5 py-4 text-sm font-black uppercase tracking-[3px] text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? 'Enviando...' : selectedLocation?.occupantFactionId && selectedLocation.occupantFactionId !== state?.eligibility.factionId ? 'Atacar ocupante' : selectedLocation?.occupantFactionId ? 'Reforçar posição' : 'Ocupar posição'}
        </button>
        <button
          onClick={onWithdraw}
          disabled={!canWithdraw}
          className="rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-4 text-xs font-black uppercase tracking-[3px] text-white transition hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-35"
        >
          Retirar
        </button>
      </div>
    </div>
  );
}



function RoleAppointmentPanel({
  state,
  busy,
  onAppoint,
}: {
  state: QgEventState | null;
  busy: boolean;
  onAppoint: (roleId: string, playerId: string) => void;
}) {
  const myFaction = useFactionStore((s) => s.myFaction);
  const members = useMemo(() => {
    const factionMembers = Array.isArray(myFaction?.members) ? myFaction.members : [];
    if (factionMembers.length > 0) {
      return factionMembers.map((m: any) => ({ playerId: String(m.playerId), playerName: String(m.playerName || 'Jogador') }));
    }
    const winnerFactionId = state?.event?.winnerFactionId || state?.event?.mandate?.factionId;
    return (state?.event?.topParticipants || [])
      .filter((p) => p.factionId === winnerFactionId)
      .map((p) => ({ playerId: p.playerId, playerName: p.playerName }));
  }, [myFaction, state]);

  const roles = state?.config?.mandateRoles || [];
  const currentRoles = state?.event?.mandate?.roles || [];
  const [targets, setTargets] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const role of roles) {
      const current = currentRoles.find((item: any) => item.roleId === role.id);
      next[role.id] = String(current?.playerId || members[0]?.playerId || '');
    }
    setTargets((old) => ({ ...next, ...old }));
  }, [roles, currentRoles, members]);

  if (!state?.eligibility?.canAppoint || !['appointment', 'mandate'].includes(String(state?.event?.status))) return null;

  return (
    <div className="mt-4 rounded-2xl border border-yellow-300/20 bg-yellow-400/[0.06] p-3">
      <p className="text-[11px] font-black uppercase tracking-[3px] text-yellow-100/70">Nomeação oficial</p>
      <p className="mt-1 text-xs font-semibold text-white/50">
        O líder da facção vencedora define os cargos. Durante o mandato, o Líder do Complexo não pode ser trocado.
      </p>
      <div className="mt-3 space-y-3">
        {roles.map((role: any) => {
          const disabledByMandate = state.event?.status === 'mandate' && role.id === 'lider_complexo';
          return (
            <div key={role.id} className="grid gap-2 rounded-xl border border-white/10 bg-black/45 p-3 sm:grid-cols-[1fr_auto]">
              <label className="min-w-0">
                <span className="text-xs font-black uppercase tracking-widest text-white/60">{role.title}</span>
                <select
                  value={targets[role.id] || ''}
                  onChange={(e) => setTargets((old) => ({ ...old, [role.id]: e.target.value }))}
                  disabled={disabledByMandate}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/70 px-3 py-3 text-sm font-bold text-white outline-none disabled:opacity-45"
                >
                  {members.map((member) => <option key={member.playerId} value={member.playerId}>{member.playerName}</option>)}
                  {!members.length && <option value="">Sem membros carregados</option>}
                </select>
              </label>
              <button
                disabled={busy || disabledByMandate || !targets[role.id]}
                onClick={() => onAppoint(role.id, targets[role.id])}
                className="rounded-xl border border-white/15 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-black disabled:opacity-35"
              >
                Nomear
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MandateTools({
  state,
  busy,
  onAbility,
  onPack,
  onServant,
  onDecree,
}: {
  state: QgEventState | null;
  busy: boolean;
  onAbility: (abilityId: string) => void;
  onPack: (packId: string, playerId: string) => void;
  onServant: (penaltyId: string, playerId: string) => void;
  onDecree: (decreeId: string) => void;
}) {
  const [packTarget, setPackTarget] = useState('');
  const [servantTarget, setServantTarget] = useState('');
  const mandate = state?.event?.mandate;
  const winnerFactionId = state?.event?.winnerFactionId || mandate?.factionId;
  const winnerParticipants = (state?.event?.topParticipants || []).filter((p) => p.factionId === winnerFactionId);
  const rivalParticipants = (state?.event?.topParticipants || []).filter((p) => p.factionId && p.factionId !== winnerFactionId);

  useEffect(() => {
    if (!packTarget && winnerParticipants[0]?.playerId) setPackTarget(winnerParticipants[0].playerId);
  }, [packTarget, winnerParticipants]);

  useEffect(() => {
    if (!servantTarget && rivalParticipants[0]?.playerId) setServantTarget(rivalParticipants[0].playerId);
  }, [servantTarget, rivalParticipants]);

  if (state?.event?.status !== 'mandate') return null;

  return (
    <div className="rounded-[2rem] border border-yellow-300/15 bg-black/75 p-4 shadow-2xl backdrop-blur-2xl md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-white">Administração do Complexo</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/40">
            Habilidades, pacotes e servos do mandato
          </p>
        </div>
        <span className="rounded-full border border-yellow-300/20 bg-yellow-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-yellow-100">
          {state.eligibility?.mandateRoleTitle || 'sem cargo'}
        </span>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[3px] text-white/45">Habilidades do QG</p>
          <div className="mt-3 grid gap-3">
            {(state.config?.mandateAbilities || []).map((ability) => (
              <div key={ability.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase text-white">{ability.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/52">{ability.description}</p>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-yellow-100/70">
                      Custo: {formatMandateCost(ability.cost)}
                    </p>
                  </div>
                  <button
                    onClick={() => onAbility(ability.id)}
                    disabled={busy || !state.eligibility?.canUseMandatePower}
                    className="shrink-0 rounded-xl border border-white/15 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black disabled:opacity-35"
                  >
                    Ativar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-[3px] text-white/45">Pacotes do mandato</p>
          <select
            value={packTarget}
            onChange={(e) => setPackTarget(e.target.value)}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-black/70 px-3 py-3 text-sm font-bold text-white outline-none"
          >
            {winnerParticipants.map((p) => <option key={p.playerId} value={p.playerId}>{p.playerName} [{p.factionTag}]</option>)}
            {!winnerParticipants.length && <option value="">Sem participantes da facção vencedora</option>}
          </select>
          <div className="mt-3 grid gap-3">
            {(state.config?.rewardPacks || []).map((pack) => (
              <div key={pack.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase text-white">{pack.title}</p>
                    <p className="mt-1 text-xs text-white/50">{pack.description}</p>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-white/45">Custo: {formatMandateCost(pack.cost)}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-emerald-200/70">Entrega: {formatMandateReward(pack.reward)}</p>
                  </div>
                  <button
                    onClick={() => packTarget && onPack(pack.id, packTarget)}
                    disabled={busy || !packTarget || !state.eligibility?.canSendMandatePack}
                    className="shrink-0 rounded-xl border border-emerald-300/20 bg-emerald-400/15 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-100 disabled:opacity-35"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-[3px] text-white/45">Servos / penalidades</p>
          <select
            value={servantTarget}
            onChange={(e) => setServantTarget(e.target.value)}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-black/70 px-3 py-3 text-sm font-bold text-white outline-none"
          >
            {rivalParticipants.map((p) => <option key={p.playerId} value={p.playerId}>{p.playerName} [{p.factionTag}]</option>)}
            {!rivalParticipants.length && <option value="">Sem rivais elegíveis</option>}
          </select>
          <div className="mt-3 grid gap-3">
            {(state.config?.servantPenalties || []).map((penalty) => (
              <div key={penalty.id} className="rounded-2xl border border-red-300/15 bg-red-500/[0.06] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase text-white">{penalty.title}</p>
                    <p className="mt-1 text-xs text-white/50">{penalty.description}</p>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-red-100/70">
                      {Object.entries(penalty.percent || {}).filter(([, v]) => Number(v) !== 0).map(([k, v]) => `${k} ${v}%`).join(' • ')}
                    </p>
                  </div>
                  <button
                    onClick={() => servantTarget && onServant(penalty.id, servantTarget)}
                    disabled={busy || !servantTarget || !state.eligibility?.canAssignServant}
                    className="shrink-0 rounded-xl border border-red-300/20 bg-red-400/15 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-100 disabled:opacity-35"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Habilidades usadas" value={String(mandate?.abilityUses?.length || 0)} />
          <StatCard label="Pacotes enviados" value={String(mandate?.packagesSent?.length || 0)} />
          <StatCard label="Servos ativos" value={String(mandate?.servants?.length || 0)} />
        </div>
      </div>
    </div>
  );
}

export default function TomadaQGPage() {
  const hydratePlayerFromServer = usePlayerStore((s) => s.hydratePlayerFromServer);
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<QgEventState | null>(null);
  const [selectedKey, setSelectedKey] = useState<QgLocationKey>(() => {
    const initial = searchParams.get('location') as QgLocationKey | null;
    return initial && ['qg', 'ct_nw', 'ct_ne', 'ct_sw', 'ct_se'].includes(initial) ? initial : 'qg';
  });
  const [selection, setSelection] = useState<Record<QgMemberType, number>>({ ...DEFAULT_SELECTION });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mandateBusy, setMandateBusy] = useState(false);
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

  useEffect(() => {
    const requestedLocation = searchParams.get('location') as QgLocationKey | null;
    if (requestedLocation && ['qg', 'ct_nw', 'ct_ne', 'ct_sw', 'ct_se'].includes(requestedLocation)) {
      setSelectedKey(requestedLocation);
    }
  }, [searchParams]);

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

  const handleWithdraw = async () => {
    if (!selectedLocation || submitting) return;
    setSubmitting(true);
    try {
      const payload = await withdrawQgGarrison(selectedLocation.key);
      setState(payload);
      setToast({ type: 'success', text: `${payload.withdrawResult?.membersReturned || 0} membros voltaram da guarnição.` });
    } catch (error: any) {
      setToast({ type: 'error', text: error?.message || 'Erro ao retirar guarnição' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAppointRole = async (roleId: string, playerId: string) => {
    if (!roleId || !playerId || mandateBusy) return;
    setMandateBusy(true);
    try {
      const payload = await appointQgRole(roleId, playerId);
      setState(payload);
      setToast({ type: 'success', text: 'Cargo atualizado.' });
    } catch (error: any) {
      setToast({ type: 'error', text: error?.message || 'Erro ao nomear cargo' });
    } finally {
      setMandateBusy(false);
    }
  };

  const handleMandateAbility = async (abilityId: string) => {
    if (mandateBusy) return;
    setMandateBusy(true);
    try {
      const payload = await useQgMandateAbility(abilityId);
      setState(payload);
      setToast({ type: 'success', text: 'Habilidade do QG ativada.' });
    } catch (error: any) {
      setToast({ type: 'error', text: error?.message || 'Erro ao ativar habilidade do QG' });
    } finally {
      setMandateBusy(false);
    }
  };

  const handleMandatePack = async (packId: string, playerId: string) => {
    if (mandateBusy) return;
    setMandateBusy(true);
    try {
      const payload = await sendQgMandatePack(packId, playerId);
      setState(payload);
      setToast({ type: 'success', text: 'Pacote do mandato enviado.' });
    } catch (error: any) {
      setToast({ type: 'error', text: error?.message || 'Erro ao enviar pacote do mandato' });
    } finally {
      setMandateBusy(false);
    }
  };

  const handleMandateServant = async (penaltyId: string, playerId: string) => {
    if (mandateBusy) return;
    setMandateBusy(true);
    try {
      const payload = await assignQgServant(penaltyId, playerId);
      setState(payload);
      setToast({ type: 'success', text: 'Servo do mandato aplicado.' });
    } catch (error: any) {
      setToast({ type: 'error', text: error?.message || 'Erro ao aplicar servo do mandato' });
    } finally {
      setMandateBusy(false);
    }
  };

  const handleResourceDecree = async (decreeId: string) => {
    if (mandateBusy) return;
    setMandateBusy(true);
    try {
      const payload = await setQgResourceDecree(decreeId);
      setState(payload);
      setToast({ type: 'success', text: 'Decreto de recurso ativado.' });
    } catch (error: any) {
      setToast({ type: 'error', text: error?.message || 'Erro ao ativar decreto de recurso' });
    } finally {
      setMandateBusy(false);
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
                O QG central é a Prefeitura do Commandia. A guerra acontece das 18h à 00h e vence a facção que somar mais tempo ocupando o QG. Os 4 CTs reais do mapa funcionam como fortalezas: se forem inimigos do dono do QG, drenam a guarnição a cada 30 segundos.
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
                <RoleAppointmentPanel state={state} busy={mandateBusy} onAppoint={handleAppointRole} />
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
              onWithdraw={handleWithdraw}
            />
            <MandateTools
              state={state}
              busy={mandateBusy}
              onAbility={handleMandateAbility}
              onPack={handleMandatePack}
              onServant={handleMandateServant}
              onDecree={handleResourceDecree}
            />
            <div className="rounded-[2rem] border border-white/10 bg-black/70 p-4 shadow-2xl backdrop-blur-2xl md:p-5">
              <h3 className="text-lg font-black uppercase tracking-tight text-white">Regras essenciais</h3>
              <ul className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-white/58">
                <li><b className="text-white">1.</b> Evento automático às 18h a cada 72 horas.</li>
                <li><b className="text-white">2.</b> A batalha vai das 18h à 00h e vence quem acumular mais tempo no QG.</li>
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
