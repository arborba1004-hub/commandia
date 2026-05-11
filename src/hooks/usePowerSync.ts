/**
 * usePowerSync.ts
 *
 * MUDANÇAS:
 *   - Remove scheduleSync() — com a nova arquitetura, o servidor recalcula
 *     power em cada playerUpdate e envia via socket. Não precisa de sync local.
 *   - setPower() continua para atualização UI otimista local
 *   - usePowerBreakdown() inalterado
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
 * Atualiza player.power no store local quando as fontes mudam.
 * O servidor também recalcula e envia via socket — isso é apenas para UI otimista.
 */
export function usePowerSync() {
  const player   = usePlayerStore((s) => s.player);
  const setPower = usePlayerStore((s) => s.setPower);
  const gang     = useGangStore((s) => s.gang);

  const skillsKey      = JSON.stringify(player.skills);
  const inventoryKey   = JSON.stringify(player.inventory?.items?.filter((i: any) => i.category === 'weapon'));
  const accessoriesKey = JSON.stringify(player.purchasedAccessories);
  const gangKey        = gang ? `${gang.members.length}_${gang.formation}_${gang.members.map((m) => m.level).join(',')}` : 'no-gang';

  const prevPowerRef = useRef(player.power);

  useEffect(() => {
    const newPower = calculatePlayerPower(player);
    if (newPower !== prevPowerRef.current) {
      prevPowerRef.current = newPower;
      setPower(newPower);
      // NÃO chama scheduleSync() — o servidor envia power correto via socket
    }
  }, [skillsKey, inventoryKey, accessoriesKey, gangKey]);
}
