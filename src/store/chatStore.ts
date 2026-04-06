import { create } from 'zustand';

export type ChatChannel = 'complexo' | 'faccao' | 'mail';

export type ChatMessage = {
  id: string;
  channel: ChatChannel;
  senderId: string;
  senderName: string;
  recipientId?: string;
  recipientName?: string;
  factionId?: string;
  subject?: string;
  body: string;
  createdAt: string;
  read?: boolean;
};

const STORAGE_KEY = 'chat_data';

type ChatStore = {
  activeChannel: ChatChannel;

  complexoMessages: ChatMessage[];
  faccaoMessages: ChatMessage[];
  mailMessages: ChatMessage[];

  setActiveChannel: (c: ChatChannel) => void;

  sendMessage: (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => void;

  loadChat: () => void;
};

function save(state: any) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      complexoMessages: state.complexoMessages,
      faccaoMessages: state.faccaoMessages,
      mailMessages: state.mailMessages,
    })
  );
}

export const useChatStore = create<ChatStore>((set, get) => ({
  activeChannel: 'complexo',

  complexoMessages: [],
  faccaoMessages: [],
  mailMessages: [],

  setActiveChannel: (c) => set({ activeChannel: c }),

  sendMessage: (msg) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    if (msg.channel === 'complexo') {
      set((state) => {
        const newState = {
          complexoMessages: [...state.complexoMessages, newMsg],
        };
        save({ ...state, ...newState });
        return newState;
      });
      return;
    }

    if (msg.channel === 'faccao') {
      set((state) => {
        const newState = {
          faccaoMessages: [...state.faccaoMessages, newMsg],
        };
        save({ ...state, ...newState });
        return newState;
      });
      return;
    }

    set((state) => {
      const newState = {
        mailMessages: [...state.mailMessages, newMsg],
      };
      save({ ...state, ...newState });
      return newState;
    });
  },

  loadChat: () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);

    set({
      complexoMessages: parsed.complexoMessages || [],
      faccaoMessages: parsed.faccaoMessages || [],
      mailMessages: parsed.mailMessages || [],
    });
  },
}));