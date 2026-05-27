import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, performConvert } from '@/engine/pieces/HellKing';
import { makePiece, makeState, resetIds } from '../../testHelpers';
import type { GameState, Square } from '@/types/game';

beforeEach(() => resetIds());

function tap(state: GameState, square: Square): GameState {
  const action = classifyAction(square, state);
  return gameReducer(state, action);
}

describe('HellKing', () => {
  // --- Movement tests ---

  it('moves like a king', () => {
    const hk = makePiece('HellKing', 'Black', 4, 4);
    expect(getValidMoves(hk, [hk])).toHaveLength(8);
  });

  // --- Unit function tests ---

  it('performConvert flips enemy color without moving king', () => {
    const hk = makePiece('HellKing', 'Black', 4, 4);
    const enemy = makePiece('Rook', 'White', 4, 5);
    const state = makeState([hk, enemy], { currentTurn: 'Black' });
    const result = performConvert(hk, { row: 4, col: 5 }, state);
    const converted = result.pieces.find(p => p.id === enemy.id)!;
    expect(converted.color).toBe('Black');
    expect(converted.type).toBe('Rook');
    const king = result.pieces.find(p => p.id === hk.id)!;
    expect(king.row).toBe(4);
    expect(king.col).toBe(4);
  });

  it('performConvert respects isStone', () => {
    const hk = makePiece('HellKing', 'Black', 4, 4);
    const stoned = makePiece('Rook', 'White', 4, 5, { isStone: true });
    const state = makeState([hk, stoned], { currentTurn: 'Black' });
    const result = performConvert(hk, { row: 4, col: 5 }, state);
    expect(result.pieces.find(p => p.id === stoned.id)!.color).toBe('White');
  });

  // --- Full tap flow tests ---

  it('moving onto enemy converts instead of capturing', () => {
    const hk = makePiece('HellKing', 'Black', 4, 4);
    const enemy = makePiece('Pawn', 'White', 3, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const state = makeState([hk, enemy, wk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 3, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 4 });
    const converted = s1.pieces.find(p => p.id === enemy.id);
    expect(converted).toBeDefined();
    expect(converted!.color).toBe('Black');
  });

  // --- Edge case tests ---

  it('HellKing stays in place after convert', () => {
    const hk = makePiece('HellKing', 'Black', 4, 4);
    const enemy = makePiece('Pawn', 'White', 3, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const state = makeState([hk, enemy, wk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 3, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 4 });
    const king = s1.pieces.find(p => p.id === hk.id)!;
    expect(king.row).toBe(4);
    expect(king.col).toBe(4);
  });

  it('cannot convert a stone piece', () => {
    const hk = makePiece('HellKing', 'Black', 4, 4);
    const stoned = makePiece('Pawn', 'White', 3, 4, { isStone: true });
    const wk = makePiece('King', 'White', 0, 0);
    const state = makeState([hk, stoned, wk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 3, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 4 });
    const target = s1.pieces.find(p => p.id === stoned.id)!;
    expect(target.color).toBe('White');
  });

  it('converted piece retains its type and properties', () => {
    const hk = makePiece('HellKing', 'Black', 4, 4);
    const enemy = makePiece('Rook', 'White', 3, 4, { hasMoved: true });
    const wk = makePiece('King', 'White', 0, 0);
    const state = makeState([hk, enemy, wk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 3, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 4 });
    const converted = s1.pieces.find(p => p.id === enemy.id)!;
    expect(converted.color).toBe('Black');
    expect(converted.type).toBe('Rook');
    expect(converted.hasMoved).toBe(true);
  });

  it('HellKing moves normally to empty square', () => {
    const hk = makePiece('HellKing', 'Black', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const state = makeState([hk, wk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 4 },
      highlights: [{ row: 3, col: 4, color: 'move' }],
    });

    const s1 = tap(state, { row: 3, col: 4 });
    const king = s1.pieces.find(p => p.id === hk.id)!;
    expect(king.row).toBe(3);
    expect(king.col).toBe(4);
  });
});
