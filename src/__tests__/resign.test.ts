import { gameReducer } from '@/engine/gameReducer';
import { makePiece, makeState } from './testHelpers';

describe('RESIGN action', () => {
  it('White resigning makes Black the winner with reason "resign"', () => {
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([wk, bk], { currentTurn: 'White' });
    const result = gameReducer(state, { type: 'RESIGN', resigningColor: 'White' });
    expect(result.status).toEqual({ type: 'won', winner: 'Black', reason: 'resign' });
  });

  it('Black resigning makes White the winner with reason "resign"', () => {
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([wk, bk], { currentTurn: 'Black' });
    const result = gameReducer(state, { type: 'RESIGN', resigningColor: 'Black' });
    expect(result.status).toEqual({ type: 'won', winner: 'White', reason: 'resign' });
  });

  it('clears selection and ability mode on resign', () => {
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([wk, bk], {
      selectedSquare: { row: 0, col: 4 },
      highlights: [{ row: 1, col: 4, color: 'move' }],
      abilityMode: { type: 'sacrifice', pieceId: wk.id, armed: true },
    });
    const result = gameReducer(state, { type: 'RESIGN', resigningColor: 'White' });
    expect(result.selectedSquare).toBeNull();
    expect(result.highlights).toHaveLength(0);
    expect(result.abilityMode.type).toBe('none');
  });

  it('RESIGN ignored once game is already won', () => {
    const wk = makePiece('King', 'White', 0, 4);
    const bk = makePiece('King', 'Black', 7, 4);
    const state = makeState([wk, bk], {
      status: { type: 'won', winner: 'White' },
    });
    const result = gameReducer(state, { type: 'RESIGN', resigningColor: 'White' });
    expect(result.status).toEqual({ type: 'won', winner: 'White' });
  });
});
