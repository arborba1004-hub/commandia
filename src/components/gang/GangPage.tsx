import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useGangStore } from '@/store/gangStore';
import { usePlayerStore } from '@/store/playerStore';
import type { GangMemberType, GangUnit } from '@/types/gangWar';
import { Shield, Swords, Zap, Clock3, MapPin, CheckCircle2, Circle } from 'lucide-react';
import GangTrainingModal from '@/components/gang/GangTrainingModal';

// ── Tipos de membros treináveis (Sistema A) ──────────────────────────────────
const TRAINABLE_TYPES: GangMemberType[] = [
  'capanga', 'frente', 'executor', 'assassino',
  'muralha', 'certeiro', 'motorista', 'nitro',
];

// ── CTs físicos ──────────────────────────────────────────────────────────────
type CTKey = 'ct_nw' | 'ct_ne' | 'ct_sw' | 'ct_se';

const CT_KEYS: CTKey[] = ['ct_nw', 'ct_ne', 'ct_sw', 'ct_se'];

const CT_LABELS: Record<CTKey, { name: string; subtitle: string }> = {
  ct_nw: { name: 'CT Noroeste', subtitle: 'Setor norte' },
  ct_ne: { name: 'CT Nordeste', subtitle: 'Setor norte' },
  ct_sw: { name: 'CT Sudoeste', subtitle: 'Setor sul' },
  ct_se: { name: 'CT Sudeste', subtitle: 'Setor sul' },
};

// ── Helpers UI ───────────────────────────────────────────────────────────────
function label(type: GangMemberType) {
  return {
    capanga: 'Capanga',
    frente: 'Frente',
    executor: 'Executor',
    assassino: 'Assassino',
    muralha: 'Muralha',
    certeiro: 'Certeiro',
    motorista: 'Motorista',
    nitro: 'Nitro',
  }[type as keyof Record<GangMemberType, string>] ?? type;
}

function statusLabel(status: GangUnit['status']) {
  return {
    ativo: 'Ativo',
    ferido: 'Ferido',
    morto: 'Morto',
    treinando: 'Treinando',
  }[status];
}

function statusClass(status: GangUnit['status']) {
  return {
    ativo: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
    ferido: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
    morto: 'text-red-300 border-red-500/30 bg-red-500/10',
    treinando: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
  }[status];
}

function tone(type: GangMemberType) {
  if (['muralha'].includes(type)) return 'border-cyan-500/20 bg-cyan-500/5';
  if (['frente', 'executor', 'certeiro', 'assassino'].includes(type)) return 'border-red-500/20 bg-red-500/5';
  if (['motorista', 'nitro'].includes(type)) return 'border-amber-500/20 bg-amber-500/5';
  if (['capanga'].includes(type)) return 'border-zinc-500/20 bg-zinc-500/5';
  return 'border-white/10 bg-white/[0.03]';
}

