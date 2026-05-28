import { gameReducer } from '@/engine/gameReducer';
import { makePiece, makeState, resetIds, createTestState } from './testHelpers';

beforeEach(() => resetIds());

describe('capturedPieces tracking', () => {
  it('starts empty', () => {
    const state = createTestState();
    expect(state.capturedPieces).toEqual([]);
  });

  it('records captured piece after a capture move', () => {
    const rook = makePiece('Rook', 'White', 4, 0);
    const enemy = makePiece('Pawn', 'Black', 4, 5);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([rook, enemy, wk, bk], {
      selectedSquare: { row: 4, col: 0 },
      highlights: [{ row: 4, col: 5, color: 'capture' }],
    });

    const result = gameReducer(state, {
      type: 'MOVE_PIECE',
      from: { row: 4, col: 0 },
      to: { row: 4, col: 5 },
    });

    expect(result.capturedPieces).toHaveLength(1);
    expect(result.capturedPieces[0].id).toBe(enemy.id);
    expect(result.capturedPieces[0].type).toBe('Pawn');
    expect(result.capturedPieces[0].color).toBe('Black');
  });

  it('accumulates across multiple captures', () => {
    const rook = makePiece('Rook', 'White', 4, 0);
    const enemy = makePiece('Pawn', 'Black', 4, 5);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([rook, enemy, wk, bk], {
      selectedSquare: { row: 4, col: 0 },
      highlights: [{ row: 4, col: 5, color: 'capture' }],
      capturedPieces: [makePiece('Knight', 'Black', 0, 0)],
    });

    const result = gameReducer(state, {
      type: 'MOVE_PIECE',
      from: { row: 4, col: 0 },
      to: { row: 4, col: 5 },
    });

    expect(result.capturedPieces).toHaveLength(2);
  });

  it('stays empty on non-capture moves', () => {
    const rook = makePiece('Rook', 'White', 4, 0);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([rook, wk, bk], {
      selectedSquare: { row: 4, col: 0 },
      highlights: [{ row: 4, col: 5, color: 'move' }],
    });

    const result = gameReducer(state, {
      type: 'MOVE_PIECE',
      from: { row: 4, col: 0 },
      to: { row: 4, col: 5 },
    });

    expect(result.capturedPieces).toHaveLength(0);
  });

  it('includes QoD detonation casualties', () => {
    const rook = makePiece('Rook', 'White', 0, 0);
    const qod = makePiece('QueenOfDestruction', 'Black', 0, 7);
    const adjacent = makePiece('Pawn', 'Black', 1, 7);
    const wk = makePiece('King', 'White', 7, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([rook, qod, adjacent, wk, bk], {
      selectedSquare: { row: 0, col: 0 },
      highlights: [{ row: 0, col: 7, color: 'capture' }],
    });

    const result = gameReducer(state, {
      type: 'MOVE_PIECE',
      from: { row: 0, col: 0 },
      to: { row: 0, col: 7 },
    });

    const capturedIds = result.capturedPieces.map(p => p.id);
    expect(capturedIds).toContain(qod.id);
    expect(capturedIds).toContain(adjacent.id);
  });

  it('is cleared on RESET_GAME', () => {
    const state = makeState([], {
      capturedPieces: [makePiece('Pawn', 'Black', 0, 0)],
    });

    const result = gameReducer(state, { type: 'RESET_GAME' });
    expect(result.capturedPieces).toHaveLength(0);
  });

  it('is unchanged by SELECT_SQUARE', () => {
    const pawn = makePiece('Pawn', 'White', 1, 0);
    const state = makeState([pawn]);

    const result = gameReducer(state, {
      type: 'SELECT_SQUARE',
      square: { row: 1, col: 0 },
    });

    expect(result.capturedPieces).toHaveLength(0);
  });

  it('is unchanged by DESELECT', () => {
    const pawn = makePiece('Pawn', 'White', 1, 0);
    const state = makeState([pawn], {
      selectedSquare: { row: 1, col: 0 },
    });

    const result = gameReducer(state, { type: 'DESELECT' });
    expect(result.capturedPieces).toHaveLength(0);
  });
});
