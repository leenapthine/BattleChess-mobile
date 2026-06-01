import type { GameState, Square, Piece } from '@/types/game';
import { getPieceAt, squaresEqual, updatePiece, generateId } from '@/engine/utils';
import { getPieceModule } from '@/engine/pieces/index';
import { handleCapture, checkWinCondition, checkQoBRevival } from './captureHandler';
import { switchTurn } from './turnManager';
import { performSacrifice } from '@/engine/pieces/NecroPawn';
import { getAbilityTargets as getGhoulKingTargets } from '@/engine/pieces/GhoulKing';
import { toggleStone } from '@/engine/pieces/Familiar';
import { getLoadTargets as getDLLoadTargets, getLaunchTargets } from '@/engine/pieces/DeadLauncher';
import { getAbilityTargets as getBeholderTargets } from '@/engine/pieces/Beholder';
import { getAbilityTargets as getBoulderTargets } from '@/engine/pieces/BoulderThrower';
import { getLoadTargets as getPortalLoadTargets, getEjectTargets, performLoad, performEject } from '@/engine/pieces/Portal';
import { performSecondMove } from '@/engine/pieces/Prowler';
import { performRaise } from '@/engine/pieces/GhoulKing';
import { performSwap } from '@/engine/pieces/QueenOfIllusions';
import { applyDomination } from '@/engine/pieces/QueenOfDomination';
import { performRevival } from '@/engine/pieces/QueenOfBones';

export function handleSelfClickAbility(state: GameState, square: Square): GameState {
  const piece = getPieceAt(square, state.pieces);
  if (!piece || piece.color !== state.currentTurn) return state;

  switch (piece.type) {
    case 'NecroPawn': {
      const mod = getPieceModule('NecroPawn')!;
      const targets = mod.getAbilityTargets!(piece, state.pieces);
      return {
        ...state,
        highlights: targets,
        abilityMode: { type: 'sacrifice', pieceId: piece.id, armed: true },
      };
    }
    case 'GhoulKing': {
      const targets = getGhoulKingTargets(piece, state.pieces);
      if (targets.length === 0) return state;
      return { ...state, highlights: targets };
    }
    case 'Familiar':
      return checkWinCondition(toggleStone(piece, state));
    case 'DeadLauncher': {
      if (!piece.pawnLoaded) {
        return {
          ...state,
          highlights: getDLLoadTargets(piece, state.pieces),
          abilityMode: { type: 'loading', pieceId: piece.id },
        };
      }
      return {
        ...state,
        highlights: getLaunchTargets(piece, state.pieces),
        abilityMode: { type: 'launch', pieceId: piece.id },
      };
    }
    case 'Beholder':
      return {
        ...state,
        highlights: getBeholderTargets(piece, state.pieces),
        abilityMode: { type: 'boulder', pieceId: piece.id },
      };
    case 'BoulderThrower':
      return {
        ...state,
        highlights: getBoulderTargets(piece, state.pieces),
        abilityMode: { type: 'boulder', pieceId: piece.id },
      };
    case 'Portal': {
      if (!piece.pieceLoaded) {
        return {
          ...state,
          highlights: getPortalLoadTargets(piece, state.pieces),
          abilityMode: { type: 'loading', pieceId: piece.id },
        };
      }
      return {
        ...state,
        highlights: getEjectTargets(piece, state.pieces),
        abilityMode: { type: 'launch', pieceId: piece.id },
      };
    }
    case 'WizardKing': {
      const wkMod = getPieceModule('WizardKing')!;
      return {
        ...state,
        highlights: wkMod.getAbilityTargets!(piece, state.pieces),
        abilityMode: { type: 'boulder', pieceId: piece.id },
      };
    }
    default:
      return state;
  }
}

export function handleSacrificeAbility(state: GameState, square: Square): GameState {
  if (state.abilityMode.type !== 'sacrifice') return state;
  const { pieceId } = state.abilityMode;
  const piece = state.pieces.find(p => p.id === pieceId);
  if (!piece) return state;

  if (squaresEqual(square, { row: piece.row, col: piece.col })) {
    const sacrificeResult = performSacrifice(piece, state);
    const killed = state.pieces.filter(p => !sacrificeResult.pieces.find(sp => sp.id === p.id));
    const detonateEffect = {
      type: 'detonate' as const,
      from: { row: piece.row, col: piece.col },
      affected: killed.map(p => ({ row: p.row, col: p.col })),
    };
    const deadQoB = killed.find(p => p.type === 'QueenOfBones');
    if (deadQoB) {
      const revivalState = { ...sacrificeResult, currentTurn: state.currentTurn, lastEffect: detonateEffect };
      const revival = checkQoBRevival(deadQoB, revivalState, null);
      if (revival) return revival;
    }
    return checkWinCondition({ ...sacrificeResult, lastEffect: detonateEffect });
  }

  return { ...state, selectedSquare: null, highlights: [], abilityMode: { type: 'none' } };
}

