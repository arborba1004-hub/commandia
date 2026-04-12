import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useFactionStore } from '@/store/factionStore';
import { usePlayerStore } from '@/store/playerStore';
import type { FactionInvestmentBranch, FactionRole } from '@/types/faction';
import {
  FACTION_BRANCH_DESCRIPTIONS,
  FACTION_BRANCH_LABELS,
} from '@/types/faction';
import { getFactionInvestmentUpgradeCost } from '@/services/factionService';

type FactionTab = 'overview' | 'members' | 'treasury' | 'investments' | 'logs' | 'diplomacy';

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

function getCurrentPlayerFactionRole(myFaction: any, currentPlayerId: string): FactionRole | null {
  const member = myFaction?.members?.find((item: any) => String(item.playerId) === currentPlayerId);
  return member?.role || null;
}

export default function FactionPage() {
  const player = usePlayerStore((state) => state.player);

  const myFaction = useFactionStore((state) => state.myFaction);
  const factionList = useFactionStore((state) => state.factionList);
  const isLoading = useFactionStore((state) => state.isLoading);
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

  const [activeTab, setActiveTab] = useState<FactionTab>('overview');

  const [createName, setCreateName] = useState('');
  const [createTag, setCreateTag] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createIsPrivate, setCreateIsPrivate] = useState(false);
  const [createMinimumPower, setCreateMinimumPower] = useState(0);
  const [createMinimumBarracoLevel, setCreateMinimumBarracoLevel] = useState(1);

  const [joinFactionId, setJoinFactionId] = useState('');

  const [donationCurrency, setDonationCurrency] = useState<'dirtyMoney' | 'cleanMoney' | 'corre'>('cleanMoney');
  const [donationAmount, setDonationAmount] = useState('');

  const [settingsDescription, setSettingsDescription] = useState('');
  const [settingsIsPrivate, setSettingsIsPrivate] = useState(false);
  const [settingsMinimumPower, setSettingsMinimumPower] = useState(0);
  const [settingsMinimumBarracoLevel, setSettingsMinimumBarracoLevel] = useState(1);
  const [settingsAllowJoinRequests, setSettingsAllowJoinRequests] = useState(true);
  const [settingsAllowMemberInvites, setSettingsAllowMemberInvites] = useState(false);
  const [settingsAutoAcceptRequests, setSettingsAutoAcceptRequests] = useState(false);

  useEffect(() => {
    void loadMyFaction();
    void loadFactionList();
  }, [loadMyFaction, loadFactionList]);

  useEffect(() => {
    if (!myFaction) return;

    setSettingsDescription(myFaction.description || '');
    setSettingsIsPrivate(Boolean(myFaction.isPrivate));
    setSettingsMinimumPower(Number(myFaction.minimumPower || 0));
    setSettingsMinimumBarracoLevel(Math.max(1, Number(myFaction.minimumBarracoLevel || 1)));
    setSettingsAllowJoinRequests(Boolean(myFaction.allowJoinRequests));
    setSettingsAllowMemberInvites(Boolean(myFaction.allowMemberInvites));
    setSettingsAutoAcceptRequests(Boolean(myFaction.autoAcceptRequests));
  }, [myFaction]);

  const currentPlayerId = getCurrentPlayerId(player);

  const currentMember = useMemo(() => {
    return myFaction?.members.find((member) => String(member.playerId) === currentPlayerId) || null;
  }, [myFaction, currentPlayerId]);

  const currentRole = getCurrentPlayerFactionRole(myFaction, currentPlayerId);

  const canManageTreasury = Boolean(currentMember?.permissions?.canManageTreasury);
  const canManageInvestments = Boolean(currentMember?.permissions?.canManageInvestments);
  const canAcceptRequests = Boolean(currentMember?.permissions?.canAcceptRequests);
  const isLeader = currentRole === 'leader';

  const memberCount = myFaction?.members.length || 0;

  const expPercent = useMemo(() => {
    if (!myFaction) return 0;
    const total = Math.max(1, Number(myFaction.expToNext || 100));
    const current = Math.max(0, Number(myFaction.exp || 0));
    return Math.min(100, (current / total) * 100);
  }, [myFaction]);

  const topDonors = useMemo(() => {
    if (!myFaction) return [];
    return [...myFaction.members]
      .sort((a, b) => Number(b.contribution.totalValue || 0) - Number(a.contribution.totalValue || 0))
      .slice(0, 5);
  }, [myFaction]);

  const handleCreateFaction = async () => {
    const ok = await createFaction({
      name: createName,
      tag: createTag,
      description: createDescription,
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
      setActiveTab('overview');
    }
  };

  const handleJoinFaction = async (factionId?: string) => {
    const targetId = String(factionId || joinFactionId || '').trim();
    if (!targetId) return;

    const ok = await joinFaction(targetId);
    if (ok) {
      setJoinFactionId('');
    }
  };

  const handleDonate = async () => {
    const amount = Number(donationAmount || 0);
    if (!amount || amount <= 0) return;

    const ok = await donate(donationCurrency, amount);
    if (ok) {
      setDonationAmount('');
    }
  };

  const handleSaveSettings = async () => {
    await updateSettings({
      description: settingsDescription,
      isPrivate: settingsIsPrivate,
      minimumPower: settingsMinimumPower,
      minimumBarracoLevel: settingsMinimumBarracoLevel,
      allowJoinRequests: settingsAllowJoinRequests,
      allowMemberInvites: settingsAllowMemberInvites,
      autoAcceptRequests: settingsAutoAcceptRequests,
    });
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
            Núcleo coletivo da sua organização: membros, tesouro, investimentos, diplomacia e progresso.
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
                      Prestígio
                    </div>
                    <div className="mt-1 text-base font-black">{myFaction.investmentTierName}</div>
                  </div>

                  <div className="rounded-2xl bg-background px-4 py-3">
                    <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                      Seu cargo
                    </div>
                    <div className="mt-1 text-base font-black">{currentRole || 'Membro'}</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-background p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                    Progresso de EXP
                  </span>
                  <span className="text-sm font-bold">
                    {formatMoney(myFaction.exp)}/{formatMoney(myFaction.expToNext)}
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
                {(['overview', 'members', 'treasury', 'investments', 'logs', 'diplomacy'] as FactionTab[]).map((tab) => (
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
                  <h3 className="font-heading text-2xl font-black uppercase">Resumo operacional</h3>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-background px-4 py-3">
                      <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                        Sujo no tesouro
                      </div>
                      <div className="mt-1 text-xl font-black">
                        {formatMoney(myFaction.treasury.dirtyMoney)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-background px-4 py-3">
                      <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                        Limpo no tesouro
                      </div>
                      <div className="mt-1 text-xl font-black">
                        {formatMoney(myFaction.treasury.cleanMoney)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-background px-4 py-3">
                      <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                        Corre no tesouro
                      </div>
                      <div className="mt-1 text-xl font-black">
                        {formatMoney(myFaction.treasury.corre)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-background p-4">
                    <div className="text-sm font-black uppercase tracking-wide text-muted-foreground">
                      Bônus coletivos atuais
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-border px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Ataque</div>
                        <div className="mt-1 text-lg font-black">
                          +{myFaction.investmentBuffs.attackPercent.toFixed(1)}%
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Defesa</div>
                        <div className="mt-1 text-lg font-black">
                          +{myFaction.investmentBuffs.defensePercent.toFixed(1)}%
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Ganho sujo</div>
                        <div className="mt-1 text-lg font-black">
                          +{myFaction.investmentBuffs.dirtyMoneyGainPercent.toFixed(1)}%
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Ganho limpo</div>
                        <div className="mt-1 text-lg font-black">
                          +{myFaction.investmentBuffs.cleanMoneyGainPercent.toFixed(1)}%
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Agilidade</div>
                        <div className="mt-1 text-lg font-black">
                          +{myFaction.investmentBuffs.agilityPercent.toFixed(1)}%
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Inteligência</div>
                        <div className="mt-1 text-lg font-black">
                          +{myFaction.investmentBuffs.intelligencePercent.toFixed(1)}%
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
                          key={member.playerId}
                          className="rounded-2xl border border-border bg-background px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                                #{index + 1}
                              </div>
                              <div className="truncate font-bold">{member.playerName}</div>
                            </div>

                            <div className="text-right">
                              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Total
                              </div>
                              <div className="font-black">
                                {formatMoney(member.contribution.totalValue)}
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
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
                <section className="rounded-3xl border border-border bg-card p-5">
                  <h3 className="font-heading text-2xl font-black uppercase">Membros</h3>

                  <div className="mt-4 flex flex