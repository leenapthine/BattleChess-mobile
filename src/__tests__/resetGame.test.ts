import { gameReducer } from '@/engine/gameReducer';
import { makeState, resetIds, createTestState } from './testHelpers';

beforeEach(() => resetIds());

describe('RESET_GAME', () => {
  it('returns fresh initial state', () => {
    const initial = createTestState();
    const modified = gameReducer(initial, {
      type: 'SELECT_SQUARE',
      square: { row: 1, col: 0 },
    });
    expect(modified.selectedSquare).not.toBeNull();

    const reset = gameReducer(modified, { type: 'RESET_GAME' });
    expect(reset.selectedSquare).toBeNull();
    expect(reset.currentTurn).toBe('White');
    expect(reset.highlights).toHaveLength(0);
    expect(reset.abilityMode.type).toBe('none');
    expect(reset.status.type).toBe('active');
    expect(reset.capturedPieces).toHaveLength(0);
  });

  it('works even when game is won', () => {
    const state = makeState([], {
      status: { type: 'won', winner: 'Black' },
    });
    const reset = gameReducer(state, { type: 'RESET_GAME' });
    expect(reset.status.type).toBe('active');
    expect(reset.pieces.length).toBeGreaterThan(0);
  });

  it('produces a full starting board', () => {
    const state = makeState([]);
    const reset = gameReducer(state, { type: 'RESET_GAME' });
    const whites = reset.pieces.filter(p => p.color === 'White');
    const blacks = reset.pieces.filter(p => p.color === 'Black');
    expect(whites).toHaveLength(16);
    expect(blacks).toHaveLength(16);
  });
});
