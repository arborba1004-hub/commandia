import { create } from 'zustand';
import { subscribe } from 'wix-realtime';
import type { ChatMessage, ChatChannelType } from '@/types/chat';

const BACKEND_URL = 'https://comando-backend.onrender.com';
const POLLING_INTERVAL = 3000;
const REQUEST_TIMEOUT_MS = 15000;

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

function mergeUniqueMessages(
  current: ChatMessage[],
  incoming: ChatMessage[]
): ChatMessage[] {
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

      const complexoRaw = results[0].status === 'fulfilled' ? results[0].value : [];
      const faccaoRaw = results[1].status === 'fulfilled' ? results[1].value : [];
      const mailRaw = results[2].status === 'fulfilled' ? results[2].value : [];

      set({
        complexoMessages: normalizeMessages(complexoRaw),
        faccaoMessages: normalizeMessages(faccaoRaw),
        mailMessages: normalizeMessages(mailRaw),
        isLoading: false,
      });

      await get().subscribeToRealtimeChannels();
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
      get().unsubscribeFromRealtimeChannels();

      const complexoUnsub = await subscribe('chat_complexo', (message: any) => {
        if (message?.type === 'chat_message' && message?.channel === 'complexo') {
          const normalized = normalizeMessages([message]);
          set((state) => ({
            complexoMessages: mergeUniqueMessages(state.complexoMessages, normalized),
          }));
        }
      });

      realtimeUnsubscribers.set('chat_complexo', complexoUnsub);

      if (factionId) {
        const faccaoChannel = `chat_faccao_${factionId}`;
        const faccaoUnsub = await subscribe(faccaoChannel, (message: any) => {
          if (message?.type === 'chat_message' && message?.channel === 'faccao') {
            const normalized = normalizeMessages([message]);
            set((state) => ({
              faccaoMessages: mergeUniqueMessages(state.faccaoMessages, normalized),
            }));
          }
        });

        realtimeUnsubscribers.set(faccaoChannel, faccaoUnsub);
      }

      if (userId) {
        const mailChannel = `chat_mail_${userId}`;
        const mailUnsub = await subscribe(mailChannel, (message: any) => {
          if (message?.type === 'chat_message' && message?.channel === 'mail') {
            const normalized = normalizeMessages([message]);
            set((state) => ({
              mailMessages: mergeUniqueMessages(state.mailMessages, normalized),
            }));
          }
        });

        realtimeUnsubscribers.set(mailChannel, mailUnsub);
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
    if (!senderId || !senderName || !factionId) {
      set({
        syncError: 'Dados incompletos. Verifique sua facção e faça login novamente.',
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
    if (!senderId || !senderName || !recipientId || !recipientName) {
      set({
        syncError: 'Dados incompletos. Verifique remetente e destinatário.',
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

      // enquanto o backend ainda não tiver endpoint próprio,
      // mantém atualização local sem quebrar o fluxo
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
    // backend continua sendo a fonte de verdade
  },
}));