import { create } from 'zustand';
import {
  listOpenGames,
  createGame as apiCreateGame,
  joinGame as apiJoinGame,
  cancelGame as apiCancelGame,
  findMyActiveGame,
  cleanupMyOrphans,
  subscribeToLobby,
  subscribeToGame,
  type GameRow,
} from '@/lib/games';

type GamesState = {
  openGames: GameRow[];
  currentGame: GameRow | null;
  loading: boolean;
  lobbyUnsub: (() => void) | null;
  gameUnsub: (() => void) | null;

  fetchOpenGames: () => Promise<void>;
  startLobbySubscription: () => void;
  stopLobbySubscription: () => void;

  createGame: (hostId: string, hostName: string, pointCap: number, timePerTurnSeconds: number | null) => Promise<GameRow>;
  joinGame: (gameId: string, guestId: string, guestName: string) => Promise<GameRow>;
  cancelGame: (gameId: string) => Promise<void>;
  restoreMyGame: (userId: string) => Promise<GameRow | null>;
  setCurrentGame: (row: GameRow | null) => void;
  startGameSubscription: (gameId: string) => void;
  stopGameSubscription: () => void;
};

export const useGamesStore = create<GamesState>((set, get) => ({
  openGames: [],
  currentGame: null,
  loading: false,
  lobbyUnsub: null,
  gameUnsub: null,

  fetchOpenGames: async () => {
    set({ loading: true });
    try {
      const openGames = await listOpenGames();
      set({ openGames, loading: false });
    } catch (err) {
      console.error('fetchOpenGames failed', err);
      set({ loading: false });
    }
  },

  startLobbySubscription: () => {
    const existing = get().lobbyUnsub;
    if (existing) existing();
    const unsub = subscribeToLobby(() => {
      get().fetchOpenGames();
    });
    set({ lobbyUnsub: unsub });
  },

  stopLobbySubscription: () => {
    const unsub = get().lobbyUnsub;
    if (unsub) unsub();
    set({ lobbyUnsub: null });
  },

  createGame: async (hostId, hostName, pointCap, timePerTurnSeconds) => {
    const game = await apiCreateGame(hostId, hostName, pointCap, timePerTurnSeconds);
    set({ currentGame: game });
    return game;
  },

  joinGame: async (gameId, guestId, guestName) => {
    const game = await apiJoinGame(gameId, guestId, guestName);
    set({ currentGame: game });
    return game;
  },

  cancelGame: async (gameId) => {
    await apiCancelGame(gameId);
    set({ currentGame: null });
  },

  restoreMyGame: async (userId) => {
    try {
      await cleanupMyOrphans(userId);
      const game = await findMyActiveGame(userId);
      if (game) set({ currentGame: game });
      return game;
    } catch (err) {
      console.error('restoreMyGame failed', err);
      return null;
    }
  },

  setCurrentGame: (row) => set({ currentGame: row }),

  startGameSubscription: (gameId) => {
    const existing = get().gameUnsub;
    if (existing) existing();
    const unsub = subscribeToGame(gameId, (row) => {
      set({ currentGame: row });
    });
    set({ gameUnsub: unsub });
  },

  stopGameSubscription: () => {
    const unsub = get().gameUnsub;
    if (unsub) unsub();
    set({ gameUnsub: null });
  },
}));
