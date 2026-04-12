import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usePlayerStore } from '@/store/playerStore';
import { useGangBattleStore } from '@/stores/gangBattleStore';
import type {
  Gang,
  GangBattleStats,
  GangDoctrineLevels,
  GangEquipmentType,
  GangMember,
  GangSkillKey,
  MemberClass,
  MemberSkill,
  Rarity,
} from '@/types/gang';

type RecruitMethod = 'mission' | 'market' | 'premium';

interface GangStore {
  myGang: Gang | null;
  isLoading: boolean;
  error: string | null;

  initializeGang: () => void;
  fetchMyGang: () => Promise<void>;

  recruitMember: (method: RecruitMethod) => Promise<GangMember | null>;
  trainMember: (memberId: string, usePremium?: boolean) => Promise<void>;
  equipMember: (
    memberId: string,
    equipmentType: GangEquipmentType,
    itemId: string
  ) => Promise<void>;
  toggleActive: (memberId: string) => Promise<void>;
  dismissMember: (memberId: string) => Promise<void>;

  donateToTreasury: (
    type: 'dirtyMoney' | 'cleanMoney' | 'corre',
    amount: number
  ) => Promise<void>;

  upgradeGangSkill: (skillId: GangSkillKey) => Promise<void>;

  getBattleStats: () => GangBattleStats;
  getActiveMembers: () => GangMember[];
  getReserveMembers: () => GangMember[];
  clearGang: () => void;
}

const DEFAULT_GANG_ID = 'default-gang';

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

const RARITY_WEIGHTS: Array<{ rarity: Rarity; weight: number }> = [
  { rarity: 'Comum', weight: 55 },
  { rarity: 'Raro', weight: 25 },
  { rarity: 'Épico', weight: 12 },
  { rarity: 'Lendário', weight: 6 },
  { rarity: 'Mítico', weight: 2 },
];

const RARITY_POWER_MULTIPLIER: Record<Rarity, number> = {
  Comum: 1,
  Raro: 1.15,
  Épico: 1.35,
  Lendário: 1.65,
  Mítico: 2,
};

const CLASS_SKILL_POOL: Record<MemberClass, Array<{ name: string; description: string }>> = {
  Assassino: [
    { name: 'Execução Limpa', description: 'Dano maior em alvo prioritário.' },
    { name: 'Passo Fantasma', description: 'Mais eficiência em emboscadas.' },
  ],
  Ladrão: [
    { name: 'Mão Leve', description: 'Melhora saque e roubo rápido.' },
    { name: 'Sombra Urbana', description: 'Aumenta infiltração.' },
  ],
  Lavador: [
    { name: 'Rede Fria', description: 'Protege recursos e cobertura.' },
    { name: 'Fluxo Limpo', description: 'Aumenta eficiência operacional.' },
  ],
  Motorista: [
    { name: 'Linha de Fuga', description: 'Melhora retirada da tropa.' },
    { name: 'Traçado Perfeito', description: 'Aumenta mobilidade tática.' },
  ],
  Armeiro: [
    { name: 'Mira Ajustada', description: 'Melhora ataque da equipe.' },
    { name: 'Manutenção Pesada', description: 'Aumenta consistência ofensiva.' },
  ],
  Informante: [
    { name: 'Olho Vivo', description: 'Aumenta leitura do alvo.' },
    { name: 'Rede de Rua', description: 'Melhora chance de vantagem inicial.' },
  ],
  Capanga: [
    { name: 'Corpo Fechado', description: 'Melhora resistência física.' },
    { name: 'Linha de Frente', description: 'Absorve pressão inimiga.' },
  ],
  Médico: [
    { name: 'Remendo Rápido', description: 'Sustenta a tropa por mais tempo.' },
    { name: 'Pulso Frio', description: 'Reduz colapso em combate.' },
  ],
  Executor: [
    { name: 'Golpe Final', description: 'Potencializa fechamento de luta.' },
    { name: 'Ameaça Direta', description: 'Pressão ofensiva elevada.' },
  ],
  Negociador: [
    { name: 'Leitura de Cena', description: 'Aumenta controle e saque.' },
    { name: 'Presença de Rua', description: 'Melhora disciplina da equipe.' },
  ],
};

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function weightedRarity(): Rarity {
  const total = RARITY_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const item of RARITY_WEIGHTS) {
    roll -= item.weight;
    if (roll <= 0) return item.rarity;
  }

  return 'Comum';
}

function randomClass(): MemberClass {
  return MEMBER_CLASSES[Math.floor(Math.random() * MEMBER_CLASSES.length)];
}

