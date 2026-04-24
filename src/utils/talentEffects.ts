import { useTalentStore } from '@/store/talentStore';

// Talent IDs for easy reference
export const TALENT_IDS = {
  CRIA_ESPERTO: 'talent-1',
  FUGA_NA_MAO: 'talent-5',
  OLHO_VIVO: 'talent-10',
  CARREGADOR_RAPIDO: 'talent-15',
  PILOTO_DE_FUGA: 'talent-20',
  QUEBRA_DE_BRACO: 'talent-25',
  PELE_DE_ACO: 'talent-30',
  MAO_DE_VACA: 'talent-35',
  LAVAGEM_RAPIDA: 'talent-40',
  IMPOSTO_DA_QUEBRADA: 'talent-45',
  NETWORKING_SUJO: 'talent-50',
  MERCADO_NEGRO: 'talent-55',
  LIDERANCA_TOXICA: 'talent-60',
  CONTABILIDADE_CRIATIVA: 'talent-65',
  INTOCAVEL: 'talent-70',
  ESTRATEGIA_DE_GUERRA: 'talent-75',
  VOZ_DA_RAZAO: 'talent-80',
  MARCA_DO_REI: 'talent-85',
  SOMBRA_DO_REI: 'talent-90',
  HERDEIRO_DO_TRONO: 'talent-95',
  COROA_SUPREMA: 'talent-100',
};

// Get effect value based on talent level (1-5)
export function getEffectValue(minValue: number, maxValue: number, talentLevel: number): number {
  if (talentLevel === 0) return 0;
  const increment = (maxValue - minValue) / 4;
  return minValue + increment * (talentLevel - 1);
}

// Slot Machine Effects
export function getSlotBonusMultiplier(): number {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.CRIA_ESPERTO);
  if (level === 0) return 1;
  return 1 + getEffectValue(0.05, 0.25, level);
}

export function getSlotGainsMultiplier(): number {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.COROA_SUPREMA);
  if (level === 0) return 1;
  return 2; // Dobra os ganhos
}

// Prison Effects
export function getPrisonTimeReduction(): number {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.FUGA_NA_MAO);
  if (level === 0) return 0;
  return getEffectValue(0.1, 0.5, level);
}

export function getPrisonMoneyLossReduction(): number {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.QUEBRA_DE_BRACO);
  if (level === 0) return 0;
  return Math.min(getEffectValue(0.2, 1.0, level), 1.0);
}

export function getArrestChanceReduction(): number {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.PELE_DE_ACO);
  if (level === 0) return 0;
  return getEffectValue(0.1, 0.5, level);
}

export function shouldIgnoreFirstPrison(): boolean {
  const store = useTalentStore();
  return store.isTalentUnlocked(TALENT_IDS.INTOCAVEL);
}

export function getMoneyLossConversionToClean(): number {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.CONTABILIDADE_CRIATIVA);
  if (level === 0) return 0;
  return getEffectValue(0.05, 0.25, level);
}

export function getHerederoRevivePercentage(): number {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.HERDEIRO_DO_TRONO);
  if (level === 0) return 0;
  return Math.min(getEffectValue(0.5, 1.0, level), 1.0);
}

// Money Laundering Effects
export function getLaundryTimeReduction(): number {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.LAVAGEM_RAPIDA);
  if (level === 0) return 0;
  return Math.min(getEffectValue(0.2, 1.0, level), 1.0);
}

export function getLaundryCleanMoneyBonus(): number {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.IMPOSTO_DA_QUEBRADA);
  if (level === 0) return 0;
  return getEffectValue(0.05, 0.25, level);
}

// Bribe Effects
export function getBribeCostReduction(): number {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.MAO_DE_VACA);
  if (level === 0) return 0;
  return getEffectValue(0.15, 0.75, level);
}

// Escape Effects
export function getEscapeSpeedBonus(): number {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.PILOTO_DE_FUGA);
  if (level === 0) return 0;
  return getEffectValue(0.15, 0.75, level);
}

// Transport Mission Effects
export function getTransportMoneyBonus(): number {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.CARREGADOR_RAPIDO);
  if (level === 0) return 0;
  return getEffectValue(0.1, 0.5, level);
}

// Faction Effects
export function getExtraParallelSlots(): number {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.NETWORKING_SUJO);
  if (level === 0) return 0;
  return Math.floor(getEffectValue(1, 5, level));
}

export function getWeaponVehicleCostReduction(): number {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.MERCADO_NEGRO);
  if (level === 0) return 0;
  return getEffectValue(0.1, 0.5, level);
}

export function getFactionMemberXPBonus(): number {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.LIDERANCA_TOXICA);
  if (level === 0) return 0;
  return getEffectValue(0.05, 0.25, level);
}

export function getMemberRescueTimeReduction(): number {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.VOZ_DA_RAZAO);
  if (level === 0) return 0;
  return getEffectValue(0.3, 0.9, level);
}

// Special Abilities (with cooldowns)
export function canUseEyeAbility(): boolean {
  const store = useTalentStore();
  return store.isTalentUnlocked(TALENT_IDS.OLHO_VIVO);
}

export function canUseWarStrategy(): boolean {
  const store = useTalentStore();
  return store.isTalentUnlocked(TALENT_IDS.ESTRATEGIA_DE_GUERRA);
}

export function canUseShadowAbility(): boolean {
  const store = useTalentStore();
  return store.isTalentUnlocked(TALENT_IDS.SOMBRA_DO_REI);
}

export function getWarStrategyStealPercentage(): number {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.ESTRATEGIA_DE_GUERRA);
  if (level === 0) return 0;
  return getEffectValue(0.1, 0.3, level);
}

export function getShadowLaundryLockDuration(): { min: number; max: number } {
  const store = useTalentStore();
  const level = store.getTalentLevel(TALENT_IDS.SOMBRA_DO_REI);
  if (level === 0) return { min: 0, max: 0 };
  const minHours = getEffectValue(2, 6, level);
  return { min: minHours, max: minHours };
}

// Cosmetic Effects
export function hasGoldenName(): boolean {
  const store = useTalentStore();
  return store.isTalentUnlocked(TALENT_IDS.MARCA_DO_REI);
}

// Check if all talents are active (Coroa Suprema effect)
export function areAllTalentsActive(): boolean {
  const store = useTalentStore();
  return store.isTalentUnlocked(TALENT_IDS.COROA_SUPREMA);
}
