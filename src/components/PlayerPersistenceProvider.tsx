/**
 * PlayerPersistenceProvider Component
 * 
 * Wraps the application to provide global player persistence integration.
 * Handles:
 * - Automatic player data synchronization
 * - Login/logout integration
 * - Periodic CMS updates
 */

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { usePlayerPersistence } from '@/hooks/usePlayerPersistence';

interface PlayerPersistenceProviderProps {
  children: React.ReactNode;
}

export default function PlayerPersistenceProvider({
  children,
}: PlayerPersistenceProviderProps) {
  const { player, isLoaded, loadPlayer } = usePlayerStore();
  const { startSync, stopSync } = usePlayerPersistence({
    enabled: true,
    autoSync: true,
  });
  const syncStartedRef = useRef(false);

  // Load player on mount
  useEffect(() => {
    if (!isLoaded) {
      loadPlayer();
    }
  }, [isLoaded, loadPlayer]);

  // Start sync when player is loaded and authenticated
  useEffect(() => {
    if (!isLoaded || !player._id) {
      if (syncStartedRef.current) {
        stopSync();
        syncStartedRef.current = false;
      }
      return;
    }

    if (!syncStartedRef.current) {
      startSync();
      syncStartedRef.current = true;
    }
  }, [isLoaded, player._id, startSync, stopSync]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncStartedRef.current) {
        stopSync();
      }
    };
  }, [stopSync]);

  return <>{children}</>;
}
