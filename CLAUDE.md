# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                              # start Expo dev server
npm run ios                            # build + install on iOS simulator
npx expo run:ios --device <UDID>       # build + install on physical device
npm run web                            # start in browser
npm test                               # run Jest test suite (388 tests)
```

TypeScript strict mode enabled. Uses Expo SDK 54 (compatible with Xcode 16.4).

## Stack

- **Expo SDK 54 / React Native** — iOS + Android + Web from one codebase
- **TypeScript** strict mode
- **Zustand** — app-wide state (auth, screen, lobby, games)
- **useReducer** — game engine state (kept local because the reducer is pure)
- **Supabase** — Postgres + Realtime for multiplayer (anonymous auth for now)
- **Space Mono** — monospace font via `@expo-google-fonts/space-mono`

Bundle ID: `com.leenapthine.battlechess`

## Architecture

Three architectural layers:

1. **Engine** (`src/engine/`) — pure TypeScript, zero React, zero side effects. The game reducer and all piece modules.
2. **Lib** (`src/lib/`) — pure API functions for external services (Supabase). Zero React.
3. **Stores** (`src/stores/`) — Zustand stores that wrap lib calls with state. Components subscribe via hooks. NEVER consume Zustand inside library files or piece modules.

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
├── lib/                   — pure API (no React)
│   ├── supabase.ts        — client setup with AsyncStorage persistence
│   ├── auth.ts            — sign in, get/create profile
│   ├── games.ts           — create, join, submit army, write state,
│   │                        subscribe to lobby/game, restore active
│   └── chat.ts            — lobby chat: fetch / send / subscribe
├── stores/                — Zustand (no React imports beyond create)
│   ├── authStore.ts       — auth status, profile, sign in/out
│   ├── screenStore.ts     — navigation state machine
│   ├── gamesStore.ts      — open games list, current game, subscriptions
│   └── chatStore.ts       — chat history, unread counter, subscription
├── screens/               — each screen is Header/View/Hook split
│   ├── Title/             — retro 1980s boot screen with random sprite
│   ├── SignIn/            — anonymous sign-in
│   ├── NamePrompt/        — display name on first sign-in
│   ├── Lobby/             — chat panel + new game buttons + open games list
│   ├── PointCap/          — set point budget
│   ├── WaitingRoom/       — host waits for guest to join
│   ├── ArmyBuilder/       — local pass-and-play army selection
│   ├── Handoff/           — "pass the device" interstitial (local mode)
│   ├── OnlineArmyBuilder/ — online army selection (writes to DB)
│   ├── Game/              — local game screen
│   └── OnlineGame/        — synced online game screen
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

### Engine design

All game logic is pure TypeScript — no React, no signals, no mutation.
- Piece modules: `getValidMoves(piece, pieces) → Highlight[]`
- State transitions: `gameReducer(state, action) → GameState`
- Multi-step abilities tracked by `AbilityMode` discriminated union
- Piece-specific capture dispatch in `captureDispatch.ts` (WizardTower stays put, HellKing converts, Prowler second move, etc.)

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
- **Per-player clocks** — `host_time_ms` / `guest_time_ms` columns hold each player's time bank; active player's clock ticks down, hitting 0 = timeout loss
- **Win reasons** — `game_state.status` carries `reason: 'kingCapture' | 'resign' | 'timeout'` so the overlay can show the right banner
- **Lobby chat** — `chat_messages` table backs a global terminal-style chat panel on the lobby screen; server-side trigger enforces 1 message / 2 sec rate limit

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

### Test suite

388 tests across 38 suites — pure engine logic + data completeness checks, no React rendering tests yet.

## Game reference

See `GAME_OVERVIEW.md` for the full game design: all 4 guilds, 24 piece abilities, starting configurations, edge cases, and known bugs.

## Environment

Requires `.env` at repo root with:
```
EXPO_PUBLIC_SUPABASE_URL=https://...supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```
See `.env.example` for template. NEVER commit `.env` (gitignored) or the secret key.