function getExpToNext(level: number) {
  return Math.floor(100 + (level - 1) * 65);
}

function createBaseSkills(memberClass: MemberClass): MemberSkill[] {
  const pool = CLASS_SKILL_POOL[memberClass] || [];
  return pool.map((skill, index) => ({
    id: `${memberClass}-${index + 1}`,
    name: skill.name,
    description: skill.description,
    level: 1,
    maxLevel: 10,
    effect: '+5%',
  }));
}

function createGangMember(rarity: Rarity, memberClass: MemberClass): GangMember {
  const baseLevel =
    rarity === 'Comum'
      ? 1
      : rarity === 'Raro'
      ? 2
      : rarity === 'Épico'
      ? 4
      : rarity === 'Lendário'
      ? 6
      : 8;

  return {
    id: generateId('gang-member'),
    name: `${memberClass} ${Math.floor(Math.random() * 900 + 100)}`,
    class: memberClass,
    rarity,
    level: baseLevel,
    exp: 0,
    expToNext: getExpToNext(baseLevel),
    loyalty: Math.floor(65 + Math.random() * 31),
    skills: createBaseSkills(memberClass),
    equipment: {},
    active: false,
    recruitedAt: new Date().toISOString(),
    victories: 0,
    defeats: 0,
  };
}

function initialDoctrine(): GangDoctrineLevels {
  return {
    assalto: 1,
    emboscada: 1,
    resistencia: 1,
    fuga: 1,
    saque: 1,
    disciplina: 1,
  };
}

function createInitialGang(): Gang {
  return {
    id: DEFAULT_GANG_ID,
    name: 'Minha Gangue',
    tag: 'MG',
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
    doctrine: initialDoctrine(),
    createdAt: new Date().toISOString(),
    totalVictories: 0,
    totalDefeats: 0,
  };
}

function getRecruitCost(method: RecruitMethod) {
  switch (method) {
    case 'mission':
      return { type: 'dirtyMoney' as const, amount: 5000 };
    case 'market':
      return { type: 'cleanMoney' as const, amount: 50000 };
    case 'premium':
      return { type: 'cleanMoney' as const, amount: 150000 };
    default:
      return { type: 'dirtyMoney' as const, amount: 5000 };
  }
}

function getRecruitRarity(method: RecruitMethod): Rarity {
  if (method === 'premium') {
    const roll = Math.random();
    if (roll < 0.55) return 'Épico';
    if (roll < 0.9) return 'Lendário';
    return 'Mítico';
  }

  if (method === 'market') {
    const roll = Math.random();
    if (roll < 0.35) return 'Comum';
    if (roll < 0.7) return 'Raro';
    if (roll < 0.88) return 'Épico';
    if (roll < 0.97) return 'Lendário';
    return 'Mítico';
  }

  return weightedRarity();
}

function memberPower(member: GangMember) {
  const rarityMultiplier = RARITY_POWER_MULTIPLIER[member.rarity] || 1;
  const skillPower = member.skills.reduce((sum, skill) => sum + skill.level * 4, 0);
  const loyaltyBonus = member.loyalty * 0.35;
  const equipmentBonus =
    (member.equipment.weaponId ? 18 : 0) +
    (member.equipment.armorId ? 12 : 0) +
    (member.equipment.vehicleId ? 15 : 0);

  return Math.floor(member.level * 20 * rarityMultiplier + skillPower + loyaltyBonus + equipmentBonus);
}

function doctrineAttackBonus(levels: GangDoctrineLevels) {
  return levels.assalto * 4 + levels.emboscada * 3;
}

function doctrineDefenseBonus(levels: GangDoctrineLevels) {
  return levels.resistencia * 5 + levels.disciplina * 2;
}

function doctrineLootBonus(levels: GangDoctrineLevels) {
  return levels.saque * 4 + levels.fuga * 2;
}

function getGangUpgradeCost(level: number) {
  return Math.floor(2500 * Math.pow(1.18, Math.max(0, level - 1)));
}

