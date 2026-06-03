# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                              # start Expo dev server
npm run ios                            # build + install on iOS simulator
npx expo run:ios --device <UDID>       # build + install on physical device
npm run web                            # start in browser
npm test                               # run Jest test suite (402 tests)
```

TypeScript strict mode enabled. Uses Expo SDK 54 (compatible with Xcode 16.4).

## Stack

- **Expo SDK 54 / React Native** — iOS + Android + Web from one codebase
- **TypeScript** strict mode
- **Zustand** — app-wide state (auth, screen, lobby, games)
- **useReducer** — game engine state (kept local because the reducer is pure)
- **Supabase** — Postgres + Realtime for multiplayer (anonymous auth for now)
- **Space Mono** — monospace font via `@expo-google-fonts/space-mono`
- **expo-audio / expo-haptics** — chiptune SFX + haptic feedback (native modules; require a dev build)

Bundle ID: `com.leenapthine.battlechess`

## Architecture

Three architectural layers:

1. **Engine** (`src/engine/`) — pure TypeScript, zero React, zero side effects. The game reducer and all piece modules.
2. **Lib** (`src/lib/`) — pure API functions for external services (Supabase). Zero React.
3. **Stores** (`src/stores/`) — Zustand stores that wrap lib calls with state. Components subscribe via hooks. NEVER consume Zustand inside library files or piece modules.

App-level orchestration that doesn't belong to a single screen lives in `src/hooks/` (e.g. `useGameRouting`, `useOnlineGameActions`). Like components, these may consume stores; keep any pure logic they need as a standalone testable helper alongside them (e.g. `winnerOf`).

### Folder structure

```
src/
├── engine/                — pure game logic (no React)
│   ├── gameReducer.ts     — central reducer
│   ├── initialBoard.ts    — createInitialState(p1Army, p2Army)
│   ├── pieceTraits.ts     — SELF_CLICK_TYPES, opponentColor()
│   ├── pieces/            — one file per piece type
│   └── helpers/           — moveHelpers, captureHandler, captureDispatch,
│                            turnManager, classifyAction, abilityHandlers
├── ai/                    — single-player opponent (pure, no React)
│   ├── generateTurns.ts   — every legal full turn, by driving the real
│   │                        reducer via classifyAction (reuses all rules)
│   ├── evaluate.ts        — material-based position score
│   ├── pieceValues.ts     — per-piece worth (role values + upgrade cost)
│   └── chooseTurn.ts      — negamax + alpha-beta; returns the tap-sequence
├── lib/                   — pure API (no React)
│   ├── supabase.ts        — client setup with AsyncStorage persistence
│   ├── auth.ts            — sign in, get/create profile
│   ├── games.ts           — create, join, submit army, write state,
│   │                        list open/active, get one, spectate,
│   │                        subscribe to lobby/game, restore active
│   ├── chat.ts            — lobby chat: fetch / send / subscribe
│   ├── presence.ts        — per-game Realtime presence → live viewer list
│   └── sfx.ts             — chiptune SFX player + effect→clip map
├── stores/                — Zustand (no React imports beyond create)
│   ├── authStore.ts       — auth status, profile, sign in/out
│   ├── screenStore.ts     — navigation state machine
│   ├── gamesStore.ts      — open + live games, current game, spectating
│   │                        flag, subscriptions
│   ├── chatStore.ts       — chat history, unread counter, subscription
│   └── sfxStore.ts        — UI mute toggle; pushes the flag down to lib/sfx
├── hooks/                 — App-level orchestration hooks (no screen owns them)
│   ├── useGameRouting.ts  — drives the screen state-machine off game status
│   ├── useOnlineGameActions.ts — resign / timeout handlers for OnlineGame
│   └── winnerOf.ts        — pure: loser color + seat ids → winner color/id
├── screens/               — each screen is Header/View/Hook split
│   ├── Title/             — retro 1980s boot screen with random sprite
│   ├── SignIn/            — anonymous sign-in
│   ├── NamePrompt/        — display name on first sign-in
│   ├── Lobby/             — chat panel + new game buttons + open + live games
│   ├── PointCap/          — set point budget
│   ├── WaitingRoom/       — host waits for guest to join
│   ├── ArmyBuilder/       — local pass-and-play army selection
│   ├── Handoff/           — "pass the device" interstitial (local mode)
│   ├── OnlineArmyBuilder/ — online army selection (writes to DB)
│   ├── Game/              — local game screen (+ GameBoardLayout, the shared
│   │                        board shell reused by OnlineGame/SoloGame; GameView)
│   ├── SoloGame/          — single-player vs AI (human = White, bot = Black)
│   └── OnlineGame/        — synced online game screen (also serves the
│                            read-only spectator screen via a `spectator` prop).
│                            colorTimes (host→White clock map), OnlineMatchupBar,
│                            ViewerListModal
├── components/
│   ├── CapturedPieces.tsx — graveyard (currently removed from UI)
│   ├── ConcedeButton.tsx  — concede with confirm modal
│   ├── PlayerTimer.tsx    — per-player clock (ticks during own turn)
│   └── SpriteInfoCard.tsx — piece info card
├── types/
│   ├── game.ts            — Piece, GameState, GameAction, AbilityMode, WinReason
│   └── army.ts            — Guild, BasicRole, ArmyConfig, BOARD_SLOTS
├── data/
│   ├── pieceDescriptions.ts  — single-line ability descriptions (info cards)
│   ├── pieceDetails.ts       — bulleted movement + ability lists (title screen)
│   └── upgradeCosts.ts    — UPGRADE_COSTS, GUILD_PIECES, GUILDS
├── constants/
│   ├── theme.ts           — Homebrew colors + FONT
│   └── sprites.ts         — sprite map
└── assets/sprites/        — 60 PNGs at 128×128 (nearest-neighbor upscaled)
```

### Screen file structure (Header / View / Hook)

Every non-trivial screen folder contains:
- `useFeature.ts` — all logic, state, handlers. Zero JSX.
- `FeatureView.tsx` — pure presentational. Props only.
- `FeatureHeader.tsx` — presentational header. Props only.
- `index.tsx` — thin composition root wiring hook to views.

Simple screens (SignIn, NamePrompt, WaitingRoom, Handoff) skip the split and put everything in `index.tsx`.

**Shared board shell:** the local (`Game`) and online (`OnlineGame`) screens share `GameBoardLayout` (in `screens/Game/`) — a presentational shell holding the status bar, header + both `PlayerTimer`s, the two `SpriteInfoCard` slots, `GameView`, and the REPLAY/SFX bottom row. Screens pass header data, clocks, `selectedPiece`, `GameView` props (`GameViewProps`), plus two slots: `topSlot` (online matchup + viewer count/modal) and `bottomActions` (Concede for players, EXIT for spectators). The layout owns the SFX mute toggle, so neither screen reads `sfxStore` directly. `OnlineGame/index.tsx` is therefore a thin composition root (hook + `colorTimes` + slot wiring); its chrome lives in `OnlineMatchupBar` and `ViewerListModal`.

### Engine design

All game logic is pure TypeScript — no React, no signals, no mutation.
- Piece modules: `getValidMoves(piece, pieces) → Highlight[]`
- State transitions: `gameReducer(state, action) → GameState`
- Multi-step abilities tracked by `AbilityMode` discriminated union
- Piece-specific capture dispatch in `captureDispatch.ts` (WizardTower stays put, HellKing converts, Prowler second move, etc.)

### Single-player AI (`src/ai/`)

The computer opponent is pure TypeScript that leans entirely on the existing engine — it never re-implements a rule.

- **`generateTurns(state)`** is the keystone: it enumerates every legal *full turn* for the side to move by exploring sequences of square-taps through the real engine (`classifyAction` + `gameReducer`), exactly as a human tapping the board would. Each turn comes back as the `GameAction[]` to dispatch plus the resulting `GameState`. Multi-step abilities (self-click → target, etc.) fall out naturally; the search is bounded by a tap cap. **No checkmate detection is needed** — the game ends on king capture, so terminal = king gone.
- **`evaluate(state, color)`** is a material score (per-piece `pieceValue`, derived from the basic role values + army-builder upgrade costs) with a decisive bonus for a won game. Positional terms are the obvious next addition.
- **`chooseTurn(state, difficulty)`** runs negamax + alpha-beta over `generateTurns` and returns the chosen tap-sequence. `depth: 1` = greedy; `depth: 2` looks one reply ahead (`DIFFICULTIES.easy` / `.normal`).
- **`SoloGame`** wires it up: the human plays White through the reducer as usual; `useSoloGame` watches for Black's turn, calls `chooseTurn`, and dispatches the returned actions one at a time (with delays) so each sub-move animates. The AI currently fields a plain un-upgraded army of a random guild.

### File size

~150 lines soft cap. Extract helpers proactively.

## Multiplayer

End-to-end realtime over Supabase. Database is the source of truth.

- **Anonymous auth** — users get a UUID via `signInAnonymously()`, prompted for a display name on first sign-in
- **Lobby** — `games` rows where status='waiting' are visible to all signed-in users; hosts can browse and join
- **State sync model** — active player runs reducer locally, writes new `GameState` to `games.game_state` column. Other player subscribes via Supabase Realtime and receives updates.
- **Army selection** — each player writes their own army to `host_army` / `guest_army` columns. When both are set, host calls `startGame` which initializes `game_state` and flips status to 'active'.
- **Reconnection** — on app start, `restoreMyGame` queries for any non-finished game the user is part of and resumes
- **Orphan cleanup** — lobby filters games >10min old; host's stale waiting games auto-deleted on app start
- **Local pass-and-play** — still available as a mode; bypasses Supabase entirely
- **Per-player clocks** — `host_time_ms` / `guest_time_ms` columns hold each player's time bank; active player's clock ticks down, hitting 0 = timeout loss. The board never flips, so the pure `colorTimes(hostMs, guestMs)` helper (`screens/OnlineGame/`) maps host→White and guest→Black for every viewer (players and spectators alike)
- **Win reasons** — `game_state.status` carries `reason: 'kingCapture' | 'resign' | 'timeout'` so the overlay can show the right banner. Resign/timeout are handled by `useOnlineGameActions`, which credits the winner via the pure `winnerOf(loserColor, hostId, guestId)` helper (host is always White)
- **Lobby chat** — `chat_messages` table backs a global terminal-style chat panel on the lobby screen; server-side trigger enforces 1 message / 2 sec rate limit
- **Spectating** — any signed-in user can watch an in-progress game read-only. The lobby's **LIVE GAMES** list (`listActiveGames`) shows active matches with a **VIEW** button; `spectate()` loads the row and flags `isSpectating` **without** joining. The spectator reuses `OnlineGameScreen` with `spectator` set: never their turn, taps only inspect (grey preview, either color), and **no writes ever**. An **EXIT** button (shown only to spectators; players keep Concede) returns to the lobby. Gated by the `games_read_spectate` RLS policy (reads of `active`/`finished` games) — there is no matching write policy, so spectators are read-only by construction. **Live viewer count** comes from a per-game Realtime **presence** channel (`lib/presence.ts`): players and spectators both join, each tracking `{ role, name }`; the `👁 N` indicator (shown to everyone, rendered by `OnlineMatchupBar`) is tappable and opens `ViewerListModal`, a closable modal listing every watcher's name.

Database schema lives in `supabase/schema.sql`. RLS is enabled on all tables.

## Visual design

Homebrew terminal aesthetic — black background, bright green accents, monospace throughout. The board is an 8×8 grid of React Native `Pressable` squares with White at the bottom.

- **Theme:** black bg (#000000), green board squares (#2d8c2d / #1a6b1a), green text (#00ff00), Space Mono font
- **Highlights:** thick inner square borders rendered under sprites
  - Green border — selected piece
  - Blue border — selected piece has self-click ability available
  - Yellow border — valid move
  - Red border — capture or anything that will die (including friendly in blast)
  - Grey border — range indicator on empty/friendly/stone squares (non-interactive)
  - Grey lighter — preview (opponent piece range, read-only)
- **Self-click pieces** hide ability targets until activated: NecroPawn, GhoulKing, DeadLauncher, Beholder, BoulderThrower, Familiar, Portal, WizardKing
- **Sprite info cards** appear above (Black) or below (White) the board when a piece is tapped
- **Header** shows current turn, ability-mode instructions, and flash messages
- **Sprites** pre-upscaled to 128×128 with nearest-neighbor for pixel-perfect rendering at any size

### Visual effects (`src/screens/Game/effects/`)

A Reanimated animation layer sits above the board. Two systems:
- **Per-move** (no engine involvement): `AnimatedPiece` glides sprites (FLIP) and `DyingPiece` fades captures, detected by ID-diffing `pieces` in `GameView`.
- **Ability effects**: the reducer writes a typed `Effect` to `GameState.lastEffect` (cleared to `null` on every other action); `EffectRenderer` routes it to a primitive that calls `onDone` to clear the queue. All 17 `Effect` types are emitted/rendered. Every primitive is **hand-rolled pixel art** (grids of square `View`s — no SVG/Skia, so no native dep): `LightningBolt` (WizardKing/WizardTower), `EyeBeam` (Beholder), `FireBurst` (YoungWiz), `BoulderThrow` (BoulderThrower), `PixelExplosion` (NecroPawn), `LaunchProjectile` (DeadLauncher — loaded pawn sprite, spinning), `PixelBurst` (versatile particle poof — transform/convert/raise/revive/dominate/swap/portalOut/howlerAbsorb), `StunPulse` (GhostKnight), `StonePulse` (Familiar). **Invariant:** every `EffectRenderer` branch must eventually call `onDone` or the queue stalls (e.g. the `stun` case guards an empty `affected` array). See GAME_OVERVIEW.md "Visual Effects" for the full effect→primitive map.
- **Last-move replay**: a ⟳ Replay button (local **and** online Game screens) re-plays the previous turn. A shared `useReplayRecorder(state)` hook records each turn as a sequence of board frames (one per sub-move, so multi-step turns replay in full) — driven by `state` transitions, so it works for both local reducer moves and online moves applied via remote sync. `GameView` re-stages the frames through the existing animation machinery (seeding `AnimatedPiece` positions so there's no rewind-slide). Real `GameState` is untouched.

### Sound & haptics (`src/lib/sfx.ts`, `src/stores/sfxStore.ts`)

8-bit chiptune SFX + haptic feedback, layered onto the existing effect/animation pipeline with **zero engine changes** (the engine stays pure — audio is a view-side side effect).

- **`src/lib/sfx.ts`** — pure lib (no React). Lazily creates and reuses one `expo-audio` `AudioPlayer` per clip; `playSfx(key)` seeks to 0 and replays. `setAudioModeAsync({ playsInSilentMode: true })` so SFX play through the silent switch. All errors are swallowed so audio never interrupts gameplay. `playEffectSfx(effectType)` maps each ability `Effect.type` → a clip via `EFFECT_SFX` (several share one: king/tower → `laser`, transform/convert → `morph`, raise/revive → `powerup`, swap/portalOut → `teleport`). **Owns the master-mute flag** — a private `muted` boolean flipped via `setSfxMuted()`; `playSfx` early-returns when muted, so the lib stays self-contained (no Zustand import).
- **`src/stores/sfxStore.ts`** — Zustand UI mute toggle. `toggleMute` flips the store's mirror and pushes the new value down via `setSfxMuted` (dependency points stores→lib, the allowed direction). Subscribed by `GameBoardLayout` for the **SFX** toggle button (next to ⟳ REPLAY).
- **Wiring (`GameView.tsx`)**: `pushEffect` calls `playEffectSfx` (fires for live moves **and** replay steps) + a heavy haptic on `detonate`. The capture ID-diff plays the generic `capture` thud + light haptic, but **only when `lastEffect` is null** — ability captures already get their own sound, so this avoids doubling up.
- **`assets/sfx/*.wav`** — 15 clips generated offline by `scripts/gen-sfx.js` (a standalone Node chiptune synth; not run at build time). Regenerate with `node scripts/gen-sfx.js`.
- **Native modules** — `expo-audio` + `expo-haptics` require a dev build (`npx expo run:ios`), not just a JS reload.

## Phase status

| Phase | Status |
|-------|--------|
| 1 — Scaffold | done |
| 2 — Game Engine (all 30 pieces, reducer, helpers) | done |
| 3 — Test Suite | done |
| 4 — Game Screen UI | done |
| 5 — Army Builder + point-buy upgrades | done |
| 6 — Check / Checkmate / Stalemate | deferred |
| 7 — Supabase Multiplayer | done (anonymous; Apple Sign In pending) |
| 7.1 — Concede / timeouts / win reasons | done |
| 7.2 — Retro title/loading screen | done |
| 7.3 — Global lobby chat | done |
| 7.4 — Chiptune SFX + haptics | done |
| 7.5 — Spectator mode (live games, viewer count) | done |
| 7.6 — Single-player vs AI (move-gen + negamax) | prototype |

### Test suite

402 tests across 42 suites — pure engine logic + data completeness checks, pure helpers from the screens/hooks layer (`colorTimes`, `winnerOf`), and the AI core (`generateTurns`, `chooseTurn`). No React rendering tests yet.

## Game reference

See `GAME_OVERVIEW.md` for the full game design: all 4 guilds, 24 piece abilities, starting configurations, edge cases, and known bugs.

## Environment

Requires `.env` at repo root with:
```
EXPO_PUBLIC_SUPABASE_URL=https://...supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```
See `.env.example` for template. NEVER commit `.env` (gitignored) or the secret key.
