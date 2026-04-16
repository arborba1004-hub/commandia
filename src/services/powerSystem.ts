/**
 * powerSystem.ts — ESPELHO FRONTEND do backend/utils/powerSystem.js
 *
 * ⚠️  QUALQUER mudança aqui DEVE ser replicada em backend/utils/powerSystem.js
 *     e vice-versa. As fórmulas DEVEM ser idênticas.
 *
 * FONTES QUE ALIMENTAM O PODER:
 *  1. Skills do jogador       → calculateBasePower()
 *  2. Armas do arsenal        → calculateWeaponBonus()
 *  3. Acessórios comprados    → calculateAccessoryBonus()
 *  4. Buffs da facção         → calculateEffectiveAttackerPower / DefenderPower()
 *  5. Gangue (totalPower)     → × GANG_CONTRIBUTION_FACTOR
 *  6. Formação da gangue      → aplicada antes de chegar aqui (gangWarCalculationService)
 *  7. CT (nível)              → afeta treino/recuperação, não diretamente o poder
 */

import type { PlayerState } from '@/store/playerStore';
import type { GangBattleCompositionStats } from '@/types/gangWar';

// ─────────────────────────────────────────────
// CONSTANTES — idênticas ao backend
// ─────────────────────────────────────────────
export const SKILL_WEIGHTS = {
  attack:       1.40,
  defense:      1.20,
  vigor:        1.25,
  agility:      1.15,
  intelligence: 1.10,
  respect:      0.90,
} as const;

export const GANG_STAT_WEIGHTS = {
  rajada:            1.15,
  blindagem:         1.05,
  folego:            0.95,
  quebra:            1.20,
  intelPower:        0.35,
  mobilityPower:     0.30,
  weaponPower:       0.40,
  coordinationPower: 0.25,
} as const;

export const GANG_CONTRIBUTION_FACTOR = 0.45;

export const ACCESSORY_BONUS_BY_LEVEL = { low: 1, high: 2 } as const;

export const FACTION_ATTACK_WEIGHTS = {
  attackPercent:       1.00,
  agilityPercent:      0.35,
  intelligencePercent: 0.25,
  respectPercent:      0.15,
} as const;

export const FACTION_DEFENSE_WEIGHTS = {
  defensePercent:      1.00,
  baseDefensePercent:  0.80,
  hpPercent:           0.40,
  agilityPercent:      0.20,
  intelligencePercent: 0.20,
} as const;

// ─────────────────────────────────────────────
// TIPOS LOCAIS
// ─────────────────────────────────────────────
export type FactionBuffs = {
  attackPercent?:       number;
  defensePercent?:      number;
  baseDefensePercent?:  number;
  hpPercent?:           number;
  agilityPercent?:      number;
  intelligencePercent?: number;
  respectPercent?:      number;
  dirtyMoneyGainPercent?: number;
  cleanMoneyGainPercent?: number;
};

export type WeaponBonus    = { attackBonus: number; defenseBonus: number };
export type AccessoryBonus = Record<string, number>;

export type PowerBreakdown = {
  basePower:       number;
  enhancedPower:   number;
  gangContribution: number;
  effectiveAttack: number;
  effectiveDefense: number;
  sources: {
    skills:      number;
    weapons:     number;
    accessories: number;
    gang:        number;
    faction:     number;
  };
  weaponBonus:    WeaponBonus;
  accessoryBonus: AccessoryBonus;
};

function safeNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ─────────────────────────────────────────────
// 1. PODER BASE (só skills)
// ─────────────────────────────────────────────
export function calculateBasePower(player: Partial<PlayerState>): number {
  const s = player?.skills || {};
  return Math.floor(
    safeNum(s.attack)       * SKILL_WEIGHTS.attack +
    safeNum(s.defense)      * SKILL_WEIGHTS.defense +
    safeNum(s.vigor)        * SKILL_WEIGHTS.vigor +
    safeNum(s.agility)      * SKILL_WEIGHTS.agility +
    safeNum(s.intelligence) * SKILL_WEIGHTS.intelligence +
    safeNum(s.respect)      * SKILL_WEIGHTS.respect
  );
}

// ─────────────────────────────────────────────
// 2. BÔNUS DE ARMAS
// ─────────────────────────────────────────────
export function calculateWeaponBonus(player: Partial<PlayerState>): WeaponBonus {
  const items = player?.inventory?.items || [];
  let attackBonus  = 0;
  let defenseBonus = 0;

  for (const item of items) {
    if ((item as any)?.category === 'weapon') {
      attackBonus  += safeNum((item as any).attackBonus, 0);
      defenseBonus += safeNum((item as any).defenseBonus, 0);
    }
  }

  return { attackBonus, defenseBonus };
}

// ─────────────────────────────────────────────
// 3. BÔNUS DE ACESSÓRIOS
// ─────────────────────────────────────────────
export function calculateAccessoryBonus(player: Partial<PlayerState>): AccessoryBonus {
  const accessories = player?.purchasedAccessories || [];
  const playerLevel = safeNum((player as any)?.niveis?.playerLevel, 1);
  const bonusPerItem = playerLevel > 50
    ? ACCESSORY_BONUS_BY_LEVEL.high
    : ACCESSORY_BONUS_BY_LEVEL.low;

  const byType: AccessoryBonus = {};
  for (const acc of accessories) {
    const t = (acc as any)?.skillType;
    if (t) byType[t] = (byType[t] || 0) + bonusPerItem;
  }
  return byType;
}

