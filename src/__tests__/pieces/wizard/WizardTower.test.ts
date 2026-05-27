import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, performRangedCapture } from '@/engine/pieces/WizardTower';
import { makePiece, makeState, resetIds } from '../../testHelpers';
import type { GameState, Square } from '@/types/game';

beforeEach(() => resetIds());

function tap(state: GameState, square: Square): GameState {
  const action = classifyAction(square, state);
  return gameReducer(state, action);
}

describe('WizardTower', () => {
  // --- Movement tests ---

  it('moves like a bishop', () => {
    const wt = makePiece('WizardTower', 'White', 4, 4);
    expect(getValidMoves(wt, [wt]).length).toBe(13);
  });

  // --- Unit function tests ---

  it('BUG #3 REGRESSION: performRangedCapture ends turn', () => {
    const wt = makePiece('WizardTower', 'White', 0, 0);
    const enemy = makePiece('Pawn', 'Black', 3, 3);
    const state = makeState([wt, enemy]);
    const result = performRangedCapture(wt, { row: 3, col: 3 }, state);
    expect(result.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    expect(result.currentTurn).toBe('Black');
  });

  it('performRangedCapture does not move tower', () => {
    const wt = makePiece('WizardTower', 'White', 0, 0);
    const enemy = makePiece('Pawn', 'Black', 3, 3);
    const state = makeState([wt, enemy]);
    const result = performRangedCapture(wt, { row: 3, col: 3 }, state);
    const tower = result.pieces.find(p => p.id === wt.id)!;
    expect(tower.row).toBe(0);
    expect(tower.col).toBe(0);
  });

  // --- Full tap flow tests ---

  it('clicking enemy on diagonal captures without moving', () => {
    const wt = makePiece('WizardTower', 'White', 0, 0);
    const enemy = makePiece('Pawn', 'Black', 3, 3);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([wt, enemy, wk, bk], {
      selectedSquare: { row: 0, col: 0 },
      highlights: [{ row: 3, col: 3, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 3 });
    expect(s1.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    const tower = s1.pieces.find(p => p.id === wt.id)!;
    expect(tower.row).toBe(0);
    expect(tower.col).toBe(0);
  });

  // --- Edge case tests ---

  it('normal move to empty square still moves the tower', () => {
    const wt = makePiece('WizardTower', 'White', 0, 0);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([wt, wk, bk], {
      selectedSquare: { row: 0, col: 0 },
      highlights: [{ row: 3, col: 3, color: 'move' }],
    });

    const s1 = tap(state, { row: 3, col: 3 });
    const tower = s1.pieces.find(p => p.id === wt.id)!;
    expect(tower.row).toBe(3);
    expect(tower.col).toBe(3);
  });

  it('cannot ranged-capture a stone piece', () => {
    const wt = makePiece('WizardTower', 'White', 0, 0);
    const stoned = makePiece('Pawn', 'Black', 3, 3, { isStone: true });
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([wt, stoned, wk, bk], {
      selectedSquare: { row: 0, col: 0 },
      highlights: [{ row: 3, col: 3, color: 'capture' }],
    });

    const s1 = tap(state, { row: 3, col: 3 });
    expect(s1.pieces.find(p => p.id === stoned.id)).toBeDefined();
  });
});
