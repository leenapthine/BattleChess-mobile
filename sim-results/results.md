# BattleChess self-play results

Appended by `npm run selfplay`. Each section below is one run, newest at the bottom.

How to read it:
- **Archetype ranking** — score% (win=1, draw=0.5) of each build in a round-robin for that guild. Higher = stronger build.
- **Balance report** — score% of games a side won when it had that unit upgraded; ~50% = fairly priced. `raise cost` = overperforms; `lower cost` = underperforms. The **by count** line shows the dose-response (3 pawns vs 6).
- Caps are rolled at random per game within the stated range, so findings span budgets.

**Caveat:** measured *as the bot plays*. The bot now uses single-turn abilities and (via selective search extension) invests in two-turn setups like DeadLauncher load+fire when they pay off — but exotic abilities may still be underused. Trust non-ability pieces' pricing most; watch sample size `n`.

Tooling: `src/ai/selfPlay.ts`, `src/ai/balance.ts`, runner `src/__tests__/ai/tournament.test.ts`.
