import type { GameState, Color } from '@/types/game';
import { findKing } from '@/engine/utils';
import { opponentColor } from '@/engine/pieceTraits';
import { pieceValue } from './pieceValues';
import { sideActivity } from './positional';

export const WIN_SCORE = 100000;
export type EvalFn = (state: GameState, color: Color) => number;

// Positional weights, kept small so material still dominates. They break ties
// toward active, threatening play and let the search value abilities that don't
// change material directly (ranged control, stuns, etc.). Tune via self-play.
//
// NOTE: a richer eval with king-safety + king-tropism terms was tried and
// measured head-to-head at depth 2 — it came out ~50% (no help) and worse when
// weighted up (~43%). So this stays material + threat + mobility; the eval is
// not the cheap lever it looked like. See sim-results / the evalCompare probe.
export const W_THREAT = 0.05;   // per point of enemy value attacked
export const W_MOBILITY = 0.02; // per available move

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
 * Material + ability-aware activity (threat/mobility). The positional pass is
 * the expensive part — it runs only at evaluated leaves, not for move ordering.
 */
export function evaluate(state: GameState, color: Color): number {
  const winner = terminalWinner(state);
  if (winner) return winner === color ? WIN_SCORE : -WIN_SCORE;

  const me = sideActivity(state, color);
  const them = sideActivity(state, opponentColor(color));

  let score = materialScore(state, color);
  score += W_THREAT * (me.threat - them.threat);
  score += W_MOBILITY * (me.mobility - them.mobility);
  return score;
}

/** Cheap material-only balance from `color`'s view. Used for move ordering,
 *  where exact values don't matter — only a rough sort to help alpha-beta. */
export function materialScore(state: GameState, color: Color): number {
  let score = 0;
  for (const piece of state.pieces) {
    const v = pieceValue(piece);
    score += piece.color === color ? v : -v;
  }
  return score;
}
