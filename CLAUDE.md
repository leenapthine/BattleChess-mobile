# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # start Expo dev server
npm run ios      # start on iOS simulator
npm run android  # start on Android emulator
npm run web      # start in browser
```

TypeScript strict mode enabled.

```bash
npm test         # run Jest test suite (293 tests)
```

## Architecture

Expo (React Native) app with TypeScript. Game state managed by a pure reducer.

### Folder structure

- `src/engine/` — pure TS game logic. Zero React imports.
- `src/engine/pieces/` — one file per piece type, each exports `getValidMoves` (and optionally `getAbilityTargets`)
- `src/engine/helpers/` — shared move generation helpers
- `src/engine/utils.ts` — board queries and immutable update helpers
- `src/engine/gameReducer.ts` — central reducer handling all actions + captured piece tracking
- `src/engine/initialBoard.ts` — default starting layout (currently Beast vs Wizard)
- `src/screens/` — each screen is a folder with Header/View/Hook split
- `src/screens/Game/` — main game board (Header/View/Hook, fully wired)
- `src/screens/ArmyBuilder/` — guild/race selection (placeholder)
- `src/components/` — shared UI components
- `src/components/CapturedPieces.tsx` — graveyard display for captured pieces
- `src/hooks/` — shared hooks
- `src/navigation/` — navigation config
- `src/types/game.ts` — core types: `Piece`, `GameState`, `GameAction`, `AbilityMode`
- `src/utils/` — shared utility functions
- `src/constants/theme.ts` — board colors, highlight colors, app palette
- `src/constants/sprites.ts` — sprite map: `getSprite(color, type) → ImageSource`
- `assets/sprites/` — 60 PNGs: `{Color}{Type}.png`

### Screen file structure (Header / View / Hook)

Every screen folder contains:
- `useFeature.ts` — all logic, state, handlers. Zero JSX.
- `FeatureView.tsx` — pure presentational. Props only.
- `FeatureHeader.tsx` — presentational header. Props only.
- `index.tsx` — thin composition root wiring hook to views.

### File size

~150 lines soft cap per file. Extract helpers proactively.

### Engine design

All game logic is pure TypeScript — no React, no signals, no mutation.
- Piece modules: `getValidMoves(piece, pieces) → Highlight[]`
- State transitions: `gameReducer(state, action) → GameState`
- Multi-step abilities tracked by `AbilityMode` discriminated union

### Game Screen UI

The board is an 8×8 grid of React Native `Pressable` squares. White renders at the bottom.

- **Highlights:** all highlights are thick inner square borders rendered under sprites
- **Highlight colors:** green (selected piece), yellow (move), red (capture/death), blue (non-lethal ability), grey (range indicator for ranged abilities), grey lighter (opponent preview)
- **Selected piece with ability:** blue border when self-click ability available, green after activation
- **Self-click pieces:** NecroPawn, GhoulKing, DeadLauncher, Beholder, BoulderThrower, Familiar, Portal, WizardKing — ability targets hidden until activated
- **Header:** shows current turn, ability-mode instructions, and flash messages (e.g. "Familiar turned to stone!")
- **Win overlay:** dark overlay with winner text and "New Game" button dispatching `RESET_GAME`
- **Captured pieces:** fixed-height graveyard rows above/below the board; Portal-loaded pieces excluded until last Portal captured

### Engine progress

All 30 piece types ported. Reducer fully wired with piece-specific capture dispatch. All abilities manually tested on iOS simulator. Test suite: 293 tests across 31 suites. Phases 2–4 complete.

- Engine (all pieces, reducer, helpers): done
- Game screen UI (board, highlights, header, win overlay, graveyard): done
- Piece-specific capture dispatch (WizardTower, HellKing, Prowler, Howler, HellPawn, YoungWiz): done
- Self-click ability system (8 piece types): done
- WizardKing reworked as self-click ranged ability (boulder mode): done
- GhostKnight stun fixed (clears outgoing player, not incoming): done
- Prowler second move (highlights, capture allowed, no forfeit on misclick): done
- QoB revival from all kill paths (standard, ranged, AoE, detonation collateral): done
- Stone immunity across all capture/highlight paths: done
- Portal graveyard behavior (no graveyard on load, graveyard on last portal death): done
- Highlight system (green/yellow/red/blue/grey borders, range indicators): done
- Test suite (31 suites, 293 tests): done
- iOS simulator verification: done

### Game reference

See `GAME_OVERVIEW.md` for the full game design: all 4 guilds, 24 piece abilities, starting configurations, edge cases, and known bugs.
