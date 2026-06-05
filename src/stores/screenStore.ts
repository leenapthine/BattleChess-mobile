import { create } from 'zustand';
import type { ArmyConfig } from '@/types/army';
import type { Difficulty, DifficultyLevel } from '@/ai/chooseTurn';

export type AppScreen =
  | { type: 'lobby' }
  | { type: 'pointCap'; mode: 'local' | 'online' | 'solo' }
  | { type: 'waitingRoom'; gameId: string }
  | { type: 'armyBuilder'; player: 1 | 2; pointCap: number; timePerTurnSeconds: number | null; player1Army?: ArmyConfig; vsAI?: boolean; difficulty?: DifficultyLevel }
  | { type: 'handoff'; pointCap: number; timePerTurnSeconds: number | null; player1Army: ArmyConfig }
  | { type: 'game'; player1Army: ArmyConfig; player2Army: ArmyConfig; timePerTurnSeconds: number | null }
  | { type: 'solo'; humanArmy: ArmyConfig; aiArmy: ArmyConfig; difficulty: Difficulty }
  | { type: 'watch'; whiteArmy: ArmyConfig; blackArmy: ArmyConfig; difficulty: Difficulty }
  | { type: 'onlineArmyBuilder'; gameId: string }
  | { type: 'onlineGame'; gameId: string }
  | { type: 'spectate'; gameId: string };

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
