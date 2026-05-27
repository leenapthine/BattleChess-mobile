import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, performCapture } from '@/engine/pieces/HellPawn';
import { makePiece, makeState, resetIds, hasSquare } from '../../testHelpers';
import type { GameState, Square } from '@/types/game';

beforeEach(() => resetIds());

function tap(state: GameState, square: Square): GameState {
  const action = classifyAction(square, state);
  return gameReducer(state, action);
}

describe('HellPawn', () => {
  // --- Movement tests ---

  it('moves like a pawn', () => {
    const hp = makePiece('HellPawn', 'Black', 6, 3);
    const moves = getValidMoves(hp, [hp]);
    expect(hasSquare(moves, 5, 3)).toBe(true);
  });

  // --- Unit function tests ---

  it('transforms into captured non-pawn piece', () => {
    const hp = makePiece('HellPawn', 'Black', 5, 3);
    const enemy = makePiece('Rook', 'White', 4, 4);
    const state = makeState([hp, enemy], { currentTurn: 'Black' });
    const result = performCapture(hp, { row: 4, col: 4 }, state);
    const transformed = result.pieces.find(p => p.id === hp.id);
    expect(transformed!.type).toBe('Rook');
    expect(transformed!.color).toBe('Black');
  });

  it('does not transform when capturing a pawn', () => {
    const hp = makePiece('HellPawn', 'Black', 5, 3);
    const enemy = makePiece('Pawn', 'White', 4, 4);
    const state = makeState([hp, enemy], { currentTurn: 'Black' });
    const result = performCapture(hp, { row: 4, col: 4 }, state);
    const piece = result.pieces.find(p => p.id === hp.id);
    expect(piece!.type).toBe('HellPawn');
    expect(piece!.row).toBe(4);
  });

  // --- Full tap flow tests ---

  it('capturing a non-pawn transforms HellPawn', () => {
    const hp = makePiece('HellPawn', 'Black', 5, 4);
    const enemy = makePiece('Knight', 'White', 4, 3);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([hp, enemy, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 5, col: 4 },
      highlights: [{ row: 4, col: 3, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 3 });
    expect(s1.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    const transformed = s1.pieces.find(p => p.row === 4 && p.col === 3);
    expect(transformed).toBeDefined();
  });

  // --- Edge case tests ---

  it('no transformation when capturing a pawn-type', () => {
    const hp = makePiece('HellPawn', 'Black', 5, 4);
    const enemy = makePiece('Pawn', 'White', 4, 3);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([hp, enemy, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 5, col: 4 },
      highlights: [{ row: 4, col: 3, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 3 });
    const piece = s1.pieces.find(p => p.id === hp.id)!;
    expect(piece.type).toBe('HellPawn');
    expect(piece.row).toBe(4);
    expect(piece.col).toBe(3);
  });

  it('transforms into captured non-pawn type with own color', () => {
    const hp = makePiece('HellPawn', 'Black', 5, 4);
    const enemy = makePiece('Bishop', 'White', 4, 3);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([hp, enemy, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 5, col: 4 },
      highlights: [{ row: 4, col: 3, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 3 });
    const piece = s1.pieces.find(p => p.id === hp.id)!;
    expect(piece.type).toBe('Bishop');
    expect(piece.color).toBe('Black');
    expect(piece.row).toBe(4);
    expect(piece.col).toBe(3);
  });

  it('HellPawn moves normally to empty square', () => {
    const hp = makePiece('HellPawn', 'Black', 5, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([hp, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 5, col: 4 },
      highlights: [{ row: 4, col: 4, color: 'move' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    const piece = s1.pieces.find(p => p.id === hp.id)!;
    expect(piece.type).toBe('HellPawn');
    expect(piece.row).toBe(4);
  });
});
