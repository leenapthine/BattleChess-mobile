import { createTestState } from './testHelpers';

describe('initialBoard', () => {
  it('has capturedPieces array', () => {
    const state = createTestState();
    expect(Array.isArray(state.capturedPieces)).toBe(true);
    expect(state.capturedPieces).toHaveLength(0);
  });

  it('has 32 pieces total', () => {
    const state = createTestState();
    expect(state.pieces).toHaveLength(32);
  });

  it('White pieces are on rows 0-1', () => {
    const state = createTestState();
    const whites = state.pieces.filter(p => p.color === 'White');
    expect(whites.every(p => p.row <= 1)).toBe(true);
  });

  it('Black pieces are on rows 6-7', () => {
    const state = createTestState();
    const blacks = state.pieces.filter(p => p.color === 'Black');
    expect(blacks.every(p => p.row >= 6)).toBe(true);
  });

  it('king piece exists for each color', () => {
    const state = createTestState();
    const whiteKing = state.pieces.find(p => p.color === 'White' && p.type.includes('King'));
    const blackKing = state.pieces.find(p => p.color === 'Black' && p.type.includes('King'));
    expect(whiteKing).toBeDefined();
    expect(blackKing).toBeDefined();
  });

  it('all pieces start with default flags', () => {
    const state = createTestState();
    for (const p of state.pieces) {
      expect(p.hasMoved).toBe(false);
      expect(p.stunned).toBe(false);
      expect(p.isStone).toBe(false);
    }
  });
});
