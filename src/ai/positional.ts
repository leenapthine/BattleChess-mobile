import type { GameState, Color } from '@/types/game';
import { getPieceModule } from '@/engine/pieces';
import { getPieceAt } from '@/engine/utils';
import { pieceValue } from './pieceValues';

export type Activity = { mobility: number; threat: number };

/**
 * Measure a side's board activity: how many moves it has (mobility) and the
 * total value of enemy pieces it currently attacks (threat) — counting both
 * normal captures *and* ability/projectile reach (Beholder beam, BoulderThrower,
 * DeadLauncher, etc., exposed via getAbilityTargets).
 *
 * This is what lets the eval "see" abilities that don't immediately change
 * material: a projectile controlling squares shows up as threat/mobility, and
 * stunning/stoning an enemy shows up as the *opponent* losing mobility.
 */
export function sideActivity(state: GameState, color: Color): Activity {
  let mobility = 0;
  let threat = 0;

  for (const piece of state.pieces) {
    if (piece.color !== color) continue;
    const mod = getPieceModule(piece.type);
    if (!mod) continue;

    const targets = [
      ...mod.getValidMoves(piece, state.pieces),
      ...(mod.getAbilityTargets ? mod.getAbilityTargets(piece, state.pieces) : []),
    ];

    for (const h of targets) {
      if (h.color === 'move') {
        mobility += 1;
      } else if (h.color === 'capture' || h.color === 'ability') {
        const occupant = getPieceAt(h, state.pieces);
        if (occupant && occupant.color !== color) {
          threat += pieceValue(occupant); // can hit an enemy here
        } else {
          mobility += 0.5; // reaching/affecting an empty or own square — minor
        }
      }
      // 'range' / 'preview' highlights are informational — ignored
    }
  }

  return { mobility, threat };
}