export function handleResurrectionAbility(state: GameState, square: Square): GameState {
  if (state.abilityMode.type !== 'resurrection') return state;
  const { color, targets } = state.abilityMode;

  const isValid = targets.some(t => squaresEqual(t, square));
  if (!isValid) return { ...state, abilityMode: { type: 'none' }, highlights: [] };

  const newPawn: Piece = {
    id: generateId(),
    type: 'Pawn',
    color,
    row: square.row,
    col: square.col,
    hasMoved: false,
    stunned: false,
    isStone: false,
    pawnLoaded: false,
    pieceLoaded: null,
    raisesLeft: 0,
    gainedAbilities: { knight: false, rook: false, queen: false, pawn: false },
  };

  return checkWinCondition(switchTurn({
    ...state,
    pieces: [...state.pieces, newPawn],
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
  }));
}

export function handleLoadingAbility(state: GameState, square: Square): GameState {
  if (state.abilityMode.type !== 'loading') return state;
  const { pieceId } = state.abilityMode;
  const loader = state.pieces.find(p => p.id === pieceId);
  if (!loader) return state;

  const isValidTarget = state.highlights.some(
    h => h.row === square.row && h.col === square.col,
  );
  if (!isValidTarget) {
    return { ...state, selectedSquare: null, highlights: [], abilityMode: { type: 'none' } };
  }

  const target = getPieceAt(square, state.pieces);
  if (!target || target.color !== loader.color) {
    return { ...state, selectedSquare: null, highlights: [], abilityMode: { type: 'none' } };
  }

  if (loader.type === 'DeadLauncher') {
    const updated = updatePiece(state.pieces, loader.id, { pawnLoaded: true });
    const removed = updated.filter(p => p.id !== target.id);
    return checkWinCondition(switchTurn({
      ...state, pieces: removed, selectedSquare: null, highlights: [], abilityMode: { type: 'none' },
    }));
  }

  if (loader.type === 'Portal') {
    return checkWinCondition(performLoad(loader, target.id, state));
  }

  return state;
}

export function handleLaunchAbility(state: GameState, square: Square): GameState {
  if (state.abilityMode.type !== 'launch') return state;
  const { pieceId } = state.abilityMode;
  const launcher = state.pieces.find(p => p.id === pieceId);
  if (!launcher) return state;

  if (launcher.type === 'DeadLauncher') {
    const highlight = state.highlights.find(h => h.row === square.row && h.col === square.col);
    if (!highlight) {
      return { ...state, selectedSquare: null, highlights: [], abilityMode: { type: 'none' } };
    }
    if (highlight.color === 'range') return state;

    const target = getPieceAt(square, state.pieces);
    if (!target || target.color === launcher.color || target.isStone) return state;

    const result = handleCapture(target, launcher, state);
    const updated = updatePiece(result.state.pieces, launcher.id, { pawnLoaded: false });
    const afterLaunch = {
      ...result.state, pieces: updated, selectedSquare: null, highlights: [], abilityMode: { type: 'none' } as const,
    };
    const revival = checkQoBRevival(target, afterLaunch, null);
    if (revival) return revival;
    return checkWinCondition(switchTurn(afterLaunch));
  }

  if (launcher.type === 'Portal') {
    return performEject(launcher, square, state);
  }

  return state;
}

