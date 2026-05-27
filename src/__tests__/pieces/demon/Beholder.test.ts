import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, getAbilityTargets } from '@/engine/pieces/Beholder';
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

describe('Beholder', () => {
  // --- Movement tests ---

  it('moves 1 cardinal step to empty squares only', () => {
    const b = makePiece('Beholder', 'Black', 4, 4);
    const moves = getValidMoves(b, [b]);
    expect(moves).toHaveLength(4);
    expect(moves.every(m => m.color === 'move')).toBe(true);
  });

  it('cannot move onto occupied square', () => {
    const b = makePiece('Beholder', 'Black', 4, 4);
    const occ = makePiece('Pawn', 'White', 4, 5);
    const moves = getValidMoves(b, [b, occ]);
    expect(hasSquare(moves, 4, 5)).toBe(false);
  });

  // --- Unit function tests ---

  it('getAbilityTargets shows enemies within manhattan-3', () => {
    const b = makePiece('Beholder', 'Black', 4, 4);
    const enemy = makePiece('Pawn', 'White', 4, 7);
    const targets = getAbilityTargets(b, [b, enemy]);
    expect(hasSquare(targets, 4, 7)).toBe(true);
  });

  it('getAbilityTargets excludes stone pieces', () => {
    const b = makePiece('Beholder', 'Black', 4, 4);
    const stoned = makePiece('Pawn', 'White', 4, 7, { isStone: true });
    const targets = getAbilityTargets(b, [b, stoned]);
    expect(hasSquare(targets, 4, 7)).toBe(false);
  });

  // --- Ability highlight tests ---

  it('ranged targets use ability color', () => {
    const beholder = makePiece('Beholder', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 3, 3);
    const targets = getAbilityTargets(beholder, [beholder, enemy]);
    expect(targets.length).toBeGreaterThan(0);
    expect(targets.every(t => t.color === 'ability')).toBe(true);
  });

  it('does not target friendly pieces', () => {
    const beholder = makePiece('Beholder', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 3, 3);
    const targets = getAbilityTargets(beholder, [beholder, ally]);
    expect(targets).toHaveLength(0);
  });

  it('does not target stone pieces', () => {
    const beholder = makePiece('Beholder', 'White', 4, 4);
    const stoned = makePiece('Pawn', 'Black', 3, 3, { isStone: true });
    const targets = getAbilityTargets(beholder, [beholder, stoned]);
    expect(targets).toHaveLength(0);
  });

  // --- Full tap flow tests ---

  it('tap2: self-click enters boulder mode', () => {
    const beh = makePiece('Beholder', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 3, 3);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([beh, enemy, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    expect(s2.abilityMode.type).toBe('boulder');
  });

  it('tap3: clicking enemy target captures it', () => {
    const beh = makePiece('Beholder', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 3, 3);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([beh, enemy, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const s3 = tap(s2, { row: 3, col: 3 });
    expect(s3.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    expect(s3.currentTurn).toBe('Black');
  });
});
