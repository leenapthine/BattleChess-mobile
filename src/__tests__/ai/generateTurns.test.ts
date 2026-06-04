import { generateTurns } from '@/ai/generateTurns';
import { createInitialState } from '@/engine/initialBoard';
import { createDefaultArmy } from '@/types/army';
import { makePiece, makeState, resetIds } from '../testHelpers';

describe('generateTurns', () => {
  it('produces legal opening turns that hand control to the opponent', () => {
    const state = createInitialState(createDefaultArmy('Necro'), createDefaultArmy('Wizard'));
    const turns = generateTurns(state);

    // Default armies are plain chess pieces: 8 pawns × 2 + 2 knights × 2 = 20.
    expect(turns.length).toBe(20);
    for (const t of turns) {
      expect(t.result.currentTurn).toBe('Black'); // White moved
      expect(t.actions[0].type).toBe('SELECT_SQUARE');
      expect(t.actions.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('finds a capturing turn when one is available', () => {
    resetIds();
    const state = makeState(
      [
        makePiece('Rook', 'White', 0, 0),
        makePiece('King', 'White', 7, 7),
        makePiece('Queen', 'Black', 0, 5), // clear rank between rook and queen
        makePiece('King', 'Black', 7, 0),
      ],
      { currentTurn: 'White' },
    );

    const turns = generateTurns(state);
    const capturesQueen = turns.filter(
      (t) => !t.result.pieces.some((p) => p.type === 'Queen' && p.color === 'Black'),
    );
    expect(capturesQueen.length).toBeGreaterThan(0);
  });

  it('can capture an enemy QueenOfBones (auto-resolving its revival)', () => {
    resetIds();
    // White rook can take the Black QoB along the rank; Black has 2 pawns, so
    // capturing triggers a revival. The search must still produce this turn
    // (previously the sacrificeSelection sub-flow made it un-enumerable).
    const state = makeState(
      [
        makePiece('Rook', 'White', 4, 0),
        makePiece('QueenOfBones', 'Black', 4, 4),
        makePiece('NecroPawn', 'Black', 6, 0),
        makePiece('NecroPawn', 'Black', 6, 1),
        makePiece('King', 'White', 0, 0),
        makePiece('King', 'Black', 7, 7),
      ],
      { currentTurn: 'White' },
    );

    const turns = generateTurns(state);
    // The capturing turn exists: the original QueenOfBones is gone...
    const capturesQoB = turns.filter(
      (t) => !t.result.pieces.some((p) => p.type === 'QueenOfBones' && p.color === 'Black'),
    );
    expect(capturesQoB.length).toBeGreaterThan(0);
    // ...and the defender revived a plain Queen for 2 pawns (auto-resolved).
    const revived = capturesQoB.find(
      (t) => t.result.pieces.some((p) => p.type === 'Queen' && p.color === 'Black'),
    );
    expect(revived).toBeDefined();
    expect(revived!.result.pieces.filter((p) => p.color === 'Black' && p.type === 'NecroPawn'))
      .toHaveLength(0);
  });

  it('returns no turns once the game is over', () => {
    resetIds();
    const state = makeState([makePiece('King', 'White', 0, 0)], {
      status: { type: 'won', winner: 'White' },
    });
    expect(generateTurns(state)).toEqual([]);
  });
});
