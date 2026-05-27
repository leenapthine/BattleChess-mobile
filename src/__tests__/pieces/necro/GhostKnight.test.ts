import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, applyStunEffect } from '@/engine/pieces/GhostKnight';
import { makePiece, makeState, resetIds } from '../../testHelpers';
import type { GameState, Square } from '@/types/game';

beforeEach(() => resetIds());

function tap(state: GameState, square: Square): GameState {
  const action = classifyAction(square, state);
  return gameReducer(state, action);
}

describe('GhostKnight', () => {
  // --- Movement tests ---

  it('moves like a knight', () => {
    const gk = makePiece('GhostKnight', 'White', 4, 4);
    expect(getValidMoves(gk, [gk])).toHaveLength(8);
  });

  // --- Unit function tests ---

  it('applyStunEffect stuns adjacent enemies', () => {
    const gk = makePiece('GhostKnight', 'White', 4, 4);
    const adj = makePiece('Pawn', 'Black', 4, 5);
    const far = makePiece('Pawn', 'Black', 0, 0);
    const result = applyStunEffect(gk, [gk, adj, far]);
    expect(result.find(p => p.id === adj.id)!.stunned).toBe(true);
    expect(result.find(p => p.id === far.id)!.stunned).toBe(false);
  });

  it('does not stun friendly pieces', () => {
    const gk = makePiece('GhostKnight', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 4, 5);
    const result = applyStunEffect(gk, [gk, ally]);
    expect(result.find(p => p.id === ally.id)!.stunned).toBe(false);
  });

  // --- Full tap flow tests ---

  it('moving adjacent to enemy stuns them', () => {
    const gk = makePiece('GhostKnight', 'White', 4, 1);
    const enemy = makePiece('HellPawn', 'Black', 2, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([gk, enemy, wk, bk], {
      selectedSquare: { row: 4, col: 1 },
      highlights: [{ row: 2, col: 2, color: 'move' }],
    });

    const s1 = tap(state, { row: 2, col: 2 });
    const movedGK = s1.pieces.find(p => p.id === gk.id)!;
    expect(movedGK.row).toBe(2);
    expect(movedGK.col).toBe(2);

    const enemyAfter = s1.pieces.find(p => p.id === enemy.id)!;
    expect(enemyAfter.stunned).toBe(true);
  });

  it('stunned piece cannot be selected on next turn', () => {
    const gk = makePiece('GhostKnight', 'White', 4, 1);
    const enemy = makePiece('HellPawn', 'Black', 2, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([gk, enemy, wk, bk], {
      selectedSquare: { row: 4, col: 1 },
      highlights: [{ row: 2, col: 2, color: 'move' }],
    });

    const s1 = tap(state, { row: 2, col: 2 });
    expect(s1.currentTurn).toBe('Black');

    const s2 = tap(s1, { row: 2, col: 1 });
    expect(s2.selectedSquare).toBeNull();
  });

  it('stun clears when it becomes that players turn again', () => {
    const gk = makePiece('GhostKnight', 'White', 2, 2);
    const enemy = makePiece('HellPawn', 'Black', 2, 1, { stunned: true });
    const bk = makePiece('King', 'Black', 7, 4);
    const wk = makePiece('King', 'White', 0, 4);
    const otherBlack = makePiece('Pawn', 'Black', 6, 4);
    const state = makeState([gk, enemy, bk, wk, otherBlack], {
      currentTurn: 'Black',
    });

    // Black moves another piece
    const s1 = tap(state, { row: 6, col: 4 });
    const s2 = tap(s1, { row: 5, col: 4 });
    expect(s2.currentTurn).toBe('White');

    // White moves
    const s3 = tap(s2, { row: 0, col: 4 });
    const s4 = tap(s3, { row: 1, col: 4 });
    expect(s4.currentTurn).toBe('Black');

    // Enemy stun should be cleared
    const enemyNow = s4.pieces.find(p => p.id === enemy.id)!;
    expect(enemyNow.stunned).toBe(false);
  });

  // --- Edge case tests ---

  it('does not stun friendly adjacent pieces', () => {
    const gk = makePiece('GhostKnight', 'White', 4, 1);
    const ally = makePiece('Pawn', 'White', 2, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, ally, wk, bk], {
      selectedSquare: { row: 4, col: 1 },
      highlights: [{ row: 2, col: 2, color: 'move' }],
    });

    const s1 = tap(state, { row: 2, col: 2 });
    const allyAfter = s1.pieces.find(p => p.id === ally.id)!;
    expect(allyAfter.stunned).toBe(false);
  });

  it('stuns multiple adjacent enemies', () => {
    const gk = makePiece('GhostKnight', 'White', 4, 1);
    const e1 = makePiece('Pawn', 'Black', 2, 1);
    const e2 = makePiece('Pawn', 'Black', 2, 3);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, e1, e2, wk, bk], {
      selectedSquare: { row: 4, col: 1 },
      highlights: [{ row: 2, col: 2, color: 'move' }],
    });

    const s1 = tap(state, { row: 2, col: 2 });
    const e1After = s1.pieces.find(p => p.id === e1.id)!;
    const e2After = s1.pieces.find(p => p.id === e2.id)!;
    expect(e1After.stunned).toBe(true);
    expect(e2After.stunned).toBe(true);
  });
});
