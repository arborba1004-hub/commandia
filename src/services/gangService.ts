/**
 * Gang Service
 * Handles gang-related operations and calculations
 */

export interface GangMember {
  id: string;
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
}

export interface Gang {
  id: string;
  name: string;
  level: number;
  members: GangMember[];
  treasury: number;
  reputation: number;
}

export const gangService = {
  /**
   * Calculate total gang power based on members
   */
  calculateGangPower(gang: Gang): number {
    if (!gang.members || gang.members.length === 0) return 0;
    
    const totalAttack = gang.members.reduce((sum, member) => sum + (member.attack || 0), 0);
    const totalDefense = gang.members.reduce((sum, member) => sum + (member.defense || 0), 0);
    const memberCount = gang.members.length;
    
    return (totalAttack + totalDefense) * memberCount;
  },

  /**
   * Calculate gang level based on members
   */
  calculateGangLevel(gang: Gang): number {
    if (!gang.members || gang.members.length === 0) return 1;
    
    const averageLevel = gang.members.reduce((sum, member) => sum + (member.level || 1), 0) / gang.members.length;
    return Math.floor(averageLevel);
  },

  /**
   * Calculate battle outcome between two gangs
   */
  calculateBattleOutcome(attacker: Gang, defender: Gang): { winner: 'attacker' | 'defender'; damageDealt: number; damageReceived: number } {
    const attackerPower = this.calculateGangPower(attacker);
    const defenderPower = this.calculateGangPower(defender);
    
    const powerDifference = attackerPower - defenderPower;
    const damageDealt = Math.max(10, Math.floor(defenderPower * 0.1 + powerDifference * 0.05));
    const damageReceived = Math.max(5, Math.floor(attackerPower * 0.05));
    
    return {
      winner: powerDifference > 0 ? 'attacker' : 'defender',
      damageDealt,
      damageReceived,
    };
  },

  /**
   * Add member to gang
   */
  addMember(gang: Gang, member: GangMember): Gang {
    return {
      ...gang,
      members: [...gang.members, member],
    };
  },

  /**
   * Remove member from gang
   */
  removeMember(gang: Gang, memberId: string): Gang {
    return {
      ...gang,
      members: gang.members.filter(m => m.id !== memberId),
    };
  },

  /**
   * Update gang treasury
   */
  updateTreasury(gang: Gang, amount: number): Gang {
    return {
      ...gang,
      treasury: Math.max(0, gang.treasury + amount),
    };
  },

  /**
   * Update gang reputation
   */
  updateReputation(gang: Gang, amount: number): Gang {
    return {
      ...gang,
      reputation: Math.max(0, gang.reputation + amount),
    };
  },
};

export default gangService;
