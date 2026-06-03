import { chooseTurn, DIFFICULTIES } from '@/ai/chooseTurn';
import { gameReducer } from '@/engine/gameReducer';
import { makePiece, makeState, resetIds } from '../testHelpers';

function applyTurn(state: ReturnType<typeof makeState>, actions: ReturnType<typeof chooseTurn>) {
  let s = state;
  for (const a of actions!) s = gameReducer(s, a);
  return s;
}

describe('chooseTurn', () => {
  it('grabs a hanging piece (greedy, depth 1)', () => {
    resetIds();
    // Rook's only capture is the queen on its rank: its file is blocked by the
    // friendly king and the black king is out of reach, so there's no better
    // move (a king capture would otherwise win outright).
    const state = makeState(
      [
        makePiece('Rook', 'White', 0, 0),
        makePiece('King', 'White', 7, 0),
        makePiece('Queen', 'Black', 0, 5), // free along the rank
        makePiece('King', 'Black', 7, 7),
      ],
      { currentTurn: 'White' },
    );

    const actions = chooseTurn(state, DIFFICULTIES.easy);
    expect(actions).not.toBeNull();
    const after = applyTurn(state, actions);
    expect(after.pieces.some((p) => p.type === 'Queen' && p.color === 'Black')).toBe(false);
  });

  it('never sacrifices into its own king (NecroPawn blast guard)', () => {
    resetIds();
    // The NecroPawn's blast would catch the adjacent friendly king (and an
    // enemy pawn). Detonating loses the game, so the bot must do anything else.
    const state = makeState(
      [
        makePiece('NecroPawn', 'White', 1, 1),
        makePiece('King', 'White', 1, 2),  // adjacent → in the blast
        makePiece('Pawn', 'Black', 0, 0),  // also adjacent
        makePiece('King', 'Black', 7, 7),
      ],
      { currentTurn: 'White' },
    );

    const after = applyTurn(state, chooseTurn(state, DIFFICULTIES.normal));
    // White king survives — the bot didn't blow itself up.
    expect(after.pieces.some((p) => p.type === 'King' && p.color === 'White')).toBe(true);
  });

  it('returns null when there are no legal turns', () => {
    resetIds();
    const state = makeState([makePiece('King', 'White', 0, 0)], {
      status: { type: 'won', winner: 'Black' },
    });
    expect(chooseTurn(state, DIFFICULTIES.normal)).toBeNull();
  });

  it('looks ahead and declines a defended pawn (depth 2)', () => {
    resetIds();
    // White's only capture is the pawn at (4,6), but a black rook on the same
    // file recaptures the queen. Greedy (depth 1) grabs the pawn; a 2-ply
    // search sees the queen loss and leaves the pawn alone.
    const state = makeState(
      [
        makePiece('Queen', 'White', 4, 4),
        makePiece('King', 'White', 0, 0),
        makePiece('Pawn', 'Black', 4, 6),
        makePiece('Rook', 'Black', 0, 6), // defends (4,6) down the file
        makePiece('King', 'Black', 7, 0),
      ],
      { currentTurn: 'White' },
    );

    const after = applyTurn(state, chooseTurn(state, DIFFICULTIES.normal));
    // The pawn survives — the bot didn't take the poisoned capture.
    expect(after.pieces.some((p) => p.type === 'Pawn' && p.color === 'Black')).toBe(true);
  });
});
