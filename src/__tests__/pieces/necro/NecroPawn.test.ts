import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, getAbilityTargets, performSacrifice } from '@/engine/pieces/NecroPawn';
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

describe('NecroPawn', () => {
  // --- Movement tests ---

  it('has standard pawn moves', () => {
    const np = makePiece('NecroPawn', 'White', 1, 3);
    const moves = getValidMoves(np, [np]);
    expect(hasSquare(moves, 2, 3)).toBe(true);
    expect(hasSquare(moves, 3, 3)).toBe(true);
  });

  // --- Unit function tests ---

  it('getAbilityTargets returns all 8 adjacent squares', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const targets = getAbilityTargets(np, [np]);
    expect(targets).toHaveLength(8);
  });

  it('performSacrifice removes pieces in AoE and self', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 4, 5);
    const enemy = makePiece('Pawn', 'Black', 3, 3);
    const far = makePiece('Pawn', 'Black', 0, 0);
    const state = makeState([np, ally, enemy, far]);
    const result = performSacrifice(np, state);
    expect(result.pieces).toHaveLength(1);
    expect(result.pieces[0].id).toBe(far.id);
    expect(result.currentTurn).toBe('Black');
  });

  it('performSacrifice respects isStone', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const stoned = makePiece('Pawn', 'Black', 4, 5, { isStone: true });
    const state = makeState([np, stoned]);
    const result = performSacrifice(np, state);
    expect(result.pieces).toHaveLength(1);
    expect(result.pieces[0].id).toBe(stoned.id);
  });

  // --- Ability highlight tests ---

  it('blast zone uses ability color', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const targets = getAbilityTargets(np, [np]);
    expect(targets.length).toBeGreaterThan(0);
    expect(targets.every(t => t.color === 'capture')).toBe(true);
  });

  // --- Full tap flow tests ---

  it('tap1: select shows moves + ability targets', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([np, wk, bk]);

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.selectedSquare).toEqual({ row: 4, col: 4 });
    expect(s1.highlights.length).toBeGreaterThan(0);
  });

  it('tap2: self-click arms sacrifice', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([np, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    expect(s2.abilityMode.type).toBe('sacrifice');
  });

  it('tap3: self-click again detonates', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 4, 5);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([np, ally, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const s3 = tap(s2, { row: 4, col: 4 });
    expect(s3.abilityMode.type).toBe('none');
    expect(s3.pieces.find(p => p.id === np.id)).toBeUndefined();
    expect(s3.pieces.find(p => p.id === ally.id)).toBeUndefined();
    expect(s3.currentTurn).toBe('Black');
  });

  // --- Edge case tests ---

  it('sacrifice respects stone immunity', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const stoned = makePiece('Pawn', 'Black', 4, 5, { isStone: true });
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([np, stoned, wk, bk]);

    const s1 = selectAndSelfClick(state, 4, 4);
    const s2 = tap(s1, { row: 4, col: 4 });
    expect(s2.pieces.find(p => p.id === stoned.id)).toBeDefined();
    expect(s2.pieces.find(p => p.id === np.id)).toBeUndefined();
  });

  it('clicking non-self square while armed cancels sacrifice', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([np, wk, bk]);

    const s1 = selectAndSelfClick(state, 4, 4);
    expect(s1.abilityMode.type).toBe('sacrifice');

    const s2 = tap(s1, { row: 0, col: 0 });
    expect(s2.abilityMode.type).toBe('none');
    expect(s2.pieces.find(p => p.id === np.id)).toBeDefined();
  });
});
