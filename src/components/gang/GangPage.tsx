import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useGangStore } from '@/store/gangStore';
import { usePlayerStore } from '@/store/playerStore';
import type { GangMemberType, GangUnit } from '@/types/gangWar';
import { Clock3, Plus, Shield, Swords, Zap } from 'lucide-react';
import GangFormationSelector from '@/components/gang/GangFormationSelector';

const RECRUIT_TYPES: GangMemberType[] = [
  'capanga',
  'frente',
  'executor',
  'muralha',
  'certeiro',
  'motorista',
  'nitro',
  'armeiro',
  'informante',
  'wifi',
  'medico',
  'lavador',
  'negociador',
];

const ATTACK_ORDER: GangMemberType[] = [
  'muralha',
  'frente',
  'executor',
  'capanga',
  'nitro',
  'certeiro',
  'motorista',
  'armeiro',
  'informante',
  'wifi',
  'medico',
  'lavador',
  'negociador',
];

function label(type: GangMemberType) {
  return {
    capanga: 'Capanga',
    frente: 'Frente',
    executor: 'Executor',
    muralha: 'Muralha',
    certeiro: 'Certeiro',
    motorista: 'Motorista',
    nitro: 'Nitro',
    armeiro: 'Armeiro',
    informante: 'Informante',
    wifi: 'WiFi',
    medico: 'Médico',
    lavador: 'Lavador',
    negociador: 'Negociador',
  }[type];
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
  if (['muralha', 'medico'].includes(type)) return 'border-cyan-500/20 bg-cyan-500/5';
  if (['frente', 'executor', 'certeiro'].includes(type)) return 'border-red-500/20 bg-red-500/5';
  if (['motorista', 'nitro'].includes(type)) return 'border-amber-500/20 bg-amber-500/5';
  if (['lavador', 'negociador'].includes(type)) return 'border-emerald-500/20 bg-emerald-500/5';
  return 'border-white/10 bg-white/[0.03]';
}

