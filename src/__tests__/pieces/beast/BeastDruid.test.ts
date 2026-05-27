import { getValidMoves } from '@/engine/pieces/BeastDruid';
import { makePiece, resetIds, hasSquare } from '../../testHelpers';

beforeEach(() => resetIds());

describe('BeastDruid', () => {
  // --- Movement tests ---

  it('combines bishop and king moves', () => {
    const bd = makePiece('BeastDruid', 'White', 4, 4);
    const moves = getValidMoves(bd, [bd]);
    expect(hasSquare(moves, 7, 7)).toBe(true);
    expect(hasSquare(moves, 5, 4)).toBe(true);
    expect(hasSquare(moves, 4, 5)).toBe(true);
  });

  it('deduplicates overlapping squares', () => {
    const bd = makePiece('BeastDruid', 'White', 4, 4);
    const moves = getValidMoves(bd, [bd]);
    const keys = moves.map(m => `${m.row},${m.col}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
