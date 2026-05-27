import { getValidMoves, getLoadTargets, getEjectTargets, performLoad, performEject } from '@/engine/pieces/Portal';
import { makePiece, makeState, resetIds } from '../../testHelpers';

beforeEach(() => resetIds());

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
});
