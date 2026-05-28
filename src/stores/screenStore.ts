import { create } from 'zustand';
import type { ArmyConfig } from '@/types/army';

export type AppScreen =
  | { type: 'lobby' }
  | { type: 'pointCap'; mode: 'local' | 'online' }
  | { type: 'waitingRoom'; gameId: string }
  | { type: 'armyBuilder'; player: 1 | 2; pointCap: number; player1Army?: ArmyConfig }
  | { type: 'handoff'; pointCap: number; player1Army: ArmyConfig }
  | { type: 'game'; player1Army: ArmyConfig; player2Army: ArmyConfig }
  | { type: 'onlineArmyBuilder'; gameId: string }
  | { type: 'onlineGame'; gameId: string };

type ScreenState = {
  screen: AppScreen;
  goTo: (screen: AppScreen) => void;
  resetToLobby: () => void;
};

export const useScreenStore = create<ScreenState>((set) => ({
  screen: { type: 'lobby' },
  goTo: (screen) => set({ screen }),
  resetToLobby: () => set({ screen: { type: 'lobby' } }),
}));
