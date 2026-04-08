/**
 * Wix Members Authentication Hook
 * Replaces Google OAuth with Wix Members API
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
 * Hook to manage Wix Members authentication and player data
 * Uses local player store for authentication state
 */
export function useWixAuth() {
  const { player, isLoaded } = usePlayerStore();
  const [error, setError] = useState<string | null>(null);

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
