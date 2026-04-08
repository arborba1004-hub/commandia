# Chat System Realtime Refactoring

## Overview
This document describes the refactoring of the chat system to use Wix Realtime for real-time message delivery instead of relying solely on polling.

## Architecture

### Backend (Wix Velo)

#### New File: `src/backend/chatRealtime.jsw`
Contains three functions for publishing messages to Realtime channels:

1. **`publishComplexoMessage(message)`**
   - Channel: `chat_complexo`
   - Audience: Everyone (public channel)
   - Called after REST API sends message
   - Publishes to all connected clients

2. **`publishFaccaoMessage(factionId, message)`**
   - Channel: `chat_faccao_{factionId}`
   - Audience: Faction members only
   - Called after REST API sends message
   - Publishes to faction-specific channel

3. **`publishMailMessage(recipientId, message)`**
   - Channel: `chat_mail_{recipientId}`
   - Audience: Recipient only (private)
   - Called after REST API sends message
   - Publishes to recipient's private channel

#### Updated File: `src/backend/realtime.jsw`
Added the three chat publishing functions (moved from chatRealtime.jsw for organization).

### Frontend (React)

#### Updated File: `src/store/chatStore.ts`

**New State Properties:**
- `currentUserId: string | null` - Current player's ID
- `currentFactionId: string | null` - Current player's faction ID

**New Methods:**

1. **`setCurrentUser(userId, factionId?)`**
   - Sets the current user context
   - Called when player data loads
   - Enables proper channel subscriptions

2. **`subscribeToRealtimeChannels()`**
   - Subscribes to all relevant channels based on user context
   - Called after loading initial messages
   - Subscribes to:
     - `chat_complexo` (always)
     - `chat_faccao_{factionId}` (if user has faction)
     - `chat_mail_{userId}` (always)
   - Updates store state when messages arrive
   - Stores unsubscribe functions for cleanup

3. **`unsubscribeFromRealtimeChannels()`**
   - Cleans up all Realtime subscriptions
   - Called on component unmount
   - Prevents memory leaks

**Modified Methods:**

1. **`loadChat()`**
   - Now calls `subscribeToRealtimeChannels()` after loading initial messages
   - Keeps polling as fallback mechanism
   - Ensures both REST and Realtime work together

2. **`sendComplexoMessage()`**
   - Sends message via REST API first
   - Then publishes to Realtime via `/_functions/publishComplexoMessage`
   - Fetches updated messages
   - Handles Realtime errors gracefully (doesn't break if Realtime fails)

3. **`sendFaccaoMessage()`**
   - Sends message via REST API first
   - Then publishes to Realtime via `/_functions/publishFaccaoMessage`
   - Fetches updated messages
   - Handles Realtime errors gracefully

4. **`sendMailMessage()`**
   - Sends message via REST API first
   - Then publishes to Realtime via `/_functions/publishMailMessage`
   - Fetches updated messages
   - Handles Realtime errors gracefully

**Polling Strategy:**
- Polling is kept as a fallback mechanism
- Runs every 3 seconds (POLLING_INTERVAL)
- Ensures messages are delivered even if Realtime fails
- Can be disabled by removing `startChatPolling()` call if desired

#### Updated File: `src/components/pages/ChatPage.tsx`

**Changes:**
- Imports new store methods: `setCurrentUser`, `subscribeToRealtimeChannels`, `unsubscribeFromRealtimeChannels`
- Calls `setCurrentUser()` with player data when component mounts
- Calls `subscribeToRealtimeChannels()` as part of `loadChat()`
- Cleans up subscriptions on unmount

## Message Flow

### Sending a Message

1. **User sends message** → `sendXxxMessage()` called
2. **REST API call** → Message saved to backend database
3. **Realtime publish** → Message published to appropriate channel
4. **Fetch updates** → Store fetches latest messages (includes the new message)
5. **Realtime delivery** → Connected clients receive message via subscription
6. **Store update** → Message added to store state

### Receiving a Message

1. **Realtime subscription active** → Client listening on channel
2. **Message published** → Backend publishes to channel
3. **Subscription callback** → Frontend receives message
4. **Store update** → Message added to appropriate store array
5. **UI update** → React re-renders with new message

### Fallback (Polling)

If Realtime fails:
1. Polling continues every 3 seconds
2. Fetches latest messages from REST API
3. Updates store with any new messages
4. Ensures eventual consistency

## Channel Structure

```
chat_complexo
├── All players listen
└── Messages visible to everyone

chat_faccao_{factionId}
├── Only faction members listen
└── Messages visible only to faction

chat_mail_{userId}
├── Only recipient listens
└── Messages visible only to recipient
```

## Error Handling

- **Realtime publish fails** → Message still saved (REST succeeded), warning logged
- **Realtime subscribe fails** → Polling continues as fallback
- **REST API fails** → Error shown to user, Realtime not called
- **Polling fails** → User sees cached messages, can retry

## Performance Considerations

1. **Dual delivery** → REST + Realtime ensures reliability
2. **Polling fallback** → Guarantees eventual consistency
3. **Selective subscriptions** → Only subscribe to relevant channels
4. **Cleanup on unmount** → Prevents memory leaks
5. **Graceful degradation** → Works without Realtime if needed

## Testing Checklist

- [ ] Messages appear in real-time in complexo channel
- [ ] Faction messages only visible to faction members
- [ ] Mail messages only visible to recipient
- [ ] Polling still works if Realtime fails
- [ ] No duplicate messages
- [ ] Subscriptions cleaned up on page leave
- [ ] New users can join and see messages
- [ ] Faction change updates subscriptions
- [ ] No memory leaks after long sessions

## Future Improvements

1. **Selective polling** → Only poll channels without active subscriptions
2. **Message deduplication** → Prevent duplicates from REST + Realtime
3. **Typing indicators** → Show who's typing in real-time
4. **Read receipts** → Real-time read status updates
5. **Message reactions** → Real-time emoji reactions
6. **Channel history** → Load more messages on scroll
7. **User presence** → Show who's online in each channel
