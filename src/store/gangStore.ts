import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usePlayerStore } from '@/store/playerStore';
import { useGangBattleStore } from '@/stores/gangBattleStore';
import type {
  Gang,
  GangBattleSnapshot,
  GangDoctrineBonus,
  GangMember,
  GangUpgradeId,
  MemberClass,
  MemberSkill,
  RecruitMethod,
  Rarity,
} from '@/types/gang';

const STORAGE_KEY = 'gangData';

const MEMBER_CLASSES: MemberClass[] = [
  'Assassino',
  'Ladrão',
  'Lavador',
  'Motorista',
  'Armeiro',
  'Informante',
  'Capanga',
  'Médico',
  'Executor',
  'Negociador',
];

const RARITY_ORDER: Rarity[] = ['Comum', 'Raro', 'Épico', 'Lendário', 'Mítico'];

const RARITY_BASE_POWER: Record<Rarity, number> = {
  Comum: 0,
  Raro: 20,
  Épico: 45,
  Lendário: 80,
  Mítico: 130,
};

const RECRUIT_CONFIG: Record<
  RecruitMethod,
  {
    cost: number;
    currency: 'dirtyMoney' | 'cleanMoney' | 'corre';
    rarityWeights: Record<Rarity, number>;
  }
> = {
  mission: {
    cost: 5000,
    currency: 'dirtyMoney',
    rarityWeights: {
      Comum: 60,
      Raro: 25,
      Épico: 10,
      Lendário: 4,
      Mítico: 1,
    },
  },
  market: {
    cost: 50000,
    currency: 'cleanMoney',
    rarityWeights: {
      Comum: 40,
      Raro: 35,
      Épico: 15,
      Lendário: 8,
      Mítico: 2,
    },
  },
  premium: {
    cost: 250,
    currency: 'corre',
    rarityWeights: {
      Comum: 0,
      Raro: 20,
      Épico: 45,
      Lendário: 25,
      Mítico: 10,
    },
  },
};

interface GangStore {
  myGang: Gang | null;
  isLoading: boolean;
  error: string | null;

  fetchMyGang: () => Promise<void>;
  recruitMember: (method: RecruitMethod) => Promise<GangMember | null>;
  trainMember: (memberId: string, usePremium?: boolean) => Promise<void>;
  equipMember: (
    memberId: string,
    equipmentType: 'weapon' | 'armor' | 'vehicle',
    itemId: string
  ) => Promise<void>;
  toggleActive: (memberId: string) => Promise<void>;
  dismissMember: (memberId: string) => Promise<void>;
  donateToTreasury: (
    type: 'dirtyMoney' | 'cleanMoney' | 'corre',
    amount: number
  ) => Promise<void>;
  upgradeGangSkill: (skillId: GangUpgradeId) => Promise<void>;

  getDoctrineBonus: () => GangDoctrineBonus;
  getMemberBattlePower: (member: GangMember) => number;
  getBattleSnapshot: () => GangBattleSnapshot;
}

function randomFromArray<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function weightedRarityPick(weights: Record<Rarity, number>): Rarity {
  const entries = Object.entries(weights) as [Rarity, number][];
  const total = entries.reduce((acc, [, value]) => acc + value, 0);
  let random = Math.random() * total;

  for (const [rarity, weight] of entries) {
    random -= weight;
    if (random <= 0) return rarity;
  }

  return 'Comum';
}

