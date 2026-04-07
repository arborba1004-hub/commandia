// src/api/attackApi.ts
import { useGangStore } from '@/store/gangStore';
import { useGangBattleStore } from '@/stores/gangBattleStore'; // vamos criar agora
import { fetchCurrentPlayer } from './playerApi';

const BACKEND_URL = 'https://comando-backend.onrender.com';

function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
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
// Cálculo do poder da gangue para batalha
// ==========================================
export function calculateGangBattlePower() {
  const { myGang } = useGangStore.getState();
  const { formation, getFormationBonus } = useGangBattleStore.getState();
  if (!myGang) return { totalPower: 0, attackBonus: 0, defenseBonus: 0, lootBonus: 0 };

  const activeMembers = myGang.members.filter(m => myGang.activeMemberIds.includes(m.id));
  let totalPower = 0;
  let attackBonus = 0;
  let defenseBonus = 0;
  let lootBonus = 0;

  for (const member of activeMembers) {
    // Poder base: nível * 10 + bônus por raridade
    let power = member.level * 10;
    if (member.rarity === 'Raro') power += 20;
    if (member.rarity === 'Épico') power += 50;
    if (member.rarity === 'Lendário') power += 100;
    if (member.rarity === 'Mítico') power += 200;

    // Bônus por classe
    if (member.class === 'Executor') attackBonus += 5;
    if (member.class === 'Capanga') defenseBonus += 5;
    if (member.class === 'Ladrão') lootBonus += 5;

    totalPower += power;
  }

  const formationBonus = getFormationBonus(formation);
  attackBonus += formationBonus.attackPercent;
  defenseBonus += formationBonus.defensePercent;
  lootBonus += formationBonus.lootPercent;

  return { totalPower, attackBonus, defenseBonus, lootBonus };
}

// ==========================================
// Função principal de ataque
// ==========================================
export interface AttackResult {
  success: boolean;
  critical: boolean;
  loot: number;
  chance: number;
  attackerPower: number;
  defenderPower: number;
  message: string;
  attacker: any;
  defender: any;
}

export async function initiateAttack(targetId: string): Promise<AttackResult> {
  // Se o backend ainda não tiver a rota, usamos simulação local (para testes)
  const useMock = false; // mude para false quando o backend estiver pronto

  if (useMock) {
    // Simulação local (apenas para desenvolvimento frontend)
    const player = await fetchCurrentPlayer();
    const target = await fetchCurrentPlayer(); // mock, substituir por busca real
    const { totalPower: gangPower, attackBonus, defenseBonus, lootBonus } = calculateGangBattlePower();

    const attackerPower = (player?.power || 100) + gangPower + attackBonus;
    const defenderPower = (target?.power || 100) + defenseBonus;
    const chance = Math.min(0.9, Math.max(0.3, attackerPower / (attackerPower + defenderPower)));
    const success = Math.random() < chance;
    const isCritical = success && Math.random() < 0.15;
    const loot = success ? Math.floor(Math.random() * 5000) * (1 + lootBonus / 100) : 0;

    return {
      success,
      critical: isCritical,
      loot,
      chance,
      attackerPower,
      defenderPower,
      message: success ? (isCritical ? 'Ataque crítico!' : 'Ataque bem-sucedido!') : 'Falha no ataque.',
      attacker: player,
      defender: target,
    };
  }

  // Chamada real ao backend (quando as rotas estiverem prontas)
  return request<AttackResult>('/attack/initiate', {
    method: 'POST',
    body: JSON.stringify({ targetId }),
  });
}