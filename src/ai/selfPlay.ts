import type { Color } from '@/types/game';
import type { ArmyConfig, Guild } from '@/types/army';
import { createDefaultArmy } from '@/types/army';
import { createInitialState } from '@/engine/initialBoard';
import { gameReducer } from '@/engine/gameReducer';
import { UPGRADE_COSTS } from '@/data/upgradeCosts';
import { chooseTurn, type Difficulty, DIFFICULTIES } from './chooseTurn';
import { terminalWinner } from './evaluate';

export type CapRange = { min: number; max: number };

export function randomCap(range: CapRange): number {
  return range.min + Math.floor(Math.random() * (range.max - range.min + 1));
}

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

  while (terminalWinner(state) === null && plies < maxPlies) {
    const actions = chooseTurn(state, difficulty);
    if (!actions) {
      // Side to move has no legal turn — treat as a loss for that side.
      const loser = state.currentTurn;
      return { winner: loser === 'White' ? 'Black' : 'White', plies, reason: 'noMoves' };
    }
    for (const a of actions) state = gameReducer(state, a);
    plies += 1;
  }

  const winner = terminalWinner(state);
  if (winner) return { winner, plies, reason: 'kingCapture' };
  return { winner: null, plies, reason: 'plyCap' };
}

/**
 * Like playGame, but each side uses its own difficulty. Used to measure the
 * value of search depth: pit depth N vs depth M with identical armies so the
 * only asymmetry is how far each side looks ahead.
 */
export function playGameVs(
  whiteArmy: ArmyConfig,
  blackArmy: ArmyConfig,
  whiteDifficulty: Difficulty,
  blackDifficulty: Difficulty,
  maxPlies = 200,
): GameOutcome {
  let state = createInitialState(whiteArmy, blackArmy);
  let plies = 0;

  while (terminalWinner(state) === null && plies < maxPlies) {
    const difficulty = state.currentTurn === 'White' ? whiteDifficulty : blackDifficulty;
    const actions = chooseTurn(state, difficulty);
    if (!actions) {
      const loser = state.currentTurn;
      return { winner: loser === 'White' ? 'Black' : 'White', plies, reason: 'noMoves' };
    }
    for (const a of actions) state = gameReducer(state, a);
    plies += 1;
  }

  const winner = terminalWinner(state);
  if (winner) return { winner, plies, reason: 'kingCapture' };
  return { winner: null, plies, reason: 'plyCap' };
}

export type Matchup = { aWins: number; bWins: number; draws: number; games: number };

/**
 * Play `games` between two army builders, alternating colors each game so the
 * first-move (White) advantage cancels out. Each game rolls a random point cap
 * from `capRange` and builds *both* armies at that cap (fair). Builders take
 * the cap and may be randomized internally — they're called fresh per game.
 */
export function runMatchup(
  buildA: (cap: number) => ArmyConfig,
  buildB: (cap: number) => ArmyConfig,
  games: number,
  capRange: CapRange,
  opts?: PlayOptions,
): Matchup {
  let aWins = 0;
  let bWins = 0;
  let draws = 0;

  for (let i = 0; i < games; i += 1) {
    const cap = randomCap(capRange);
    const aIsWhite = i % 2 === 0;
    const white = aIsWhite ? buildA(cap) : buildB(cap);
    const black = aIsWhite ? buildB(cap) : buildA(cap);
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
