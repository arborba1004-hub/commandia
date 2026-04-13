/**
 * ⚠️ LEGACY/INACTIVE - Wix Members Authentication Hook
 * 
 * PHASE 8: This hook is NO LONGER USED in the application.
 * 
 * Status: DEPRECATED - DO NOT USE
 * Reason: Application now uses Google Auth only via useGoogleAuth()
 * 
 * This file is preserved for reference only.
 * All authentication is now handled by:
 * - /src/hooks/useGoogleAuth.ts (primary auth hook)
 * - /src/store/playerStore.ts (player state management)
 * - /src/components/ui/sign-in.tsx (sign-in UI)
 * 
 * DO NOT IMPORT this hook in new code.
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
 * @deprecated Use useGoogleAuth() from @/hooks/useGoogleAuth instead
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
  const authToken = isAuthenticated ? 'google-auth-token' : null;

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
