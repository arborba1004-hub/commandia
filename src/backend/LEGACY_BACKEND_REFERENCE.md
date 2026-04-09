# Legacy Wix/Velo Backend Reference

**Status:** ISOLATED - NOT IN ACTIVE USE  
**Phase:** PHASE 9 - Legacy Backend Isolation  
**Last Updated:** 2026-04-09

---

## Overview

This directory contains legacy Wix/Velo backend files (`.jsw`) that are **no longer used** in the main application flow. They are preserved for reference and potential future use.

**Current Status:** ✅ All legacy backend dependencies have been removed from the main application.

---

## Legacy Files

### 1. gameOperations.jsw
**Purpose:** Record game transactions (robbery, heist, bounty)  
**Dependencies:** `wix-data`, `wix-members-backend`  
**Status:** ❌ NOT IN USE  
**Replacement:** External backend at `https://comando-backend.onrender.com`

**Functions:**
- `recordGameTransaction(playerId, transactionType, amount, currency, description)`

---

### 2. playerAuth.jsw
**Purpose:** Player authentication and session management  
**Dependencies:** `wix-members-backend`, `wix-data`, `wix-http-functions`  
**Status:** ❌ NOT IN USE  
**Replacement:** Wix Members SDK via `@/integrations/members`

**Functions:**
- `checkIfLoggedIn()` - Check if user is logged in
- `getCurrentMemberInfo()` - Get current member information

---

### 3. playerProfiles.jsw
**Purpose:** Player profile creation and management  
**Dependencies:** `wix-data`, `wix-members-backend`  
**Status:** ❌ NOT IN USE  
**Replacement:** CMS collections + external backend API

**Functions:**
- `createPlayerProfile(profileData)` - Create new player profile
- `getPlayerProfile(playerId)` - Get player profile
- `updatePlayerProfile(playerId, updates)` - Update player profile

---

### 4. matchService.jsw
**Purpose:** Match creation and state synchronization  
**Dependencies:** `wix-data`, `wix-realtime`  
**Status:** ❌ NOT IN USE  
**Replacement:** External backend (matchmaking pages are experimental)

**Functions:**
- `createMatch(matchData)` - Create new match
- `updateMatchState(matchId, updateData)` - Update match state
- `publishMatchUpdate(matchId, update)` - Publish match update

---

### 5. chatRealtime.jsw
**Purpose:** Real-time chat message publishing  
**Dependencies:** `wix-realtime-backend`  
**Status:** ❌ NOT IN USE  
**Replacement:** External backend at `https://comando-backend.onrender.com/chat/*`

**Functions:**
- `publishComplexoMessage(message)` - Publish message to complexo channel
- `publishFaccaoMessage(factionId, message)` - Publish message to faction channel
- `publishMailMessage(recipientId, message)` - Publish private mail message

---

### 6. movementPublisher.jsw
**Purpose:** Player movement publishing via Wix Realtime  
**Dependencies:** `wix-realtime-backend`  
**Status:** ❌ NOT IN USE  
**Replacement:** External backend (movement API exists but not actively used)

**Functions:**
- `publishPlayerMovement(data)` - Publish player movement
- `publishMultipleMovements(movements)` - Publish multiple movements

---

### 7. realtime.jsw
**Purpose:** General real-time event publishing (movement, attacks)  
**Dependencies:** `wix-realtime-backend`  
**Status:** ❌ NOT IN USE  
**Replacement:** External backend

**Functions:**
- `publishMovement(playerId, tileX, tileY)` - Publish movement event
- `publishAttack(targetPlayerId, attackerName, loot, success)` - Publish attack event

---

### 8. realtimeMatchmaking.jsw
**Purpose:** Matchmaking lobby and queue management  
**Dependencies:** `wix-realtime-backend`  
**Status:** ❌ NOT IN USE  
**Replacement:** External backend (experimental matchmaking)

**Functions:**
- `inscreverNoLobby(jogadorData)` - Subscribe player to matchmaking lobby
- `criarPartida()` - Create match from lobby queue

---

## Supporting Files

### README_VELO_SETUP.md
Documentation on how to set up and use Wix Velo backend functions.

### REALTIME_API_GUIDE.md
Guide for using Wix Realtime API for real-time communication.

### ATTACK_REALTIME_GUIDE.md
Guide for implementing real-time attack system using Wix Realtime.

### MOVIMENTO_REALTIME_GUIA.md
Guide for implementing real-time movement system using Wix Realtime.

---

