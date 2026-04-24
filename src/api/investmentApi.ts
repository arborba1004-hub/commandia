/**
 * COMMANDIA — investmentApi.ts
 * Service de API para investimentos
 */

import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

interface Investment {
  key: string;
  name: string;
  level: number;
  maxLevel: number;
  cost: number;
  category: string;
  benefit: string;
}

interface InvestmentBuffs {
  rajadaBonus: number;
  blindagemBonus: number;
  folegoBonus: number;
  hospitalCapacity: number;
  recoverySpeed: number;
  trainingSpeed: number;
  maxMembers: number;
  bondeBonus: number;
  defenseBonus: number;
  lootBonus: number;
}

class InvestmentApi {
  async getInvestments(): Promise<Investment[]> {
    const response = await axios.get(`${API_BASE}/faction/investments`);
    return response.data;
  }

  async getInvestment(investmentKey: string): Promise<Investment> {
    const response = await axios.get(`${API_BASE}/faction/investments/${investmentKey}`);
    return response.data;
  }

  async getInvestmentBuffs(): Promise<InvestmentBuffs> {
    const response = await axios.get(`${API_BASE}/faction/investment-buffs`);
    return response.data;
  }

  async upgradeInvestment(investmentKey: string): Promise<{
    success: boolean;
    newLevel: number;
    newCost: number;
  }> {
    const response = await axios.post(`${API_BASE}/faction/investment/upgrade`, {
      investmentKey,
    });
    return response.data;
  }

  async calculateUpgradeCost(investmentKey: string, fromLevel: number, toLevel: number): Promise<{
    cost: number;
    benefit: string;
  }> {
    const response = await axios.post(`${API_BASE}/faction/investment/calculate-cost`, {
      investmentKey,
      fromLevel,
      toLevel,
    });
    return response.data;
  }

  async getInvestmentsByCategory(category: string): Promise<Investment[]> {
    const response = await axios.get(`${API_BASE}/faction/investments?category=${category}`);
    return response.data;
  }

  async validateUpgrade(investmentKey: string): Promise<{
    canUpgrade: boolean;
    reason?: string;
  }> {
    const response = await axios.post(`${API_BASE}/faction/investment/validate`, {
      investmentKey,
    });
    return response.data;
  }
}

export default new InvestmentApi();
