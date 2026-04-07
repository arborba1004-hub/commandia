# Attack Realtime System - Backend Implementation Guide

## Overview
This guide explains how to integrate the attack notification system with your backend at `https://comando-backend.onrender.com`.

## Architecture

### 1. **Backend Flow**
```
1. Player A initiates attack on Player B
2. Backend processes attack (damage calculation, loot, etc.)
3. Backend calls publishAttack(attackerId, targetId, result)
4. Realtime API publishes to channel: attack_{targetId}
5. Player B receives notification in real-time
6. Frontend updates UI, store, and animations
```

### 2. **Realtime Channels**
- **game_movements**: All players receive movement updates
- **attack_{playerId}**: Only the target receives attack notifications

## Backend Implementation

### Step 1: Add Attack Publisher Function

In your backend (Node.js/Express), add this function to handle attack publishing:

```javascript
// backend/attackPublisher.js
import { Realtime } from 'wix-realtime-backend';

/**
 * Publishes an attack event to the target player in real-time
 * @param {string} attackerId - ID of the attacker
 * @param {string} targetId - ID of the target
 * @param {object} result - Attack result object
 */
export async function publishAttack(attackerId, targetId, result) {
  try {
    if (!attackerId || !targetId) {
      throw new Error('attackerId and targetId are required');
    }

    const attackChannel = `attack_${targetId}`;

    const attackData = {
      type: 'player_attacked',
      attackerId,
      targetId,
      success: result.success || false,
      critical: result.critical || false,
      loot: result.loot || 0,
      message: result.message || 'You were attacked!',
      attackerName: result.attackerName || 'Unknown',
      attackerPower: result.attackerPower || 0,
      defenderPower: result.defenderPower || 0,
      timestamp: new Date().toISOString(),
    };

    console.log(`⚔️ Publishing attack: ${attackerId} → ${targetId} on channel ${attackChannel}`);

    await Realtime.publish(attackChannel, attackData);

    return {
      success: true,
      message: 'Attack published successfully',
      data: attackData,
    };
  } catch (error) {
    console.error('❌ Error publishing attack:', error);
    throw new Error(`Error publishing attack: ${error.message}`);
  }
}
```

### Step 2: Modify Your Attack Endpoint

Update your existing attack endpoint to call `publishAttack` after processing:

```javascript
// backend/routes/attack.js
import { publishAttack } from './attackPublisher.js';

app.post('/attack/initiate', async (req, res) => {
  try {
    const { attackerId, targetId, gangPower } = req.body;

    // Validate
    if (!attackerId || !targetId) {
      return res.status(400).json({ error: 'attackerId and targetId required' });
    }

    // 1. Calculate attack result
    const attackerPower = (gangPower?.totalPower || 100) + (gangPower?.attackBonus || 0);
    const defenderPower = 100 + (gangPower?.defenseBonus || 0);
    const chance = Math.min(0.9, Math.max(0.3, attackerPower / (attackerPower + defenderPower)));
    const success = Math.random() < chance;
    const critical = success && Math.random() < 0.15;
    const loot = success ? Math.floor(Math.random() * 5000) : 0;

    const result = {
      success,
      critical,
      loot,
      message: success ? (critical ? 'CRITICAL ATTACK!' : 'Attack successful!') : 'Attack failed.',
      attackerName: 'Attacker', // Get from database
      attackerPower,
      defenderPower,
    };

    // 2. Update database (deduct loot from target, add to attacker)
    // ... your database logic here ...

    // 3. 🔥 PUBLISH ATTACK TO TARGET IN REAL-TIME
    try {
      await publishAttack(attackerId, targetId, result);
      console.log('✅ Attack published to target');
    } catch (publishError) {
      console.warn('⚠️ Failed to publish attack, but continuing:', publishError);
      // Don't fail the request if publishing fails
    }

    // 4. Return result to attacker
    res.json({
      success: true,
      attack: result,
    });
  } catch (error) {
    console.error('❌ Error initiating attack:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Step 3: Create Attack Processing Endpoint

Alternatively, create a dedicated endpoint for processing attacks with publishing:

```javascript
// backend/routes/attackPublisher.js
import { ok, badRequest, serverError } from 'wix-http-functions';
import { publishAttack } from './attackPublisher.js';