## Frontend Files with Legacy References

### /src/api/movementApi.ts
- **Status:** DEPRECATED (PHASE 9)
- **References:** `movementPublisher.jsw` (comment only)
- **Active Usage:** ❌ NONE
- **Note:** Marked as deprecated with full documentation

### /src/api/cmsChatApi.ts
- **Status:** DEPRECATED (PHASE 8)
- **References:** `wix-realtime` (import exists but not used)
- **Active Usage:** ❌ NONE
- **Note:** Already marked as deprecated with full documentation

### /src/hooks/useMatchSync.ts
- **Status:** DEPRECATED
- **References:** `wix-realtime` (import exists but not used)
- **Active Usage:** ❌ NONE
- **Note:** Already marked as deprecated with full documentation

---

## Current Active Backend

### External Backend
- **URL:** `https://comando-backend.onrender.com`
- **Endpoints:**
  - `/auth/google` - Google authentication
  - `/players` - Player data
  - `/chat/complexo` - Complexo chat
  - `/chat/faccao` - Faction chat
  - `/chat/mail/*` - Private mail

### Wix Members SDK
- **Location:** `@/integrations/members`
- **Purpose:** User authentication and member management
- **Status:** ✅ ACTIVE

### CMS Collections
- **Location:** `@/integrations/cms`
- **Collections:**
  - `playerprofiles` - Player profiles
  - `playerinventories` - Player inventories
  - `playerprogress` - Player progress
  - And others...
- **Status:** ✅ ACTIVE

### Frontend APIs
- **Location:** `/src/api/*`
- **Active Files:**
  - `playerApi.ts` - Player operations
  - `gangApi.ts` - Gang operations
  - `attackApi.ts` - Attack operations
  - `notificationApi.ts` - Notifications
  - `cmsChatApi.ts` - Chat (uses external backend)
- **Status:** ✅ ACTIVE

---

## How to Reactivate Legacy Backend

If you need to reactivate any Wix/Velo backend functionality:

### 1. For Authentication
```typescript
// Update /src/integrations/members/service.ts
import { checkIfLoggedIn, getCurrentMemberInfo } from 'backend/playerAuth';

// Replace external backend calls with:
const authStatus = await checkIfLoggedIn();
```

### 2. For Chat
```typescript
// Update /src/store/chatStore.ts
import { publishComplexoMessage, publishFaccaoMessage } from 'backend/chatRealtime';

// Replace external backend calls with:
await publishComplexoMessage(message);
```

### 3. For Matchmaking
```typescript
// Add back to Router.tsx
import MatchPage from '@/components/pages/MatchPage';
import MatchmakingPage from '@/components/pages/MatchmakingPage';

// Add routes:
{ path: 'match', element: <MatchPage /> },
{ path: 'matchmaking', element: <MatchmakingPage /> },

// Update pages to use matchService.jsw
import { createMatch, updateMatchState } from 'backend/matchService';
```

### 4. For Movement
```typescript
// Update /src/api/movementApi.ts
import { publishPlayerMovement } from 'backend/movementPublisher';

// Update GamePage.tsx to use:
await publishPlayerMovement({ playerId, playerName, tileX, tileY });
```

---

## Verification Checklist

✅ **No active imports from .jsw files**
- No direct imports in TypeScript/React files
- No dynamic imports
- No require() calls

✅ **No active function calls**
- `recordGameTransaction()` - NOT CALLED
- `checkIfLoggedIn()` - NOT CALLED
- `getCurrentMemberInfo()` - NOT CALLED
- `createPlayerProfile()` (from .jsw) - NOT CALLED
- `publishPlayerMovement()` - NOT CALLED
- `publishComplexoMessage()` - NOT CALLED

✅ **No Wix backend dependencies**
- `wix-data` - NOT IMPORTED
- `wix-members-backend` - NOT IMPORTED
- `wix-http-functions` - NOT IMPORTED
- `wix-realtime` - ONLY IN DEPRECATED FILES

✅ **All files preserved**
- No files deleted
- All .jsw files remain in `/src/backend/`
- All documentation preserved

✅ **No UI changes**
- Application remains fully functional
- All pages render correctly
- No visual changes

---

## Conclusion

All legacy Wix/Velo backend files have been successfully isolated from the main application flow. The application now uses:
- External backend API for game operations
- Wix Members SDK for authentication
- CMS collections for data storage
- Frontend APIs for all operations

The legacy files are preserved for reference and can be reactivated if needed in the future.
