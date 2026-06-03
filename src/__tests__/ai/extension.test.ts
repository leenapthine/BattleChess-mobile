import { chooseTurn, isSetupTurn, DIFFICULTIES } from '@/ai/chooseTurn';
import { gameReducer } from '@/engine/gameReducer';
import type { GameState } from '@/types/game';
import { makePiece, makeState, resetIds } from '../testHelpers';

function applyTurn(state: GameState, actions: ReturnType<typeof chooseTurn>): GameState {
  let s = state;
  for (const a of actions!) s = gameReducer(s, a);
  return s;
}

const launcherLoaded = (s: GameState) =>
  s.pieces.some((p) => p.type === 'DeadLauncher' && p.color === 'White' && p.pawnLoaded);

describe('selective search extension (ability setups)', () => {
  it('isSetupTurn detects a newly loaded piece', () => {
    resetIds();
    const before = makeState([
      makePiece('DeadLauncher', 'White', 4, 4),
      makePiece('King', 'White', 7, 7),
      makePiece('King', 'Black', 0, 0),
    ]);
    const loaded: GameState = {
      ...before,
      pieces: before.pieces.map((p) =>
        p.type === 'DeadLauncher' ? { ...p, pawnLoaded: true } : p,
      ),
    };
    const justMoved: GameState = {
      ...before,
      pieces: before.pieces.map((p) =>
        p.type === 'King' && p.color === 'White' ? { ...p, row: 6 } : p,
      ),
    };
    expect(isSetupTurn(before, loaded, 'White')).toBe(true);
    expect(isSetupTurn(before, justMoved, 'White')).toBe(false);
  });

  it('fires a pre-loaded launcher for a capture only the launch can reach', () => {
    resetIds();
    const state = makeState(
      [
        makePiece('DeadLauncher', 'White', 4, 4, { pawnLoaded: true }),
        makePiece('Rook', 'Black', 2, 3), // Manhattan dist 3, off row/col → launch-only
        makePiece('King', 'White', 7, 7),
        makePiece('King', 'Black', 0, 0),
      ],
      { currentTurn: 'White' },
    );
    const after = applyTurn(state, chooseTurn(state, DIFFICULTIES.normal));
    expect(after.pieces.some((p) => p.type === 'Rook' && p.color === 'Black')).toBe(false);
  });

  it('with extension it loads toward a trapped target; without, it does not', () => {
    resetIds();
    // The black rook at (1,2) is boxed by its own pawns (zero moves) and sits
    // at launch distance 3 off the launcher's row/col — so it can only die to a
    // load-then-fire. Loading costs a pawn now; the rook (5) falls next turn.
    const build = () =>
      makeState(
        [
          makePiece('DeadLauncher', 'White', 3, 3),
          makePiece('Pawn', 'White', 3, 4), // adjacent friendly pawn → loadable
          makePiece('King', 'White', 7, 7),
          makePiece('Rook', 'Black', 1, 2), // trapped target
          makePiece('Pawn', 'Black', 0, 2),
          makePiece('Pawn', 'Black', 2, 2),
          makePiece('Pawn', 'Black', 1, 1),
          makePiece('Pawn', 'Black', 1, 3),
          makePiece('King', 'Black', 7, 0),
        ],
        { currentTurn: 'White' },
      );

    const s1 = build();
    expect(launcherLoaded(applyTurn(s1, chooseTurn(s1, DIFFICULTIES.normal)))).toBe(true);

    const s2 = build();
    expect(launcherLoaded(applyTurn(s2, chooseTurn(s2, { depth: 2, extension: 0 })))).toBe(false);
  });
});
