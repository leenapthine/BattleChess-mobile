import type { Guild } from '@/types/army';
import {
  runArchetypeTournament,
  runBalanceReport,
  formatArchetypeStandings,
  formatBalanceReport,
} from '@/ai/balance';
import { DIFFICULTIES } from '@/ai/chooseTurn';

// Heavy analysis run — skipped in the normal suite. Run it on demand:
//   npm run selfplay                 (all guilds)
//   RUN_TOURNAMENT=1 npx jest tournament
// Tune with env vars: GUILD, CAP, GAMES, DEPTH, MAX_PLIES.
const RUN = process.env.RUN_TOURNAMENT === '1';

const GUILDS_TO_RUN: Guild[] = (process.env.GUILD ? [process.env.GUILD as Guild] : ['Necro', 'Demon', 'Beast', 'Wizard']);
const CAP = Number(process.env.CAP ?? 60);
const GAMES = Number(process.env.GAMES ?? 40);
const DEPTH = Number(process.env.DEPTH ?? 1);
const MAX_PLIES = Number(process.env.MAX_PLIES ?? 160);

(RUN ? describe : describe.skip)('self-play analysis', () => {
  const opts = { difficulty: { depth: DEPTH }, maxPlies: MAX_PLIES };

  it('ranks archetypes and reports per-unit balance', () => {
    for (const guild of GUILDS_TO_RUN) {
      const standings = runArchetypeTournament(guild, CAP, GAMES, opts);
      // eslint-disable-next-line no-console
      console.log('\n' + formatArchetypeStandings(guild, standings));

      const balance = runBalanceReport(guild, CAP, GAMES * 4, opts);
      // eslint-disable-next-line no-console
      console.log(formatBalanceReport(guild, balance));
    }
    expect(true).toBe(true);
  }, 30 * 60 * 1000); // up to 30 min

  it('default difficulty constant is wired', () => {
    expect(DIFFICULTIES.easy.depth).toBe(1);
  });
});
