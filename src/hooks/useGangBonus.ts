/**
 * useGangBonus.ts — DEPRECATED
 *
 * Esse hook era do modelo antigo (membros com `m.class: string`, `myGang.activeMemberIds`
 * e tipos `Lavador / Ladrão / Armeiro / Informante`). Esse modelo não existe mais.
 *
 * No novo modelo (8 tipos canônicos + sistema de Estatísticas), os bônus que esse hook
 * tentava calcular passam a vir do gangEstatisticasStore — alimentado pelas fontes
 * 'arsenal', 'investimento', 'faccao', 'evento', etc. Quando esses sistemas estiverem
 * plugados, a `LavagemDeDinheiroPage` (e qualquer outra página que precisa de redução
 * de taxa, redução de custo, bônus de fuga, etc.) deve ler diretamente do
 * gangEstatisticasStore ou expor um helper específico — não passar pelo "tipo de
 * membro ativo".
 *
 * Para não quebrar a `LavagemDeDinheiroPage` antes da migração, esse hook fica como
 * NO-OP — retorna 0 em todos os bônus. Quando a `LavagemDeDinheiroPage` for migrada
 * para ler do gangEstatisticasStore, este arquivo pode ser deletado.
 */

export function useGangBonus() {
  return {
    isLoading: false,

    // Nenhum bônus por enquanto — sistema de Estatísticas substitui tudo isso.
    getLaundryTaxReduction:    () => 0,
    getGiroBonus:              () => ({ percent: 0, noCostChance: 0 }),
    getArsenalCostReduction:   () => 0,
    getBlitzEscapeBonus:       () => 0,
    getPunishmentTimeReduction:() => 0,
    getCombatAttackBonus:      () => 0,
    getCombatDefenseBonus:     () => 0,
  };
}
