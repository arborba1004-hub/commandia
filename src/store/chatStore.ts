import { create } from 'zustand';
import { subscribe } from 'wix-realtime';
import type { ChatMessage, ChatChannelType } from '@/types/chat';

const BACKEND_URL = 'https://comando-backend.onrender.com';
const POLLING_INTERVAL = 3000;

let chatPollingInterval: ReturnType<typeof setInterval> | null = null;
let realtimeUnsubscribers: Map<string, () => void> = new Map();

type ChatStore = {
  complexoMessages: ChatMessage[];
  faccaoMessages: ChatMessage[];
  mailMessages: ChatMessage[];
  activeChannel: ChatChannelType;
  isLoading: boolean;
  syncError: string | null;
  currentUserId: string | null;
  currentFactionId: string | null;

  setActiveChannel: (channel: ChatChannelType) => void;
  setComplexoMessages: (messages: ChatMessage[]) => void;
  setFaccaoMessages: (messages: ChatMessage[]) => void;
  setMailMessages: (messages: ChatMessage[]) => void;
  setCurrentUser: (userId: string, factionId?: string) => void;

  fetchMessages: (channel?: ChatChannelType) => Promise<void>;
  loadChat: () => Promise<void>;
  subscribeToRealtimeChannels: () => Promise<void>;
  unsubscribeFromRealtimeChannels: () => void;

  startChatPolling: () => void;
  stopChatPolling: () => void;

  sendComplexoMessage: (payload: {
    senderId: string;
    senderName: string;
    body: string;
  }) => Promise<void>;

  sendFaccaoMessage: (payload: {
    senderId: string;
    senderName: string;
    factionId: string;
    body: string;
  }) => Promise<void>;

  sendMailMessage: (payload: {
    senderId: string;
    senderName: string;
    recipientId: string;
    recipientName: string;
    subject?: string;
    body: string;
  }) => Promise<void>;

  markMailAsRead: (messageId: string) => Promise<void>;
  clearChannel: (channel: ChatChannelType) => void;
  saveChat: () => void;
};

function getAuthToken() {
  return localStorage.getItem('authToken');
}

