import { create } from 'zustand';
import {
  listOpenGames,
  listActiveGames,
  getGame,
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
  liveGames: GameRow[];
  currentGame: GameRow | null;
  // True when currentGame is being watched (not played). Read by App to pick
  // the spectate screen and to keep the spectator's UI read-only.
  isSpectating: boolean;
  loading: boolean;
  lobbyUnsub: (() => void) | null;
  gameUnsub: (() => void) | null;

  fetchOpenGames: () => Promise<void>;
  fetchLiveGames: () => Promise<void>;
  startLobbySubscription: () => void;
  stopLobbySubscription: () => void;

  createGame: (hostId: string, hostName: string, pointCap: number, timePerTurnSeconds: number | null) => Promise<GameRow>;
  joinGame: (gameId: string, guestId: string, guestName: string) => Promise<GameRow>;
  cancelGame: (gameId: string) => Promise<void>;
  spectate: (gameId: string) => Promise<GameRow | null>;
  exitSpectate: () => void;
  restoreMyGame: (userId: string) => Promise<GameRow | null>;
  setCurrentGame: (row: GameRow | null) => void;
  startGameSubscription: (gameId: string) => void;
  stopGameSubscription: () => void;
};

export const useGamesStore = create<GamesState>((set, get) => ({
  openGames: [],
  liveGames: [],
  currentGame: null,
  isSpectating: false,
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

  fetchLiveGames: async () => {
    try {
      const liveGames = await listActiveGames();
      set({ liveGames });
    } catch (err) {
      console.error('fetchLiveGames failed', err);
    }
  },

  startLobbySubscription: () => {
    const existing = get().lobbyUnsub;
    if (existing) existing();
    const unsub = subscribeToLobby(() => {
      get().fetchOpenGames();
      get().fetchLiveGames();
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
    set({ currentGame: game, isSpectating: false });
    return game;
  },

  joinGame: async (gameId, guestId, guestName) => {
    const game = await apiJoinGame(gameId, guestId, guestName);
    set({ currentGame: game, isSpectating: false });
    return game;
  },

  cancelGame: async (gameId) => {
    await apiCancelGame(gameId);
    set({ currentGame: null, isSpectating: false });
  },

  // Open a game as a read-only spectator: load the row and flag spectating.
  // Does NOT join (no guest_id write) — the watcher never becomes a player.
  spectate: async (gameId) => {
    const game = await getGame(gameId);
    if (game) set({ currentGame: game, isSpectating: true });
    return game;
  },

  exitSpectate: () => set({ currentGame: null, isSpectating: false }),

  restoreMyGame: async (userId) => {
    try {
      await cleanupMyOrphans(userId);
      const game = await findMyActiveGame(userId);
      if (game) set({ currentGame: game, isSpectating: false });
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