function createSkillTemplate(memberClass: MemberClass): MemberSkill[] {
  const baseByClass: Record<MemberClass, MemberSkill[]> = {
    Assassino: [
      {
        id: crypto.randomUUID(),
        name: 'Golpe Preciso',
        description: 'Aumenta dano crítico em emboscadas.',
        level: 1,
        maxLevel: 10,
        effect: '+5% crítico por nível',
      },
      {
        id: crypto.randomUUID(),
        name: 'Passos Silenciosos',
        description: 'Reduz chance de detecção.',
        level: 1,
        maxLevel: 10,
        effect: '+4% furtividade por nível',
      },
    ],
    Ladrão: [
      {
        id: crypto.randomUUID(),
        name: 'Mãos Leves',
        description: 'Aumenta eficiência em saque.',
        level: 1,
        maxLevel: 10,
        effect: '+6% saque por nível',
      },
      {
        id: crypto.randomUUID(),
        name: 'Olho de Oportunidade',
        description: 'Melhora leitura de alvo.',
        level: 1,
        maxLevel: 10,
        effect: '+4% loot por nível',
      },
    ],
    Lavador: [
      {
        id: crypto.randomUUID(),
        name: 'Rota Limpa',
        description: 'Melhora conversão operacional.',
        level: 1,
        maxLevel: 10,
        effect: '+5% eficiência por nível',
      },
      {
        id: crypto.randomUUID(),
        name: 'Disfarce Fiscal',
        description: 'Reduz risco operacional.',
        level: 1,
        maxLevel: 10,
        effect: '+4% cobertura por nível',
      },
    ],
    Motorista: [
      {
        id: crypto.randomUUID(),
        name: 'Curva Cega',
        description: 'Aumenta escape em perseguição.',
        level: 1,
        maxLevel: 10,
        effect: '+5% fuga por nível',
      },
      {
        id: crypto.randomUUID(),
        name: 'Pisada Quente',
        description: 'Melhora mobilidade tática.',
        level: 1,
        maxLevel: 10,
        effect: '+4% agilidade por nível',
      },
    ],
    Armeiro: [
      {
        id: crypto.randomUUID(),
        name: 'Calibre Fino',
        description: 'Melhora dano do esquadrão.',
        level: 1,
        maxLevel: 10,
        effect: '+5% ataque por nível',
      },
      {
        id: crypto.randomUUID(),
        name: 'Manutenção de Guerra',
        description: 'Reduz desgaste de equipamento.',
        level: 1,
        maxLevel: 10,
        effect: '+4% eficiência por nível',
      },
    ],
    Informante: [
      {
        id: crypto.randomUUID(),
        name: 'Escuta da Rua',
        description: 'Amplia leitura do alvo.',
        level: 1,
        maxLevel: 10,
        effect: '+5% inteligência por nível',
      },
      {
        id: crypto.randomUUID(),
        name: 'Rede de Sussurros',
        description: 'Aumenta visão tática.',
        level: 1,
        maxLevel: 10,
        effect: '+4% informação por nível',
      },
    ],
    Capanga: [
      {
        id: crypto.randomUUID(),
        name: 'Impacto Bruto',
        description: 'Aumenta pressão física no confronto.',
        level: 1,
        maxLevel: 10,
        effect: '+5% ataque por nível',
      },
      {
        id: crypto.randomUUID(),
        name: 'Casca Grossa',
        description: 'Eleva resistência em linha de frente.',
        level: 1,
        maxLevel: 10,
        effect: '+4% defesa por nível',
      },
    ],
    Médico: [
      {
        id: crypto.randomUUID(),
        name: 'Socorro Quente',
        description: 'Reduz perdas em confronto.',
        level: 1,
        maxLevel: 10,
        effect: '+5% sobrevivência por nível',
      },
      {
        id: crypto.randomUUID(),
        name: 'Remendo de Guerra',
        description: 'Acelera recuperação da equipe.',
        level: 1,
        maxLevel: 10,
        effect: '+4% sustain por nível',
      },
    ],
    Executor: [
      {
        id: crypto.randomUUID(),
        name: 'Execução Fria',
        description: 'Eleva finalização em combate.',
        level: 1,
        maxLevel: 10,
        effect: '+6% dano final por nível',
      },
      {
        id: crypto.randomUUID(),
        name: 'Presença Mortal',
        description: 'Enfraquece resistência inimiga.',
        level: 1,
        maxLevel: 10,
        effect: '+4% pressão por nível',
      },
    ],
    Negociador: [
      {
        id: crypto.randomUUID(),
        name: 'Leitura de Mesa',
        description: 'Melhora ganho estratégico.',
        level: 1,
        maxLevel: 10,
        effect: '+5% loot por nível',
      },
      {
        id: crypto.randomUUID(),
        name: 'Acordo Torto',
        description: 'Cria vantagem situacional.',
        level: 1,
        maxLevel: 10,
        effect: '+4% tática por nível',
      },
    ],
  };

  return baseByClass[memberClass];
}

