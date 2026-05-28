import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  signInAnonymously,
  signOut,
  getProfile,
  createProfile,
  type Profile,
} from '@/lib/auth';

export type AuthStatus = 'loading' | 'signedOut' | 'needsName' | 'ready';

type AuthState = {
  status: AuthStatus;
  userId: string | null;
  profile: Profile | null;
  init: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  submitDisplayName: (name: string) => Promise<void>;
  _hydrate: (session: Session | null) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  userId: null,
  profile: null,

  init: async () => {
    const { data } = await supabase.auth.getSession();
    await get()._hydrate(data.session);

    supabase.auth.onAuthStateChange((_event, session) => {
      get()._hydrate(session);
    });
  },

  _hydrate: async (session) => {
    if (!session) {
      set({ status: 'signedOut', userId: null, profile: null });
      return;
    }
    try {
      const profile = await getProfile(session.user.id);
      if (profile) {
        set({ status: 'ready', userId: session.user.id, profile });
      } else {
        set({ status: 'needsName', userId: session.user.id, profile: null });
      }
    } catch (err) {
      console.error('hydrate profile failed', err);
      set({ status: 'signedOut', userId: null, profile: null });
    }
  },

  signIn: async () => {
    set({ status: 'loading' });
    try {
      await signInAnonymously();
    } catch (err) {
      console.error('signIn failed', err);
      set({ status: 'signedOut' });
    }
  },

  signOut: async () => {
    await signOut();
    set({ status: 'signedOut', userId: null, profile: null });
  },

  submitDisplayName: async (name) => {
    const { userId, status } = get();
    if (status !== 'needsName' || !userId) return;
    try {
      const profile = await createProfile(userId, name);
      set({ status: 'ready', profile });
    } catch (err) {
      console.error('createProfile failed', err);
    }
  },
}));
