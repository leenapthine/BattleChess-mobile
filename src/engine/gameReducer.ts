import type { GameState, GameAction, Square, Highlight } from '@/types/game';
import { getPieceAt, updatePiece } from '@/engine/utils';
import { getPieceModule } from '@/engine/pieces/index';
import { handleCapture, checkWinCondition } from '@/engine/helpers/captureHandler';
import { switchTurn, applyPostMoveEffects } from '@/engine/helpers/turnManager';
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
} from '@/engine/helpers/abilityHandlers';
import { createInitialState } from '@/engine/initialBoard';

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === 'RESET_GAME') return createInitialState();
  if (state.status.type === 'won') return state;

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
    default:
      return state;
  }

  if (next.pieces !== prevPieces) {
    const nextIds = new Set(next.pieces.map(p => p.id));
    const newCaptures = prevPieces.filter(p => !nextIds.has(p.id));
    if (newCaptures.length > 0) {
      next = { ...next, capturedPieces: [...next.capturedPieces, ...newCaptures] };
    }
  }

  return next;
}

function handleSelect(state: GameState, square: Square): GameState {
  const piece = getPieceAt(square, state.pieces);
  if (!piece) return state;

  const isOwn = piece.color === state.currentTurn;
  if (piece.stunned && isOwn) return state;

  const mod = getPieceModule(piece.type);
  if (!mod) return state;

  const moves = mod.getValidMoves(piece, state.pieces);
  const highlights: Highlight[] = isOwn
    ? moves
    : moves.map(h => ({ ...h, color: 'preview' as const }));

  if (isOwn && mod.getAbilityTargets) {
    highlights.push(...mod.getAbilityTargets(piece, state.pieces));
  }

  return { ...state, selectedSquare: square, highlights, abilityMode: { type: 'none' } };
}

function handleMove(state: GameState, from: Square, to: Square): GameState {
  const piece = getPieceAt(from, state.pieces);
  if (!piece || piece.color !== state.currentTurn || piece.stunned) return state;

  const target = getPieceAt(to, state.pieces);
  let current = state;

  if (target && target.color !== piece.color) {
    const result = handleCapture(target, piece, current);
    current = result.state;

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

    if (result.triggerRevival) {
      return {
        ...current,
        pieces: updatePiece(current.pieces, piece.id, { row: to.row, col: to.col, hasMoved: true }),
        abilityMode: { type: 'sacrificeSelection' },
      };
    }
  }

  current = {
    ...current,
    pieces: updatePiece(current.pieces, piece.id, { row: to.row, col: to.col, hasMoved: true }),
  };

  if (piece.type === 'PawnHopper') {
    const { pieces: afterHop } = applyHopCapture(from, to, current.pieces, piece.color);
    current = { ...current, pieces: afterHop };
  }

  const dominatingQueen = current.pieces.find(
    p => p.type === 'QueenOfDomination' && p.pieceLoaded?.id === piece.id,
  );
  if (dominatingQueen) {
    const movedPiece = current.pieces.find(p => p.id === piece.id)!;
    current = revertDomination(dominatingQueen, movedPiece, current);
  }

  const movedPiece = current.pieces.find(p => p.id === piece.id);
  if (movedPiece) {
    current = applyPostMoveEffects(movedPiece, current);
  }

  return checkWinCondition(switchTurn(current));
}

function handleAbility(state: GameState, square: Square): GameState {
  switch (state.abilityMode.type) {
    case 'sacrifice': return handleSacrificeAbility(state, square);
    case 'resurrection': return handleResurrectionAbility(state, square);
    case 'loading': return handleLoadingAbility(state, square);
    case 'launch': return handleLaunchAbility(state, square);
    case 'boulder': return handleBoulderAbility(state, square);
    case 'domination': return handleMove(state, state.selectedSquare!, square);
    case 'secondMove': return handleSecondMoveAbility(state, square);
    case 'sacrificeSelection': return state;
    case 'none': return handleSelfClickAbility(state, square);
    default: return state;
  }
}
