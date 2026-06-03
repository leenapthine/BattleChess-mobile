import type { GameState, GameAction, Square, Color } from '@/types/game';
import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { hasSelfClickAbility } from '@/engine/pieceTraits';

export type Turn = {
  // The square-taps that make up this turn, as the exact GameActions the UI
  // would dispatch (so the caller can apply them through the real reducer and
  // get the same animations/effects).
  actions: GameAction[];
  // The board after the whole turn has been played out.
  result: GameState;
};

// A turn is at most this many taps deep. Standard moves are 2 (select + move);
// self-click abilities and multi-step flows need a few more. The cap also
// guarantees the search terminates.
const MAX_TAPS = 5;

/**
 * Enumerate every legal full turn for the side to move, by exploring sequences
 * of square-taps through the *real* engine: each candidate tap is run through
 * `classifyAction` + `gameReducer`, exactly as a human tapping the board would.
 * A turn is complete when control passes to the opponent (or the game ends).
 *
 * This reuses all existing movement/ability/legality logic — the generator
 * never re-implements any rule. It currently finds turns reachable within
 * MAX_TAPS, which covers standard moves/captures and the single-target
 * abilities; the deepest multi-step combos are bounded by the cap.
 */
export function generateTurns(root: GameState): Turn[] {
  if (root.status.type !== 'active') return [];
  const mover = root.currentTurn;
  const results: Turn[] = [];
  const resultKeys = new Set<string>();
  const visited = new Set<string>();

  const stack: { state: GameState; actions: GameAction[] }[] = [
    { state: clearSelection(root), actions: [] },
  ];

  while (stack.length > 0) {
    const node = stack.pop()!;
    const key = stateKey(node.state);
    if (visited.has(key)) continue;
    visited.add(key);

    for (const square of candidateTaps(node.state, mover)) {
      const action = classifyAction(square, node.state);
      // Skip taps that would just drop the current selection — they never
      // advance a turn and only widen the search.
      if (action.type === 'DESELECT') continue;

      const next = gameReducer(node.state, action);
      const actions = [...node.actions, action];

      const turnOver = next.status.type === 'won' || next.currentTurn !== mover;
      if (turnOver) {
        const rk = resultKey(next);
        if (!resultKeys.has(rk)) {
          resultKeys.add(rk);
          results.push({ actions, result: next });
        }
      } else if (actions.length < MAX_TAPS) {
        stack.push({ state: next, actions });
      }
    }
  }

  return results;
}

/** Squares worth tapping from this mid-turn state (never produces a DESELECT). */
function candidateTaps(state: GameState, mover: Color): Square[] {
  // Mid-ability: the ability's own highlights are the targets, plus the
  // selected square itself (some flows re-tap the piece to confirm/detonate).
  if (state.abilityMode.type !== 'none') {
    const taps = state.highlights.map((h) => ({ row: h.row, col: h.col }));
    if (state.selectedSquare) taps.push(state.selectedSquare);
    return taps;
  }

  // A piece is selected: its move/capture/ability targets, plus a self-tap to
  // activate a self-click ability (NecroPawn, DeadLauncher, …).
  if (state.selectedSquare) {
    const taps = state.highlights
      .filter((h) => h.color === 'move' || h.color === 'capture' || h.color === 'ability')
      .map((h) => ({ row: h.row, col: h.col }));
    const sel = state.pieces.find(
      (p) => p.row === state.selectedSquare!.row && p.col === state.selectedSquare!.col,
    );
    if (sel && hasSelfClickAbility(sel.type)) taps.push(state.selectedSquare);
    return taps;
  }

  // Nothing selected: every own piece is a candidate to select.
  return state.pieces
    .filter((p) => p.color === mover)
    .map((p) => ({ row: p.row, col: p.col }));
}

function clearSelection(state: GameState): GameState {
  if (!state.selectedSquare && state.abilityMode.type === 'none' && state.highlights.length === 0) {
    return state;
  }
  return { ...state, selectedSquare: null, highlights: [], abilityMode: { type: 'none' } };
}

// Identity of a mid-turn search node (what a further tap can depend on).
function stateKey(s: GameState): string {
  return `${s.currentTurn}|${s.selectedSquare ? `${s.selectedSquare.row},${s.selectedSquare.col}` : '-'}|${s.abilityMode.type}|${piecesKey(s)}`;
}

// Identity of a finished turn's board (for deduping turns that reach the same
// position by different tap orders).
function resultKey(s: GameState): string {
  return `${s.status.type}|${s.currentTurn}|${piecesKey(s)}`;
}

function piecesKey(s: GameState): string {
  return s.pieces
    .map((p) => `${p.id}:${p.type}:${p.color}:${p.row},${p.col}:${p.isStone ? 1 : 0}`)
    .sort()
    .join(';');
}
