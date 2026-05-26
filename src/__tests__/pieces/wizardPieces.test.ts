import { getValidMoves as getYWMoves } from '@/engine/pieces/YoungWiz';
import { getValidMoves as getFamiliarMoves, getAbilityTargets as getFamiliarTargets, toggleStone } from '@/engine/pieces/Familiar';
import { getValidMoves as getWTMoves, performRangedCapture as wtRangedCapture } from '@/engine/pieces/WizardTower';
import { getValidMoves as getPortalMoves, getLoadTargets, getEjectTargets, performLoad, performEject } from '@/engine/pieces/Portal';
import { getValidMoves as getWKMoves, performRangedCapture as wkRangedCapture } from '@/engine/pieces/WizardKing';
import { getValidMoves as getQoIMoves, getAbilityTargets as getQoITargets, performSwap } from '@/engine/pieces/QueenOfIllusions';
import { makePiece, makeState, resetIds, hasSquare } from '../testHelpers';

beforeEach(() => resetIds());

describe('YoungWiz', () => {
  it('has standard pawn moves plus zap capture', () => {
    const yw = makePiece('YoungWiz', 'White', 3, 3);
    const enemy = makePiece('Pawn', 'Black', 4, 3);
    const moves = getYWMoves(yw, [yw, enemy]);
    const zap = moves.find(m => m.row === 4 && m.col === 3);
    expect(zap).toBeDefined();
    expect(zap!.color).toBe('capture');
  });

  it('no zap when square ahead is empty', () => {
    const yw = makePiece('YoungWiz', 'White', 3, 3);
    const moves = getYWMoves(yw, [yw]);
    const forward = moves.find(m => m.row === 4 && m.col === 3);
    expect(forward!.color).toBe('move');
  });

  it('no zap on friendly piece ahead', () => {
    const yw = makePiece('YoungWiz', 'White', 3, 3);
    const ally = makePiece('Pawn', 'White', 4, 3);
    const moves = getYWMoves(yw, [yw, ally]);
    expect(hasSquare(moves, 4, 3)).toBe(false);
  });
});

describe('Familiar', () => {
  it('moves like a knight', () => {
    const f = makePiece('Familiar', 'White', 4, 4);
    expect(getFamiliarMoves(f, [f])).toHaveLength(8);
  });

  it('getAbilityTargets shows self when not stone', () => {
    const f = makePiece('Familiar', 'White', 4, 4);
    const targets = getFamiliarTargets(f, [f]);
    expect(targets).toHaveLength(1);
    expect(targets[0].row).toBe(4);
    expect(targets[0].col).toBe(4);
  });

  it('getAbilityTargets empty when already stone', () => {
    const f = makePiece('Familiar', 'White', 4, 4, { isStone: true });
    expect(getFamiliarTargets(f, [f])).toHaveLength(0);
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
});

describe('WizardTower', () => {
  it('moves like a bishop', () => {
    const wt = makePiece('WizardTower', 'White', 4, 4);
    expect(getWTMoves(wt, [wt]).length).toBe(13);
  });

  it('BUG #3 REGRESSION: performRangedCapture ends turn', () => {
    const wt = makePiece('WizardTower', 'White', 0, 0);
    const enemy = makePiece('Pawn', 'Black', 3, 3);
    const state = makeState([wt, enemy]);
    const result = wtRangedCapture(wt, { row: 3, col: 3 }, state);
    expect(result.pieces.find(p => p.id === enemy.id)).toBeUndefined();
    expect(result.currentTurn).toBe('Black');
  });

  it('performRangedCapture does not move tower', () => {
    const wt = makePiece('WizardTower', 'White', 0, 0);
    const enemy = makePiece('Pawn', 'Black', 3, 3);
    const state = makeState([wt, enemy]);
    const result = wtRangedCapture(wt, { row: 3, col: 3 }, state);
    const tower = result.pieces.find(p => p.id === wt.id)!;
    expect(tower.row).toBe(0);
    expect(tower.col).toBe(0);
  });
});

describe('Portal', () => {
  it('moves like a rook', () => {
    const p = makePiece('Portal', 'White', 0, 0);
    expect(getPortalMoves(p, [p]).length).toBe(14);
  });

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

describe('WizardKing', () => {
  it('has king moves plus vertical line-of-sight captures', () => {
    const wk = makePiece('WizardKing', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 7, 4);
    const moves = getWKMoves(wk, [wk, enemy]);
    expect(hasSquare(moves, 7, 4)).toBe(true);
    const ranged = moves.find(m => m.row === 7 && m.col === 4);
    expect(ranged!.color).toBe('capture');
  });

  it('vertical shot blocked by intervening piece', () => {
    const wk = makePiece('WizardKing', 'White', 4, 4);
    const blocker = makePiece('Pawn', 'White', 6, 4);
    const enemy = makePiece('Pawn', 'Black', 7, 4);
    const moves = getWKMoves(wk, [wk, blocker, enemy]);
    expect(hasSquare(moves, 7, 4)).toBe(false);
  });

  it('BUG #4 REGRESSION: performRangedCapture ends turn', () => {
    const wk = makePiece('WizardKing', 'White', 4, 4);
    const enemy = makePiece('Pawn', 'Black', 7, 4);
    const state = makeState([wk, enemy]);
    const result = wkRangedCapture(wk, { row: 7, col: 4 }, state);
    expect(result.currentTurn).toBe('Black');
  });

  it('performRangedCapture rejects adjacent targets', () => {
    const wk = makePiece('WizardKing', 'White', 4, 4);
    const adj = makePiece('Pawn', 'Black', 5, 4);
    const state = makeState([wk, adj]);
    const result = wkRangedCapture(wk, { row: 5, col: 4 }, state);
    expect(result.pieces.find(p => p.id === adj.id)).toBeDefined();
  });
});

describe('QueenOfIllusions', () => {
  it('moves like a queen', () => {
    const q = makePiece('QueenOfIllusions', 'White', 4, 4);
    expect(getQoIMoves(q, [q]).length).toBe(27);
  });

  it('getAbilityTargets shows all friendly pawn-types', () => {
    const q = makePiece('QueenOfIllusions', 'White', 4, 4);
    const p1 = makePiece('Pawn', 'White', 0, 0);
    const p2 = makePiece('NecroPawn', 'White', 1, 1);
    const rook = makePiece('Rook', 'White', 7, 7);
    const targets = getQoITargets(q, [q, p1, p2, rook]);
    expect(targets).toHaveLength(2);
  });

  it('performSwap swaps positions', () => {
    const q = makePiece('QueenOfIllusions', 'White', 4, 4);
    const p = makePiece('Pawn', 'White', 0, 0);
    const state = makeState([q, p]);
    const result = performSwap(q, p.id, state);
    const queen = result.pieces.find(pc => pc.id === q.id)!;
    const pawn = result.pieces.find(pc => pc.id === p.id)!;
    expect(queen.row).toBe(0);
    expect(queen.col).toBe(0);
    expect(pawn.row).toBe(4);
    expect(pawn.col).toBe(4);
    expect(result.currentTurn).toBe('Black');
  });

  it('performSwap rejects non-pawn targets', () => {
    const q = makePiece('QueenOfIllusions', 'White', 4, 4);
    const rook = makePiece('Rook', 'White', 0, 0);
    const state = makeState([q, rook]);
    const result = performSwap(q, rook.id, state);
    expect(result.pieces.find(p => p.id === q.id)!.row).toBe(4);
  });
});
