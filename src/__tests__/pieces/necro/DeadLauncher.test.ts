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

  it('getLaunchTargets shows capture on enemies and range on empty/friendly', () => {
    const dl = makePiece('DeadLauncher', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 4, 7);
    const targets = getLaunchTargets(dl, [dl, enemy]);
    const enemyHL = targets.find(t => t.row === 4 && t.col === 7);
    expect(enemyHL).toBeDefined();
    expect(enemyHL!.color).toBe('capture');
    const emptyHL = targets.find(t => t.row === 7 && t.col === 4);
    expect(emptyHL).toBeDefined();
    expect(emptyHL!.color).toBe('range');
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

  it('tap3: clicking adjacent pawn loads it without ending the turn', () => {
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
    // Loading is a free pre-action now: turn does NOT end, and the launcher
    // stays selected so it can launch or move to finish the turn.
    expect(s3.currentTurn).toBe('White');
    expect(s3.abilityMode.type).toBe('none');
    expect(s3.selectedSquare).toEqual({ row: 0, col: 0 });
    expect(s3.highlights.length).toBeGreaterThan(0);
  });

  it('loads then launches on the same turn (load is free)', () => {
    const dl = makePiece('DeadLauncher', 'White', 0, 0);
    const pawn = makePiece('NecroPawn', 'White', 0, 1);
    const enemy = makePiece('Pawn', 'Black', 3, 0); // launch range
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([dl, pawn, wk, bk, enemy]);

    const s2 = selectAndSelfClick(state, 0, 0);     // → loading
    const s3 = tap(s2, { row: 0, col: 1 });          // load pawn (turn continues)
    const s4 = tap(s3, { row: 0, col: 0 });          // self-click → launch mode
    expect(s4.abilityMode.type).toBe('launch');
    const s5 = tap(s4, { row: 3, col: 0 });          // fire
    expect(s5.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    expect(s5.currentTurn).toBe('Black');            // launching ends the turn
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

  it('cannot load a non-pawn friendly piece', () => {
    const dl = makePiece('DeadLauncher', 'White', 0, 0);
    const rook = makePiece('Rook', 'White', 0, 1);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([dl, rook, wk, bk]);

    const s2 = selectAndSelfClick(state, 0, 0);
    expect(s2.abilityMode.type).toBe('loading');
    const s3 = tap(s2, { row: 0, col: 1 });
    expect(s3.pieces.find(p => p.id === rook.id)).toBeDefined();
    expect(s3.pieces.find(p => p.id === dl.id)!.pawnLoaded).toBe(false);
  });

  it('cannot load itself', () => {
    const dl = makePiece('DeadLauncher', 'White', 0, 0);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([dl, wk, bk]);

    const s2 = selectAndSelfClick(state, 0, 0);
    const s3 = tap(s2, { row: 0, col: 0 });
    expect(s3.pieces.find(p => p.id === dl.id)).toBeDefined();
    expect(s3.pieces.find(p => p.id === dl.id)!.pawnLoaded).toBe(false);
  });

  it('loading only accepts highlighted pawn targets', () => {
    const dl = makePiece('DeadLauncher', 'White', 0, 0);
    const farPawn = makePiece('NecroPawn', 'White', 5, 5);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 7);
    const state = makeState([dl, farPawn, wk, bk]);

    const s2 = selectAndSelfClick(state, 0, 0);
    const s3 = tap(s2, { row: 5, col: 5 });
    expect(s3.pieces.find(p => p.id === farPawn.id)).toBeDefined();
  });

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
