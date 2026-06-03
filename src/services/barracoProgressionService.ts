import { getBarracoName as getBarracoVisualName } from '@/config/barracoVisualConfig';
import type { PlayerState } from '@/store/playerStore';

export const MAX_BARRACO_LEVEL = 100;
const BASE_COST = 500;
const MULTIPLIER = 1.115;
const BASE_UPGRADE_DURATION_MS = 60 * 1000;
const DURATION_MULTIPLIER = 1.18;
const MAX_UPGRADE_DURATION_MS = 72 * 60 * 60 * 1000;
export const BARRACO_GANG_STAT_BONUS_PER_LEVEL = 1;

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toLevel(value: unknown, fallback = 1) {
  return Math.max(1, Math.floor(toNumber(value, fallback)));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function parseIsoTime(value?: string | null) {
  const time = new Date(value || '').getTime();
  return Number.isFinite(time) ? time : 0;
}

export function getFugaRequirementForBarracoLevel(level: number) {
  const safeLevel = toLevel(level, 1);
  return clamp(Math.ceil(safeLevel / 5), 1, 20);
}

export function getBarracoGangStatsBonusPercent(level: number) {
  const safeLevel = Math.max(1, Math.min(MAX_BARRACO_LEVEL, Math.floor(Number(level) || 1)));
  return Math.max(0, (safeLevel - 1) * BARRACO_GANG_STAT_BONUS_PER_LEVEL);
}

export function getNextBarracoGangStatsBonusPercent(level: number) {
  const nextLevel = Math.max(1, Math.min(MAX_BARRACO_LEVEL, Math.floor(Number(level) || 1) + 1));
  return getBarracoGangStatsBonusPercent(nextLevel);
}

export function getBarracoUpgradeCost(level: number) {
  return Math.floor(BASE_COST * Math.pow(MULTIPLIER, Math.max(0, level - 1)));
}

export function getBarracoUpgradeDurationMs(level: number) {
  const safeLevel = toLevel(level, 1);
  const rawDuration = Math.floor(
    BASE_UPGRADE_DURATION_MS * Math.pow(DURATION_MULTIPLIER, Math.max(0, safeLevel - 1))
  );
  return clamp(rawDuration, BASE_UPGRADE_DURATION_MS, MAX_UPGRADE_DURATION_MS);
}

export function formatBarracoDuration(durationMs = 0) {
  const totalSeconds = Math.max(0, Math.ceil(toNumber(durationMs, 0) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function getBarracoUpgradeRemainingMs(upgrade?: PlayerState['barracoUpgrade'] | null) {
  if (!upgrade?.active || !upgrade.endsAt) return 0;
  return Math.max(0, parseIsoTime(upgrade.endsAt) - Date.now());
}

export function isBarracoUpgradeReady(upgrade?: PlayerState['barracoUpgrade'] | null) {
  return Boolean(upgrade?.active && getBarracoUpgradeRemainingMs(upgrade) <= 0);
}

export function getBarracoUpgradeRequirements(player: PlayerState) {
  const barracoLevel = player?.niveis?.barracoLevel ?? 1;
  const cleanMoney = player?.balances?.cleanMoney ?? 0;
  const arsenalLevel = Math.max(
    1,
    toLevel(player?.pageLevels?.arsenal ?? (player?.niveis as any)?.arsenalLevel, 1)
  );
  const fugaLevel = Math.max(1, toLevel(player?.pageLevels?.fuga, 1));
  const briberyLevel = Math.max(
    1,
    toLevel(player?.pageLevels?.bribery ?? (player?.niveis as any)?.briberyLevel, 1)
  );
  const luxuryLevel = Math.max(
    1,
    toLevel(player?.pageLevels?.luxury ?? (player?.niveis as any)?.luxuryLevel, 1)
  );
  const activeUpgrade = player?.barracoUpgrade?.active === true;
  const activeRemainingMs = getBarracoUpgradeRemainingMs(player?.barracoUpgrade);
  const activeReady = isBarracoUpgradeReady(player?.barracoUpgrade);

  const cost = getBarracoUpgradeCost(barracoLevel);
  const durationMs = getBarracoUpgradeDurationMs(barracoLevel);
  const sideRequirement = Math.max(1, Math.floor(Number(barracoLevel) || 1));
  const fugaRequirement = getFugaRequirementForBarracoLevel(barracoLevel);

  const rules = [
    {
      key: 'maxLevel',
      ok: barracoLevel < MAX_BARRACO_LEVEL,
      reason: `Seu barraco já está no nível máximo (${MAX_BARRACO_LEVEL}).`,
    },
    {
      key: 'upgradeInProgress',
      ok: !activeUpgrade,
      reason: activeReady
        ? 'Já existe uma evolução pronta para finalizar.'
        : `Seu barraco já está em evolução. Tempo restante: ${formatBarracoDuration(activeRemainingMs)}.`,
    },
    {
      key: 'levelProgressionBlocked',
      ok: player?.punishments?.levelProgressionBlocked !== true,
      reason: 'A evolução de nível está bloqueada por uma punição ativa.',
    },
    {
      key: 'cleanMoneyBlocked',
      ok: player?.punishments?.cleanMoneyBlocked !== true,
      reason: 'Seu dinheiro limpo está bloqueado por uma punição ativa.',
    },
    {
      key: 'cleanMoney',
      ok: cleanMoney >= cost,
      reason: `Você precisa de ${cost.toLocaleString('pt-BR')} de dinheiro limpo.`,
    },
    {
      key: 'arsenal',
      ok: arsenalLevel >= sideRequirement,
      reason: `Seu Arsenal precisa estar no nível ${sideRequirement}. Atual: ${arsenalLevel}.`,
    },
    {
      key: 'fuga',
      ok: fugaLevel >= fugaRequirement,
      reason: `Sua Fuga precisa estar no estágio ${fugaRequirement} da garagem. Atual: ${fugaLevel}.`,
    },
    {
      key: 'bribery',
      ok: briberyLevel >= sideRequirement,
      reason: `Seu Suborno precisa estar no nível ${sideRequirement}. Atual: ${briberyLevel}.`,
    },
    {
      key: 'luxury',
      ok: luxuryLevel >= sideRequirement,
      reason: `Seus Artigos de Luxo precisam estar no nível ${sideRequirement}. Atual: ${luxuryLevel}.`,
    },
  ];

  const failedRule = rules.find((rule) => !rule.ok);

  return {
    allowed: !failedRule,
    reason: failedRule?.reason || '',
    failedKey: failedRule?.key || null,
    cost,
    durationMs,
    durationText: formatBarracoDuration(durationMs),
    activeUpgrade,
    activeReady,
    activeRemainingMs,
    sideRequirement,
    systemLevels: {
      arsenal: arsenalLevel,
      fuga: fugaLevel,
      bribery: briberyLevel,
      luxury: luxuryLevel,
    },
    requiredSystemLevels: {
      arsenal: sideRequirement,
      fuga: fugaRequirement,
      bribery: sideRequirement,
      luxury: sideRequirement,
    },
    requirements: {
      arsenal: sideRequirement,
      fuga: fugaRequirement,
      bribery: sideRequirement,
      luxury: sideRequirement,
    },
  };
}

export function getBarracoName(level: number) {
  return getBarracoVisualName(level);
}
