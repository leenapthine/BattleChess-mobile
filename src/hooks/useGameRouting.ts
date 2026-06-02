import { useEffect } from 'react';
import { startGame } from '@/lib/games';
import { createInitialState } from '@/engine/initialBoard';
import { useAuthStore } from '@/stores/authStore';
import { useScreenStore } from '@/stores/screenStore';
import { useGamesStore } from '@/stores/gamesStore';

/**
 * Drives the screen state-machine off the current online game's status:
 * routes participants through waiting room → army select → game (and back to
 * the lobby if the game vanishes), and routes spectators to the spectate
 * screen. Also fires startGame once the host sees both armies submitted.
 * Pure side-effect hook — returns nothing.
 */
export function useGameRouting() {
  const userId = useAuthStore((s) => s.userId);

  const screenType = useScreenStore((s) => s.screen.type);
  const goTo = useScreenStore((s) => s.goTo);
  const resetToLobby = useScreenStore((s) => s.resetToLobby);

  const currentGame = useGamesStore((s) => s.currentGame);
  const isSpectating = useGamesStore((s) => s.isSpectating);
  const setCurrentGame = useGamesStore((s) => s.setCurrentGame);
  const exitSpectate = useGamesStore((s) => s.exitSpectate);

  useEffect(() => {
    if (!currentGame || !userId) return;

    // Spectators follow a separate route — they're never host/guest, so the
    // participant flow below (waiting room, army select) must not apply.
    if (isSpectating) {
      if (currentGame.status === 'active' || currentGame.status === 'finished') {
        if (screenType !== 'spectate') {
          goTo({ type: 'spectate', gameId: currentGame.id });
        }
      } else {
        // Game vanished or reset under us — back to lobby.
        exitSpectate();
        resetToLobby();
      }
      return;
    }

    const isHost = currentGame.host_id === userId;

    if (currentGame.status === 'waiting') {
      if (screenType !== 'waitingRoom') {
        goTo({ type: 'waitingRoom', gameId: currentGame.id });
      }
      return;
    }

    if (currentGame.status === 'army_select') {
      if (screenType !== 'onlineArmyBuilder') {
        goTo({ type: 'onlineArmyBuilder', gameId: currentGame.id });
      }
      if (isHost && currentGame.host_army && currentGame.guest_army && !currentGame.game_state) {
        const initial = createInitialState(currentGame.host_army, currentGame.guest_army);
        startGame(currentGame.id, initial, currentGame.time_per_turn_seconds).catch(err => console.error('startGame failed', err));
      }
      return;
    }

    if (currentGame.status === 'active' || currentGame.status === 'finished') {
      // Both 'active' and 'finished' show the OnlineGameScreen so the win
      // overlay (driven by game_state.status) is visible. The user clicks
      // Main Menu to return to lobby.
      if (screenType !== 'onlineGame') {
        goTo({ type: 'onlineGame', gameId: currentGame.id });
      }
      return;
    }

    if (currentGame.status === 'abandoned') {
      setCurrentGame(null);
      resetToLobby();
    }
  }, [currentGame, userId, isSpectating, screenType, goTo, setCurrentGame, exitSpectate, resetToLobby]);
}
