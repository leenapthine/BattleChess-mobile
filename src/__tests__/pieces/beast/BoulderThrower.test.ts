import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, getAbilityTargets } from '@/engine/pieces/BoulderThrower';
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

describe('BoulderThrower', () => {
  // --- Movement tests ---

  it('moves along orthogonal lines (empty only)', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const moves = getValidMoves(bt, [bt]);
    expect(moves.length).toBe(14);
    expect(moves.every(m => m.color === 'move')).toBe(true);
  });

  it('stops at any piece (no capture via movement)', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 4, 6);
    const moves = getValidMoves(bt, [bt, enemy]);
    expect(hasSquare(moves, 4, 5)).toBe(true);
    expect(hasSquare(moves, 4, 6)).toBe(false);
  });

  // --- Unit function tests ---

  it('getAbilityTargets shows enemies at manhattan-3', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 4, 7);
    const targets = getAbilityTargets(bt, [bt, enemy]);
    expect(hasSquare(targets, 4, 7)).toBe(true);
  });

  // --- Ability highlight tests ---

  it('ranged targets use ability color', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 4, 7);
    const targets = getAbilityTargets(bt, [bt, enemy]);
    expect(targets.length).toBeGreaterThan(0);
    expect(targets.every(t => t.color === 'capture')).toBe(true);
  });

  it('only targets at exactly manhattan distance 3', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const close = makePiece('Pawn', 'Black', 4, 5);
    const exact = makePiece('Pawn', 'Black', 4, 7);
    const far = makePiece('Pawn', 'Black', 4, 0);
    const targets = getAbilityTargets(bt, [bt, close, exact, far]);
    const coords = targets.map(t => `${t.row},${t.col}`);
    expect(coords).toContain('4,7');
    expect(coords).not.toContain('4,5');
    expect(coords).not.toContain('4,0');
  });

  // --- Full tap flow tests ---

  it('tap2: self-click enters boulder mode', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 4, 7);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([bt, enemy, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    expect(s2.abilityMode.type).toBe('boulder');
  });

  it('tap3: clicking enemy at manhattan-3 captures it', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 4, 7);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([bt, enemy, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const s3 = tap(s2, { row: 4, col: 7 });
    expect(s3.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    expect(s3.currentTurn).toBe('Black');
  });
});
