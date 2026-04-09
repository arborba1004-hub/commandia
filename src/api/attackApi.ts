// src/api/attackApi.ts
import { useGangStore } from '@/store/gangStore';
import { useGangBattleStore } from '@/stores/gangBattleStore';
import { fetchCurrentPlayer } from './playerApi';

const BACKEND_URL = 'https://comando-backend.onrender.com';
const REQUEST_TIMEOUT_MS = 60000; // 60 segundos (para Render acordar)

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Erro na requisição ${endpoint}`);
    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Tempo limite excedido ao acessar ${endpoint}`);
    }
    throw error;
  }
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
    let power = member.level * 10;
    if (member.rarity === 'Raro') power += 20;
    if (member.rarity === 'Épico') power += 50;
    if (member.rarity === 'Lendário') power += 100;
    if (member.rarity === 'Mítico') power += 200;
    totalPower += power;

    if (member.class === 'Executor') attackBonus += 5;
    if (member.class === 'Capanga') defenseBonus += 5;
    if (member.class === 'Ladrão') lootBonus += 5;
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
  spoils?: any;
}

// 🔥 Mude para false quando o backend estiver estável
const useMock = true;  // ⚠️ ENQUANTO O BACKEND NÃO RESPONDER, DEIXE true

export async function initiateAttack(targetId: string, options?: { gangPower?: any }): Promise<AttackResult> {
  if (useMock) {
    // Simulação local (rápida, sem backend)
    const player = await fetchCurrentPlayer();
    const { totalPower: gangPower, attackBonus, defenseBonus, lootBonus } = calculateGangBattlePower();
    const attackerPower = (player?.power || 100) + gangPower + attackBonus;
    const defenderPower = (player?.power || 100) + defenseBonus; // mock
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
      message: success ? (isCritical ? 'ATAQUE CRÍTICO!' : 'Ataque bem-sucedido!') : 'Falha no ataque.',
      attacker: player,
      defender: player,
      spoils: {
        dirtyMoneyLoot: success ? loot : 0,
        correLoot: success ? Math.floor(Math.random() * 100) : 0,
        prestigeLoot: success ? 10 : 0,
      },
    };
  }

  // Chamada real ao backend
  const body: any = { targetId };
  if (options?.gangPower) {
    body.gangPower = options.gangPower;
  }
  return request<AttackResult>('/attack/initiate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}