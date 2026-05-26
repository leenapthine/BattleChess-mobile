# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # start Expo dev server
npm run ios      # start on iOS simulator
npm run android  # start on Android emulator
npm run web      # start in browser
```

No test suite yet. TypeScript strict mode enabled.

## Architecture

Expo (React Native) app with TypeScript. Game state managed by a pure reducer.

### Folder structure

- `src/engine/` — pure TS game logic. Zero React imports.
- `src/engine/pieces/` — one file per piece type, each exports `getValidMoves` (and optionally `getAbilityTargets`)
- `src/engine/helpers/` — shared move generation helpers
- `src/engine/utils.ts` — board queries and immutable update helpers
- `src/engine/gameReducer.ts` — central reducer (skeleton, wired in Chunk G)
- `src/engine/initialBoard.ts` — default starting layout (Necro vs Demon)
- `src/screens/` — each screen is a folder with Header/View/Hook split
- `src/components/` — shared UI components
- `src/hooks/` — shared hooks
- `src/navigation/` — navigation config
- `src/types/game.ts` — core types: `Piece`, `GameState`, `GameAction`, `AbilityMode`
- `src/utils/` — shared utility functions
- `src/constants/` — app-wide constants

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

### Engine progress

- Basic pieces: done (Pawn, Knight, Bishop, Rook, Queen, King)
- Necro guild: done (NecroPawn, GhostKnight, Necromancer, DeadLauncher, GhoulKing, QueenOfBones)
- Demon guild: not started
- Beast guild: not started
- Wizard guild: not started
- Reducer integration: not started

### Game reference

See `GAME_OVERVIEW.md` for the full game design: all 4 guilds, 24 piece abilities, starting configurations, edge cases, and known bugs.
