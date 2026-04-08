/**
 * usePlayerPersistence Hook
 * 
 * Manages integration between game player store and Wix CMS collections.
 * Handles:
 * - Loading player data on login
 * - Saving player data on logout
 * - Periodic synchronization during gameplay
 * - Creating new player profiles
 */

import { useEffect, useCallback, useRef } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import {
  loadPlayerFromCMS,
  savePlayerToCMS,
  createPlayerInCMS,
  startPlayerSync,
  stopPlayerSync,
  deletePlayerFromCMS,
} from '@/services/playerPersistenceService';

interface UsePlayerPersistenceOptions {
  enabled?: boolean;
  autoSync?: boolean;
  syncInterval?: number;
}

export function usePlayerPersistence(options: UsePlayerPersistenceOptions = {}) {
  const {
    enabled = true,
    autoSync = true,
  } = options;

  const { player, setPlayer, clearPlayer } = usePlayerStore();
  const syncStartedRef = useRef(false);
  const isLoadingRef = useRef(false);

  /**
   * Loads player data from CMS and merges with current state
   */
  const loadPlayerData = useCallback(async (playerId: string) => {
    if (!enabled || isLoadingRef.current) return;

    isLoadingRef.current = true;
    try {
      const cmsData = await loadPlayerFromCMS(playerId);
      if (cmsData) {
        setPlayer(cmsData);
        console.log('Player data loaded and merged from CMS');
      }
    } catch (error) {
      console.error('Error loading player data:', error);
    } finally {
      isLoadingRef.current = false;
    }
  }, [enabled, setPlayer]);

  /**
   * Saves current player data to CMS
   */
  const savePlayerData = useCallback(async () => {
    if (!enabled || !player._id) return false;

    try {
      const success = await savePlayerToCMS(player);
      if (success) {
        console.log('Player data saved to CMS');
      }
      return success;
    } catch (error) {
      console.error('Error saving player data:', error);
      return false;
    }
  }, [enabled, player]);

  /**
   * Creates a new player profile in CMS
   */
  const createNewPlayer = useCallback(async () => {
    if (!enabled || !player._id) return false;

    try {
      const success = await createPlayerInCMS(player);
      if (success) {
        console.log('New player profile created in CMS');
      }
      return success;
    } catch (error) {
      console.error('Error creating new player:', error);
      return false;
    }
  }, [enabled, player]);

  /**
   * Handles player login - loads data from CMS
   */
  const handleLogin = useCallback(async (playerId: string) => {
    if (!enabled) return;

    console.log('Player login detected, loading CMS data...');
    await loadPlayerData(playerId);

    // Start periodic sync
    if (autoSync && !syncStartedRef.current) {
      startPlayerSync(player, (success) => {
        if (!success) {
          console.warn('Failed to sync player data');
        }
      });
      syncStartedRef.current = true;
    }
  }, [enabled, autoSync, player, loadPlayerData]);

  /**
   * Handles player logout - saves data to CMS and clears local state
   */
  const handleLogout = useCallback(async () => {
    if (!enabled) return;

    console.log('Player logout detected, saving CMS data...');

    // Save current state before logout
    if (player._id) {
      await savePlayerData();
    }

    // Stop sync
    if (syncStartedRef.current) {
      stopPlayerSync();
      syncStartedRef.current = false;
    }

    // Clear local player data
    clearPlayer();
  }, [enabled, player._id, savePlayerData, clearPlayer]);

  /**
   * Starts automatic synchronization
   */
  const startSync = useCallback(() => {
    if (!enabled || syncStartedRef.current) return;

    if (player._id) {
      startPlayerSync(player, (success) => {
        if (!success) {
          console.warn('Failed to sync player data');
        }
      });
      syncStartedRef.current = true;
    }
  }, [enabled, player]);

  /**
   * Stops automatic synchronization
   */
  const stopSync = useCallback(() => {
    if (syncStartedRef.current) {
      stopPlayerSync();
      syncStartedRef.current = false;
    }
  }, []);

  /**
   * Performs immediate sync
   */
  const syncNow = useCallback(async () => {
    if (!enabled || !player._id) return false;

    try {
      const success = await savePlayerToCMS(player);
      return success;
    } catch (error) {
      console.error('Error syncing player data:', error);
      return false;
    }
  }, [enabled, player]);

  /**
   * Deletes player data from CMS
   */
  const deletePlayer = useCallback(async (playerId: string) => {
    if (!enabled) return false;

    try {
      const success = await deletePlayerFromCMS(playerId);
      if (success) {
        console.log('Player deleted from CMS');
      }
      return success;
    } catch (error) {
      console.error('Error deleting player:', error);
      return false;
    }
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncStartedRef.current) {
        stopPlayerSync();
      }
    };
  }, []);

  return {
    loadPlayerData,
    savePlayerData,
    createNewPlayer,
    handleLogin,
    handleLogout,
    startSync,
    stopSync,
    syncNow,
    deletePlayer,
    isSyncing: syncStartedRef.current,
  };
}
