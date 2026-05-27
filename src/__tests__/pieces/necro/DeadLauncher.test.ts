import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, getLoadTargets, getLaunchTargets } from '@/engine/pieces/DeadLauncher';
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

describe('DeadLauncher', () => {
  // --- Movement tests ---

  it('moves like a rook', () => {
    const dl = makePiece('DeadLauncher', 'White', 0, 0);
    expect(getValidMoves(dl, [dl]).length).toBe(14);
  });

  // --- Unit function tests ---

  it('getLoadTargets shows adjacent friendly pawns', () => {
    const dl = makePiece('DeadLauncher', 'White', 0, 0);
    const pawn = makePiece('NecroPawn', 'White', 0, 1);
    const enemy = makePiece('Pawn', 'Black', 1, 0);
    const targets = getLoadTargets(dl, [dl, pawn, enemy]);
    expect(targets).toHaveLength(1);
    expect(hasSquare(targets, 0, 1)).toBe(true);
  });

  it('BUG #6 REGRESSION: getLaunchTargets only shows enemy-occupied squares', () => {
    const dl = makePiece('DeadLauncher', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 4, 7);
    const targets = getLaunchTargets(dl, [dl, enemy]);
    expect(targets.every(t => t.color === 'capture')).toBe(true);
    expect(hasSquare(targets, 4, 7)).toBe(true);
    const emptyTarget = targets.find(t => t.row === 7 && t.col === 4);
    expect(emptyTarget).toBeUndefined();
  });

  // --- Full tap flow tests ---

  it('tap2: self-click enters loading mode', () => {
    const dl = makePiece('DeadLauncher', 'White', 0, 0);
    const pawn = makePiece('NecroPawn', 'White', 0, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([dl, pawn, wk, bk]);

    const s2 = selectAndSelfClick(state, 0, 0);
    expect(s2.abilityMode.type).toBe('loading');
  });

  it('tap3: clicking adjacent pawn loads it', () => {
    const dl = makePiece('DeadLauncher', 'White', 0, 0);
    const pawn = makePiece('NecroPawn', 'White', 0, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([dl, pawn, wk, bk]);

    const s2 = selectAndSelfClick(state, 0, 0);
    const s3 = tap(s2, { row: 0, col: 1 });
    const loader = s3.pieces.find(p => p.id === dl.id)!;
    expect(loader.pawnLoaded).toBe(true);
    expect(s3.pieces.find(p => p.id === pawn.id)).toBeUndefined();
    expect(s3.currentTurn).toBe('Black');
  });

  it('loaded launcher: self-click enters launch mode', () => {
    const dl = makePiece('DeadLauncher', 'White', 0, 0, { pawnLoaded: true });
    const enemy = makePiece('Pawn', 'Black', 3, 0);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([dl, enemy, wk, bk]);

    const s2 = selectAndSelfClick(state, 0, 0);
    expect(s2.abilityMode.type).toBe('launch');
  });

  it('tap on launch target fires and captures', () => {
    const dl = makePiece('DeadLauncher', 'White', 0, 0, { pawnLoaded: true });
    const enemy = makePiece('Pawn', 'Black', 3, 0);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([dl, enemy, wk, bk]);

    const s2 = selectAndSelfClick(state, 0, 0);
    const s3 = tap(s2, { row: 3, col: 0 });
    expect(s3.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    const launcher = s3.pieces.find(p => p.id === dl.id)!;
    expect(launcher.pawnLoaded).toBe(false);
    expect(s3.currentTurn).toBe('Black');
  });

  // --- Edge case tests ---

  it('can still move normally while loaded', () => {
    const dl = makePiece('DeadLauncher', 'White', 0, 0, { pawnLoaded: true });
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([dl, wk, bk], {
      selectedSquare: { row: 0, col: 0 },
      highlights: [{ row: 3, col: 0, color: 'move' }],
    });

    const s1 = tap(state, { row: 3, col: 0 });
    const launcher = s1.pieces.find(p => p.id === dl.id)!;
    expect(launcher.row).toBe(3);
    expect(launcher.col).toBe(0);
    expect(launcher.pawnLoaded).toBe(true);
  });
});
