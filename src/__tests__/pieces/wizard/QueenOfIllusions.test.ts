import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, getAbilityTargets, performSwap } from '@/engine/pieces/QueenOfIllusions';
import { makePiece, makeState, resetIds } from '../../testHelpers';
import type { GameState, Square } from '@/types/game';

beforeEach(() => resetIds());

function tap(state: GameState, square: Square): GameState {
  const action = classifyAction(square, state);
  return gameReducer(state, action);
}

describe('QueenOfIllusions', () => {
  // --- Movement tests ---

  it('moves like a queen', () => {
    const q = makePiece('QueenOfIllusions', 'White', 4, 4);
    expect(getValidMoves(q, [q]).length).toBe(27);
  });

  // --- Unit function tests ---

  it('getAbilityTargets shows all friendly pawn-types', () => {
    const q = makePiece('QueenOfIllusions', 'White', 4, 4);
    const p1 = makePiece('Pawn', 'White', 0, 0);
    const p2 = makePiece('NecroPawn', 'White', 1, 1);
    const rook = makePiece('Rook', 'White', 7, 7);
    const targets = getAbilityTargets(q, [q, p1, p2, rook]);
    expect(targets).toHaveLength(2);
  });

  it('performSwap swaps positions', () => {
    const q = makePiece('QueenOfIllusions', 'White', 4, 4);
    const p = makePiece('Pawn', 'White', 0, 0);
    const state = makeState([q, p]);
    const result = performSwap(q, p.id, state);
    const queen = result.pieces.find(pc => pc.id === q.id)!;
    const pawn = result.pieces.find(pc => pc.id === p.id)!;
    expect(queen.row).toBe(0);
    expect(queen.col).toBe(0);
    expect(pawn.row).toBe(4);
    expect(pawn.col).toBe(4);
    expect(result.currentTurn).toBe('Black');
  });

  it('performSwap rejects non-pawn targets', () => {
    const q = makePiece('QueenOfIllusions', 'White', 4, 4);
    const rook = makePiece('Rook', 'White', 0, 0);
    const state = makeState([q, rook]);
    const result = performSwap(q, rook.id, state);
    expect(result.pieces.find(p => p.id === q.id)!.row).toBe(4);
  });

  // --- Full tap flow tests ---

  it('clicking a friendly pawn swaps positions', () => {
    const qoi = makePiece('QueenOfIllusions', 'White', 0, 3);
    const pawn = makePiece('Pawn', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([qoi, pawn, wk, bk], {
      selectedSquare: { row: 0, col: 3 },
      highlights: [{ row: 4, col: 4, color: 'ability' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    const movedQueen = s1.pieces.find(p => p.id === qoi.id)!;
    const movedPawn = s1.pieces.find(p => p.id === pawn.id)!;
    expect(movedQueen.row).toBe(4);
    expect(movedQueen.col).toBe(4);
    expect(movedPawn.row).toBe(0);
    expect(movedPawn.col).toBe(3);
  });

  // --- Edge case tests ---

  it('cannot swap with a non-pawn type', () => {
    const qoi = makePiece('QueenOfIllusions', 'White', 0, 3);
    const rook = makePiece('Rook', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([qoi, rook, wk, bk]);

    const s1 = tap(state, { row: 0, col: 3 });
    const abilityHL = s1.highlights.filter(h => h.color === 'ability');
    const rookHL = abilityHL.find(h => h.row === 4 && h.col === 4);
    expect(rookHL).toBeUndefined();
  });

  it('swap ends the turn', () => {
    const qoi = makePiece('QueenOfIllusions', 'White', 0, 3);
    const pawn = makePiece('Pawn', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([qoi, pawn, wk, bk], {
      selectedSquare: { row: 0, col: 3 },
      highlights: [{ row: 4, col: 4, color: 'ability' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.currentTurn).toBe('Black');
  });

  it('queen can still move normally to empty squares', () => {
    const qoi = makePiece('QueenOfIllusions', 'White', 0, 3);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([qoi, wk, bk], {
      selectedSquare: { row: 0, col: 3 },
      highlights: [{ row: 3, col: 3, color: 'move' }],
    });

    const s1 = tap(state, { row: 3, col: 3 });
    const queen = s1.pieces.find(p => p.id === qoi.id)!;
    expect(queen.row).toBe(3);
    expect(queen.col).toBe(3);
  });
});
