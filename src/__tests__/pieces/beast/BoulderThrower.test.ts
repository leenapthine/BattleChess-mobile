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

  it('ranged targets: capture on enemies, range on empty', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 4, 7);
    const targets = getAbilityTargets(bt, [bt, enemy]);
    expect(targets.length).toBeGreaterThan(0);
    const enemyHL = targets.find(t => t.row === 4 && t.col === 7);
    expect(enemyHL!.color).toBe('capture');
    const rangeHL = targets.filter(t => t.color === 'range');
    expect(rangeHL.length).toBeGreaterThan(0);
  });

  it('targets distance 1 and 3 but not 2 (donut + core)', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const adjacent = makePiece('Pawn', 'Black', 4, 5); // distance 1 → stomp
    const gap = makePiece('Pawn', 'Black', 4, 6);       // distance 2 → blind spot
    const lob = makePiece('Pawn', 'Black', 4, 7);       // distance 3 → long throw
    const far = makePiece('Pawn', 'Black', 4, 0);       // distance 4 → out of range
    const targets = getAbilityTargets(bt, [bt, adjacent, gap, lob, far]);
    const coords = targets.map(t => `${t.row},${t.col}`);
    expect(coords).toContain('4,5'); // adjacent now reachable
    expect(coords).toContain('4,7'); // long lob still reachable
    expect(coords).not.toContain('4,6'); // distance-2 blind spot
    expect(coords).not.toContain('4,0'); // distance 4 out of range
  });

  it('stomps an adjacent enemy (distance 1) — the close-range fix', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const adjacent = makePiece('Pawn', 'Black', 4, 5);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([bt, adjacent, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const s3 = tap(s2, { row: 4, col: 5 });
    expect(s3.pieces.find(p => p.id === adjacent.id)).toBeUndefined();
    expect(s3.currentTurn).toBe('Black');
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

  it('clicking outside range exits boulder mode', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([bt, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    expect(s2.abilityMode.type).toBe('boulder');
    const s3 = tap(s2, { row: 0, col: 0 });
    expect(s3.abilityMode.type).toBe('none');
  });

  it('clicking range circle does not exit boulder mode', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([bt, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const rangeHL = s2.highlights.find(h => h.color === 'range');
    expect(rangeHL).toBeDefined();
    const s3 = tap(s2, { row: rangeHL!.row, col: rangeHL!.col });
    expect(s3.abilityMode.type).toBe('boulder');
  });

  it('cannot capture enemy outside range', () => {
    const bt = makePiece('BoulderThrower', 'White', 4, 4);
    const farEnemy = makePiece('Pawn', 'Black', 0, 0);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([bt, farEnemy, wk, bk]);

    const s2 = selectAndSelfClick(state, 4, 4);
    const s3 = tap(s2, { row: 0, col: 0 });
    expect(s3.pieces.find(p => p.id === farEnemy.id)).toBeDefined();
    expect(s3.abilityMode.type).toBe('none');
  });
});
