/**
 * src/components/gang/TreinamentoGang.ts
 *
 * O arquivo com a lógica de treinamento existe em:
 *   src/components/pages/TreinamentoGang.ts
 *
 * Este arquivo existe para satisfazer os imports de:
 *   - GangTrainingModal.tsx
 *   - GangTrainingPersistence.ts
 * que importam de '@/components/gang/TreinamentoGang'
 */

export {
  QG_SLOT_KEYS,
  GANG_TRAINING_BASE_COST_DIRTY,
  GANG_TRAINING_BASE_DURATION_MINUTES,
  GANG_TRAINING_BASE_QUANTITY_MULTIPLIER,
  GANG_TRAINING_COST_MULTIPLIER,
  createEmptyGangTrainingState,
  hydrateGangTrainingState,
  getBarracoLevelForGangTraining,
  getDirtyMoneyForGangTraining,
  getGangTrainingQuantityPerOperation,
  getGangTrainingDurationMinutes,
  getGangTrainingDurationMs,
  getGangTrainingCostDirty,
  getGangTrainingOperationStatus,
  isGangTrainingSlotBusy,
  getGangTrainingAvailableSlots,
  getGangTrainingActiveOperations,
  getGangTrainingRemainingMs,
  startGangTraining,
  collectGangTraining,
  canStartGangTraining,
} from '@/components/pages/TreinamentoGang';

export type {
  QGSlotKey,
  GangTrainingPlayerLike,
  GangTrainingOperationStatus,
  GangTrainingOperation,
  GangTrainingState,
  StartGangTrainingParams,
  StartGangTrainingResult,
  CollectGangTrainingParams,
  CollectGangTrainingResult,
} from '@/components/pages/TreinamentoGang';
