# Maximum Update Depth Exceeded - Fix Report

## Problem Summary
The error "Maximum update depth exceeded" occurs when React components repeatedly call `setState` inside `useEffect` hooks due to incorrect dependency arrays. This creates infinite loops of re-renders.

## Root Causes Identified

### 1. **HomePage.tsx** - Achievement Loading Loop
**Location:** Lines 89-112

**Problem:**
```typescript
// WRONG - causes infinite loop
useEffect(() => {
  loadAchievements(parsed);
}, [loadAchievements]); // loadAchievements changes on every render

useEffect(() => {
  checkAndUnlockAchievements(player);
}, [player, checkAndUnlockAchievements]); // Both dependencies change frequently
```

**Why it fails:**
- `loadAchievements` and `checkAndUnlockAchievements` are functions from `useAchievementStore`
- These functions are recreated on every render
- When dependencies change, the effect runs again
- The effect calls the function, which updates state
- State update triggers re-render, recreating the functions
- Loop repeats infinitely

**Solution Applied:**
```typescript
// CORRECT - runs only once
useEffect(() => {
  loadAchievements(parsed);
}, []); // Empty array = run only on mount

useEffect(() => {
  checkAndUnlockAchievements(player);
}, [player?._id]); // Only depend on the ID, not the whole object
```

### 2. **LuxuryshowroomPage.tsx** - Video Event Listener Loop
**Location:** Lines 45-58

**Problem:**
```typescript
// WRONG - re-adds listener on every state change
useEffect(() => {
  video.addEventListener('timeupdate', handleTime);
  return () => video.removeEventListener('timeupdate', handleTime);
}, [showDialog, showButton]); // Listener re-added when these change
```

**Why it fails:**
- When `showDialog` or `showButton` changes, the effect runs again
- The old listener is removed, new one is added
- But the `handleTime` function references the old state values
- This causes the state to be set again, triggering the effect again
- Loop repeats

**Solution Applied:**
```typescript
// CORRECT - listener added only once
useEffect(() => {
  video.addEventListener('timeupdate', handleTime);
  return () => video.removeEventListener('timeupdate', handleTime);
}, []); // Empty array = add listener only once on mount
```

## Best Practices Applied

### 1. **Empty Dependency Array `[]`**
Use when:
- Initializing data that doesn't depend on props/state
- Setting up event listeners that should only be added once
- Running cleanup code only on unmount

### 2. **Specific Dependencies**
Use when:
- Effect depends on specific values
- Extract primitive values instead of objects
- Example: `[player?._id]` instead of `[player]`

### 3. **Avoid Function Dependencies**
Problem:
```typescript
// Functions are recreated on every render
const { checkAndUnlockAchievements } = useAchievementStore();
useEffect(() => {
  checkAndUnlockAchievements(player);
}, [checkAndUnlockAchievements]); // WRONG
```

Solution:
```typescript
// Call the function directly without depending on it
useEffect(() => {
  checkAndUnlockAchievements(player);
}, [player?._id]); // Depend on data, not functions
```

## Files Modified

1. **src/components/pages/HomePage.tsx**
   - Fixed achievement loading effect (line 89-105)
   - Fixed achievement unlock check effect (line 108-112)

2. **src/components/pages/LuxuryshowroomPage.tsx**
   - Fixed video event listener effect (line 45-58)

## Testing Recommendations

1. **HomePage**
   - Log in with Google
   - Verify achievements load without console errors
   - Check that achievement notifications appear correctly

2. **LuxuryshowroomPage**
   - Navigate to Galeria (Luxury Gallery)
   - Verify video plays and dialog appears at correct times
   - Check that no "Maximum update depth" errors appear in console

3. **General**
   - Monitor browser console for React warnings
   - Check React DevTools Profiler for excessive re-renders
   - Verify all pages load without infinite loops

## Prevention Guidelines

For future development:

1. **Always ask:** "Does this effect depend on functions or objects that change on every render?"
2. **Extract primitives:** Use `player?._id` instead of `player`
3. **Use useCallback:** If you must pass functions as dependencies, wrap them in `useCallback`
4. **Test with React DevTools:** Use the Profiler to detect infinite loops early
5. **Review dependency arrays:** Every `useEffect` should have a clear reason for its dependencies

## Related Documentation

- React Hooks: https://react.dev/reference/react/useEffect
- Dependency Arrays: https://react.dev/reference/react/useEffect#specifying-reactive-dependencies
- Common Mistakes: https://react.dev/reference/react/useEffect#troubleshooting
