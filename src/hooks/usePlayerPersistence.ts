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
  const { enabled = true, autoSync = true } = options;

  const player = usePlayerStore((state) => state.player);
  const hydratePlayerFromServer = usePlayerStore((state) => state.hydratePlayerFromServer);
  const clearPlayer = usePlayerStore((state) => state.clearPlayer);

  const syncStartedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const loadPlayerData = useCallback(
    async (playerId: string) => {
      if (!enabled || isLoadingRef.current) return;

      isLoadingRef.current = true;

      try {
        const cmsData = await loadPlayerFromCMS(playerId);
        if (cmsData) {
          hydratePlayerFromServer(cmsData);
          console.log('Player data loaded and merged from CMS');
        }
      } catch (error) {
        console.error('Error loading player data:', error);
      } finally {
        isLoadingRef.current = false;
      }
    },
    [enabled, hydratePlayerFromServer]
  );

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

  const handleLogin = useCallback(
    async (playerId: string) => {
      if (!enabled) return;

      console.log('Player login detected, loading CMS data...');
      await loadPlayerData(playerId);

      if (autoSync && !syncStartedRef.current) {
        startPlayerSync(usePlayerStore.getState().player, (success) => {
          if (!success) {
            console.warn('Failed to sync player data');
          }
        });
        syncStartedRef.current = true;
      }
    },
    [enabled, autoSync, loadPlayerData]
  );

  const handleLogout = useCallback(async () => {
    if (!enabled) return;

    console.log('Player logout detected, saving CMS data...');

    if (player._id) {
      await savePlayerData();
    }

    if (syncStartedRef.current) {
      stopPlayerSync();
      syncStartedRef.current = false;
    }

    clearPlayer();
  }, [enabled, player._id, savePlayerData, clearPlayer]);

  const startSync = useCallback(() => {
    if (!enabled || syncStartedRef.current) return;

    if (usePlayerStore.getState().player._id) {
      startPlayerSync(usePlayerStore.getState().player, (success) => {
        if (!success) {
          console.warn('Failed to sync player data');
        }
      });
      syncStartedRef.current = true;
    }
  }, [enabled]);

  const stopSync = useCallback(() => {
    if (syncStartedRef.current) {
      stopPlayerSync();
      syncStartedRef.current = false;
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!enabled || !player._id) return false;

    try {
      return await savePlayerToCMS(player);
    } catch (error) {
      console.error('Error syncing player data:', error);
      return false;
    }
  }, [enabled, player]);

  const deletePlayer = useCallback(
    async (playerId: string) => {
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
    },
    [enabled]
  );

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