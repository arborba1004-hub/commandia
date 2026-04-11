/**
 * Player Persistence Service
 * 
 * Integrates game player data with Wix CMS collections:
 * - playerprofiles: Player name, level, experience, money
 * - playerinventories: Acquired items, unlocked skills, inventory size
 * - playerprogress: Spins, map position, operation statuses
 * 
 * Handles:
 * - Saving player data to CMS
 * - Loading player data from CMS
 * - Periodic synchronization
 * - Login/logout integration
 */

import { BaseCrudService } from '@/integrations';
import type { PlayerProfiles, PlayerInventories, PlayerProgress } from '@/entities';
import type { PlayerState } from '@/store/playerStore';

// Collection IDs from entities
const COLLECTION_IDS = {
  PROFILES: 'playerprofiles',
  INVENTORIES: 'playerinventories',
  PROGRESS: 'playerprogress',
};

// Sync interval in milliseconds
const SYNC_INTERVAL = 30000; // 30 seconds

let syncInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Maps game player state to CMS PlayerProfiles collection
 */
function mapPlayerToProfile(player: PlayerState): PlayerProfiles {
  return {
    _id: player._id || crypto.randomUUID(),
    playerName: player.name || 'Jogador',
    level: player.niveis?.playerLevel || 1,
    experiencePoints: player.niveis?.playerLevel ? (player.niveis.playerLevel - 1) * 1000 : 0,
    dirtyMoney: player.balances?.dirtyMoney || 0,
    cleanMoney: player.balances?.cleanMoney || 0,
    lastLoginDate: new Date().toISOString(),
    creationDate: new Date().toISOString(),
  };
}

/**
 * Maps game player state to CMS PlayerInventories collection
 */
function mapPlayerToInventory(player: PlayerState): PlayerInventories {
  const acquiredItems = player.inventory?.items || [];
  const unlockedSkills = Object.entries(player.skills || {})
    .filter(([_, value]) => value > 0)
    .map(([key]) => key);

  return {
    _id: player._id ? `inv_${player._id}` : crypto.randomUUID(),
    playerId: player._id || '',
    acquiredItems: JSON.stringify(acquiredItems),
    unlockedSkills: JSON.stringify(unlockedSkills),
    lastModified: new Date().toISOString(),
    inventorySize: acquiredItems.length,
    skillSlotsUsed: unlockedSkills.length,
  };
}

/**
 * Maps game player state to CMS PlayerProgress collection
 */
function mapPlayerToProgress(player: PlayerState): PlayerProgress {
  return {
    _id: player._id ? `prog_${player._id}` : crypto.randomUUID(),
    availableSpins: player.niveis?.playerLevel ? Math.floor(player.niveis.playerLevel / 5) : 0,
    mapPosition: JSON.stringify(player.mapPosition || { tileX: 120, tileY: 120 }),
    shackStatus: player.punishments?.active?.some(p => p.type === 'blitz') || false,
    bribeStatus: player.punishments?.active?.some(p => p.type === 'threat') || false,
    moneyLaunderingStatus: player.laundryProgress?.activeOperations?.length > 0 || false,
  };
}

/**
 * Maps CMS PlayerProfiles to game player state
 */
function mapProfileToPlayer(profile: PlayerProfiles): Partial<PlayerState> {
  return {
    _id: profile._id,
    name: profile.playerName,
    niveis: {
      playerLevel: profile.level || 1,
      barracoLevel: 1,
      hierarchyLevel: 1,
      arsenalLevel: 1,
      giroLevel: 1,
      lavagemLevel: 1,
      luxuryLevel: 1,
      briberyLevel: 1,
    },
    balances: {
      dirtyMoney: profile.dirtyMoney || 0,
      cleanMoney: profile.cleanMoney || 0,
      corre: 1000,
    },
  };
}

/**
 * Maps CMS PlayerInventories to game player state
 */
function mapInventoryToPlayer(inventory: PlayerInventories): Partial<PlayerState> {
  try {
    const acquiredItems = inventory.acquiredItems ? JSON.parse(inventory.acquiredItems) : [];
    const unlockedSkills = inventory.unlockedSkills ? JSON.parse(inventory.unlockedSkills) : [];

    const skills: Record<string, number> = {};
    unlockedSkills.forEach((skill: string) => {
      skills[skill] = 1;
    });

    return {
      inventory: {
        items: acquiredItems,
        gifts: [],
        rewards: [],
      },
      skills,
    };
  } catch (error) {
    return {};
  }
}

