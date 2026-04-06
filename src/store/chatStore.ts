import { create } from 'zustand';
import type { ChatMessage, ChatChannelType } from '@/types/chat';

type ChatStore = {
  complexoMessages: ChatMessage[];
  faccaoMessages: ChatMessage[];
  mailMessages: ChatMessage[];

  activeChannel: ChatChannelType;

  setActiveChannel: (channel: ChatChannelType) => void;

  setComplexoMessages: (messages: ChatMessage[]) => void;
  setFaccaoMessages: (messages: ChatMessage[]) => void;
  setMailMessages: (messages: ChatMessage[]) => void;

  addMessage: (message: ChatMessage) => void;

  sendComplexoMessage: (payload: {
    senderId: string;
    senderName: string;
    body: string;
  }) => void;

  sendFaccaoMessage: (payload: {
    senderId: string;
    senderName: string;
    factionId: string;
    body: string;
  }) => void;

  sendMailMessage: (payload: {
    senderId: string;
    senderName: string;
    recipientId: string;
    recipientName: string;
    subject?: string;
    body: string;
  }) => void;

  markMailAsRead: (messageId: string) => void;

  clearChannel: (channel: ChatChannelType) => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  complexoMessages: [],
  faccaoMessages: [],
  mailMessages: [],

  activeChannel: 'complexo',

  setActiveChannel: (channel) => set({ activeChannel: channel }),

  setComplexoMessages: (messages) => set({ complexoMessages: messages }),
  setFaccaoMessages: (messages) => set({ faccaoMessages: messages }),
  setMailMessages: (messages) => set({ mailMessages: messages }),

  addMessage: (message) => {
    if (message.channel === 'complexo') {
      set((state) => ({
        complexoMessages: [...state.complexoMessages, message],
      }));
      return;
    }

    if (message.channel === 'faccao') {
      set((state) => ({
        faccaoMessages: [...state.faccaoMessages, message],
      }));
      return;
    }

    set((state) => ({
      mailMessages: [...state.mailMessages, message],
    }));
  },

  sendComplexoMessage: ({ senderId, senderName, body }) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      channel: 'complexo',
      senderId,
      senderName,
      body,
      createdAt: new Date().toISOString(),
      read: true,
    };

    get().addMessage(message);
  },

  sendFaccaoMessage: ({ senderId, senderName, factionId, body }) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      channel: 'faccao',
      senderId,
      senderName,
      factionId,
      body,
      createdAt: new Date().toISOString(),
      read: true,
    };

    get().addMessage(message);
  },

  sendMailMessage: ({
    senderId,
    senderName,
    recipientId,
    recipientName,
    subject,
    body,
  }) => {
    const message: ChatMessage = {
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
    };

    get().addMessage(message);
  },

  markMailAsRead: (messageId) => {
    set((state) => ({
      mailMessages: state.mailMessages.map((msg) =>
        msg.id === messageId ? { ...msg, read: true } : msg
      ),
    }));
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
}));