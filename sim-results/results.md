# BattleChess self-play results

Appended by `npm run selfplay`. Each section below is one run, newest at the bottom.

How to read it:
- **Archetype ranking** — score% (win=1, draw=0.5) of each build in a round-robin for that guild. Higher = stronger build.
- **Balance report** — score% of games a side won when it had that unit upgraded; ~50% = fairly priced. `raise cost` = overperforms; `lower cost` = underperforms. The **by count** line shows the dose-response (3 pawns vs 6).
- Caps are rolled at random per game within the stated range, so findings span budgets.

**Caveat:** measured *as the bot plays*. The bot now uses single-turn abilities and (via selective search extension) invests in two-turn setups like DeadLauncher load+fire when they pay off — but exotic abilities may still be underused. Trust non-ability pieces' pricing most; watch sample size `n`.

Tooling: `src/ai/selfPlay.ts`, `src/ai/balance.ts`, runner `src/__tests__/ai/tournament.test.ts`.

## 2026-06-03T17:59:38.606Z

params: games=150, cap=20–110 (random/game), depth=2, maxPlies=160

```
Archetype ranking — Necro
  balanced   75.0%  (750 games)
  elite      72.9%  (750 games)
  ranged     47.2%  (750 games)
  vanguard   43.3%  (750 games)
  swarm      32.5%  (750 games)
  defensive  29.2%  (750 games)

Balance report — Necro   (score% by upgraded unit; ~50% = fairly priced)
  Pawn    cost   8   50.1%  n=1151  → ok
            by count: ×1 58%(206)  ×2 49%(275)  ×3 53%(234)  ×4 45%(198)  ×5 48%(132)  ×6 46%(73)  ×7 34%(28)
  Knight  cost  16   43.1%  n= 627  → lower cost
            by count: ×1 45%(499)  ×2 36%(128)
  Bishop  cost  10   49.3%  n= 684  → ok
            by count: ×1 51%(519)  ×2 44%(165)
  Rook    cost  12   42.9%  n= 652  → lower cost
            by count: ×1 44%(522)  ×2 37%(130)
  Queen   cost  34   81.3%  n= 256  → raise cost
  King    cost  12   45.0%  n= 416  → lower cost
```

```
Archetype ranking — Demon
  defensive  55.9%  (750 games)
  ranged     52.9%  (750 games)
  swarm      52.1%  (750 games)
  vanguard   50.3%  (750 games)
  elite      44.8%  (750 games)
  balanced   44.1%  (750 games)

Balance report — Demon   (score% by upgraded unit; ~50% = fairly priced)
  Pawn    cost  10   49.5%  n=1067  → ok
            by count: ×1 51%(244)  ×2 48%(336)  ×3 50%(242)  ×4 52%(134)  ×5 49%(75)  ×6 45%(32)
  Knight  cost  26   48.2%  n= 414  → ok
            by count: ×1 48%(389)  ×2 54%(25)
  Bishop  cost  20   51.7%  n= 474  → ok
            by count: ×1 51%(407)  ×2 57%(67)
  Rook    cost  20   51.6%  n= 450  → ok
            by count: ×1 52%(402)  ×2 48%(48)
  Queen   cost  32   45.1%  n= 192  → ok
  King    cost  22   56.0%  n= 226  → raise cost
```

```
Archetype ranking — Beast
  vanguard   56.3%  (750 games)
  defensive  53.9%  (750 games)
  elite      51.4%  (750 games)
  ranged     48.4%  (750 games)
  balanced   48.1%  (750 games)
  swarm      41.9%  (750 games)

Balance report — Beast   (score% by upgraded unit; ~50% = fairly priced)
  Pawn    cost   7   49.7%  n=1145  → ok
            by count: ×1 52%(158)  ×2 50%(219)  ×3 52%(256)  ×4 48%(221)  ×5 50%(159)  ×6 41%(86)  ×7 56%(33)
  Knight  cost  10   49.6%  n= 686  → ok
            by count: ×1 49%(501)  ×2 53%(185)
  Bishop  cost  15   50.4%  n= 641  → ok
            by count: ×1 51%(514)  ×2 48%(127)
  Rook    cost  16   47.8%  n= 634  → ok
            by count: ×1 48%(510)  ×2 46%(124)
  Queen   cost  32   55.3%  n= 255  → raise cost
  King    cost  18   51.5%  n= 355  → ok
```

```
Archetype ranking — Wizard
  defensive  57.4%  (750 games)
  vanguard   53.8%  (750 games)
  swarm      52.9%  (750 games)
  ranged     49.5%  (750 games)
  elite      43.4%  (750 games)
  balanced   43.0%  (750 games)

Balance report — Wizard   (score% by upgraded unit; ~50% = fairly priced)
  Pawn    cost   7   49.8%  n=1138  → ok
            by count: ×1 46%(189)  ×2 50%(201)  ×3 49%(283)  ×4 57%(198)  ×5 42%(170)  ×6 54%(63)  ×7 58%(26)
  Knight  cost  12   49.3%  n= 673  → ok
            by count: ×1 49%(527)  ×2 51%(146)
  Bishop  cost  16   49.1%  n= 648  → ok
            by count: ×1 49%(543)  ×2 48%(105)
  Rook    cost  16   50.0%  n= 624  → ok
            by count: ×1 51%(520)  ×2 44%(104)
  Queen   cost  26   45.2%  n= 291  → ok
  King    cost  24   56.4%  n= 326  → raise cost
```
<!-- Wizard block recovered from the run log; its live write was lost to the
     Desktop TCC failure that ended the run. -->

