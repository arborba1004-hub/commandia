/**
 * Achievement System Types
 */

export type AchievementId = 
  | 'first-attack'
  | 'barraco-level-10'
  | 'laundry-10k'
  | 'level-50'
  | 'arsenal-master'
  | 'faction-leader'
  | 'wealth-100k'
  | 'skill-master';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  title: string;
  titleColor: string;
  condition: (playerData: any) => boolean;
}

export interface PlayerAchievements {
  playerId: string;
  unlockedAchievements: AchievementId[];
  lastUnlockedDate?: Date;
}

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  'first-attack': {
    id: 'first-attack',
    name: 'Primeiro Ataque',
    description: 'Realize seu primeiro ataque',
    icon: '⚔️',
    title: 'Guerreiro',
    titleColor: '#FF6B6B',
    condition: (player) => player.stats?.attacks > 0,
  },
  'barraco-level-10': {
    id: 'barraco-level-10',
    name: 'Barraco Nível 10',
    description: 'Leve seu barraco ao nível 10',
    icon: '🏠',
    title: 'Construtor',
    titleColor: '#4ECDC4',
    condition: (player) => player.niveis?.barracoLevel >= 10,
  },
  'laundry-10k': {
    id: 'laundry-10k',
    name: 'Lavar 10k',
    description: 'Lave 10.000 de dinheiro sujo',
    icon: '💰',
    title: 'Lavador',
    titleColor: '#95E1D3',
    condition: (player) => player.stats?.moneyLaundered >= 10000,
  },
  'level-50': {
    id: 'level-50',
    name: 'Nível 50',
    description: 'Alcance o nível 50',
    icon: '⭐',
    title: 'Lendário',
    titleColor: '#FFD93D',
    condition: (player) => player.niveis?.playerLevel >= 50,
  },
  'arsenal-master': {
    id: 'arsenal-master',
    name: 'Mestre do Arsenal',
    description: 'Desbloqueie todas as armas',
    icon: '🔫',
    title: 'Armeiro',
    titleColor: '#6C5CE7',
    condition: (player) => player.stats?.weaponsUnlocked >= 15,
  },
  'faction-leader': {
    id: 'faction-leader',
    name: 'Líder de Facção',
    description: 'Torne-se líder de uma facção',
    icon: '👑',
    title: 'Patrão',
    titleColor: '#FF6348',
    condition: (player) => player.faction?.isLeader === true,
  },
  'wealth-100k': {
    id: 'wealth-100k',
    name: 'Riqueza 100k',
    description: 'Acumule 100.000 de dinheiro limpo',
    icon: '💎',
    title: 'Milionário',
    titleColor: '#FFD700',
    condition: (player) => player.balances?.cleanMoney >= 100000,
  },
  'skill-master': {
    id: 'skill-master',
    name: 'Mestre de Habilidades',
    description: 'Maxe uma habilidade',
    icon: '🎯',
    title: 'Especialista',
    titleColor: '#00B4DB',
    condition: (player) => {
      const skills = player.skills || {};
      return Object.values(skills).some((skill: any) => skill >= 100);
    },
  },
};
