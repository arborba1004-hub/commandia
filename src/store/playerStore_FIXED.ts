// This file contains the fix for the hydratePlayerFromServer function
// The issue: After login, the player _id is not being properly set, causing ProtectedRoute to fail
// The fix: Ensure _id is always set from incoming data in hydratePlayerFromServer

// REPLACE the hydratePlayerFromServer function in playerStore.ts with this:

hydratePlayerFromServer: (playerData) => {
  const merged = persistMergedPlayer(playerData);
  
  // CRITICAL FIX: Ensure _id is always set from incoming data
  const normalizedPlayer = {
    ...merged,
    _id: String(
      (playerData as any)?._id ||
      (playerData as any)?.id ||
      (playerData as any)?.googleId ||
      merged._id ||
      ''
    ),
  };

  set({
    player: normalizedPlayer,
    isLoaded: true,
    syncError: null,
    lastSyncAt: Date.now(),
    lastServerHydrationAt: Date.now(),
    pollingAttempts: 0,
    pendingLocalChanges: false,
  });

  // Sync faction store synchronously without blocking
  try {
    syncFactionStoreFromEnvelope((playerData as any)?.faction ?? null, {
      allowClear: (playerData as any)?.factionId == null,
    });
  } catch (error) {
    console.warn('Erro ao sincronizar factionStore:', error);
    // Don't throw - allow the app to continue
  }
}
