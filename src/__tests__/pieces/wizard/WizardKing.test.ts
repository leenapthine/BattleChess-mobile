import { getValidMoves, performRangedCapture } from '@/engine/pieces/WizardKing';
import { makePiece, makeState, resetIds, hasSquare } from '../../testHelpers';

beforeEach(() => resetIds());

describe('WizardKing', () => {
  // --- Movement tests ---

  it('has king moves plus vertical line-of-sight captures', () => {
    const wk = makePiece('WizardKing', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 7, 4);
    const moves = getValidMoves(wk, [wk, enemy]);
    expect(hasSquare(moves, 7, 4)).toBe(true);
    const ranged = moves.find(m => m.row === 7 && m.col === 4);
    expect(ranged!.color).toBe('capture');
  });

  it('vertical shot blocked by intervening piece', () => {
    const wk = makePiece('WizardKing', 'White', 4, 4);
    const blocker = makePiece('Pawn', 'White', 6, 4);
    const enemy = makePiece('Pawn', 'Black', 7, 4);
    const moves = getValidMoves(wk, [wk, blocker, enemy]);
    expect(hasSquare(moves, 7, 4)).toBe(false);
  });

  // --- Unit function tests ---

  it('BUG #4 REGRESSION: performRangedCapture ends turn', () => {
    const wk = makePiece('WizardKing', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 7, 4);
    const state = makeState([wk, enemy]);
    const result = performRangedCapture(wk, { row: 7, col: 4 }, state);
    expect(result.currentTurn).toBe('Black');
  });

  it('performRangedCapture rejects adjacent targets', () => {
    const wk = makePiece('WizardKing', 'White', 4, 4);
    const adj = makePiece('Pawn', 'Black', 5, 4);
    const state = makeState([wk, adj]);
    const result = performRangedCapture(wk, { row: 5, col: 4 }, state);
    expect(result.pieces.find(p => p.id === adj.id)).toBeDefined();
  });
});