export async function post_process(request) {
  try {
    const body = request.body.json();
    const {
      attackerId,
      targetId,
      success,
      critical,
      loot,
      message,
      attackerName,
      attackerPower,
      defenderPower,
    } = body;

    if (!attackerId || !targetId) {
      return badRequest({
        error: 'attackerId and targetId are required',
      });
    }

    const attackResult = {
      success: success || false,
      critical: critical || false,
      loot: loot || 0,
      message: message || 'You were attacked!',
      attackerName: attackerName || 'Unknown',
      attackerPower: attackerPower || 0,
      defenderPower: defenderPower || 0,
    };

    const publishResult = await publishAttack(attackerId, targetId, attackResult);

    return ok({
      success: true,
      message: 'Attack processed and published successfully',
      data: publishResult.data,
    });
  } catch (error) {
    console.error('❌ Error processing attack:', error);
    return serverError({
      error: error.message || 'Error processing attack',
    });
  }
}
```

## Frontend Integration

The frontend (`GamePage.tsx`) already handles:

1. **Subscribing to attack channel**: `attack_{playerId}`
2. **Receiving attack notifications** in real-time
3. **Updating player store** (deducting loot)
4. **Showing attack overlay** with attacker info
5. **Animating attacker's barraco** (impact effect + shake)
6. **Adding to attack feed**

### Key Frontend Code

```typescript
// Subscribe to attacks
const subscribeToAttacks = () => {
  const currentPlayerId = playerState?._id;
  const attackChannel = `attack_${currentPlayerId}`;
  
  const subscription = Wix.Realtime.subscribe(attackChannel, (message) => {
    // 1. Show overlay
    setShowAttackOverlay(true);
    
    // 2. Update store
    usePlayerStore.getState().applyPlayerUpdate((p) => ({
      ...p,
      balances: {
        ...p.balances,
        dirtyMoney: Math.max(0, p.balances.dirtyMoney - message.loot),
      },
    }));
    
    // 3. Animate attacker's barraco
    const attackerBarraco = enemyBarracoMapRef.current[message.attackerId];
    if (attackerBarraco) {
      createImpactFlash({ scene, position: attackerBarraco.position });
      shakeObject(attackerBarraco, 0.3, 200);
    }
  });
};
```

## API Endpoints Summary

### POST /api/attack/initiate
**Description**: Initiate an attack and publish to target

**Request Body**:
```json
{
  "attackerId": "player-123",
  "targetId": "player-456",
  "gangPower": {
    "totalPower": 500,
    "attackBonus": 20,
    "defenseBonus": 10
  }
}
```

**Response**:
```json
{
  "success": true,
  "attack": {
    "success": true,
    "critical": false,
    "loot": 2500,
    "message": "Attack successful!",
    "attackerPower": 520,
    "defenderPower": 110
  }
}
```

### POST /api/attack/process
**Description**: Process attack and publish result

**Request Body**:
```json
{
  "attackerId": "player-123",
  "targetId": "player-456",
  "success": true,
  "critical": false,
  "loot": 2500,
  "message": "Attack successful!",
  "attackerName": "Capo Ghost",
  "attackerPower": 520,
  "defenderPower": 110
}
```

**Response**:
```json
{
  "success": true,
  "message": "Attack processed and published successfully",
  "data": {
    "type": "player_attacked",
    "attackerId": "player-123",
    "targetId": "player-456",
    "success": true,
    "critical": false,
    "loot": 2500,
    "message": "Attack successful!",
    "timestamp": "2026-04-07T21:30:00.000Z"
  }
}
```

## Testing

### 1. Test Attack Publishing
```bash
curl -X POST https://comando-backend.onrender.com/api/attack/process \
  -H "Content-Type: application/json" \
  -d '{
    "attackerId": "player-123",
    "targetId": "player-456",
    "success": true,
    "critical": false,
    "loot": 2500,
    "message": "Attack successful!",
    "attackerName": "Capo Ghost",
    "attackerPower": 520,
    "defenderPower": 110
  }'
```

### 2. Verify Frontend Receives Notification
- Open two browser windows with different players
- Player A attacks Player B
- Player B should see:
  - Attack overlay popup
  - Barraco animation (impact + shake)
  - Dirty money deducted
  - Attack feed message

## Troubleshooting

### Attack not being published
- Check if `Realtime` is imported correctly
- Verify `attackChannel` format: `attack_{targetId}`
- Check backend logs for errors

### Frontend not receiving notification
- Verify subscription is active: `Wix.Realtime.subscribe(attackChannel, ...)`
- Check browser console for subscription errors
- Ensure `playerState._id` is available

### Loot not being deducted
- Verify `usePlayerStore.getState().applyPlayerUpdate()` is called
- Check if `balances.dirtyMoney` is being updated correctly
- Ensure store is properly initialized

## Performance Considerations

1. **Channel Naming**: Use specific channels (`attack_{playerId}`) to avoid broadcasting to all players
2. **Message Size**: Keep attack data minimal (only essential fields)
3. **Subscription Cleanup**: Always unsubscribe when component unmounts
4. **Error Handling**: Publish failures shouldn't block the attack from completing

## Security Notes

1. **Validate attackerId**: Ensure the attacker is authenticated
2. **Validate targetId**: Ensure target exists and is valid
3. **Rate Limiting**: Implement cooldown between attacks
4. **Loot Validation**: Ensure loot doesn't exceed target's balance
5. **Authorization**: Only allow attacks between valid players

## Next Steps

1. Integrate `publishAttack` into your attack endpoint
2. Test with two players attacking each other
3. Monitor backend logs for publishing errors
4. Adjust animation timings if needed
5. Add sound effects for attack notifications (optional)
