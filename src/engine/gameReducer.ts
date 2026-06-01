import type { GameState, GameAction, Square, Highlight } from '@/types/game';
import { getPieceAt, updatePiece } from '@/engine/utils';
import { getPieceModule } from '@/engine/pieces/index';
import { handleCapture, checkWinCondition, checkQoBRevival } from '@/engine/helpers/captureHandler';
import { switchTurn, applyPostMoveEffects } from '@/engine/helpers/turnManager';
import { dispatchPieceCapture } from '@/engine/helpers/captureDispatch';
import { applyHopCapture } from '@/engine/pieces/PawnHopper';
import { getResurrectionTargets } from '@/engine/pieces/Necromancer';
import { revertDomination } from '@/engine/pieces/QueenOfDomination';
import {
  handleSelfClickAbility,
  handleSacrificeAbility,
  handleResurrectionAbility,
  handleLoadingAbility,
  handleLaunchAbility,
  handleBoulderAbility,
  handleSecondMoveAbility,
  handleAbilityTargetClick,
  handleSacrificeSelection,
} from '@/engine/helpers/abilityHandlers';
import { createInitialState } from '@/engine/initialBoard';
import { hasSelfClickAbility } from '@/engine/pieceTraits';

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === 'RESET_GAME' && state.armyConfigs) {
    return createInitialState(state.armyConfigs.p1, state.armyConfigs.p2);
  }
  if (state.status.type === 'won') return state;

  // Reset any previously emitted visual effect so it doesn't re-fire on
  // subsequent actions. Handlers that emit effects override lastEffect
  // in their returned state.
  state = { ...state, lastEffect: null };

  const prevPieces = state.pieces;
  let next: GameState;

  switch (action.type) {
    case 'SELECT_SQUARE':
      next = handleSelect(state, action.square);
      break;
    case 'MOVE_PIECE':
      next = handleMove(state, action.from, action.to);
      break;
    case 'ABILITY_ACTION':
      next = handleAbility(state, action.square);
      break;
    case 'END_TURN':
      next = checkWinCondition(switchTurn(state));
      break;
    case 'DESELECT':
      next = { ...state, selectedSquare: null, highlights: [], abilityMode: { type: 'none' } };
      break;
    case 'RESIGN':
      next = {
        ...state,
        status: {
          type: 'won',
          winner: action.resigningColor === 'White' ? 'Black' : 'White',
          reason: 'resign',
        },
        selectedSquare: null,
        highlights: [],
        abilityMode: { type: 'none' },
      };
      break;
    default:
      return state;
  }

  next = trackCaptures(prevPieces, next);
  return next;
}

// --- Selection ---

function handleSelect(state: GameState, square: Square): GameState {
  const piece = getPieceAt(square, state.pieces);
  if (!piece) return state;

  const isOwn = piece.color === state.currentTurn;
  if (piece.stunned && isOwn) return state;

  const mod = getPieceModule(piece.type);
  if (!mod) return state;

  // Stone pieces can be selected (to un-stone) but can't move
  const highlights: Highlight[] = [];
  if (!piece.isStone) {
    const moves = mod.getValidMoves(piece, state.pieces);
    highlights.push(...(isOwn
      ? moves
      : moves.map(h => ({ ...h, color: 'preview' as const }))));
  }

  // Self-click pieces hide ability targets until activated
  if (isOwn && mod.getAbilityTargets && !hasSelfClickAbility(piece.type)) {
    highlights.push(...mod.getAbilityTargets(piece, state.pieces));
  }

  return { ...state, selectedSquare: square, highlights, abilityMode: { type: 'none' } };
}

// --- Movement + Capture ---

