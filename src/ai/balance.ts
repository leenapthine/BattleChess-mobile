import type { BasicRole, Guild } from '@/types/army';
import { UPGRADE_COSTS } from '@/data/upgradeCosts';
import { ARCHETYPES, PRIORITIES, spendByPriority, type Archetype } from './buildArmy';
import { runMatchup, randomArmy, playGame, type PlayOptions } from './selfPlay';

const ROLES: BasicRole[] = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];

// ── Archetype ranking ──────────────────────────────────────────────────────

export type ArchetypeStanding = { archetype: Archetype; score: number; games: number; winRate: number };

/**
 * Round-robin the archetypes against each other (same guild + budget) and rank
 * them by overall score (win = 1, draw = 0.5). Answers "which build wins?".
 */
export function runArchetypeTournament(
  guild: Guild,
  pointCap: number,
  gamesPerPair: number,
  opts?: PlayOptions,
): ArchetypeStanding[] {
  const score: Record<string, number> = {};
  const games: Record<string, number> = {};
  for (const a of ARCHETYPES) { score[a] = 0; games[a] = 0; }

  for (let i = 0; i < ARCHETYPES.length; i += 1) {
    for (let j = i + 1; j < ARCHETYPES.length; j += 1) {
      const a = ARCHETYPES[i];
      const b = ARCHETYPES[j];
      const r = runMatchup(
        () => spendByPriority(guild, pointCap, PRIORITIES[a]),
        () => spendByPriority(guild, pointCap, PRIORITIES[b]),
        gamesPerPair,
        opts,
      );
      score[a] += r.aWins + r.draws * 0.5;
      score[b] += r.bWins + r.draws * 0.5;
      games[a] += r.games;
      games[b] += r.games;
    }
  }

  return ARCHETYPES
    .map((archetype) => ({
      archetype,
      score: score[archetype],
      games: games[archetype],
      winRate: games[archetype] ? score[archetype] / games[archetype] : 0,
    }))
    .sort((x, y) => y.winRate - x.winRate);
}

// ── Per-unit balance report ──────────────────────────────────────────────────

export type BalanceRow = {
  role: BasicRole;
  cost: number;
  scoreRate: number; // win=1, draw=0.5, averaged over games where a side ran this upgrade
  sample: number;
  suggestion: 'raise cost' | 'lower cost' | 'ok';
};

/**
 * Play random-army vs random-army games and measure, per upgrade, how often the
 * side that bought it scored. A unit that scores well above 50% is underpriced
 * for its power (→ raise its cost); well below, overpriced (→ lower it).
 *
 * Caveat: this measures balance *as the bot plays*. If the AI under-uses an
 * ability (move-gen gap or eval blind spot), that unit looks weak even if it's
 * strong for a human — so treat findings as a strong signal, not gospel, and
 * cross-check the units that matter.
 */
export function runBalanceReport(
  guild: Guild,
  pointCap: number,
  games: number,
  opts?: PlayOptions,
): BalanceRow[] {
  const score: Record<string, number> = {};
  const sample: Record<string, number> = {};
  for (const role of ROLES) { score[role] = 0; sample[role] = 0; }

  for (let i = 0; i < games; i += 1) {
    const white = randomArmy(guild, pointCap);
    const black = randomArmy(guild, pointCap);
    const outcome = playGame(white, black, opts);

    for (const [army, color] of [[white, 'White'], [black, 'Black']] as const) {
      const sideScore = outcome.winner === null ? 0.5 : outcome.winner === color ? 1 : 0;
      const upgradedRoles = new Set(army.slots.filter((s) => s.upgraded).map((s) => s.role));
      for (const role of upgradedRoles) {
        score[role] += sideScore;
        sample[role] += 1;
      }
    }
  }

  return ROLES.map((role) => {
    const scoreRate = sample[role] ? score[role] / sample[role] : 0;
    const suggestion = scoreRate > 0.55 ? 'raise cost' : scoreRate < 0.45 ? 'lower cost' : 'ok';
    return { role, cost: UPGRADE_COSTS[guild][role], scoreRate, sample: sample[role], suggestion };
  });
}

// ── Console formatting (for the gated tournament runner) ─────────────────────

export function formatArchetypeStandings(guild: Guild, rows: ArchetypeStanding[]): string {
  const lines = [`Archetype ranking — ${guild}`];
  for (const r of rows) {
    lines.push(`  ${r.archetype.padEnd(9)} ${(r.winRate * 100).toFixed(1).padStart(5)}%  (${r.games} games)`);
  }
  return lines.join('\n');
}

export function formatBalanceReport(guild: Guild, rows: BalanceRow[]): string {
  const lines = [`Balance report — ${guild}   (score% by upgraded unit; ~50% = fairly priced)`];
  for (const r of rows) {
    const pct = (r.scoreRate * 100).toFixed(1).padStart(5);
    lines.push(`  ${r.role.padEnd(7)} cost ${String(r.cost).padStart(3)}  ${pct}%  n=${String(r.sample).padStart(4)}  → ${r.suggestion}`);
  }
  return lines.join('\n');
}
