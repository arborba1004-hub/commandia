import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useFactionStore } from '@/store/factionStore';
import { usePlayerStore } from '@/store/playerStore';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { FactionInvestmentBranch, FactionRole } from '@/types/faction';
import {
  FACTION_BRANCH_DESCRIPTIONS,
  FACTION_BRANCH_LABELS,
} from '@/types/faction';
import { getFactionInvestmentUpgradeCost } from '@/services/factionService';

type FactionTab =
  | 'overview'
  | 'members'
  | 'treasury'
  | 'investments'
  | 'logs'
  | 'diplomacy';

const INVESTMENT_BRANCHES: FactionInvestmentBranch[] = [
  'arsenalColetivo',
  'caixaOperacional',
  'mobilidade',
  'influencia',
  'inteligencia',
  'fortificacao',
  'logistica',
  'doutrina',
];

const ROLE_OPTIONS: FactionRole[] = [
  'member',
  'recruiter',
  'treasurer',
  'diplomat',
  'subleader',
];

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString('pt-BR');
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR');
}

function getCurrentPlayerId(player: any) {
  return String(player?._id || player?.googleId || '');
}

function getCurrentPlayerFactionRole(
  myFaction: any,
  currentPlayerId: string
): FactionRole | null {
  const member = myFaction?.members?.find(
    (item: any) => String(item.playerId) === currentPlayerId
  );
  return member?.role || null;
}

export default function FactionPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useGoogleAuth();
  const player = usePlayerStore((state) => state.player);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <p className="text-red-300">
            Você precisa estar autenticado para acessar a facção.
          </p>
        </div>
      </div>
    );
  }

  return <FactionPageContent player={player} />;
}