function handleMove(state: GameState, from: Square, to: Square): GameState {
  const piece = getPieceAt(from, state.pieces);
  if (!piece || piece.color !== state.currentTurn || piece.stunned || piece.isStone) return state;

  const target = getPieceAt(to, state.pieces);
  let current = state;

  if (target && target.color !== piece.color) {
    // Try piece-specific capture (WizardTower, HellKing, Prowler, etc.)
    const special = dispatchPieceCapture(piece, target, to, current);
    if (special) return special;

    // Generic capture path
    const result = handleCapture(target, piece, current);
    if (!result.captured) return state; // stone immunity — block the move

    current = result.state;

    // Necromancer post-capture resurrection
    if (result.triggerResurrection) {
      const targets = getResurrectionTargets(to, current.pieces);
      if (targets.length > 0) {
        return {
          ...current,
          pieces: updatePiece(current.pieces, piece.id, { row: to.row, col: to.col, hasMoved: true }),
          selectedSquare: to,
          highlights: targets.map(sq => ({ ...sq, color: 'ability' as const })),
          abilityMode: { type: 'resurrection', color: piece.color, targets },
        };
      }
    }

    // QoB revival (direct capture or QoD detonation collateral)
    if (result.triggerRevival) {
      const movedPieces = updatePiece(current.pieces, piece.id, { row: to.row, col: to.col, hasMoved: true });
      const deadQoB = target.type === 'QueenOfBones'
        ? target
        : state.pieces.find(p => p.type === 'QueenOfBones' && !movedPieces.find(mp => mp.id === p.id));
      if (deadQoB) {
        const revivalState = checkQoBRevival(deadQoB, { ...current, pieces: movedPieces }, null);
        if (revivalState) return revivalState;
      }
    }
  }

  // Apply the move
  current = {
    ...current,
    pieces: updatePiece(current.pieces, piece.id, { row: to.row, col: to.col, hasMoved: true }),
  };

  // PawnHopper hop-capture (removes enemy in between a 2-step)
  if (piece.type === 'PawnHopper') {
    const { pieces: afterHop } = applyHopCapture(from, to, current.pieces, piece.color);
    current = { ...current, pieces: afterHop };
  }

  // Revert QueenOfDomination temporary queen transformation
  const dominatingQueen = current.pieces.find(
    p => p.type === 'QueenOfDomination' && p.pieceLoaded?.id === piece.id,
  );
  if (dominatingQueen) {
    const movedPiece = current.pieces.find(p => p.id === piece.id)!;
    current = revertDomination(dominatingQueen, movedPiece, current);
  }

  // GhostKnight stun aura
  const movedPiece = current.pieces.find(p => p.id === piece.id);
  if (movedPiece) {
    current = applyPostMoveEffects(movedPiece, current);
  }

  return checkWinCondition(switchTurn(current));
}

// --- Ability Dispatch ---

function handleAbility(state: GameState, square: Square): GameState {
  switch (state.abilityMode.type) {
    case 'sacrifice': return handleSacrificeAbility(state, square);
    case 'resurrection': return handleResurrectionAbility(state, square);
    case 'loading': return handleLoadingAbility(state, square);
    case 'launch': return handleLaunchAbility(state, square);
    case 'boulder': return handleBoulderAbility(state, square);
    case 'domination': return handleMove(state, state.selectedSquare!, square);
    case 'secondMove': return handleSecondMoveAbility(state, square);
    case 'sacrificeSelection': return handleSacrificeSelection(state, square);
    case 'none': return handleAbilityTargetClick(state, square);
    default: return state;
  }
}

// --- Graveyard Tracking ---
// Diffs pieces arrays to detect removals. Excludes pieces stored
// inside Portals (they're transported, not captured). Adds Portal-
// loaded pieces to graveyard only when the last friendly Portal dies.

function trackCaptures(prevPieces: GameState['pieces'], next: GameState): GameState {
  if (next.pieces === prevPieces) return next;

  const nextIds = new Set(next.pieces.map(p => p.id));
  const loadedIds = new Set(
    next.pieces.filter(p => p.pieceLoaded).map(p => p.pieceLoaded!.id),
  );
  const newCaptures = prevPieces.filter(
    p => !nextIds.has(p.id) && !loadedIds.has(p.id),
  );

  // Check for pieces lost inside destroyed Portals
  const lostPortals = prevPieces.filter(
    p => p.type === 'Portal' && p.pieceLoaded && !nextIds.has(p.id),
  );
  for (const portal of lostPortals) {
    const otherPortal = next.pieces.find(
      np => np.type === 'Portal' && np.color === portal.color && np.pieceLoaded,
    );
    if (!otherPortal) {
      newCaptures.push(portal.pieceLoaded!);
    }
  }

  if (newCaptures.length > 0) {
    return { ...next, capturedPieces: [...next.capturedPieces, ...newCaptures] };
  }

  return next;
}
