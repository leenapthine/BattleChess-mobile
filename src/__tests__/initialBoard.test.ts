import { createInitialState } from '@/engine/initialBoard';

describe('initialBoard', () => {
  it('has capturedPieces array', () => {
    const state = createInitialState();
    expect(Array.isArray(state.capturedPieces)).toBe(true);
    expect(state.capturedPieces).toHaveLength(0);
  });

  it('has 32 pieces total', () => {
    const state = createInitialState();
    expect(state.pieces).toHaveLength(32);
  });

  it('White pieces are on rows 0-1', () => {
    const state = createInitialState();
    const whites = state.pieces.filter(p => p.color === 'White');
    expect(whites.every(p => p.row <= 1)).toBe(true);
  });

  it('Black pieces are on rows 6-7', () => {
    const state = createInitialState();
    const blacks = state.pieces.filter(p => p.color === 'Black');
    expect(blacks.every(p => p.row >= 6)).toBe(true);
  });

  it('GhoulKing starts with raisesLeft: 1', () => {
    const state = createInitialState();
    const gk = state.pieces.find(p => p.type === 'GhoulKing');
    expect(gk).toBeDefined();
    expect(gk!.raisesLeft).toBe(1);
  });

  it('all pieces start with default flags', () => {
    const state = createInitialState();
    for (const p of state.pieces) {
      expect(p.hasMoved).toBe(false);
      expect(p.stunned).toBe(false);
      expect(p.isStone).toBe(false);
    }
  });
});
