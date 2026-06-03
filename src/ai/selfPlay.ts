import type { Color } from '@/types/game';
import type { ArmyConfig, Guild } from '@/types/army';
import { createDefaultArmy } from '@/types/army';
import { createInitialState } from '@/engine/initialBoard';
import { gameReducer } from '@/engine/gameReducer';
import { opponentColor } from '@/engine/pieceTraits';
import { UPGRADE_COSTS } from '@/data/upgradeCosts';
import { chooseTurn, type Difficulty, DIFFICULTIES } from './chooseTurn';

export type GameOutcome = {
  winner: Color | null; // null = draw (hit the ply cap)
  plies: number;
  reason: 'kingCapture' | 'noMoves' | 'plyCap';
};

export type PlayOptions = { difficulty?: Difficulty; maxPlies?: number };

/**
 * Play one full headless AI-vs-AI game. Both sides use chooseTurn. The game
 * ends on king capture, on a side with no legal turn, or at a ply cap (drawn —
 * there's no checkmate, so two bots can otherwise shuffle forever).
 */
export function playGame(
  whiteArmy: ArmyConfig,
  blackArmy: ArmyConfig,
  opts: PlayOptions = {},
): GameOutcome {
  const difficulty = opts.difficulty ?? DIFFICULTIES.easy;
  const maxPlies = opts.maxPlies ?? 200;

  let state = createInitialState(whiteArmy, blackArmy);
  let plies = 0;

  while (state.status.type === 'active' && plies < maxPlies) {
    const actions = chooseTurn(state, difficulty);
    if (!actions) {
      return { winner: opponentColor(state.currentTurn), plies, reason: 'noMoves' };
    }
    for (const a of actions) state = gameReducer(state, a);
    plies += 1;
  }

  if (state.status.type === 'won') {
    return { winner: state.status.winner, plies, reason: 'kingCapture' };
  }
  return { winner: null, plies, reason: 'plyCap' };
}

export type Matchup = { aWins: number; bWins: number; draws: number; games: number };

/**
 * Play `games` between two army builders, alternating colors each game so the
 * first-move (White) advantage cancels out. `buildA`/`buildB` are thunks
 * because army construction is randomized — call them fresh per game.
 */
export function runMatchup(
  buildA: () => ArmyConfig,
  buildB: () => ArmyConfig,
  games: number,
  opts?: PlayOptions,
): Matchup {
  let aWins = 0;
  let bWins = 0;
  let draws = 0;

  for (let i = 0; i < games; i += 1) {
    const aIsWhite = i % 2 === 0;
    const white = aIsWhite ? buildA() : buildB();
    const black = aIsWhite ? buildB() : buildA();
    const r = playGame(white, black, opts);

    if (r.winner === null) {
      draws += 1;
    } else if ((r.winner === 'White') === aIsWhite) {
      aWins += 1;
    } else {
      bWins += 1;
    }
  }

  return { aWins, bWins, draws, games };
}

/**
 * A random legal army: upgrade random affordable slots until the budget can't
 * buy any more. Used by the balance report to sample the whole army space.
 */
export function randomArmy(guild: Guild, pointCap: number): ArmyConfig {
  const base = createDefaultArmy(guild);
  const costs = UPGRADE_COSTS[guild];
  const slots = base.slots.map((s) => ({ ...s }));
  let remaining = pointCap;

  // Repeatedly pick a random affordable, not-yet-upgraded slot.
  for (;;) {
    const affordable = slots
      .map((s, i) => ({ i, cost: costs[s.role] }))
      .filter(({ i, cost }) => !slots[i].upgraded && cost <= remaining);
    if (affordable.length === 0) break;
    const pick = affordable[Math.floor(Math.random() * affordable.length)];
    slots[pick.i].upgraded = true;
    remaining -= pick.cost;
  }

  return { ...base, slots };
}
