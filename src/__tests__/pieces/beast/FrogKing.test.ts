import { getValidMoves } from '@/engine/pieces/FrogKing';
import { makePiece, resetIds, hasSquare } from '../../testHelpers';

beforeEach(() => resetIds());

describe('FrogKing', () => {
  // --- Movement tests ---

  it('has king moves plus 2-tile orthogonal hops', () => {
    const fk = makePiece('FrogKing', 'White', 4, 4);
    const moves = getValidMoves(fk, [fk]);
    expect(hasSquare(moves, 6, 4)).toBe(true);
    expect(hasSquare(moves, 2, 4)).toBe(true);
    expect(hasSquare(moves, 4, 6)).toBe(true);
    expect(hasSquare(moves, 4, 2)).toBe(true);
  });

  it('hops can capture enemies', () => {
    const fk = makePiece('FrogKing', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 6, 4);
    const moves = getValidMoves(fk, [fk, enemy]);
    const hop = moves.find(m => m.row === 6 && m.col === 4);
    expect(hop!.color).toBe('capture');
  });

  it('hops jump over intervening pieces', () => {
    const fk = makePiece('FrogKing', 'White', 4, 4);
    const blocker = makePiece('Pawn', 'White', 5, 4);
    const moves = getValidMoves(fk, [fk, blocker]);
    expect(hasSquare(moves, 6, 4)).toBe(true);
  });

  it('no diagonal hops', () => {
    const fk = makePiece('FrogKing', 'White', 4, 4);
    const moves = getValidMoves(fk, [fk]);
    expect(hasSquare(moves, 6, 6)).toBe(false);
    expect(hasSquare(moves, 2, 2)).toBe(false);
  });
});
