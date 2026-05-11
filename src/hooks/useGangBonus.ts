import { useGangStore } from '@/store/gangStore';
import { usePlayerStore } from '@/store/playerStore';

export function useGangBonus() {
  const { myGang, isLoading } = useGangStore();
  const player = usePlayerStore((state) => state.player);

  // Helper: encontra membros ativos por classe
  const getActiveMembersByClass = (className: string) => {
    if (!myGang) return [];
    const activeIds = myGang.activeMemberIds;
    return myGang.members.filter(m => activeIds.includes(m.id) && m.class === className);
  };

  // Bônus para lavagem de dinheiro (Lavador)
  const getLaundryTaxReduction = (): number => {
    const lavadores = getActiveMembersByClass('Lavador');
    if (!lavadores.length) return 0;
    // Soma dos níveis * 0.5% (máx 50%)
    let total = lavadores.reduce((sum, m) => sum + m.level * 0.5, 0);
    return Math.min(total, 50);
  };

  // Bônus para Giro (Ladrão)
  const getGiroBonus = (): { percent: number; noCostChance: number } => {
    const ladao = getActiveMembersByClass('Ladrão')[0];
    if (!ladao) return { percent: 0, noCostChance: 0 };
    const percent = ladao.level * 3; // 3% por nível (máx 300%? Mas vai ser limitado)
    const noCostChance = ladao.level * 0.5; // 0.5% por nível, máx 50%
    return { percent: Math.min(percent, 300), noCostChance: Math.min(noCostChance, 50) };
  };

  // Bônus para Arsenal (Armeiro)
  const getArsenalCostReduction = (): number => {
    const armeiros = getActiveMembersByClass('Armeiro');
    if (!armeiros.length) return 0;
    return Math.min(armeiros.reduce((sum, m) => sum + m.level * 3, 0), 50); // máx 50%
  };

  // Bônus para Veículos de Fuga (Motorista)
  const getBlitzEscapeBonus = (): number => {
    const motoristas = getActiveMembersByClass('Motorista');
    if (!motoristas.length) return 0;
    return Math.min(motoristas.reduce((sum, m) => sum + m.level * 4, 0), 80); // máx 80%
  };

  // Bônus para redução de tempo de punição (Informante)
  const getPunishmentTimeReduction = (): number => {
    const informantes = getActiveMembersByClass('Informante');
    if (!informantes.length) return 0;
    return Math.min(informantes.reduce((sum, m) => sum + m.level * 6, 0), 90); // máx 90%
  };

  // Bônus de combate (futuro)
  const getCombatAttackBonus = (): number => {
    const executores = getActiveMembersByClass('Executor');
    if (!executores.length) return 0;
    return executores.reduce((sum, m) => sum + m.level * 4, 0);
  };

  const getCombatDefenseBonus = (): number => {
    const capangas = getActiveMembersByClass('Capanga');
    if (!capangas.length) return 0;
    return capangas.reduce((sum, m) => sum + m.level * 5, 0);
  };

  return {
    isLoading,
    getLaundryTaxReduction,
    getGiroBonus,
    getArsenalCostReduction,
    getBlitzEscapeBonus,
    getPunishmentTimeReduction,
    getCombatAttackBonus,
    getCombatDefenseBonus,
  };
}