import type { GameState, GameAction, Color } from '@/types/game';
import { gameReducer } from '@/engine/gameReducer';

/**
 * True when the game is paused on the *human's own* QueenOfBones revival — they
 * must pick 2 pawns to sacrifice — even though it may currently be the bot's
 * turn (the revival fires mid-attacker-turn). Used to (a) let the human tap
 * during it and (b) stop the bot from acting until the human resolves it.
 */
export function humanRevivalPending(state: GameState, humanColor: Color | null): boolean {
  return (
    humanColor !== null &&
    state.abilityMode.type === 'sacrificeSelection' &&
    state.abilityMode.queenColor === humanColor
  );
}

/**
 * How many of the bot's turn actions to actually dispatch. If the bot's turn
 * captures the human's QueenOfBones, dispatch stops right after the capture —
 * which opens the human's pick-2-pawns prompt — so the HUMAN chooses the
 * sacrifices. The bot's auto-resolved sacrifice taps (appended by generateTurns)
 * are dropped. Otherwise the whole turn is dispatched.
 */
export function botDispatchCount(
  state: GameState,
  actions: GameAction[],
  humanColor: Color | null,
): number {
  let sim = state;
  for (let i = 0; i < actions.length; i += 1) {
    sim = gameReducer(sim, actions[i]);
    if (humanRevivalPending(sim, humanColor)) return i + 1;
  }
  return actions.length;
}
