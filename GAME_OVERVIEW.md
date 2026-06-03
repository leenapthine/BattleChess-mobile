# BattleChess — Full Game Overview

> A fantasy chess variant with 4 guilds, each with 6 unique units and special abilities.  
> Mobile app: Expo (React Native) + TypeScript  
> Backend: Supabase (anonymous auth, realtime multiplayer working)  
> State: Zustand (app-wide) + useReducer (game engine)

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Tech Stack](#tech-stack)
3. [Game Concept](#game-concept)
4. [Starting Configuration](#starting-configuration)
5. [Global State](#global-state)
6. [Rendering & Board](#rendering--board)
7. [Visual Effects](#visual-effects)
8. [Click Handler — The Central Dispatcher](#click-handler--the-central-dispatcher)
9. [Core Logic Modules](#core-logic-modules)
10. [Basic Pieces](#basic-pieces)
11. [The Four Guilds](#the-four-guilds)
    - [Necromancer Guild](#necromancer-guild)
    - [Demon Guild](#demon-guild)
    - [BeastMaster Guild](#beastmaster-guild)
    - [Wizard Guild](#wizard-guild)
12. [Piece Properties Reference](#piece-properties-reference)
13. [Highlight Color System](#highlight-color-system)
14. [Edge Cases & Design Decisions](#edge-cases--design-decisions)
15. [Known Bugs & Incomplete Logic](#known-bugs--incomplete-logic)
16. [Features Not Yet Implemented](#features-not-yet-implemented)

---

## Project Structure

```
src/
├── engine/                      # Pure TS game logic — zero React imports
│   ├── gameReducer.ts           # Central reducer with comments by section
│   ├── initialBoard.ts          # createInitialState(p1Army, p2Army)
│   ├── pieceTraits.ts           # SELF_CLICK_TYPES, opponentColor()
│   ├── utils.ts                 # getPieceAt, isInBounds, generateId, etc.
│   ├── helpers/
│   │   ├── moveHelpers.ts       # Sliding/step move generators
│   │   ├── captureHandler.ts    # Generic capture, QoB revival check
│   │   ├── captureDispatch.ts   # Piece-specific capture (WizardTower, HellKing, etc.)
│   │   ├── turnManager.ts       # switchTurn, applyPostMoveEffects
│   │   ├── classifyAction.ts    # Tap → action classifier
│   │   └── abilityHandlers.ts   # Sacrifice, resurrection, loading, launch, etc.
│   └── pieces/                  # One file per piece type
├── lib/                         # Pure API functions (no React)
│   ├── supabase.ts              # Client with AsyncStorage session persistence
│   ├── auth.ts                  # signInAnonymously, getProfile, createProfile
│   └── games.ts                 # CRUD + subscriptions for games table
├── stores/                      # Zustand stores
│   ├── authStore.ts             # Auth status, profile, sign in/out
│   ├── screenStore.ts           # App navigation state machine
│   └── gamesStore.ts            # Open games, current game, subscriptions
├── screens/                     # Header/View/Hook split for non-trivial screens
│   ├── SignIn/                  # Anonymous sign-in
│   ├── NamePrompt/              # Display name prompt
│   ├── Lobby/                   # Browse local vs online + open games
│   ├── PointCap/                # Set point budget
│   ├── WaitingRoom/             # Host waiting for guest
│   ├── ArmyBuilder/             # Local pass-and-play army selection
│   ├── Handoff/                 # "Pass device" interstitial
│   ├── OnlineArmyBuilder/       # Online army selection (writes to DB)
│   ├── Game/                    # Local game board
│   └── OnlineGame/              # Synced online game board
├── components/
│   ├── CapturedPieces.tsx       # Graveyard (currently removed from UI)
│   └── SpriteInfoCard.tsx       # Piece info card
├── types/
│   ├── game.ts                  # Piece, GameState, GameAction, AbilityMode
│   └── army.ts                  # Guild, BasicRole, ArmyConfig, BOARD_SLOTS
├── data/
│   ├── pieceDescriptions.ts     # Ability descriptions per piece type
│   └── upgradeCosts.ts          # UPGRADE_COSTS, GUILD_PIECES, GUILDS
├── constants/
│   ├── theme.ts                 # Homebrew colors + FONT
│   └── sprites.ts               # Sprite map: getSprite(color, type)
└── assets/sprites/              # 60 PNGs at 128×128 (nearest-neighbor upscaled)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54 (React Native) — iOS, Android, Web |
| Language | TypeScript (strict mode) |
| Game state | Pure reducer (`gameReducer.ts`) |
| App state | Zustand stores (auth, screen, games) |
| Board UI | React Native Pressable grid (8×8, White at bottom) |
| Font | Space Mono via `@expo-google-fonts/space-mono` |
| Backend | Supabase Postgres + Realtime |
| Auth | Anonymous sign-in (Apple Sign In planned) |
| Multiplayer | Active player writes GameState to DB; opponent receives via Realtime |

---

## Game Concept

BattleChess is a local 2-player chess variant where each side fields a full **guild** — a team of 6 fantasy unit types that replace the standard chess pieces in a 1-to-1 role mapping:

| Role | Standard Chess Piece |
|---|---|
| Pawns (×8) | Pawn |
| Left+Right Pieces (×2 each) | Rook, Knight, Bishop |
| Center Row | Queen, King |

Each guild's units inherit the **movement rules** of their chess equivalent, then add a **special ability** on top.

---

## Starting Configuration

Players build their armies before the game starts using the **Army Builder**. Each player:

1. Picks one of the 4 guilds (Necro, Demon, Beast, Wizard) — locked for the game
2. Spends points from a shared budget (default 100) to upgrade individual pieces from basic chess types to guild variants
3. Confirms — opponent doesn't see the army until the game starts

`createInitialState(p1Army, p2Army)` builds the board from two `ArmyConfig` objects. Each config has a guild and 16 slots in board order:

```
Slots 0-7  (back row):  Rook | Knight | Bishop | Queen | King | Bishop | Knight | Rook
Slots 8-15 (pawn row):  Pawn × 8
```

Each slot is either basic (no points spent) or upgraded to the guild equivalent. Upgrade costs and piece mappings live in `src/data/upgradeCosts.ts`.

### Upgrade Cost Tables

| Pawn → | Necro | Demon | Beast | Wizard |
|---|---|---|---|---|
| Pawn upgrade | 8 (NecroPawn) | 10 (HellPawn) | 7 (PawnHopper) | 7 (YoungWiz) |
| Knight upgrade | 18 (GhostKnight) | 26 (Prowler) | 10 (BeastKnight) | 12 (Familiar) |
| Bishop upgrade | 10 (Necromancer) | 20 (Howler) | 15 (BeastDruid) | 16 (WizardTower) |
| Rook upgrade | 12 (DeadLauncher) | 20 (Beholder) | 16 (BoulderThrower) | 16 (Portal) |
| Queen upgrade | 28 (QueenOfBones) | 32 (QueenOfDestruction) | 30 (QueenOfDomination) | 26 (QueenOfIllusions) |
| King upgrade | 12 (GhoulKing) | 20 (HellKing) | 18 (FrogKing) | 24 (WizardKing) |

---

## Game State

All game state is a single immutable `GameState` object managed by a pure reducer. See `src/types/game.ts` for full type definitions.

| Field | Type | Purpose |
|---|---|---|
| `pieces` | `Piece[]` | Full board state — single source of truth |
| `capturedPieces` | `Piece[]` | Pieces removed from the board (for graveyard display) |
| `currentTurn` | `'White' \| 'Black'` | Whose turn it is |
| `selectedSquare` | `Square \| null` | The currently selected square |
| `highlights` | `Highlight[]` | Tiles currently highlighted (move, capture, ability, preview, range) |
| `abilityMode` | `AbilityMode` | Discriminated union tracking multi-step ability flows (sacrifice, resurrection, loading, launch, boulder, domination, secondMove, sacrificeSelection) |
| `status` | `GameStatus` | Active game or winner declared |
| `armyConfigs` | `{ p1, p2 }` | Stored for RESET_GAME to restart with the same armies |

---

## Rendering & Board

The board is an 8×8 grid of React Native `Pressable` components. White pieces render at the bottom of the screen. PixiJS has been dropped entirely.

Sprites live in `assets/sprites/{Color}{Type}.png` — e.g. `WhiteNecromancer.png`, `BlackHellPawn.png`. 60 PNGs total (30 piece types × 2 colors). Mapped via `src/constants/sprites.ts`.

**Highlight system — all highlights are thick inner square borders rendered under sprites:**
- Green border — selected piece
- Blue border — selected piece with self-click ability available (reverts to green after activation)
- Yellow border (`move`) — valid movement square
- Red border (`capture`) — enemy that will die, or friendly in AoE blast zone
- Blue border (`ability`) — non-lethal ability targets (load, raise, swap, dominate, eject)
- Grey border (`range`) — ranged ability reach on empty/friendly/stone squares (non-interactive)
- Grey border (`preview`) — opponent piece range (read-only)

**Self-click ability pieces** (ability targets hidden until self-click activation): NecroPawn, GhoulKing, DeadLauncher, Beholder, BoulderThrower, Familiar, Portal, WizardKing

**Additional UI:**
- **Header** — shows current turn, ability-mode instructions, and flash messages (e.g. "Familiar turned to stone!")
- **Win overlay** — appears on king capture / resign / timeout; shows reason banner, winner text, and `New Game` + `Main Menu` buttons
- **Per-player clocks** — small timer cards sit at the two ends of the full-width turn bar, flanking the centered turn label (the ability/status line spans edge-to-edge beneath them, clamped to one line). Active player's clock ticks down each turn; unlimited games show `∞`
- **Concede button** — sits below the sprite-info area in active games; opens a confirm modal
- **Captured pieces graveyard** — fixed-height sprite rows above/below the board per color; Portal-loaded pieces excluded from graveyard until last friendly Portal is captured
- **Title screen** — retro 1980s home-computer boot screen shown on cold launch with a randomly-selected piece as the centerpiece (see `src/screens/Title/`)
- **Lobby chat** — fixed-height terminal-style chat panel at the top of the lobby, above the new-game buttons and open-games list

---

## Visual Effects

The board renders an animation layer above the `Pressable` grid using **React Native Reanimated 4** (worklets). Two independent systems run here.

### 1. Per-move animations (automatic — no engine involvement)

Driven purely by diffing the `pieces` array in `GameView`:

- **Glide** (`AnimatedPiece`) — pieces live in an absolutely-positioned layer above the grid and slide (FLIP) to their destination on every move, so a sliding sprite is never clipped by per-square bounds.
- **Death fade** (`DyingPiece`) — captures are detected by ID-diffing previous vs current pieces; a removed piece fades out (~280ms). The capturing piece's glide is delayed ~140ms so the victim is half-faded before the attacker arrives. Same-ID transitions (HellKing convert, HellPawn transform) do **not** trigger a death fade.

### 2. Ability effects (engine-driven via `lastEffect`)

The reducer writes a typed `Effect` onto `GameState.lastEffect` for the action that produces it, and resets it to `null` on every other action — so each effect fires exactly once. `GameView` queues each non-null `lastEffect`; `EffectRenderer` routes it to a Reanimated primitive that calls `onDone` to remove itself from the queue.

Primitives live in `src/screens/Game/effects/`. Most are hand-rolled **pixel art** — square `View`s laid out on a grid, no SVG/Skia (avoids a native dependency):

| Primitive | Shape |
|---|---|
| `LightningBolt` | gold pixel bolt (jagged Bresenham staircase) between two tiles |
| `EyeBeam` | straight magenta pixel ray + iris flash at source |
| `FireBurst` | small pixel flame on a tile, flickers upward |
| `BoulderThrow` | lumpy pixel rock, arcs + spins to target, dust puff on impact |
| `PixelExplosion` | spiky pixel burst that scales up ease-in (slow → fast), then fades |
| `LaunchProjectile` | the loaded pawn's actual sprite, hurled spinning + debris on impact |
| `PixelBurst` | configurable pixel particle poof — `out` / `in` / `up` modes, custom palette |
| `StunPulse` | yellow pixel spark stars scattered around a tile |
| `StonePulse` | grey pixel stone slab (outline + cracks) that slams in / eases out |

(`Beam` still exists but is no longer wired in; `Shockwave`/`Projectile` were removed.)

(`Shockwave` and `Projectile` still exist but are no longer wired in — superseded by the pixel-art primitives.)

All 17 `Effect` types are emitted and rendered:

| Effect | Emitted by | Source module | Visual |
|---|---|---|---|
| `detonate` | NecroPawn sacrifice; QueenOfDestruction death | `abilityHandlers.ts` / `captureHandler.ts` | `PixelExplosion` (yellow, grows ease-in) |
| `launch` | DeadLauncher pawn launch | `abilityHandlers.ts` | `LaunchProjectile` (loaded pawn sprite, spinning + debris) |
| `boulder` | BoulderThrower ranged throw | `abilityHandlers.ts` | `BoulderThrow` (pixel rock, arcs + spins + dust) |
| `beam` | Beholder eye beam | `abilityHandlers.ts` | `EyeBeam` (magenta pixel ray) |
| `kingShot` | WizardKing vertical shot | `abilityHandlers.ts` | gold pixel `LightningBolt` |
| `towerShot` | WizardTower ranged capture | `captureDispatch.ts` | gold pixel `LightningBolt` |
| `zap` | YoungWiz forward zap | `captureDispatch.ts` | `FireBurst` flame on target |
| `stun` | GhostKnight stun aura | `turnManager.ts` | `StunPulse` pixel sparks per stunned square |
| `stone` | Familiar turn-to-stone / revert | `Familiar.toggleStone` | `StonePulse` pixel stone slab |
| `transform` | HellPawn transform (non-pawn) | `HellPawn.performCapture` | `PixelBurst` fire palette, `out` |
| `convert` | HellKing convert | `HellKing.performConvert` | `PixelBurst` red→purple, `out` |
| `howlerAbsorb` | Howler capture/absorb | `Howler.performCapture` | `PixelBurst` purple, `in` (converges) |
| `raise` | Necromancer / GhoulKing raise | `abilityHandlers.ts` / `GhoulKing` | `PixelBurst` green, `up` |
| `revive` | QueenOfBones revival | `QueenOfBones.performRevival` | `PixelBurst` green/white, `up` |
| `dominate` | QueenOfDomination dominate | `QueenOfDomination.applyDomination` | `PixelBurst` violet, `out` |
| `swap` | QueenOfIllusions phantom swap | `QueenOfIllusions.performSwap` | two cyan `PixelBurst` (both ends) |
| `portalOut` | Portal eject | `Portal.performEject` | two blue `PixelBurst` (both ends) |

**Invariant:** every `EffectRenderer` branch must eventually call `onDone`, or the effect queue stalls. The `stun` case guards against an empty `affected` array for exactly this reason.

### 3. Last-move replay

A **⟳ Replay** button (Game screen, beside Concede) re-plays the previous turn's animation. Rather than storing per-move data, it re-runs the state transition so the existing glide / death-fade / effect machinery re-animates for free:

- `useGame` records each turn as an ordered list of board frames — one per piece-changing sub-move — and finalizes the turn when it ends (turn switches, or a move wins). This captures **multi-step turns in full** (Prowler double-move, Necromancer capture-then-raise, GhoulKing raise-then-move, QueenOfDomination dominate-then-move), not just the final position.
- On replay, `GameView` seeds `AnimatedPiece`'s position tracker with the "before" board (via `seedLastPositions`, so it mounts without a backward rewind-slide), then steps through each frame in sequence (~760ms apart), re-firing each frame's glide, capture-fade, and effect.
- A `replayFrame` overrides the rendered board only during playback; the real `GameState` is untouched. Disabled until the first move; cleared on New Game.
- Wired in **both** the local and online Game screens via a shared `useReplayRecorder(state)` hook. Online works because every state transition is recorded — the active player's moves (reducer) and the opponent's moves (each sub-move is written to the DB, so it arrives as its own state update via Realtime). No extra sync needed.

### 4. Sound & haptics

8-bit chiptune SFX (`expo-audio`) and haptic feedback (`expo-haptics`), bolted onto the systems above with **no engine changes** — audio is a pure view-side side effect.

- `src/lib/sfx.ts` lazily creates one reusable `AudioPlayer` per clip; `playSfx(key)` seeks to 0 and replays, swallowing all errors so audio never interrupts play. `playEffectSfx(type)` maps each `Effect.type` → a clip (several share one — king/tower → `laser`, transform/convert → `morph`, raise/revive → `powerup`, swap/portalOut → `teleport`). `playsInSilentMode: true` so SFX play through the ringer switch.
- In `GameView`, `pushEffect` plays the ability SFX (so **replay re-plays the audio too**) plus a heavy haptic on `detonate`. The capture ID-diff plays a generic `capture` thud + light haptic, **only when `lastEffect` is null**, so ability captures don't double up.
- The master-mute flag is **owned by `src/lib/sfx.ts`** (a private boolean; `playSfx` early-returns when set). `src/stores/sfxStore.ts` is the UI mirror — `toggleMute` pushes the value down via `setSfxMuted()` (stores→lib), and `GameBoardLayout` subscribes it for the **SFX** toggle button beside ⟳ Replay on both Game screens.
- The 15 `assets/sfx/*.wav` clips are generated offline by `scripts/gen-sfx.js` (a standalone Node chiptune synth — not part of the build); regenerate with `node scripts/gen-sfx.js`.

---

## Multiplayer

Two-player games can run in two modes:

### Local (pass-and-play)
Both players take turns on the same device. Player 1 builds army → "hand to Player 2" interstitial → Player 2 builds → game starts. State lives in `useReducer` only.

### Online (Supabase realtime)
Each player has their own device. Flow:

1. **Sign in** — anonymous Supabase auth, prompted for display name on first sign-in (stored in `profiles` table)
2. **Lobby** — host creates a game (point cap), guest browses open games and joins
3. **Army selection** — both players use `OnlineArmyBuilder`, each writes their `ArmyConfig` to `games.host_army` / `games.guest_army`
4. **Game starts** — when both armies are submitted, the host calls `startGame` which initializes `GameState` and flips status to `'active'`
5. **Gameplay** — active player runs the reducer locally, writes the new `GameState` to `games.game_state`. The other player subscribes via Supabase Realtime and receives state updates
6. **Reconnection** — on app start, `restoreMyGame` queries for any active game the user is in and resumes
7. **Cleanup** — lobby filters games >10min old; host's stale waiting games auto-deleted on app start

#### Per-player clocks
Each online game can opt in to a total-time budget (10 / 20 / 30 / 45 / 60 min, or unlimited). The active player's clock ticks down during their turn. Hitting 0 ends the game with `reason: 'timeout'`.

#### End-of-game reasons
`game_state.status` carries `reason: 'kingCapture' | 'resign' | 'timeout'`. The win overlay renders the matching banner (`OPPONENT CONCEDED`, `TIMEOUT`, etc.) plus `New Game` and `Main Menu` buttons.

#### Lobby chat
A global terminal-style chat room sits at the top of the lobby screen, backed by a `chat_messages` table and a Supabase Realtime channel. A trigger enforces a 1-message-per-2-seconds rate limit per user; client caps each message at 300 chars.

#### Spectating
Any signed-in user can watch an in-progress game read-only — no extra game logic, since the DB is already the source of truth and every sub-move is written to `game_state`.

- **Discovery** — the lobby shows a **LIVE GAMES** list (`listActiveGames`, status `'active'`) alongside the joinable **OPEN GAMES**, each with a **VIEW** button. Games you're playing in are filtered out.
- **Entry** — `spectate()` loads the game row and sets `isSpectating` **without** joining (no `guest_id` write). Routing sends spectators to a separate screen so they never land in the waiting room / army builder.
- **Read-only** — the spectator reuses `OnlineGameScreen` with the `spectator` flag: it's never their turn, the timer/concede/write paths are all skipped, and taps only inspect a piece's range (grey preview, either color). Incoming `game_state` updates render live with full animations, effects, and SFX. An **EXIT** button (spectators only — players keep Concede) returns to the lobby; a finished game shows the win overlay first.
- **Security** — gated by the `games_read_spectate` RLS policy (SELECT on `active`/`finished` games). There is no matching write policy, so spectators are read-only by construction; Realtime respects RLS, so the live stream is unlocked by the same policy.
- **Viewer count** — a per-game Realtime **presence** channel (`lib/presence.ts`) that both players and spectators join, each tracking `{ role, name }`. The `👁 N` indicator is shown to everyone and is tappable, opening a closable modal that lists every watcher's name (de-duped by user).

The full schema is in `supabase/schema.sql`. RLS is enabled on all tables.

---

## Action Dispatch

The old 17-handler click dispatch chain is replaced by a pure reducer pattern:

1. User taps a square
2. A thin "classify action" layer inspects the current `GameState` and produces a `GameAction`
3. `gameReducer(state, action) → newState` applies the action immutably
4. React re-renders from the new state

**Action types:** `SELECT_SQUARE`, `MOVE_PIECE`, `ABILITY_ACTION`, `END_TURN`, `DESELECT`, `RESET_GAME`

Multi-step abilities (sacrifice, resurrection, loading/launching, domination, etc.) are tracked by the `abilityMode` discriminated union on `GameState` rather than separate boolean flags.

---

## Engine Design

All game logic is pure TypeScript functions with no React imports, no signals, and no mutation.

**Piece modules** (`src/engine/pieces/`): Each piece file exports:
- `getValidMoves(piece, pieces) → Highlight[]` — standard movement + captures
- `getAbilityTargets?(piece, pieces) → Highlight[]` — optional special ability targets
- Additional pure functions for ability execution (e.g. `performSacrifice`, `performRaise`, `performRevival`)

**Shared helpers** (`src/engine/helpers/moveHelpers.ts`):
- `getSlidingMoves` / `getStepMoves` — reusable move generators
- Prebuilt: `getRookMoves`, `getBishopMoves`, `getQueenMoves`, `getKingMoves`, `getKnightMoves`

**Utilities** (`src/engine/utils.ts`):
- Board queries: `getPieceAt`, `isOpponent`, `isFriendly`, `isEmpty`, `isInBounds`, `isPathClear`
- Immutable updates: `removePiece`, `updatePiece`
- Helpers: `forwardDirection`, `pawnStartRow`, `findKing`, `squaresEqual`

---

## Basic Pieces

All custom pieces extend one or more of these and inherit their `highlightMoves` functions directly:

| Piece | Movement |
|---|---|
| **Pawn** | 1 forward; 2 on first move; diagonal capture; no en passant |
| **Knight** | L-shape (2+1); jumps over all pieces |
| **Bishop** | Unlimited diagonal; blocked by pieces |
| **Rook** | Unlimited orthogonal; blocked by pieces |
| **Queen** | Unlimited in all 8 directions; blocked by pieces |
| **King** | 1 square any direction |

**Note:** Pawn "first move" is determined by checking `row === startRow` (1 for White, 6 for Black), not by a `hasMoved` flag. This means a pawn that hasn't moved but was placed mid-board via resurrection would still get its double-step.

---

## The Four Guilds

---

### Necromancer Guild

The undead manipulation faction. Specializes in resurrection, sacrifice, and crowd control.

---

#### NecroPawn *(Level 2 Pawn)*

**Movement:** Standard Pawn (1 forward, 2 from start row, diagonal capture)

**Special — Sacrifice (3-click):**
- **Click 1:** Select → highlights normal pawn moves + self in cyan
- **Click 2 (on self):** Arms sacrifice → highlights self in red + all 8 surrounding tiles in red
- **Click 3 (on self):** Detonates → removes NecroPawn + all pieces in 8 surrounding tiles (friend AND foe)
- **Visual effect:** a yellow pixel-art `PixelExplosion` bursts from the NecroPawn's tile, scaling up slow-then-fast (`detonate` effect)

**Edge Cases:**
- Cancellation: clicking any other square during armed state clears sacrifice mode
- Friendly fire: the AoE does NOT discriminate; your own pieces within 1 tile are destroyed
- Each surrounding-tile victim goes through `handleCapture()`, which means if any victim is a QueenOfDestruction, it will also detonate

---

#### GhostKnight *(Level 2 Knight)*

**Movement:** Standard L-shape Knight (jumps over all pieces)

**Special — Stun Aura (passive, post-move):**
- After ANY move (including captures), all 4 orthogonally adjacent enemy pieces gain `stunned: true`
- Stunned pieces cannot be selected or moved on the opponent's next turn
- Stuns are applied AFTER the board is committed and BEFORE the turn switches
- **Visual effect:** `StunPulse` pixel spark-stars flicker around each newly stunned square (`stun` effect, emitted from `turnManager.applyPostMoveEffects`)

**Edge Cases:**
- The stun effect uses the GhostKnight's **post-move** position, not where it moved from
- Stun applies to pieces adjacent at the **landing square**, not the departure square
- Stun clearing happens at the start of each turn for the active player's pieces (fixed in engine port)

---

#### Necromancer *(Level 2 Bishop)*

**Movement:** Unlimited diagonal (standard Bishop), blocked by pieces

**Special — Raise Dead (post-capture):**
- After capturing any enemy piece (except QueenOfDestruction), all orthogonally adjacent empty tiles around the capture square are highlighted cyan
- Player clicks one of these tiles → a standard `Pawn` of the Necromancer's color appears there
- **Visual effect:** a green `PixelBurst` rises from the raised tile (`raise` effect)
- The raise is optional (player can click elsewhere to skip, though the current implementation doesn't cleanly support skip — it just leaves the highlights up)
- Cannot raise diagonally adjacent tiles; only orthogonal (N/S/E/W)

**Edge Cases:**
- If no adjacent tiles are empty, the resurrection prompt fires but nothing is highlighted and no action is possible
- The resurrected pawn is a plain `Pawn`, not a `NecroPawn`
- Capturing a QueenOfDestruction does NOT trigger Raise Dead (explicitly filtered out)

---

#### DeadLauncher *(Level 2 Rook)*

**Movement:** Unlimited orthogonal (standard Rook)

**Special — Pawn Launch (5-step interaction):**
1. **Click 1:** Select — shows Rook moves + self highlighted cyan
2. **Click 2 (on self):** Enter Loading Mode — highlights adjacent tiles cyan (to pick a pawn to load)
3. **Click 3 (adjacent pawn):** Load it — the pawn is removed from board, `pawnLoaded = true` on the launcher; turn ends
4. **Click 4 (on self, while loaded):** Enter Launch Mode — highlights Manhattan-distance-3 tiles in red
5. **Click 5 (red tile):** Launch — removes any piece at that tile, `pawnLoaded = false`; turn ends

**Visual effect:** the launcher records the loaded pawn's type in `loadedPawnType` on load; on launch a `LaunchProjectile` hurls that pawn's actual sprite (Pawn / NecroPawn / HellPawn / YoungWiz / PawnHopper) in a spinning arc to the target (`launch` effect).

**Edge Cases:**
- While loaded but NOT in launch mode, the DeadLauncher can still move normally (Rook movement)
- Loading consumes the turn; launching also consumes the turn (each is a full action)
- Launch targets are at **exactly** Manhattan distance 3 — it cannot shoot at distance 1, 2, or 4
- The launch highlights ALL squares at distance 3, regardless of whether an enemy is there; empty squares and even friendly squares are highlighted red (the actual capture check only happens on click)
- Valid pieces to load: `Pawn`, `NecroPawn`, `YoungWiz`, `PawnHopper`, `HellPawn`

---

#### GhoulKing *(Level 2 King)*

**Movement:** 1 square in any direction (standard King)

**Special — Raise NecroPawn (once per game):**
- GhoulKing starts with `raisesLeft: 1`
- **Click 2 (on self, while selected and raisesLeft > 0):** Highlights all adjacent empty tiles cyan
- **Click 3 (adjacent empty tile):** Places a new NecroPawn of matching color; `raisesLeft` decremented to 0
- **Visual effect:** a green `PixelBurst` rises from the raised tile (`raise` effect)
- The raise ability is intended to be "free" — it should not consume the GhoulKing's move for that turn

**Edge Cases:**
- **Engine port:** `performRaise` does **not** call `switchTurn`, so raising is genuinely free — the GhoulKing can still move the same turn (original web bug #5 fixed)
- The raised NecroPawn starts with default properties (no abilities, not stunned)
- If all adjacent tiles are occupied, the raise mode activates with no valid targets shown

---

#### QueenOfBones *(Level 2 Queen)*

**Movement:** Unlimited in all 8 directions (standard Queen)

**Special — Revival (triggered on capture):**
- When a QueenOfBones is captured, `triggerQueenOfBonesRevival()` fires
- If the owning player has **2 or more** friendly pawn-type units (`Pawn`, `NecroPawn`, `HellPawn`, `YoungWiz`, `PawnHopper`), those units are highlighted cyan
- Player clicks 2 of them sequentially → both are removed → QueenOfBones re-spawns at its original spawn square (col 3, row 0 for White or row 7 for Black)
- **Visual effect:** a green/white `PixelBurst` rises at the respawn square (`revive` effect)
- If spawn square is occupied, revival silently fails and no refund occurs

**Edge Cases:**
- The revival uses `isInSacrificeSelectionMode` to block other clicks during selection
- The 2 sacrifices must be selected one at a time; after the first, highlights update to only show remaining eligible targets
- Revival assigns a new UUID to the revived QueenOfBones (it's a brand new piece object)
- If the Prowler happens to be highlighted (due to a leftover state bug), clicking it in sacrifice mode has a Prowler-type check that blocks it from being sacrificed
- The revival turn logic: if `queenColor !== currentTurn()`, it calls `switchTurn()` — this is an attempt to ensure the revival doesn't eat a turn, but the flow is fragile

---

### Demon Guild

The demons use aggression, transformation, and explosive reactions to overwhelm enemies.

---

#### HellPawn *(Level 2 Pawn)*

**Movement:** Standard Pawn (1 forward, 2 from start row, diagonal capture)

**Special — Transformation (on capture of non-pawn):**
- When a HellPawn captures any enemy piece that is **NOT** a pawn-type (`Pawn`, `NecroPawn`, `HellPawn`, `YoungWiz`, `PawnHopper`), it permanently transforms into that piece
- **Visual effect:** a fiery `PixelBurst` erupts at the capture square (`transform` effect; pawn-type captures are normal, no burst)
- The transformed piece keeps the HellPawn's color; everything else (type, movement, abilities) is inherited from the captured piece
- It also inherits the captured piece's `id`, `row`, `col`, and any other properties (including `isStone`, `stunned`, etc.) from the target — this could be a source of bugs

**Edge Cases:**
- Capturing a standard Pawn: no transformation, normal capture
- Capturing a QueenOfDestruction triggers the detonation first via `handleCapture`, then the HellPawn transforms into the remaining QueenOfDestruction — but the QoD may have already been removed by detonation
- Stone pieces (`isStone: true`) cannot be captured at all
- The HellPawn is removed from the board and replaced by the new transformed piece (different object), which may affect any external references to the HellPawn

---

#### Prowler *(Level 2 Knight)*

**Movement:** Standard L-shape Knight

**Special — Double Move (after capture):**
- When the Prowler captures an enemy, it does NOT end its turn
- Instead, the captured piece is removed, the Prowler moves to the capture square, and Knight moves are highlighted again for a mandatory second move
- The second move can be any valid Knight move, including retreating
- After the second move, the turn ends

**Edge Cases:**
- The second move is tracked via `abilityMode: { type: 'secondMove', pieceId }` on `GameState`
- If the Prowler clicks a non-highlighted square during second move, the turn ends
- Capturing a QueenOfDestruction: special-cased to immediately end turn and handle detonation without entering second-move mode
- The Prowler's second move is a reposition only (move to highlighted square, no capture)

---

#### Howler *(Level 2 Bishop)*

**Movement:** Diagonal (Bishop) + any additional movements gained from captured pieces

**Special — Absorb (on capture):**
- Capturing a Knight-type → gains Knight movement (L-shape)
- Capturing a Rook-type → gains Rook movement (orthogonal lines)
- Capturing a Queen-type → gains Queen movement (all directions)
- Capturing a Pawn-type → gains Pawn movement (forward + diagonal capture)
- Gains are **permanent and cumulative** — it can eventually move like a Queen with all extra modes
- **Visual effect:** a purple `PixelBurst` converges inward on the Howler (`howlerAbsorb` effect, `in` mode)

**Piece categorizations for ability gain:**
- Knight-type: `Knight`, `BeastKnight`, `GhostKnight`, `Prowler`, `Familiar`
- Rook-type: `Rook`, `Beholder`, `BoulderThrower`, `DeadLauncher`, `Portal`
- Queen-type: `Queen`, `QueenOfIllusions`, `QueenOfDomination`, `QueenOfBones`, `QueenOfDestruction`
- Pawn-type: `Pawn`, `NecroPawn`, `YoungWiz`, `PawnHopper`, `HellPawn`

**Edge Cases:**
- Capturing a King-type piece (`King`, `HellKing`, `GhoulKing`, `WizardKing`, `FrogKing`) grants **no ability** — King movement is not in any category list
- The Howler must physically move into the captured piece's square (like a normal capture); it's not a ranged attack
- Ability gain is determined by `getAbilityGain()` which classifies the captured piece type into knight/rook/queen/pawn categories

---

#### Beholder *(Level 2 Rook)*

**Movement:** 1 square in any **cardinal** direction (N/S/E/W only); **cannot** move onto any occupied square (friendly or enemy)

**Special — Ranged Boulder (2-click):**
- **Click 2 (on self, while selected):** Enter boulder mode — highlights all squares within Manhattan distance ≤ 3 in red (enemy targets)
- **Click (red tile):** Fires boulder → removes any enemy piece there; does NOT move the Beholder; turn ends
- **Visual effect:** a magenta pixel `EyeBeam` fires from the Beholder to the target, with an iris flash at source (`beam` effect)

**Edge Cases:**
- The Beholder's movement highlights ONLY empty squares — it cannot capture by moving, unlike standard pieces
- Boulder mode targets the entire Manhattan-distance-3 zone (not just enemies; all squares in range are highlighted red). The actual capture check filters for enemy color on click.
- Stone pieces cannot be boulder-targeted
- `isInBoulderMode` is shared with `BoulderThrower` — they both use the same flag. This means if both pieces are on the board and one enters boulder mode, the state might bleed between them unless each checks `selectedPiece.type`

---

#### HellKing *(Level 2 King)*

**Movement:** 1 square in any direction (standard King)

**Special — Convert (instead of capture):**
- When the HellKing moves onto a square occupied by an enemy piece, it does **not** remove that piece
- Instead, the enemy piece's color is flipped to match the HellKing's team
- **Visual effect:** a red→purple `PixelBurst` erupts on the converted piece (`convert` effect)
- The converted piece stays at its current position
- The HellKing does **not** move — it stays in place

**Edge Cases:**
- Stone pieces cannot be converted
- The HellKing's highlights use standard King highlighting, so enemy pieces in its 1-square perimeter are highlighted red — but clicking them triggers conversion, not normal movement
- Converting a QueenOfDestruction: the QoD detonation (`triggerDetonate`) fires inside `handleCapture`, BUT `handleHellKingCapture` does NOT call `handleCapture`. It directly flips the color. So converting a QoD does NOT trigger detonation. This may be intentional.
- Converted pieces retain all their properties (abilities, `isStone`, etc.) — only color changes

---

#### QueenOfDestruction *(Level 2 Queen)*

**Movement:** Unlimited in all 8 directions (standard Queen)

**Special — Death Explosion (triggered when captured):**
- When any piece captures the QueenOfDestruction, `triggerDetonate()` fires immediately BEFORE the Queen is removed
- All 8 surrounding tiles (1-step perimeter) are swept; any piece there is removed via `handleCapture()`
- The QueenOfDestruction itself is also removed after detonation
- **Visual effect:** a yellow `PixelExplosion` bursts from her square when she dies (`detonate` effect, emitted from `captureHandler.ts`); on the standard capture path. (Boulder/launch kills currently show the projectile instead, since those handlers set their own effect after the capture.)

**Edge Cases:**
- Detonation fires regardless of WHO captures her — enemy or friendly fire
- Detonation can chain: if a NecroPawn is in the blast radius, it's captured. If another QueenOfDestruction is adjacent, `triggerDetonate` would be called recursively... though the current implementation filters by `piece.type === 'QueenOfDestruction'` before detonating, so chaining requires a second QoD in the 1-tile perimeter.
- The NecroPawn sacrifice AoE goes through `handleCapture` for each victim, which could trigger a QoD detonation if one is in the NecroPawn's blast radius
- When a Prowler captures the QoD: special-cased in `handleProwlerCapture` — detonation fires, turn ends, no second move

---

### BeastMaster Guild

The beast faction combines raw physical power with unusual mobility.

---

#### PawnHopper *(Level 2 Pawn)*

**Movement:** Standard Pawn (1 forward, diagonal capture) + **always** may move 2 tiles forward

**Special — Hop Capture:**
- Can move 2 tiles forward regardless of move history (no "first move" restriction)
- If the 1-tile intermediate square has an **enemy** piece and the 2-tile destination is **empty**, the hop removes the enemy (hop-capture)
- The hop-capture happens post-move in `handlePawnHopperPostMove()`

**Edge Cases:**
- The 2-tile forward move is always highlighted (not just from the start row)
- Hop capture is detected in `handlePieceMove` after the primary move is applied — the moved PawnHopper's old position and new position are compared
- The intermediate piece must be an enemy (not friendly) to trigger the capture
- If the intermediate square is empty, the 2-tile move is just a normal double-step (no capture)
- The highlight color for the 2-step is contextual: yellow (normal move), red (hop capture available), grey (opponent's piece highlighting)

---

#### BeastKnight *(Level 2 Knight)*

**Movement:** Extended L-shape — moves **3 squares in one direction, 1 perpendicular** (vs standard Knight's 2+1)

**Edge Cases:**
- All 8 extended L-shape combinations are valid
- Jumps over all pieces (same as standard Knight)
- On an 8×8 board, many BeastKnight destinations are out of bounds — bounds checking filters these
- No special ability — movement itself is the enhanced property

---

#### BeastDruid *(Level 2 Bishop)*

**Movement:** Full Bishop movement (unlimited diagonal) + full King movement (1 square any direction)

**Edge Cases:**
- The 1-tile perimeter moves can capture; the diagonal slides can also capture
- No additional special ability — the movement combination is the unit's power
- Since it combines both modules' highlights, it will show both yellow and red appropriately for each reachable square

---

#### BoulderThrower *(Level 2 Rook)*

**Movement:** Unlimited orthogonal (Rook-style); **cannot stop on or capture via movement**

**Special — Ranged Boulder (2-click, identical pattern to Beholder):**
- **Click 2 (on self):** Enter boulder mode — Manhattan-distance-3 perimeter highlighted red
- **Click (red tile):** Fires boulder → removes enemy there; does NOT move the BoulderThrower; turn ends
- **Visual effect:** a lumpy pixel-art `BoulderThrow` rock arcs from the thrower to the target, spinning as it flies (`boulder` effect)

**Edge Cases:**
- Movement highlights are yellow; no red captures via movement
- Boulder targets are the **exact** Manhattan-3 perimeter only (distance = 3, not ≤ 3) — 12 total positions around any point at distance 3
- Note: Beholder uses a slightly different offset list that may include some distance-2 tiles; BoulderThrower's list appears to be strictly distance-3 only
- Stone pieces are immune to boulder capture
- `isInBoulderMode` is shared with `Beholder` — same caveat about potential cross-contamination

---

#### FrogKing *(Level 2 King)*

**Movement:** Standard King (1 square any direction) + **2-tile orthogonal hops** (N/S/E/W only)

**Edge Cases:**
- The 2-tile hops **ignore intervening pieces** — they are true jumps
- Hops CAN capture — if the 2-tile destination has an enemy, it's highlighted red
- Hops cannot land on friendly pieces
- No diagonal hops — only the 4 cardinal directions at 2 tiles

---

#### QueenOfDomination *(Level 2 Queen)*

**Movement:** Unlimited in all 8 directions (standard Queen)

**Special — Dominate (once, adjacent friendly, 2-click):**
- While no domination is active (`pieceLoaded === null`), adjacent friendly pieces are highlighted cyan
- **Click (cyan adjacent friendly):** That piece temporarily becomes a `Queen` sprite and must immediately move
- The original piece is stored inside the QueenOfDomination as `pieceLoaded`
- After the dominated Queen moves, `returnOriginalSprite()` is called, reverting the piece to its original type at the new location
- **Visual effect:** a violet `PixelBurst` marks the dominated piece when domination begins (`dominate` effect)
- If the dominated piece has **no valid moves**, domination instantly reverts (the piece can't be dominated if it's trapped)
- `isInDominationMode` blocks other clicks until the dominated move resolves

**Edge Cases:**
- The domination ability is "once per game" per QueenOfDomination — once `pieceLoaded` is set (even after revert), it never resets to `null`... unless `returnOriginalSprite` clears it. It DOES clear it, so technically it's once per use but could be recharged if the domination naturally completes.
- Actually examining the code: `returnOriginalSprite` sets `pieceLoaded: null` on the QueenOfDomination. This means the ability CAN be used again after the dominated piece moves. This may or may not be the intended design.
- The dominated piece's `type` field is changed to `'Queen'` temporarily; its `id` stays the same, so `returnOriginalSprite` finds it by `id`
- Dominating a `QueenOfDestruction` would turn it into a `Queen`... then when it moves and reverts, it becomes a QoD again — no detonation issues

---

### Wizard Guild

The wizard faction bends rules — repositioning, shooting, teleporting, and shielding.

---

#### YoungWiz *(Level 2 Pawn)*

**Movement:** Standard Pawn (1 forward, 2 from start row, diagonal capture)

**Special — Zap (forward capture without moving):**
- If there is an enemy piece directly in front of the YoungWiz (1 tile forward in its movement direction), that square is highlighted red
- Clicking the red square removes the enemy piece WITHOUT the YoungWiz moving
- The YoungWiz stays in place; turn ends
- **Visual effect:** a small pixel-art `FireBurst` flame ignites on the tile directly ahead (`zap` effect, emitted from `captureDispatch.ts`); diagonal captures are normal moves with no fire

**Edge Cases:**
- The zap square and the forward-1 movement square are the same tile — but the logic distinguishes: if that tile is **occupied by an enemy**, it's a zap (highlighted red); if empty, it's movement (highlighted yellow)
- If the tile directly ahead is occupied by a **friendly**, it's not highlighted at all (standard pawn movement blocking)
- The YoungWiz case in `dispatchPieceCapture` only zaps when the target is the square directly forward and holds an enemy; otherwise it falls through to a normal (diagonal) pawn capture

---

#### Familiar *(Level 2 Knight)*

**Movement:** Standard L-shape Knight

**Special — Turn to Stone (2-click toggle):**
- **Click 2 (on self, while selected and not stone):** The Familiar becomes stone — `isStone = true`; turn ends
- While stone: the Familiar cannot be captured (`handleCapture` checks `isStone`)
- **Click (on self, while stone):** The Familiar reverts — `isStone = false`; does NOT consume a turn
- **Visual effect:** a grey `StonePulse` pixel stone slab slams in (petrify) or eases out (revert) over the tile (`stone` effect, with `on: true/false`)

**Edge Cases:**
- Stone pieces are immune to ALL capture methods (regular capture, boulder throws, AoE sacrifices, etc.) because `handleCapture` returns early if `capturedPiece.isStone`
- The stone-reverting click does not call `switchTurn()` — the reverting player can still act
- When stone, the Familiar's highlight shows normal Knight moves but NOT the cyan "activate stone" highlight — this correctly signals that stone mode cannot be re-activated while already stone
- **Engine port:** `toggleStone` is only reachable for the Familiar's own player via the self-click ability flow, so an opponent can no longer un-stone your Familiar (original web bug #7 fixed)

---

#### WizardTower *(Level 2 Bishop)*

**Movement:** Unlimited diagonal (standard Bishop)

**Special — Remote Capture (no movement on capture):**
- When the WizardTower targets a diagonal enemy square, it captures WITHOUT physically moving into that square
- The WizardTower stays in place; the enemy is removed; turn ends
- **Visual effect:** a gold pixel-art `LightningBolt` strikes from the tower to the target (`towerShot` effect, emitted from `captureDispatch.ts`)

**Edge Cases:**
- The standard Bishop highlights include enemy squares in red — capturing one routes through `dispatchPieceCapture` (`captureDispatch.ts`), which runs `performRangedCapture` instead of a normal move
- The WizardTower can move normally to empty squares (yellow highlights still work)
- **Engine port:** `performRangedCapture` calls `switchTurn`, so a ranged capture correctly ends the turn (original web bug #3 fixed)
- Stone pieces cannot be captured by the WizardTower (filtered by `handleCapture`)

---

#### Portal *(Level 2 Rook)*

**Movement:** Unlimited orthogonal (standard Rook)

**Special — Teleport Storage (5-step interaction):**
1. **Click 1:** Select → Rook moves highlighted + self in cyan (enter-loading mode option)
2. **Click 2 (on self):** Enter Loading Mode → adjacent tiles highlighted cyan (to pick a piece to store)
3. **Click 3 (adjacent friendly piece):** Load it → piece is removed from board, stored in ALL friendly Portals as `pieceLoaded`; turn ends
4. **Click 4 (on any loaded Portal):** Enter Eject Mode → adjacent tiles highlighted cyan (to choose ejection square)
5. **Click 5 (adjacent empty tile):** Eject → piece is placed there; all friendly Portals cleared; does NOT end turn

**Visual effect:** blue `PixelBurst` shimmers at both the Portal and the eject square (`portalOut` effect).

**Edge Cases:**
- The stored piece is shared across ALL same-color Portals — any Portal can eject it
- Ejection does not consume the turn (`switchTurn()` is NOT called after eject)
- Loading DOES end the turn
- The loaded piece is physically removed from the board while stored — if the Portal is captured while a piece is loaded, the loaded piece is lost permanently
- Any piece type can be loaded into a Portal (not just pawns) — the loading check only requires the piece is friendly and adjacent
- Ejection requires the target square to be unoccupied; if all adjacent squares are occupied, the eject cannot proceed

---

#### WizardKing *(Level 2 King)*

**Movement:** Standard King (1 square any direction)

**Special — Vertical Line-of-Sight Shot (no movement):**
- The WizardKing can shoot directly up OR down — the first enemy piece in its vertical column (looking both up and down) is highlighted red
- Clicking the red square removes that enemy WITHOUT the WizardKing moving; turn ends
- Also captures normally within the 1-square perimeter (physical move into enemy square, like a standard King)
- **Visual effect:** a gold pixel-art `LightningBolt` strikes along the column to the target (`kingShot` effect, emitted from `abilityHandlers.ts`)

**Edge Cases:**
- The shot is blocked by intervening pieces (friendly or enemy) — it only hits the FIRST piece in each direction
- The vertical shot is the WizardKing's self-click ability (`abilityMode: 'boulder'` shared ranged flow); the 1-square perimeter capture is an ordinary king move through `handleMove`
- **Engine port:** the perimeter capture goes through `handleMove`, which always calls `switchTurn`, so normal king captures now end the turn (original web bug #4 fixed)

---

#### QueenOfIllusions *(Level 2 Queen)*

**Movement:** Unlimited in all 8 directions (standard Queen) OR swap with a friendly pawn-type

**Special — Phantom Swap:**
- All friendly pawn-type pieces (`Pawn`, `NecroPawn`, `HellPawn`, `YoungWiz`, `PawnHopper`) are highlighted cyan when the QueenOfIllusions is selected
- Clicking a cyan pawn-type instantly swaps their positions with the QueenOfIllusions; turn ends
- **Visual effect:** cyan `PixelBurst` shimmers at both swapped squares (`swap` effect)

**Edge Cases:**
- The Queen and the pawn do NOT need to be adjacent — any friendly pawn-type on the board is eligible
- This is effectively teleportation; the Queen can leap across the board by swapping with a pawn
- The swap is a direct position exchange — no movement restrictions apply
- The swap ends the turn normally; the player can't then move after swapping
- Note: standard Queen moves (yellow/red) are ALSO highlighted at the same time as swap targets (cyan) — the click dispatch checks `handleQueenOfIllusionsSwap` first, so clicking a red enemy square with a QueenOfIllusions selected would hit this handler... but the handler checks that the clicked piece is a friendly pawn-type, so it would return `false` and fall through to the next handler

---

## Piece Properties Reference

Every piece object in the `pieces()` array has these fields:

| Field | Type | Default | Purpose |
|---|---|---|---|
| `id` | `string` | assigned at init | Unique identifier (initial pieces use numeric string IDs; dynamically spawned pieces use `generateId()`) |
| `type` | `string` | — | Piece type name (must match sprite filename and logic module name) |
| `color` | `"White" \| "Black"` | — | Which team this piece belongs to |
| `row` | `0–7` | — | Current row position |
| `col` | `0–7` | — | Current column position |
| `pawnLoaded` | `boolean` | `false` | DeadLauncher: whether a pawn is loaded |
| `loadedPawnType` | `PieceType?` | `undefined` | DeadLauncher: which pawn-type was loaded (drives the launch sprite) |
| `stunned` | `boolean` | `false` | GhostKnight: target is stunned and cannot act |
| `raisesLeft` | `number` | `0` (GhoulKing: `1`) | GhoulKing: number of free raise actions remaining |
| `pieceLoaded` | `PieceObject \| null` | `null` | Portal/QueenOfDomination: the stored/dominated piece |
| `isStone` | `boolean` | `false` | Familiar: immune to all capture when true |
| `gainedAbilities` | `{knight, rook, queen, pawn: boolean}` | all `false` | Howler: which movement types have been absorbed |

---

## Highlight Color System

| Key | Color | Meaning |
|---|---|---|
| selected | Green border | Currently selected piece |
| selected+ability | Blue border | Selected piece with self-click ability available |
| `move` | Yellow border | Standard valid move (empty square) |
| `capture` | Red border | Enemy that will die, or friendly in AoE blast |
| `ability` | Blue border | Non-lethal ability target (load, raise, swap, dominate, eject) |
| `range` | Grey border | Ranged ability reach (empty/friendly/stone, non-interactive) |
| `preview` | Grey border (lighter) | Opponent piece range (read-only) |

---

## Edge Cases & Design Decisions

1. **Opponent piece previewing:** Clicking an enemy piece shows its movement range in grey (not yellow/red). This is read-only — you cannot act on grey highlights.

2. **Stone immunity applies universally:** `isStone` is checked in `handleCapture`, all move helpers (sliding, stepping, hopping), pawn diagonals, YoungWiz zap, FrogKing hops, and WizardKing vertical shot. Stone pieces are invisible to all capture targeting. Stone Familiar cannot move — must un-stone first (free action).

3. **QueenOfDestruction detonation in `handleCapture`:** The detonation check fires at the TOP of `handleCapture`, before the piece is removed. This means the QoD's detonation zone is computed correctly based on where she was when captured.

4. **Turn enforcement with grey highlighting:** When an opponent's piece is selected, the highlights show in grey. Clicking a grey square does nothing — `isTurn` check in each handler blocks execution.

5. **`preserveLaunch` flag on `clearBoardState`:** When a new piece is selected, the board is cleared with `{ preserveLaunch: true }`. This preserves any active DeadLauncher `launchMode` so a loaded DeadLauncher's state isn't accidentally reset when clicking somewhere else.

6. **Pawn start-row detection:** Uses `row === startRow` (1 for White, 6 for Black) — not a `hasMoved` flag. A resurrected Pawn placed at row 1 would still get a double-step option.

7. **GhoulKing raise is "free":** Per design intent, raising a NecroPawn does not end the GhoulKing's turn.

8. **Portal shared piece storage:** ALL same-color Portals share `pieceLoaded`. This is intentional — it represents cross-board teleportation, where any Portal acts as an exit.

---

## Known Bugs (from original codebase)

All bugs from the original codebase have been addressed during the engine port.

| # | Status | Bug Description | Resolution |
|---|---|---|---|
| ~~1~~ | **Fixed** | ~~Stun clearing for White uses `for...in`~~ | `turnManager.ts` uses proper array `.map()` for both colors |
| ~~2~~ | **Fixed** | ~~Prowler second-move passes wrong piece; double switchTurn~~ | `Prowler.ts` tracks pieceId correctly, single turn switch |
| ~~3~~ | **Fixed** | ~~WizardTower ranged capture doesn't end turn~~ | `performRangedCapture` switches turn |
| ~~4~~ | **Fixed** | ~~WizardKing standard capture doesn't end turn~~ | Standard captures go through `handleMove` which always switches turn |
| ~~5~~ | **Fixed** | ~~GhoulKing raise consumed turn~~ | `performRaise` doesn't call switchTurn |
| ~~6~~ | **Fixed** | ~~DeadLauncher launch showed all distance-3 squares~~ | `getLaunchTargets` filters to enemy-occupied only |
| ~~7~~ | **Fixed** | ~~Stone pieces un-stoned by opponent~~ | `toggleStone` only callable by owning player |
| ~~8~~ | **Fixed** | ~~Necromancer resurrection doesn't end turn~~ | Resurrection flows through `handleResurrectionAbility` which calls `switchTurn` |
| ~~9~~ | **Documented** | ~~Portal eject doesn't end turn~~ | Intentional per design — `performEject` does not switch turn |
| ~~10~~ | **Documented** | ~~Howler gains nothing from king-type captures~~ | Intentional — king-types are not in any ability category, `getAbilityGain` returns null |
| ~~11~~ | **Documented** | ~~QueenOfDomination ability reusable~~ | Intentional — `pieceLoaded` clears after revert, allowing reuse |
| ~~12~~ | **Fixed** | ~~No win condition~~ | King-capture detection in `checkWinCondition` (proper checkmate deferred to Phase 5) |
| 13 | Open | No pawn promotion | Deferred — not yet implemented |
| ~~14~~ | **Fixed** | ~~handleCapture called with null capturingPiece~~ | `captureHandler.ts` always receives `capturingPiece` parameter |

---

## Features Not Yet Implemented

- **Checkmate / stalemate** — Only king-capture exists; proper check/checkmate deferred (Phase 6)
- **Apple Sign In** — Currently anonymous only; Apple Sign In integration pending dev account
- **Resign button** — No way to forfeit a game mid-play
- **Idle timeout** — Players can stall indefinitely (60s timeout planned)
- **Lobby chat** — Schema exists; UI not built
- **Pawn promotion** — Pawns reaching the far rank do nothing
- **Graveyard UI** — Captures tracked in state but no visual; pending redesign
- **Turn timer** — No clock or time pressure
- **Move history / undo** — No undo or replay
- **AI opponent** — No single-player mode
- **Sound effects / animations** — Not yet planned
- **En passant** — Not in scope (game uses custom pawns)
- **Castling** — Not in scope

---

*Last updated: 2026-06-02 — Phases 1–7 complete + full pixel-art visual effects layer (Reanimated): all 17 ability effects emitted/rendered, plus per-move glide/death-fade and projectile impact dust. Post-spectator refactor: shared `GameBoardLayout`, lib-owned SFX mute, App-level hooks (`useGameRouting`/`useOnlineGameActions`) + pure helpers (`colorTimes`/`winnerOf`). Single-player vs AI prototype: pure move generator (`src/ai/generateTurns`) + negamax/alpha-beta opponent, wired into a SoloGame screen. 402 tests across 42 suites.*
