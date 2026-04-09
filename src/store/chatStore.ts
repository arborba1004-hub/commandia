import { create } from 'zustand';
import type { ChatMessage, ChatChannelType } from '@/types/chat';

const BACKEND_URL = 'https://comando-backend.onrender.com';
const POLLING_INTERVAL = 3000;
const REQUEST_TIMEOUT_MS = 15000;

let chatPollingInterval: ReturnType<typeof setInterval> | null = null;

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
  resetChatState: () => void;
};

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

function createTimeoutSignal(timeoutMs: number): AbortController {
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

async function safeReadJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Sem token de autenticação');
  }

  const controller = createTimeoutSignal(REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
      cache: 'no-store',
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(`Tempo limite excedido em ${endpoint}`);
    }
    throw new Error(`Falha de conexão em ${endpoint}`);
  }

  const data = await safeReadJson(response);

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      `Erro na requisição do chat (${response.status})`;

    throw new Error(message);
  }

  return data as T;
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

function mergeUniqueMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const map = new Map<string, ChatMessage>();

  for (const msg of current) {
    if (msg?.id) {
      map.set(String(msg.id), msg);
    }
  }

  for (const msg of incoming) {
    if (msg?.id) {
      map.set(String(msg.id), msg);
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return aTime - bTime;
  });
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
    set({
      currentUserId: userId,
      currentFactionId: factionId || null,
    });
  },

  fetchMessages: async (channel) => {
    const selectedChannel = channel || get().activeChannel;

    try {
      set({ isLoading: true, syncError: null });

      const raw = await makeRequest<any[]>(
        `/chat/messages?channel=${selectedChannel}`
      );

      const messages = normalizeMessages(raw || []);

      if (selectedChannel === 'complexo') {
        set((state) => ({
          complexoMessages: mergeUniqueMessages(state.complexoMessages, messages),
          isLoading: false,
        }));
        return;
      }

      if (selectedChannel === 'faccao') {
        set((state) => ({
          faccaoMessages: mergeUniqueMessages(state.faccaoMessages, messages),
          isLoading: false,
        }));
        return;
      }

      set((state) => ({
        mailMessages: mergeUniqueMessages(state.mailMessages, messages),
        isLoading: false,
      }));
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
    const { currentFactionId, currentUserId } = get();

    if (!token) {
      set({
        isLoading: false,
        syncError: 'Autenticação necessária para carregar chat',
      });
      return;
    }

    try {
      set({ isLoading: true, syncError: null });

      const requests: Promise<any[]>[] = [makeRequest<any[]>('/chat/messages?channel=complexo')];

      if (currentFactionId) {
        requests.push(makeRequest<any[]>('/chat/messages?channel=faccao'));
      }

      if (currentUserId) {
        requests.push(makeRequest<any[]>('/chat/messages?channel=mail'));
      }

      const results = await Promise.allSettled(requests);

      const complexoRaw = results[0]?.status === 'fulfilled' ? results[0].value : [];
      const faccaoRaw =
        currentFactionId && results[1]?.status === 'fulfilled' ? results[1].value : [];
      const mailRaw =
        currentUserId &&
        results[results.length - 1]?.status === 'fulfilled' &&
        (currentFactionId || !currentFactionId)
          ? results[results.length - 1].value
          : [];

      set({
        complexoMessages: normalizeMessages(complexoRaw),
        faccaoMessages: normalizeMessages(faccaoRaw),
        mailMessages: normalizeMessages(mailRaw),
        isLoading: false,
      });

      // Start polling for message updates
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
    const { currentFactionId, currentUserId } = get();

    if (!token) return;

    if (chatPollingInterval) {
      clearInterval(chatPollingInterval);
    }

    chatPollingInterval = setInterval(() => {
      void get().fetchMessages('complexo');

      if (currentFactionId) {
        void get().fetchMessages('faccao');
      }

      if (currentUserId) {
        void get().fetchMessages('mail');
      }
    }, POLLING_INTERVAL);
  },

  stopChatPolling: () => {
    if (chatPollingInterval) {
      clearInterval(chatPollingInterval);
      chatPollingInterval = null;
    }
  },

  sendComplexoMessage: async ({ senderId, senderName, body }) => {
    if (!senderId || !senderName || !body.trim()) {
      set({
        syncError: 'Mensagem inválida ou dados do jogador ausentes.',
      });
      return;
    }

    try {
      set({ syncError: null });

      await makeRequest('/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          channel: 'complexo',
          senderId,
          senderName,
          body: body.trim(),
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
    if (!senderId || !senderName || !factionId || !body.trim()) {
      set({
        syncError: 'Dados incompletos. Verifique sua facção e a mensagem.',
      });
      return;
    }

    try {
      set({ syncError: null });

      await makeRequest('/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          channel: 'faccao',
          senderId,
          senderName,
          factionId,
          body: body.trim(),
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
    if (!senderId || !senderName || !recipientId || !recipientName || !body.trim()) {
      set({
        syncError: 'Dados incompletos. Verifique remetente, destinatário e mensagem.',
      });
      return;
    }

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
          subject: subject?.trim() || 'Sem assunto',
          body: body.trim(),
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

  resetChatState: () => {
    get().stopChatPolling();

    set({
      complexoMessages: [],
      faccaoMessages: [],
      mailMessages: [],
      activeChannel: 'complexo',
      isLoading: false,
      syncError: null,
      currentUserId: null,
      currentFactionId: null,
    });
  },
}));