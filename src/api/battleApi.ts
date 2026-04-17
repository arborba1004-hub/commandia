/**
 * COMMANDIA — battleApi.ts
 * Service de API para ataques e batalhas
 */

import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

interface AttackRequest {
  targetId: string;
  formation: string;
  membersToSend: string[];
}

interface AttackResult {
  id: string;
  status: 'started' | 'resolved';
  success: boolean;
  critical: boolean;
  loot: number;
  winChance: number;
  roundsFought: number;
  attackerPower: number;
  defenderPower: number;
  attackerLosses: any;
  defenderLosses: any;
  hospitalNewWounded: number;
  bonusApplied: string[];
  message: string;
}

class BattleApi {
  async startAttack(targetId: string, formation: string): Promise<AttackResult> {
    const response = await axios.post(`${API_BASE}/attack/start`, {
      targetId,
      formation,
    });
    return response.data;
  }

  async resolveAttack(attackId: string): Promise<AttackResult> {
    const response = await axios.post(`${API_BASE}/attack/resolve`, {
      attackId,
    });
    return response.data;
  }

  async getAttack(attackId: string): Promise<AttackResult> {
    const response = await axios.get(`${API_BASE}/attack/${attackId}`);
    return response.data;
  }

  async estimateAttack(targetId: string, formation: string): Promise<{
    estimatedChance: number;
    estimatedLosses: {
      attacker: number;
      defender: number;
    };
    canAttack: boolean;
  }> {
    const response = await axios.post(`${API_BASE}/attack/estimate`, {
      targetId,
      formation,
    });
    return response.data;
  }

  async getAttackHistory(limit: number = 20) {
    const response = await axios.get(`${API_BASE}/player/attack-history?limit=${limit}`);
    return response.data;
  }

  async getIncomingAttacks() {
    const response = await axios.get(`${API_BASE}/player/incoming-attacks`);
    return response.data;
  }

  async cancelAttack(attackId: string): Promise<{ success: boolean }> {
    const response = await axios.post(`${API_BASE}/attack/cancel`, {
      attackId,
    });
    return response.data;
  }
}

export default new BattleApi();
