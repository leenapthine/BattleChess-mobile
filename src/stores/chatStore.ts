import { create } from 'zustand';
import {
  fetchRecentMessages,
  sendMessage,
  subscribeToChat,
  type ChatMessage,
} from '@/lib/chat';

const IN_MEMORY_CAP = 100;

export type ChatStatus = 'idle' | 'loading' | 'ready' | 'error';

type ChatState = {
  messages: ChatMessage[];
  status: ChatStatus;
  unread: number;
  sending: boolean;
  unsub: (() => void) | null;

  loadInitial: () => Promise<void>;
  send: (userId: string, displayName: string, body: string) => Promise<void>;
  startSubscription: () => void;
  stopSubscription: () => void;
  markRead: () => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  status: 'idle',
  unread: 0,
  sending: false,
  unsub: null,

  loadInitial: async () => {
    set({ status: 'loading' });
    try {
      const msgs = await fetchRecentMessages(50);
      set({ messages: msgs, status: 'ready' });
    } catch (err) {
      console.error('chat loadInitial failed', err);
      set({ status: 'error' });
    }
  },

  send: async (userId, displayName, body) => {
    set({ sending: true });
    try {
      await sendMessage(userId, displayName, body);
    } finally {
      set({ sending: false });
    }
  },

  startSubscription: () => {
    if (get().unsub) return;
    const unsub = subscribeToChat((msg) => {
      const existing = get().messages;
      if (existing.some((m) => m.id === msg.id)) return;
      const next = [...existing, msg].slice(-IN_MEMORY_CAP);
      set({ messages: next, unread: get().unread + 1 });
    });
    set({ unsub });
  },

  stopSubscription: () => {
    const u = get().unsub;
    if (u) u();
    set({ unsub: null });
  },

  markRead: () => {
    if (get().unread !== 0) set({ unread: 0 });
  },
}));