function formatDuration(ms: number) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${seconds}s`;
}

function getMaxTroopLevel(barracoLevel: number) {
  return Math.max(1, Math.min(10, Math.floor(barracoLevel / 10) + 1));
}

// ═════════════════════════════════════════════════════════════════════════════

export default function GangPage() {
  const player = usePlayerStore((state) => state.player);
  const gang = useGangStore((state) => state.gang);
  const isLoading = useGangStore((state) => state.isLoading);
  const isSubmitting = useGangStore((state) => state.isSubmitting);
  const error = useGangStore((state) => state.error);
  const trainingSlots = useGangStore((state) => state.trainingSlots);

  const loadGang = useGangStore((state) => state.loadGang);
  const loadTrainingState = useGangStore((state) => state.loadTrainingState);
  const queueTraining = useGangStore((state) => state.queueTraining);
  const collectTraining = useGangStore((state) => state.collectTraining);
  const getAvailableByType = useGangStore((state) => state.getAvailableByType);

  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [selectedCT, setSelectedCT] = useState<CTKey | null>(null);

  // Tick local de 1s para countdown nos cards
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const barracoLevel = Math.max(1, Number(player?.niveis?.barracoLevel || 1));
  const maxTroopLevel = getMaxTroopLevel(barracoLevel);

  useEffect(() => {
    void loadGang();
    void loadTrainingState();
  }, [loadGang, loadTrainingState]);

  // Mapeia ctKey → slot ativo
  const slotsByCT = useMemo(() => {
    const map: Partial<Record<CTKey, typeof trainingSlots[number]>> = {};
    for (const slot of trainingSlots) {
      if (CT_KEYS.includes(slot.ctKey as CTKey)) {
        map[slot.ctKey as CTKey] = slot;
      }
    }
    return map;
  }, [trainingSlots]);

  const occupiedCount = trainingSlots.length;
  const readyCount = trainingSlots.filter(
    (s) => s.status === 'completed' || now >= s.endsAt
  ).length;

  const activeByType = getAvailableByType();
  const totalActive = Object.values(activeByType).reduce((sum, n) => sum + Number(n || 0), 0);

  // Conta membros por tipo+nível
  const membersByTypeAndLevel = useMemo(() => {
    const map: Partial<Record<GangMemberType, Record<number, number>>> = {};
    for (const m of (gang?.members || [])) {
      if (m.status !== 'ativo') continue;
      const type = m.type as GangMemberType;
      if (!TRAINABLE_TYPES.includes(type)) continue;
      if (!map[type]) map[type] = {};
      map[type]![m.level] = (map[type]![m.level] ?? 0) + 1;
    }
    return map;
  }, [gang?.members]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleOpenCT(ctKey: CTKey) {
    setSelectedCT(ctKey);
    setTrainingModalOpen(true);
  }

  function handleCloseTrainingModal() {
    setTrainingModalOpen(false);
    setSelectedCT(null);
  }

  async function handleCollect(slotId: string) {
    await collectTraining(slotId);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-[140px] md:pt-[160px]">

        {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
        <section className="rounded-3xl border border-red-500/20 bg-gradient-to-r from-red-950/30 to-black p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-red-400">gangue</div>
              <h1 className="mt-2 text-4xl font-black">Painel da Gangue</h1>
              <p className="mt-3 max-w-3xl text-zinc-400">
                Gerencie sua tropa e acompanhe os centros de treinamento. Para iniciar um novo
                treinamento, clique no CT correspondente — pelo mapa ou aqui.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Barraco" value={`Lv ${barracoLevel}`} tone="cyan" />
              <Stat label="Membros ativos" value={String(totalActive)} tone="emerald" />
              <Stat label="CTs em treino" value={`${occupiedCount}/4`} tone="amber" />
              <Stat label="Prontos" value={String(readyCount)} tone="red" highlight={readyCount > 0} />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </section>

        {/* ── 4 CTs físicos ─────────────────────────────────────────────────── */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-[#090909] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black uppercase">Centros de Treinamento</h2>
              <p className="mt-1 text-sm text-zinc-400">
                4 CTs simultâneos. Clique para iniciar ou coletar.
              </p>
            </div>
          </div>

          {isLoading && trainingSlots.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center text-zinc-500">
              Carregando…
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {CT_KEYS.map((ctKey) => {
                const slot = slotsByCT[ctKey];
                return (
                  <CTCard
                    key={ctKey}
                    ctKey={ctKey}
                    slot={slot}
                    now={now}
                    onOpen={() => handleOpenCT(ctKey)}
                    onCollect={(slotId) => void handleCollect(slotId)}
                    isSubmitting={isSubmitting}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* ── Tropas disponíveis por tipo e nível ───────────────────────────── */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-[#090909] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black uppercase">Tropas disponíveis</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Membros ativos, agrupados por nível. Esses números alimentam a marcha de ataque.
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
              {totalActive} ativos
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {TRAINABLE_TYPES.map((type) => {
              const byLevel = membersByTypeAndLevel[type] || {};
              const total = Object.values(byLevel).reduce((s, n) => s + n, 0);

              return (
                <div key={type} className={`rounded-2xl border p-4 ${tone(type)}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-black">{label(type)}</div>
                    <div className="text-2xl font-black">{total}</div>
                  </div>
                  {total > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {Object.entries(byLevel)
                        .sort(([a], [b]) => Number(b) - Number(a))
                        .map(([lvl, count]) => (
                          <span
                            key={lvl}
                            className="rounded-lg bg-black/40 px-2 py-1 text-xs font-mono text-zinc-300"
                          >
                            lv{lvl}: {count}
                          </span>
                        ))}
                    </div>
                  )}
                  {total === 0 && (
                    <div className="mt-3 text-xs text-zinc-600">Nenhum em campo</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Lista completa de membros ─────────────────────────────────────── */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-[#090909] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black uppercase">Membros da gangue</h2>
              <p className="mt-1 text-sm text-zinc-400">Lista completa, persistida no servidor.</p>
            </div>
            <div className="rounded-2xl bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
              {gang?.members?.length || 0} registros
            </div>
          </div>

          {(gang?.members?.length || 0) === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center text-zinc-500">
              Nenhum membro ainda. Treine seu primeiro CT para começar.
            </div>
          ) : (
            <div className="space-y-3">
              {(gang?.members || []).map((member) => (
                <div key={member.id} className={`rounded-2xl border p-4 ${tone(member.type as GangMemberType)}`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-black">{label(member.type as GangMemberType)}</span>
                        <span className="rounded-lg bg-black/40 px-2 py-1 text-xs font-mono text-zinc-300">
                          lv {member.level}
                        </span>
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(member.status)}`}>
                          {statusLabel(member.status)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                        <span>ID {member.id.slice(0, 12)}</span>
                        {member.recruitedAt && (
                          <span>• recrutado {new Date(member.recruitedAt).toLocaleDateString('pt-BR')}</span>
                        )}
                        {member.injuryEndsAt && (
                          <span>• recupera {new Date(member.injuryEndsAt).toLocaleTimeString('pt-BR')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                      {member.status === 'ativo' && <Shield className="h-4 w-4" />}
                      {member.status === 'treinando' && <Zap className="h-4 w-4" />}
                      {member.status === 'morto' && <Swords className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Modal de treinamento ─────────────────────────────────────────────── */}
      {trainingModalOpen && selectedCT && player && (
        <GangTrainingModal
          isOpen={trainingModalOpen}
          slotKey={selectedCT}
          player={player as any}
          trainingState={{ trainingSlots } as any}
          onClose={handleCloseTrainingModal}
          onStartTraining={async (slotKey, memberType, troopLevel) => {
            await queueTraining(slotKey, memberType, troopLevel);
            // Mantém o modal aberto para o jogador ver o slot ativo
          }}
          onCollectTraining={async (slotId) => {
            await collectTraining(slotId);
            // Mantém o modal aberto, agora vai mostrar "1 - Escolha o tipo"
          }}
          isSubmitting={isSubmitting}
        />
      )}

      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function Stat({
  label, value, tone, highlight = false,
}: {
  label: string;
  value: string;
  tone: 'cyan' | 'amber' | 'emerald' | 'red';
  highlight?: boolean;
}) {
  const toneClass = {
    cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    red: 'border-red-500/20 bg-red-500/10 text-red-300',
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 ${toneClass} ${highlight ? 'animate-pulse' : ''}`}>
      <div className="text-xs uppercase">{label}</div>
      <div className="mt-1 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

function CTCard({
  ctKey, slot, now, onOpen, onCollect, isSubmitting,
}: {
  ctKey: CTKey;
  slot: { id: string; troopType: string; troopLevel: number; quantity: number; startedAt: number; endsAt: number; status: string } | undefined;
  now: number;
  onOpen: () => void;
  onCollect: (slotId: string) => void;
  isSubmitting: boolean;
}) {
  const meta = CT_LABELS[ctKey];
  const isReady = !!slot && (slot.status === 'completed' || now >= slot.endsAt);
  const isTraining = !!slot && !isReady;
  const remainingMs = slot ? Math.max(0, slot.endsAt - now) : 0;
  const progress = slot
    ? Math.min(100, Math.max(0, ((now - slot.startedAt) / (slot.endsAt - slot.startedAt)) * 100))
    : 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 transition ${
        isReady
          ? 'border-amber-500/40 bg-amber-500/10 animate-pulse'
          : isTraining
            ? 'border-cyan-500/30 bg-cyan-500/5'
            : 'border-white/10 bg-black/30 hover:border-white/30'
      }`}
    >
      {/* Cabeçalho do CT */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-zinc-500" />
          <div>
            <div className="font-black uppercase">{meta.name}</div>
            <div className="text-xs text-zinc-500">{meta.subtitle}</div>
          </div>
        </div>
        {isReady ? (
          <CheckCircle2 className="h-5 w-5 text-amber-400" />
        ) : isTraining ? (
          <Clock3 className="h-5 w-5 text-cyan-400" />
        ) : (
          <Circle className="h-5 w-5 text-zinc-700" />
        )}
      </div>

      {/* Corpo */}
      {!slot && (
        <div className="mt-4">
          <div className="text-sm text-zinc-500 mb-3">Livre</div>
          <button
            onClick={onOpen}
            className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-red-500 transition"
          >
            Iniciar treinamento
          </button>
        </div>
      )}

      {slot && (
        <div className="mt-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-base font-black uppercase">
                {label(slot.troopType as GangMemberType)}
                <span className="ml-2 text-zinc-400 text-sm">nível {slot.troopLevel}</span>
              </div>
              <div className="text-xs text-zinc-500">{slot.quantity} unidades</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase text-zinc-500">
                {isReady ? 'Status' : 'Restante'}
              </div>
              <div className={`text-lg font-black ${isReady ? 'text-amber-300' : 'text-cyan-300'}`}>
                {isReady ? 'PRONTO' : formatDuration(remainingMs)}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/40">
            <div
              style={{ width: `${progress}%` }}
              className={`h-full rounded-full transition-all duration-700 ${
                isReady
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                  : 'bg-gradient-to-r from-cyan-400 to-cyan-200'
              }`}
            />
          </div>

          {/* Botão de ação */}
          <div className="mt-3 flex gap-2">
            {isReady ? (
              <button
                onClick={() => onCollect(slot.id)}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 px-4 py-2.5 text-sm font-black uppercase text-black hover:scale-[1.02] transition disabled:opacity-50"
              >
                Coletar tropas
              </button>
            ) : (
              <button
                onClick={onOpen}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold uppercase text-zinc-300 hover:bg-white/10 transition disabled:opacity-50"
              >
                Ver detalhes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}