// ─────────────────────────────────────────────
// 4. PODER COM ARMAS + ACESSÓRIOS
// ─────────────────────────────────────────────
export function calculateEnhancedPower(player: Partial<PlayerState>): number {
  const s      = player?.skills || {};
  const accBon = calculateAccessoryBonus(player);
  const wBon   = calculateWeaponBonus(player);

  const enhanced = Math.floor(
    safeNum(s.attack)       * (1 + safeNum(accBon.attack, 0) / 100)       * SKILL_WEIGHTS.attack +
    safeNum(s.defense)      * (1 + safeNum(accBon.defense, 0) / 100)      * SKILL_WEIGHTS.defense +
    safeNum(s.vigor)        * (1 + safeNum(accBon.vigor, 0) / 100)        * SKILL_WEIGHTS.vigor +
    safeNum(s.agility)      * (1 + safeNum(accBon.agility, 0) / 100)      * SKILL_WEIGHTS.agility +
    safeNum(s.intelligence) * (1 + safeNum(accBon.intelligence, 0) / 100) * SKILL_WEIGHTS.intelligence +
    safeNum(s.respect)      * (1 + safeNum(accBon.respect, 0) / 100)      * SKILL_WEIGHTS.respect
  );

  const weaponContrib = Math.floor(enhanced * (wBon.attackBonus / 100));
  return enhanced + weaponContrib;
}

/** Alias principal — use este nos componentes */
export function calculatePlayerPower(player: Partial<PlayerState>): number {
  return calculateEnhancedPower(player);
}

// ─────────────────────────────────────────────
// 5. PODER EFETIVO EM COMBATE (com facção + gangue)
// ─────────────────────────────────────────────
export function calculateEffectiveAttackerPower(
  playerPower:    number,
  factionBuffs:   FactionBuffs | null | undefined,
  gangTotalPower: number
): number {
  const b = factionBuffs || {};
  const mult = 1 + (
    safeNum(b.attackPercent)       * FACTION_ATTACK_WEIGHTS.attackPercent +
    safeNum(b.agilityPercent)      * FACTION_ATTACK_WEIGHTS.agilityPercent +
    safeNum(b.intelligencePercent) * FACTION_ATTACK_WEIGHTS.intelligencePercent +
    safeNum(b.respectPercent)      * FACTION_ATTACK_WEIGHTS.respectPercent
  ) / 100;

  return Math.floor(safeNum(playerPower) * mult + safeNum(gangTotalPower) * GANG_CONTRIBUTION_FACTOR);
}

export function calculateEffectiveDefenderPower(
  playerPower:    number,
  factionBuffs:   FactionBuffs | null | undefined,
  gangTotalPower: number
): number {
  const b = factionBuffs || {};
  const mult = 1 + (
    safeNum(b.defensePercent)      * FACTION_DEFENSE_WEIGHTS.defensePercent +
    safeNum(b.baseDefensePercent)  * FACTION_DEFENSE_WEIGHTS.baseDefensePercent +
    safeNum(b.hpPercent)           * FACTION_DEFENSE_WEIGHTS.hpPercent +
    safeNum(b.agilityPercent)      * FACTION_DEFENSE_WEIGHTS.agilityPercent +
    safeNum(b.intelligencePercent) * FACTION_DEFENSE_WEIGHTS.intelligencePercent
  ) / 100;

  return Math.floor(safeNum(playerPower) * mult + safeNum(gangTotalPower) * GANG_CONTRIBUTION_FACTOR);
}

// ─────────────────────────────────────────────
// CHANCE DE VITÓRIA
// ─────────────────────────────────────────────
export function calculateWinChance(attacker: number, defender: number): number {
  const total = Math.max(1, attacker + defender);
  return Math.min(0.90, Math.max(0.30, attacker / total));
}

// ─────────────────────────────────────────────
// LOOT CAPS
// ─────────────────────────────────────────────
const LOOT_CAPS: Array<[number, number]> = [
  [9,        20_000],
  [19,       50_000],
  [29,      120_000],
  [39,      300_000],
  [49,      700_000],
  [59,    1_500_000],
  [69,    3_000_000],
  [79,    6_000_000],
  [89,   10_000_000],
  [Infinity, 20_000_000],
];

export function getLootCapByLevel(level: number): number {
  for (const [cap, value] of LOOT_CAPS) {
    if (level <= cap) return value;
  }
  return 20_000_000;
}

// ─────────────────────────────────────────────
// BREAKDOWN COMPLETO (para UI)
// ─────────────────────────────────────────────
export function buildPowerBreakdown(
  player:         Partial<PlayerState>,
  gangStats:      GangBattleCompositionStats | null | undefined,
  factionBuffs:   FactionBuffs | null | undefined
): PowerBreakdown {
  const base       = calculateBasePower(player);
  const enhanced   = calculateEnhancedPower(player);
  const wBon       = calculateWeaponBonus(player);
  const accBon     = calculateAccessoryBonus(player);
  const gangTotal  = safeNum(gangStats?.totalPower, 0);
  const gangContrib = Math.floor(gangTotal * GANG_CONTRIBUTION_FACTOR);

  const effectiveAttack  = calculateEffectiveAttackerPower(enhanced, factionBuffs, gangTotal);
  const effectiveDefense = calculateEffectiveDefenderPower(enhanced, factionBuffs, gangTotal);

  return {
    basePower:        base,
    enhancedPower:    enhanced,
    gangContribution: gangContrib,
    effectiveAttack,
    effectiveDefense,
    sources: {
      skills:      base,
      weapons:     Math.floor(enhanced * (wBon.attackBonus / 100)),
      accessories: enhanced - base,
      gang:        gangContrib,
      faction:     effectiveAttack - enhanced - gangContrib,
    },
    weaponBonus:    wBon,
    accessoryBonus: accBon,
  };
}
