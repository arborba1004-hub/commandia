/**
 * usePowerSync.ts
 *
 * Hook que mantém player.power sincronizado com todas as 8 fontes de stats.
 * Deve ser chamado uma vez no topo da árvore de componentes (ex: em GamePage ou Layout).
 *
 * Recalcula power automaticamente quando mudam:
 *  - Skills do jogador
 *  - Armas no inventário
 *  - Acessórios comprados
 *  - Gangue (membros + formação)
 *  - Facção (buffs de investimento)
 */
import { useEffect, useRef } from 'react';
import { usePlayerStore }    from '@/store/playerStore';
import { useGangStore }      from '@/store/gangStore';
import { useFactionStore }   from '@/store/factionStore';
import {
  calculatePlayerPower,
  buildPowerBreakdown,
  type FactionBuffs,
} from '@/services/powerSystem';
import { buildGangBattleStatsWithFormation } from '@/services/gangWarCalculationService';

/**
 * Retorna o breakdown completo de poder do jogador atual,
 * levando em conta skills, armas, acessórios, gangue e facção.
 */
export function usePowerBreakdown() {
  const player  = usePlayerStore((s) => s.player);
  const gang    = useGangStore((s) => s.gang);
  const faction = useFactionStore((s) => s.faction);

  const gangStats = gang
    ? buildGangBattleStatsWithFormation(gang.members, gang.formation || 'pressao_total')
    : null;

  const factionBuffs: FactionBuffs | null = faction?.investmentBuffs
    ? {
        attackPercent:       faction.investmentBuffs.attackPercent       ?? 0,
        defensePercent:      faction.investmentBuffs.defensePercent      ?? 0,
        baseDefensePercent:  faction.investmentBuffs.baseDefensePercent  ?? 0,
        hpPercent:           faction.investmentBuffs.hpPercent           ?? 0,
        agilityPercent:      faction.investmentBuffs.agilityPercent      ?? 0,
        intelligencePercent: faction.investmentBuffs.intelligencePercent ?? 0,
        respectPercent:      faction.investmentBuffs.respectPercent      ?? 0,
      }
    : null;

  return buildPowerBreakdown(player, gangStats, factionBuffs);
}

/**
 * Sincroniza player.power no store local quando as fontes mudam.
 * NÃO faz chamada ao backend — o backend recalcula na próxima sync.
 */
export function usePowerSync() {
  const player       = usePlayerStore((s) => s.player);
  const setPower     = usePlayerStore((s) => s.setPower);
  const scheduleSync = usePlayerStore((s) => s.scheduleSync);
  const gang         = useGangStore((s) => s.gang);

  // Deps que afetam o poder — usamos JSON stringify para detectar mudanças profundas
  const skillsKey      = JSON.stringify(player.skills);
  const inventoryKey   = JSON.stringify(player.inventory?.items?.filter((i: any) => i.category === 'weapon'));
  const accessoriesKey = JSON.stringify(player.purchasedAccessories);
  const gangKey        = gang ? `${gang.members.length}_${gang.formation}_${gang.members.map(m => m.level).join(',')}` : 'no-gang';

  const prevPowerRef = useRef(player.power);

  useEffect(() => {
    const newPower = calculatePlayerPower(player);
    if (newPower !== prevPowerRef.current) {
      prevPowerRef.current = newPower;
      setPower(newPower);
      scheduleSync();
    }
  }, [skillsKey, inventoryKey, accessoriesKey, gangKey]);
}
