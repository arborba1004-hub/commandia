/**
 * Serviço de Sincronização de Poder do Jogador
 * Sincroniza o cálculo de poder com o playerStore automaticamente
 */

import { usePlayerStore, type PlayerState } from '@/store/playerStore';
import type { GangMembers, PlayerInvestments, PlayerSkills } from '@/types/powerSystem';
import { calculateTotalPower } from './powerCalculationService';

/**
 * Calcula e atualiza o poder do jogador no store
 * Deve ser chamado sempre que skills, investimentos ou membros da quadrilha mudam
 */
export function syncPlayerPower(player: PlayerState): void {
  try {
    // Preparar dados para cálculo
    const skills: PlayerSkills = {
      attack: player.skills?.attack ?? 0,
      defense: player.skills?.defense ?? 0,
      intelligence: player.skills?.intelligence ?? 0,
      agility: player.skills?.agility ?? 0,
      respect: player.skills?.respect ?? 0,
      vigor: player.skills?.vigor ?? 0,
    };

    // Investimentos (usando pageLevels como proxy)
    const investments: PlayerInvestments = {
      war: player.pageLevels?.arsenal ?? 0,
      laundering: player.pageLevels?.lavagem ?? 0,
      fuga: player.pageLevels?.game ?? 0,
      faction: player.pageLevels?.barraco ?? 0,
      luxury: player.pageLevels?.luxury ?? 0,
      comando: player.pageLevels?.giro ?? 0,
    };

    // Membros da quadrilha (placeholder - será expandido quando gang system estiver integrado)
    const gangMembers: GangMembers = {
      frente: { level: 0, isAlive: false, bonusMultiplier: 1 },
      muralha: { level: 0, isAlive: false, bonusMultiplier: 1 },
      nitro: { level: 0, isAlive: false, bonusMultiplier: 1 },
      certeiro: { level: 0, isAlive: false, bonusMultiplier: 1 },
      wifi: { level: 0, isAlive: false, bonusMultiplier: 1 },
    };

    // Calcular poder total
    const powerBreakdown = calculateTotalPower(
      skills,
      investments,
      gangMembers,
      player.niveis?.hierarchyLevel ?? 0,
      player.niveis?.playerLevel ?? 1
    );

    // Atualizar no store se o poder mudou
    const currentPower = player.power ?? 0;
    if (Math.abs(powerBreakdown.totalPower - currentPower) > 0) {
      usePlayerStore.getState().setPower(powerBreakdown.totalPower);
    }
  } catch (error) {
    console.error('Erro ao sincronizar poder do jogador:', error);
  }
}

/**
 * Monitora mudanças de skills e atualiza poder automaticamente
 */
export function setupPowerSyncListener(): () => void {
  const unsubscribe = usePlayerStore.subscribe(
    (state) => state.player,
    (player) => {
      syncPlayerPower(player);
    }
  );

  return unsubscribe;
}

/**
 * Calcula poder baseado em skills específicas
 * Útil para preview antes de aplicar mudanças
 */
export function calculatePowerPreview(
  skills: Partial<PlayerSkills>,
  investments?: Partial<PlayerInvestments>,
  playerLevel: number = 1
): number {
  const fullSkills: PlayerSkills = {
    attack: skills.attack ?? 0,
    defense: skills.defense ?? 0,
    intelligence: skills.intelligence ?? 0,
    agility: skills.agility ?? 0,
    respect: skills.respect ?? 0,
    vigor: skills.vigor ?? 0,
  };

  const fullInvestments: PlayerInvestments = {
    war: investments?.war ?? 0,
    laundering: investments?.laundering ?? 0,
    fuga: investments?.fuga ?? 0,
    faction: investments?.faction ?? 0,
    luxury: investments?.luxury ?? 0,
    comando: investments?.comando ?? 0,
  };

  const gangMembers: GangMembers = {
    frente: { level: 0, isAlive: false, bonusMultiplier: 1 },
    muralha: { level: 0, isAlive: false, bonusMultiplier: 1 },
    nitro: { level: 0, isAlive: false, bonusMultiplier: 1 },
    certeiro: { level: 0, isAlive: false, bonusMultiplier: 1 },
    wifi: { level: 0, isAlive: false, bonusMultiplier: 1 },
  };

  const breakdown = calculateTotalPower(
    fullSkills,
    fullInvestments,
    gangMembers,
    0,
    playerLevel
  );

  return breakdown.totalPower;
}

/**
 * Retorna detalhes completos do cálculo de poder
 */
export function getPowerDetails(player: PlayerState) {
  const skills: PlayerSkills = {
    attack: player.skills?.attack ?? 0,
    defense: player.skills?.defense ?? 0,
    intelligence: player.skills?.intelligence ?? 0,
    agility: player.skills?.agility ?? 0,
    respect: player.skills?.respect ?? 0,
    vigor: player.skills?.vigor ?? 0,
  };

  const investments: PlayerInvestments = {
    war: player.pageLevels?.arsenal ?? 0,
    laundering: player.pageLevels?.lavagem ?? 0,
    fuga: player.pageLevels?.game ?? 0,
    faction: player.pageLevels?.barraco ?? 0,
    luxury: player.pageLevels?.luxury ?? 0,
    comando: player.pageLevels?.giro ?? 0,
  };

  const gangMembers: GangMembers = {
    frente: { level: 0, isAlive: false, bonusMultiplier: 1 },
    muralha: { level: 0, isAlive: false, bonusMultiplier: 1 },
    nitro: { level: 0, isAlive: false, bonusMultiplier: 1 },
    certeiro: { level: 0, isAlive: false, bonusMultiplier: 1 },
    wifi: { level: 0, isAlive: false, bonusMultiplier: 1 },
  };

  return calculateTotalPower(
    skills,
    investments,
    gangMembers,
    player.niveis?.hierarchyLevel ?? 0,
    player.niveis?.playerLevel ?? 1
  );
}