function generateMemberName(memberClass: MemberClass, rarity: Rarity) {
  const names = [
    'Nego Jota',
    'Cobra',
    'Vulgo Touro',
    'Mão Branca',
    'Sete Linhas',
    'Furacão',
    'Cicatriz',
    'Nina',
    'Rasteira',
    'Nocaute',
  ];

  const suffix =
    rarity === 'Mítico'
      ? 'do Caos'
      : rarity === 'Lendário'
      ? 'da Firma'
      : rarity === 'Épico'
      ? 'da Noite'
      : memberClass;

  return `${randomFromArray(names)} ${suffix}`;
}

function getMemberLevelByRarity(rarity: Rarity) {
  switch (rarity) {
    case 'Mítico':
      return 12;
    case 'Lendário':
      return 9;
    case 'Épico':
      return 6;
    case 'Raro':
      return 3;
    default:
      return 1;
  }
}

function getExpToNext(level: number) {
  return Math.round(100 * Math.pow(1.18, Math.max(0, level - 1)));
}

function maybeLevelUp(member: GangMember) {
  let next = { ...member };

  while (next.exp >= next.expToNext) {
    next = {
      ...next,
      level: next.level + 1,
      exp: next.exp - next.expToNext,
      expToNext: getExpToNext(next.level + 1),
      loyalty: Math.min(100, next.loyalty + 2),
    };
  }

  return next;
}

function createDefaultGang(): Gang {
  const createdAt = new Date().toISOString();

  return {
    id: 'default-gang',
    name: 'Comando Tático',
    tag: 'CTK',
    level: 1,
    exp: 0,
    expToNext: 1000,
    slots: 3,
    treasury: {
      dirtyMoney: 0,
      cleanMoney: 0,
      corre: 0,
    },
    members: [],
    activeMemberIds: [],
    upgrades: {
      trainingGroundsLevel: 0,
      hideoutLevel: 0,
      blackMarketLevel: 0,
    },
    createdAt,
    totalVictories: 0,
  };
}

