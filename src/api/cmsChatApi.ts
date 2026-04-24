/**
 * ⚠️ DEPRECATED - CMS-based Chat API (LEGACY)
 * 
 * PHASE 8: This file is ISOLATED from the main application flow.
 * 
 * Status: LEGACY - DO NOT USE
 * Reason: Application now uses external backend API for chat operations
 * 
 * This file is preserved for reference only and contains CMS-based chat operations
 * using Wix Realtime API.
 * 
 * All active chat operations use the external backend at:
 * - https://comando-backend.onrender.com
 * - Endpoints: /chat/complexo, /chat/faccao, /mail/*
 * 
 * Chat state management is handled by:
 * - /src/store/chatStore.ts (uses backend API)
 * 
 * If you need to use Wix Realtime for chat in the future:
 * 1. Import from this file
 * 2. Update chatStore.ts to use these functions
 * 3. Remove backend API calls from chatStore.ts
 * 
 * DO NOT import this file in active components or stores.
 */

// ⚠️ DISABLED: import { subscribe } from 'wix-realtime'; - Causes infinite loop during Wix publish
import { BaseCrudService } from '@/integrations';
import { generateUUID } from '@/lib/uuid';

// We'll use a simple collection for chat messages
// For now, we'll store them in a custom collection or use a workaround

export interface ChatMessage {
  _id: string;
  channel: 'complexo' | 'faccao' | 'mail';
  senderId: string;
  senderName: string;
  recipientId?: string; // For mail
  recipientName?: string; // For mail
  subject?: string; // For mail
  body: string;
  createdAt: string;
  read?: boolean;
}

/**
 * Subscribe to real-time chat updates via Wix Realtime API
 */
export async function subscribeToChat(
  channel: 'complexo' | 'faccao' | 'mail',
  onMessage: (message: ChatMessage) => void,
  onError?: (error: Error) => void
): Promise<() => void> {
  try {
    // Subscribe to channel updates
    const unsubscribe = await subscribe({
      collection: 'chat_messages',
      documentId: channel,
      onUpdate: (update) => {
        if (update.data) {
          onMessage(update.data as ChatMessage);
        }
      },
      onError: (error) => {
        console.error(`Chat subscription error for ${channel}:`, error);
        onError?.(error);
      },
    });

    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to chat:', error);
    throw error;
  }
}

/**
 * Send a chat message
 * Note: In a real implementation, this would be handled by a backend function
 * For now, we'll store it locally and sync via Realtime API
 */
export async function sendChatMessage(message: Omit<ChatMessage, '_id' | 'createdAt'>): Promise<ChatMessage> {
  const chatMessage: ChatMessage = {
    ...message,
    _id: generateUUID(),
    createdAt: new Date().toISOString(),
  };

  try {
    // In a production system, you would call a backend function here
    // For now, we'll just return the message
    // Backend function would handle persistence and broadcasting
    console.log('Chat message prepared for sending:', chatMessage);
    return chatMessage;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

/**
 * Mark a mail message as read
 */
export async function markMailAsRead(messageId: string): Promise<void> {
  try {
    // This would be handled by a backend function
    console.log('Marking mail as read:', messageId);
  } catch (error) {
    console.error('Error marking mail as read:', error);
    throw error;
  }
}

/**
 * Fetch chat history for a channel
 * Note: This is a placeholder - in production, you'd fetch from CMS or backend
 */
export async function fetchChatHistory(
  channel: 'complexo' | 'faccao' | 'mail',
  limit: number = 50
): Promise<ChatMessage[]> {
  try {
    // Placeholder - would fetch from CMS in production
    console.log(`Fetching chat history for ${channel} (limit: ${limit})`);
    return [];
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
}
