/**
 * LEGACY/EXPERIMENTAL: Wix Members Authentication Hook
 * 
 * ⚠️ DEPRECATED - This hook is no longer used in the main application flow.
 * It was replaced by the Wix Members SDK integration (@/integrations/members).
 * 
 * Kept for reference and potential future use.
 * See: @/integrations/members for current authentication implementation.
 */

import { useEffect, useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';

export interface WixAuthState {
  member: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  playerData: any;
  authToken: string | null;
  error: string | null;
}

/**
 * LEGACY: Hook to manage Wix Members authentication and player data
 * Uses local player store for authentication state
 * 
 * @deprecated Use useMember() from @/integrations instead
 */
export function useWixAuth() {
  const { player, isLoaded } = usePlayerStore();
  const [error, setError] = useState<string | null>(null);

  // Initialize player on mount
  useEffect(() => {
    if (!isLoaded) {
      usePlayerStore.getState().loadPlayer();
    }
  }, [isLoaded]);

  // Determine authentication status from player store
  const isAuthenticated = !!player?._id && isLoaded;
  const authToken = isAuthenticated ? 'wix-auth-token' : null;

  return {
    member: player,
    isAuthenticated,
    isLoading: !isLoaded,
    playerData: {
      name: player?.name,
      avatar: player?.avatar,
    },
    authToken,
    error,
    logout: () => {
      // Logout is handled by Header component
    },
    actions: {
      logout: () => {
        // Logout is handled by Header component
      },
    },
  };
}
