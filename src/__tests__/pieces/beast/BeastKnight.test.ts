import { getValidMoves } from '@/engine/pieces/BeastKnight';
import { makePiece, resetIds, hasSquare } from '../../testHelpers';

beforeEach(() => resetIds());

describe('BeastKnight', () => {
  // --- Movement tests ---

  it('has extended 3+1 L-shape', () => {
    const bk = makePiece('BeastKnight', 'White', 4, 4);
    const moves = getValidMoves(bk, [bk]);
    expect(hasSquare(moves, 7, 5)).toBe(true);
    expect(hasSquare(moves, 7, 3)).toBe(true);
    expect(hasSquare(moves, 5, 7)).toBe(true);
    expect(hasSquare(moves, 3, 7)).toBe(true);
  });

  it('does not have standard 2+1 knight squares', () => {
    const bk = makePiece('BeastKnight', 'White', 4, 4);
    const moves = getValidMoves(bk, [bk]);
    expect(hasSquare(moves, 6, 5)).toBe(false);
    expect(hasSquare(moves, 6, 3)).toBe(false);
  });
});
