import { getValidMoves, canRevive, performRevival } from '@/engine/pieces/QueenOfBones';
import { makePiece, makeState, resetIds } from '../../testHelpers';

beforeEach(() => resetIds());

describe('QueenOfBones', () => {
  // --- Movement tests ---

  it('moves like a queen', () => {
    const qob = makePiece('QueenOfBones', 'White', 4, 4);
    expect(getValidMoves(qob, [qob]).length).toBe(27);
  });

  // --- Unit function tests ---

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
