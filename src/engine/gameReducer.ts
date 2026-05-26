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

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.status.type === 'won') return state;

  switch (action.type) {
    case 'SELECT_SQUARE':
      return handleSelect(state, action.square);
    case 'MOVE_PIECE':
      return handleMove(state, action.from, action.to);
    case 'ABILITY_ACTION':
      return handleAbility(state, action.square);
    case 'END_TURN':
      return checkWinCondition(switchTurn(state));
    case 'DESELECT':
      return { ...state, selectedSquare: null, highlights: [], abilityMode: { type: 'none' } };
    default:
      return state;
  }
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
