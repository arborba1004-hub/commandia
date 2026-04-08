/**
 * Wix Members Authentication Hook
 * Replaces Google OAuth with Wix Members API
 */

import { useMember } from '@/integrations';
import { useEffect, useState } from 'react';
import { fetchCompletePlayerData, initializeNewPlayer } from '@/api/cmsPlayerApi';
import type { PlayerProfiles, PlayerInventories, PlayerProgress } from '@/entities';

export interface WixAuthState {
  member: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  playerProfile: PlayerProfiles | null;
  playerInventory: PlayerInventories | null;
  playerProgress: PlayerProgress | null;
  error: string | null;
}

/**
 * Hook to manage Wix Members authentication and player data
 */
export function useWixAuth() {
  const { member, isAuthenticated, isLoading, actions } = useMember();
  const [playerData, setPlayerData] = useState<{
    profile: PlayerProfiles | null;
    inventory: PlayerInventories | null;
    progress: PlayerProgress | null;
  }>({
    profile: null,
    inventory: null,
    progress: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoadingPlayerData, setIsLoadingPlayerData] = useState(false);

  /**
   * Load or create player data when member logs in
   */
  useEffect(() => {
    if (!isAuthenticated || !member?._id) {
      setPlayerData({ profile: null, inventory: null, progress: null });
      return;
    }

    const loadPlayerData = async () => {
      try {
        setIsLoadingPlayerData(true);
        setError(null);

        // Try to fetch existing player data
        const data = await fetchCompletePlayerData(member._id);

        if (data?.profile) {
          // Player exists, load their data
          setPlayerData(data);
        } else {
          // New player, initialize them
          const playerName = member.profile?.nickname || member.contact?.firstName || 'Player';
          const initialized = await initializeNewPlayer(playerName);

          if (initialized) {
            setPlayerData({
              profile: initialized.profile,
              inventory: initialized.inventory,
              progress: initialized.progress,
            });
          } else {
            setError('Failed to initialize player data');
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load player data';
        setError(message);
        console.error('Error loading player data:', err);
      } finally {
        setIsLoadingPlayerData(false);
      }
    };

    loadPlayerData();
  }, [isAuthenticated, member?._id]);

  return {
    member,
    isAuthenticated,
    isLoading: isLoading || isLoadingPlayerData,
    playerProfile: playerData.profile,
    playerInventory: playerData.inventory,
    playerProgress: playerData.progress,
    error,
    actions,
  };
}
