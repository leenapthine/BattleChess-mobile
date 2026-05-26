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

React Native (Expo) app with TypeScript. Game state managed by a pure reducer.

### Folder structure

- `src/engine/` — pure TS game logic. Zero React imports. Pieces, reducer, helpers.
- `src/engine/pieces/` — one file per piece type, each exports `getValidMoves` (and optionally `getAbilityTargets`)
- `src/engine/helpers/` — shared move generation, capture logic, turn management
- `src/screens/` — each screen is a folder with Header/View/Hook split (see below)
- `src/components/` — shared UI components
- `src/hooks/` — shared hooks
- `src/navigation/` — navigation config
- `src/types/` — shared type definitions (core types in `game.ts`)
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
- The old SolidJS click dispatch chain is replaced by a reducer + thin action classifier

### Game reference

See `GAME_OVERVIEW.md` for the full game design: all 4 guilds, 24 piece abilities, starting configurations, edge cases, and known bugs from the original implementation (being fixed during the engine port).

### Known bugs being fixed

These bugs from the original SolidJS codebase are being corrected during the engine port:
- White stunned pieces never un-stun (`for...in` bug)
- WizardTower and WizardKing standard capture don't end turn
- Prowler second-move passes wrong piece to capture handler
- DeadLauncher shows all squares at distance 3 instead of only enemy-occupied
- GhoulKing raise consumes turn instead of being free
- Necromancer resurrection doesn't end turn
- handleCapture receives null capturingPiece in some paths
