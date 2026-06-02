import { useCallback } from 'react';
import type { Color, WinReason } from '@/types/game';
import { type GameRow, endOnlineGame } from '@/lib/games';
import { winnerOf } from './winnerOf';

/**
 * The resign / timeout handlers for the online game screen. Both end the game
 * by crediting the winner (derived via winnerOf) and writing the win reason.
 * No-ops unless the game is currently active.
 */
export function useOnlineGameActions(currentGame: GameRow | null, userId: string | null) {
  const onResign = useCallback(async () => {
    if (!currentGame || !userId || currentGame.status !== 'active') return;
    // The player who taps Concede loses. Host is White, guest is Black.
    const loserColor: Color = currentGame.host_id === userId ? 'White' : 'Black';
    await endGame(currentGame, loserColor, 'resign');
  }, [currentGame, userId]);

  const onTimeout = useCallback(async (loserColor: Color) => {
    if (!currentGame || currentGame.status !== 'active') return;
    await endGame(currentGame, loserColor, 'timeout');
  }, [currentGame]);

  return { onResign, onTimeout };
}

async function endGame(game: GameRow, loserColor: Color, reason: WinReason) {
  if (!game.game_state) return;
  const { winnerColor, winnerId } = winnerOf(loserColor, game.host_id, game.guest_id);
  if (!winnerId) return;
  try {
    await endOnlineGame(game.id, game.game_state, winnerColor, winnerId, reason);
  } catch (err: any) {
    console.error(`${reason} endOnlineGame failed:`, err?.message ?? err);
  }
}
