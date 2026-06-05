import type { GameState, GameAction, Color } from '@/types/game';
import { generateTurns } from './generateTurns';
import { evaluate, materialScore, terminalWinner, WIN_SCORE, type EvalFn } from './evaluate';

export type Difficulty = {
  // How many plies (half-moves) to search. 1 = greedy (grab the best
  // immediate position); 2 = also account for the opponent's best reply.
  // (depth 3 is ~15s/move — too slow for interactive play.)
  depth: number;
  // Chance per turn of playing a *random* legal move instead of the best one,
  // so the easiest level makes beginner mistakes. 0/undefined = always best.
  blunder?: number;
};

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// Only depth 1 and 2 are viable interactively, and depth 2 dominates depth 1
// (~97% in self-play), so the spread is: easy = greedy + frequent blunders,
// medium = clean greedy (depth 1), hard = full 2-ply search.
export const DIFFICULTIES: Record<DifficultyLevel, Difficulty> = {
  easy: { depth: 1, blunder: 0.35 },
  medium: { depth: 1 },
  hard: { depth: 2 },
};

/**
 * Pick a turn for the side to move and return the tap-actions that play it
 * (apply them through the real reducer). Returns null when there are no legal
 * turns. Negamax + alpha-beta over generateTurns.
 */
export function chooseTurn(
  state: GameState,
  difficulty: Difficulty,
  evalFn: EvalFn = evaluate,
): GameAction[] | null {
  const mover = state.currentTurn;
  const turns = generateTurns(state);
  if (turns.length === 0) return null;

  // Easy levels occasionally throw the turn away on a random legal move.
  if (difficulty.blunder && Math.random() < difficulty.blunder) {
    return turns[Math.floor(Math.random() * turns.length)].actions;
  }

  // Order by immediate material so alpha-beta prunes hard, and so depth-1
  // (greedy) is effectively a sorted pick.
  const scored = turns
    .map((t) => ({ turn: t, score: materialScore(t.result, mover) }))
    .sort((a, b) => b.score - a.score);

  let bestScore = -Infinity;
  const best: GameAction[][] = [];
  let alpha = -Infinity;

  for (const { turn } of scored) {
    const score = -negamax(turn.result, difficulty.depth - 1, -Infinity, -alpha, mover, evalFn);
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

// Negamax: value of `state` to whoever is to move in it.
function negamax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  rootColor: Color,
  evalFn: EvalFn,
): number {
  const winner = terminalWinner(state);
  if (winner) {
    // Value to the side to move: +WIN if they've won, -WIN if they've lost
    // (e.g. their own king is gone).
    return winner === state.currentTurn ? WIN_SCORE : -WIN_SCORE;
  }
  if (depth <= 0) {
    return evalFn(state, state.currentTurn);
  }

  const turns = generateTurns(state);
  if (turns.length === 0) {
    // No legal turn — treat as a loss for the side to move (stuck/king gone).
    return -WIN_SCORE;
  }

  // Order children by a cheap material score for better pruning (the full
  // positional eval runs only at the leaves above).
  const ordered = turns
    .map((t) => ({ t, s: materialScore(t.result, state.currentTurn) }))
    .sort((a, b) => b.s - a.s);

  let value = -Infinity;
  for (const { t } of ordered) {
    value = Math.max(value, -negamax(t.result, depth - 1, -beta, -alpha, rootColor, evalFn));
    alpha = Math.max(alpha, value);
    if (alpha >= beta) break;
  }
  return value;
}
