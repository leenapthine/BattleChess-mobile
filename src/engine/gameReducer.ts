import type { GameState, GameAction, Square, Highlight } from '@/types/game';
import { getPieceAt, updatePiece, forwardDirection, removePiece, squaresEqual } from '@/engine/utils';
import { getPieceModule } from '@/engine/pieces/index';
import { handleCapture, checkWinCondition, checkQoBRevival } from '@/engine/helpers/captureHandler';
import { switchTurn, applyPostMoveEffects } from '@/engine/helpers/turnManager';
import { applyHopCapture } from '@/engine/pieces/PawnHopper';
import { getResurrectionTargets } from '@/engine/pieces/Necromancer';
import { revertDomination, applyDomination } from '@/engine/pieces/QueenOfDomination';
import { performRevival } from '@/engine/pieces/QueenOfBones';
import { performSwap } from '@/engine/pieces/QueenOfIllusions';
import { performRangedCapture } from '@/engine/pieces/WizardTower';
import { performConvert } from '@/engine/pieces/HellKing';
import { performCapture as performProwlerCapture } from '@/engine/pieces/Prowler';
import { performCapture as performHowlerCapture } from '@/engine/pieces/Howler';
import { performCapture as performHellPawnCapture } from '@/engine/pieces/HellPawn';
import { performRaise } from '@/engine/pieces/GhoulKing';
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

  const selfClickTypes = [
    'NecroPawn', 'GhoulKing', 'DeadLauncher',
    'Beholder', 'BoulderThrower', 'Familiar', 'Portal',
  ];
  if (isOwn && mod.getAbilityTargets && !selfClickTypes.includes(piece.type)) {
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
    switch (piece.type) {
      case 'WizardTower': {
        const wtResult = performRangedCapture(piece, to, current);
        return maybeQoBRevival(target, wtResult, null);
      }
      case 'HellKing':
        return checkWinCondition(performConvert(piece, to, current));
      case 'Prowler': {
        const prowlerResult = performProwlerCapture(piece, to, current);
        const pendingSecond = prowlerResult.abilityMode.type === 'secondMove' ? piece.id : null;
        return maybeQoBRevival(target, prowlerResult, pendingSecond);
      }
      case 'Howler': {
        const howlerResult = performHowlerCapture(piece, to, current);
        return maybeQoBRevival(target, howlerResult, null);
      }
      case 'HellPawn': {
        const hpResult = performHellPawnCapture(piece, to, current);
        return maybeQoBRevival(target, hpResult, null);
      }
      case 'YoungWiz': {
        const dir = forwardDirection(piece.color);
        if (to.row === piece.row + dir && to.col === piece.col) {
          const zapResult = {
            ...current,
            pieces: removePiece(current.pieces, target.id),
            selectedSquare: null,
            highlights: [],
            abilityMode: { type: 'none' } as const,
          };
          const revival = checkQoBRevival(target, zapResult, null);
          if (revival) return revival;
          return checkWinCondition(switchTurn(zapResult));
        }
        break;
      }
      default:
        break;
    }

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
      const movedPieces = updatePiece(current.pieces, piece.id, { row: to.row, col: to.col, hasMoved: true });
      const revivalState = checkQoBRevival(target, { ...current, pieces: movedPieces }, null);
      if (revivalState) return revivalState;
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
    case 'sacrificeSelection': return handleSacrificeSelection(state, square);
    case 'none': return handleAbilityTargetClick(state, square);
    default: return state;
  }
}

function handleAbilityTargetClick(state: GameState, square: Square): GameState {
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

function maybeQoBRevival(captured: { type: string; color: string }, result: GameState, pendingSecondMove: string | null): GameState {
  const preSwitch = {
    ...result,
    currentTurn: result.currentTurn === 'White' ? 'Black' as const : 'White' as const,
  };
  const revival = checkQoBRevival(captured, preSwitch, pendingSecondMove);
  if (revival) return revival;
  return checkWinCondition(result);
}

function handleSacrificeSelection(state: GameState, square: Square): GameState {
  if (state.abilityMode.type !== 'sacrificeSelection') return state;
  const { queenColor, sacrificeIds, pendingSecondMove } = state.abilityMode;

  const isHighlighted = state.highlights.some(
    h => h.row === square.row && h.col === square.col,
  );
  if (!isHighlighted) return state;

  const target = getPieceAt(square, state.pieces);
  if (!target || target.color !== queenColor) return state;

  const newIds = [...sacrificeIds, target.id];

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

  let result = performRevival([newIds[0], newIds[1]], queenColor, state);

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
