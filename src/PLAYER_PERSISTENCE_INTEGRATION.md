# Player Persistence Integration Guide

## Overview

This document describes the integration of game player data with Wix CMS collections for persistent storage and synchronization.

## Architecture

### Components

1. **playerPersistenceService.ts** - Core service for CMS operations
   - Maps game player state to/from CMS collections
   - Handles CRUD operations on CMS data
   - Manages periodic synchronization

2. **usePlayerPersistence.ts** - React hook for integration
   - Provides methods for loading/saving player data
   - Handles login/logout integration
   - Manages automatic synchronization lifecycle

3. **PlayerPersistenceProvider.tsx** - Global provider component
   - Wraps the application
   - Manages automatic sync lifecycle
   - Ensures data persistence across sessions

4. **Header.tsx** - Updated with persistence integration
   - Calls `handleLogin()` when player authenticates
   - Calls `handleLogout()` when player logs out
   - Ensures data is saved before logout

## CMS Collections

### PlayerProfiles (playerprofiles)
Stores core player information:
- `_id`: Player ID (unique identifier)
- `playerName`: Player's display name
- `level`: Current player level
- `experiencePoints`: Total experience points
- `dirtyMoney`: Dirty money balance
- `cleanMoney`: Clean money balance
- `lastLoginDate`: Last login timestamp
- `creationDate`: Account creation timestamp

### PlayerInventories (playerinventories)
Stores inventory and skill data:
- `_id`: Inventory ID (format: `inv_{playerId}`)
- `playerId`: Reference to player
- `acquiredItems`: JSON array of inventory items
- `unlockedSkills`: JSON array of unlocked skills
- `lastModified`: Last modification timestamp
- `inventorySize`: Number of items in inventory
- `skillSlotsUsed`: Number of skill slots used

### PlayerProgress (playerprogress)
Stores gameplay progress:
- `_id`: Progress ID (format: `prog_{playerId}`)
- `availableSpins`: Number of available spins
- `mapPosition`: JSON object with map coordinates
- `shackStatus`: Whether shack is active
- `bribeStatus`: Whether bribe is active
- `moneyLaunderingStatus`: Whether money laundering is active

## Usage

### Basic Integration

The persistence system is automatically integrated into the application through the `PlayerPersistenceProvider` wrapper in `Router.tsx`.

### Manual Operations

```typescript
import { usePlayerPersistence } from '@/hooks/usePlayerPersistence';

function MyComponent() {
  const {
    loadPlayerData,
    savePlayerData,
    createNewPlayer,
    handleLogin,
    handleLogout,
    startSync,
    stopSync,
    syncNow,
    deletePlayer,
  } = usePlayerPersistence();

  // Load player data from CMS
  const handleLoadPlayer = async () => {
    await loadPlayerData('player-id');
  };

  // Save current player data
  const handleSavePlayer = async () => {
    const success = await savePlayerData();
  };

  // Create new player profile
  const handleCreatePlayer = async () => {
    const success = await createNewPlayer();
  };

  // Perform immediate sync
  const handleImmediateSync = async () => {
    const success = await syncNow();
  };

  return (
    <div>
      <button onClick={handleLoadPlayer}>Load Player</button>
      <button onClick={handleSavePlayer}>Save Player</button>
      <button onClick={handleCreatePlayer}>Create Player</button>
      <button onClick={handleImmediateSync}>Sync Now</button>
    </div>
  );
}
```

### Login/Logout Integration

The Header component automatically handles login/logout:

```typescript
// On login
const { handleLogin } = usePlayerPersistence();
useEffect(() => {
  if (isAuthenticated && player._id) {
    handleLogin(player._id);
  }
}, [isAuthenticated, player._id]);

// On logout
const handleLogout = async () => {
  await handlePersistenceLogout();
  logout();
};
```

## Data Flow

### Login Flow
1. User authenticates
2. `handleLogin()` is called with player ID
3. Player data is loaded from CMS collections
4. Data is merged with current game state
5. Periodic sync is started (30-second interval)

### Gameplay Flow
1. Player makes changes (gains money, levels up, etc.)
2. Changes are stored in local Zustand store
3. Every 30 seconds, data is synced to CMS
4. CMS collections are updated with latest player state

### Logout Flow
1. User clicks logout
2. `handleLogout()` is called
3. Current player data is saved to CMS
4. Periodic sync is stopped
5. Local player data is cleared
6. User is redirected to home page

## Synchronization

