# BattleChess — Full Game Overview

> A fantasy chess variant with 4 guilds, each with 6 unique units and special abilities.  
> Mobile app: Expo (React Native) + TypeScript  
> Backend: Supabase (planned)

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Tech Stack](#tech-stack)
3. [Game Concept](#game-concept)
4. [Starting Configuration](#starting-configuration)
5. [Global State](#global-state)
6. [Rendering & Board](#rendering--board)
7. [Click Handler — The Central Dispatcher](#click-handler--the-central-dispatcher)
8. [Core Logic Modules](#core-logic-modules)
9. [Basic Pieces](#basic-pieces)
10. [The Four Guilds](#the-four-guilds)
    - [Necromancer Guild](#necromancer-guild)
    - [Demon Guild](#demon-guild)
    - [BeastMaster Guild](#beastmaster-guild)
    - [Wizard Guild](#wizard-guild)
11. [Piece Properties Reference](#piece-properties-reference)
12. [Highlight Color System](#highlight-color-system)
13. [Edge Cases & Design Decisions](#edge-cases--design-decisions)
14. [Known Bugs & Incomplete Logic](#known-bugs--incomplete-logic)
15. [Features Not Yet Implemented](#features-not-yet-implemented)

---

## Project Structure

```
src/
├── engine/                      # Pure TS game logic — zero React imports
│   ├── gameReducer.ts           # Central reducer: (state, action) → newState
│   ├── initialBoard.ts          # Default starting layout (Necro vs Demon)
│   ├── utils.ts                 # getPieceAt, isOpponent, isInBounds, etc.
│   ├── helpers/
│   │   └── moveHelpers.ts       # Sliding/step move generators shared across pieces
│   └── pieces/
│       ├── index.ts             # Registry mapping PieceType → module
│       ├── Pawn.ts .. King.ts   # Basic pieces
│       ├── NecroPawn.ts .. QueenOfBones.ts   # Necromancer guild
│       ├── HellPawn.ts .. QueenOfDestruction.ts  # Demon guild
│       ├── PawnHopper.ts .. QueenOfDomination.ts # Beast guild
│       └── YoungWiz.ts .. QueenOfIllusions.ts    # Wizard guild
├── screens/                     # Each screen: Header/View/Hook split
│   ├── Game/                    # Main game board (fully wired)
│   │   ├── index.tsx            # Composition root
│   │   ├── useGame.ts           # Hook: reducer + classifyAction dispatch
│   │   ├── GameView.tsx         # Board grid, highlights, win overlay
│   │   └── GameHeader.tsx       # Turn label + ability-mode instructions
│   └── ArmyBuilder/             # Guild/race selection (placeholder)
├── components/                  # Shared UI components
│   └── CapturedPieces.tsx       # Graveyard sprite row
├── hooks/                       # Shared hooks
├── navigation/                  # Navigation config
├── types/
│   └── game.ts                  # Core types: Piece, GameState, GameAction, etc.
├── utils/                       # Shared utility functions
└── constants/                   # App-wide constants
    ├── theme.ts                 # Board colors, highlight colors, app palette
    └── sprites.ts               # Sprite map: getSprite(color, type) → ImageSource
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo (React Native) — iOS, Android, Web |
| Language | TypeScript (strict mode) |
| Game state | Pure reducer (`gameReducer.ts`) |
| Board UI | React Native Pressable grid (8×8, White at bottom) |
| Backend | Supabase (planned) |
| Multiplayer | Supabase Realtime (planned) |

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

The game currently hardcodes two teams:

- **White (rows 0–1):** Necromancer Guild
- **Black (rows 6–7):** Demon Guild

The BeastMaster and Wizard guilds have full sprite assets and complete logic, but are **not placed in the default starting lineup**. They exist as selectable alternatives for the future army-builder feature.

### White Starting Lineup (row 0, left to right)
`DeadLauncher | GhostKnight | Necromancer | QueenOfBones | GhoulKing | Necromancer | GhostKnight | DeadLauncher`

### White Pawns (row 1)
`NecroPawn × 8`

### Black Starting Lineup (row 7, left to right)
`Beholder | Prowler | Howler | QueenOfDestruction | HellKing | Howler | Prowler | Beholder`

### Black Pawns (row 6)
`HellPawn × 8`

---

## Game State

All game state is a single immutable `GameState` object managed by a pure reducer. See `src/types/game.ts` for full type definitions.

| Field | Type | Purpose |
|---|---|---|
| `pieces` | `Piece[]` | Full board state — single source of truth |
| `capturedPieces` | `Piece[]` | Pieces removed from the board (for graveyard display) |
| `currentTurn` | `'White' \| 'Black'` | Whose turn it is |
| `selectedSquare` | `Square \| null` | The currently selected square |
| `highlights` | `Highlight[]` | Tiles currently highlighted (move, capture, ability, preview) |
| `abilityMode` | `AbilityMode` | Discriminated union tracking multi-step ability flows (sacrifice, resurrection, loading, launch, boulder, domination, secondMove, sacrificeSelection) |
| `status` | `GameStatus` | Active game or winner declared |

---

## Rendering & Board

The board is an 8×8 grid of React Native `Pressable` components. White pieces render at the bottom of the screen. PixiJS has been dropped entirely.

Sprites live in `assets/sprites/{Color}{Type}.png` — e.g. `WhiteNecromancer.png`, `BlackHellPawn.png`. 60 PNGs total (30 piece types × 2 colors). Mapped via `src/constants/sprites.ts`.

**Highlight indicators:**
- `move` — centered semi-transparent dot on empty squares
- `capture` — red ring border on enemy-occupied squares
- `ability` — cyan ring border on special ability targets
- `preview` — grey ring border on opponent piece range (read-only)

**Additional UI:**
- **Header** — shows current turn label and ability-mode instructions
- **Win overlay** — appears on king capture with winner text and "New Game" button
- **Captured pieces graveyard** — small sprite rows above (Black captures) and below (White captures) the board; tracked via `capturedPieces` on `GameState`

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
- The raise ability is intended to be "free" — it should not consume the GhoulKing's move for that turn

**Edge Cases:**
- **Bug:** After raising, `setSelectedSquare(null)` is called, which deselects the GhoulKing. The player cannot immediately move it. This means the raise effectively DOES consume the turn in practice.
- The raised NecroPawn starts with default properties (no abilities, not stunned)
- If all adjacent tiles are occupied, the raise mode activates with no valid targets shown

---

#### QueenOfBones *(Level 2 Queen)*

**Movement:** Unlimited in all 8 directions (standard Queen)

**Special — Revival (triggered on capture):**
- When a QueenOfBones is captured, `triggerQueenOfBonesRevival()` fires
- If the owning player has **2 or more** friendly pawn-type units (`Pawn`, `NecroPawn`, `HellPawn`, `YoungWiz`, `PawnHopper`), those units are highlighted cyan
- Player clicks 2 of them sequentially → both are removed → QueenOfBones re-spawns at its original spawn square (col 3, row 0 for White or row 7 for Black)
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

**Edge Cases:**
- The zap square and the forward-1 movement square are the same tile — but the logic distinguishes: if that tile is **occupied by an enemy**, it's a zap (highlighted red); if empty, it's movement (highlighted yellow)
- If the tile directly ahead is occupied by a **friendly**, it's not highlighted at all (standard pawn movement blocking)
- The `handleYoungWizZapClick` verifies both that the target matches the zap position AND that a `pieceAtZap` exists and is enemy

---

#### Familiar *(Level 2 Knight)*

**Movement:** Standard L-shape Knight

**Special — Turn to Stone (2-click toggle):**
- **Click 2 (on self, while selected and not stone):** The Familiar becomes stone — `isStone = true`; turn ends
- While stone: the Familiar cannot be captured (`handleCapture` checks `isStone`)
- **Click (on self, while stone):** The Familiar reverts — `isStone = false`; does NOT consume a turn

**Edge Cases:**
- Stone pieces are immune to ALL capture methods (regular capture, boulder throws, AoE sacrifices, etc.) because `handleCapture` returns early if `capturedPiece.isStone`
- The stone-reverting click does not call `switchTurn()` — the reverting player can still act
- When stone, the Familiar's highlight shows normal Knight moves but NOT the cyan "activate stone" highlight — this correctly signals that stone mode cannot be re-activated while already stone
- **Bug:** The revert logic (`familiarPiece.isStone = false; return true`) runs before the `isTurn` check for going INTO stone. If the Familiar is stone and the enemy clicks it (via `handleFamiliarClick` in the click chain), the enemy could un-stone your Familiar. However, the function first checks that the selected piece is a Familiar, which requires the enemy to have first selected their own Familiar... Actually, the check is that `selectedPosition` holds a Familiar — this should be the current player's selection. Worth verifying in play.

---

#### WizardTower *(Level 2 Bishop)*

**Movement:** Unlimited diagonal (standard Bishop)

**Special — Remote Capture (no movement on capture):**
- When the WizardTower moves diagonally into a square with an enemy, it captures WITHOUT physically moving into that square
- The WizardTower stays in place; the enemy is removed; turn ends

**Edge Cases:**
- The standard Bishop `highlightMoves` includes enemy squares in red — clicking a red highlighted square triggers `handleWizardTowerCapture` first in the dispatch chain, which removes the enemy and returns `true`, preventing the standard move from firing
- The WizardTower can move normally to empty squares (yellow highlights still work)
- **Significant issue:** `handleWizardTowerCapture` does NOT call `switchTurn()`. After a capture, the turn does not switch. This is a bug.
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

**Edge Cases:**
- The shot is blocked by intervening pieces (friendly or enemy) — it only hits the FIRST piece in each direction
- The physical king capture (1-square perimeter) and the vertical shot both use the same red highlight color — clicking any red square triggers `handleWizardKingCapture` which checks both cases
- **Bug:** For the standard 1-square perimeter capture, `switchTurn()` is NOT called. Only the vertical shot path calls `switchTurn()`. So normal king captures don't end the turn.
- **Bug:** The condition `if (isTurn && targetPiece && pieceAtPos.color !== wizardKingPiece.color && pieceAtPos !== wizardKingPiece)` requires BOTH `targetPiece` (the clicked square has a piece) AND `pieceAtPos` (the first piece in the vertical scan) — if the clicked square IS the vertical target, both would be the same piece and this works; but the condition is convoluted

---

#### QueenOfIllusions *(Level 2 Queen)*

**Movement:** Unlimited in all 8 directions (standard Queen) OR swap with a friendly pawn-type

**Special — Phantom Swap:**
- All friendly pawn-type pieces (`Pawn`, `NecroPawn`, `HellPawn`, `YoungWiz`, `PawnHopper`) are highlighted cyan when the QueenOfIllusions is selected
- Clicking a cyan pawn-type instantly swaps their positions with the QueenOfIllusions; turn ends

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
| `id` | `number \| UUID` | assigned at init | Unique identifier (initial pieces use numeric IDs 1–32; dynamically spawned pieces use `crypto.randomUUID()` or `Date.now()`) |
| `type` | `string` | — | Piece type name (must match sprite filename and logic module name) |
| `color` | `"White" \| "Black"` | — | Which team this piece belongs to |
| `row` | `0–7` | — | Current row position |
| `col` | `0–7` | — | Current column position |
| `pawnLoaded` | `boolean` | `false` | DeadLauncher: whether a pawn is loaded |
| `stunned` | `boolean` | `false` | GhostKnight: target is stunned and cannot act |
| `raisesLeft` | `number` | `0` (GhoulKing: `1`) | GhoulKing: number of free raise actions remaining |
| `pieceLoaded` | `PieceObject \| null` | `null` | Portal/QueenOfDomination: the stored/dominated piece |
| `isStone` | `boolean` | `false` | Familiar: immune to all capture when true |
| `gainedAbilities` | `{knight, rook, queen, pawn: boolean}` | all `false` | Howler: which movement types have been absorbed |

---

## Highlight Color System

| Key | Visual | Meaning |
|---|---|---|
| `move` | Semi-transparent dot | Standard valid move (empty square) |
| `capture` | Red ring border | Enemy-occupied capture target |
| `ability` | Cyan ring border | Special ability target (AoE blast zone, ranged boulder, friendly targets) |
| `preview` | Grey ring border | Opponent's piece range (read-only, click does nothing) |

---

## Edge Cases & Design Decisions

1. **Opponent piece previewing:** Clicking an enemy piece shows its movement range in grey (not yellow/red). This is read-only — you cannot act on grey highlights.

2. **Stone immunity applies universally:** `isStone` is checked in `handleCapture` before any capture logic. This protects against NecroPawn AoE, boulder throws, DeadLauncher launches, and HellKing conversion — all of which go through `handleCapture`.

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

- **Army builder / guild selection** — Choose guilds before game start (Phase 5)
- **Checkmate / stalemate** — Only king-capture exists; proper check/checkmate deferred (Phase 6)
- **Pawn promotion** — Pawns reaching the far rank do nothing
- **Multiplayer** — Supabase Realtime sync (Phase 7)
- **Turn timer** — No clock or time pressure
- **Move history / undo** — No undo or replay
- **AI opponent** — No single-player mode
- **Sound effects / animations** — Not yet planned
- **En passant** — Not in scope (game uses custom pawns)
- **Castling** — Not in scope

---

*Last updated: 2026-05-26 — Phase 4 Game Screen complete, game playable on web*
