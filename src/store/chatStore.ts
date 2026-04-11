import { create } from 'zustand';

export type ChatChannelType = 'complexo' | 'faccao' | 'mail';

export type ChatMessage = {
  id: string;
  channel: ChatChannelType;
  senderId: string;
  senderName: string;
  recipientId?: string | null;
  recipientName?: string | null;
  factionId?: string | null;
  subject?: string | null;
  body: string;
  createdAt: string;
  read: boolean;
  system?: boolean;
};

const BACKEND_URL = 'https://comando-backend.onrender.com';
const POLLING_INTERVAL = 3000;

let chatPollingInterval: ReturnType<typeof setInterval> | null = null;

function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

async function chatRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Erro ao comunicar com o chat');
  }

  return data as T;
}

type ChatStore = {
  complexoMessages: ChatMessage[];
  faccaoMessages: ChatMessage[];
  mailMessages: ChatMessage[];

  activeChannel: ChatChannelType;

  isLoading: boolean;
  isSending: boolean;
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
    body: string;
    system?: boolean;
  }) => Promise<boolean>;

  sendFaccaoMessage: (payload: {
    body: string;
    factionId?: string | null;
    system?: boolean;
  }) => Promise<boolean>;

  sendMailMessage: (payload: {
    recipientId: string;
    recipientName: string;
    subject?: string;
    body: string;
    system?: boolean;
  }) => Promise<boolean>;

  markMailAsRead: (messageId: string) => Promise<boolean>;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  complexoMessages: [],
  faccaoMessages: [],
  mailMessages: [],

  activeChannel: 'complexo',

  isLoading: false,
  isSending: false,
  syncError: null,

  setActiveChannel: (channel) => set({ activeChannel: channel }),

  setComplexoMessages: (messages) => set({ complexoMessages: messages }),
  setFaccaoMessages: (messages) => set({ faccaoMessages: messages }),
  setMailMessages: (messages) => set({ mailMessages: messages }),

  fetchMessages: async (channel) => {
    const currentChannel = channel || get().activeChannel;

    try {
      set({ isLoading: true, syncError: null });

      const messages = await chatRequest<ChatMessage[]>(
        `/chat/messages?channel=${encodeURIComponent(currentChannel)}`,
        { method: 'GET' }
      );

      if (currentChannel === 'complexo') {
        set({ complexoMessages: messages });
      } else if (currentChannel === 'faccao') {
        set({ faccaoMessages: messages });
      } else {
        set({ mailMessages: messages });
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        syncError: error instanceof Error ? error.message : 'Erro ao buscar mensagens',
      });
    }
  },

  loadChat: async () => {
    try {
      set({ isLoading: true, syncError: null });

      await Promise.all([
        get().fetchMessages('complexo'),
        get().fetchMessages('faccao'),
        get().fetchMessages('mail'),
      ]);

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        syncError: error instanceof Error ? error.message : 'Erro ao carregar chats',
      });
    }
  },

  startChatPolling: () => {
    if (chatPollingInterval) {
      clearInterval(chatPollingInterval);
    }

    get().loadChat();

    chatPollingInterval = setInterval(() => {
      get().fetchMessages('complexo');
      get().fetchMessages('faccao');
      get().fetchMessages('mail');
    }, POLLING_INTERVAL);
  },

  stopChatPolling: () => {
    if (chatPollingInterval) {
      clearInterval(chatPollingInterval);
      chatPollingInterval = null;
    }
  },

  sendComplexoMessage: async ({ body, system = false }) => {
    const messageBody = String(body || '').trim();
    if (!messageBody) return false;

    try {
      set({ isSending: true, syncError: null });

      await chatRequest<{ message: ChatMessage }>('/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          channel: 'complexo',
          body: messageBody,
          system,
        }),
      });

      await get().fetchMessages('complexo');
      set({ isSending: false });
      return true;
    } catch (error) {
      set({
        isSending: false,
        syncError: error instanceof Error ? error.message : 'Erro ao enviar mensagem',
      });
      return false;
    }
  },

  sendFaccaoMessage: async ({ body, factionId = null, system = false }) => {
    const messageBody = String(body || '').trim();
    if (!messageBody) return false;

    try {
      set({ isSending: true, syncError: null });

      await chatRequest<{ message: ChatMessage }>('/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          channel: 'faccao',
          body: messageBody,
          factionId,
          system,
        }),
      });

      await get().fetchMessages('faccao');
      set({ isSending: false });
      return true;
    } catch (error) {
      set({
        isSending: false,
        syncError: error instanceof Error ? error.message : 'Erro ao enviar mensagem',
      });
      return false;
    }
  },

  sendMailMessage: async ({
    recipientId,
    recipientName,
    subject = '',
    body,
    system = false,
  }) => {
    const messageBody = String(body || '').trim();
    const safeRecipientId = String(recipientId || '').trim();
    const safeRecipientName = String(recipientName || '').trim();

    if (!messageBody || !safeRecipientId || !safeRecipientName) return false;

    try {
      set({ isSending: true, syncError: null });

      await chatRequest<{ message: ChatMessage }>('/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          channel: 'mail',
          recipientId: safeRecipientId,
          recipientName: safeRecipientName,
          subject: String(subject || '').trim(),
          body: messageBody,
          system,
        }),
      });

      await get().fetchMessages('mail');
      set({ isSending: false });
      return true;
    } catch (error) {
      set({
        isSending: false,
        syncError: error instanceof Error ? error.message : 'Erro ao enviar correio',
      });
      return false;
    }
  },

  markMailAsRead: async (messageId) => {
    const id = String(messageId || '').trim();
    if (!id) return false;

    try {
      set({ syncError: null });

      await chatRequest<{ success: boolean; message: ChatMessage }>(
        `/chat/messages/${encodeURIComponent(id)}/read`,
        {
          method: 'PATCH',
        }
      );

      set((state) => ({
        mailMessages: state.mailMessages.map((message) =>
          message.id === id ? { ...message, read: true } : message
        ),
      }));

      return true;
    } catch (error) {
      set({
        syncError:
          error instanceof Error ? error.message : 'Erro ao marcar correio como lido',
      });
      return false;
    }
  },
}));