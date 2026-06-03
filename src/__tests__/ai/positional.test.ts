import { sideActivity } from '@/ai/positional';
import { evaluate } from '@/ai/evaluate';
import { pieceValue } from '@/ai/pieceValues';
import { makePiece, makeState, resetIds } from '../testHelpers';

describe('ability-aware positional eval', () => {
  it('counts attacked enemy value as threat', () => {
    resetIds();
    const state = makeState(
      [
        makePiece('Rook', 'White', 0, 0),
        makePiece('Queen', 'Black', 0, 5), // attacked along the rank
        makePiece('King', 'White', 7, 0),
        makePiece('King', 'Black', 7, 7),
      ],
      { currentTurn: 'White' },
    );

    const white = sideActivity(state, 'White');
    const queen = state.pieces.find((p) => p.type === 'Queen')!;
    expect(white.threat).toBeGreaterThanOrEqual(pieceValue(queen));
    expect(white.mobility).toBeGreaterThan(0);
  });

  it('prefers the more active side at equal material', () => {
    resetIds();
    // Same material (a rook + two kings each), but White's rook is centralized
    // and mobile while Black's is boxed into a corner behind its own king.
    const active = makeState(
      [
        makePiece('Rook', 'White', 4, 4),
        makePiece('King', 'White', 7, 4),
        makePiece('Rook', 'Black', 0, 0),
        makePiece('King', 'Black', 1, 0), // blocks the black rook's file
      ],
      { currentTurn: 'White' },
    );

    expect(evaluate(active, 'White')).toBeGreaterThan(0);
  });
});
