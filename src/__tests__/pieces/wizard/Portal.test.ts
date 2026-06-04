import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { getValidMoves, getLoadTargets, getEjectTargets, performLoad, performEject } from '@/engine/pieces/Portal';
import { makePiece, makeState, resetIds } from '../../testHelpers';
import type { GameState, Square } from '@/types/game';

beforeEach(() => resetIds());

function tap(state: GameState, square: Square): GameState {
  const action = classifyAction(square, state);
  return gameReducer(state, action);
}

describe('Portal', () => {
  // --- Movement tests ---

  it('moves like a rook', () => {
    const p = makePiece('Portal', 'White', 0, 0);
    expect(getValidMoves(p, [p]).length).toBe(14);
  });

  // --- Unit function tests ---

  it('getLoadTargets shows adjacent friendly pieces', () => {
    const p = makePiece('Portal', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 4, 5);
    const targets = getLoadTargets(p, [p, ally]);
    expect(targets).toHaveLength(1);
  });

  it('getEjectTargets shows adjacent empty squares', () => {
    const p = makePiece('Portal', 'White', 4, 4);
    const targets = getEjectTargets(p, [p]);
    expect(targets).toHaveLength(4);
  });

  it('performLoad removes target and sets pieceLoaded on all friendly portals', () => {
    const p1 = makePiece('Portal', 'White', 0, 0);
    const p2 = makePiece('Portal', 'White', 7, 7);
    const ally = makePiece('Pawn', 'White', 0, 1);
    const state = makeState([p1, p2, ally]);
    const result = performLoad(p1, ally.id, state);
    expect(result.pieces.find(p => p.id === ally.id)).toBeUndefined();
    const portal1 = result.pieces.find(p => p.id === p1.id)!;
    const portal2 = result.pieces.find(p => p.id === p2.id)!;
    expect(portal1.pieceLoaded).not.toBeNull();
    expect(portal2.pieceLoaded).not.toBeNull();
  });

  it('unloading is free: ejecting does NOT end the turn (the move does)', () => {
    // Loading and unloading are both free for the Portal — the move ends the
    // turn. So after ejecting, it's still the same player's turn and the portal
    // stays selected (ready to move and finish the turn).
    const loaded = makePiece('Pawn', 'White', 0, 0);
    const p = makePiece('Portal', 'White', 4, 4, { pieceLoaded: loaded });
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([p, wk, bk], {
      currentTurn: 'White',
      abilityMode: { type: 'launch', pieceId: p.id },
      highlights: [{ row: 4, col: 5, color: 'ability' }],
    });

    const result = tap(state, { row: 4, col: 5 });
    expect(result.currentTurn).toBe('White');             // free — turn continues
    expect(result.selectedSquare).toEqual({ row: 4, col: 4 }); // portal stays selected
    const ejected = result.pieces.find(pr => pr.id === loaded.id)!;
    expect(ejected.row).toBe(4);
    expect(ejected.col).toBe(5);
  });

  it('load → unload → move all happen in one turn', () => {
    const portal = makePiece('Portal', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 4, 5);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([portal, ally, wk, bk], { currentTurn: 'White' });

    const s0 = tap(state, { row: 4, col: 4 });       // select portal
    const s1 = tap(s0, { row: 4, col: 4 });          // self-click → loading mode
    const s2 = tap(s1, { row: 4, col: 5 });          // load the ally (free)
    expect(s2.currentTurn).toBe('White');
    const s3 = tap(s2, { row: 4, col: 4 });          // self-click → eject mode
    const s4 = tap(s3, { row: 4, col: 3 });          // unload to (4,3) (free)
    expect(s4.currentTurn).toBe('White');
    expect(s4.pieces.find(p => p.id === ally.id)).toBeDefined();
    const s5 = tap(s4, { row: 3, col: 4 });          // move the portal → ends turn
    expect(s5.currentTurn).toBe('Black');
  });

  it('cannot unload onto an occupied square or its own square', () => {
    const loaded = makePiece('Pawn', 'White', 0, 0);
    const portal = makePiece('Portal', 'White', 4, 4, { pieceLoaded: loaded });
    const blocker = makePiece('Pawn', 'White', 4, 5); // occupies an adjacent square
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const pieces = [portal, blocker, wk, bk];
    const state = makeState(pieces, {
      currentTurn: 'White',
      abilityMode: { type: 'launch', pieceId: portal.id },
      highlights: getEjectTargets(portal, pieces), // adjacent EMPTY only
    });

    // Occupied adjacent square → not a valid target → no eject (still stored).
    const s1 = tap(state, { row: 4, col: 5 });
    expect(s1.pieces.find(p => p.id === portal.id)!.pieceLoaded).not.toBeNull();
    expect(s1.pieces.filter(p => p.row === 4 && p.col === 5)).toHaveLength(1);

    // The portal's own square → not a valid target → no eject.
    const s2 = tap(state, { row: 4, col: 4 });
    expect(s2.pieces.find(p => p.id === portal.id)!.pieceLoaded).not.toBeNull();
  });

  it('loading does NOT end the turn (free pre-action)', () => {
    const portal = makePiece('Portal', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 4, 5);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([portal, ally, wk, bk], {
      currentTurn: 'White',
      abilityMode: { type: 'loading', pieceId: portal.id },
      highlights: [{ row: 4, col: 5, color: 'ability' }],
    });

    const s1 = tap(state, { row: 4, col: 5 });
    expect(s1.currentTurn).toBe('White');             // turn continues
    expect(s1.abilityMode.type).toBe('none');
    expect(s1.selectedSquare).toEqual({ row: 4, col: 4 }); // portal stays selected
  });

  it('performEject clears pieceLoaded on all friendly portals', () => {
    const loaded = makePiece('Pawn', 'White', 0, 0);
    const p1 = makePiece('Portal', 'White', 4, 4, { pieceLoaded: loaded });
    const p2 = makePiece('Portal', 'White', 7, 7, { pieceLoaded: loaded });
    const state = makeState([p1, p2]);
    const result = performEject(p1, { row: 4, col: 5 }, state);
    expect(result.pieces.find(p => p.id === p1.id)!.pieceLoaded).toBeNull();
    expect(result.pieces.find(p => p.id === p2.id)!.pieceLoaded).toBeNull();
  });

  // --- Graveyard behavior ---

  it('loading a piece does NOT add it to graveyard', () => {
    const portal = makePiece('Portal', 'Black', 7, 0);
    const ally = makePiece('YoungWiz', 'Black', 7, 1);
    const wk = makePiece('King', 'White', 0, 0);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([portal, ally, wk, bk], {
      currentTurn: 'Black',
      abilityMode: { type: 'loading', pieceId: portal.id },
      highlights: [{ row: 7, col: 1, color: 'capture' }],
    });

    const s1 = tap(state, { row: 7, col: 1 });
    expect(s1.pieces.find(p => p.id === ally.id)).toBeUndefined();
    expect(s1.capturedPieces.find(p => p.id === ally.id)).toBeUndefined();
  });

  it('loaded piece goes to graveyard when last portal is captured', () => {
    const loaded = makePiece('YoungWiz', 'Black', 0, 0);
    const portal = makePiece('Portal', 'Black', 4, 4, { pieceLoaded: loaded });
    const attacker = makePiece('Rook', 'White', 4, 0);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([portal, attacker, wk, bk], {
      selectedSquare: { row: 4, col: 0 },
      highlights: [{ row: 4, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.capturedPieces.find(p => p.id === portal.id)).toBeDefined();
    expect(s1.capturedPieces.find(p => p.id === loaded.id)).toBeDefined();
  });

  it('loaded piece does NOT go to graveyard if another portal exists', () => {
    const loaded = makePiece('YoungWiz', 'Black', 0, 0);
    const portal1 = makePiece('Portal', 'Black', 4, 4, { pieceLoaded: loaded });
    const portal2 = makePiece('Portal', 'Black', 7, 7, { pieceLoaded: loaded });
    const attacker = makePiece('Rook', 'White', 4, 0);
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([portal1, portal2, attacker, wk, bk], {
      selectedSquare: { row: 4, col: 0 },
      highlights: [{ row: 4, col: 4, color: 'capture' }],
    });

    const s1 = tap(state, { row: 4, col: 4 });
    expect(s1.capturedPieces.find(p => p.id === portal1.id)).toBeDefined();
    expect(s1.capturedPieces.find(p => p.id === loaded.id)).toBeUndefined();
  });
});
