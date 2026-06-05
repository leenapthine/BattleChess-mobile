# FUTURE_WORK.md — making the AI opponent stronger

Captured 2026-06-04 after a balance + AI-strength pass. This is a reference for
if/when someone returns to strengthen the single-player AI. It records **what the
AI is today, what we measured, what we tried and rejected, and the concrete plan
(plus cost) for the heavy options.**

---

## 1. Where the AI stands today

- **Algorithm:** negamax + alpha-beta search (`src/ai/chooseTurn.ts`) over a pure
  move generator (`src/ai/generateTurns.ts`, which drives the real reducer so it
  inherits every rule, including abilities and QoB revival).
- **Default depth:** 2 (`DIFFICULTIES.normal`) — your move + the opponent's best
  reply, then evaluate. ~35 ms/move on a laptop; snappy on a phone.
- **Evaluation (`src/ai/evaluate.ts`):** material (per-piece value from the
  army-builder upgrade costs) + small **threat** and **mobility** terms
  (`src/ai/positional.ts`). Terminal = king capture (no checkmate).
- **Strength:** a solid **casual** opponent. It never hangs a piece to a one-move
  tactic, grabs free material, trades sensibly, uses single-turn abilities, won't
  suicide its king. It **misses 2–3 move combinations**, has **no strategic/king-
  attack plan**, under-uses the trickiest multi-turn abilities, and fields a
  random (not tuned/counter) army.

## 2. What we measured (the evidence)

Run via `npm run strength` (pits search depths head-to-head with identical armies
so the only variable is lookahead). Mirror armies, depth-2 default.

| Lever | Result | Takeaway |
|---|---|---|
| depth 1 → **depth 2** | **97%** | The one big win — and it's already the default. Lookahead is almost everything at this level. |
| depth 2 → depth 3 | **57.5%** (40 games, ~60% draws, **~15 s/move**) | Modest edge, far too slow for interactive play. Diminishing returns per ply. |
| **Richer handcrafted eval** (king safety + king-tropism/conversion) vs baseline | **50.8%** at small weights; **43.3%** when weighted up | **No help, and harmful when emphasized.** Reverted (`4e8d8ff`). |

**Conclusion: the cheap levers are exhausted.** Neither more depth nor a smarter
*handcrafted* eval makes it meaningfully stronger. The high draw rate at depth 2+
says the limit is *conversion/strategy* — knowledge too subtle to hand-code, which
is exactly the case for a **learned** evaluation.

## 3. Reusable infrastructure already in place

The expensive prerequisites for a learning AI are done:

- **Pure, deterministic engine** — `gameReducer`, `generateTurns`, `terminalWinner`.
  The perfect simulator self-play and MCTS need.
- **Headless self-play harness** — `src/ai/selfPlay.ts` (`playGame`, `runMatchup`,
  `playGameVs` for asymmetric players), plus the gated runners
  `src/__tests__/ai/tournament.test.ts` (balance) and `strength.test.ts` (depth).
- **`evalFn` hook** — `chooseTurn(state, difficulty, evalFn?)` takes an optional
  evaluation function (defaults to `evaluate`). **A learned eval drops in here with
  one line**, no search rewrite, and can be A/B'd against the current eval via
  `playGameVs`.

## 4. Option L1 — learned evaluation function (recommended next step)

Keep `generateTurns` + negamax; **replace only `evaluate()` with a small neural net
that scores a position**, trained from self-play outcomes.

**Build steps:**
1. **State encoder (TS):** `GameState → tensor`, ~8×8 × ~60 planes — one plane per
   (color × piece-type) plus planes for state flags (stunned, stone, loaded,
   raises-left, side-to-move, guild). Pure logic.
2. **Self-play data export (TS/Node):** reuse the harness to play thousands of
   games, recording `(encoded position, eventual winner)`. CPU-only; an
   overnight run yields millions of positions.
3. **Training (Python + PyTorch):** small MLP or small conv net → scalar value
   in [-1, 1]. Supervised on the recorded outcomes. Iterate.
4. **Export + on-device inference:** ship weights via **ONNX Runtime** or
   **TF.js** (a native RN dependency), or hand-roll a tiny MLP forward pass in TS.
   Wire it into the `evalFn` hook.
5. **Bootstrap loop (to get *better*, not just *different*):** train → play with
   the new eval → generate stronger games → retrain. This is the difference
   between a few days and a few weeks.

**Risks:**
- **On-device speed is the main technical risk** — the eval is called *thousands of
  times per move* (every search leaf), so the net must be small and fast or the
  search loses depth on a phone.
- **Payoff is uncertain** — trained only on a weak bot's games it can plateau near
  today's level; the bootstrap loop mitigates this but costs the extra weeks.

## 5. Option L2 — full AlphaZero (the dream, much heavier)

Policy + value net, **MCTS** guided by it, **self-play reinforcement learning**
bootstrapping from random with no handcrafted knowledge. Strongest result.

- **The action-encoding wrinkle (specific to this game):** a "turn" is a
  variable-length tap sequence (load+fire, sacrifice chains, double-moves,
  revival picks…), so a fixed chess-style policy head is ugly. **Elegant out:**
  let `generateTurns` enumerate legal turns and have the net score the *resulting
  positions* (an "afterstate" value head); the policy becomes a softmax over those
  values. Our turn-generator makes this natural and sidesteps AlphaZero's hardest
  sub-problem.
- **Also needs:** MCTS in TS (uses `generateTurns` for expansion), the TS↔Python
  data/training pipeline, on-device inference, and real compute (self-play is the
  bottleneck — each move = hundreds of net evals).

## 6. Cost summary

| | L1 (learned eval) | L2 (AlphaZero) |
|---|---|---|
| **Compute $** | ~$0–$100 (free Colab/local GPU possible; inference on-device = $0 ongoing) | Higher but still hobby-scale on one GPU over days–weeks |
| **Effort** | ~2–4 weeks focused (ML-fluent); longer while learning | Months |
| **Skills** | PyTorch + ONNX/TF.js + the TS pipeline | Same + MCTS + RL training loop |
| **Main risk** | On-device eval speed; payoff may be modest | Compute + the full pipeline; biggest commitment |
| **If hired out** | Low thousands of $ (compute is the cheap part) | More |

## 7. Cheaper non-ML levers (smaller wins, if avoiding ML)

If the goal is "a bit better" without ML:
- **Search engineering** — iterative deepening + a time budget + a **Web Worker** so
  depth 3 becomes affordable interactively. The pure engine makes a worker easy.
  (Expected value is modest — depth-3 only scored 57.5%.)
- **Smarter army building** — let the AI spend its point budget and counter-pick
  off the human's army (it currently rolls a random archetype; see
  `src/ai/buildArmy.ts`).
- **Ability-play coverage** — extend/verify `generateTurns` for the multi-turn
  ability setups it still under-uses (one coverage test per `AbilityMode`).

## 8. Recommendation

For a fun, decent opponent, **what exists already delivers that** — stop
hand-tuning, the data says there's no juice left in the cheap levers. If a
*genuinely strong* AI is itself the goal, **L1 is the right project**: financially
trivial, a real ~3-week engineering commitment, and the pure engine + harness +
`evalFn` hook mean most of the usual setup pain is already handled.