### Automatic Sync
- **Interval**: 30 seconds (configurable)
- **Trigger**: Automatic when player is authenticated
- **Scope**: All player data (profiles, inventories, progress)

### Manual Sync
```typescript
const { syncNow } = usePlayerPersistence();
await syncNow(); // Immediate sync
```

### Sync Lifecycle
- Starts when player logs in
- Continues every 30 seconds during gameplay
- Stops when player logs out
- Can be manually controlled with `startSync()` and `stopSync()`

## Data Mapping

### Game State → CMS
```typescript
// PlayerState → PlayerProfiles
{
  _id: player._id,
  playerName: player.name,
  level: player.niveis.playerLevel,
  experiencePoints: (level - 1) * 1000,
  dirtyMoney: player.balances.dirtyMoney,
  cleanMoney: player.balances.cleanMoney,
  lastLoginDate: new Date().toISOString(),
}

// PlayerState → PlayerInventories
{
  playerId: player._id,
  acquiredItems: JSON.stringify(player.inventory.items),
  unlockedSkills: JSON.stringify(unlockedSkills),
  inventorySize: items.length,
  skillSlotsUsed: skills.length,
}

// PlayerState → PlayerProgress
{
  availableSpins: Math.floor(level / 5),
  mapPosition: JSON.stringify(player.mapPosition),
  shackStatus: player.punishments.active.some(p => p.type === 'blitz'),
  bribeStatus: player.punishments.active.some(p => p.type === 'threat'),
  moneyLaunderingStatus: player.laundryProgress.activeOperations.length > 0,
}
```

### CMS → Game State
```typescript
// PlayerProfiles → PlayerState
{
  _id: profile._id,
  name: profile.playerName,
  niveis: { playerLevel: profile.level, ... },
  balances: {
    dirtyMoney: profile.dirtyMoney,
    cleanMoney: profile.cleanMoney,
    corre: 1000,
  },
}

// PlayerInventories → PlayerState
{
  inventory: {
    items: JSON.parse(inventory.acquiredItems),
    gifts: [],
    rewards: [],
  },
  skills: { /* parsed from unlockedSkills */ },
}

// PlayerProgress → PlayerState
{
  mapPosition: JSON.parse(progress.mapPosition),
  niveis: { playerLevel: progress.availableSpins * 5, ... },
}
```

## Error Handling

The persistence service includes error handling for:
- Missing player IDs
- CMS collection errors
- Invalid data formats
- Network failures

All errors are logged to console and gracefully handled without breaking gameplay.

## Configuration

### Sync Interval
Default: 30 seconds (30000 ms)

To change, modify `SYNC_INTERVAL` in `playerPersistenceService.ts`:
```typescript
const SYNC_INTERVAL = 30000; // milliseconds
```

### Enable/Disable
```typescript
const { /* ... */ } = usePlayerPersistence({
  enabled: true,  // Set to false to disable
  autoSync: true, // Set to false to disable automatic sync
});
```

## Best Practices

1. **Always call `handleLogin()` after authentication**
   - Ensures player data is loaded from CMS
   - Starts automatic synchronization

2. **Always call `handleLogout()` before logout**
   - Ensures player data is saved to CMS
   - Stops automatic synchronization

3. **Use `syncNow()` for critical operations**
   - After major player actions (level up, big purchase, etc.)
   - Ensures data is immediately persisted

4. **Monitor sync errors**
   - Check console for sync errors
   - Implement retry logic if needed

5. **Test data mapping**
   - Verify data is correctly mapped between game state and CMS
   - Check CMS collections for correct data format

## Troubleshooting

### Data not saving
- Check if `handleLogout()` is being called
- Verify CMS collections exist and are accessible
- Check browser console for errors

### Data not loading
- Verify player ID is correct
- Check if CMS collections have data for the player
- Ensure `handleLogin()` is being called

### Sync not working
- Check if automatic sync is enabled
- Verify player is authenticated
- Check network connectivity

### Performance issues
- Increase `SYNC_INTERVAL` to reduce sync frequency
- Disable automatic sync and use manual `syncNow()` instead
- Monitor network requests in browser DevTools

## Future Enhancements

1. **Conflict Resolution**
   - Handle conflicts when server and client data differ
   - Implement version-based conflict resolution

2. **Offline Support**
   - Queue changes when offline
   - Sync when connection is restored

3. **Selective Sync**
   - Only sync changed fields
   - Reduce bandwidth usage

4. **Analytics**
   - Track sync performance
   - Monitor data consistency

5. **Backup/Restore**
   - Automatic backups of player data
   - Restore from backup functionality
