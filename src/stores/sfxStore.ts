import { create } from 'zustand';

type SfxState = {
  muted: boolean;
  toggleMute: () => void;
};

// Master mute for sound effects. Read outside React via getState() in the
// sfx manager; subscribed in the UI for the toggle button.
export const useSfxStore = create<SfxState>((set) => ({
  muted: false,
  toggleMute: () => set((s) => ({ muted: !s.muted })),
}));
