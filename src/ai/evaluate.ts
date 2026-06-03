import type { GameState, Color } from '@/types/game';
import { findKing } from '@/engine/utils';
import { pieceValue } from './pieceValues';

export const WIN_SCORE = 100000;

/**
 * Decisive winner of a position, or null if still playing. Checks the status
 * flag *and* king presence directly — so a king removed by any means (capture,
 * or a NecroPawn blowing up its own king) is always seen as game-over, and the
 * search will never value losing its own king as anything but a loss.
 */
export function terminalWinner(state: GameState): Color | null {
  if (state.status.type === 'won') return state.status.winner;
  if (!findKing('White', state.pieces)) return 'Black';
  if (!findKing('Black', state.pieces)) return 'White';
  return null;
}

/**
 * Score a position from `color`'s point of view (higher = better for `color`).
 * Prototype eval: a decisive ±WIN for a finished game, else material balance.
 * Positional terms (king safety, mobility, ability threats) are next.
 */
export function evaluate(state: GameState, color: Color): number {
  const winner = terminalWinner(state);
  if (winner) return winner === color ? WIN_SCORE : -WIN_SCORE;

  let score = 0;
  for (const piece of state.pieces) {
    const v = pieceValue(piece);
    score += piece.color === color ? v : -v;
  }
  return score;
}
