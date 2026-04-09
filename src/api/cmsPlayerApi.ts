/**
 * CMS-based Player API
 * Replaces external Render backend with Wix CMS collections
 * Uses BaseCrudService for all data operations
 */

import { BaseCrudService } from '@/integrations';
import type { PlayerProfiles, PlayerInventories, PlayerProgress } from '@/entities';
import { generateUUID } from '@/lib/uuid';

// Collection IDs
const COLLECTION_PLAYER_PROFILES = 'playerprofiles';
const COLLECTION_PLAYER_INVENTORIES = 'playerinventories';
const COLLECTION_PLAYER_PROGRESS = 'playerprogress';

/**
 * Create a new player profile in CMS
 */
export async function createPlayerProfile(playerData: {
  playerName: string;
  level?: number;
  experiencePoints?: number;
  dirtyMoney?: number;
  cleanMoney?: number;
}): Promise<PlayerProfiles> {
  const profile: PlayerProfiles = {
    _id: generateUUID(),
    playerName: playerData.playerName,
    level: playerData.level ?? 1,
    experiencePoints: playerData.experiencePoints ?? 0,
    dirtyMoney: playerData.dirtyMoney ?? 0,
    cleanMoney: playerData.cleanMoney ?? 0,
    creationDate: new Date().toISOString(),
    lastLoginDate: new Date().toISOString(),
  };

  await BaseCrudService.create(COLLECTION_PLAYER_PROFILES, profile);
  return profile;
}

/**
 * Fetch player profile by ID
 */
export async function fetchPlayerProfile(playerId: string): Promise<PlayerProfiles | null> {
  try {
    const profile = await BaseCrudService.getById<PlayerProfiles>(
      COLLECTION_PLAYER_PROFILES,
      playerId
    );
    return profile || null;
  } catch (error) {
    console.error('Error fetching player profile:', error);
    return null;
  }
}

/**
 * Update player profile
 */
export async function updatePlayerProfile(
  playerId: string,
  updates: Partial<PlayerProfiles>
): Promise<PlayerProfiles | null> {
  try {
    await BaseCrudService.update(COLLECTION_PLAYER_PROFILES, {
      _id: playerId,
      ...updates,
      _updatedDate: new Date(),
    });

    return fetchPlayerProfile(playerId);
  } catch (error) {
    console.error('Error updating player profile:', error);
    return null;
  }
}

/**
 * Create player inventory
 */
export async function createPlayerInventory(playerId: string): Promise<PlayerInventories> {
  const inventory: PlayerInventories = {
    _id: generateUUID(),
    playerId,
    acquiredItems: JSON.stringify([]),
    unlockedSkills: JSON.stringify([]),
    inventorySize: 50,
    skillSlotsUsed: 0,
    lastModified: new Date().toISOString(),
  };

  await BaseCrudService.create(COLLECTION_PLAYER_INVENTORIES, inventory);
  return inventory;
}

/**
 * Fetch player inventory
 */
export async function fetchPlayerInventory(playerId: string): Promise<PlayerInventories | null> {
  try {
    const result = await BaseCrudService.getAll<PlayerInventories>(
      COLLECTION_PLAYER_INVENTORIES,
      {},
      { limit: 1 }
    );

    const inventory = result.items.find((inv) => inv.playerId === playerId);
    return inventory || null;
  } catch (error) {
    console.error('Error fetching player inventory:', error);
    return null;
  }
}

/**
 * Update player inventory
 */
export async function updatePlayerInventory(
  inventoryId: string,
  updates: Partial<PlayerInventories>
): Promise<PlayerInventories | null> {
  try {
    await BaseCrudService.update(COLLECTION_PLAYER_INVENTORIES, {
      _id: inventoryId,
      ...updates,
      lastModified: new Date().toISOString(),
    });

    return BaseCrudService.getById<PlayerInventories>(
      COLLECTION_PLAYER_INVENTORIES,
      inventoryId
    );
  } catch (error) {
    console.error('Error updating player inventory:', error);
    return null;
  }
}

/**
 * Create player progress
 */
export async function createPlayerProgress(playerId: string): Promise<PlayerProgress> {
  const progress: PlayerProgress = {
    _id: generateUUID(),
    availableSpins: 5,
    mapPosition: JSON.stringify({ tileX: 0, tileY: 0 }),
    shackStatus: false,
    bribeStatus: false,
    moneyLaunderingStatus: false,
  };

  await BaseCrudService.create(COLLECTION_PLAYER_PROGRESS, progress);
  return progress;
}

/**
 * Fetch player progress
 */
export async function fetchPlayerProgress(playerId: string): Promise<PlayerProgress | null> {
  try {
    const result = await BaseCrudService.getAll<PlayerProgress>(
      COLLECTION_PLAYER_PROGRESS,
      {},
      { limit: 1 }
    );

    return result.items[0] || null;
  } catch (error) {
    console.error('Error fetching player progress:', error);
    return null;
  }
}

/**
 * Update player progress
 */
export async function updatePlayerProgress(
  progressId: string,
  updates: Partial<PlayerProgress>
): Promise<PlayerProgress | null> {
  try {
    await BaseCrudService.update(COLLECTION_PLAYER_PROGRESS, {
      _id: progressId,
      ...updates,
    });

    return BaseCrudService.getById<PlayerProgress>(COLLECTION_PLAYER_PROGRESS, progressId);
  } catch (error) {
    console.error('Error updating player progress:', error);
    return null;
  }
}

/**
 * Initialize new player (create all related records)
 */
export async function initializeNewPlayer(playerName: string): Promise<{
  profile: PlayerProfiles;
  inventory: PlayerInventories;
  progress: PlayerProgress;
} | null> {
  try {
    // Create profile
    const profile = await createPlayerProfile({ playerName });

    // Create inventory
    const inventory = await createPlayerInventory(profile._id!);

    // Create progress
    const progress = await createPlayerProgress(profile._id!);

    return { profile, inventory, progress };
  } catch (error) {
    console.error('Error initializing new player:', error);
    return null;
  }
}

/**
 * Fetch complete player data (profile + inventory + progress)
 */
export async function fetchCompletePlayerData(playerId: string): Promise<{
  profile: PlayerProfiles | null;
  inventory: PlayerInventories | null;
  progress: PlayerProgress | null;
} | null> {
  try {
    const [profile, inventory, progress] = await Promise.all([
      fetchPlayerProfile(playerId),
      fetchPlayerInventory(playerId),
      fetchPlayerProgress(playerId),
    ]);

    return { profile, inventory, progress };
  } catch (error) {
    console.error('Error fetching complete player data:', error);
    return null;
  }
}

/**
 * Sync player data to CMS (called periodically)
 */
export async function syncPlayerToCMS(playerId: string, playerData: any): Promise<boolean> {
  try {
    // Update profile
    if (playerData.profile) {
      await updatePlayerProfile(playerId, playerData.profile);
    }

    // Update inventory
    if (playerData.inventory) {
      const inventory = await fetchPlayerInventory(playerId);
      if (inventory) {
        await updatePlayerInventory(inventory._id!, playerData.inventory);
      }
    }

    // Update progress
    if (playerData.progress) {
      const progress = await fetchPlayerProgress(playerId);
      if (progress) {
        await updatePlayerProgress(progress._id!, playerData.progress);
      }
    }

    return true;
  } catch (error) {
    console.error('Error syncing player to CMS:', error);
    return false;
  }
}
