import { Gang, GangMember } from '@/types/gang';

const BACKEND_URL = 'https://comando-backend.onrender.com';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('authToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erro na requisição ${endpoint}`);
  return data;
}

export async function fetchMyGang(): Promise<Gang> {
  const data = await request<{ gang: Gang }>('/gang/my');
  return data.gang;
}

export async function recruitMember(method: string): Promise<GangMember> {
  const data = await request<{ member: GangMember }>('/gang/recruit', {
    method: 'POST',
    body: JSON.stringify({ method }),
  });
  return data.member;
}

export async function trainMember(memberId: string, usePremium: boolean): Promise<GangMember> {
  const data = await request<{ member: GangMember }>('/gang/train', {
    method: 'POST',
    body: JSON.stringify({ memberId, usePremium }),
  });
  return data.member;
}

export async function equipMember(
  memberId: string,
  equipmentType: 'weapon' | 'armor' | 'vehicle',
  itemId: string
): Promise<GangMember> {
  const data = await request<{ member: GangMember }>('/gang/equip', {
    method: 'POST',
    body: JSON.stringify({ memberId, equipmentType, itemId }),
  });
  return data.member;
}

export async function toggleActiveMember(memberId: string, active: boolean): Promise<void> {
  await request('/gang/toggle-active', {
    method: 'POST',
    body: JSON.stringify({ memberId, active }),
  });
}

export async function dismissMember(memberId: string): Promise<void> {
  await request('/gang/dismiss', {
    method: 'POST',
    body: JSON.stringify({ memberId }),
  });
}

export async function donateToTreasury(
  type: 'dirtyMoney' | 'cleanMoney' | 'corre',
  amount: number
): Promise<{ dirtyMoney: number; cleanMoney: number; corre: number }> {
  const data = await request<{ treasury: any }>('/gang/donate', {
    method: 'POST',
    body: JSON.stringify({ type, amount }),
  });
  return data.treasury;
}

export async function upgradeGangSkill(skillId: string): Promise<any> {
  const data = await request('/gang/upgrade-skill', {
    method: 'POST',
    body: JSON.stringify({ skillId }),
  });
  return data.skills;
}