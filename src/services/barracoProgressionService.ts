import type { PlayerState } from '@/store/playerStore';

const BASE_COST = 500;
const MULTIPLIER = 1.115;

export function getBarracoUpgradeCost(level: number) {
  return Math.floor(BASE_COST * Math.pow(MULTIPLIER, Math.max(0, level - 1)));
}

export function getBarracoUpgradeRequirements(player: PlayerState) {
  const barracoLevel = player?.niveis?.barracoLevel ?? 1;
  const cleanMoney = player?.balances?.cleanMoney ?? 0;
  const power = player?.power ?? 0;
  const lavagemLevel = player?.pageLevels?.lavagem ?? 1;
  const luxuryLevel = player?.pageLevels?.luxury ?? 1;
  const hierarchyLevel = player?.niveis?.hierarchyLevel ?? 1;

  const cost = getBarracoUpgradeCost(barracoLevel);

  const rules = [
    {
      key: 'cleanMoney',
      ok: cleanMoney >= cost,
      reason: `Você precisa de ${cost.toLocaleString('pt-BR')} de dinheiro limpo.`,
    },
    {
      key: 'power',
      ok: power >= barracoLevel * 100,
      reason: `Você precisa de poder mínimo ${barracoLevel * 100}.`,
    },
    {
      key: 'lavagem',
      ok: lavagemLevel >= Math.max(1, Math.floor(barracoLevel / 6)),
      reason: `Sua lavagem está abaixo do necessário para o barraco.`,
    },
    {
      key: 'luxury',
      ok: luxuryLevel >= Math.max(1, Math.floor(barracoLevel / 8)),
      reason: `Seu nível de luxo está abaixo do necessário.`,
    },
    {
      key: 'hierarchy',
      ok: hierarchyLevel >= Math.max(1, Math.floor(barracoLevel / 10)),
      reason: `Sua hierarquia está abaixo do necessário.`,
    },
  ];

  const failedRule = rules.find((rule) => !rule.ok);

  return {
    allowed: !failedRule,
    reason: failedRule?.reason || '',
    cost,
  };
}

export function getBarracoName(level: number) {
  if (level >= 90) return 'Mansão com Heliporto';
  if (level >= 80) return 'Mansão Blindada';
  if (level >= 70) return 'Mansão do Complexo';
  if (level >= 60) return 'Triplex com Piscina';
  if (level >= 50) return 'Triplex Alto Padrão';
  if (level >= 40) return 'Sobrado de Luxo';
  if (level >= 30) return 'Sobrado com Piscina';
  if (level >= 20) return 'Sobrado';
  if (level >= 10) return 'Casa de Alvenaria';
  return 'Barraco Inicial';
}
