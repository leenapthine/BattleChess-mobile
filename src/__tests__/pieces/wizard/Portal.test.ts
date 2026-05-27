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

  it('BUG #9: performEject does NOT switch turn', () => {
    const loaded = makePiece('Pawn', 'White', 0, 0);
    const p = makePiece('Portal', 'White', 4, 4, { pieceLoaded: loaded });
    const state = makeState([p]);
    const result = performEject(p, { row: 4, col: 5 }, state);
    expect(result.currentTurn).toBe('White');
    const ejected = result.pieces.find(pr => pr.id === loaded.id)!;
    expect(ejected.row).toBe(4);
    expect(ejected.col).toBe(5);
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