export const useGangStore = create<GangStore>()(
  persist(
    (set, get) => ({
      myGang: null,
      isLoading: false,
      error: null,

      fetchMyGang: async () => {
        set({ isLoading: true, error: null });

        try {
          const current = get().myGang || createDefaultGang();
          set({ myGang: current, isLoading: false, error: null });
        } catch (err: any) {
          set({ error: err?.message || 'Erro ao carregar gangue', isLoading: false });
        }
      },

      recruitMember: async (method) => {
        set({ isLoading: true, error: null });

        try {
          const currentGang = get().myGang || createDefaultGang();
          const config = RECRUIT_CONFIG[method];
          const playerStore = usePlayerStore.getState();
          const currentPlayer = playerStore.player;

          const currentBalance = Number(currentPlayer.balances?.[config.currency] || 0);

          if (currentBalance < config.cost) {
            throw new Error('Saldo insuficiente para recrutamento.');
          }

          playerStore.applyPlayerUpdate((player) => ({
            ...player,
            balances: {
              ...player.balances,
              [config.currency]: Math.max(
                0,
                Number(player.balances?.[config.currency] || 0) - config.cost
              ),
            },
          }));

          const blackMarketBoost =
            currentGang.upgrades.blackMarketLevel * 2;

          const adjustedWeights = {
            ...config.rarityWeights,
            Épico: config.rarityWeights.Épico + blackMarketBoost,
            Lendário: config.rarityWeights.Lendário + Math.floor(blackMarketBoost / 2),
            Mítico: config.rarityWeights.Mítico + Math.floor(blackMarketBoost / 3),
          };

          const rarity = weightedRarityPick(adjustedWeights);
          const memberClass = randomFromArray(MEMBER_CLASSES);
          const level = getMemberLevelByRarity(rarity);

          const newMember: GangMember = {
            id: crypto.randomUUID(),
            name: generateMemberName(memberClass, rarity),
            class: memberClass,
            rarity,
            level,
            exp: 0,
            expToNext: getExpToNext(level),
            loyalty:
              rarity === 'Mítico'
                ? 90
                : rarity === 'Lendário'
                ? 82
                : rarity === 'Épico'
                ? 72
                : 60,
            skills: createSkillTemplate(memberClass),
            equipment: {},
            active: currentGang.activeMemberIds.length < currentGang.slots,
            recruitedAt: new Date().toISOString(),
            victories: 0,
            defeats: 0,
          };

          const activeMemberIds =
            currentGang.activeMemberIds.length < currentGang.slots
              ? [...currentGang.activeMemberIds, newMember.id]
              : currentGang.activeMemberIds;

          const expGain =
            rarity === 'Mítico'
              ? 120
              : rarity === 'Lendário'
              ? 80
              : rarity === 'Épico'
              ? 50
              : rarity === 'Raro'
              ? 30
              : 15;

          const nextGang = {
            ...currentGang,
            members: [...currentGang.members, newMember],
            activeMemberIds,
            treasury: {
              ...currentGang.treasury,
              [config.currency]:
                Number(currentGang.treasury?.[config.currency] || 0) + config.cost,
            },
            exp: currentGang.exp + expGain,
          };

          set({
            myGang: nextGang,
            isLoading: false,
            error: null,
          });

          return newMember;
        } catch (err: any) {
          set({
            error: err?.message || 'Erro ao recrutar membro',
            isLoading: false,
          });
          return null;
        }
      },

      trainMember: async (memberId, usePremium = false) => {
        set({ isLoading: true, error: null });

        try {
          const currentGang = get().myGang;
          if (!currentGang) throw new Error('Gangue não carregada.');

          const playerStore = usePlayerStore.getState();
          const currency = usePremium ? 'corre' : 'dirtyMoney';
          const cost = usePremium ? 250 : 2000;
          const expGain = usePremium ? 500 : 100;

          const currentBalance = Number(playerStore.player.balances?.[currency] || 0);
          if (currentBalance < cost) {
            throw new Error('Saldo insuficiente para treino.');
          }

          playerStore.applyPlayerUpdate((player) => ({
            ...player,
            balances: {
              ...player.balances,
              [currency]: Math.max(
                0,
                Number(player.balances?.[currency] || 0) - cost
              ),
            },
          }));

          const trainingBonusMultiplier =
            1 + currentGang.upgrades.trainingGroundsLevel * 0.1;

          const updatedMembers = currentGang.members.map((member) => {
            if (member.id !== memberId) return member;

            const updated = maybeLevelUp({
              ...member,
              exp: member.exp + Math.round(expGain * trainingBonusMultiplier),
              loyalty: Math.min(100, member.loyalty + (usePremium ? 4 : 2)),
            });

            return updated;
          });

          set({
            myGang: {
              ...currentGang,
              members: updatedMembers,
              exp: currentGang.exp + (usePremium ? 30 : 12),
            },
            isLoading: false,
            error: null,
          });
        } catch (err: any) {
          set({
            error: err?.message || 'Erro ao treinar membro',
            isLoading: false,
          });
        }
      },

      equipMember: async (memberId, equipmentType, itemId) => {
        set({ isLoading: true, error: null });

        try {
          const currentGang = get().myGang;
          if (!currentGang) throw new Error('Gangue não carregada.');

          const updatedMembers = currentGang.members.map((member) =>
            member.id === memberId
              ? {
                  ...member,
                  equipment: {
                    ...member.equipment,
                    [equipmentType === 'weapon'
                      ? 'weaponId'
                      : equipmentType === 'armor'
                      ? 'armorId'
                      : 'vehicleId']: itemId,
                  },
                }
              : member
          );

          set({
            myGang: {
              ...currentGang,
              members: updatedMembers,
            },
            isLoading: false,
            error: null,
          });
        } catch (err: any) {
          set({
            error: err?.message || 'Erro ao equipar membro',
            isLoading: false,
          });
        }
      },

      toggleActive: async (memberId) => {
        const currentGang = get().myGang;
        if (!currentGang) return;

        set({ isLoading: true, error: null });

        try {
          const isCurrentlyActive = currentGang.activeMemberIds.includes(memberId);

          let nextActiveIds = [...currentGang.activeMemberIds];

          if (isCurrentlyActive) {
            nextActiveIds = nextActiveIds.filter((id) => id !== memberId);
          } else {
            if (nextActiveIds.length >= currentGang.slots) {
              throw new Error('Todos os slots ativos da gangue já estão ocupados.');
            }
            nextActiveIds.push(memberId);
          }

          const updatedMembers = currentGang.members.map((member) => ({
            ...member,
            active: nextActiveIds.includes(member.id),
          }));

          set({
            myGang: {
              ...currentGang,
              activeMemberIds: nextActiveIds,
              members: updatedMembers,
            },
            isLoading: false,
            error: null,
          });
        } catch (err: any) {
          set({
            error: err?.message || 'Erro ao alterar escalação',
            isLoading: false,
          });
        }
      },

      dismissMember: async (memberId) => {
        set({ isLoading: true, error: null });

        try {
          const currentGang = get().myGang;
          if (!currentGang) throw new Error('Gangue não carregada.');

          const newMembers = currentGang.members.filter((m) => m.id !== memberId);
          const newActiveIds = currentGang.activeMemberIds.filter((id) => id !== memberId);

          set({
            myGang: {
              ...currentGang,
              members: newMembers,
              activeMemberIds: newActiveIds,
            },
            isLoading: false,
            error: null,
          });
        } catch (err: any) {
          set({
            error: err?.message || 'Erro ao demitir membro',
            isLoading: false,
          });
        }
      },

      donateToTreasury: async (type, amount) => {
        set({ isLoading: true, error: null });

        try {
          const currentGang = get().myGang;
          if (!currentGang) throw new Error('Gangue não carregada.');

          const numericAmount = Number(amount || 0);
          if (numericAmount <= 0) throw new Error('Valor inválido.');

          const playerStore = usePlayerStore.getState();
          const currentBalance = Number(playerStore.player.balances?.[type] || 0);

          if (currentBalance < numericAmount) {
            throw new Error('Saldo insuficiente para doar.');
          }

          playerStore.applyPlayerUpdate((player) => ({
            ...player,
            balances: {
              ...player.balances,
              [type]: Math.max(0, Number(player.balances?.[type] || 0) - numericAmount),
            },
          }));

          const expGain =
            type === 'cleanMoney'
              ? Math.round(numericAmount / 250)
              : type === 'dirtyMoney'
              ? Math.round(numericAmount / 500)
              : Math.round(numericAmount / 10);

          const nextExp = currentGang.exp + expGain;
          const leveledUp = nextExp >= currentGang.expToNext;

          set({
            myGang: {
              ...currentGang,
              treasury: {
                ...currentGang.treasury,
                [type]:
                  Number(currentGang.treasury?.[type] || 0) + numericAmount,
              },
              exp: leveledUp ? nextExp - currentGang.expToNext : nextExp,
              level: leveledUp ? currentGang.level + 1 : currentGang.level,
              expToNext: leveledUp
                ? Math.round(currentGang.expToNext * 1.25)
                    : currentGang.expToNext,
              slots: leveledUp && currentGang.level + 1 >= 5
                ? Math.min(6, currentGang.slots + 1)
                : currentGang.slots,
            },
            isLoading: false,
            error: null,
          });
        } catch (err: any) {
          set({
            error: err?.message || 'Erro ao doar para o caixa tático',
            isLoading: false,
          });
        }
      },

      upgradeGangSkill: async (skillId) => {
        set({ isLoading: true, error: null });

        try {
          const currentGang = get().myGang;
          if (!currentGang) throw new Error('Gangue não carregada.');

          const expCosts: Record<GangUpgradeId, number> = {
            training: 500,
            hideout: 800,
            blackmarket: 1000,
          };

          const validSkillId = skillId as GangUpgradeId;
          const cost = expCosts[validSkillId];
          if (!cost) throw new Error('Skill inválida.');

          if (currentGang.exp < cost) {
            throw new Error('EXP da gangue insuficiente para upgrade.');
          }

          const nextGang = {
            ...currentGang,
            exp: currentGang.exp - cost,
            upgrades: {
              ...currentGang.upgrades,
              trainingGroundsLevel:
                validSkillId === 'training'
                  ? currentGang.upgrades.trainingGroundsLevel + 1
                  : currentGang.upgrades.trainingGroundsLevel,
              hideoutLevel:
                validSkillId === 'hideout'
                  ? currentGang.upgrades.hideoutLevel + 1
                  : currentGang.upgrades.hideoutLevel,
              blackMarketLevel:
                validSkillId === 'blackmarket'
                  ? currentGang.upgrades.blackMarketLevel + 1
                  : currentGang.upgrades.blackMarketLevel,
            },
          };

          set({
            myGang: nextGang,
            isLoading: false,
            error: null,
          });
        } catch (err: any) {
          set({
            error: err?.message || 'Erro ao melhorar doutrina da gangue',
            isLoading: false,
          });
        }
      },

      getDoctrineBonus: () => {
        const currentGang = get().myGang || createDefaultGang();

        return {
          trainingBonusPercent: currentGang.upgrades.trainingGroundsLevel * 10,
          defenseBonusPercent: currentGang.upgrades.hideoutLevel * 8,
          lootBonusPercent: currentGang.upgrades.blackMarketLevel * 6,
          rarityBonusPercent: currentGang.upgrades.blackMarketLevel * 2,
        };
      },

      getMemberBattlePower: (member) => {
        const doctrine = get().getDoctrineBonus();

        const levelPower = member.level * 10;
        const rarityPower = RARITY_BASE_POWER[member.rarity] || 0;
        const loyaltyPower = Math.round(member.loyalty * 0.6);
        const victoriesPower = member.victories * 2;
        const skillPower = member.skills.reduce(
          (acc, skill) => acc + skill.level * 6,
          0
        );
        const gearPower =
          (member.equipment.weaponId ? 20 : 0) +
          (member.equipment.armorId ? 15 : 0) +
          (member.equipment.vehicleId ? 10 : 0);

        const subtotal =
          levelPower + rarityPower + loyaltyPower + victoriesPower + skillPower + gearPower;

        return Math.round(subtotal * (1 + doctrine.trainingBonusPercent / 100));
      },

      getBattleSnapshot: () => {
        const currentGang = get().myGang || createDefaultGang();
        const activeMembers = currentGang.members.filter((m) =>
          currentGang.activeMemberIds.includes(m.id)
        );
        const reserveMembers = currentGang.members.filter(
          (m) => !currentGang.activeMemberIds.includes(m.id)
        );

        const rawPower = activeMembers.reduce(
          (acc, member) => acc + get().getMemberBattlePower(member),
          0
        );

        const doctrine = get().getDoctrineBonus();
        const formationBonus = useGangBattleStore.getState().getFormationBonus();

        const attackPower = Math.round(
          rawPower * (1 + formationBonus.attackPercent / 100)
        );
        const defensePower = Math.round(
          rawPower *
            (1 + (formationBonus.defensePercent + doctrine.defenseBonusPercent) / 100)
        );
        const lootPower = Math.round(
          rawPower *
            (1 + (formationBonus.lootPercent + doctrine.lootBonusPercent) / 100)
        );

        const totalPower = Math.round((attackPower + defensePower + lootPower) / 3);

        return {
          activeMembers,
          reserveMembers,
          rawPower,
          totalPower,
          attackPower,
          defensePower,
          lootPower,
        };
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);