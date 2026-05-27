import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, getAbilityTargets, performRaise } from '@/engine/pieces/GhoulKing';
import { makePiece, makeState, resetIds } from '../../testHelpers';
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

describe('GhoulKing', () => {
  // --- Movement tests ---

  it('moves like a king', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 1 });
    const moves = getValidMoves(gk, [gk]);
    expect(moves).toHaveLength(8);
  });

  // --- Unit function tests ---

  it('getAbilityTargets returns empty adjacent when raisesLeft > 0', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 1 });
    const targets = getAbilityTargets(gk, [gk]);
    expect(targets).toHaveLength(8);
    expect(targets.every(t => t.color === 'ability')).toBe(true);
  });

  it('getAbilityTargets empty when no raises left', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 0 });
    expect(getAbilityTargets(gk, [gk])).toHaveLength(0);
  });

  it('BUG #5 REGRESSION: performRaise does NOT switch turn', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 1 });
    const state = makeState([gk]);
    const result = performRaise(gk, { row: 3, col: 4 }, state);
    expect(result.currentTurn).toBe('White');
    expect(result.pieces).toHaveLength(2);
    const raised = result.pieces.find(p => p.type === 'NecroPawn');
    expect(raised).toBeDefined();
    expect(raised!.row).toBe(3);
    expect(raised!.col).toBe(4);
  });

  // --- Full tap flow tests ---

  it('tap1: select shows moves', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 1 });
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, bk]);

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.selectedSquare).toEqual({ row: 4, col: 4 });
  });

  it('tap2: self-click shows raise targets', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 1 });
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const abilityHighlights = s2.highlights.filter(h => h.color === 'ability');
    expect(abilityHighlights.length).toBeGreaterThan(0);
  });

  it('tap3: clicking raise target places NecroPawn', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 1 });
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const target = s2.highlights.find(h => h.color === 'ability');
    expect(target).toBeDefined();

    const s3 = tap(s2, { row: target!.row, col: target!.col });
    const raised = s3.pieces.find(
      p => p.row === target!.row && p.col === target!.col && p.color === 'White',
    );
    expect(raised).toBeDefined();
  });

  // --- Edge case tests ---

  it('cannot raise when raisesLeft is 0', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 0 });
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, bk]);

    const s1 = tap(state, { row: 4, col: 4 });
    const abilityHL = s1.highlights.filter(h => h.color === 'ability');
    expect(abilityHL).toHaveLength(0);
  });

  it('raise does not consume the turn', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 1 });
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const target = s2.highlights.find(h => h.color === 'ability')!;
    const s3 = tap(s2, { row: target.row, col: target.col });
    expect(s3.currentTurn).toBe('White');
  });

  it('raisesLeft decrements to 0 after raise', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 1 });
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const target = s2.highlights.find(h => h.color === 'ability')!;
    const s3 = tap(s2, { row: target.row, col: target.col });
    const king = s3.pieces.find(p => p.id === gk.id)!;
    expect(king.raisesLeft).toBe(0);
  });

  it('raised piece is a NecroPawn', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 1 });
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([gk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const target = s2.highlights.find(h => h.color === 'ability')!;
    const s3 = tap(s2, { row: target.row, col: target.col });
    const raised = s3.pieces.find(
      p => p.row === target.row && p.col === target.col && p.id !== gk.id,
    )!;
    expect(raised.type).toBe('NecroPawn');
    expect(raised.color).toBe('White');
  });
});
