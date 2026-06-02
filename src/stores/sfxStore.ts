import { create } from 'zustand';
import { setSfxMuted } from '@/lib/sfx';

type SfxState = {
  muted: boolean;
  toggleMute: () => void;
};

// UI-facing mute toggle. The sfx lib owns the actual flag (so it stays
// React-free); this store mirrors it for the button and pushes changes down
// via setSfxMuted. Subscribed in the two Game screens for the SFX button.
export const useSfxStore = create<SfxState>((set) => ({
  muted: false,
  toggleMute: () =>
    set((s) => {
      const muted = !s.muted;
      setSfxMuted(muted);
      return { muted };
    }),
}));
