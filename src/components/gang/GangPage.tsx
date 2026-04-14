import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GangBattleStats from '@/components/gang/GangBattleStats';
import GangFormationSelector from '@/components/gang/GangFormationSelector';
import { useGangStore } from '@/store/gangStore';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowUpCircle,
  Coins,
  HeartPulse,
  Plus,
  Shield,
  Swords,
  Wallet,
  Zap,
} from 'lucide-react';
import type { GangMemberType, GangUnit } from '@/types/gangWar';

function getMemberLabel(type: GangMemberType) {
  if (type === 'capanga') return 'Capanga';
  if (type === 'frente') return 'Frente';
  if (type === 'executor') return 'Executor';
  if (type === 'assassino') return 'Assassino';
  if (type === 'muralha') return 'Muralha';
  if (type === 'certeiro') return 'Certeiro';
  if (type === 'motorista') return 'Motorista';
  if (type === 'nitro') return 'Nitro';
  if (type === 'armeiro') return 'Armeiro';
  if (type === 'informante') return 'Informante';
  if (type === 'wifi') return 'WiFi';
  if (type === 'medico') return 'Médico';
  if (type === 'lavador') return 'Lavador';
  if (type === 'ladrao') return 'Ladrão';
  return 'Negociador';
}

function getMemberRole(type: GangMemberType) {
  if (type === 'capanga' || type === 'frente' || type === 'executor') {
    return 'Linha de frente';
  }
  if (type === 'muralha') return 'Defesa pesada';
  if (type === 'assassino' || type === 'certeiro') return 'Ofensiva';
  if (type === 'motorista' || type === 'nitro') return 'Mobilidade';
  if (type === 'armeiro' || type === 'informante' || type === 'wifi') {
    return 'Tático';
  }
  if (type === 'medico' || type === 'negociador') return 'Suporte';
  return 'Econômico';
}

function getTypeBadgeClasses(type: GangMemberType) {
  if (type === 'assassino' || type === 'executor' || type === 'frente') {
    return 'border-red-500/30 bg-red-500/10 text-red-300';
  }
  if (type === 'muralha' || type === 'medico') {
    return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';
  }
  if (type === 'motorista' || type === 'nitro') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  }
  if (type === 'lavador' || type === 'ladrao' || type === 'negociador') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  }
  return 'border-white/10 bg-white/[0.03] text-zinc-200';
}

function getStatusLabel(status: GangUnit['status']) {
  if (status === 'ativo') return 'Ativo';
  if (status === 'ferido') return 'Ferido';
  if (status === 'morto') return 'Morto';
  return 'Treinando';
}

function getStatusClasses(status: GangUnit['status']) {
  if (status === 'ativo') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  }
  if (status === 'ferido') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  }
  if (status === 'morto') {
    return 'border-red-500/30 bg-red-500/10 text-red-300';
  }
  return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';
}

const RECRUIT_OPTIONS: GangMemberType[] = [
  'capanga',
  'frente',
  'executor',
  'assassino',
  'muralha',
  'certeiro',
  'motorista',
  'nitro',
  'armeiro',
  'informante',
  'wifi',
  'medico',
  'lavador',
  'ladrao',
  'negociador',
];

export default function GangPage() {
  const navigate = useNavigate();

  const gang = useGangStore((state) => state.gang);
  const isLoading = useGangStore((state) => state.isLoading);
  const isSubmitting = useGangStore((state) => state.isSubmitting);
  const error = useGangStore((state) => state.error);

  const loadGang = useGangStore((state) => state.loadGang);
  const recruitMember = useGangStore((state) => state.recruitMember);
  const startTrainingMember = useGangStore((state) => state.startTrainingMember);
  const completeFinishedTrainings = useGangStore(
    (state) => state.completeFinishedTrainings
  );
  const upgradeCT = useGangStore((state) => state.upgradeCT);
  const payMaintenance = useGangStore((state) => state.payMaintenance);

  const [recruitingType, setRecruitingType] = useState<GangMemberType | null>(null);
  const [trainingId, setTrainingId] = useState<string | null>(null);

  useEffect(() => {
    void loadGang();
  }, [loadGang]);

  const members = gang?.members || [];

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === 'ativo'),
    [members]
  );

  const injuredMembers = useMemo(
    () => members.filter((member) => member.status === 'ferido'),
    [members]
  );

  const deadMembers = useMemo(
    () => members.filter((member) => member.status === 'morto'),
    [members]
  );

  const trainingMembers = useMemo(
    () => members.filter((member) => member.status === 'treinando'),
    [members]
  );

  const otherMembers = useMemo(
    () =>
      members.filter(
        (member) => member.status === 'ferido' || member.status === 'treinando'
      ),
    [members]
  );
