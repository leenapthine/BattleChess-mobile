# BattleChess self-play results

Appended by `npm run selfplay`. Each section below is one run, newest at the bottom.

How to read it:
- **Archetype ranking** — score% (win=1, draw=0.5) of each build in a round-robin for that guild. Higher = stronger build.
- **Balance report** — score% of games where a side had that unit upgraded; ~50% = fairly priced. `raise cost` = the unit overperforms its price; `lower cost` = underperforms.
- Caps are rolled at random per game within the stated range, so findings span budgets.

**Caveat:** these measure balance *as the bot plays*. With the ability-aware eval the bot now values ranged threats and mobility, but still doesn't fully exploit every ability — so trust non-ability pieces' pricing most, and treat "lower cost" on an ability unit with suspicion. Watch the sample size `n`.

Tooling: `src/ai/selfPlay.ts`, `src/ai/balance.ts`, runner `src/__tests__/ai/tournament.test.ts`.

## 2026-06-03T06:28:12.527Z

params: games=150, cap=20–110 (random/game), depth=2, maxPlies=160

```
Archetype ranking — Necro
  elite      77.7%  (750 games)
  balanced   75.0%  (750 games)
  ranged     48.6%  (750 games)
  vanguard   40.9%  (750 games)
  swarm      29.1%  (750 games)
  defensive  28.7%  (750 games)

Balance report — Necro   (score% by upgraded unit; ~50% = fairly priced)
  Pawn    cost   8   49.6%  n=1133  → ok
  Knight  cost  18   43.5%  n= 626  → lower cost
  Bishop  cost  10   46.0%  n= 683  → ok
  Rook    cost  12   46.7%  n= 668  → ok
  Queen   cost  28   80.7%  n= 314  → raise cost
  King    cost  12   45.8%  n= 415  → ok
```

```
Archetype ranking — Demon
  vanguard   53.3%  (750 games)
  swarm      52.8%  (750 games)
  defensive  52.1%  (750 games)
  ranged     50.9%  (750 games)
  balanced   47.1%  (750 games)
  elite      43.9%  (750 games)

Balance report — Demon   (score% by upgraded unit; ~50% = fairly priced)
  Pawn    cost  10   50.0%  n=1085  → ok
  Knight  cost  26   50.6%  n= 413  → ok
  Bishop  cost  20   48.3%  n= 451  → ok
  Rook    cost  20   50.0%  n= 494  → ok
  Queen   cost  32   40.8%  n= 206  → lower cost
  King    cost  20   55.4%  n= 279  → raise cost
```

```
Archetype ranking — Beast
  vanguard   58.7%  (750 games)
  defensive  51.5%  (750 games)
  balanced   50.6%  (750 games)
  elite      50.1%  (750 games)
  swarm      44.7%  (750 games)
  ranged     44.3%  (750 games)

Balance report — Beast   (score% by upgraded unit; ~50% = fairly priced)
  Pawn    cost   7   49.9%  n=1144  → ok
  Knight  cost  10   49.6%  n= 704  → ok
  Bishop  cost  15   50.7%  n= 664  → ok
  Rook    cost  16   45.4%  n= 617  → ok
  Queen   cost  30   56.8%  n= 310  → raise cost
  King    cost  18   52.3%  n= 385  → ok
```

```
Archetype ranking — Wizard
  defensive  55.9%  (750 games)
  vanguard   55.7%  (750 games)
  swarm      51.7%  (750 games)
  ranged     50.5%  (750 games)
  balanced   44.7%  (750 games)
  elite      41.4%  (750 games)

Balance report — Wizard   (score% by upgraded unit; ~50% = fairly priced)
  Pawn    cost   7   50.0%  n=1150  → ok
  Knight  cost  12   50.3%  n= 655  → ok
  Bishop  cost  16   49.2%  n= 602  → ok
  Rook    cost  16   50.4%  n= 632  → ok
  Queen   cost  26   44.5%  n= 293  → lower cost
  King    cost  24   53.9%  n= 318  → ok
```
