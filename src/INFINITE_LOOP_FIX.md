# Infinite Loop Fix - Wix Publish Issue

## Problem
The Wix publish function was entering an infinite loop due to `setInterval` and `setTimeout` being called during the build/SSR (Server-Side Rendering) phase. These browser APIs should only execute in the client environment.

## Root Cause
When Wix builds and publishes the site, it performs server-side rendering. During this phase, code that uses browser-only APIs like `setInterval`, `setTimeout`, and `window` objects can cause infinite loops or build failures because:

1. These APIs don't exist in Node.js environment
2. Polling intervals continue running indefinitely during build
3. No cleanup mechanism exists during SSR

## Solution
Added `typeof window === 'undefined'` checks to all functions that use browser APIs. This ensures:

- Code only executes in the browser environment
- No polling/intervals are created during build/SSR
- Clean separation between server and client code

## Files Modified

### 1. `/src/store/playerStore.ts`
**Function:** `startPolling()`
- Added check: `if (typeof window === 'undefined' || typeof document === 'undefined') return;`
- Prevents player polling from starting during build

### 2. `/src/store/chatStore.ts`
**Function:** `startChatPolling()`
- Added check: `if (typeof window === 'undefined' || typeof document === 'undefined') return;`
- Prevents chat polling from starting during build

### 3. `/src/services/energyService.ts`
**Function:** `startRegen()`
- Added check: `if (typeof window === 'undefined') return;`
- Prevents energy regeneration timer from starting during build

### 4. `/src/components/InteractiveTileGrid.tsx`
**Hook:** `useEffect` with `setInterval`
- Added check: `if (typeof window === 'undefined') return;`
- Prevents player polling in interactive tile grid during build

### 5. `/src/components/pages/realtimeMapPlayersLayer.ts`
**Function:** `start()`
- Added check: `if (typeof window === 'undefined' || typeof document === 'undefined') return;`
- Prevents map players layer polling during build

### 6. `/src/components/pages/HomePage.tsx`
**Hook:** `useEffect` with Google API check
- Added check: `if (typeof window === 'undefined') return;`
- Prevents Google API polling during build

### 7. `/src/components/pages/LavagemDeDinheiroPage.tsx`
**Hook:** `useEffect` with timer updates
- Added check: `if (typeof window === 'undefined') return;`
- Prevents money laundering timers from running during build

### 8. `/src/components/pages/GiroPage.tsx`
**Loop:** Reel animation intervals
- Added check: `if (typeof window === 'undefined') return;`
- Prevents reel animation intervals during build

### 9. `/src/components/game/realtimeMapPlayersLayer.ts`
**Function:** `start()`
- Added check: `if (typeof window === 'undefined' || typeof document === 'undefined') return;`
- Prevents game map polling during build

### 10. `/src/components/game/mapAttackAdvancedEffects.ts`
**Function:** `createPoliceLight()`
- Added check: `if (typeof window === 'undefined') return;`
- Prevents police light effects from running during build

## Testing
After these changes:
1. ✅ Wix publish should complete without infinite loops
2. ✅ All browser functionality remains intact
3. ✅ No polling/timers run during build/SSR
4. ✅ Client-side features work normally in production

## Best Practice
For any future code using browser APIs:
```typescript
// ✅ CORRECT - Check for browser environment
if (typeof window === 'undefined') return;
setInterval(() => { /* ... */ }, 1000);

// ❌ WRONG - No check, causes infinite loop during build
setInterval(() => { /* ... */ }, 1000);
```

## Related Issues
- Previous cleanup report: `/src/CLEANUP_REPORT.md`
- Disabled wix-realtime imports that were causing similar issues
- All backend imports properly removed