const handleRecruit = async (type: GangMemberType) => {
    setRecruitingType(type);
    try {
      await recruitMember(type);
    } finally {
      setRecruitingType(null);
    }
  };

  const handleTrain = async (memberId: string) => {
    setTrainingId(memberId);
    try {
      await startTrainingMember(memberId);
    } finally {
      setTrainingId(null);
    }
  };

  if (!gang && isLoading) {
    return (
      <>
        <Header />
        <div className="flex min-h-screen items-center justify-center bg-black pt-[140px] text-white md:pt-[160px]">
          Carregando gangue...
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Header />

      <main className="flex-1 px-4 pb-20 pt-[140px] md:pt-[160px]">
        <div className="mx-auto max-w-7xl">
          <section className="mb-8 rounded-3xl border border-red-500/20 bg-gradient-to-r from-red-950/30 to-black p-6 md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-red-400">
                  Centro tático da gangue
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-6xl">
                  Centro de Treinamento
                </h1>
                <p className="mt-3 max-w-2xl text-zinc-400">
                  Recrute operadores, fortaleça sua composição, mantenha a tropa
                  treinada e prepare sua gangue para ataque e defesa no mapa.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-zinc-500">
                    CT
                  </div>
                  <div className="mt-1 text-2xl font-black">
                    Nv. {gang?.ct.level || 1}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-zinc-500">
                    Slots treino
                  </div>
                  <div className="mt-1 text-2xl font-black">
                    {gang?.ct.trainingSlots || 1}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-zinc-500">
                    Capacidade
                  </div>
                  <div className="mt-1 text-2xl font-black">
                    {members.length}/{gang?.maxMembers || 0}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-zinc-500">
                    Manutenção
                  </div>
                  <div className="mt-1 text-2xl font-black">
                    {Number(gang?.dailyUpkeep.totalDirtyMoneyCost || 0).toLocaleString(
                      'pt-BR'
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  void completeFinishedTrainings();
                }}
                disabled={isSubmitting}
                className="rounded-2xl bg-amber-500 px-5 py-3 font-black text-black disabled:opacity-50"
              >
                Concluir treinos
              </button>

              <button
                onClick={() => {
                  void upgradeCT();
                }}
                disabled={isSubmitting}
                className="rounded-2xl bg-cyan-500 px-5 py-3 font-black text-black disabled:opacity-50"
              >
                Evoluir CT
              </button>

              <button
                onClick={() => {
                  void payMaintenance();
                }}
                disabled={isSubmitting}
                className="rounded-2xl bg-emerald-500 px-5 py-3 font-black text-black disabled:opacity-50"
              >
                Pagar manutenção
              </button>

              <button
                onClick={() => navigate('/game')}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white"
              >
                Voltar ao mapa
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </section>

          <section className="mb-8">
            <GangBattleStats />
          </section>

          <section className="mb-8">
            <GangFormationSelector />
          </section>

          <section className="mb-8 rounded-3xl border border-white/10 bg-[#090909] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">
                  Recrutamento
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Cada operador fortalece uma parte diferente da sua máquina de
                  guerra.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {RECRUIT_OPTIONS.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    void handleRecruit(type);
                  }}
                  disabled={isSubmitting || recruitingType !== null}
                  className={`rounded-3xl border p-4 text-left transition hover:scale-[1.01] ${getTypeBadgeClasses(
                    type
                  )} disabled:opacity-50`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-black">{getMemberLabel(type)}</div>
                      <div className="mt-1 text-sm opacity-80">
                        {getMemberRole(type)}
                      </div>
                    </div>
                    <Plus className="h-5 w-5 shrink-0" />
                  </div>

                  <div className="mt-4 text-xs uppercase tracking-wide opacity-70">
                    {recruitingType === type ? 'Recrutando...' : 'Recrutar'}
                  </div>
                </button>
              ))}
            </div>
          </section>