function FactionPageContent({ player }: { player: any }) {
  const myFaction = useFactionStore((state) => state.myFaction);
  const factionList = useFactionStore((state) => state.factionList);
  const isLoadingMyFaction = useFactionStore((state) => state.isLoadingMyFaction);
  const isLoadingFactionList = useFactionStore((state) => state.isLoadingFactionList);
  const isSubmitting = useFactionStore((state) => state.isSubmitting);
  const error = useFactionStore((state) => state.error);

  const loadMyFaction = useFactionStore((state) => state.loadMyFaction);
  const loadFactionList = useFactionStore((state) => state.loadFactionList);

  const createFaction = useFactionStore((state) => state.createFaction);
  const joinFaction = useFactionStore((state) => state.joinFaction);
  const leaveFaction = useFactionStore((state) => state.leaveFaction);
  const donate = useFactionStore((state) => state.donate);
  const upgradeInvestment = useFactionStore((state) => state.upgradeInvestment);
  const updateMemberRole = useFactionStore((state) => state.updateMemberRole);
  const kickMember = useFactionStore((state) => state.kickMember);
  const transferLeadership = useFactionStore((state) => state.transferLeadership);
  const updateSettings = useFactionStore((state) => state.updateSettings);

  const isInitialLoading = isLoadingMyFaction || isLoadingFactionList;

  const [activeTab, setActiveTab] = useState<FactionTab>('overview');
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');

  const [createName, setCreateName] = useState('');
  const [createTag, setCreateTag] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createIsPrivate, setCreateIsPrivate] = useState(false);
  const [createMinimumPower, setCreateMinimumPower] = useState(0);
  const [createMinimumBarracoLevel, setCreateMinimumBarracoLevel] = useState(1);

  const [joinFactionId, setJoinFactionId] = useState('');

  const [donationCurrency, setDonationCurrency] = useState<
    'dirtyMoney' | 'cleanMoney' | 'corre'
  >('cleanMoney');
  const [donationAmount, setDonationAmount] = useState('');

  const [settingsDescription, setSettingsDescription] = useState('');
  const [settingsIsPrivate, setSettingsIsPrivate] = useState(false);
  const [settingsMinimumPower, setSettingsMinimumPower] = useState(0);
  const [settingsMinimumBarracoLevel, setSettingsMinimumBarracoLevel] = useState(1);
  const [settingsAllowJoinRequests, setSettingsAllowJoinRequests] =
    useState(true);
  const [settingsAllowMemberInvites, setSettingsAllowMemberInvites] =
    useState(false);
  const [settingsAutoAcceptRequests, setSettingsAutoAcceptRequests] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        await Promise.all([
          loadMyFaction(),
          loadFactionList(),
        ]);
      } catch (error) {
        if (!cancelled) {
          console.error(error);
        }
      }
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!myFaction) return;

    setSettingsDescription(myFaction.description || '');
    setSettingsIsPrivate(Boolean(myFaction.isPrivate));
    setSettingsMinimumPower(Number(myFaction.minimumPower || 0));
    setSettingsMinimumBarracoLevel(
      Math.max(1, Number(myFaction.minimumBarracoLevel || 1))
    );
    setSettingsAllowJoinRequests(Boolean(myFaction.allowJoinRequests));
    setSettingsAllowMemberInvites(Boolean(myFaction.allowMemberInvites));
    setSettingsAutoAcceptRequests(Boolean(myFaction.autoAcceptRequests));
  }, [myFaction]);

  const currentPlayerId = getCurrentPlayerId(player);

  const currentMember = useMemo(() => {
    return (
      myFaction?.members?.find(
        (member: any) => String(member.playerId) === currentPlayerId
      ) || null
    );
  }, [myFaction, currentPlayerId]);

  const currentRole = getCurrentPlayerFactionRole(myFaction, currentPlayerId);
  const isLeader = currentRole === 'leader';

  const canManageTreasury = Boolean(currentMember?.permissions?.canManageTreasury);
  const canManageInvestments = Boolean(
    currentMember?.permissions?.canManageInvestments
  );

  const safeMembers = Array.isArray(myFaction?.members) ? myFaction.members : [];
  const memberCount = safeMembers.length;

  const expPercent = useMemo(() => {
    if (!myFaction) return 0;
    const total = Math.max(1, Number(myFaction.expToNext || 100));
    const current = Math.max(0, Number(myFaction.exp || 0));
    return Math.min(100, (current / total) * 100);
  }, [myFaction]);

  const topDonors = useMemo(() => {
    if (!safeMembers.length) return [];
    return [...safeMembers]
      .sort(
        (a, b) =>
          Number(b?.contribution?.totalValue || 0) -
          Number(a?.contribution?.totalValue || 0)
      )
      .slice(0, 5);
  }, [safeMembers]);

  const clearLocalMessages = () => {
    setLocalError('');
    setLocalSuccess('');
  };

  const handleCreateFaction = async () => {
    clearLocalMessages();

    const name = createName.trim();
    const tag = createTag.trim().toUpperCase();
    const description = createDescription.trim();

    if (!name) {
      setLocalError('Digite o nome da facção.');
      return;
    }

    if (!tag || tag.length < 2) {
      setLocalError('A tag da facção precisa ter pelo menos 2 caracteres.');
      return;
    }

    if (tag.length > 8) {
      setLocalError('A tag da facção pode ter no máximo 8 caracteres.');
      return;
    }

    if (createMinimumPower < 0) {
      setLocalError('O power mínimo não pode ser negativo.');
      return;
    }
    if (createMinimumBarracoLevel < 1) {
      setLocalError('O barraco mínimo precisa ser pelo menos 1.');
      return;
    }

    const ok = await createFaction({
      name,
      tag,
      description,
      isPrivate: createIsPrivate,
      minimumPower: createMinimumPower,
      minimumBarracoLevel: createMinimumBarracoLevel,
      allowJoinRequests: true,
      allowMemberInvites: false,
      autoAcceptRequests: !createIsPrivate,
    });

    if (ok) {
      setCreateName('');
      setCreateTag('');
      setCreateDescription('');
      setCreateIsPrivate(false);
      setCreateMinimumPower(0);
      setCreateMinimumBarracoLevel(1);
      setLocalSuccess('Facção criada com sucesso.');
    }
  };

  const handleJoinFaction = async (factionId?: string) => {
    clearLocalMessages();

    const targetId = String(factionId || joinFactionId || '').trim();
    if (!targetId) {
      setLocalError('Informe o ID da facção.');
      return;
    }

    const ok = await joinFaction(targetId);
    if (ok) {
      setJoinFactionId('');
      setLocalSuccess('Solicitação de entrada enviada ou entrada concluída.');
    }
  };

  const handleDonate = async () => {
    clearLocalMessages();

    const amount = Number(donationAmount || 0);
    if (!amount || amount <= 0) {
      setLocalError('Digite um valor de doação válido.');
      return;
    }

    if (!currentMember) {
      setLocalError('Você precisa estar em uma facção para doar.');
      return;
    }

    const ok = await donate(donationCurrency, amount);
    if (ok) {
      setDonationAmount('');
      setLocalSuccess('Doação enviada para o tesouro da facção.');
    }
  };

  const handleSaveSettings = async () => {
    clearLocalMessages();

    if (!isLeader) {
      setLocalError('Apenas o líder pode alterar as configurações da facção.');
      return;
    }

    if (settingsMinimumPower < 0) {
      setLocalError('O power mínimo não pode ser negativo.');
      return;
    }

    if (settingsMinimumBarracoLevel < 1) {
      setLocalError('O barraco mínimo precisa ser pelo menos 1.');
      return;
    }

    const ok = await updateSettings({
      description: settingsDescription.trim(),
      isPrivate: settingsIsPrivate,
      minimumPower: settingsMinimumPower,
      minimumBarracoLevel: settingsMinimumBarracoLevel,
      allowJoinRequests: settingsAllowJoinRequests,
      allowMemberInvites: settingsAllowMemberInvites,
      autoAcceptRequests: settingsAutoAcceptRequests,
    });

    if (ok) {
      setLocalSuccess('Configurações da facção atualizadas.');
    }
  };

  const handleUpgradeInvestment = async (branch: FactionInvestmentBranch) => {
    clearLocalMessages();

    if (!canManageInvestments) {
      setLocalError('Você não tem permissão para melhorar investimentos.');
      return;
    }

    const ok = await upgradeInvestment(branch);
    if (ok) {
      setLocalSuccess(`Investimento ${FACTION_BRANCH_LABELS[branch]} melhorado.`);
    }
  };

  const handleUpdateMemberRole = async (
    targetPlayerId: string,
    role: FactionRole
  ) => {
    clearLocalMessages();

    if (!isLeader) {
      setLocalError('Apenas o líder pode alterar cargos.');
      return;
    }

    const ok = await updateMemberRole(targetPlayerId, role);
    if (ok) {
      setLocalSuccess('Cargo do membro atualizado.');
    }
  };

  const handleKickMember = async (targetPlayerId: string) => {
    clearLocalMessages();

    if (!isLeader) {
      setLocalError('Apenas o líder pode expulsar membros.');
      return;
    }

    const ok = await kickMember(targetPlayerId);
    if (ok) {
      setLocalSuccess('Membro removido da facção.');
    }
  };

  const handleTransferLeadership = async (targetPlayerId: string) => {
    clearLocalMessages();

    if (!isLeader) {
      setLocalError('Apenas o líder pode transferir liderança.');
      return;
    }

    const ok = await transferLeadership(targetPlayerId);
    if (ok) {
      setLocalSuccess('Liderança transferida com sucesso.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-col px-4 pb-28 pt-[140px] md:pt-[160px]">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-black uppercase tracking-wide">
            Facção
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Núcleo coletivo da sua organização: membros, tesouro, investimentos,
            diplomacia e progresso.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {localError && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {localError}
          </div>
        )}

        {localSuccess && (
          <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {localSuccess}
          </div>
        )}

        {isInitialLoading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-border bg-card">
            <p className="text-muted-foreground">Carregando facção...</p>
          </div>
        ) : myFaction ? (
          <>
            <section className="mb-4 rounded-3xl border border-border bg-card p-5">
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
                  <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                    {myFaction.description || 'Sem descrição definida.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-2xl bg-background px-4 py-3">
                    <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                      Nível
                    </div>
                    <div className="mt-1 text-2xl font-black">
                      {myFaction.level || 1}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-background px-4 py-3">
                    <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                      Membros
                    </div>
                    <div className="mt-1 text-2xl font-black">{memberCount}</div>
                  </div>

                  <div className="rounded-2xl bg-background px-4 py-3">
                    <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                      Prestígio
                    </div>
                    <div className="mt-1 text-base font-black">
                      {myFaction.investmentTierName || 'Base'}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-background px-4 py-3">
                    <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                      Seu cargo
                    </div>
                    <div className="mt-1 text-base font-black">
                      {currentRole || 'member'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-background p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                    Progresso de EXP
                  </span>
                  <span className="text-sm font-bold">
                    {formatMoney(myFaction.exp || 0)}/
                    {formatMoney(myFaction.expToNext || 100)}
                  </span>
                </div>
<div className="h-4 overflow-hidden rounded-full bg-black/30">
                  <div
                    className="h-full rounded-full bg-red-600 transition-all"
                    style={{ width: `${expPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {(
                  [
                    'overview',
                    'members',
                    'treasury',
                    'investments',
                    'logs',
                    'diplomacy',
                  ] as FactionTab[]
                ).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-2xl px-4 py-2 text-sm font-black uppercase tracking-wide transition ${
                      activeTab === tab
                        ? 'bg-red-600 text-white'
                        : 'border border-border bg-background text-foreground'
                    }`}
                  >
                    {tab === 'overview' && 'Visão geral'}
                    {tab === 'members' && 'Membros'}
                    {tab === 'treasury' && 'Tesouro'}
                    {tab === 'investments' && 'Investimentos'}
                    {tab === 'logs' && 'Logs'}
                    {tab === 'diplomacy' && 'Diplomacia'}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    void leaveFaction();
                  }}
                  disabled={isSubmitting}
                  className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-black uppercase tracking-wide text-red-300 disabled:opacity-50"
                >
                  Sair da facção
                </button>
              </div>
            </section>

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
                <section className="rounded-3xl border border-border bg-card p-5">
                  <h3 className="font-heading text-2xl font-black uppercase">
                    Resumo operacional
                  </h3>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-background px-4 py-3">
                      <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                        Sujo no tesouro
                      </div>
                      <div className="mt-1 text-xl font-black">
                        {formatMoney(myFaction?.treasury?.dirtyMoney || 0)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-background px-4 py-3">
                      <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                        Limpo no tesouro
                      </div>
                      <div className="mt-1 text-xl font-black">
                        {formatMoney(myFaction?.treasury?.cleanMoney || 0)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-background px-4 py-3">
                      <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                        Corre no tesouro
                      </div>
                      <div className="mt-1 text-xl font-black">
                        {formatMoney(myFaction?.treasury?.corre || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-background p-4">
                    <div className="text-sm font-black uppercase tracking-wide text-muted-foreground">
                      Bônus coletivos atuais
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-border px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          Ataque
                        </div>
                        <div className="mt-1 text-lg font-black">
                          +{Number(myFaction?.investmentBuffs?.attackPercent || 0).toFixed(1)}%
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          Defesa
                        </div>
                        <div className="mt-1 text-lg font-black">
                          +{Number(myFaction?.investmentBuffs?.defensePercent || 0).toFixed(1)}%
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          Ganho sujo
                        </div>
                        <div className="mt-1 text-lg font-black">
                          +{Number(
                            myFaction?.investmentBuffs?.dirtyMoneyGainPercent || 0
                          ).toFixed(1)}
                          %
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          Ganho limpo
                        </div>
                        <div className="mt-1 text-lg font-black">
                          +{Number(
                            myFaction?.investmentBuffs?.cleanMoneyGainPercent || 0
                          ).toFixed(1)}
                          %
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          Agilidade
                        </div>
                        <div className="mt-1 text-lg font-black">
                          +{Number(myFaction?.investmentBuffs?.agilityPercent || 0).toFixed(1)}%
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          Inteligência
                        </div>
                        <div className="mt-1 text-lg font-black">
                          +{Number(
                            myFaction?.investmentBuffs?.intelligencePercent || 0
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <aside className="rounded-3xl border border-border bg-card p-5">
                  <div className="text-sm font-black uppercase tracking-wide text-muted-foreground">
                    Top doadores
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    {topDonors.length === 0 ? (
                      <div className="rounded-2xl bg-background px-4 py-4 text-sm text-muted-foreground">
                        Ainda não há doações registradas.
                      </div>
                    ) : (
                      topDonors.map((member, index) => (
                        <div
                          key={String(member.playerId)}
                          className="rounded-2xl border border-border bg-background px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                                #{index + 1}
                              </div>
                              <div className="truncate font-bold">
                                {member.playerName}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Total
                              </div>
                              <div className="font-black">
                                {formatMoney(member?.contribution?.totalValue || 0)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </aside>
              </div>
            )}

            {activeTab === 'members' && (
              <section className="rounded-3xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-heading text-2xl font-black uppercase">
                    Membros
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {memberCount} integrante(s)
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  {safeMembers.length === 0 ? (
                    <div className="rounded-2xl bg-background px-4 py-4 text-sm text-muted-foreground">
                      Nenhum membro encontrado.
                    </div>
                  ) : (
                    safeMembers.map((member: any) => {
                      const isSelf =
                        String(member.playerId) === String(currentPlayerId);
                      const canManageThisMember =
                        isLeader && !isSelf && member.role !== 'leader';

                      return (
                        <div
                          key={String(member.playerId)}
                          className="rounded-2xl border border-border bg-background px-4 py-4"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate text-lg font-black">
                                  {member.playerName}
                                </div>
                                {isSelf && (
                                  <span className="rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-red-300">
                                    Você
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span>Cargo: {member.role}</span>
                                <span>
                                  Contribuição total:{' '}
                                  {formatMoney(member?.contribution?.totalValue || 0)}
                                </span>
                                <span>Entrou em: {formatDate(member.joinedAt)}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={member.role}
                                disabled={!canManageThisMember || isSubmitting}
                                onChange={(e) => {
                                  void handleUpdateMemberRole(
                                    String(member.playerId),
                                    e.target.value as FactionRole
                                  );
                                }}
                                className="rounded-2xl border border-border bg-card px-3 py-2 text-sm outline-none disabled:opacity-50"
                              >
                                {ROLE_OPTIONS.map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                disabled={!canManageThisMember || isSubmitting}
                                onClick={() => {
                                  void handleTransferLeadership(
                                    String(member.playerId)
                                  );
                                }}
                                className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-yellow-300 disabled:opacity-50"
                              >
                                Transferir liderança
                              </button>

                              <button
                                type="button"
                                disabled={!canManageThisMember || isSubmitting}
                                onClick={() => {
                                  void handleKickMember(String(member.playerId));
                                }}
                                className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-red-300 disabled:opacity-50"
                              >
                                Expulsar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            )}

            {activeTab === 'treasury' && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
                <section className="rounded-3xl border border-border bg-card p-5">
                  <h3 className="font-heading text-2xl font-black uppercase">
                    Tesouro da facção
                  </h3>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-background px-4 py-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Dinheiro sujo
                      </div>
                      <div className="mt-2 text-2xl font-black">
                        {formatMoney(myFaction?.treasury?.dirtyMoney || 0)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-background px-4 py-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Dinheiro limpo
                      </div>
                      <div className="mt-2 text-2xl font-black">
                        {formatMoney(myFaction?.treasury?.cleanMoney || 0)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-background px-4 py-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Corre
                      </div>
                      <div className="mt-2 text-2xl font-black">
                        {formatMoney(myFaction?.treasury?.corre || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-background p-4">
                    <div className="mb-3 text-sm font-black uppercase tracking-wide text-muted-foreground">
                      Sua doação
                    </div>

                    <div className="mt-4 flex flex-col gap-3">
                      <select
                        value={donationCurrency}
                        onChange={(e) =>
                          setDonationCurrency(
                            e.target.value as 'dirtyMoney' | 'cleanMoney' | 'corre'
                          )
                        }
                        className="rounded-2xl border border-border bg-card px-4 py-3 outline-none"
                      >
                        <option value="cleanMoney">Dinheiro limpo</option>
                        <option value="dirtyMoney">Dinheiro sujo</option>
                        <option value="corre">Corre</option>
                      </select>

                      <input
                        type="number"
                        min={1}
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        placeholder="Valor da doação"
                        className="rounded-2xl border border-border bg-card px-4 py-3 outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          void handleDonate();
                        }}
                        disabled={isSubmitting}
                        className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50"
                      >
                        {isSubmitting ? 'Doando...' : 'Doar para o tesouro'}
                      </button>

                      {!canManageTreasury && (
                        <div className="text-xs text-muted-foreground">
                          Doação liberada para membros. Gestão do tesouro depende de
                          permissão do cargo.
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-border bg-card p-5">
                  <h3 className="font-heading text-2xl font-black uppercase">
                    Configurações
                  </h3>

<div className="mt-4 flex flex-col gap-3">
                    <textarea
                      value={settingsDescription}
                      onChange={(e) => setSettingsDescription(e.target.value)}
                      disabled={!isLeader}
                      placeholder="Descrição da facção"
                      className="min-h-[110px] rounded-2xl border border-border bg-background px-4 py-3 outline-none disabled:opacity-50"
                    />

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <input
                        type="number"
                        min={0}
                        value={settingsMinimumPower}
                        disabled={!isLeader}
                        onChange={(e) =>
                          setSettingsMinimumPower(Number(e.target.value || 0))
                        }
                        placeholder="Power mínimo"
                        className="rounded-2xl border border-border bg-background px-4 py-3 outline-none disabled:opacity-50"
                      />

                      <input
                        type="number"
                        min={1}
                        value={settingsMinimumBarracoLevel}
                        disabled={!isLeader}
                        onChange={(e) =>
                          setSettingsMinimumBarracoLevel(
                            Number(e.target.value || 1)
                          )
                        }
                        placeholder="Barraco mínimo"
                        className="rounded-2xl border border-border bg-background px-4 py-3 outline-none disabled:opacity-50"
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl bg-background px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={settingsIsPrivate}
                        disabled={!isLeader}
                        onChange={(e) => setSettingsIsPrivate(e.target.checked)}
                      />
                      Facção privada
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl bg-background px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={settingsAllowJoinRequests}
                        disabled={!isLeader}
                        onChange={(e) =>
                          setSettingsAllowJoinRequests(e.target.checked)
                        }
                      />
                      Permitir solicitações de entrada
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl bg-background px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={settingsAllowMemberInvites}
                        disabled={!isLeader}
                        onChange={(e) =>
                          setSettingsAllowMemberInvites(e.target.checked)
                        }
                      />
                      Permitir convites por membros
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl bg-background px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={settingsAutoAcceptRequests}
                        disabled={!isLeader}
                        onChange={(e) =>
                          setSettingsAutoAcceptRequests(e.target.checked)
                        }
                      />
                      Aceitar solicitações automaticamente
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        void handleSaveSettings();
                      }}
                      disabled={!isLeader || isSubmitting}
                      className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50"
                    >
                      {isSubmitting ? 'Salvando...' : 'Salvar configurações'}
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'investments' && (
              <section className="rounded-3xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-heading text-2xl font-black uppercase">
                    Investimentos
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    Melhore buffs coletivos da facção.
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {INVESTMENT_BRANCHES.map((branch) => {
                    const currentLevel = Number(
                      myFaction?.investments?.[branch] || 0
                    );

                    const upgradeCost = getFactionInvestmentUpgradeCost(
                      branch,
                      currentLevel
                    );

                    return (
                      <div
                        key={branch}
                        className="rounded-3xl border border-border bg-background p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-lg font-black">
                              {FACTION_BRANCH_LABELS[branch]}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {FACTION_BRANCH_DESCRIPTIONS[branch]}
                            </div>
                          </div>

                          <div className="rounded-2xl bg-card px-3 py-2 text-sm font-black">
                            Nv. {currentLevel}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm text-muted-foreground">
                            Próximo upgrade: {formatMoney(upgradeCost.cleanMoney)}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              void handleUpgradeInvestment(branch);
                            }}
                            disabled={!canManageInvestments || isSubmitting}
                            className="rounded-2xl bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white disabled:opacity-50"
                          >
                            {isSubmitting ? 'Melhorando...' : 'Melhorar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {activeTab === 'logs' && (
              <section className="rounded-3xl border border-border bg-card p-5">
                <h3 className="font-heading text-2xl font-black uppercase">
                  Logs da facção
                </h3>

                <div className="mt-4 flex flex-col gap-3">
                  {Array.isArray(myFaction?.activityLog) && myFaction.activityLog.length > 0 ? (
                    myFaction.activityLog.map((log: any, index: number) => (
                      <div
                        key={String(log.id || log._id || index)}
                        className="rounded-2xl border border-border bg-background px-4 py-3"
                      >
                        <div className="text-sm font-bold">
                          {log.type || 'Registro'}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-background px-4 py-4 text-sm text-muted-foreground">
                      Nenhum log disponível.
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'diplomacy' && (
              <section className="rounded-3xl border border-border bg-card p-5">
                <h3 className="font-heading text-2xl font-black uppercase">
                  Diplomacia
                </h3>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-background p-4">
                    <div className="text-sm font-black uppercase tracking-wide text-muted-foreground">
                      Aliados
                    </div>

                    <div className="mt-3 flex flex-col gap-2">
                      {Array.isArray(myFaction?.diplomacy?.allies) &&
                      myFaction.diplomacy.allies.length > 0 ? (
                        myFaction.diplomacy.allies.map((item: any, index: number) => (
                          <div
                            key={String(item.id || item._id || item.factionId || index)}
                            className="rounded-2xl border border-border px-4 py-3 text-sm"
                          >
                            {item.name || item.tag || item.factionId || 'Facção aliada'}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
                          Nenhuma aliança registrada.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-background p-4">
                    <div className="text-sm font-black uppercase tracking-wide text-muted-foreground">
                      Rivalidades
                    </div>

                    <div className="mt-3 flex flex-col gap-2">
                      {Array.isArray(myFaction?.diplomacy?.rivals) &&
                      myFaction.diplomacy.rivals.length > 0 ? (
                        myFaction.diplomacy.rivals.map((item: any, index: number) => (
                          <div
                            key={String(item.id || item._id || item.factionId || index)}
                            className="rounded-2xl border border-border px-4 py-3 text-sm"
                          >
                            {item.name || item.tag || item.factionId || 'Facção rival'}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
                          Nenhuma rivalidade registrada.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-3xl border border-border bg-card p-5">
              <h2 className="font-heading text-2xl font-black uppercase">
                Criar facção
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Monte sua organização e defina as regras de entrada.
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
                  maxLength={8}
                  placeholder="TAG da facção"
                  className="rounded-2xl border border-border bg-background px-4 py-3 uppercase outline-none"
                />

                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Descrição da facção"
                  className="min-h-[110px] rounded-2xl border border-border bg-background px-4 py-3 outline-none"
                />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    type="number"
                    min={0}
                    value={createMinimumPower}
                    onChange={(e) =>
                      setCreateMinimumPower(Number(e.target.value || 0))
                    }
                    placeholder="Power mínimo"
                    className="rounded-2xl border border-border bg-background px-4 py-3 outline-none"
                  />

                  <input
                    type="number"
                    min={1}
                    value={createMinimumBarracoLevel}
                    onChange={(e) =>
                      setCreateMinimumBarracoLevel(Number(e.target.value || 1))
                    }
                    placeholder="Barraco mínimo"
                    className="rounded-2xl border border-border bg-background px-4 py-3 outline-none"
                  />
                </div>

                <label className="flex items-center gap-3 rounded-2xl bg-background px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={createIsPrivate}
                    onChange={(e) => setCreateIsPrivate(e.target.checked)}
                  />
                  Facção privada
                </label>

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
                Entre por ID ou escolha uma facção pública disponível.
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
                  {isSubmitting ? 'Entrando...' : 'Entrar pelo ID'}
                </button>
              </div>

              <div className="mt-5">
                <div className="mb-3 text-sm font-black uppercase tracking-wide text-muted-foreground">
                  Facções públicas
                </div>

                <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
                  {factionList.length === 0 ? (
                    <div className="rounded-2xl bg-background px-4 py-4 text-sm text-muted-foreground">
                      Nenhuma facção disponível.
                    </div>
                  ) : (
                    factionList.map((faction: any) => (
                      <div
                        key={String(faction.id || faction._id)}
                        className="rounded-2xl border border-border bg-background px-4 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-lg font-black">
                              {faction.name}{' '}
                              <span className="text-red-400">[{faction.tag}]</span>
                            </div>
                            <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                              Nível {faction.level || 1} •{' '}
                              {faction.memberCount || 0} membros •{' '}
                              {faction.investmentTierName || 'Base'}
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                              {faction.description || 'Sem descrição.'}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              void handleJoinFaction(String(faction.id || faction._id));
                            }}
                            disabled={isSubmitting || faction.isPrivate}
                            className="rounded-2xl bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white disabled:opacity-50"
                          >
                            {faction.isPrivate ? 'Privada' : 'Entrar'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}