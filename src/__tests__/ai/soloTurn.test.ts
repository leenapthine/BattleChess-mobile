import { humanRevivalPending, botDispatchCount } from '@/screens/SoloGame/soloTurn';
import { generateTurns } from '@/ai/generateTurns';
import { gameReducer } from '@/engine/gameReducer';
import { makePiece, makeState, resetIds } from '../testHelpers';
import type { GameState } from '@/types/game';

describe('solo turn revival handling', () => {
  // Black (the bot) can capture White's (human's) QueenOfBones; White has 2
  // pawns to revive. generateTurns auto-resolves the revival into the turn, but
  // in solo the human must pick — so dispatch should stop after the capture.
  function setup(): { state: GameState; captureTurn: ReturnType<typeof generateTurns>[number] } {
    resetIds();
    const state = makeState(
      [
        makePiece('Rook', 'Black', 4, 0),
        makePiece('QueenOfBones', 'White', 4, 4),
        makePiece('Pawn', 'White', 6, 0),
        makePiece('Pawn', 'White', 6, 1),
        makePiece('King', 'White', 0, 0),
        makePiece('King', 'Black', 7, 7),
      ],
      { currentTurn: 'Black' },
    );
    const captureTurn = generateTurns(state).find(
      (t) => !t.result.pieces.some((p) => p.type === 'QueenOfBones' && p.color === 'White'),
    )!;
    return { state, captureTurn };
  }

  it('stops the bot dispatch right after it captures the human QoB', () => {
    const { state, captureTurn } = setup();
    expect(captureTurn).toBeDefined();

    const count = botDispatchCount(state, captureTurn.actions, 'White');
    // The full turn includes the auto-resolved sacrifices; we stop before them.
    expect(count).toBeLessThan(captureTurn.actions.length);

    // Replaying just the dispatched prefix lands on the human's revival prompt.
    let s = state;
    for (let i = 0; i < count; i++) s = gameReducer(s, captureTurn.actions[i]);
    expect(humanRevivalPending(s, 'White')).toBe(true);
  });

  it('dispatches the whole turn when no human revival is involved', () => {
    resetIds();
    const state = makeState(
      [makePiece('Rook', 'Black', 4, 0), makePiece('King', 'White', 0, 0), makePiece('King', 'Black', 7, 7)],
      { currentTurn: 'Black' },
    );
    const turn = generateTurns(state)[0];
    expect(botDispatchCount(state, turn.actions, 'White')).toBe(turn.actions.length);
  });

  it('humanRevivalPending is false in watch mode (no human)', () => {
    const { state, captureTurn } = setup();
    let s = state;
    for (const a of captureTurn.actions) s = gameReducer(s, a);
    expect(humanRevivalPending(s, null)).toBe(false);
  });
});
