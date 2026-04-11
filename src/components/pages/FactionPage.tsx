import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useFactionStore } from '@/store/factionStore';
import { usePlayerStore } from '@/store/playerStore';

export default function FactionPage() {
  const player = usePlayerStore((state) => state.player);

  const myFaction = useFactionStore((state) => state.myFaction);
  const isLoading = useFactionStore((state) => state.isLoading);
  const isSubmitting = useFactionStore((state) => state.isSubmitting);
  const error = useFactionStore((state) => state.error);
  const loadMyFaction = useFactionStore((state) => state.loadMyFaction);
  const createFaction = useFactionStore((state) => state.createFaction);
  const joinFaction = useFactionStore((state) => state.joinFaction);

  const [createName, setCreateName] = useState('');
  const [createTag, setCreateTag] = useState('');
  const [joinFactionId, setJoinFactionId] = useState('');

  useEffect(() => {
    void loadMyFaction();
  }, [loadMyFaction]);

  const currentPlayerId = String(player?._id || player?.googleId || '');
  const isLeader = useMemo(() => {
    return Boolean(myFaction && String(myFaction.leaderId) === currentPlayerId);
  }, [myFaction, currentPlayerId]);

  const memberCount = myFaction?.memberIds?.length || 0;

  const expPercent = useMemo(() => {
    if (!myFaction) return 0;
    const total = Math.max(1, Number(myFaction.expToNext || 100));
    const current = Math.max(0, Number(myFaction.exp || 0));
    return Math.min(100, (current / total) * 100);
  }, [myFaction]);

  const formatMoney = (value: number) => {
    if (!Number.isFinite(value)) return '0';
    return value.toLocaleString('pt-BR');
  };

  const handleCreateFaction = async () => {
    const ok = await createFaction(createName, createTag);
    if (ok) {
      setCreateName('');
      setCreateTag('');
    }
  };

  const handleJoinFaction = async () => {
    const ok = await joinFaction(joinFactionId);
    if (ok) {
      setJoinFactionId('');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-28 pt-[140px] md:pt-[160px]">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-black uppercase tracking-wide">
            Facção
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie sua facção, entre em uma já existente e acompanhe o progresso coletivo.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-border bg-card">
            <p className="text-muted-foreground">Carregando facção...</p>
          </div>
        ) : myFaction ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            <section className="rounded-3xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-red-400">
                    Minha facção
                  </div>
                  <h2 className="mt-2 font-heading text-3xl font-black uppercase">
                    {myFaction.name}
                  </h2>
                  <div className="mt-2 inline-flex rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-white">
                    [{myFaction.tag}]
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background px-4 py-3 text-right">
                  <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                    Seu status
                  </div>
                  <div className="mt-1 text-lg font-black text-foreground">
                    {isLeader ? 'Líder' : 'Membro'}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl bg-background px-4 py-3">
                  <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                    Nível
                  </div>
                  <div className="mt-1 text-2xl font-black">{myFaction.level}</div>
                </div>

                <div className="rounded-2xl bg-background px-4 py-3">
                  <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                    Membros
                  </div>
                  <div className="mt-1 text-2xl font-black">{memberCount}</div>
                </div>

                <div className="rounded-2xl bg-background px-4 py-3">
                  <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                    Líder
                  </div>
                  <div className="mt-1 truncate text-base font-black">
                    {String(myFaction.leaderId) === currentPlayerId ? 'Você' : myFaction.leaderId}
                  </div>
                </div>

                <div className="rounded-2xl bg-background px-4 py-3">
                  <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                    ID Facção
                  </div>
                  <div className="mt-1 truncate text-base font-black">{myFaction.id}</div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-background p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                    Progresso de EXP
                  </span>
                  <span className="text-sm font-bold">
                    {myFaction.exp}/{myFaction.expToNext}
                  </span>
                </div>

                <div className="h-4 overflow-hidden rounded-full bg-black/30">
                  <div
                    className="h-full rounded-full bg-red-600 transition-all"
                    style={{ width: `${expPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-background p-4">
                <div className="mb-3 text-sm font-black uppercase tracking-wide text-muted-foreground">
                  Tesouro da facção
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-border px-4 py-3">
                    <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                      Dinheiro sujo
                    </div>
                    <div className="mt-1 text-lg font-black">
                      {formatMoney(myFaction.treasury.dirtyMoney)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border px-4 py-3">
                    <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                      Dinheiro limpo
                    </div>
                    <div className="mt-1 text-lg font-black">
                      {formatMoney(myFaction.treasury.cleanMoney)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border px-4 py-3">
                    <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                      Corre
                    </div>
                    <div className="mt-1 text-lg font-black">
                      {formatMoney(myFaction.treasury.corre)}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="rounded-3xl border border-border bg-card p-5">
              <div className="text-sm font-black uppercase tracking-wide text-muted-foreground">
                Membros da facção
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {myFaction.memberIds.length === 0 ? (
                  <div className="rounded-2xl bg-background px-4 py-4 text-sm text-muted-foreground">
                    Nenhum membro encontrado.
                  </div>
                ) : (
                  myFaction.memberIds.map((memberId, index) => (
                    <div
                      key={`${memberId}-${index}`}
                      className="rounded-2xl border border-border bg-background px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                            Membro
                          </div>
                          <div className="truncate font-bold">
                            {memberId === currentPlayerId ? 'Você' : memberId}
                          </div>
                        </div>

                        {memberId === myFaction.leaderId && (
                          <span className="rounded-full bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                            Líder
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-3xl border border-border bg-card p-5">
              <h2 className="font-heading text-2xl font-black uppercase">
                Criar facção
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Monte sua própria organização e convide jogadores para crescer com você.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Nome da facção"
                  className="rounded-2xl border border-border bg-background px-4 py-3 outline-none"
                />

                <input
                  value={createTag}
                  onChange={(e) => setCreateTag(e.target.value.toUpperCase())}
                  placeholder="Tag da facção"
                  className="rounded-2xl border border-border bg-background px-4 py-3 uppercase outline-none"
                  maxLength={8}
                />

                <button
                  type="button"
                  onClick={() => {
                    void handleCreateFaction();
                  }}
                  disabled={isSubmitting}
                  className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50"
                >
                  {isSubmitting ? 'Criando...' : 'Criar facção'}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-5">
              <h2 className="font-heading text-2xl font-black uppercase">
                Entrar em facção
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Entre usando o ID de uma facção já existente.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <input
                  value={joinFactionId}
                  onChange={(e) => setJoinFactionId(e.target.value)}
                  placeholder="ID da facção"
                  className="rounded-2xl border border-border bg-background px-4 py-3 outline-none"
                />

                <button
                  type="button"
                  onClick={() => {
                    void handleJoinFaction();
                  }}
                  disabled={isSubmitting}
                  className="rounded-2xl border border-border bg-background px-5 py-3 text-sm font-black uppercase tracking-wide text-foreground disabled:opacity-50"
                >
                  {isSubmitting ? 'Entrando...' : 'Entrar na facção'}
                </button>
              </div>

              <div className="mt-5 rounded-2xl bg-background p-4 text-sm text-muted-foreground">
                Com o backend atual, a entrada é feita por <strong>ID da facção</strong>.
                Depois a gente amplia para lista pública, convite e pedidos.
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
