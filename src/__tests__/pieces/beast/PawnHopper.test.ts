import { getValidMoves, applyHopCapture } from '@/engine/pieces/PawnHopper';
import { makePiece, resetIds, hasSquare } from '../../testHelpers';

beforeEach(() => resetIds());

describe('PawnHopper', () => {
  // --- Movement tests ---

  it('always has 2-step forward regardless of hasMoved', () => {
    const ph = makePiece('PawnHopper', 'White', 3, 3, { hasMoved: true });
    const moves = getValidMoves(ph, [ph]);
    expect(hasSquare(moves, 5, 3)).toBe(true);
  });

  it('marks 2-step as capture when enemy is in between', () => {
    const ph = makePiece('PawnHopper', 'White', 3, 3);
    const enemy = makePiece('Pawn', 'Black', 4, 3);
    const moves = getValidMoves(ph, [ph, enemy]);
    const twoStep = moves.find(m => m.row === 5 && m.col === 3);
    expect(twoStep).toBeDefined();
    expect(twoStep!.color).toBe('capture');
  });

  // --- Unit function tests ---

  it('applyHopCapture removes hopped enemy', () => {
    const enemy = makePiece('Pawn', 'Black', 4, 3);
    const ph = makePiece('PawnHopper', 'White', 5, 3);
    const result = applyHopCapture({ row: 3, col: 3 }, { row: 5, col: 3 }, [ph, enemy], 'White');
    expect(result.captured).toBeDefined();
    expect(result.captured!.id).toBe(enemy.id);
    expect(result.pieces.find(p => p.id === enemy.id)).toBeUndefined();
  });

  it('applyHopCapture does nothing on same-column single step', () => {
    const ph = makePiece('PawnHopper', 'White', 4, 3);
    const result = applyHopCapture({ row: 3, col: 3 }, { row: 4, col: 3 }, [ph], 'White');
    expect(result.captured).toBeNull();
  });
});
