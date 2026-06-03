# BattleChess self-play results

Appended by `npm run selfplay`. Each section below is one run, newest at the bottom.

How to read it:
- **Archetype ranking** — score% (win=1, draw=0.5) of each build in a round-robin for that guild. Higher = stronger build.
- **Balance report** — score% of games a side won when it had that unit upgraded; ~50% = fairly priced. `raise cost` = overperforms its price; `lower cost` = underperforms. The **by count** line shows the dose-response (e.g. 3 pawns vs 6) — whether stacking the unit helps or has diminishing returns.
- Caps are rolled at random per game within the stated range, so findings span budgets.

**Caveat:** these measure balance *as the bot plays*. The bot values ranged threats/mobility but still doesn't fully exploit every ability — so trust non-ability pieces' pricing most, and treat "lower cost" on an ability unit with suspicion. Watch the sample size `n`.

Tooling: `src/ai/selfPlay.ts`, `src/ai/balance.ts`, runner `src/__tests__/ai/tournament.test.ts`.
