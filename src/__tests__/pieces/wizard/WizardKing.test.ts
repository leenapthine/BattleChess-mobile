import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, getAbilityTargets } from '@/engine/pieces/WizardKing';
import { makePiece, makeState, resetIds, hasSquare } from '../../testHelpers';
import type { GameState, Square } from '@/types/game';

beforeEach(() => resetIds());

function tap(state: GameState, square: Square): GameState {
  const action = classifyAction(square, state);
  return gameReducer(state, action);
}

function selectAndSelfClick(state: GameState, row: number, col: number): GameState {
  const s1 = tap(state, { row, col });
  return tap(s1, { row, col });
}

describe('WizardKing', () => {
  it('getValidMoves returns standard king moves only', () => {
    const wk = makePiece('WizardKing', 'White', 4, 4);
    const moves = getValidMoves(wk, [wk]);
    expect(moves).toHaveLength(8);
    expect(hasSquare(moves, 7, 4)).toBe(false);
  });

  it('getAbilityTargets shows vertical line-of-sight', () => {
    const wk = makePiece('WizardKing', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 7, 4);
    const targets = getAbilityTargets(wk, [wk, enemy]);
    const enemyHL = targets.find(t => t.row === 7 && t.col === 4);
    expect(enemyHL).toBeDefined();
    expect(enemyHL!.color).toBe('capture');
    const rangeHL = targets.filter(t => t.color === 'range');
    expect(rangeHL.length).toBeGreaterThan(0);
  });

  it('vertical shot blocked by intervening piece', () => {
    const wk = makePiece('WizardKing', 'White', 4, 4);
    const blocker = makePiece('Pawn', 'White', 6, 4);
    const enemy = makePiece('Pawn', 'Black', 7, 4);
    const targets = getAbilityTargets(wk, [wk, blocker, enemy]);
    expect(hasSquare(targets, 7, 4)).toBe(false);
    const blockerHL = targets.find(t => t.row === 6 && t.col === 4);
    expect(blockerHL).toBeDefined();
    expect(blockerHL!.color).toBe('range');
  });

  it('self-click enters ranged attack mode', () => {
    const wk = makePiece('WizardKing', 'Black', 7, 4);
    const enemy = makePiece('Pawn', 'White', 2, 4);
    const bk = makePiece('King', 'Black', 7, 0);
    const wk2 = makePiece('King', 'White', 0, 0);
    const state = makeState([wk, enemy, bk, wk2], { currentTurn: 'Black' });

    const s2 = selectAndSelfClick(state, 7, 4);
    expect(s2.abilityMode.type).toBe('boulder');
    expect(s2.highlights.length).toBeGreaterThan(0);
  });

  it('ranged attack kills enemy without moving', () => {
    const wk = makePiece('WizardKing', 'Black', 7, 4);
    const enemy = makePiece('Pawn', 'White', 2, 4);
    const bk = makePiece('King', 'Black', 7, 0);
    const wk2 = makePiece('King', 'White', 0, 0);
    const state = makeState([wk, enemy, bk, wk2], { currentTurn: 'Black' });

    const s2 = selectAndSelfClick(state, 7, 4);
    const s3 = tap(s2, { row: 2, col: 4 });
    expect(s3.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    const king = s3.pieces.find(p => p.id === wk.id)!;
    expect(king.row).toBe(7);
    expect(king.col).toBe(4);
    expect(s3.currentTurn).toBe('White');
  });

  it('normal king capture moves into square', () => {
    const wk = makePiece('WizardKing', 'Black', 7, 4);
    const enemy = makePiece('Pawn', 'White', 6, 4);
    const bk = makePiece('King', 'Black', 7, 0);
    const wk2 = makePiece('King', 'White', 0, 0);
    const state = makeState([wk, enemy, bk, wk2], {
      currentTurn: 'Black',
      selectedSquare: { row: 7, col: 4 },
      highlights: [{ row: 6, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 6, col: 4 });
    expect(s1.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    const king = s1.pieces.find(p => p.id === wk.id)!;
    expect(king.row).toBe(6);
    expect(king.col).toBe(4);
  });

  it('clicking outside range exits ability mode', () => {
    const wk = makePiece('WizardKing', 'Black', 7, 4);
    const bk = makePiece('King', 'Black', 7, 0);
    const wk2 = makePiece('King', 'White', 0, 0);
    const state = makeState([wk, bk, wk2], { currentTurn: 'Black' });

    const s2 = selectAndSelfClick(state, 7, 4);
    const s3 = tap(s2, { row: 0, col: 7 });
    expect(s3.abilityMode.type).toBe('none');
  });

  it('stone piece not shown as ranged target', () => {
    const wk = makePiece('WizardKing', 'White', 4, 4);
    const stoned = makePiece('Familiar', 'Black', 7, 4, { isStone: true });
    const targets = getAbilityTargets(wk, [wk, stoned]);
    const stonedHL = targets.find(t => t.row === 7 && t.col === 4);
    expect(stonedHL).toBeDefined();
    expect(stonedHL!.color).toBe('range');
  });
});