async function makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  console.log('🔑 Token para chat:', token ? `${token.slice(0, 20)}...` : 'ausente');
  console.log('📡 Chat request:', endpoint, 'token exists?', !!token);

  if (!token) {
    throw new Error('Sem token de autenticação');
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = 'Erro na requisição do chat';

    try {
      const errorData = await response.json();
      errorMessage = errorData?.error || errorMessage;
    } catch {
      // ignora parse
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

function normalizeMessages(messages: any[]): ChatMessage[] {
  return messages.map((msg) => ({
    id: msg._id || msg.id,
    channel: msg.channel,
    senderId: msg.senderId,
    senderName: msg.senderName,
    recipientId: msg.recipientId ?? null,
    recipientName: msg.recipientName ?? null,
    factionId: msg.factionId ?? null,
    subject: msg.subject ?? null,
    body: msg.body,
    createdAt: msg.createdAt,
    read: msg.read ?? false,
    system: msg.system ?? false,
  }));
}

export const useChatStore = create<ChatStore>((set, get) => ({
  complexoMessages: [],
  faccaoMessages: [],
  mailMessages: [],
  activeChannel: 'complexo',
  isLoading: false,
  syncError: null,
  currentUserId: null,
  currentFactionId: null,

  setActiveChannel: (channel) => {
    set({ activeChannel: channel });
    void get().fetchMessages(channel);
  },

  setComplexoMessages: (messages) => set({ complexoMessages: messages }),
  setFaccaoMessages: (messages) => set({ faccaoMessages: messages }),
  setMailMessages: (messages) => set({ mailMessages: messages }),

  setCurrentUser: (userId, factionId) => {
    set({ currentUserId: userId, currentFactionId: factionId || null });
  },

  fetchMessages: async (channel) => {
    const selectedChannel = channel || get().activeChannel;

    try {
      set({ isLoading: true, syncError: null });

      const raw = await makeRequest<any[]>(
        `/chat/messages?channel=${selectedChannel}`
      );

      const messages = normalizeMessages(raw);

      if (selectedChannel === 'complexo') {
        set({ complexoMessages: messages, isLoading: false });
        return;
      }

      if (selectedChannel === 'faccao') {
        set({ faccaoMessages: messages, isLoading: false });
        return;
      }

      set({ mailMessages: messages, isLoading: false });
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      set({
        isLoading: false,
        syncError: error instanceof Error ? error.message : 'Erro ao buscar mensagens',
      });
    }
  },

  loadChat: async () => {
    const token = getAuthToken();
    
    if (!token) {
      console.warn('Chat: Sem token de autenticação');
      set({
        isLoading: false,
        syncError: 'Autenticação necessária para carregar chat',
      });
      return;
    }

    try {
      set({ isLoading: true, syncError: null });

      const results = await Promise.allSettled([
        makeRequest<any[]>('/chat/messages?channel=complexo'),
        makeRequest<any[]>('/chat/messages?channel=faccao'),
        makeRequest<any[]>('/chat/messages?channel=mail'),
      ]);

      const c1 = results[0].status === 'fulfilled' ? results[0].value : [];
      const c2 = results[1].status === 'fulfilled' ? results[1].value : [];
      const c3 = results[2].status === 'fulfilled' ? results[2].value : [];

      set({
        complexoMessages: normalizeMessages(c1),
        faccaoMessages: normalizeMessages(c2),
        mailMessages: normalizeMessages(c3),
        isLoading: false,
      });

      // Subscribe to realtime channels
      await get().subscribeToRealtimeChannels();
      
      // Keep polling as fallback
      get().startChatPolling();
    } catch (error) {
      console.error('Erro ao carregar chat:', error);
      set({
        isLoading: false,
        syncError: error instanceof Error ? error.message : 'Erro ao carregar chat',
      });
    }
  },

  subscribeToRealtimeChannels: async () => {
    const state = get();
    const userId = state.currentUserId;
    const factionId = state.currentFactionId;

    try {
      // Unsubscribe from old channels first
      get().unsubscribeFromRealtimeChannels();

      // Subscribe to complexo channel (everyone listens)
      const complexoUnsub = await subscribe('chat_complexo', (message: any) => {
        if (message.type === 'chat_message' && message.channel === 'complexo') {
          const normalizedMsg = normalizeMessages([message])[0];
          set((state) => ({
            complexoMessages: [...state.complexoMessages, normalizedMsg],
          }));
        }
      });
      realtimeUnsubscribers.set('chat_complexo', complexoUnsub);
      console.log('✅ Subscribed to chat_complexo');

      // Subscribe to faction channel if user has faction
      if (factionId) {
        const faccaoChannel = `chat_faccao_${factionId}`;
        const faccaoUnsub = await subscribe(faccaoChannel, (message: any) => {
          if (message.type === 'chat_message' && message.channel === 'faccao') {
            const normalizedMsg = normalizeMessages([message])[0];
            set((state) => ({
              faccaoMessages: [...state.faccaoMessages, normalizedMsg],
            }));
          }
        });
        realtimeUnsubscribers.set(faccaoChannel, faccaoUnsub);
        console.log(`✅ Subscribed to ${faccaoChannel}`);
      }

      // Subscribe to mail channel for current user
      if (userId) {
        const mailChannel = `chat_mail_${userId}`;
        const mailUnsub = await subscribe(mailChannel, (message: any) => {
          if (message.type === 'chat_message' && message.channel === 'mail') {
            const normalizedMsg = normalizeMessages([message])[0];
            set((state) => ({
              mailMessages: [...state.mailMessages, normalizedMsg],
            }));
          }
        });
        realtimeUnsubscribers.set(mailChannel, mailUnsub);
        console.log(`✅ Subscribed to ${mailChannel}`);
      }
    } catch (error) {
      console.error('Erro ao se inscrever em canais realtime:', error);
      set({
        syncError: error instanceof Error ? error.message : 'Erro ao conectar realtime',
      });
    }
  },

  unsubscribeFromRealtimeChannels: () => {
    realtimeUnsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (error) {
        console.error('Erro ao desinscrever:', error);
      }
    });
    realtimeUnsubscribers.clear();
    console.log('🔌 Unsubscribed from all realtime channels');
  },

  startChatPolling: () => {
    const token = getAuthToken();
    if (!token) return;

    if (chatPollingInterval) {
      clearInterval(chatPollingInterval);
    }

    chatPollingInterval = setInterval(() => {
      void get().fetchMessages('complexo');
      void get().fetchMessages('faccao');
      void get().fetchMessages('mail');
    }, POLLING_INTERVAL);
  },

  stopChatPolling: () => {
    if (chatPollingInterval) {
      clearInterval(chatPollingInterval);
      chatPollingInterval = null;
    }
  },

  sendComplexoMessage: async ({ senderId, senderName, body }) => {
    if (!senderId || !senderName) {
      set({
        syncError: 'Dados do jogador não carregados. Faça login novamente.',
      });
      return;
    }

    try {
      set({ syncError: null });

      const messagePayload = {
        channel: 'complexo',
        senderId,
        senderName,
        body,
      };

      // Send to backend REST
      await makeRequest('/chat/send', {
        method: 'POST',
        body: JSON.stringify(messagePayload),
      });

      // Publish to realtime channel
      try {
        const realtimePayload = {
          id: crypto.randomUUID(),
          channel: 'complexo',
          senderId,
          senderName,
          body,
          createdAt: new Date().toISOString(),
          read: false,
          system: false,
        };
        
        // Call backend function to publish
        const response = await fetch('/_functions/publishComplexoMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(realtimePayload),
        });
        
        if (!response.ok) {
          console.warn('Falha ao publicar no realtime, mas mensagem foi salva');
        }
      } catch (realtimeError) {
        console.warn('Erro ao publicar realtime:', realtimeError);
      }

      // Fetch updated messages
      await get().fetchMessages('complexo');
    } catch (error) {
      console.error('Erro ao enviar mensagem do complexo:', error);
      set({
        syncError: error instanceof Error ? error.message : 'Erro ao enviar mensagem',
      });
    }
  },

  sendFaccaoMessage: async ({ senderId, senderName, factionId, body }) => {
    if (!senderId || !senderName || !factionId) {
      set({
        syncError: 'Dados incompletos. Verifique sua facção e faça login novamente.',
      });
      return;
    }

    try {
      set({ syncError: null });

      const messagePayload = {
        channel: 'faccao',
        senderId,
        senderName,
        factionId,
        body,
      };

      // Send to backend REST
      await makeRequest('/chat/send', {
        method: 'POST',
        body: JSON.stringify(messagePayload),
      });

      // Publish to realtime channel
      try {
        const realtimePayload = {
          id: crypto.randomUUID(),
          channel: 'faccao',
          senderId,
          senderName,
          factionId,
          body,
          createdAt: new Date().toISOString(),
          read: false,
          system: false,
        };
        
        // Call backend function to publish
        const response = await fetch('/_functions/publishFaccaoMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            factionId,
            message: realtimePayload,
          }),
        });
        
        if (!response.ok) {
          console.warn('Falha ao publicar no realtime, mas mensagem foi salva');
        }
      } catch (realtimeError) {
        console.warn('Erro ao publicar realtime:', realtimeError);
      }

      // Fetch updated messages
      await get().fetchMessages('faccao');
    } catch (error) {
      console.error('Erro ao enviar mensagem da facção:', error);
      set({
        syncError: error instanceof Error ? error.message : 'Erro ao enviar mensagem',
      });
    }
  },

  sendMailMessage: async ({
    senderId,
    senderName,
    recipientId,
    recipientName,
    subject,
    body,
  }) => {
    if (!senderId || !senderName || !recipientId || !recipientName) {
      set({
        syncError: 'Dados incompletos. Verifique remetente e destinatário.',
      });
      return;
    }

    try {
      set({ syncError: null });

      const messagePayload = {
        channel: 'mail',
        senderId,
        senderName,
        recipientId,
        recipientName,
        subject: subject || 'Sem assunto',
        body,
      };

      // Send to backend REST
      await makeRequest('/chat/send', {
        method: 'POST',
        body: JSON.stringify(messagePayload),
      });

      // Publish to realtime channel
      try {
        const realtimePayload = {
          id: crypto.randomUUID(),
          channel: 'mail',
          senderId,
          senderName,
          recipientId,
          recipientName,
          subject: subject || 'Sem assunto',
          body,
          createdAt: new Date().toISOString(),
          read: false,
          system: false,
        };
        
        // Call backend function to publish
        const response = await fetch('/_functions/publishMailMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            recipientId,
            message: realtimePayload,
          }),
        });
        
        if (!response.ok) {
          console.warn('Falha ao publicar no realtime, mas mensagem foi salva');
        }
      } catch (realtimeError) {
        console.warn('Erro ao publicar realtime:', realtimeError);
      }

      // Fetch updated messages
      await get().fetchMessages('mail');
    } catch (error) {
      console.error('Erro ao enviar correio:', error);
      set({
        syncError: error instanceof Error ? error.message : 'Erro ao enviar correio',
      });
    }
  },

  markMailAsRead: async (messageId) => {
    try {
      set({ syncError: null });

      // backend atual não tem /chat/read/:id
      set((state) => ({
        mailMessages: state.mailMessages.map((msg) =>
          msg.id === messageId ? { ...msg, read: true } : msg
        ),
      }));
    } catch (error) {
      console.error('Erro ao marcar correio como lido:', error);
      set({
        syncError: error instanceof Error ? error.message : 'Erro ao marcar mensagem como lida',
      });
    }
  },

  clearChannel: (channel) => {
    if (channel === 'complexo') {
      set({ complexoMessages: [] });
      return;
    }

    if (channel === 'faccao') {
      set({ faccaoMessages: [] });
      return;
    }

    set({ mailMessages: [] });
  },

  saveChat: () => {
    // backend é a fonte de verdade
  },
}));