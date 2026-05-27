import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, getAbilityTargets, toggleStone } from '@/engine/pieces/Familiar';
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

describe('Familiar', () => {
  // --- Movement tests ---

  it('moves like a knight', () => {
    const f = makePiece('Familiar', 'White', 4, 4);
    expect(getValidMoves(f, [f])).toHaveLength(8);
  });

  // --- Unit function tests ---

  it('getAbilityTargets shows self when not stone', () => {
    const f = makePiece('Familiar', 'White', 4, 4);
    const targets = getAbilityTargets(f, [f]);
    expect(targets).toHaveLength(1);
    expect(targets[0].row).toBe(4);
    expect(targets[0].col).toBe(4);
  });

  it('getAbilityTargets empty when already stone', () => {
    const f = makePiece('Familiar', 'White', 4, 4, { isStone: true });
    expect(getAbilityTargets(f, [f])).toHaveLength(0);
  });

  it('BUG #7 REGRESSION: toggleStone to stone costs a turn', () => {
    const f = makePiece('Familiar', 'White', 4, 4);
    const state = makeState([f]);
    const result = toggleStone(f, state);
    expect(result.pieces.find(p => p.id === f.id)!.isStone).toBe(true);
    expect(result.currentTurn).toBe('Black');
  });

  it('BUG #7 REGRESSION: toggleStone from stone is free (no turn switch)', () => {
    const f = makePiece('Familiar', 'White', 4, 4, { isStone: true });
    const state = makeState([f]);
    const result = toggleStone(f, state);
    expect(result.pieces.find(p => p.id === f.id)!.isStone).toBe(false);
    expect(result.currentTurn).toBe('White');
  });

  // --- Full tap flow tests ---

  it('tap2: self-click turns to stone', () => {
    const fam = makePiece('Familiar', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([fam, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const updated = s2.pieces.find(p => p.id === fam.id)!;
    expect(updated.isStone).toBe(true);
  });

  // --- Edge case tests ---

  it('stone piece cannot be captured', () => {
    const fam = makePiece('Familiar', 'White', 4, 4, { isStone: true });
    const enemy = makePiece('Rook', 'Black', 4, 0);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([fam, enemy, wk, bk], {
      currentTurn: 'Black',
      selectedSquare: { row: 4, col: 0 },
      highlights: [{ row: 4, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.pieces.find(p => p.id === fam.id)).toBeDefined();
  });

  it('un-stoning does not consume the turn', () => {
    const fam = makePiece('Familiar', 'White', 4, 4, { isStone: true });
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([fam, wk, bk]);

    const s1 = tap(state, { row: 4, col: 4 });
    const s2 = tap(s1, { row: 4, col: 4 });
    expect(s2.currentTurn).toBe('White');
    const updated = s2.pieces.find(p => p.id === fam.id)!;
    expect(updated.isStone).toBe(false);
  });
});
