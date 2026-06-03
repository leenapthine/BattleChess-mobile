import type { GameState, GameAction, Color } from '@/types/game';
import { generateTurns } from './generateTurns';
import { evaluate, terminalWinner, WIN_SCORE } from './evaluate';

export type Difficulty = {
  // How many plies (half-moves) to search. 1 = greedy (grab the best
  // immediate position); 2 = also account for the opponent's best reply.
  depth: number;
};

export const DIFFICULTIES: Record<'easy' | 'normal', Difficulty> = {
  easy: { depth: 1 },
  normal: { depth: 2 },
};

/**
 * Pick a turn for the side to move and return the tap-actions that play it
 * (apply them through the real reducer). Returns null when there are no legal
 * turns. Uses negamax with alpha-beta pruning over `generateTurns`.
 */
export function chooseTurn(state: GameState, difficulty: Difficulty): GameAction[] | null {
  const mover = state.currentTurn;
  const turns = generateTurns(state);
  if (turns.length === 0) return null;

  // Order by immediate eval so alpha-beta prunes hard, and so depth-1 (greedy)
  // is effectively a sorted pick.
  const scored = turns
    .map((t) => ({ turn: t, score: evaluate(t.result, mover) }))
    .sort((a, b) => b.score - a.score);

  let bestScore = -Infinity;
  const best: GameAction[][] = [];
  let alpha = -Infinity;

  for (const { turn } of scored) {
    const score = -negamax(turn.result, difficulty.depth - 1, -Infinity, -alpha, mover);
    if (score > bestScore) {
      bestScore = score;
      best.length = 0;
      best.push(turn.actions);
    } else if (score === bestScore) {
      best.push(turn.actions);
    }
    if (score > alpha) alpha = score;
  }

  // Random tiebreak so the bot isn't perfectly predictable between equal turns.
  return best[Math.floor(Math.random() * best.length)];
}

// Negamax: value of `state` to whoever is to move in it. `rootColor` is fixed
// only for the terminal/eval sign via the to-move perspective.
function negamax(state: GameState, depth: number, alpha: number, beta: number, _rootColor: Color): number {
  const winner = terminalWinner(state);
  if (winner) {
    // Value to the side to move: +WIN if they've won, -WIN if they've lost
    // (e.g. their own king is gone).
    return winner === state.currentTurn ? WIN_SCORE : -WIN_SCORE;
  }
  if (depth <= 0) {
    return evaluate(state, state.currentTurn);
  }

  const turns = generateTurns(state);
  if (turns.length === 0) {
    // No legal turn — treat as a loss for the side to move (stuck/king gone).
    return -WIN_SCORE;
  }

  // Order children by a quick eval for better pruning.
  const ordered = turns
    .map((t) => ({ t, s: evaluate(t.result, state.currentTurn) }))
    .sort((a, b) => b.s - a.s);

  let value = -Infinity;
  for (const { t } of ordered) {
    value = Math.max(value, -negamax(t.result, depth - 1, -beta, -alpha, _rootColor));
    alpha = Math.max(alpha, value);
    if (alpha >= beta) break;
  }
  return value;
}
