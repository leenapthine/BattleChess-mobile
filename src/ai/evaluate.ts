import type { GameState, Color } from '@/types/game';
import { pieceValue } from './pieceValues';

/**
 * Score a position from `color`'s point of view (higher = better for `color`).
 * Prototype eval: material balance plus a decisive bonus/penalty for a
 * finished game. Positional terms (king safety, mobility, ability threats)
 * are the obvious next additions.
 */
export function evaluate(state: GameState, color: Color): number {
  if (state.status.type === 'won') {
    return state.status.winner === color ? WIN_SCORE : -WIN_SCORE;
  }

  let score = 0;
  for (const piece of state.pieces) {
    const v = pieceValue(piece);
    score += piece.color === color ? v : -v;
  }
  return score;
}

export const WIN_SCORE = 100000;
