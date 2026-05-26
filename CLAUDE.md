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
npm test         # run Jest test suite (164 tests)
```

## Architecture

Expo (React Native) app with TypeScript. Game state managed by a pure reducer.

### Folder structure

- `src/engine/` — pure TS game logic. Zero React imports.
- `src/engine/pieces/` — one file per piece type, each exports `getValidMoves` (and optionally `getAbilityTargets`)
- `src/engine/helpers/` — shared move generation helpers
- `src/engine/utils.ts` — board queries and immutable update helpers
- `src/engine/gameReducer.ts` — central reducer handling all actions + captured piece tracking
- `src/engine/initialBoard.ts` — default starting layout (Necro vs Demon)
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

- **Highlights:** empty move squares show a centered dot; captures/abilities show a colored ring border
- **Highlight colors:** `move` (yellow dot), `capture` (red ring), `ability` (cyan ring), `preview` (grey ring for opponent pieces)
- **Header:** shows current turn and ability-mode instructions (e.g. "Select a target to sacrifice")
- **Win overlay:** dark overlay with winner text and "New Game" button dispatching `RESET_GAME`
- **Captured pieces:** small sprite rows above/below the board per color; tracked via `capturedPieces` on `GameState` (diffed automatically in the reducer)

### Engine progress

All 30 piece types ported. Reducer fully wired. Test suite passing (164 tests). Phases 2–4 complete.

- Basic pieces: done
- Necro guild: done
- Demon guild: done
- Beast guild: done
- Wizard guild: done
- Reducer integration: done
- Action classifier: done
- Capture handler (stone, QoD detonation, QoB revival): done
- Turn manager (stun clearing fixed): done
- King-capture win condition: done
- Game screen UI (board, highlights, header, win overlay, graveyard): done
- Test suite (8 suites, 164 tests): done

### Game reference

See `GAME_OVERVIEW.md` for the full game design: all 4 guilds, 24 piece abilities, starting configurations, edge cases, and known bugs.
