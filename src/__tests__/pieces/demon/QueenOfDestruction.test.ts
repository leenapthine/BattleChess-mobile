import { getValidMoves, triggerDetonation } from '@/engine/pieces/QueenOfDestruction';
import { makePiece, resetIds } from '../../testHelpers';

beforeEach(() => resetIds());

describe('QueenOfDestruction', () => {
  // --- Movement tests ---

  it('moves like a queen', () => {
    const qod = makePiece('QueenOfDestruction', 'Black', 4, 4);
    expect(getValidMoves(qod, [qod]).length).toBe(27);
  });

  // --- Unit function tests ---

  it('triggerDetonation removes adjacent non-stone pieces', () => {
    const qod = makePiece('QueenOfDestruction', 'Black', 4, 4);
    const adj = makePiece('Pawn', 'White', 4, 5);
    const far = makePiece('Pawn', 'White', 0, 0);
    const result = triggerDetonation(qod, [qod, adj, far], null);
    expect(result.find(p => p.id === adj.id)).toBeUndefined();
    expect(result.find(p => p.id === far.id)).toBeDefined();
  });

  it('triggerDetonation skips stone pieces', () => {
    const qod = makePiece('QueenOfDestruction', 'Black', 4, 4);
    const stoned = makePiece('Pawn', 'White', 4, 5, { isStone: true });
    const result = triggerDetonation(qod, [qod, stoned], null);
    expect(result.find(p => p.id === stoned.id)).toBeDefined();
  });

  it('BUG #14 REGRESSION: triggerDetonation skips capturingPiece', () => {
    const qod = makePiece('QueenOfDestruction', 'Black', 4, 4);
    const attacker = makePiece('Rook', 'White', 4, 5);
    const result = triggerDetonation(qod, [qod, attacker], attacker);
    expect(result.find(p => p.id === attacker.id)).toBeDefined();
  });
});
