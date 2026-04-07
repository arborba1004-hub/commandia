// src/api/gangApi.ts
import { Gang, GangMember } from '@/types/gang';

const BACKEND_URL = 'https://comando-backend.onrender.com';

// ==========================================
// HELPERS DE REQUISIÇÃO (cópia do playerApi)
// ==========================================
function getAuthToken(): string | null {
  const candidates = [
    localStorage.getItem('authToken'),
    localStorage.getItem('token'),
    localStorage.getItem('jwt'),
  ];
  for (const token of candidates) {
    if (token && token.trim()) return token.trim();
  }
  return null;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erro na requisição ${endpoint}`);
  return data as T;
}

// ==========================================
// TIPOS ESPECÍFICOS (compatíveis com o backend)
// ==========================================
export interface GangSkillUpgrades {
  trainingGroundsLevel: number;
  hideoutLevel: number;
  blackMarketLevel: number;
}

export interface GangTreasury {
  dirtyMoney: number;
  cleanMoney: number;
  corre: number;
}



// ==========================================
// FUNÇÕES DA API
// ==========================================

/**
 * Criar uma nova gangue
 */
export async function createGang(name: string, tag: string): Promise<{ gang: Gang }> {
  return request<{ gang: Gang }>('/gang/create', {
    method: 'POST',
    body: JSON.stringify({ name, tag }),
  });
}

/**
 * Buscar a gangue do jogador logado
 */
export async function fetchMyGang(): Promise<{ gang: Gang }> {
  return request<{ gang: Gang }>('/gang/my');
}

/**
 * Recrutar um novo membro
 * @param method 'mission' | 'market' | 'premium'
 */
export async function recruitMember(method: string): Promise<{ member: GangMember }> {
  return request<{ member: GangMember }>('/gang/recruit', {
    method: 'POST',
    body: JSON.stringify({ method }),
  });
}

/**
 * Treinar um membro
 * @param memberId ID do membro
 * @param usePremium se true, usa treino premium (custa coins)
 */
export async function trainMember(memberId: string, usePremium: boolean = false): Promise<{ member: GangMember }> {
  return request<{ member: GangMember }>('/gang/train', {
    method: 'POST',
    body: JSON.stringify({ memberId, usePremium }),
  });
}

/**
 * Equipar um item a um membro
 * @param memberId ID do membro
 * @param equipmentType 'weapon' | 'armor' | 'vehicle'
 * @param itemId ID do item (do inventário do jogador)
 */
export async function equipMember(
  memberId: string,
  equipmentType: 'weapon' | 'armor' | 'vehicle',
  itemId: string
): Promise<{ member: GangMember }> {
  return request<{ member: GangMember }>('/gang/equip', {
    method: 'POST',
    body: JSON.stringify({ memberId, equipmentType, itemId }),
  });
}

/**
 * Ativar ou desativar um membro (colocar na reserva)
 * @param memberId ID do membro
 * @param active true = ativo, false = reserva
 */
export async function toggleActiveMember(memberId: string, active: boolean): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/gang/toggle-active', {
    method: 'POST',
    body: JSON.stringify({ memberId, active }),
  });
}

/**
 * Demitir um membro (remove permanentemente)
 */
export async function dismissMember(memberId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/gang/dismiss', {
    method: 'POST',
    body: JSON.stringify({ memberId }),
  });
}

/**
 * Doar recursos para o tesouro da gangue
 * @param type 'dirtyMoney' | 'cleanMoney' | 'corre'
 * @param amount valor a doar
 */
export async function donateToTreasury(
  type: 'dirtyMoney' | 'cleanMoney' | 'corre',
  amount: number
): Promise<{ treasury: GangTreasury }> {
  return request<{ treasury: GangTreasury }>('/gang/donate', {
    method: 'POST',
    body: JSON.stringify({ type, amount }),
  });
}

/**
 * Melhorar uma habilidade da gangue (upgrade)
 * @param skillId 'training' | 'hideout' | 'blackmarket'
 */
export async function upgradeGangSkill(skillId: string): Promise<{ skills: GangSkillUpgrades }> {
  return request<{ skills: GangSkillUpgrades }>('/gang/upgrade-skill', {
    method: 'POST',
    body: JSON.stringify({ skillId }),
  });
}