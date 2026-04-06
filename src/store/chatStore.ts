import { create } from 'zustand';
import type { ChatMessage, ChatChannelType } from '@/types/chat';

const BACKEND_URL = 'https://comando-backend.onrender.com';
const POLLING_INTERVAL = 3000;

let chatPollingInterval: ReturnType<typeof setInterval> | null = null;

type ChatStore = {
  complexoMessages: ChatMessage[];
  faccaoMessages: ChatMessage[];
  mailMessages: ChatMessage[];

  activeChannel: ChatChannelType;

  isLoading: boolean;
  syncError: string | null;

  setActiveChannel: (channel: ChatChannelType) => void;

  setComplexoMessages: (messages: ChatMessage[]) => void;
  setFaccaoMessages: (messages: ChatMessage[]) => void;
  setMailMessages: (messages: ChatMessage[]) => void;

  fetchMessages: (channel?: ChatChannelType) => Promise<void>;
  loadChat: () => Promise<void>;

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

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
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

  setActiveChannel: (channel) => {
    set({ activeChannel: channel });
    void get().fetchMessages(channel);
  },

  setComplexoMessages: (messages) => set({ complexoMessages: messages }),
  setFaccaoMessages: (messages) => set({ faccaoMessages: messages }),
  setMailMessages: (messages) => set({ mailMessages: messages }),

  fetchMessages: async (channel) => {
    const selectedChannel = channel || get().activeChannel;
    const token = getAuthToken();

    if (!token) return;

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
    if (!token) return;

    try {
      set({ isLoading: true, syncError: null });

      const [c1, c2, c3] = await Promise.all([
        makeRequest<any[]>('/chat/messages?channel=complexo'),
        makeRequest<any[]>('/chat/messages?channel=faccao'),
        makeRequest<any[]>('/chat/messages?channel=mail'),
      ]);

      const complexoMessages = normalizeMessages(c1);
      const faccaoMessages = normalizeMessages(c2);
      const mailMessages = normalizeMessages(c3);

      set({
        complexoMessages,
        faccaoMessages,
        mailMessages,
        isLoading: false,
      });

      get().startChatPolling();
    } catch (error) {
      console.error('Erro ao carregar chat:', error);
      set({
        isLoading: false,
        syncError: error instanceof Error ? error.message : 'Erro ao carregar chat',
      });
    }
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
    try {
      set({ syncError: null });

      await makeRequest('/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          channel: 'complexo',
          senderId,
          senderName,
          body,
        }),
      });

      await get().fetchMessages('complexo');
    } catch (error) {
      console.error('Erro ao enviar mensagem do complexo:', error);
      set({
        syncError: error instanceof Error ? error.message : 'Erro ao enviar mensagem',
      });
    }
  },

  sendFaccaoMessage: async ({ senderId, senderName, factionId, body }) => {
    try {
      set({ syncError: null });

      await makeRequest('/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          channel: 'faccao',
          senderId,
          senderName,
          factionId,
          body,
        }),
      });

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
    try {
      set({ syncError: null });

      await makeRequest('/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          channel: 'mail',
          senderId,
          senderName,
          recipientId,
          recipientName,
          subject: subject || 'Sem assunto',
          body,
        }),
      });

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

      await makeRequest(`/chat/read/${messageId}`, {
        method: 'PATCH',
      });

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