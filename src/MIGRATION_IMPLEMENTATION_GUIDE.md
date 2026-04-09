# 🚀 MIGRATION IMPLEMENTATION GUIDE

## Overview
This guide provides step-by-step instructions to migrate from external Render backend to Wix-native services.

---

## PHASE 1: AUTHENTICATION (IMMEDIATE)

### Step 1: Replace HomePage
**File**: `/src/components/Router.tsx`

```typescript
// BEFORE
const HomePage = lazy(() => import('@/components/pages/HomePage'));

// AFTER
const HomePage = lazy(() => import('@/components/pages/HomePageNew'));
```

**What Changed**:
- ✅ Removed Google OAuth script loading
- ✅ Implemented Wix Members login
- ✅ Added player data initialization
- ✅ Replaced external backend calls with CMS

### Step 2: Update Header Component
**File**: `/src/components/Header.tsx`

Replace `useGoogleAuth` with `useWixAuth`:

```typescript
// BEFORE
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
const { playerData, authToken, logout } = useGoogleAuth();

// AFTER
import { useWixAuth } from '@/hooks/useWixAuth';
const { member, isAuthenticated, playerProfile, actions } = useWixAuth();
```

### Step 3: Remove External Backend References
**Files to Clean**:
- Delete `/src/hooks/useGoogleAuth.ts`
- Delete `/src/hooks/useBackendHealthCheck.ts`
- Delete `/src/pages/A.astro` (or remove Google script)

---

## PHASE 2: DATA PERSISTENCE (HIGH PRIORITY)

### Step 1: Replace Player API Calls
**Old File**: `/src/api/playerApi.ts` (DEPRECATED)
**New File**: `/src/api/cmsPlayerApi.ts` (USE THIS)

**Migration Pattern**:

```typescript
// BEFORE (External Backend)
import { fetchCurrentPlayer, syncPlayerUpdate } from '@/api/playerApi';
const player = await fetchCurrentPlayer();
await syncPlayerUpdate(player);

// AFTER (Wix CMS)
import { fetchPlayerProfile, updatePlayerProfile } from '@/api/cmsPlayerApi';
const profile = await fetchPlayerProfile(playerId);
await updatePlayerProfile(playerId, updates);
```

### Step 2: Update Player Store
**File**: `/src/store/playerStore.ts`

Replace backend calls with CMS calls:

```typescript
// BEFORE
import { fetchCurrentPlayer, syncPlayerUpdate } from '@/api/playerApi';

// AFTER
import { 
  fetchPlayerProfile, 
  updatePlayerProfile,
  fetchCompletePlayerData 
} from '@/api/cmsPlayerApi';
```

### Step 3: Implement Auto-Save
Add periodic sync to CMS:

```typescript
// In player store or persistence hook
const syncInterval = setInterval(async () => {
  if (player._id) {
    await syncPlayerToCMS(player._id, player);
  }
}, 30000); // Every 30 seconds
```

---

## PHASE 3: REAL-TIME UPDATES (HIGH PRIORITY)

### Step 1: Replace Chat Polling with Realtime API
**Old File**: `/src/store/chatStore.ts` (POLLING)
**New File**: `/src/api/cmsChatApi.ts` (REALTIME)

**Migration Pattern**:

```typescript
// BEFORE (Polling)
const POLLING_INTERVAL = 3000;
let chatPollingInterval = setInterval(() => {
  fetchMessages();
}, POLLING_INTERVAL);

// AFTER (Realtime)
import { subscribeToChat } from '@/api/cmsChatApi';
const unsubscribe = await subscribeToChat('complexo', (message) => {
  addMessage(message);
});
```

### Step 2: Implement Realtime Subscriptions
```typescript
// Subscribe to all channels
const unsubComplexo = await subscribeToChat('complexo', handleComplexoMessage);
const unsubFaccao = await subscribeToChat('faccao', handleFaccaoMessage);
const unsubMail = await subscribeToChat('mail', handleMailMessage);

// Cleanup on unmount
return () => {
  unsubComplexo();
  unsubFaccao();
  unsubMail();
};
```

---

## PHASE 4: GAME OPERATIONS (MEDIUM PRIORITY)

### Step 1: Move Game Logic to Backend Functions
Create Wix Backend Functions for:
- Attack calculations
- Laundry operations
- Arsenal upgrades
- Giro operations

**Example Backend Function** (`/backend/gameOperations.jsw`):