<section className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-[#090909] p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">
                    Tropa ativa
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Operadores prontos para entrar em combate agora.
                  </p>
                </div>

                <div className="rounded-2xl bg-red-500/10 px-3 py-2 text-sm font-bold text-red-300">
                  {activeMembers.length} ativos
                </div>
              </div>

              <div className="space-y-4">
                {activeMembers.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-zinc-500">
                    Nenhum integrante ativo ainda.
                  </div>
                ) : (
                  activeMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`rounded-3xl border p-5 ${getTypeBadgeClasses(member.type)}`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-black">
                              {getMemberLabel(member.type)}
                            </h3>

                            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold">
                              {getMemberRole(member.type)}
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                                member.status
                              )}`}
                            >
                              {getStatusLabel(member.status)}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                            <div className="rounded-xl bg-black/30 px-3 py-2">
                              <div className="text-zinc-400">Nível</div>
                              <div className="font-bold">{member.level}</div>
                            </div>

                            <div className="rounded-xl bg-black/30 px-3 py-2">
                              <div className="text-zinc-400">Recrutado</div>
                              <div className="font-bold">
                                {new Date(member.recruitedAt).toLocaleDateString('pt-BR')}
                              </div>
                            </div>

                            <div className="rounded-xl bg-black/30 px-3 py-2">
                              <div className="text-zinc-400">Treino</div>
                              <div className="font-bold">
                                {member.trainingEndsAt ? 'Em andamento' : 'Livre'}
                              </div>
                            </div>

                            <div className="rounded-xl bg-black/30 px-3 py-2">
                              <div className="text-zinc-400">Condição</div>
                              <div className="font-bold">
                                {getStatusLabel(member.status)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <button
                            onClick={() => {
                              void handleTrain(member.id);
                            }}
                            disabled={
                              trainingId === member.id ||
                              isSubmitting ||
                              member.status !== 'ativo'
                            }
                            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-black disabled:opacity-50"
                          >
                            <Zap className="h-4 w-4" />
                            {trainingId === member.id ? 'Treinando...' : 'Treinar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#090909] p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">
                    Feridos, treino e perdas
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Controle de recuperação, treino e baixas da gangue.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 px-3 py-2 text-sm font-bold text-zinc-300">
                  {otherMembers.length + deadMembers.length} registros
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <div className="flex items-center gap-2 text-amber-300">
                    <HeartPulse className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-wide">
                      Feridos
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    {injuredMembers.length}
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-wide">
                      Treinando
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    {trainingMembers.length}
                  </div>
                </div>

                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                  <div className="flex items-center gap-2 text-red-300">
                    <Swords className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-wide">
                      Mortos
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    {deadMembers.length}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {otherMembers.length === 0 && deadMembers.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-zinc-500">
                    Nenhum registro fora da tropa ativa.
                  </div>
                ) : (
                  [...otherMembers, ...deadMembers].map((member) => (
                    <div
                      key={member.id}
                      className={`rounded-3xl border p-5 ${getTypeBadgeClasses(member.type)}`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-black">
                              {getMemberLabel(member.type)}
                            </h3>

                            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold">
                              {getMemberRole(member.type)}
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                                member.status
                              )}`}
                            >
                              {getStatusLabel(member.status)}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-300">
                            <span className="rounded-xl bg-black/30 px-3 py-2">
                              Lv. {member.level}
                            </span>

                            {member.injuryEndsAt && (
                              <span className="rounded-xl bg-black/30 px-3 py-2">
                                Recupera em{' '}
                                {new Date(member.injuryEndsAt).toLocaleString('pt-BR')}
                              </span>
                            )}

                            {member.trainingEndsAt && (
                              <span className="rounded-xl bg-black/30 px-3 py-2">
                                Treino até{' '}
                                {new Date(member.trainingEndsAt).toLocaleString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>

                        {member.status === 'ativo' && (
                          <div className="flex flex-wrap gap-2 lg:justify-end">
                            <button
                              onClick={() => {
                                void handleTrain(member.id);
                              }}
                              disabled={trainingId === member.id || isSubmitting}
                              className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-black disabled:opacity-50"
                            >
                              <ArrowUpCircle className="h-4 w-4" />
                              {trainingId === member.id ? 'Treinando...' : 'Treinar'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
<section className="mt-8 rounded-3xl border border-white/10 bg-[#090909] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">
                  Custos operacionais
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Sustente sua máquina de guerra com dinheiro sujo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Coins className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-wide">
                    Manutenção diária
                  </span>
                </div>
                <div className="mt-3 text-3xl font-black text-white">
                  {Number(gang?.dailyUpkeep.totalDirtyMoneyCost || 0).toLocaleString(
                    'pt-BR'
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-wide">
                    Recuperação do CT
                  </span>
                </div>
                <div className="mt-3 text-3xl font-black text-white">
                  +{gang?.ct.recoveryBonusPercent || 0}%
                </div>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
                <div className="flex items-center gap-2 text-amber-300">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-wide">
                    Velocidade de treino
                  </span>
                </div>
                <div className="mt-3 text-3xl font-black text-white">
                  +{gang?.ct.trainingSpeedBonusPercent || 0}%
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}