# PHASE 9 — Legacy Wix/Velo Backend Isolation

**Status:** ✅ COMPLETE  
**Date:** 2026-04-09  
**Purpose:** Isolate legacy Wix/Velo backend files from the main application flow

---

## Summary

All legacy Wix/Velo backend files have been isolated from the main application flow. The application no longer depends on any `.jsw` files for core functionality.

---

## Files Isolated

### 1. **gameOperations.jsw**
- **Status:** LEGACY - NOT IN USE
- **Purpose:** Game transaction recording (robbery, heist, bounty)
- **Dependencies:** `wix-data`, `wix-members-backend`
- **Active Usage:** ❌ NONE
- **Notes:** All game operations now handled by external backend at `https://comando-backend.onrender.com`

### 2. **playerAuth.jsw**
- **Status:** LEGACY - NOT IN USE
- **Purpose:** Player authentication and session management
- **Dependencies:** `wix-members-backend`, `wix-data`, `wix-http-functions`
- **Active Usage:** ❌ NONE
- **Notes:** Authentication now handled by Wix Members SDK via `@/integrations/members`

### 3. **playerProfiles.jsw**
- **Status:** LEGACY - NOT IN USE
- **Purpose:** Player profile creation and management
- **Dependencies:** `wix-data`, `wix-members-backend`
- **Active Usage:** ❌ NONE
- **Notes:** Player profiles managed via CMS collections and external backend API

### 4. **matchService.jsw**
- **Status:** LEGACY - NOT IN USE
- **Purpose:** Match creation and state synchronization
- **Dependencies:** `wix-data`, `wix-realtime`
- **Active Usage:** ❌ NONE
- **Notes:** Matchmaking pages (MatchPage.tsx, MatchmakingPage.tsx) are experimental and not in main router

### 5. **chatRealtime.jsw**
- **Status:** LEGACY - NOT IN USE
- **Purpose:** Real-time chat message publishing
- **Dependencies:** `wix-realtime-backend`
- **Active Usage:** ❌ NONE
- **Notes:** Chat now uses external backend API at `https://comando-backend.onrender.com/chat/*`

### 6. **movementPublisher.jsw**
- **Status:** LEGACY - NOT IN USE
- **Purpose:** Player movement publishing via Wix Realtime
- **Dependencies:** `wix-realtime-backend`
- **Active Usage:** ❌ NONE
- **Notes:** Movement API in `/src/api/movementApi.ts` references this file but is not actively used

### 7. **realtime.jsw**
- **Status:** LEGACY - NOT IN USE
- **Purpose:** General real-time event publishing (movement, attacks)
- **Dependencies:** `wix-realtime-backend`
- **Active Usage:** ❌ NONE
- **Notes:** All real-time operations now handled by external backend

### 8. **realtimeMatchmaking.jsw**
- **Status:** LEGACY - NOT IN USE
- **Purpose:** Matchmaking lobby and queue management
- **Dependencies:** `wix-realtime-backend`
- **Active Usage:** ❌ NONE
- **Notes:** Experimental matchmaking not in main application flow

---

## Active Frontend Files Checked

### Files with Legacy References (Now Marked)

1. **`/src/api/movementApi.ts`**
   - ✅ Updated: Added deprecation notice
   - References: `movementPublisher.jsw` (comment only, not imported)
   - Status: ISOLATED - Not used in main flow

2. **`/src/api/cmsChatApi.ts`**
   - ✅ Updated: Already marked as DEPRECATED (PHASE 8)
   - References: `wix-realtime` (import exists but not used)
   - Status: ISOLATED - Not used in main flow

3. **`/src/hooks/useMatchSync.ts`**
   - ✅ Updated: Already marked as DEPRECATED
   - References: `wix-realtime` (import exists but not used)
   - Status: ISOLATED - Not used in main flow

---

## Verification Results

### ✅ No Active Imports Found

Searched entire `/src` directory for:
- Direct imports from `.jsw` files: ❌ NONE
- Imports of `wix-data`: ❌ NONE
- Imports of `wix-members-backend`: ❌ NONE
- Imports of `wix-http-functions`: ❌ NONE
- Imports of `wix-realtime`: ✅ FOUND (but isolated in deprecated files)

### ✅ No Active Function Calls Found

Searched for calls to:
- `recordGameTransaction()`: ❌ NONE
- `checkIfLoggedIn()`: ❌ NONE
- `getCurrentMemberInfo()`: ❌ NONE
- `createPlayerProfile()` (from .jsw): ❌ NONE (only CMS version used)

### ✅ Main Application Flow

**Current Active Backend:**
- External backend: `https://comando-backend.onrender.com`
- Wix Members SDK: `@/integrations/members`
- CMS Collections: `@/integrations/cms`
- Frontend APIs: `/src/api/*` (playerApi.ts, gangApi.ts, attackApi.ts, etc.)

---

## Files Preserved (Not Deleted)

All `.jsw` files remain in `/src/backend/` for reference:
- ✅ `gameOperations.jsw`
- ✅ `playerAuth.jsw`
- ✅ `playerProfiles.jsw`
- ✅ `matchService.jsw`
- ✅ `chatRealtime.jsw`
- ✅ `movementPublisher.jsw`
- ✅ `realtime.jsw`
- ✅ `realtimeMatchmaking.jsw`

---

## UI Impact

✅ **NO CHANGES** - All UI remains unchanged. This is a backend isolation only.

---

## How to Reactivate (If Needed)

If you need to reactivate any Wix/Velo backend functionality in the future:

1. **For Authentication:**
   - Update `/src/integrations/members/service.ts` to use `playerAuth.jsw`
   - Remove external backend calls from components

2. **For Chat:**
   - Update `/src/store/chatStore.ts` to import from `cmsChatApi.ts`
   - Uncomment `wix-realtime` usage in `/src/api/cmsChatApi.ts`

3. **For Matchmaking:**
   - Add `MatchPage` and `MatchmakingPage` back to Router.tsx
   - Import `matchService.jsw` functions in those pages

4. **For Movement:**
   - Update `/src/api/movementApi.ts` to call `movementPublisher.jsw`
   - Enable real-time subscriptions in GamePage.tsx

---

## Conclusion

✅ **PHASE 9 COMPLETE**

- All legacy Wix/Velo backend files are isolated
- Main application flow has zero dependencies on `.jsw` files
- All files preserved for future reference
- No UI changes
- Application remains fully functional
