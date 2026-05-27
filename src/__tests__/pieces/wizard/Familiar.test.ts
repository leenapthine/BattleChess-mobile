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

  // --- Stone immunity ---

  it('stone familiar not shown as capture target by sliding pieces', () => {
    const fam = makePiece('Familiar', 'Black', 4, 4, { isStone: true });
    const rook = makePiece('Rook', 'White', 4, 0);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([fam, rook, wk, bk]);

    const s1 = tap(state, { row: 4, col: 0 });
    const captureHL = s1.highlights.find(h => h.row === 4 && h.col === 4);
    expect(captureHL).toBeUndefined();
  });

  it('stone familiar not shown as capture target by knight', () => {
    const fam = makePiece('Familiar', 'Black', 2, 3, { isStone: true });
    const knight = makePiece('Knight', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([fam, knight, wk, bk]);

    const s1 = tap(state, { row: 4, col: 4 });
    const captureHL = s1.highlights.find(h => h.row === 2 && h.col === 3);
    expect(captureHL).toBeUndefined();
  });

  it('stone familiar survives PawnHopper hop', () => {
    const fam = makePiece('Familiar', 'Black', 3, 4, { isStone: true });
    const ph = makePiece('PawnHopper', 'White', 2, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([fam, ph, wk, bk], {
      selectedSquare: { row: 2, col: 4 },
      highlights: [{ row: 4, col: 4, color: 'move' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.pieces.find(p => p.id === fam.id)).toBeDefined();
  });

  it('stone familiar not shown as pawn diagonal capture', () => {
    const fam = makePiece('Familiar', 'Black', 3, 3, { isStone: true });
    const pawn = makePiece('Pawn', 'White', 2, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([fam, pawn, wk, bk]);

    const s1 = tap(state, { row: 2, col: 4 });
    const captureHL = s1.highlights.find(h => h.row === 3 && h.col === 3);
    expect(captureHL).toBeUndefined();
  });

  it('stone familiar survives NecroPawn sacrifice AoE', () => {
    const fam = makePiece('Familiar', 'Black', 4, 5, { isStone: true });
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([fam, np, wk, bk], {
      abilityMode: { type: 'sacrifice', pieceId: np.id, armed: true },
    });

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.pieces.find(p => p.id === fam.id)).toBeDefined();
  });

  it('stone familiar not shown as WizardKing vertical target', () => {
    const fam = makePiece('Familiar', 'Black', 7, 4, { isStone: true });
    const wk2 = makePiece('WizardKing', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 0);
    const state = makeState([fam, wk2, wk, bk]);

    const s1 = tap(state, { row: 4, col: 4 });
    const captureHL = s1.highlights.find(h => h.row === 7 && h.col === 4 && h.color === 'capture');
    expect(captureHL).toBeUndefined();
  });
});
