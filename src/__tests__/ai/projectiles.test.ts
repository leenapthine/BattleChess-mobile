import { chooseTurn, DIFFICULTIES } from '@/ai/chooseTurn';
import { generateTurns } from '@/ai/generateTurns';
import { gameReducer } from '@/engine/gameReducer';
import { makePiece, makeState, resetIds } from '../testHelpers';

function applyTurn(state: ReturnType<typeof makeState>, actions: ReturnType<typeof chooseTurn>) {
  let s = state;
  for (const a of actions!) s = gameReducer(s, a);
  return s;
}

// Single-turn projectile abilities should be both generated and chosen when
// there's a free capture. (BoulderThrower cannot capture by moving at all — its
// only attack is the boulder — so a captured pawn proves the ability was used.)
describe('projectile ability use', () => {
  it('BoulderThrower fires its boulder for a free capture', () => {
    resetIds();
    const state = makeState(
      [
        makePiece('BoulderThrower', 'White', 4, 4),
        makePiece('Pawn', 'Black', 4, 7), // Manhattan distance 3 = in range
        makePiece('King', 'White', 0, 0),
        makePiece('King', 'Black', 7, 7),
      ],
      { currentTurn: 'White' },
    );

    // Move-gen reaches the ability:
    const abilityTurns = generateTurns(state).filter((t) =>
      t.actions.some((a) => a.type === 'ABILITY_ACTION'),
    );
    expect(abilityTurns.length).toBeGreaterThan(0);

    // ...and the bot chooses to fire (only way to take the pawn):
    const after = applyTurn(state, chooseTurn(state, DIFFICULTIES.hard));
    expect(after.pieces.some((p) => p.type === 'Pawn' && p.color === 'Black')).toBe(false);
  });

  it('Beholder fires its beam for a free capture', () => {
    resetIds();
    const state = makeState(
      [
        makePiece('Beholder', 'White', 4, 4),
        makePiece('Knight', 'Black', 4, 6), // distance 2 = in beam range
        makePiece('King', 'White', 0, 0),
        makePiece('King', 'Black', 7, 7),
      ],
      { currentTurn: 'White' },
    );

    const after = applyTurn(state, chooseTurn(state, DIFFICULTIES.hard));
    expect(after.pieces.some((p) => p.type === 'Knight' && p.color === 'Black')).toBe(false);
  });

  it('DeadLauncher loads AND fires on the same turn (one-turn load+fire)', () => {
    resetIds();
    // The black rook at (1,2) is boxed by its own pawns (no moves) and sits at
    // launch distance 3 off the launcher's row/col — only a load-then-fire can
    // take it. Since loading no longer ends the turn, the bot does both in one
    // turn and captures the rook (rather than dawdling by loading + repositioning).
    const state = makeState(
      [
        makePiece('DeadLauncher', 'White', 3, 3),
        makePiece('Pawn', 'White', 3, 4), // adjacent friendly pawn → loadable
        makePiece('King', 'White', 7, 7),
        makePiece('Rook', 'Black', 1, 2),
        makePiece('Pawn', 'Black', 0, 2),
        makePiece('Pawn', 'Black', 2, 2),
        makePiece('Pawn', 'Black', 1, 1),
        makePiece('Pawn', 'Black', 1, 3),
        makePiece('King', 'Black', 7, 0),
      ],
      { currentTurn: 'White' },
    );

    const after = applyTurn(state, chooseTurn(state, DIFFICULTIES.hard));
    expect(after.pieces.some((p) => p.type === 'Rook' && p.color === 'Black')).toBe(false);
  });
});