export const useGangStore = create<GangStore>()(
  persist(
    (set, get) => ({
      myGang: null,
      isLoading: false,
      error: null,

      initializeGang: () => {
        const current = get().myGang;
        if (current) return;

        set({
          myGang: createInitialGang(),
          error: null,
        });
      },

      fetchMyGang: async () => {
        set({ isLoading: true, error: null });

        try {
          const current = get().myGang;
          if (!current) {
            set({
              myGang: createInitialGang(),
              isLoading: false,
              error: null,
            });
            return;
          }

          set({
            myGang: current,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao carregar gangue',
          });
        }
      },

      recruitMember: async (method) => {
        set({ isLoading: true, error: null });

        try {
          const gang = get().myGang || createInitialGang();
          const playerStore = usePlayerStore.getState();
          const player = playerStore.player;
          const cost = getRecruitCost(method);
          const currentBalance = Number(player?.balances?.[cost.type] || 0);

          if (currentBalance < cost.amount) {
            throw new Error('Saldo insuficiente para recrutamento.');
          }

          playerStore.applyPlayerUpdate((currentPlayer) => ({
            ...currentPlayer,
            balances: {
              ...currentPlayer.balances,
              [cost.type]: Math.max(
                0,
                Number(currentPlayer.balances?.[cost.type] || 0) - cost.amount
              ),
            },
          }));

          const rarity = getRecruitRarity(method);
          const memberClass = randomClass();
          const newMember = createGangMember(rarity, memberClass);

          const updatedGang: Gang = {
            ...gang,
            members: [...gang.members, newMember],
            exp: gang.exp + 50,
          };

          if (
            updatedGang.activeMemberIds.length < updatedGang.slots &&
            !updatedGang.activeMemberIds.includes(newMember.id)
          ) {
            newMember.active = true;
            updatedGang.activeMemberIds = [...updatedGang.activeMemberIds, newMember.id];
          }

          set({
            myGang: updatedGang,
            isLoading: false,
            error: null,
          });

          return newMember;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao recrutar membro',
          });
          return null;
        }
      },

      trainMember: async (memberId, usePremium = false) => {
        set({ isLoading: true, error: null });

        try {
          const gang = get().myGang;
          if (!gang) throw new Error('Gangue não encontrada.');

          const playerStore = usePlayerStore.getState();
          const costType = usePremium ? 'cleanMoney' : 'dirtyMoney';
          const costAmount = usePremium ? 5000 : 2000;
          const expGain = usePremium ? 500 : 100;

          if (Number(playerStore.player?.balances?.[costType] || 0) < costAmount) {
            throw new Error('Saldo insuficiente para treino.');
          }

          playerStore.applyPlayerUpdate((currentPlayer) => ({
            ...currentPlayer,
            balances: {
              ...currentPlayer.balances,
              [costType]: Math.max(
                0,
                Number(currentPlayer.balances?.[costType] || 0) - costAmount
              ),
            },
          }));

          const updatedMembers = gang.members.map((member) => {
            if (member.id !== memberId) return member;

            let newExp = member.exp + expGain;
            let newLevel = member.level;
            let newExpToNext = member.expToNext;
            let newSkills = member.skills;

            while (newExp >= newExpToNext) {
              newExp -= newExpToNext;
              newLevel += 1;
              newExpToNext = getExpToNext(newLevel);
              newSkills = newSkills.map((skill) => ({
                ...skill,
                level: Math.min(skill.maxLevel, skill.level + (Math.random() < 0.4 ? 1 : 0)),
              }));
            }

            return {
              ...member,
              exp: newExp,
              level: newLevel,
              expToNext: newExpToNext,
              loyalty: Math.min(100, member.loyalty + (usePremium ? 3 : 1)),
              skills: newSkills,
            };
          });

          set({
            myGang: {
              ...gang,
              members: updatedMembers,
            },
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao treinar membro',
          });
        }
      },

      equipMember: async (memberId, equipmentType, itemId) => {
        set({ isLoading: true, error: null });

        try {
          const gang = get().myGang;
          if (!gang) throw new Error('Gangue não encontrada.');

          const updatedMembers = gang.members.map((member) =>
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
              ...gang,
              members: updatedMembers,
            },
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao equipar membro',
          });
        }
      },

      toggleActive: async (memberId) => {
        set({ isLoading: true, error: null });

        try {
          const gang = get().myGang;
          if (!gang) throw new Error('Gangue não encontrada.');

          const isCurrentlyActive = gang.activeMemberIds.includes(memberId);

          if (!isCurrentlyActive && gang.activeMemberIds.length >= gang.slots) {
            throw new Error('Todos os slots ativos já estão ocupados.');
          }

          const newActiveIds = isCurrentlyActive
            ? gang.activeMemberIds.filter((id) => id !== memberId)
            : [...gang.activeMemberIds, memberId];

          const updatedMembers = gang.members.map((member) =>
            member.id === memberId ? { ...member, active: !isCurrentlyActive } : member
          );

          set({
            myGang: {
              ...gang,
              activeMemberIds: newActiveIds,
              members: updatedMembers,
            },
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao alternar membro',
          });
        }
      },

      dismissMember: async (memberId) => {
        set({ isLoading: true, error: null });

        try {
          const gang = get().myGang;
          if (!gang) throw new Error('Gangue não encontrada.');

          const updatedMembers = gang.members.filter((member) => member.id !== memberId);
          const updatedActiveIds = gang.activeMemberIds.filter((id) => id !== memberId);

          set({
            myGang: {
              ...gang,
              members: updatedMembers,
              activeMemberIds: updatedActiveIds,
            },
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao dispensar membro',
          });
        }
      },

      donateToTreasury: async (type, amount) => {
        set({ isLoading: true, error: null });

        try {
          const gang = get().myGang;
          if (!gang) throw new Error('Gangue não encontrada.');

          const playerStore = usePlayerStore.getState();
          const currentBalance = Number(playerStore.player?.balances?.[type] || 0);

          if (currentBalance < amount) {
            throw new Error('Saldo insuficiente para doação.');
          }

          playerStore.applyPlayerUpdate((currentPlayer) => ({
            ...currentPlayer,
            balances: {
              ...currentPlayer.balances,
              [type]: Math.max(
                0,
                Number(currentPlayer.balances?.[type] || 0) - amount
              ),
            },
          }));

          set({
            myGang: {
              ...gang,
              treasury: {
                ...gang.treasury,
                [type]: Number(gang.treasury?.[type] || 0) + amount,
              },
              exp: gang.exp + Math.floor(amount / 500),
            },
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao doar para a gangue',
          });
        }
      },

      upgradeGangSkill: async (skillId) => {
        set({ isLoading: true, error: null });

        try {
          const gang = get().myGang;
          if (!gang) throw new Error('Gangue não encontrada.');

          const currentLevel = gang.doctrine[skillId] || 1;
          const cost = getGangUpgradeCost(currentLevel);
          const treasuryDirty = Number(gang.treasury.dirtyMoney || 0);

          if (treasuryDirty < cost) {
            throw new Error('Tesouro sujo insuficiente para upgrade.');
          }

          set({
            myGang: {
              ...gang,
              treasury: {
                ...gang.treasury,
                dirtyMoney: Math.max(0, treasuryDirty - cost),
              },
              doctrine: {
                ...gang.doctrine,
                [skillId]: currentLevel + 1,
              },
            },
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao evoluir doutrina',
          });
        }
      },

      getActiveMembers: () => {
        const gang = get().myGang;
        if (!gang) return [];
        return gang.members.filter((member) => gang.activeMemberIds.includes(member.id));
      },

      getReserveMembers: () => {
        const gang = get().myGang;
        if (!gang) return [];
        return gang.members.filter((member) => !gang.activeMemberIds.includes(member.id));
      },

      getBattleStats: () => {
        const gang = get().myGang;
        if (!gang) {
          return {
            totalPower: 0,
            avgLevel: 0,
            activeCount: 0,
            reserveCount: 0,
            lootBonusPercent: 0,
            attackBonusPercent: 0,
            defenseBonusPercent: 0,
          };
        }

        const activeMembers = gang.members.filter((member) =>
          gang.activeMemberIds.includes(member.id)
        );
        const reserveMembers = gang.members.filter(
          (member) => !gang.activeMemberIds.includes(member.id)
        );

        const formationBonus = useGangBattleStore.getState().getFormationBonus();
        const activePower = activeMembers.reduce((sum, member) => sum + memberPower(member), 0);
        const avgLevel =
          activeMembers.length > 0
            ? Math.floor(
                activeMembers.reduce((sum, member) => sum + member.level, 0) /
                  activeMembers.length
              )
            : 0;

        const attackBonusPercent =
          doctrineAttackBonus(gang.doctrine) + formationBonus.attackPercent;

        const defenseBonusPercent =
          doctrineDefenseBonus(gang.doctrine) + formationBonus.defensePercent;

        const lootBonusPercent =
          doctrineLootBonus(gang.doctrine) + formationBonus.lootPercent;

        return {
          totalPower: Math.max(
            0,
            Math.floor(
              activePower *
                (1 + attackBonusPercent / 100) *
                (1 + Math.max(0, defenseBonusPercent) / 250)
            )
          ),
          avgLevel,
          activeCount: activeMembers.length,
          reserveCount: reserveMembers.length,
          lootBonusPercent,
          attackBonusPercent,
          defenseBonusPercent,
        };
      },

      clearGang: () => {
        set({
          myGang: createInitialGang(),
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'gang-store',
    }
  )
);