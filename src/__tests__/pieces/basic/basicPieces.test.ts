import { getValidMoves as getPawnMoves } from '@/engine/pieces/Pawn';
import { getValidMoves as getKnightMoves } from '@/engine/pieces/Knight';
import { getValidMoves as getBishopMoves } from '@/engine/pieces/Bishop';
import { getValidMoves as getRookMoves } from '@/engine/pieces/Rook';
import { getValidMoves as getQueenMoves } from '@/engine/pieces/Queen';
import { getValidMoves as getKingMoves } from '@/engine/pieces/King';
import { makePiece, resetIds, hasSquare } from '../../testHelpers';

beforeEach(() => resetIds());

describe('Pawn', () => {
  it('moves 1 forward on empty board', () => {
    const pawn = makePiece('Pawn', 'White', 3, 3);
    const moves = getPawnMoves(pawn, [pawn]);
    expect(hasSquare(moves, 4, 3)).toBe(true);
  });

  it('moves 2 forward when not moved', () => {
    const pawn = makePiece('Pawn', 'White', 1, 3);
    const moves = getPawnMoves(pawn, [pawn]);
    expect(hasSquare(moves, 2, 3)).toBe(true);
    expect(hasSquare(moves, 3, 3)).toBe(true);
  });

  it('cannot move 2 forward when already moved', () => {
    const pawn = makePiece('Pawn', 'White', 2, 3, { hasMoved: true });
    const moves = getPawnMoves(pawn, [pawn]);
    expect(hasSquare(moves, 4, 3)).toBe(false);
  });

  it('captures diagonally', () => {
    const pawn = makePiece('Pawn', 'White', 3, 3);
    const enemy = makePiece('Pawn', 'Black', 4, 4);
    const moves = getPawnMoves(pawn, [pawn, enemy]);
    const capture = moves.find(m => m.row === 4 && m.col === 4);
    expect(capture).toBeDefined();
    expect(capture!.color).toBe('capture');
  });

  it('does not capture diagonally on friendly', () => {
    const pawn = makePiece('Pawn', 'White', 3, 3);
    const friendly = makePiece('Pawn', 'White', 4, 4);
    const moves = getPawnMoves(pawn, [pawn, friendly]);
    expect(hasSquare(moves, 4, 4)).toBe(false);
  });

  it('blocked by piece in front', () => {
    const pawn = makePiece('Pawn', 'White', 1, 3);
    const blocker = makePiece('Pawn', 'Black', 2, 3);
    const moves = getPawnMoves(pawn, [pawn, blocker]);
    expect(hasSquare(moves, 2, 3)).toBe(false);
    expect(hasSquare(moves, 3, 3)).toBe(false);
  });

  it('Black pawn moves in opposite direction', () => {
    const pawn = makePiece('Pawn', 'Black', 6, 3);
    const moves = getPawnMoves(pawn, [pawn]);
    expect(hasSquare(moves, 5, 3)).toBe(true);
    expect(hasSquare(moves, 4, 3)).toBe(true);
  });
});

describe('Knight', () => {
  it('has all 8 L-shape moves from center', () => {
    const knight = makePiece('Knight', 'White', 4, 4);
    const moves = getKnightMoves(knight, [knight]);
    expect(moves).toHaveLength(8);
  });

  it('captures enemy on landing square', () => {
    const knight = makePiece('Knight', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 6, 5);
    const moves = getKnightMoves(knight, [knight, enemy]);
    const capture = moves.find(m => m.row === 6 && m.col === 5);
    expect(capture!.color).toBe('capture');
  });
});

describe('Bishop', () => {
  it('slides diagonally on empty board', () => {
    const bishop = makePiece('Bishop', 'White', 4, 4);
    const moves = getBishopMoves(bishop, [bishop]);
    expect(moves.length).toBe(13);
  });
});

describe('Rook', () => {
  it('slides orthogonally on empty board', () => {
    const rook = makePiece('Rook', 'White', 4, 4);
    const moves = getRookMoves(rook, [rook]);
    expect(moves.length).toBe(14);
  });
});

describe('Queen', () => {
  it('combines rook + bishop on empty board', () => {
    const queen = makePiece('Queen', 'White', 4, 4);
    const moves = getQueenMoves(queen, [queen]);
    expect(moves.length).toBe(27);
  });
});

describe('King', () => {
  it('moves 1 step in all 8 directions from center', () => {
    const king = makePiece('King', 'White', 4, 4);
    const moves = getKingMoves(king, [king]);
    expect(moves).toHaveLength(8);
  });

  it('cannot move onto friendly', () => {
    const king = makePiece('King', 'White', 0, 0);
    const friendly = makePiece('Pawn', 'White', 0, 1);
    const moves = getKingMoves(king, [king, friendly]);
    expect(hasSquare(moves, 0, 1)).toBe(false);
  });
});
