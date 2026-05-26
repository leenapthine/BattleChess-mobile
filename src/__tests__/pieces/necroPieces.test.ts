import { getValidMoves as getNecroPawnMoves, getAbilityTargets, performSacrifice } from '@/engine/pieces/NecroPawn';
import { getValidMoves as getGhostKnightMoves, applyStunEffect } from '@/engine/pieces/GhostKnight';
import { getValidMoves as getNecromancerMoves, getResurrectionTargets } from '@/engine/pieces/Necromancer';
import { getValidMoves as getDLMoves, getLoadTargets, getLaunchTargets } from '@/engine/pieces/DeadLauncher';
import { getValidMoves as getGKMoves, getAbilityTargets as getGKAbilityTargets, performRaise } from '@/engine/pieces/GhoulKing';
import { getValidMoves as getQoBMoves, canRevive, performRevival } from '@/engine/pieces/QueenOfBones';
import { makePiece, makeState, resetIds, hasSquare } from '../testHelpers';

beforeEach(() => resetIds());

describe('NecroPawn', () => {
  it('has standard pawn moves', () => {
    const np = makePiece('NecroPawn', 'White', 1, 3);
    const moves = getNecroPawnMoves(np, [np]);
    expect(hasSquare(moves, 2, 3)).toBe(true);
    expect(hasSquare(moves, 3, 3)).toBe(true);
  });

  it('getAbilityTargets returns all 8 adjacent squares', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const targets = getAbilityTargets(np, [np]);
    expect(targets).toHaveLength(8);
  });

  it('performSacrifice removes pieces in AoE and self', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 4, 5);
    const enemy = makePiece('Pawn', 'Black', 3, 3);
    const far = makePiece('Pawn', 'Black', 0, 0);
    const state = makeState([np, ally, enemy, far]);
    const result = performSacrifice(np, state);
    expect(result.pieces).toHaveLength(1);
    expect(result.pieces[0].id).toBe(far.id);
    expect(result.currentTurn).toBe('Black');
  });

  it('performSacrifice respects isStone', () => {
    const np = makePiece('NecroPawn', 'White', 4, 4);
    const stoned = makePiece('Pawn', 'Black', 4, 5, { isStone: true });
    const state = makeState([np, stoned]);
    const result = performSacrifice(np, state);
    expect(result.pieces).toHaveLength(1);
    expect(result.pieces[0].id).toBe(stoned.id);
  });
});

describe('GhostKnight', () => {
  it('moves like a knight', () => {
    const gk = makePiece('GhostKnight', 'White', 4, 4);
    expect(getGhostKnightMoves(gk, [gk])).toHaveLength(8);
  });

  it('applyStunEffect stuns adjacent enemies', () => {
    const gk = makePiece('GhostKnight', 'White', 4, 4);
    const adj = makePiece('Pawn', 'Black', 4, 5);
    const far = makePiece('Pawn', 'Black', 0, 0);
    const result = applyStunEffect(gk, [gk, adj, far]);
    expect(result.find(p => p.id === adj.id)!.stunned).toBe(true);
    expect(result.find(p => p.id === far.id)!.stunned).toBe(false);
  });

  it('does not stun friendly pieces', () => {
    const gk = makePiece('GhostKnight', 'White', 4, 4);
    const ally = makePiece('Pawn', 'White', 4, 5);
    const result = applyStunEffect(gk, [gk, ally]);
    expect(result.find(p => p.id === ally.id)!.stunned).toBe(false);
  });
});

describe('Necromancer', () => {
  it('moves like a bishop', () => {
    const nec = makePiece('Necromancer', 'White', 4, 4);
    expect(getNecromancerMoves(nec, [nec]).length).toBe(13);
  });

  it('getResurrectionTargets returns empty adjacent squares', () => {
    const blocker = makePiece('Pawn', 'White', 3, 3);
    const targets = getResurrectionTargets({ row: 3, col: 4 }, [blocker]);
    expect(targets.length).toBe(3);
    expect(hasSquare(targets, 3, 3)).toBe(false);
  });
});

describe('DeadLauncher', () => {
  it('moves like a rook', () => {
    const dl = makePiece('DeadLauncher', 'White', 0, 0);
    expect(getDLMoves(dl, [dl]).length).toBe(14);
  });

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
});

describe('GhoulKing', () => {
  it('moves like a king', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 1 });
    const moves = getGKMoves(gk, [gk]);
    expect(moves).toHaveLength(8);
  });

  it('getAbilityTargets returns empty adjacent when raisesLeft > 0', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 1 });
    const targets = getGKAbilityTargets(gk, [gk]);
    expect(targets).toHaveLength(8);
    expect(targets.every(t => t.color === 'ability')).toBe(true);
  });

  it('getAbilityTargets empty when no raises left', () => {
    const gk = makePiece('GhoulKing', 'White', 4, 4, { raisesLeft: 0 });
    expect(getGKAbilityTargets(gk, [gk])).toHaveLength(0);
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
});

describe('QueenOfBones', () => {
  it('moves like a queen', () => {
    const qob = makePiece('QueenOfBones', 'White', 4, 4);
    expect(getQoBMoves(qob, [qob]).length).toBe(27);
  });

  it('canRevive true when 2+ friendly pawns exist', () => {
    const p1 = makePiece('NecroPawn', 'White', 1, 0);
    const p2 = makePiece('Pawn', 'White', 1, 1);
    expect(canRevive('White', [p1, p2])).toBe(true);
  });

  it('canRevive false when fewer than 2 pawns', () => {
    const p1 = makePiece('NecroPawn', 'White', 1, 0);
    expect(canRevive('White', [p1])).toBe(false);
  });

  it('performRevival spawns queen at d1 and removes sacrifices', () => {
    const p1 = makePiece('Pawn', 'White', 1, 0);
    const p2 = makePiece('Pawn', 'White', 1, 1);
    const state = makeState([p1, p2]);
    const result = performRevival([p1.id, p2.id], 'White', state);
    expect(result.pieces).toHaveLength(1);
    expect(result.pieces[0].type).toBe('QueenOfBones');
    expect(result.pieces[0].row).toBe(0);
    expect(result.pieces[0].col).toBe(3);
  });

  it('performRevival fails silently when spawn occupied', () => {
    const p1 = makePiece('Pawn', 'White', 1, 0);
    const p2 = makePiece('Pawn', 'White', 1, 1);
    const blocker = makePiece('Rook', 'White', 0, 3);
    const state = makeState([p1, p2, blocker]);
    const result = performRevival([p1.id, p2.id], 'White', state);
    expect(result.pieces.find(p => p.type === 'QueenOfBones')).toBeUndefined();
    expect(result.pieces).toHaveLength(1);
  });
});