export function handleBoulderAbility(state: GameState, square: Square): GameState {
  if (state.abilityMode.type !== 'boulder') return state;
  const { pieceId } = state.abilityMode;
  const thrower = state.pieces.find(p => p.id === pieceId);
  if (!thrower) return state;

  const highlight = state.highlights.find(h => h.row === square.row && h.col === square.col);
  if (!highlight) {
    return { ...state, selectedSquare: null, highlights: [], abilityMode: { type: 'none' } };
  }
  if (highlight.color === 'range') return state;

  const target = getPieceAt(square, state.pieces);
  if (!target || target.isStone || target.color === thrower.color) return state;

  const result = handleCapture(target, thrower, state);
  // Different visual per ranged attacker. BoulderThrower lobs a boulder
  // arc, Beholder fires an eye beam, WizardKing shoots a vertical beam.
  const effectType =
    thrower.type === 'Beholder' ? 'beam' as const
    : thrower.type === 'WizardKing' ? 'kingShot' as const
    : 'boulder' as const;
  const rangedEffect = {
    type: effectType,
    from: { row: thrower.row, col: thrower.col },
    to: { row: target.row, col: target.col },
  };
  const afterBoulder = {
    ...result.state,
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' } as const,
    lastEffect: rangedEffect,
  };
  const revival = checkQoBRevival(target, afterBoulder, null);
  if (revival) return revival;
  return checkWinCondition(switchTurn(afterBoulder));
}

export function handleSecondMoveAbility(state: GameState, square: Square): GameState {
  if (state.abilityMode.type !== 'secondMove') return state;
  const { pieceId } = state.abilityMode;
  const prowler = state.pieces.find(p => p.id === pieceId);
  if (!prowler) return state;

  const highlight = state.highlights.find(h => h.row === square.row && h.col === square.col);
  if (!highlight) {
    return state;
  }

  return checkWinCondition(performSecondMove(prowler, square, state));
}

// Handles clicks on ability-colored highlights when no ability mode
// is active. Routes to piece-specific ability functions (raise, swap,
// dominate) or falls back to self-click activation.
export function handleAbilityTargetClick(state: GameState, square: Square): GameState {
  const { selectedSquare } = state;
  if (!selectedSquare) return state;

  const selected = getPieceAt(selectedSquare, state.pieces);
  if (!selected || selected.color !== state.currentTurn) return state;

  if (squaresEqual(square, selectedSquare)) {
    return handleSelfClickAbility(state, square);
  }

  const target = getPieceAt(square, state.pieces);

  switch (selected.type) {
    case 'GhoulKing':
      if (!target && selected.raisesLeft > 0) {
        return performRaise(selected, square, state);
      }
      return state;
    case 'QueenOfIllusions':
      if (target && target.color === selected.color) {
        return checkWinCondition(performSwap(selected, target.id, state));
      }
      return state;
    case 'QueenOfDomination':
      if (target && target.color === selected.color && target.id !== selected.id) {
        return applyDomination(selected, target.id, state);
      }
      return state;
    default:
      return handleSelfClickAbility(state, square);
  }
}

// QoB revival: player picks 2 friendly pawns to sacrifice, then QoB
// respawns at home square. If a Prowler capture triggered the revival,
// the Prowler gets its second move after revival completes.
export function handleSacrificeSelection(state: GameState, square: Square): GameState {
  if (state.abilityMode.type !== 'sacrificeSelection') return state;
  const { queenColor, sacrificeIds, pendingSecondMove } = state.abilityMode;

  const isHighlighted = state.highlights.some(
    h => h.row === square.row && h.col === square.col,
  );
  if (!isHighlighted) return state;

  const target = getPieceAt(square, state.pieces);
  if (!target || target.color !== queenColor) return state;

  const newIds = [...sacrificeIds, target.id];

  // First pick — update highlights to exclude the chosen pawn
  if (newIds.length < 2) {
    const remaining = state.highlights.filter(
      h => !(h.row === square.row && h.col === square.col),
    );
    return {
      ...state,
      highlights: remaining,
      abilityMode: { ...state.abilityMode, sacrificeIds: newIds },
    };
  }

  // Second pick — perform revival
  let result = performRevival([newIds[0], newIds[1]], queenColor, state);

  // Resume Prowler second move if it was interrupted by revival
  if (pendingSecondMove) {
    const prowler = result.pieces.find(p => p.id === pendingSecondMove);
    if (prowler) {
      const secondMoves = getPieceModule('Prowler')!.getValidMoves(prowler, result.pieces);
      return {
        ...result,
        selectedSquare: { row: prowler.row, col: prowler.col },
        highlights: secondMoves,
        abilityMode: { type: 'secondMove', pieceId: pendingSecondMove },
      };
    }
  }

  return checkWinCondition(switchTurn(result));
}