/**
 * Maps CMS PlayerProgress to game player state
 */
function mapProgressToPlayer(progress: PlayerProgress): Partial<PlayerState> {
  try {
    const mapPosition = progress.mapPosition ? JSON.parse(progress.mapPosition) : { tileX: 120, tileY: 120 };

    return {
      mapPosition,
      niveis: {
        playerLevel: Math.max(1, (progress.availableSpins || 0) * 5),
        barracoLevel: 1,
        hierarchyLevel: 1,
        arsenalLevel: 1,
        giroLevel: 1,
        lavagemLevel: 1,
        luxuryLevel: 1,
        briberyLevel: 1,
      },
    };
  } catch (error) {
    return {};
  }
}

/**
 * Saves player data to CMS collections
 */
export async function savePlayerToCMS(player: PlayerState): Promise<boolean> {
  try {
    if (!player._id) {
      return false;
    }

    // Save to PlayerProfiles
    const profile = mapPlayerToProfile(player);
    await BaseCrudService.update<PlayerProfiles>(COLLECTION_IDS.PROFILES, profile);

    // Save to PlayerInventories
    const inventory = mapPlayerToInventory(player);
    await BaseCrudService.update<PlayerInventories>(COLLECTION_IDS.INVENTORIES, inventory);

    // Save to PlayerProgress
    const progress = mapPlayerToProgress(player);
    await BaseCrudService.update<PlayerProgress>(COLLECTION_IDS.PROGRESS, progress);

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Loads player data from CMS collections
 */
export async function loadPlayerFromCMS(playerId: string): Promise<Partial<PlayerState> | null> {
  try {
    if (!playerId) {
      return null;
    }

    // Load from PlayerProfiles
    const profile = await BaseCrudService.getById<PlayerProfiles>(COLLECTION_IDS.PROFILES, playerId);
    if (!profile) {
      return null;
    }

    // Load from PlayerInventories
    const inventoryId = `inv_${playerId}`;
    const inventory = await BaseCrudService.getById<PlayerInventories>(COLLECTION_IDS.INVENTORIES, inventoryId);

    // Load from PlayerProgress
    const progressId = `prog_${playerId}`;
    const progress = await BaseCrudService.getById<PlayerProgress>(COLLECTION_IDS.PROGRESS, progressId);

    // Merge all data
    const playerData: Partial<PlayerState> = {
      ...mapProfileToPlayer(profile),
      ...mapInventoryToPlayer(inventory || {}),
      ...mapProgressToPlayer(progress || {}),
    };

    return playerData;
  } catch (error) {
    return null;
  }
}

/**
 * Creates a new player in CMS collections
 */
export async function createPlayerInCMS(player: PlayerState): Promise<boolean> {
  try {
    if (!player._id) {
      return false;
    }

    // Create PlayerProfiles entry
    const profile = mapPlayerToProfile(player);
    await BaseCrudService.create<PlayerProfiles>(COLLECTION_IDS.PROFILES, profile);

    // Create PlayerInventories entry
    const inventory = mapPlayerToInventory(player);
    await BaseCrudService.create<PlayerInventories>(COLLECTION_IDS.INVENTORIES, inventory);

    // Create PlayerProgress entry
    const progress = mapPlayerToProgress(player);
    await BaseCrudService.create<PlayerProgress>(COLLECTION_IDS.PROGRESS, progress);

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Starts periodic synchronization of player data
 */
export function startPlayerSync(player: PlayerState, onSync?: (success: boolean) => void): void {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  syncInterval = setInterval(async () => {
    const success = await savePlayerToCMS(player);
    onSync?.(success);
  }, SYNC_INTERVAL);
}

/**
 * Stops periodic synchronization
 */
export function stopPlayerSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

/**
 * Performs an immediate sync of player data
 */
export async function syncPlayerNow(player: PlayerState): Promise<boolean> {
  return savePlayerToCMS(player);
}

/**
 * Deletes player data from CMS collections
 */
export async function deletePlayerFromCMS(playerId: string): Promise<boolean> {
  try {
    if (!playerId) {
      return false;
    }

    // Delete from all collections
    await BaseCrudService.delete(COLLECTION_IDS.PROFILES, playerId);
    await BaseCrudService.delete(COLLECTION_IDS.INVENTORIES, `inv_${playerId}`);
    await BaseCrudService.delete(COLLECTION_IDS.PROGRESS, `prog_${playerId}`);

    return true;
  } catch (error) {
    return false;
  }
}