```javascript
export async function initiateAttack(targetId) {
  // Game logic here
  // Update CMS collections
  // Return result
}
```

### Step 2: Update Frontend Calls
```typescript
// BEFORE
import { initiateAttack } from '@/api/playerApi';
const result = await initiateAttack(targetId);

// AFTER
const result = await fetch('/_functions/initiateAttack', {
  method: 'POST',
  body: JSON.stringify({ targetId })
});
```

---

## PHASE 5: eCOMMERCE (MEDIUM PRIORITY)

### Step 1: Implement Cart UI
Create `/src/components/Cart.tsx`:

```typescript
import { useCart, useCurrency, formatPrice, DEFAULT_CURRENCY } from '@/integrations';

export default function Cart() {
  const { items, totalPrice, isOpen, actions } = useCart();
  const { currency } = useCurrency();

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          <span>{item.name}</span>
          <span>{formatPrice(item.price, currency ?? DEFAULT_CURRENCY)}</span>
        </div>
      ))}
    </div>
  );
}
```

### Step 2: Add to Cart Buttons
```typescript
// On product cards
<button onClick={() => actions.addToCart({ 
  collectionId: 'armasarsenal', 
  itemId: weapon._id,
  quantity: 1
})}>
  Add to Cart
</button>
```

---

## PHASE 6: CLEANUP (LOW PRIORITY)

### Files to Delete
- [ ] `/src/api/playerApi.ts` (after migration complete)
- [ ] `/src/hooks/useGoogleAuth.ts`
- [ ] `/src/hooks/useBackendHealthCheck.ts`
- [ ] `/src/pages/A.astro` (or clean up)

### Files to Update
- [ ] All game pages - replace API calls
- [ ] All stores - use CMS instead of backend
- [ ] All hooks - remove backend references

---

## TESTING CHECKLIST

### Authentication
- [ ] User can login with Wix Members
- [ ] Player profile created on first login
- [ ] User can logout
- [ ] Session persists on page reload

### Data Persistence
- [ ] Player data saved to CMS
- [ ] Data loads on login
- [ ] Changes sync to CMS
- [ ] No data loss on disconnect

### Real-time Updates
- [ ] Chat messages appear in real-time
- [ ] No polling visible in network tab
- [ ] Multiple users see same messages
- [ ] Connection handles reconnects

### Game Operations
- [ ] Attacks work correctly
- [ ] Laundry operations complete
- [ ] Arsenal upgrades apply
- [ ] Giro operations function

### eCommerce
- [ ] Can add items to cart
- [ ] Cart shows correct totals
- [ ] Checkout works
- [ ] Purchases recorded in CMS

---

## TROUBLESHOOTING

### Issue: "Cannot find module '@/api/cmsPlayerApi'"
**Solution**: Make sure file exists at `/src/api/cmsPlayerApi.ts`

### Issue: "Wix Realtime subscription not working"
**Solution**: Verify `wix-realtime` package is installed and imported correctly

### Issue: "Player data not saving to CMS"
**Solution**: Check CMS collection permissions are set to "ANYONE" for insert/update

### Issue: "Cart not showing items"
**Solution**: Verify collections have catalog plugin enabled (armasarsenal, fugavehicles, accessories, casesdearmas)

---

## ROLLBACK PLAN

If migration fails:
1. Revert Router.tsx to use old HomePage
2. Keep old API files as backup
3. Restore from CMS backups if needed

---

## ESTIMATED TIMELINE

- **Phase 1 (Auth)**: 30 minutes
- **Phase 2 (Data)**: 1 hour
- **Phase 3 (Realtime)**: 1 hour
- **Phase 4 (Game Ops)**: 1.5 hours
- **Phase 5 (eCommerce)**: 45 minutes
- **Phase 6 (Cleanup)**: 15 minutes

**Total**: 4-5 hours

---

## SUCCESS CRITERIA

✅ System is fully operational without external backend
✅ All player data persists in Wix CMS
✅ Real-time chat works without polling
✅ Game operations complete successfully
✅ eCommerce integration functional
✅ No external API calls (except Wix services)
✅ All tests passing

---

## NEXT STEPS

1. **Immediate**: Update HomePage and Header (Phase 1)
2. **Short-term**: Implement CMS data persistence (Phase 2)
3. **Medium-term**: Replace polling with Realtime API (Phase 3)
4. **Long-term**: Complete game operations and cleanup (Phases 4-6)

**Start with Phase 1 now to get authentication working!**
