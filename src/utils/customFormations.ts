/**
 * Utility functions for managing custom gang formations
 * Shared between GangFormationSelector and GangAttackModal
 */

import type { GangFormationType } from '@/types/gang';

export interface CustomFormationConfig {
  id: 'custom_1' | 'custom_2' | 'custom_3';
  title: string;
  description: string;
  rajada: string;
  blindagem: string;
  folego: string;
  quebra: string;
  loot: string;
}

export const DEFAULT_CUSTOM_FORMATIONS: Record<'custom_1' | 'custom_2' | 'custom_3', CustomFormationConfig> = {
  custom_1: {
    id: 'custom_1',
    title: 'Personalizada 1',
    description: 'Configure sua formação personalizada',
    rajada: '+0%',
    blindagem: '+0%',
    folego: '+0%',
    quebra: '+0%',
    loot: '+0%',
  },
  custom_2: {
    id: 'custom_2',
    title: 'Personalizada 2',
    description: 'Configure sua formação personalizada',
    rajada: '+0%',
    blindagem: '+0%',
    folego: '+0%',
    quebra: '+0%',
    loot: '+0%',
  },
  custom_3: {
    id: 'custom_3',
    title: 'Personalizada 3',
    description: 'Configure sua formação personalizada',
    rajada: '+0%',
    blindagem: '+0%',
    folego: '+0%',
    quebra: '+0%',
    loot: '+0%',
  },
};

const STORAGE_KEY = 'customFormations';

/**
 * Get custom formations from localStorage
 */
export function getCustomFormations(): Record<'custom_1' | 'custom_2' | 'custom_3', CustomFormationConfig> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_CUSTOM_FORMATIONS;
  } catch {
    return DEFAULT_CUSTOM_FORMATIONS;
  }
}

/**
 * Save custom formations to localStorage
 */
export function saveCustomFormations(formations: Record<'custom_1' | 'custom_2' | 'custom_3', CustomFormationConfig>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formations));
  } catch (error) {
    console.error('Failed to save custom formations:', error);
  }
}

/**
 * Get a specific custom formation by ID
 */
export function getCustomFormation(id: 'custom_1' | 'custom_2' | 'custom_3'): CustomFormationConfig {
  const formations = getCustomFormations();
  return formations[id] || DEFAULT_CUSTOM_FORMATIONS[id];
}

/**
 * Update a specific custom formation
 */
export function updateCustomFormation(
  id: 'custom_1' | 'custom_2' | 'custom_3',
  updates: Partial<CustomFormationConfig>
): void {
  const formations = getCustomFormations();
  formations[id] = {
    ...formations[id],
    ...updates,
    id, // Ensure ID is not changed
  };
  saveCustomFormations(formations);
}