export default function GangPage() {
  const player = usePlayerStore((state) => state.player);
  const gang = useGangStore((state) => state.gang);
  const isLoading = useGangStore((state) => state.isLoading);
  const isSubmitting = useGangStore((state) => state.isSubmitting);
  const error = useGangStore((state) => state.error);
  const loadGang = useGangStore((state) => state.loadGang);
  const recruitMember = useGangStore((state) => state.recruitMember);
  const queueTraining = useGangStore((state) => state.queueTraining);
  const completeFinishedTrainings = useGangStore((state) => state.completeFinishedTrainings);
  const upgradeCT = useGangStore((state) => state.upgradeCT);
  const setFormation = useGangStore((state) => state.setFormation);

  const [recruiting, setRecruiting] = useState<GangMemberType | null>(null);
  const [queueing, setQueueing] = useState<GangMemberType | null>(null);

  useEffect(() => {
    void loadGang();
  }, [loadGang]);

  // Auto-complete finished trainings every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const hasFinishedJobs = (gang?.trainingJobs || []).some(
        (job) => !job.completed && new Date(job.endsAt).getTime() <= now
      );
      
      if (hasFinishedJobs) {
        void completeFinishedTrainings();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [gang?.trainingJobs, completeFinishedTrainings]);

  const activeJobs = useMemo(
    () => (gang?.trainingJobs || []).filter((job) => !job.completed),
    [gang?.trainingJobs]
  );

  const slotsUsed = activeJobs.length;
  const slotsTotal = gang?.trainingConfig?.slots || gang?.ct?.trainingSlots || 0;
  const slotsFree = Math.max(0, slotsTotal - slotsUsed);
  const qtyPerOrder = gang?.trainingConfig?.quantityPerOrder || 10;
  const duration = gang?.trainingConfig?.durationSeconds || 10;
  const activeByType = gang?.troopSummary?.activeByType;

  async function handleRecruit(type: GangMemberType) {
    setRecruiting(type);
    try {
      await recruitMember(type);
    } finally {
      setRecruiting(null);
    }
  }

  async function handleQueue(type: GangMemberType) {
    setQueueing(type);
    try {
      await queueTraining(type, qtyPerOrder);
    } finally {
      setQueueing(null);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-[140px] md:pt-[160px]">
        <section className="rounded-3xl border border-red-500/20 bg-gradient-to-r from-red-950/30 to-black p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-red-400">gangue</div>
              <h1 className="mt-2 text-4xl font-black">Centro de Treinamento</h1>
              <p className="mt-3 max-w-3xl text-zinc-400">
                Treino em lote por slots e marcha manual para ataque no mapa. Cada ordem treina {qtyPerOrder} membros do tipo escolhido por operação.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <div className="text-xs uppercase text-cyan-300">Gang level</div>
                <div className="mt-1 text-2xl font-black">{gang?.gangLevel || 1}</div>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                <div className="text-xs uppercase text-amber-300">Slots</div>
                <div className="mt-1 text-2xl font-black">{slotsFree}/{slotsTotal}</div>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="text-xs uppercase text-emerald-300">Dinheiro sujo</div>
                <div className="mt-1 text-2xl font-black">{Number(player?.balances?.dirtyMoney || 0).toLocaleString('pt-BR')}</div>
              </div>
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <div className="text-xs uppercase text-red-300">Capacidade</div>
                <div className="mt-1 text-2xl font-black">{gang?.troopSummary?.totalMembers || 0}/{gang?.maxMembers || 0}</div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => void completeFinishedTrainings()}
              disabled={isSubmitting}
              className="rounded-2xl bg-amber-500 px-4 py-3 font-black text-black disabled:opacity-50"
            >
              Concluir treinos
            </button>
            <button
              onClick={() => void upgradeCT()}
              disabled={isSubmitting}
              className="rounded-2xl bg-cyan-500 px-4 py-3 font-black text-black disabled:opacity-50"
            >
              Evoluir CT
            </button>
            <button
              onClick={() => void setFormation('pressao_total')}
              disabled={isSubmitting}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold disabled:opacity-50"
            >
              Formação pressão total
            </button>
          </div>

          {error && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        </section>

        <section className="mt-8">
          <GangFormationSelector />
        </section>

        <section className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-[#090909] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase">Treino em lote</h2>
                <p className="mt-1 text-sm text-zinc-400">Cada slot treina um tipo por vez, no padrão parecido com marcha/tropa por categoria.</p>
              </div>
              <div className="rounded-2xl bg-zinc-900 px-3 py-2 text-sm text-zinc-300">{duration}s por operação</div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {ATTACK_ORDER.map((type) => (
                <div key={type} className={`rounded-2xl border p-4 ${tone(type)}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-black">{label(type)}</div>
                      <div className="mt-1 text-sm text-zinc-400">
                        Ativos: {activeByType?.[type] || 0}
                      </div>
                    </div>
                    <button
                      onClick={() => void handleQueue(type)}
                      disabled={isSubmitting || slotsFree <= 0 || queueing !== null}
                      className="rounded-xl bg-red-600 px-3 py-2 text-sm font-black text-white disabled:opacity-50"
                    >
                      {queueing === type ? 'Enfileirando...' : `Treinar +${qtyPerOrder}`}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#090909] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase">Filas de treino</h2>
                <p className="mt-1 text-sm text-zinc-400">Os 7 slots simultâneos ficam visíveis aqui.</p>
              </div>
              <div className="rounded-2xl bg-zinc-900 px-3 py-2 text-sm text-zinc-300">{activeJobs.length} em andamento</div>
            </div>

            <div className="space-y-3">
              {slotsTotal === 0 || isLoading ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-zinc-500">Carregando slots...</div>
              ) : Array.from({ length: slotsTotal }).map((_, index) => {
                const job = activeJobs[index];
                return (
                  <div key={index} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    {job ? (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm uppercase text-zinc-500">Slot {index + 1}</div>
                          <div className="mt-1 text-lg font-black">{label(job.memberType)}</div>
                          <div className="mt-1 text-sm text-zinc-400">+{job.quantity} membros • termina {new Date(job.endsAt).toLocaleTimeString('pt-BR')}</div>
                        </div>
                        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-cyan-300">
                          <Clock3 className="inline-block h-4 w-4 mr-1" />
                          Em treino
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm uppercase text-zinc-500">Slot {index + 1}</div>
                          <div className="mt-1 font-bold text-zinc-300">Livre</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-500">Disponível</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#090909] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black uppercase">Recrutamento direto</h2>
              <p className="mt-1 text-sm text-zinc-400">Mantive o recrutamento unitário para não quebrar seu fluxo atual.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {RECRUIT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => void handleRecruit(type)}
                disabled={isSubmitting || recruiting !== null}
                className={`rounded-2xl border p-4 text-left ${tone(type)} disabled:opacity-50`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-black">{label(type)}</div>
                    <div className="mt-1 text-sm text-zinc-400">Ativos: {activeByType?.[type] || 0}</div>
                  </div>
                  <Plus className="h-5 w-5" />
                </div>
                <div className="mt-3 text-xs uppercase tracking-wide text-zinc-400">{recruiting === type ? 'Recrutando...' : 'Recrutar 1'}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#090909] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black uppercase">Resumo da tropa para ataque</h2>
              <p className="mt-1 text-sm text-zinc-400">Esses números alimentam a escolha manual no modal de invasão do mapa.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ATTACK_ORDER.map((type) => (
              <div key={type} className={`rounded-2xl border p-4 ${tone(type)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-black">{label(type)}</div>
                    <div className="mt-1 text-sm text-zinc-400">Disponíveis para marcha</div>
                  </div>
                  <div className="text-2xl font-black">{activeByType?.[type] || 0}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#090909] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black uppercase">Lista de membros</h2>
              <p className="mt-1 text-sm text-zinc-400">Persistidos no backend com status real.</p>
            </div>
            <div className="rounded-2xl bg-zinc-900 px-3 py-2 text-sm text-zinc-300">{gang?.members?.length || 0} registros</div>
          </div>

          <div className="space-y-3">
            {(gang?.members || []).map((member) => (
              <div key={member.id} className={`rounded-2xl border p-4 ${tone(member.type)}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-black">{label(member.type)}</span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(member.status)}`}>{statusLabel(member.status)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-zinc-400">
                      <span className="rounded-xl bg-black/30 px-3 py-2">ID {member.id.slice(0, 8)}</span>
                      <span className="rounded-xl bg-black/30 px-3 py-2">Lv {member.level}</span>
                      {member.trainingEndsAt && <span className="rounded-xl bg-black/30 px-3 py-2">Treino até {new Date(member.trainingEndsAt).toLocaleTimeString('pt-BR')}</span>}
                      {member.injuryEndsAt && <span className="rounded-xl bg-black/30 px-3 py-2">Recupera {new Date(member.injuryEndsAt).toLocaleTimeString('pt-BR')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    {member.status === 'ativo' && <Shield className="h-4 w-4" />}
                    {member.status === 'treinando' && <Zap className="h-4 w-4" />}
                    {member.status === 'morto' && <Swords className="h-4 w-4" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
