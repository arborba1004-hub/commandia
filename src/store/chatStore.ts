import { create } from 'zustand';

export type ChatChannelType = 'complexo' | 'faccao' | 'mail';

export type ChatMessageType =
  | 'text'
  | 'faction_help_request'
  | 'faction_help_update';

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
  messageType?: ChatMessageType;
  metadata?: Record<string, any>;
};

export type FactionHelpRequest = {
  id: string;
  factionId: string;
  requesterId: string;
  requesterName: string;
  message: string;
  helpCount: number;
  maxHelps: number;
  helperIds: string[];
  rewardPerHelp: number;
  totalRewardGranted: number;
  status: 'active' | 'completed' | 'expired';
  requestDate: string;
  createdAtIso: string;
  completedAtIso?: string;
};

const BACKEND_URL = 'https://comando-backend.onrender.com';
const POLLING_INTERVAL = 3000;

let chatPollingInterval: ReturnType<typeof setInterval> | null = null;

function getAuthToken(): string | null {
  const candidates = [
    localStorage.getItem('authToken'),
    localStorage.getItem('token'),
    localStorage.getItem('jwt'),
    localStorage.getItem('wix_auth_token'),
  ];

  for (const token of candidates) {
    if (token && token.trim()) {
      return token.trim();
    }
  }

  return null;
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

function areMessagesEqual(a: ChatMessage[], b: ChatMessage[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i += 1) {
    const ma = a[i];
    const mb = b[i];

    if (
      ma.id !== mb.id ||
      ma.read !== mb.read ||
      ma.body !== mb.body ||
      ma.subject !== mb.subject ||
      ma.createdAt !== mb.createdAt ||
      ma.messageType !== mb.messageType ||
      JSON.stringify(ma.metadata || {}) !== JSON.stringify(mb.metadata || {})
    ) {
      return false;
    }
  }

  return true;
}

function areHelpRequestsEqual(a: FactionHelpRequest[], b: FactionHelpRequest[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i += 1) {
    const ra = a[i];
    const rb = b[i];

    if (
      ra.id !== rb.id ||
      ra.helpCount !== rb.helpCount ||
      ra.status !== rb.status ||
      ra.totalRewardGranted !== rb.totalRewardGranted ||
      ra.completedAtIso !== rb.completedAtIso ||
      JSON.stringify(ra.helperIds || []) !== JSON.stringify(rb.helperIds || [])
    ) {
      return false;
    }
  }

  return true;
}

type ChatStore = {
  complexoMessages: ChatMessage[];
  faccaoMessages: ChatMessage[];
  mailMessages: ChatMessage[];

  factionHelpRequests: FactionHelpRequest[];

  activeChannel: ChatChannelType;

  isLoading: boolean;
  isSending: boolean;
  isHelpingRequest: boolean;
  syncError: string | null;

  setActiveChannel: (channel: ChatChannelType) => void;

  fetchMessages: (channel?: ChatChannelType, silent?: boolean) => Promise<void>;
  fetchFactionHelpRequests: (silent?: boolean) => Promise<void>;
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

  createFactionHelpRequest: (payload?: { message?: string }) => Promise<boolean>;
  helpFactionRequest: (requestId: string) => Promise<boolean>;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  complexoMessages: [],
  faccaoMessages: [],
  mailMessages: [],
  factionHelpRequests: [],

  activeChannel: 'complexo',

  isLoading: false,
  isSending: false,
  isHelpingRequest: false,
  syncError: null,

  setActiveChannel: (channel) => set({ activeChannel: channel }),

  fetchMessages: async (channel, silent = false) => {
    const currentChannel = channel || get().activeChannel;

    try {
      if (!silent) {
        set({ isLoading: true, syncError: null });
      }

      const messages = await chatRequest<ChatMessage[]>(
        `/chat/messages?channel=${encodeURIComponent(currentChannel)}`,
        { method: 'GET' }
      );

      set((state) => {
        if (currentChannel === 'complexo') {
          if (areMessagesEqual(state.complexoMessages, messages)) {
            return silent ? {} : { isLoading: false };
          }

          return {
            complexoMessages: messages,
            ...(silent ? {} : { isLoading: false }),
          };
        }

        if (currentChannel === 'faccao') {
          if (areMessagesEqual(state.faccaoMessages, messages)) {
            return silent ? {} : { isLoading: false };
          }

          return {
            faccaoMessages: messages,
            ...(silent ? {} : { isLoading: false }),
          };
        }

        if (areMessagesEqual(state.mailMessages, messages)) {
          return silent ? {} : { isLoading: false };
        }

        return {
          mailMessages: messages,
          ...(silent ? {} : { isLoading: false }),
        };
      });

      if (!silent) {
        set({ isLoading: false });
      }
    } catch (error) {
      set({
        ...(silent ? {} : { isLoading: false }),
        syncError: error instanceof Error ? error.message : 'Erro ao buscar mensagens',
      });
    }
  },

  fetchFactionHelpRequests: async (silent = false) => {
    try {
      const response = await chatRequest<{ requests: FactionHelpRequest[] }>(
        '/faction-help/list',
        { method: 'GET' }
      );

      const requests = Array.isArray(response?.requests) ? response.requests : [];

      set((state) => {
        if (areHelpRequestsEqual(state.factionHelpRequests, requests)) {
          return {};
        }

        return {
          factionHelpRequests: requests,
          ...(silent ? {} : { syncError: null }),
        };
      });
    } catch (error) {
      if (!silent) {
        set({
          syncError:
            error instanceof Error ? error.message : 'Erro ao buscar pedidos de corre',
        });
      }
    }
  },

  loadChat: async () => {
    try {
      set({ isLoading: true, syncError: null });

      await Promise.all([
        get().fetchMessages('complexo', true),
        get().fetchMessages('faccao', true),
        get().fetchMessages('mail', true),
        get().fetchFactionHelpRequests(true),
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

    chatPollingInterval = setInterval(() => {
      get().fetchMessages('complexo', true);
      get().fetchMessages('faccao', true);
      get().fetchMessages('mail', true);
      get().fetchFactionHelpRequests(true);
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

      await get().fetchMessages('complexo', true);
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

      await get().fetchMessages('faccao', true);
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

      await get().fetchMessages('mail', true);
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

  createFactionHelpRequest: async (payload = {}) => {
    try {
      set({ isHelpingRequest: true, syncError: null });

      await chatRequest<{ success: boolean; request: FactionHelpRequest }>(
        '/faction-help/request',
        {
          method: 'POST',
          body: JSON.stringify({
            message: String(payload.message || '').trim(),
          }),
        }
      );

      await Promise.all([
        get().fetchMessages('faccao', true),
        get().fetchFactionHelpRequests(true),
      ]);

      set({ isHelpingRequest: false });
      return true;
    } catch (error) {
      set({
        isHelpingRequest: false,
        syncError:
          error instanceof Error ? error.message : 'Erro ao criar pedido de corre',
      });
      return false;
    }
  },

  helpFactionRequest: async (requestId) => {
    const id = String(requestId || '').trim();
    if (!id) return false;

    try {
      set({ isHelpingRequest: true, syncError: null });

      await chatRequest<{ success: boolean; request: FactionHelpRequest }>(
        `/faction-help/help/${encodeURIComponent(id)}`,
        {
          method: 'POST',
        }
      );

      await Promise.all([
        get().fetchMessages('faccao', true),
        get().fetchFactionHelpRequests(true),
      ]);

      set({ isHelpingRequest: false });
      return true;
    } catch (error) {
      set({
        isHelpingRequest: false,
        syncError:
          error instanceof Error ? error.message : 'Erro ao ajudar pedido de corre',
      });
      return false;
    }
  },
}));