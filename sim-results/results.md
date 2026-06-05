# BattleChess self-play results

Appended by `npm run selfplay`. Each section below is one run, newest at the bottom.

How to read it:
- **Archetype ranking** — score% (win=1, draw=0.5) of each build in a round-robin for that guild. Higher = stronger build.
- **Balance report** — score% of games a side won when it had that unit upgraded; ~50% = fairly priced. `raise cost` = overperforms; `lower cost` = underperforms. The **by count** line shows the dose-response (3 pawns vs 6).
- Caps are rolled at random per game within the stated range, so findings span budgets.

**Caveat:** measured *as the bot plays*. Single-turn abilities (incl. one-turn DeadLauncher load+fire and the Portal's free load/unload) are used; but some abilities are still under-exploited, so a "lower cost" flag on an ability unit can mean the bot under-uses it rather than true weakness. Trust non-ability pieces' pricing most; watch sample size `n`.

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


## 2026-06-04T06:31:49.171Z

params: games=150, cap=20–110 (random/game), depth=2, maxPlies=160

```
Archetype ranking — Necro
  balanced   74.3%  (750 games)
  elite      71.6%  (750 games)
  ranged     53.4%  (750 games)
  vanguard   39.1%  (750 games)
  defensive  34.9%  (750 games)
  swarm      26.7%  (750 games)

Balance report — Necro   (score% by upgraded unit; ~50% = fairly priced)
  Pawn    cost   8   49.9%  n=1139  → ok
            by count: ×1 52%(170)  ×2 56%(231)  ×3 50%(269)  ×4 48%(186)  ×5 50%(166)  ×6 38%(80)  ×7 31%(32)
  Knight  cost  16   44.4%  n= 664  → lower cost
            by count: ×1 47%(535)  ×2 34%(129)
  Bishop  cost  10   47.7%  n= 730  → ok
            by count: ×1 49%(534)  ×2 44%(196)
  Rook    cost  12   48.0%  n= 685  → ok
            by count: ×1 50%(525)  ×2 41%(160)
  Queen   cost  30   80.4%  n= 298  → raise cost
  King    cost  12   42.1%  n= 448  → lower cost
```

```
Archetype ranking — Demon
  defensive  52.7%  (750 games)
  ranged     51.8%  (750 games)
  swarm      51.7%  (750 games)
  vanguard   51.4%  (750 games)
  balanced   46.5%  (750 games)
  elite      45.9%  (750 games)

Balance report — Demon   (score% by upgraded unit; ~50% = fairly priced)
  Pawn    cost  10   49.7%  n=1089  → ok
            by count: ×1 49%(229)  ×2 49%(358)  ×3 50%(273)  ×4 49%(147)  ×5 55%(60)
  Knight  cost  26   53.0%  n= 447  → ok
            by count: ×1 53%(413)  ×2 57%(34)
  Bishop  cost  20   49.2%  n= 453  → ok
            by count: ×1 48%(395)  ×2 58%(58)
  Rook    cost  20   46.9%  n= 465  → ok
            by count: ×1 48%(420)  ×2 40%(45)
  Queen   cost  32   45.7%  n= 199  → ok
  King    cost  22   55.0%  n= 240  → ok
```

```
Archetype ranking — Beast
  balanced   57.8%  (750 games)
  vanguard   56.4%  (750 games)
  elite      54.9%  (750 games)
  ranged     48.3%  (750 games)
  defensive  46.2%  (750 games)
  swarm      36.4%  (750 games)

Balance report — Beast   (score% by upgraded unit; ~50% = fairly priced)
  Pawn    cost   7   50.1%  n=1130  → ok
            by count: ×1 52%(184)  ×2 53%(223)  ×3 52%(232)  ×4 50%(209)  ×5 50%(140)  ×6 41%(95)  ×7 38%(39)
  Knight  cost  10   51.0%  n= 672  → ok
            by count: ×1 51%(503)  ×2 52%(169)
  Bishop  cost  15   48.5%  n= 675  → ok
            by count: ×1 48%(551)  ×2 50%(124)
  Rook    cost  16   48.7%  n= 632  → ok
            by count: ×1 49%(500)  ×2 46%(132)
  Queen   cost  32   59.6%  n= 291  → raise cost
  King    cost  18   46.8%  n= 359  → ok
```

```
Archetype ranking — Wizard
  swarm      56.5%  (750 games)
  vanguard   53.9%  (750 games)
  defensive  51.1%  (750 games)
  ranged     46.9%  (750 games)
  elite      46.7%  (750 games)
  balanced   44.9%  (750 games)

Balance report — Wizard   (score% by upgraded unit; ~50% = fairly priced)
  Pawn    cost   7   50.0%  n=1124  → ok
            by count: ×1 51%(186)  ×2 48%(224)  ×3 48%(247)  ×4 51%(201)  ×5 59%(140)  ×6 46%(70)  ×7 45%(48)
  Knight  cost  12   50.2%  n= 649  → ok
            by count: ×1 50%(523)  ×2 50%(126)
  Bishop  cost  16   50.6%  n= 632  → ok
            by count: ×1 50%(512)  ×2 51%(120)
  Rook    cost  16   48.3%  n= 619  → ok
            by count: ×1 49%(506)  ×2 44%(113)
  Queen   cost  26   47.5%  n= 315  → ok
  King    cost  24   54.8%  n= 314  → ok
```

## 2026-06-04T16:30:53.308Z

params: games=150, cap=20–110 (random/game), depth=2, maxPlies=160

```
Archetype ranking — Necro
  ranged     54.5%  (750 games)
  defensive  54.2%  (750 games)
  elite      49.0%  (750 games)
  balanced   48.6%  (750 games)
  swarm      48.0%  (750 games)
  vanguard   45.7%  (750 games)

Balance report — Necro   (score% by upgraded unit; ~50% = fairly priced)
  Pawn    cost   8   50.0%  n=1145  → ok
            by count: ×1 49%(160)  ×2 50%(259)  ×3 48%(265)  ×4 51%(207)  ×5 55%(153)  ×6 49%(69)  ×7 45%(30)
  Knight  cost  15   49.2%  n= 645  → ok
            by count: ×1 50%(496)  ×2 47%(149)
  Bishop  cost  10   49.1%  n= 687  → ok
            by count: ×1 47%(518)  ×2 56%(169)
  Rook    cost  12   50.1%  n= 681  → ok
            by count: ×1 50%(515)  ×2 52%(166)
  Queen   cost  31   50.7%  n= 307  → ok
  King    cost  11   48.8%  n= 402  → ok
```

```
Archetype ranking — Demon
  defensive  56.7%  (750 games)
  swarm      52.1%  (750 games)
  vanguard   51.7%  (750 games)
  ranged     50.5%  (750 games)
  balanced   45.0%  (750 games)
  elite      44.0%  (750 games)

Balance report — Demon   (score% by upgraded unit; ~50% = fairly priced)
  Pawn    cost  10   49.3%  n=1056  → ok
            by count: ×1 50%(223)  ×2 47%(370)  ×3 51%(236)  ×4 53%(140)  ×5 48%(59)  ×6 50%(25)
  Knight  cost  27   51.5%  n= 423  → ok
            by count: ×1 51%(386)  ×2 54%(37)
  Bishop  cost  20   51.2%  n= 467  → ok
            by count: ×1 52%(418)  ×2 48%(49)
  Rook    cost  18   51.1%  n= 502  → ok
            by count: ×1 52%(436)  ×2 48%(66)
  Queen   cost  31   42.8%  n= 201  → lower cost
  King    cost  23   53.0%  n= 247  → ok
```

```
Archetype ranking — Beast
  balanced   57.1%  (750 games)
  elite      56.7%  (750 games)
  vanguard   53.5%  (750 games)
  defensive  48.3%  (750 games)
  ranged     45.9%  (750 games)
  swarm      38.6%  (750 games)

Balance report — Beast   (score% by upgraded unit; ~50% = fairly priced)
  Pawn    cost   7   50.1%  n=1150  → ok
            by count: ×1 55%(167)  ×2 54%(225)  ×3 48%(254)  ×4 52%(200)  ×5 46%(169)  ×6 39%(84)  ×7 57%(41)
  Knight  cost  10   48.2%  n= 691  → ok
            by count: ×1 50%(518)  ×2 43%(173)
  Bishop  cost  15   49.9%  n= 703  → ok
            by count: ×1 50%(556)  ×2 50%(147)
  Rook    cost  15   48.8%  n= 663  → ok
            by count: ×1 50%(541)  ×2 43%(122)
  Queen   cost  33   56.8%  n= 292  → raise cost
  King    cost  17   53.0%  n= 383  → ok
```

```
Archetype ranking — Wizard
  swarm      55.6%  (750 games)
  vanguard   53.4%  (750 games)
  balanced   50.2%  (750 games)
  elite      49.2%  (750 games)
  defensive  49.2%  (750 games)
  ranged     42.4%  (750 games)

Balance report — Wizard   (score% by upgraded unit; ~50% = fairly priced)
  Pawn    cost   7   50.5%  n=1146  → ok
            by count: ×1 47%(177)  ×2 47%(195)  ×3 54%(255)  ×4 51%(232)  ×5 54%(157)  ×6 49%(95)  ×7 44%(27)
  Knight  cost  12   50.2%  n= 691  → ok
            by count: ×1 50%(507)  ×2 51%(184)
  Bishop  cost  16   48.4%  n= 618  → ok
            by count: ×1 48%(518)  ×2 49%(100)
  Rook    cost  16   48.8%  n= 649  → ok
            by count: ×1 50%(532)  ×2 43%(117)
  Queen   cost  25   49.2%  n= 299  → ok
  King    cost  25   52.5%  n= 322  → ok
```
