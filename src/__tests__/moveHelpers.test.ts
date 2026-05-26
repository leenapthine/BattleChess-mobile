import {
  getSlidingMoves,
  getStepMoves,
  getRookMoves,
  getBishopMoves,
  getQueenMoves,
  getKingMoves,
  getKnightMoves,
  ORTHOGONAL,
  DIAGONAL,
} from '@/engine/helpers/moveHelpers';
import { makePiece, resetIds, hasSquare } from './testHelpers';
import type { Piece } from '@/types/game';

beforeEach(() => resetIds());

describe('getRookMoves', () => {
  it('has full range on empty board', () => {
    const rook = makePiece('Rook', 'White', 3, 3);
    const moves = getRookMoves(rook, [rook]);
    expect(moves.length).toBe(14);
  });

  it('stops at friendly piece', () => {
    const rook = makePiece('Rook', 'White', 0, 0);
    const friendly = makePiece('Pawn', 'White', 0, 3);
    const moves = getRookMoves(rook, [rook, friendly]);
    expect(hasSquare(moves, 0, 1)).toBe(true);
    expect(hasSquare(moves, 0, 2)).toBe(true);
    expect(hasSquare(moves, 0, 3)).toBe(false);
    expect(hasSquare(moves, 0, 4)).toBe(false);
  });

  it('can capture enemy and stops', () => {
    const rook = makePiece('Rook', 'White', 0, 0);
    const enemy = makePiece('Pawn', 'Black', 0, 3);
    const moves = getRookMoves(rook, [rook, enemy]);
    const capture = moves.find(m => m.row === 0 && m.col === 3);
    expect(capture).toBeDefined();
    expect(capture!.color).toBe('capture');
    expect(hasSquare(moves, 0, 4)).toBe(false);
  });
});

describe('getBishopMoves', () => {
  it('has correct range from corner', () => {
    const bishop = makePiece('Bishop', 'White', 0, 0);
    const moves = getBishopMoves(bishop, [bishop]);
    expect(moves.length).toBe(7);
    expect(hasSquare(moves, 7, 7)).toBe(true);
  });

  it('blocked by friendly piece on diagonal', () => {
    const bishop = makePiece('Bishop', 'White', 0, 0);
    const blocker = makePiece('Pawn', 'White', 2, 2);
    const moves = getBishopMoves(bishop, [bishop, blocker]);
    expect(hasSquare(moves, 1, 1)).toBe(true);
    expect(hasSquare(moves, 2, 2)).toBe(false);
    expect(hasSquare(moves, 3, 3)).toBe(false);
  });
});

describe('getQueenMoves', () => {
  it('combines rook and bishop on empty board', () => {
    const queen = makePiece('Queen', 'White', 3, 3);
    const moves = getQueenMoves(queen, [queen]);
    expect(moves.length).toBe(27);
  });
});

describe('getKingMoves', () => {
  it('has 8 moves in center', () => {
    const king = makePiece('King', 'White', 4, 4);
    const moves = getKingMoves(king, [king]);
    expect(moves.length).toBe(8);
  });

  it('has 3 moves in corner', () => {
    const king = makePiece('King', 'White', 0, 0);
    const moves = getKingMoves(king, [king]);
    expect(moves.length).toBe(3);
  });

  it('cannot move onto friendly piece', () => {
    const king = makePiece('King', 'White', 0, 0);
    const friendly = makePiece('Pawn', 'White', 0, 1);
    const moves = getKingMoves(king, [king, friendly]);
    expect(hasSquare(moves, 0, 1)).toBe(false);
  });

  it('can capture adjacent enemy', () => {
    const king = makePiece('King', 'White', 0, 0);
    const enemy = makePiece('Pawn', 'Black', 0, 1);
    const moves = getKingMoves(king, [king, enemy]);
    const capture = moves.find(m => m.row === 0 && m.col === 1);
    expect(capture).toBeDefined();
    expect(capture!.color).toBe('capture');
  });
});

describe('getKnightMoves', () => {
  it('has 8 moves in center of empty board', () => {
    const knight = makePiece('Knight', 'White', 4, 4);
    const moves = getKnightMoves(knight, [knight]);
    expect(moves.length).toBe(8);
  });

  it('has 2 moves from corner', () => {
    const knight = makePiece('Knight', 'White', 0, 0);
    const moves = getKnightMoves(knight, [knight]);
    expect(moves.length).toBe(2);
    expect(hasSquare(moves, 2, 1)).toBe(true);
    expect(hasSquare(moves, 1, 2)).toBe(true);
  });

  it('jumps over pieces', () => {
    const knight = makePiece('Knight', 'White', 0, 0);
    const blocker1 = makePiece('Pawn', 'White', 1, 0);
    const blocker2 = makePiece('Pawn', 'White', 0, 1);
    const moves = getKnightMoves(knight, [knight, blocker1, blocker2]);
    expect(hasSquare(moves, 2, 1)).toBe(true);
    expect(hasSquare(moves, 1, 2)).toBe(true);
  });
});

describe('getStepMoves', () => {
  it('filters out-of-bounds and friendly', () => {
    const piece = makePiece('King', 'White', 0, 0);
    const friendly = makePiece('Pawn', 'White', 1, 0);
    const offsets = [{ row: 1, col: 0 }, { row: 0, col: 1 }, { row: -1, col: 0 }];
    const moves = getStepMoves(piece, [piece, friendly], offsets);
    expect(hasSquare(moves, 1, 0)).toBe(false);
    expect(hasSquare(moves, 0, 1)).toBe(true);
    expect(hasSquare(moves, -1, 0)).toBe(false);
  });
});
