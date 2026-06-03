import type { GameState, GameAction, Color } from '@/types/game';
import { generateTurns } from './generateTurns';
import { evaluate, materialScore, terminalWinner, WIN_SCORE } from './evaluate';

export type Difficulty = {
  // How many plies (half-moves) to search. 1 = greedy (grab the best
  // immediate position); 2 = also account for the opponent's best reply.
  depth: number;
  // Extra plies granted to "ability setup" lines (loading a DeadLauncher,
  // etc.) so the search can see the payoff turn. A per-path budget, so it only
  // deepens those rare branches — cost stays bounded.
  extension?: number;
};

export const DIFFICULTIES: Record<'easy' | 'normal', Difficulty> = {
  easy: { depth: 1, extension: 0 },
  normal: { depth: 2, extension: 1 },
};

function loadedCount(state: GameState, color: Color): number {
  let n = 0;
  for (const p of state.pieces) {
    if (p.color === color && (p.pawnLoaded || p.pieceLoaded !== null)) n += 1;
  }
  return n;
}

/**
 * Did this turn newly load/arm one of the mover's pieces (DeadLauncher, Portal)?
 * Such a turn is a *setup* — it spends a turn (and often a pawn) for no immediate
 * gain, with the payoff a turn later. The search extends these branches so the
 * payoff becomes visible; without it a shallow search never invests in them.
 */
export function isSetupTurn(before: GameState, after: GameState, mover: Color): boolean {
  return loadedCount(after, mover) > loadedCount(before, mover);
}

/**
 * Pick a turn for the side to move and return the tap-actions that play it
 * (apply them through the real reducer). Returns null when there are no legal
 * turns. Negamax + alpha-beta over generateTurns, with selective extension of
 * ability-setup lines.
 */
export function chooseTurn(state: GameState, difficulty: Difficulty): GameAction[] | null {
  const mover = state.currentTurn;
  const ext = difficulty.extension ?? 0;
  const turns = generateTurns(state);
  if (turns.length === 0) return null;

  // Order by immediate material so alpha-beta prunes hard, and so depth-1
  // (greedy) is effectively a sorted pick.
  const scored = turns
    .map((t) => ({ turn: t, score: materialScore(t.result, mover) }))
    .sort((a, b) => b.score - a.score);

  let bestScore = -Infinity;
  const best: GameAction[][] = [];
  let alpha = -Infinity;

  for (const { turn } of scored) {
    const extend = ext > 0 && isSetupTurn(state, turn.result, mover) ? 1 : 0;
    const score = -negamax(turn.result, difficulty.depth - 1 + extend, -Infinity, -alpha, mover, ext - extend);
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

// Negamax: value of `state` to whoever is to move in it. `extLeft` is the
// remaining setup-extension budget along this path (strictly decreasing, so the
// search always terminates).
function negamax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  rootColor: Color,
  extLeft: number,
): number {
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

  // Order children by a cheap material score for better pruning (the full
  // positional eval runs only at the leaves above).
  const ordered = turns
    .map((t) => ({ t, s: materialScore(t.result, state.currentTurn) }))
    .sort((a, b) => b.s - a.s);

  let value = -Infinity;
  for (const { t } of ordered) {
    const extend = extLeft > 0 && isSetupTurn(state, t.result, state.currentTurn) ? 1 : 0;
    value = Math.max(
      value,
      -negamax(t.result, depth - 1 + extend, -beta, -alpha, rootColor, extLeft - extend),
    );
    alpha = Math.max(alpha, value);
    if (alpha >= beta) break;
  }
  return value;
}
