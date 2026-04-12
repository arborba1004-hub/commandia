import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GangBattleStats from '@/components/gang/GangBattleStats';
import GangFormationSelector from '@/components/gang/GangFormationSelector';
import { useGangStore } from '@/store/gangStore';
import { useNavigate } from 'react-router-dom';
import { Plus, Shield, Swords, Trash2, Zap } from 'lucide-react';

function getRarityClasses(rarity: string) {
  switch (rarity) {
    case 'Mítico':
      return 'border-red-500/30 bg-red-500/10 text-red-300';
    case 'Lendário':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-300';
    case 'Épico':
      return 'border-purple-500/30 bg-purple-500/10 text-purple-300';
    case 'Raro':
      return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';
    default:
      return 'border-white/10 bg-white/[0.03] text-zinc-200';
  }
}

export default function GangPage() {
  const navigate = useNavigate();

  const myGang = useGangStore((state) => state.myGang);
  const isLoading = useGangStore((state) => state.isLoading);
  const error = useGangStore((state) => state.error);
  const initializeGang = useGangStore((state) => state.initializeGang);
  const fetchMyGang = useGangStore((state) => state.fetchMyGang);
  const recruitMember = useGangStore((state) => state.recruitMember);
  const trainMember = useGangStore((state) => state.trainMember);
  const toggleActive = useGangStore((state) => state.toggleActive);
  const dismissMember = useGangStore((state) => state.dismissMember);
  const getActiveMembers = useGangStore((state) => state.getActiveMembers);
  const getReserveMembers = useGangStore((state) => state.getReserveMembers);

  const [recruiting, setRecruiting] = useState<null | 'mission' | 'market' | 'premium'>(null);
  const [trainingId, setTrainingId] = useState<string | null>(null);

  useEffect(() => {
    initializeGang();
    void fetchMyGang();
  }, [initializeGang, fetchMyGang]);

  const activeMembers = useMemo(() => getActiveMembers(), [getActiveMembers, myGang]);
  const reserveMembers = useMemo(() => getReserveMembers(), [getReserveMembers, myGang]);

  const handleRecruit = async (method: 'mission' | 'market' | 'premium') => {
    setRecruiting(method);
    try {
      await recruitMember(method);
    } finally {
      setRecruiting(null);
    }
  };

  const handleTrain = async (memberId: string, premium = false) => {
    setTrainingId(memberId);
    try {
      await trainMember(memberId, premium);
    } finally {
      setTrainingId(null);
    }
  };

  if (!myGang && isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black text-white flex items-center justify-center pt-[140px] md:pt-[160px]">
          Carregando gangue...
        </div>
        <Footer />
      </>
    );
  }

  const gang = myGang;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-4 pt-[140px] md:pt-[160px] pb-20">
        <div className="max-w-7xl mx-auto">
          <section className="mb-8 rounded-3xl border border-red-500/20 bg-gradient-to-r from-red-950/30 to-black p-6 md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-red-400">
                  Centro tático da gangue
                </p>
                <h1 className="mt-3 text-4xl md:text-6xl font-black tracking-tight text-white">
                  {gang?.name || 'Minha Gangue'}
                </h1>
                <p className="mt-3 max-w-2xl text-zinc-400">
                  Monte sua composição ativa, treine integrantes, ajuste formação e
                  prepare sua tropa para invasões, defesa e saque.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-zinc-500">
                    Slots
                  </div>
                  <div className="mt-1 text-2xl font-black">{gang?.slots || 0}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-zinc-500">
                    Nível
                  </div>
                  <div className="mt-1 text-2xl font-black">{gang?.level || 1}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-zinc-500">
                    Vitórias
                  </div>
                  <div className="mt-1 text-2xl font-black">{gang?.totalVictories || 0}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-zinc-500">
                    Derrotas
                  </div>
                  <div className="mt-1 text-2xl font-black">{gang?.totalDefeats || 0}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => handleRecruit('mission')}
                disabled={recruiting !== null}
                className="rounded-2xl bg-amber-500 px-5 py-3 font-black text-black disabled:opacity-50"
              >
                {recruiting === 'mission' ? 'Recrutando...' : 'Recrutar Rua'}
              </button>
              <button
                onClick={() => handleRecruit('market')}
                disabled={recruiting !== null}
                className="rounded-2xl bg-cyan-500 px-5 py-3 font-black text-black disabled:opacity-50"
              >
                {recruiting === 'market' ? 'Recrutando...' : 'Mercado Negro'}
              </button>
              <button
                onClick={() => handleRecruit('premium')}
                disabled={recruiting !== null}
                className="rounded-2xl bg-purple-500 px-5 py-3 font-black text-white disabled:opacity-50"
              >
                {recruiting === 'premium' ? 'Recrutando...' : 'Premium'}
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

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="rounded-3xl border border-white/10 bg-[#090909] p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">
                    Tropa Ativa
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Esses membros entram na composição de ataque e defesa.
                  </p>
                </div>
                <div className="rounded-2xl bg-red-500/10 px-3 py-2 text-sm font-bold text-red-300">
                  {activeMembers.length}/{gang?.slots || 0}
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
                      className={`rounded-3xl border p-5 ${getRarityClasses(member.rarity)}`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-black">{member.name}</h3>
                            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold">
                              {member.class}
                            </span>
                            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold">
                              {member.rarity}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="rounded-xl bg-black/30 px-3 py-2">
                              <div className="text-zinc-400">Nível</div>
                              <div className="font-bold">{member.level}</div>
                            </div>
                            <div className="rounded-xl bg-black/30 px-3 py-2">
                              <div className="text-zinc-400">Lealdade</div>
                              <div className="font-bold">{member.loyalty}</div>
                            </div>
                            <div className="rounded-xl bg-black/30 px-3 py-2">
                              <div className="text-zinc-400">Vitórias</div>
                              <div className="font-bold">{member.victories}</div>
                            </div>
                            <div className="rounded-xl bg-black/30 px-3 py-2">
                              <div className="text-zinc-400">Derrotas</div>
                              <div className="font-bold">{member.defeats}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <button
                            onClick={() => handleTrain(member.id, false)}
                            disabled={trainingId === member.id}
                            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-black disabled:opacity-50"
                          >
                            <Zap className="h-4 w-4" />
                            {trainingId === member.id ? 'Treinando...' : 'Treinar'}
                          </button>

                          <button
                            onClick={() => handleTrain(member.id, true)}
                            disabled={trainingId === member.id}
                            className="inline-flex items-center gap-2 rounded-2xl bg-purple-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                          >
                            <Swords className="h-4 w-4" />
                            Premium
                          </button>

                          <button
                            onClick={() => void toggleActive(member.id)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-black"
                          >
                            <Shield className="h-4 w-4" />
                            Reserva
                          </button>

                          <button
                            onClick={() => void dismissMember(member.id)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                            Dispensar
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
                    Reserva da Gangue
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Membros fora da composição ativa, prontos para rotação.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 px-3 py-2 text-sm font-bold text-zinc-300">
                  {reserveMembers.length} reservas
                </div>
              </div>

              <div className="space-y-4">
                {reserveMembers.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-zinc-500">
                    Nenhum integrante na reserva.
                  </div>
                ) : (
                  reserveMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`rounded-3xl border p-5 ${getRarityClasses(member.rarity)}`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-black">{member.name}</h3>
                            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold">
                              {member.class}
                            </span>
                            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold">
                              {member.rarity}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-300">
                            <span className="rounded-xl bg-black/30 px-3 py-2">
                              Lv. {member.level}
                            </span>
                            <span className="rounded-xl bg-black/30 px-3 py-2">
                              Lealdade {member.loyalty}
                            </span>
                            <span className="rounded-xl bg-black/30 px-3 py-2">
                              Skills {member.skills.length}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <button
                            onClick={() => void toggleActive(member.id)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-black"
                          >
                            <Plus className="h-4 w-4" />
                            Ativar
                          </button>

                          <button
                            onClick={() => handleTrain(member.id, false)}
                            disabled={trainingId === member.id}
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
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}