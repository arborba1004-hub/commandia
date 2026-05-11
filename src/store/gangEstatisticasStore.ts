/**
 * gangEstatisticasStore.ts
 *
 * A implementação completa deste store está em mapAttackStore.ts
 * (o arquivo foi criado com o nome incorreto durante o desenvolvimento).
 *
 * Este arquivo existe para satisfazer os imports de gangStore.ts:
 *   import { useGangEstatisticasStore, getFormacaoBonusPayload } from '@/store/gangEstatisticasStore'
 */

export {
  useGangEstatisticasStore,
  getFormacaoBonusPayload,
  getMultiplierSync,
  aplicarEstatistica,
  getSnapshotGangSync,
} from '@/store/mapAttackStore';

export type {
  EstatisticaStat,
  StatBonusPercent,
  StatMultipliers,
  EstatisticaBonus,
  EstatisticaSource,
  EstatisticasMembroSnapshot,
  EstatisticasGangSnapshot,
} from '@/store/mapAttackStore';
