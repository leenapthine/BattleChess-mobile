import { generateTurns } from '@/ai/generateTurns';
import { makePiece, makeState, resetIds } from '../testHelpers';

// Confirms the move generator reaches *ability* turns, not just standard
// moves — the prerequisite for the AI ever using upgraded pieces well. As we
// extend coverage, add one case per ability flow here.
describe('ability move-gen coverage', () => {
  it('generates a NecroPawn sacrifice/detonation turn', () => {
    resetIds();
    // Black pawn sits directly ahead of the NecroPawn — a normal pawn can't
    // capture forward, so the only way to remove it is the blast.
    const state = makeState(
      [
        makePiece('NecroPawn', 'White', 3, 3),
        makePiece('Pawn', 'Black', 4, 3),
        makePiece('King', 'White', 0, 0),
        makePiece('King', 'Black', 7, 7),
      ],
      { currentTurn: 'White' },
    );

    const turns = generateTurns(state);

    // At least one turn is driven by the ability (not a plain move/capture).
    const abilityTurns = turns.filter((t) =>
      t.actions.some((a) => a.type === 'ABILITY_ACTION'),
    );
    expect(abilityTurns.length).toBeGreaterThan(0);

    // And the blast can actually remove the otherwise-untouchable pawn.
    const detonations = abilityTurns.filter(
      (t) => !t.result.pieces.some((p) => p.type === 'Pawn' && p.color === 'Black'),
    );
    expect(detonations.length).toBeGreaterThan(0);
  });
});
