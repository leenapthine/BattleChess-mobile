import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves } from '@/engine/pieces/YoungWiz';
import { makePiece, makeState, resetIds, hasSquare } from '../../testHelpers';
import type { GameState, Square } from '@/types/game';

beforeEach(() => resetIds());

function tap(state: GameState, square: Square): GameState {
  const action = classifyAction(square, state);
  return gameReducer(state, action);
}

describe('YoungWiz', () => {
  // --- Movement tests ---

  it('has standard pawn moves plus zap capture', () => {
    const yw = makePiece('YoungWiz', 'White', 3, 3);
    const enemy = makePiece('Pawn', 'Black', 4, 3);
    const moves = getValidMoves(yw, [yw, enemy]);
    const zap = moves.find(m => m.row === 4 && m.col === 3);
    expect(zap).toBeDefined();
    expect(zap!.color).toBe('capture');
  });

  it('no zap when square ahead is empty', () => {
    const yw = makePiece('YoungWiz', 'White', 3, 3);
    const moves = getValidMoves(yw, [yw]);
    const forward = moves.find(m => m.row === 4 && m.col === 3);
    expect(forward!.color).toBe('move');
  });

  it('no zap on friendly piece ahead', () => {
    const yw = makePiece('YoungWiz', 'White', 3, 3);
    const ally = makePiece('Pawn', 'White', 4, 3);
    const moves = getValidMoves(yw, [yw, ally]);
    expect(hasSquare(moves, 4, 3)).toBe(false);
  });

  // --- Full tap flow tests ---

  it('clicking enemy ahead zaps without moving', () => {
    const yw = makePiece('YoungWiz', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 5, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([yw, enemy, wk, bk], {
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 5, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 5, col: 4 });
    expect(s1.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    const wiz = s1.pieces.find(p => p.id === yw.id)!;
    expect(wiz.row).toBe(4);
    expect(wiz.col).toBe(4);
  });

  // --- Edge case tests ---

  it('diagonal capture moves the YoungWiz normally', () => {
    const yw = makePiece('YoungWiz', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 5, 5);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([yw, enemy, wk, bk], {
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 5, col: 5, color: 'capture' }],
    });

    const s1 = tap(state, { row: 5, col: 5 });
    expect(s1.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    const wiz = s1.pieces.find(p => p.id === yw.id)!;
    expect(wiz.row).toBe(5);
    expect(wiz.col).toBe(5);
  });

  it('forward move to empty square moves normally', () => {
    const yw = makePiece('YoungWiz', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([yw, wk, bk], {
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 5, col: 4, color: 'move' }],
    });

    const s1 = tap(state, { row: 5, col: 4 });
    const wiz = s1.pieces.find(p => p.id === yw.id)!;
    expect(wiz.row).toBe(5);
    expect(wiz.col).toBe(4);
  });

  it('zap only fires on directly forward square, not diagonal', () => {
    const yw = makePiece('YoungWiz', 'White', 4, 4);
    const diag = makePiece('Pawn', 'Black', 5, 5);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([yw, diag, wk, bk], {
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 5, col: 5, color: 'capture' }],
    });

    const s1 = tap(state, { row: 5, col: 5 });
    const wiz = s1.pieces.find(p => p.id === yw.id)!;
    expect(wiz.row).toBe(5);
    expect(wiz.col).toBe(5);
  });
});
